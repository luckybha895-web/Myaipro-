import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI, Modality } from "@google/genai";

function getGemini(apiKey: string) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function isAccessDenied(err: unknown): boolean {
  if (!err) return false;
  const str = String(err).toLowerCase();
  return (
    str.includes("403") ||
    str.includes("permission_denied") ||
    str.includes("denied access") ||
    str.includes("unauthenticated") ||
    str.includes("401") ||
    str.includes("api_key_invalid")
  );
}

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            text?: string;
            voice?: string;
            apiKey?: string;
          };

          const text = body.text?.trim();
          if (!text) {
            return Response.json({ error: "No text provided" }, { status: 400 });
          }

          const geminiKey = body.apiKey || process.env["GEMINI_API_KEY"];
          const validVoices = ["Kore", "Puck", "Zephyr", "Fenrir", "Charon"];
          const requestedVoice = body.voice || "Kore";
          const voiceName = validVoices.includes(requestedVoice) ? requestedVoice : "Kore";

          if (!geminiKey) {
            return Response.json({
              audio: null,
              fallback: true,
              voice: voiceName,
              message: "Using high-quality browser speech engine",
            });
          }

          // Truncate text if very long for TTS performance (max 1000 characters per call)
          const cleanText = text.replace(/[*#_`~[\]()]/g, "").slice(0, 1000);

          const ttsModels = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-3.8-flash",
            "gemini-3.6-flash",
          ];
          const ai = getGemini(geminiKey);

          for (const model of ttsModels) {
            try {
              const response = await ai.models.generateContent({
                model,
                contents: [{ parts: [{ text: cleanText }] }],
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName },
                    },
                  },
                },
              });

              const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              const mimeType =
                response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType ||
                "audio/pcm;rate=24000";

              if (base64Audio) {
                return Response.json({
                  audio: base64Audio,
                  mimeType,
                  voice: voiceName,
                  fallback: false,
                });
              }
            } catch (genErr) {
              if (isAccessDenied(genErr)) {
                break; // Stop attempting if project key has no access
              }
            }
          }

          return Response.json({
            audio: null,
            fallback: true,
            voice: voiceName,
            message: "Using high-quality browser speech engine",
          });
        } catch {
          return Response.json({
            audio: null,
            fallback: true,
            message: "TTS fallback active",
          });
        }
      },
    },
  },
});
