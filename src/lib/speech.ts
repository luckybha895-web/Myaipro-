/**
 * High-fidelity speech engine:
 * 1. Studio Generative Audio via Gemini 3.1 Flash TTS (Kore, Zephyr, Puck, Fenrir, Charon)
 * 2. Seamless 24kHz Web Audio API PCM decoder for studio quality
 * 3. Browser SpeechSynthesis fallback with natural voice selection
 */

export type StudioVoice = "Kore" | "Zephyr" | "Puck" | "Fenrir" | "Charon";

export const STUDIO_VOICES: Array<{
  id: StudioVoice;
  name: string;
  tone: string;
  gender: "Female" | "Male" | "Neutral";
}> = [
  { id: "Kore", name: "Kore", tone: "Warm, Expressive & Empathetic", gender: "Female" },
  { id: "Zephyr", name: "Zephyr", tone: "Crisp, Natural & Smooth", gender: "Neutral" },
  { id: "Puck", name: "Puck", tone: "Energetic, Dynamic & Friendly", gender: "Male" },
  { id: "Fenrir", name: "Fenrir", tone: "Deep, Authoritative & Resonant", gender: "Male" },
  { id: "Charon", name: "Charon", tone: "Calm, Reflective & Thoughtful", gender: "Male" },
];

let activeAudioContext: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;

export function getPreferredVoice(): StudioVoice {
  if (typeof window === "undefined") return "Kore";
  const saved = localStorage.getItem("creative_ai_preferred_voice");
  if (saved && STUDIO_VOICES.some((v) => v.id === saved)) {
    return saved as StudioVoice;
  }
  return "Kore";
}

export function setPreferredVoice(voice: StudioVoice) {
  if (typeof window !== "undefined") {
    localStorage.setItem("creative_ai_preferred_voice", voice);
  }
}

/** Decode base64 16-bit PCM (24kHz, mono) and play via Web Audio API */
export async function playPcmAudio(base64Data: string, sampleRate = 24000) {
  stopSpeaking();

  const binaryString = atob(base64Data);
  // Ensure even length for 16-bit PCM (2 bytes per sample)
  const len = binaryString.length - (binaryString.length % 2);
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const int16Array = new Int16Array(bytes.buffer, 0, len / 2);
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx({ sampleRate });
  activeAudioContext = audioCtx;

  if (audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
    } catch {
      /* ignore resume error */
    }
  }

  const buffer = audioCtx.createBuffer(1, int16Array.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768.0;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.onended = () => {
    if (activeSourceNode === source) {
      activeSourceNode = null;
    }
  };
  activeSourceNode = source;
  source.start(0);

  return { audioCtx, source };
}

/** Stop all active speech (both Studio Web Audio and Browser SpeechSynthesis) */
export function stopSpeaking() {
  try {
    if (activeSourceNode) {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
      activeSourceNode = null;
    }
    if (activeAudioContext && activeAudioContext.state !== "closed") {
      activeAudioContext.close();
      activeAudioContext = null;
    }
  } catch (e) {
    console.debug("Audio stop cleanup:", e);
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/** Speak with Studio AI Voice (fallback to browser speech if API fails) */
export async function speak(
  text: string,
  voice?: StudioVoice,
  onAudioStart?: () => void,
): Promise<void> {
  stopSpeaking();
  const selectedVoice = voice || getPreferredVoice();

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.slice(0, 1000),
        voice: selectedVoice,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audio) {
        onAudioStart?.();
        await playPcmAudio(data.audio, 24000);
        return;
      }
    }
  } catch (err) {
    console.warn("Studio TTS network error, using browser fallback:", err);
  }

  // Graceful Fallback: Browser Web Speech API with best available voice
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const clean = text.replace(/[*#_`~[\]()]/g, "").slice(0, 3000);
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 1.05;
    u.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Karen")),
    );
    if (naturalVoice) u.voice = naturalVoice;

    onAudioStart?.();
    window.speechSynthesis.speak(u);
  }
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function createRecognizer(
  onText: (text: string) => void,
  onEnd?: () => void,
): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as
    (new () => SpeechRecognitionLike) | undefined;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = false;
  rec.onresult = (e) => {
    let out = "";
    for (let i = 0; i < e.results.length; i++) out += e.results[i]?.[0]?.transcript ?? "";
    onText(out.trim());
  };
  rec.onend = () => onEnd?.();
  rec.onerror = () => onEnd?.();
  return rec;
}
