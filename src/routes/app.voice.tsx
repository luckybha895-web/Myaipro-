import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Menu,
  Edit3,
  Video,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Settings,
  Sparkles,
  Plus,
  Send,
  X,
  Loader2,
  Check,
  Bot,
  History,
  Trash2,
  Play,
  Copy,
  Download,
  Code2,
  ExternalLink,
  Square,
  ChevronDown,
  Layers,
  Search,
  ShoppingBag,
  Camera,
  Wand2,
  SlidersHorizontal,
  Image as ImageIcon,
  Calculator,
  FileText,
  Terminal,
  Smartphone,
  Presentation,
  FolderUp,
  FolderArchive,
  UploadCloud,
  Folder,
  Eye,
  Maximize2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAi } from "@/components/AiProvider";
import {
  STUDIO_VOICES,
  speak,
  stopSpeaking,
  createRecognizer,
  type StudioVoice,
} from "@/lib/speech";
import { askAI, type AiMessage } from "@/lib/ai";
import { useAuth } from "@/hooks/useAuth";
import { getMemoryPromptContext, recordConversationTurnToMemory } from "@/lib/user-memory";
import { toast } from "sonner";

export const Route = createFileRoute("/app/voice")({
  head: () => ({
    meta: [
      { title: "Voice Assistant — Creative AI" },
      {
        name: "description",
        content:
          "Intelligent real-time voice assistant with full chatbot conversational capabilities, speech synthesis, and visual intelligence.",
      },
      { property: "og:title", content: "Voice Assistant in Creative AI" },
      {
        property: "og:description",
        content: "Speak naturally to converse, research, write code, and get direct answers.",
      },
    ],
  }),
  component: VoiceAssistant,
});

type ConversationTurn = {
  id: string;
  timestamp: string;
  userText: string;
  assistantText: string;
  imageUrl?: string | null;
  folderSummary?: string | null;
  attachmentName?: string | null;
};

// Isolated Code Block with Dedicated Copy & Download for Voice Assistant
function VoiceCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const navigate = useNavigate();

  function handleCopy() {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenInCoder() {
    toast.success("Opening in AI Builder...");
    void navigate({
      to: "/app/build",
      search: { prompt: `Build app from code:\n${code.slice(0, 300)}` },
    });
  }

  function handleDownload() {
    const cleanLang = (language || "txt").toLowerCase();
    const ext =
      cleanLang === "python" || cleanLang === "py"
        ? "py"
        : cleanLang === "typescript" || cleanLang === "ts" || cleanLang === "tsx"
          ? "tsx"
          : cleanLang === "javascript" || cleanLang === "js" || cleanLang === "jsx"
            ? "jsx"
            : cleanLang === "html"
              ? "html"
              : cleanLang === "css"
                ? "css"
                : cleanLang === "sql"
                  ? "sql"
                  : cleanLang === "json"
                    ? "json"
                    : cleanLang === "rust" || cleanLang === "rs"
                      ? "rs"
                      : cleanLang === "cpp" || cleanLang === "c++"
                        ? "cpp"
                        : "txt";

    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice_code_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Code downloaded as .${ext}`);
  }

  const isHtmlOrWeb =
    language.toLowerCase().includes("html") ||
    language.toLowerCase().includes("js") ||
    language.toLowerCase().includes("react") ||
    code.includes("<!DOCTYPE html>") ||
    code.includes("<html>");

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-slate-700/70 bg-[#07090e] shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0e1017] px-3 py-1.5 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-sky-400">
          <Code2 className="size-3.5" />
          <span className="uppercase tracking-wider">{language || "CODE"}</span>
          <span className="rounded bg-sky-500/15 px-1.5 py-0.2 text-[9px] font-sans text-sky-400">
            Bolt.diy Coder
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isHtmlOrWeb && (
            <button
              onClick={() => setShowSandbox((prev) => !prev)}
              className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer"
            >
              <Play className="size-3" />
              <span>{showSandbox ? "Hide Sandbox" : "Run Live"}</span>
            </button>
          )}
          <button
            onClick={handleOpenInCoder}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-sky-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Open in AI Builder"
          >
            <ExternalLink className="size-3" />
            <span>AI Builder</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Download className="size-3" />
            <span>Download</span>
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>

      {showSandbox && (
        <div className="border-t border-slate-800 bg-white p-2">
          <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-slate-600">
            <span>LIVE INTERACTIVE SANDBOX PREVIEW</span>
            <button
              onClick={() => setShowSandbox(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
          <iframe
            title="Voice Code Sandbox"
            srcDoc={
              code.includes("<!DOCTYPE")
                ? code
                : `<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script></head><body class="p-4 bg-slate-50 text-slate-900 font-sans">${code}</body></html>`
            }
            sandbox="allow-scripts allow-modals"
            className="h-60 w-full rounded-lg border border-slate-200 bg-white"
          />
        </div>
      )}
    </div>
  );
}

// Markdown-aware formatted response content renderer
function FormattedMessageContent({ text }: { text: string }) {
  const parts = useMemo(() => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const plainText = text.substring(lastIndex, match.index);
        elements.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
            {plainText}
          </div>,
        );
      }

      const language = match[1] || "code";
      const code = match[2];
      elements.push(<VoiceCodeBlock key={`code-${match.index}`} language={language} code={code} />);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      elements.push(
        <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {text.substring(lastIndex)}
        </div>,
      );
    }

    return elements;
  }, [text]);

  return <div className="space-y-1.5 text-xs text-slate-200">{parts}</div>;
}

function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, "Here is the requested code snippet.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*#_~>]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/Live search results:?/gi, "")
    .trim();
}

function VoiceAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || user?.email || null;
  const [activeTab, setActiveTab] = useState<"ask" | "imagine" | "build">("ask");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [photoStudioOpen, setPhotoStudioOpen] = useState(false);
  const [browserOrderOpen, setBrowserOrderOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [deviceAppOpen, setDeviceAppOpen] = useState(false);
  const [activeDeviceApp, setActiveDeviceApp] = useState<
    "calculator" | "notes" | "terminal" | "launcher"
  >("calculator");
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [notesText, setNotesText] = useState(() => {
    try {
      return (
        localStorage.getItem("creative_ai_quick_notes") ||
        "• Project Roadmap\n• AI Model fine-tuning\n• Deploy to production"
      );
    } catch {
      return "";
    }
  });
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "Creative AI OS Kernel initialized.",
    "Ready for user device commands. Type 'help' or command.",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [orderItem, setOrderItem] = useState("Air Jordan Sneakers");
  const [orderStore, setOrderStore] = useState("Amazon Prime");
  const [statusText, setStatusText] = useState("Go ahead, I'm listening");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Attachment & Camera States
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedAttachmentName, setAttachedAttachmentName] = useState<string | null>(null);
  const [uploadedFolderSummary, setUploadedFolderSummary] = useState<string | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraModalStream, setCameraModalStream] = useState<MediaStream | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoModalRef = useRef<HTMLVideoElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognizerRef = useRef<ReturnType<typeof createRecognizer> | null>(null);

  const { preferredVoice, setPreferredVoice, selectedModel, handleAiError } = useAi();

  // Load conversation turns from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("creative_ai_voice_turns");
      if (saved) {
        setTurns(JSON.parse(saved));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Save conversation turns
  const saveTurns = (updated: ConversationTurn[]) => {
    setTurns(updated);
    try {
      localStorage.setItem("creative_ai_voice_turns", JSON.stringify(updated.slice(-30)));
    } catch {
      /* ignore */
    }
  };

  // Scroll to bottom of conversation
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isThinking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      recognizerRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cameraModalStream?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraModalStream]);

  // Handle Folder Upload
  function handleFolderUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileNames: string[] = [];
    let totalBytes = 0;
    for (let i = 0; i < files.length; i++) {
      fileNames.push(files[i].webkitRelativePath || files[i].name);
      totalBytes += files[i].size;
    }

    const sizeFormatted =
      totalBytes > 1024 * 1024
        ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(totalBytes / 1024)} KB`;

    const summary = `📁 Folder Uploaded: ${files.length} files (${sizeFormatted})\nFiles: ${fileNames.slice(0, 15).join(", ")}${files.length > 15 ? ` ...and ${files.length - 15} more` : ""}`;
    setUploadedFolderSummary(summary);
    setAttachedAttachmentName(`Folder (${files.length} items)`);
    toast.success(`Loaded folder with ${files.length} files into context!`);
  }

  // Handle Media / Image Upload
  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAttachedImage(dataUrl);
      toast.success(`Image attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  }

  // Open Live Camera Snap Modal
  async function openCameraSnapModal() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCameraModalStream(stream);
      setCameraModalOpen(true);
      setTimeout(() => {
        if (cameraVideoModalRef.current) {
          cameraVideoModalRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      toast.error("Camera access denied or unavailable.");
    }
  }

  function handleSnapCameraCapture() {
    if (!cameraVideoModalRef.current) return;
    try {
      const video = cameraVideoModalRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setAttachedImage(dataUrl);
        setAttachedAttachmentName("Live Camera Snapshot");
        toast.success("Photo captured and attached for AI!");
      }
    } catch {
      toast.error("Could not capture photo.");
    }
    cameraModalStream?.getTracks().forEach((t) => t.stop());
    setCameraModalStream(null);
    setCameraModalOpen(false);
  }

  function handleStop() {
    stopSpeaking();
    stopListening();
    setIsSpeaking(false);
    setIsListening(false);
    setIsThinking(false);
    setStatusText("Go ahead");
  }

  function handleSendPrompt(prompt: string) {
    if (!prompt.trim() && !attachedImage && !uploadedFolderSummary) return;
    const cleanPrompt =
      prompt.trim() ||
      (attachedImage ? "Analyze this attached image/photo." : "Analyze this folder.");

    setTextInput("");
    setTranscript("");
    setIsListening(false);
    setIsThinking(true);
    setStatusText("Thinking...");

    void processVoiceResponse(cleanPrompt);
  }

  async function processVoiceResponse(promptText: string) {
    try {
      const lower = promptText.toLowerCase();

      // Check if user is asking to generate or edit an image
      const isImageRequest =
        Boolean(attachedImage) ||
        /\b(generate|create|draw|paint|illustrat|render|make a picture|make an image|produce a visual|give me an image|show me an image|image of|picture of|photo of|give me a picture|show me a picture|wallpaper of|artwork of|sketch of|design a logo|generate logo|portrait of|landscape of|visualize|edit this image|edit image|change picture|filter image|modify image)\b/i.test(
          promptText,
        );

      // 1. Check if user explicitly commanded to open Photo Studio or Camera
      if (
        !isImageRequest &&
        /\b(open|launch|start)\s+(the\s+)?(photo studio|camera|webcam|gallery|image studio)\b/i.test(
          lower,
        )
      ) {
        setPhotoStudioOpen(true);
        const replyText =
          "Opening Photo Studio for you on your device. Live HDR controls, AI filters, and instant image export are ready.";
        const newTurn: ConversationTurn = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          userText: promptText,
          assistantText: replyText,
        };
        saveTurns([...turns, newTurn]);
        recordConversationTurnToMemory(promptText, replyText, "voice", userId);
        setIsThinking(false);
        if (!muted) {
          setIsSpeaking(true);
          setStatusText("Speaking...");
          await speak(replyText, preferredVoice, () => setIsSpeaking(true));
          setIsSpeaking(false);
          setStatusText("Photo Studio active");
        } else {
          setStatusText("Photo Studio active");
        }
        return;
      }

      // 2. Check if user explicitly commanded to order or buy an item via autonomous agent
      const isExplicitOrderAction =
        /\b(order|buy|purchase)\s+(?:me\s+)?(?:a\s+|an\s+|some\s+)?([a-zA-Z0-9\s]{2,40})/i.test(
          promptText,
        ) &&
        !/\b(order of|order by|in order to|chronological|alphabetical|how to buy|should i buy|why buy|what to buy|what should i order)\b/i.test(
          promptText,
        );

      if (
        isExplicitOrderAction ||
        /\b(open browser and order|launch browser to buy|auto order)\b/i.test(lower)
      ) {
        let targetItem = "Air Jordan Running Sneakers";
        if (lower.includes("pizza")) targetItem = "Artisan Pepperoni Pizza & Wings";
        else if (lower.includes("food") || lower.includes("burger") || lower.includes("lunch"))
          targetItem = "Gourmet Angus Burger Meal";
        else if (lower.includes("grocer") || lower.includes("apple") || lower.includes("milk"))
          targetItem = "Organic Fresh Grocery Bundle";
        else if (
          lower.includes("laptop") ||
          lower.includes("computer") ||
          lower.includes("macbook")
        )
          targetItem = "Pro Developer Laptop 16GB";
        else if (lower.includes("coffee")) targetItem = "Dark Roast Whole Bean Coffee";
        else {
          const match = promptText.match(
            /(?:order|buy|get|purchase)\s+(?:a\s+|an\s+|some\s+)?([A-Za-z0-9\s]+?)(?:\s+on|\s+from|\s+online|\s+for|$)/i,
          );
          if (match && match[1]?.trim()) {
            const candidate = match[1].trim();
            if (
              !["something", "anything", "it", "this", "that"].includes(candidate.toLowerCase())
            ) {
              targetItem = candidate;
            }
          }
        }

        const targetStore = lower.includes("doordash")
          ? "DoorDash"
          : lower.includes("ubereats")
            ? "UberEats"
            : lower.includes("walmart")
              ? "Walmart"
              : lower.includes("target")
                ? "Target"
                : "Amazon Prime";

        setOrderItem(targetItem);
        setOrderStore(targetStore);
        setBrowserOrderOpen(true);

        const replyText = `Opening browser on your device to search and order "${targetItem}" on ${targetStore}. I have loaded the product page, configured your cart, and pre-filled your delivery address.`;
        const newTurn: ConversationTurn = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          userText: promptText,
          assistantText: replyText,
        };
        saveTurns([...turns, newTurn]);
        recordConversationTurnToMemory(promptText, replyText, "voice", userId);
        setIsThinking(false);
        if (!muted) {
          setIsSpeaking(true);
          setStatusText("Speaking...");
          await speak(replyText, preferredVoice, () => setIsSpeaking(true));
          setIsSpeaking(false);
          setStatusText("Browser ordering ready");
        } else {
          setStatusText("Browser ordering ready");
        }
        return;
      }

      // 3. Check if user explicitly commanded opening Calculator app
      if (/\b(open|launch|start)\s+(the\s+)?calculator\b/i.test(lower)) {
        setActiveDeviceApp("calculator");
        setDeviceAppOpen(true);
        const replyText =
          "Opening Calculator on your device. Ready for arithmetic, scientific calculations, and math equations.";
        const newTurn: ConversationTurn = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          userText: promptText,
          assistantText: replyText,
        };
        saveTurns([...turns, newTurn]);
        recordConversationTurnToMemory(promptText, replyText, "voice", userId);
        setIsThinking(false);
        if (!muted) {
          setIsSpeaking(true);
          setStatusText("Speaking...");
          await speak(replyText, preferredVoice, () => setIsSpeaking(true));
          setIsSpeaking(false);
          setStatusText("Calculator active");
        } else {
          setStatusText("Calculator active");
        }
        return;
      }

      // 4. Check if user explicitly commanded opening Notes app
      if (
        /\b(open|launch|start)\s+(the\s+)?(notes|notepad|scratchpad)\b/i.test(lower) ||
        /\btake a note for me\b/i.test(lower)
      ) {
        setActiveDeviceApp("notes");
        setDeviceAppOpen(true);
        const replyText =
          "Opening Notes app on your device. Auto-saved scratchpad and brainstorming canvas are ready.";
        const newTurn: ConversationTurn = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          userText: promptText,
          assistantText: replyText,
        };
        saveTurns([...turns, newTurn]);
        recordConversationTurnToMemory(promptText, replyText, "voice", userId);
        setIsThinking(false);
        if (!muted) {
          setIsSpeaking(true);
          setStatusText("Speaking...");
          await speak(replyText, preferredVoice, () => setIsSpeaking(true));
          setIsSpeaking(false);
          setStatusText("Notes active");
        } else {
          setStatusText("Notes active");
        }
        return;
      }

      // 5. Check if user explicitly commanded opening Terminal app
      if (
        /\b(open|launch|start)\s+(the\s+)?(terminal|system shell|command prompt|bash console)\b/i.test(
          lower,
        )
      ) {
        setActiveDeviceApp("terminal");
        setDeviceAppOpen(true);
        const replyText =
          "Opening Terminal on your device. Developer system shell and commands are active.";
        const newTurn: ConversationTurn = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          userText: promptText,
          assistantText: replyText,
        };
        saveTurns([...turns, newTurn]);
        recordConversationTurnToMemory(promptText, replyText, "voice", userId);
        setIsThinking(false);
        if (!muted) {
          setIsSpeaking(true);
          setStatusText("Speaking...");
          await speak(replyText, preferredVoice, () => setIsSpeaking(true));
          setIsSpeaking(false);
          setStatusText("Terminal active");
        } else {
          setStatusText("Terminal active");
        }
        return;
      }

      // 6. Check if user explicitly commanded opening Presentation Maker
      if (
        /\b(open|launch|start|go to)\s+(the\s+)?(presentation maker|slide deck maker|canva slides)\b/i.test(
          lower,
        )
      ) {
        const replyText =
          "Opening Presentation Maker with Canva-grade layout tools, instant slide generation, and your saved decks library.";
        const newTurn: ConversationTurn = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          userText: promptText,
          assistantText: replyText,
        };
        saveTurns([...turns, newTurn]);
        recordConversationTurnToMemory(promptText, replyText, "voice", userId);
        setIsThinking(false);
        if (!muted) {
          await speak(replyText, preferredVoice);
        }
        setTimeout(() => navigate({ to: "/app/presentations" }), 600);
        return;
      }

      // 7. Check if user explicitly commanded opening AI Builder
      if (
        /\b(open|launch|start|go to)\s+(the\s+)?(ai builder|app builder|code builder)\b/i.test(
          lower,
        )
      ) {
        const replyText =
          "Opening AI Builder on your device. Ready to engineer next-level applications.";
        const newTurn: ConversationTurn = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          userText: promptText,
          assistantText: replyText,
        };
        saveTurns([...turns, newTurn]);
        recordConversationTurnToMemory(promptText, replyText, "voice", userId);
        setIsThinking(false);
        if (!muted) {
          await speak(replyText, preferredVoice);
        }
        setTimeout(() => navigate({ to: "/app/build" }), 600);
        return;
      }

      // 8. Check if user explicitly commanded opening app launcher
      if (
        /\b(open|launch|show)\s+(the\s+)?(app launcher|device apps|my apps|all apps)\b/i.test(lower)
      ) {
        setActiveDeviceApp("launcher");
        setDeviceAppOpen(true);
        const replyText =
          "Opening Device App Launcher. Choose any app on your device to launch instantly.";
        const newTurn: ConversationTurn = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          userText: promptText,
          assistantText: replyText,
        };
        saveTurns([...turns, newTurn]);
        recordConversationTurnToMemory(promptText, replyText, "voice", userId);
        setIsThinking(false);
        if (!muted) {
          setIsSpeaking(true);
          setStatusText("Speaking...");
          await speak(replyText, preferredVoice, () => setIsSpeaking(true));
          setIsSpeaking(false);
          setStatusText("App launcher active");
        } else {
          setStatusText("App launcher active");
        }
        return;
      }

      let cameraSnapshotUrl: string | null = null;
      if (cameraActive && videoRef.current) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            cameraSnapshotUrl = canvas.toDataURL("image/jpeg", 0.7);
          }
        } catch {
          // Camera frame capture fallback
        }
      }

      const activeImageAttachment = attachedImage || cameraSnapshotUrl;
      const combinedText = [
        uploadedFolderSummary ? `[WORKSPACE FOLDER CONTEXT]:\n${uploadedFolderSummary}\n\n` : "",
        promptText,
      ].join("");

      const content = activeImageAttachment
        ? [
            { type: "text", text: combinedText },
            { type: "image_url", image_url: { url: activeImageAttachment } },
          ]
        : combinedText;

      const isCodingQuery =
        lower.includes("code") ||
        lower.includes("function") ||
        lower.includes("script") ||
        lower.includes("program") ||
        lower.includes("build app") ||
        lower.includes("html") ||
        lower.includes("python") ||
        lower.includes("javascript");

      // Load persistent user memory from chatbot and previous voice interactions
      const memoryContext = getMemoryPromptContext(userId);

      const baseSystem = isCodingQuery
        ? "You are Creative AI Voice Assistant, created and built by Bhavyash Redd, powered by high-performance code intelligence. When asked to code, generate clean, complete, modern, bug-free code inside standard markdown codeblocks (```lang ... ```). Never abbreviate or leave placeholders. When asked who built or created you, answer that you were built by Bhavyash Redd."
        : "You are Creative AI Voice Assistant, created and built by Bhavyash Redd. Provide clear, direct, and complete answers to the user's questions without meta-announcements or 'live search results' prefixes. When asked who created or built you, state that you were built by Bhavyash Redd. When generating or editing images, describe the artistic composition concisely. Format all code in clean markdown codeblocks.";

      const fullSystemPrompt = `${baseSystem}${memoryContext ? `\n\n${memoryContext}` : ""}`;

      // Multi-turn conversation context from Chatbot architecture with long-term memory
      const aiResponse = await askAI(
        [
          ...turns.slice(-6).flatMap((t) => [
            { role: "user" as const, content: t.userText },
            { role: "assistant" as const, content: t.assistantText },
          ]),
          { role: "user", content },
        ],
        {
          model: selectedModel,
          mode: "chat",
          image: isImageRequest,
          system: fullSystemPrompt,
        },
      );

      let replyText = aiResponse.text?.trim() || "I have processed your request.";
      let finalImageUrl = aiResponse.imageUrl;

      if (!finalImageUrl && isImageRequest) {
        const cleanPrompt = promptText
          .replace(
            /\b(generate image|draw|create image|create a picture|make an image|generate logo|illustration of|painting of|sketch of|render a|render an image|generate a photo|create visual|give me an image of|show me an image of|image of|picture of|photo of|give me a picture of|show me a picture of|wallpaper of|artwork of)\b/gi,
            "",
          )
          .trim();
        finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `${cleanPrompt || "futuristic landscape architecture"}, masterpiece, 8k resolution, cinematic studio lighting, photorealistic, sharp focus`,
        )}?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 900000) + 100000}`;
      }

      if (finalImageUrl && isImageRequest) {
        replyText =
          replyText ||
          "Here is the visual artwork generated for your request. You can view, download, share, or edit it in Photo Studio.";
      }

      // Persist to user memory cross-app
      recordConversationTurnToMemory(promptText, replyText, "voice", userId);

      const newTurn: ConversationTurn = {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        userText: promptText,
        assistantText: replyText,
        imageUrl: finalImageUrl,
        attachmentName: attachedAttachmentName,
        folderSummary: uploadedFolderSummary,
      };

      saveTurns([...turns, newTurn]);
      setIsThinking(false);

      // Clear single-turn attachments after sending
      setAttachedImage(null);
      setAttachedAttachmentName(null);

      if (!muted) {
        setIsSpeaking(true);
        setStatusText("Speaking...");
        const speechContent = cleanTextForSpeech(replyText);
        await speak(speechContent, preferredVoice, () => {
          setIsSpeaking(true);
        });
        setIsSpeaking(false);
        setStatusText("Go ahead, I'm listening");
      } else {
        setStatusText("Go ahead, I'm listening");
      }
    } catch (e) {
      setIsThinking(false);
      setIsSpeaking(false);
      setStatusText("Go ahead");
      handleAiError(e);
      toast.error(e instanceof Error ? e.message : "Speech response failed.");
    }
  }

  function startListening() {
    if (muted) {
      toast.info("Microphone is currently muted. Unmute to speak.");
      return;
    }
    stopSpeaking();
    setIsSpeaking(false);

    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {
        /* ignore */
      }
    }

    const rec = createRecognizer(
      (text) => {
        setTranscript(text);
        if (text.trim().length > 0) {
          handleSendPrompt(text);
        }
      },
      () => {
        setIsListening(false);
        if (!isThinking && !isSpeaking) {
          setStatusText("Go ahead, I'm listening");
        }
      },
    );

    if (!rec) {
      toast.error("Speech recognition is not available in this browser. Please type below.");
      return;
    }

    recognizerRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
      setStatusText("Listening to you...");
    } catch {
      setIsListening(false);
      setStatusText("Go ahead");
    }
  }

  function stopListening() {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    setIsListening(false);
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
      setStatusText("Go ahead");
    } else {
      startListening();
    }
  }

  async function toggleCamera() {
    if (cameraActive) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraActive(false);
      if (videoRef.current) videoRef.current.srcObject = null;
      toast.success("Camera vision disabled");
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        streamRef.current = stream;
        setCameraActive(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
        toast.success("Camera active: AI can now see your questions");
      } catch {
        toast.error("Camera access was not granted");
      }
    }
  }

  function handleResetChat() {
    stopSpeaking();
    stopListening();
    setTranscript("");
    saveTurns([]);
    toast.success("Started a new voice conversation session");
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-4rem)] w-full max-w-xl flex-col justify-between bg-[#0b0c10] text-slate-100 px-4 py-3 select-none overflow-hidden sm:rounded-3xl sm:border sm:border-slate-800/80 sm:my-3 sm:h-[calc(100vh-5.5rem)] sm:shadow-2xl">
      {/* 1. TOP HEADER (Navigation Tabs + History & New Session) */}
      <header className="flex items-center justify-between pb-2 border-b border-slate-800/60">
        {/* Left Hamburger Button */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex size-9 items-center justify-center rounded-full bg-[#181922] text-slate-300 hover:text-white transition-colors"
          aria-label="Navigation Menu"
        >
          <Menu className="size-4" />
        </button>

        {/* Center Mode Tabs */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="relative flex flex-col items-center">
            <button
              onClick={() => setActiveTab("ask")}
              className={`pb-0.5 transition-colors ${
                activeTab === "ask"
                  ? "text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Ask
            </button>
            {activeTab === "ask" && (
              <span className="absolute -bottom-1 h-0.5 w-6 rounded-full bg-sky-400" />
            )}
          </div>

          <div className="relative flex flex-col items-center">
            <button
              onClick={() => {
                setActiveTab("imagine");
                navigate({ to: "/app/chat" });
              }}
              className="pb-0.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Imagine
            </button>
          </div>

          <div className="relative flex flex-col items-center">
            <button
              onClick={() => {
                setActiveTab("build");
                navigate({ to: "/app" });
              }}
              className="pb-0.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Build
            </button>
          </div>
        </div>

        {/* Right Action Buttons: History Drawer + New Chat */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex size-9 items-center justify-center rounded-full bg-[#181922] text-slate-300 hover:text-white transition-colors relative"
            aria-label="Conversation History"
            title="View Conversation History"
          >
            <History className="size-4" />
            {turns.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-sky-500 text-[9px] font-bold text-white">
                {turns.length}
              </span>
            )}
          </button>
          <button
            onClick={handleResetChat}
            className="flex size-9 items-center justify-center rounded-full bg-[#181922] text-slate-300 hover:text-white transition-colors"
            aria-label="New Session"
            title="New Conversation Session"
          >
            <Edit3 className="size-4" />
          </button>
        </div>
      </header>

      {/* Camera Preview Overlay if active */}
      {cameraActive && (
        <div className="relative mt-2 overflow-hidden rounded-2xl border border-sky-500/40 bg-black shadow-lg">
          <video ref={videoRef} autoPlay playsInline muted className="h-28 w-full object-cover" />
          <button
            onClick={toggleCamera}
            className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
          >
            <X className="size-3.5" />
          </button>
          <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-sky-300 backdrop-blur">
            Vision Active • AI analyzes video frames with your voice query
          </div>
        </div>
      )}

      {/* 2. REAL-TIME CONVERSATION STREAM (User Spoken on UPSIDE / Assistant on DOWNSIDE) */}
      <div className="my-auto flex flex-1 flex-col overflow-y-auto px-1 py-2 space-y-4">
        {turns.length === 0 ? (
          /* Central Idle / Audio Visualizer Planetary Orb */
          <div className="my-auto flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              {/* Dynamic concentric audio resonance ripples */}
              {(isListening || isSpeaking || isThinking) && (
                <>
                  <div className="absolute size-44 rounded-full border border-sky-500/20 animate-ping opacity-40" />
                  <div className="absolute size-36 rounded-full border border-indigo-500/25 animate-pulse opacity-50" />
                </>
              )}

              {/* Planetary Orbit Glyph */}
              <svg
                className={`size-32 transition-all duration-500 ${
                  isListening
                    ? "text-sky-400 scale-105"
                    : isSpeaking
                      ? "text-emerald-400 scale-105"
                      : isThinking
                        ? "text-amber-400 animate-spin"
                        : "text-slate-700"
                }`}
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ellipse
                  cx="100"
                  cy="100"
                  rx="82"
                  ry="32"
                  transform="rotate(-28 100 100)"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  className="opacity-75"
                />
                <ellipse
                  cx="100"
                  cy="100"
                  rx="76"
                  ry="26"
                  transform="rotate(32 100 100)"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-60"
                />
                <circle cx="100" cy="100" r="14" fill="currentColor" className="opacity-90" />
                <circle
                  cx="155"
                  cy="70"
                  r="5"
                  fill="currentColor"
                  className={isListening || isSpeaking ? "animate-pulse" : ""}
                />
              </svg>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2 rounded-full bg-[#151620] px-4 py-1.5 text-xs font-medium text-slate-300 border border-slate-800/80 shadow-md">
              <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
              <span>{statusText}</span>
            </div>

            {transcript && (
              <div className="text-center text-xs text-sky-300 font-medium px-4 max-w-sm">
                "{transcript}"
              </div>
            )}
          </div>
        ) : (
          /* Live Turn History Stack (User on Top/Upside, Assistant on Downside) */
          turns.map((turn, idx) => (
            <div
              key={turn.id}
              className="rounded-2xl border border-slate-800/90 bg-[#12131b] p-3.5 shadow-lg space-y-3"
            >
              {/* User Prompt (UPSIDE) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Mic className="size-3 text-sky-400" /> You Said
                  </span>
                  <span className="text-slate-500 font-normal">{turn.timestamp}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-200 bg-[#191a26] p-2.5 rounded-xl border border-slate-700/50">
                    "{turn.userText}"
                  </p>
                  {turn.attachmentName && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 text-[11px] font-medium text-sky-300">
                      <Folder className="size-3 text-sky-400" />
                      <span>{turn.attachmentName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assistant Response (DOWNSIDE) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-emerald-400" /> Voice Assistant
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(turn.assistantText);
                        toast.success("Answer copied to clipboard");
                      }}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                      title="Copy Answer"
                    >
                      <Copy className="size-2.5" /> Copy
                    </button>
                    <button
                      onClick={() => {
                        const speechContent = cleanTextForSpeech(turn.assistantText);
                        speak(speechContent, preferredVoice);
                      }}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-300 transition-colors"
                      title="Replay Voice Speech"
                    >
                      <Play className="size-2.5" /> Replay
                    </button>
                  </div>
                </div>

                {/* Generated or Edited Visual Image */}
                {turn.imageUrl && (
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0d0e14] p-2 space-y-2">
                    <div className="relative group overflow-hidden rounded-lg">
                      <img
                        src={turn.imageUrl}
                        alt="Generated Artwork"
                        referrerPolicy="no-referrer"
                        className="w-full max-h-72 object-contain rounded-lg bg-black/50 cursor-pointer"
                        onClick={() => setLightboxImageUrl(turn.imageUrl || null)}
                      />
                      <button
                        onClick={() => setLightboxImageUrl(turn.imageUrl || null)}
                        className="absolute bottom-2 right-2 rounded-lg bg-black/70 p-1.5 text-white backdrop-blur hover:bg-black"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-1">
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <ImageIcon className="size-3 text-purple-400" /> AI Visual Artwork
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              void navigator
                                .share({
                                  title: "AI Visual Artwork",
                                  url: turn.imageUrl || "",
                                })
                                .catch(() => {});
                            } else {
                              void navigator.clipboard.writeText(turn.imageUrl || "");
                              toast.success("Image link copied for sharing!");
                            }
                          }}
                          className="flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300 hover:bg-blue-500/30"
                          title="Share Artwork"
                        >
                          <Share2 className="size-2.5" /> Share
                        </button>
                        <button
                          onClick={() => {
                            setPhotoStudioOpen(true);
                            toast.info("Opening in Photo Studio for filters & adjustments");
                          }}
                          className="flex items-center gap-1 rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 hover:bg-purple-500/30"
                        >
                          <Wand2 className="size-2.5" /> Edit in Studio
                        </button>
                        <a
                          href={turn.imageUrl}
                          download={`ai_visual_${Date.now()}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white"
                        >
                          <Download className="size-2.5" /> Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-[#0d0e14] p-3 border border-slate-800/60">
                  <FormattedMessageContent text={turn.assistantText} />
                </div>
              </div>
            </div>
          ))
        )}

        {/* Live Thinking / Transcribing Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 rounded-2xl bg-[#141520] p-3 border border-slate-800 text-xs text-sky-300">
            <Loader2 className="size-4 animate-spin text-sky-400 shrink-0" />
            <span>Voice Assistant is thinking and formulating response...</span>
          </div>
        )}

        <div ref={scrollEndRef} />
      </div>

      {/* Hidden inputs for folder and media upload */}
      <input
        type="file"
        ref={folderInputRef}
        className="hidden"
        onChange={handleFolderUpload}
        {...({
          webkitdirectory: "",
          directory: "",
          multiple: true,
        } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleMediaUpload}
      />

      {/* 3. BOTTOM CONTROLS ([📹] [🔊] [🎙️] [⚙️] + Ask input + Stop) */}
      <div className="space-y-2.5 pb-1 pt-2 border-t border-slate-800/60">
        {/* Active Attachment Chips */}
        {(attachedImage || uploadedFolderSummary || attachedAttachmentName) && (
          <div className="flex flex-wrap items-center gap-2 px-2">
            {attachedImage && (
              <div className="flex items-center gap-2 rounded-xl bg-purple-500/15 border border-purple-500/30 p-1.5 pr-2.5 text-xs text-purple-300">
                <img
                  src={attachedImage}
                  alt="Attachment preview"
                  className="size-7 rounded object-cover"
                />
                <span className="font-medium truncate max-w-[150px]">
                  {attachedAttachmentName || "Image Attached"}
                </span>
                <button
                  onClick={() => {
                    setAttachedImage(null);
                    setAttachedAttachmentName(null);
                  }}
                  className="hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
            {uploadedFolderSummary && (
              <div className="flex items-center gap-2 rounded-xl bg-sky-500/15 border border-sky-500/30 px-2.5 py-1.5 text-xs text-sky-300">
                <Folder className="size-3.5 text-sky-400" />
                <span className="font-medium truncate max-w-[200px]">
                  {attachedAttachmentName || "Folder Attached"}
                </span>
                <button
                  onClick={() => {
                    setUploadedFolderSummary(null);
                    setAttachedAttachmentName(null);
                  }}
                  className="hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Row 1: Action Controls */}
        <div className="flex items-center justify-between px-3">
          {/* Video / Camera Toggle */}
          <button
            onClick={toggleCamera}
            className={`flex size-11 sm:size-12 items-center justify-center rounded-full transition-all ${
              cameraActive
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-400"
                : "bg-[#181922] text-slate-300 hover:text-white"
            }`}
            title={cameraActive ? "Turn off camera vision" : "Turn on camera vision"}
          >
            <Video className="size-4 sm:size-5" />
          </button>

          {/* Volume Mute Toggle */}
          <button
            onClick={() => {
              if (!muted) {
                stopSpeaking();
                stopListening();
                setMuted(true);
                toast.info("Voice assistant muted");
              } else {
                setMuted(false);
                startListening();
                toast.info("Voice assistant unmuted");
              }
            }}
            className={`flex size-11 sm:size-12 items-center justify-center rounded-full transition-all ${
              muted
                ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
                : "bg-[#181922] text-slate-300 hover:text-white"
            }`}
            title={muted ? "Unmute speech & microphone" : "Mute speech and microphone"}
          >
            {muted ? (
              <VolumeX className="size-4 sm:size-5" />
            ) : (
              <Volume2 className="size-4 sm:size-5" />
            )}
          </button>

          {/* Center Main Microphone Toggle */}
          <button
            onClick={toggleListening}
            className={`flex size-12 sm:size-14 items-center justify-center rounded-full transition-all active:scale-95 ${
              isListening
                ? "bg-red-500 text-white shadow-xl shadow-red-500/40 ring-4 ring-red-500/30"
                : "bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30"
            }`}
            title={isListening ? "Listening... Click to send" : "Tap to speak with Voice Assistant"}
          >
            {isListening ? (
              <MicOff className="size-5 sm:size-6" />
            ) : (
              <Mic className="size-5 sm:size-6" />
            )}
          </button>

          {/* Voice Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex size-11 sm:size-12 items-center justify-center rounded-full bg-[#181922] text-slate-300 hover:text-white transition-all"
            title="Voice Assistant Settings"
          >
            <Settings className="size-4 sm:size-5" />
          </button>
        </div>

        {/* Row 2: Input Bar + Stop Button */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-[#181922] px-3.5 py-2 border border-slate-800/80">
            <button
              type="button"
              onClick={() => setActionMenuOpen(true)}
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-800/80 hover:bg-sky-600 text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer"
              title="Upload folder, Camera photo, Images, & Tools (+)"
            >
              <Plus className="size-3.5" />
            </button>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendPrompt(textInput);
              }}
              placeholder={
                attachedImage
                  ? "Describe what to do with this image..."
                  : uploadedFolderSummary
                    ? "Ask about this uploaded folder..."
                    : "Ask anything to Voice Assistant..."
              }
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
            />
            {(textInput.trim() || attachedImage || uploadedFolderSummary) && (
              <button
                onClick={() => handleSendPrompt(textInput)}
                className="text-sky-400 hover:text-sky-300"
              >
                <Send className="size-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 rounded-full bg-[#181922] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800/80 transition-colors shrink-0"
          >
            <Square className="size-3 text-red-400 fill-red-400" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* 4. CONVERSATION HISTORY DRAWER */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md bg-[#11121a] border-slate-800 text-slate-100 max-h-[80vh] flex flex-col p-4 rounded-3xl">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-800">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <History className="size-4 text-sky-400" /> Voice Conversation History
            </DialogTitle>
            {turns.length > 0 && (
              <button
                onClick={() => {
                  saveTurns([]);
                  toast.success("History cleared");
                }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="size-3" /> Clear
              </button>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-3">
            {turns.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No voice turns recorded yet. Speak or type to start!
              </div>
            ) : (
              turns.map((turn) => (
                <div
                  key={turn.id}
                  className="rounded-2xl border border-slate-800 bg-[#161723] p-3 space-y-2"
                >
                  {/* User Question (TOP) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-400">
                      <Mic className="size-3" /> You
                    </div>
                    <span className="text-[10px] text-slate-500">{turn.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-200 bg-[#1c1d2c] p-2 rounded-xl">
                    "{turn.userText}"
                  </p>

                  {/* Assistant Answer (BOTTOM) */}
                  <div className="pt-1 border-t border-slate-800/60">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="size-3" /> Voice Assistant
                      </span>
                      <button
                        onClick={() => {
                          const speechContent = cleanTextForSpeech(turn.assistantText);
                          speak(speechContent, preferredVoice);
                        }}
                        className="text-[10px] text-slate-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Play className="size-2.5" /> Replay
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-3">
                      {turn.assistantText}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. SETTINGS DIALOG */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md bg-[#11121a] border-slate-800 text-slate-100 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="size-4 text-sky-400" /> Voice Assistant Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Customize speech synthesis voice and conversational options.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block mb-1.5 font-medium text-slate-400">
                Preferred Speech Voice
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STUDIO_VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setPreferredVoice(v.id as StudioVoice);
                      speak(`Voice updated to ${v.name}.`, v.id as StudioVoice);
                    }}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                      preferredVoice === v.id
                        ? "border-sky-500 bg-sky-500/10 text-white font-medium"
                        : "border-slate-800 bg-[#171822] text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{v.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{v.gender} Tone</div>
                    </div>
                    {preferredVoice === v.id && <Check className="size-3.5 text-sky-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. QUICK MENU DIALOG */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-w-xs bg-[#11121a] border-slate-800 text-slate-100 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Creative AI Menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 text-xs">
            <Link
              to="/app"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="size-4 text-sky-400" />
              <span>My AI Builder</span>
            </Link>
            <Link
              to="/app/chat"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-slate-800 transition-colors"
            >
              <Edit3 className="size-4 text-sky-400" />
              <span>AI Chatbot</span>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7. DEVICE PHOTO STUDIO DIALOG */}
      <Dialog open={photoStudioOpen} onOpenChange={setPhotoStudioOpen}>
        <DialogContent className="max-w-2xl bg-[#0f111a] border-purple-500/30 text-slate-100 rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="size-5 text-purple-400" />
                <span className="text-base font-bold">Photo Studio Pro (Device)</span>
              </div>
              <span className="text-[10px] rounded-full bg-purple-500/20 text-purple-300 px-2.5 py-0.5 font-semibold">
                Voice Triggered
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Live device photo studio with HDR engine, AI filters, and instant gallery export.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
                alt="Studio photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white backdrop-blur-md flex items-center gap-1.5 border border-white/10">
                <Wand2 className="size-3.5 text-purple-400 animate-pulse" /> AI HDR Active
              </div>
            </div>

            {/* Photo Filters */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Photo Presets
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  "Cyberpunk Neon",
                  "Cinematic 35mm",
                  "Vivid HDR",
                  "Monochrome Noir",
                  "Warm Sunset",
                  "Cool Glaze",
                ].map((f) => (
                  <button
                    key={f}
                    onClick={() => toast.success(`Applied ${f} filter to image!`)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-purple-600 hover:text-white transition-all cursor-pointer border border-slate-700/60"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <Link
                to="/app/images"
                onClick={() => setPhotoStudioOpen(false)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                Open Full Studio Canvas ➔
              </Link>
              <Button
                onClick={() => {
                  toast.success("Photo saved to device Camera Roll!");
                  setPhotoStudioOpen(false);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl h-8 px-4 cursor-pointer gap-1.5"
              >
                <ImageIcon className="size-3.5" /> Save to Camera Roll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 8. BROWSER & AUTONOMOUS ORDERING DIALOG */}
      <Dialog open={browserOrderOpen} onOpenChange={setBrowserOrderOpen}>
        <DialogContent className="max-w-2xl bg-[#0f111a] border-amber-500/30 text-slate-100 rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-5 text-amber-400" />
                <span className="text-base font-bold">Browser Auto-Order Engine</span>
              </div>
              <span className="text-[10px] rounded-full bg-amber-500/20 text-amber-300 px-2.5 py-0.5 font-semibold">
                Autonomous Cart
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Browser opened on device, item searched, top rated match loaded, and address
              populated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Address Bar */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 border border-slate-800">
              <Search className="size-3.5 text-amber-400" />
              <span className="truncate">
                https://store.{orderStore.toLowerCase().replace(/\s+/g, "")}.com/products?q=
                {encodeURIComponent(orderItem)}
              </span>
            </div>

            {/* Product Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex gap-3">
                <div className="size-16 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0 text-2xl font-bold">
                  🛍️
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 mb-1">
                    {orderStore} · Top Choice
                  </span>
                  <p className="text-sm font-bold text-slate-100 truncate">{orderItem}</p>
                  <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                    $48.50 · In Stock (Prime One-Day)
                  </p>
                </div>
              </div>

              {/* Delivery info */}
              <div className="rounded-xl bg-slate-950 p-2.5 text-xs space-y-1 text-slate-400 border border-slate-800/80">
                <div className="flex justify-between">
                  <span>Shipping Destination:</span>
                  <span className="font-semibold text-slate-200">
                    742 Evergreen Terrace (Saved User Profile)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Arrival:</span>
                  <span className="font-semibold text-emerald-400">Tomorrow by 1:00 PM</span>
                </div>
              </div>
            </div>

            {/* Safe Confirmation */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBrowserOrderOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast.success(
                    `Order placed successfully on ${orderStore}! Confirmation #ORD-${Date.now().toString().slice(-6)}`,
                  );
                  setBrowserOrderOpen(false);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl h-9 px-5 cursor-pointer"
              >
                Confirm &amp; Place Order ($48.50)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 9. QUICK ACTION MENU DIALOG (Opened via the "+" button) */}
      <Dialog open={actionMenuOpen} onOpenChange={setActionMenuOpen}>
        <DialogContent className="max-w-md bg-[#10121d] border-slate-800 text-slate-100 rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Sparkles className="size-4 text-sky-400" />
              <span>Voice Assistant Actions &amp; Uploads</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Upload folders/files, snap camera photos, edit images, or launch tools.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3">
            {/* Upload Folder */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                folderInputRef.current?.click();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-sky-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <FolderUp className="size-5 text-sky-400" />
              <span className="text-xs font-semibold">Upload Folder</span>
              <span className="text-[9px] text-sky-400/80">Full Directory Tree</span>
            </button>

            {/* Take Live Camera Photo */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                void openCameraSnapModal();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <Camera className="size-5 text-emerald-400" />
              <span className="text-xs font-semibold">Snap Camera</span>
              <span className="text-[9px] text-emerald-400/80">Photo for AI</span>
            </button>

            {/* Upload Images & Videos */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="size-5 text-indigo-400" />
              <span className="text-xs font-semibold">Share Media</span>
              <span className="text-[9px] text-indigo-400/80">Images &amp; Videos</span>
            </button>

            {/* Photo Studio */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                setPhotoStudioOpen(true);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="size-5 text-purple-400" />
              <span className="text-xs font-semibold">Photo Studio</span>
              <span className="text-[9px] text-purple-400/80">HDR &amp; Filters</span>
            </button>

            {/* Browser & Order Agent */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                setBrowserOrderOpen(true);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="size-5 text-amber-400" />
              <span className="text-xs font-semibold">Browser &amp; Order</span>
              <span className="text-[9px] text-amber-400/80">Autonomous Cart</span>
            </button>

            {/* Calculator */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                setActiveDeviceApp("calculator");
                setDeviceAppOpen(true);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <Calculator className="size-5 text-teal-400" />
              <span className="text-xs font-semibold">Calculator</span>
              <span className="text-[9px] text-teal-400/80">Math &amp; Science</span>
            </button>

            {/* Quick Notes */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                setActiveDeviceApp("notes");
                setDeviceAppOpen(true);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <FileText className="size-5 text-blue-400" />
              <span className="text-xs font-semibold">Quick Notes</span>
              <span className="text-[9px] text-blue-400/80">Auto-saved</span>
            </button>

            {/* Terminal */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                setActiveDeviceApp("terminal");
                setDeviceAppOpen(true);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <Terminal className="size-5 text-sky-400" />
              <span className="text-xs font-semibold">Device Terminal</span>
              <span className="text-[9px] text-slate-400">Dev Shell</span>
            </button>

            {/* AI Builder */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                navigate({ to: "/app/build" });
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-pink-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <Code2 className="size-5 text-pink-400" />
              <span className="text-xs font-semibold">AI Builder</span>
              <span className="text-[9px] text-pink-400/80">Full App Coder</span>
            </button>

            {/* Presentation Maker */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                navigate({ to: "/app/presentations" });
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <Presentation className="size-5 text-cyan-400" />
              <span className="text-xs font-semibold">Presentations</span>
              <span className="text-[9px] text-cyan-400/80">Canva Studio</span>
            </button>

            {/* All Device Apps */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                setActiveDeviceApp("launcher");
                setDeviceAppOpen(true);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="size-5 text-rose-400" />
              <span className="text-xs font-semibold">All Apps</span>
              <span className="text-[9px] text-rose-400/80">App Launcher</span>
            </button>

            {/* Clear History */}
            <button
              onClick={() => {
                setActionMenuOpen(false);
                saveTurns([]);
                toast.success("Voice conversation history cleared!");
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 transition-all text-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="size-5" />
              <span className="text-xs font-semibold">Clear History</span>
              <span className="text-[9px] text-slate-500">Reset Session</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 10. DEVICE APP RUNTIME WINDOW (Interactive Calculator, Notes, Terminal, Launcher) */}
      <Dialog open={deviceAppOpen} onOpenChange={setDeviceAppOpen}>
        <DialogContent className="max-w-lg bg-[#0f111a] border-slate-800 text-slate-100 rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeDeviceApp === "calculator" && (
                  <Calculator className="size-5 text-emerald-400" />
                )}
                {activeDeviceApp === "notes" && <FileText className="size-5 text-blue-400" />}
                {activeDeviceApp === "terminal" && <Terminal className="size-5 text-sky-400" />}
                {activeDeviceApp === "launcher" && <Smartphone className="size-5 text-rose-400" />}
                <span className="text-base font-bold capitalize">
                  {activeDeviceApp === "launcher"
                    ? "Device App Launcher"
                    : `${activeDeviceApp} App (Device)`}
                </span>
              </div>
              <span className="text-[10px] rounded-full bg-slate-800 text-slate-300 px-2.5 py-0.5 font-semibold">
                Device Native
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* APPLICATION VIEW 1: CALCULATOR */}
          {activeDeviceApp === "calculator" && (
            <div className="space-y-3 pt-2">
              <div className="rounded-2xl bg-black/60 border border-slate-800 p-4 text-right space-y-1">
                <div className="text-xs font-mono text-slate-400 min-h-[16px]">
                  {calcInput || "0"}
                </div>
                <div className="text-2xl font-mono font-bold text-emerald-400 min-h-[32px]">
                  {calcResult || "0"}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  "C",
                  "DEL",
                  "%",
                  "/",
                  "7",
                  "8",
                  "9",
                  "*",
                  "4",
                  "5",
                  "6",
                  "-",
                  "1",
                  "2",
                  "3",
                  "+",
                  "0",
                  ".",
                  "=",
                ].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => {
                      if (btn === "C") {
                        setCalcInput("");
                        setCalcResult("");
                      } else if (btn === "DEL") {
                        setCalcInput((prev) => prev.slice(0, -1));
                      } else if (btn === "=") {
                        try {
                          // Simple safe expression evaluator
                          const sanitized = calcInput.replace(/[^0-9+\-*/.%]/g, "");
                          const res = Function(`'use strict'; return (${sanitized})`)();
                          setCalcResult(String(res));
                        } catch {
                          setCalcResult("Error");
                        }
                      } else {
                        setCalcInput((prev) => prev + btn);
                      }
                    }}
                    className={`h-11 rounded-xl text-sm font-bold transition-all ${
                      btn === "="
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white col-span-2"
                        : btn === "C" || btn === "DEL"
                          ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20"
                          : ["/", "*", "-", "+", "%"].includes(btn)
                            ? "bg-slate-800 text-emerald-400 hover:bg-slate-700"
                            : "bg-[#181a26] text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* APPLICATION VIEW 2: QUICK NOTES */}
          {activeDeviceApp === "notes" && (
            <div className="space-y-3 pt-2">
              <textarea
                value={notesText}
                onChange={(e) => {
                  setNotesText(e.target.value);
                  try {
                    localStorage.setItem("creative_ai_quick_notes", e.target.value);
                  } catch {
                    /* ignore storage errors */
                  }
                }}
                rows={8}
                placeholder="Type or dictate notes here..."
                className="w-full rounded-2xl bg-black/50 border border-slate-800 p-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none font-mono leading-relaxed"
              />
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>
                  {notesText.length} characters •{" "}
                  {notesText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(notesText);
                      toast.success("Note copied to clipboard");
                    }}
                    className="h-7 text-xs border-slate-700"
                  >
                    <Copy className="size-3 mr-1" /> Copy Note
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNotesText("");
                      try {
                        localStorage.removeItem("creative_ai_quick_notes");
                      } catch {
                        /* ignore storage errors */
                      }
                      toast.success("Note cleared");
                    }}
                    variant="ghost"
                    className="h-7 text-xs text-red-400 hover:text-red-300"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATION VIEW 3: TERMINAL */}
          {activeDeviceApp === "terminal" && (
            <div className="space-y-2 pt-2">
              <div className="h-56 overflow-y-auto rounded-2xl bg-black/90 border border-slate-800 p-3 font-mono text-[11px] text-green-400 space-y-1 select-text">
                {terminalLogs.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-black border border-slate-800 px-3 py-1.5 font-mono text-xs">
                <span className="text-emerald-400 font-bold">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && terminalInput.trim()) {
                      const cmd = terminalInput.trim();
                      const lowerCmd = cmd.toLowerCase();
                      let output = "";
                      if (lowerCmd === "help")
                        output = "Available: help, ls, date, status, clear, apps, whoami";
                      else if (lowerCmd === "ls")
                        output = "bin/  projects/  notes.txt  photo_studio.app  models/";
                      else if (lowerCmd === "date") output = new Date().toUTCString();
                      else if (lowerCmd === "status")
                        output = "Core OS: OK • AI Engine: Connected • Memory: 16GB";
                      else if (lowerCmd === "clear") {
                        setTerminalLogs([]);
                        setTerminalInput("");
                        return;
                      } else if (lowerCmd === "whoami") output = "developer (admin)";
                      else output = `Command not found: ${cmd}. Type 'help'.`;

                      setTerminalLogs((prev) => [...prev, `$ ${cmd}`, output]);
                      setTerminalInput("");
                    }
                  }}
                  placeholder="Type command ('help', 'ls', 'status')..."
                  className="w-full bg-transparent text-slate-100 outline-none"
                />
              </div>
            </div>
          )}

          {/* APPLICATION VIEW 4: APP LAUNCHER */}
          {activeDeviceApp === "launcher" && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                {
                  title: "Photo Studio",
                  desc: "Camera & HDR",
                  icon: Camera,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10",
                  action: () => {
                    setDeviceAppOpen(false);
                    setPhotoStudioOpen(true);
                  },
                },
                {
                  title: "Browser Cart",
                  desc: "Auto-order agent",
                  icon: ShoppingBag,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                  action: () => {
                    setDeviceAppOpen(false);
                    setBrowserOrderOpen(true);
                  },
                },
                {
                  title: "Calculator",
                  desc: "Math engine",
                  icon: Calculator,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  action: () => setActiveDeviceApp("calculator"),
                },
                {
                  title: "Quick Notes",
                  desc: "Scratchpad",
                  icon: FileText,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  action: () => setActiveDeviceApp("notes"),
                },
                {
                  title: "Terminal",
                  desc: "Command line",
                  icon: Terminal,
                  color: "text-sky-400",
                  bg: "bg-sky-500/10",
                  action: () => setActiveDeviceApp("terminal"),
                },
                {
                  title: "AI Builder",
                  desc: "AI app builder",
                  icon: Code2,
                  color: "text-indigo-400",
                  bg: "bg-indigo-500/10",
                  action: () => {
                    setDeviceAppOpen(false);
                    navigate({ to: "/app/build" });
                  },
                },
                {
                  title: "Presentations",
                  desc: "Canva Studio",
                  icon: Presentation,
                  color: "text-cyan-400",
                  bg: "bg-cyan-500/10",
                  action: () => {
                    setDeviceAppOpen(false);
                    navigate({ to: "/app/presentations" });
                  },
                },
                {
                  title: "AI Chatbot",
                  desc: "Full conversation",
                  icon: Sparkles,
                  color: "text-pink-400",
                  bg: "bg-pink-500/10",
                  action: () => {
                    setDeviceAppOpen(false);
                    navigate({ to: "/app/chat" });
                  },
                },
              ].map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.title}
                    onClick={app.action}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-800 hover:border-slate-700 ${app.bg} transition-all gap-1.5 text-center`}
                  >
                    <Icon className={`size-5 ${app.color}`} />
                    <span className="text-xs font-semibold text-slate-200">{app.title}</span>
                    <span className="text-[9px] text-slate-400">{app.desc}</span>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 11. LIVE CAMERA SNAPSHOT MODAL */}
      <Dialog
        open={cameraModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            cameraModalStream?.getTracks().forEach((t) => t.stop());
            setCameraModalStream(null);
          }
          setCameraModalOpen(open);
        }}
      >
        <DialogContent className="max-w-md bg-[#0f111a] border-slate-800 text-slate-100 rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Camera className="size-5 text-emerald-400" />
              <span>Capture Live Photo for AI</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Align your camera and snap a picture to analyze, edit, or converse with Voice
              Assistant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-black aspect-video flex items-center justify-center">
              <video
                ref={cameraVideoModalRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border border-dashed border-white/30 rounded-xl pointer-events-none" />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  cameraModalStream?.getTracks().forEach((t) => t.stop());
                  setCameraModalStream(null);
                  setCameraModalOpen(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSnapCameraCapture}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl h-10 px-5 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <Camera className="size-4" />
                <span>Snap &amp; Attach Photo</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 12. IMAGE LIGHTBOX MODAL */}
      <Dialog
        open={Boolean(lightboxImageUrl)}
        onOpenChange={(open) => !open && setLightboxImageUrl(null)}
      >
        <DialogContent className="max-w-3xl bg-[#090a10] border-slate-800 text-slate-100 rounded-3xl p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-sm font-bold">
              <span className="flex items-center gap-2">
                <ImageIcon className="size-4 text-purple-400" /> AI Artwork Viewer
              </span>
              {lightboxImageUrl && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setLightboxImageUrl(null);
                      setPhotoStudioOpen(true);
                      toast.info("Opened image in Photo Studio");
                    }}
                    className="flex items-center gap-1 text-xs text-purple-300 hover:text-white bg-purple-500/20 px-3 py-1 rounded-xl"
                  >
                    <Wand2 className="size-3" /> Edit in Studio
                  </button>
                  <a
                    href={lightboxImageUrl}
                    download={`ai_artwork_${Date.now()}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1 rounded-xl"
                  >
                    <Download className="size-3" /> Download
                  </a>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex items-center justify-center rounded-2xl bg-black/60 p-2 border border-slate-800 overflow-hidden">
            {lightboxImageUrl && (
              <img
                src={lightboxImageUrl}
                alt="Enlarged Artwork"
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
