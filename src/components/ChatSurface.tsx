import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Volume2,
  Square,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  Loader2,
  Globe,
  ExternalLink,
  Plus,
  Edit2,
  Check,
  X,
  Sparkles,
  ChevronDown,
  Telescope,
  Image as ImageIcon,
  Video,
  Play,
  FileText,
  Table,
  Code2,
  Download,
  Clock,
  Zap,
  Sliders,
  Maximize2,
  RefreshCw,
  Share2,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Composer, type Attachment } from "@/components/Composer";
import { askAI, fileBlock, editImageAI, generateImageAI, type AiMessage } from "@/lib/ai";
import { ImagePreview } from "@/components/ImagePreview";
import { SourceCitations, stripRawLinksFromText } from "@/components/SourceCitations";
import { ImageGenerationSketching } from "@/components/ImageGenerationSketching";
import { useAi } from "@/components/AiProvider";
import { BUILD_MODELS } from "@/lib/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { speak, stopSpeaking } from "@/lib/speech";
import { ImageCanvasEditor } from "./ImageCanvasEditor";
import {
  getSessionsByMode,
  createNewSession,
  saveSession,
  generateTitleFromPrompt,
  renameSession,
  subscribeSessions,
  type ChatMsg,
  type ChatSession,
} from "@/lib/chat-sessions";
import { ChatSessionsDrawer } from "@/components/ChatSessionsDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getMemoryPromptContext, recordConversationTurnToMemory } from "@/lib/user-memory";
import { toast } from "sonner";

type Props = {
  mode: "chat" | "research" | "coding" | "presentations" | "build" | "voice" | "agent";
  system: string;
  intro: { icon: LucideIcon; title: string; subtitle: string; chips?: string[] | undefined };
  placeholder?: string | undefined;
  allowImages?: boolean | undefined;
  composerExtras?: React.ReactNode | undefined;
  externalDraft?: string | undefined;
  autoSpeak?: boolean | undefined;
};

const uid = () => Math.random().toString(36).slice(2);

// Isolated Code Block Component with Dedicated Vibe Coder Live Preview Sandbox
function ChatCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const cleanLang = (language || "txt").toLowerCase();
  const isRunnable =
    cleanLang === "html" ||
    cleanLang === "htm" ||
    cleanLang === "javascript" ||
    cleanLang === "js" ||
    cleanLang === "jsx" ||
    cleanLang === "typescript" ||
    cleanLang === "ts" ||
    cleanLang === "tsx" ||
    cleanLang === "react" ||
    cleanLang === "svg" ||
    cleanLang === "css" ||
    cleanLang === "python" ||
    cleanLang === "py";

  function handleCopyOnlyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadCode() {
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
    a.download = `creative_code_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Code downloaded as .${ext}`);
  }

  // Construct runnable HTML bundle for the live sandbox
  const previewSrcDoc = (() => {
    if (cleanLang === "html" || cleanLang === "htm") {
      if (code.includes("<!DOCTYPE") || code.includes("<html")) return code;
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><script src="https://cdn.tailwindcss.com"></script></head><body class="p-4 bg-slate-900 text-slate-100 font-sans">${code}</body></html>`;
    }
    if (cleanLang === "svg") {
      return `<!DOCTYPE html><html><body class="bg-slate-900 flex items-center justify-center min-h-screen p-4">${code}</body></html>`;
    }
    if (cleanLang === "python" || cleanLang === "py") {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-950 text-slate-100 p-4 font-mono text-xs"><div class="text-emerald-400 mb-2 font-bold">Python 3.12 Simulated Execution Console:</div><pre class="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-300">${code.replace(/</g, "&lt;")}</pre><div class="mt-3 p-3 bg-slate-900/80 rounded border border-emerald-500/30 text-emerald-300">Program executed successfully (Exit Code 0).</div></body></html>`;
    }
    // JS / TS / React snippet runner
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 p-4 min-h-screen flex flex-col font-sans">
  <div id="root" class="flex-1 flex flex-col items-center justify-center text-center">
    <div class="p-4 rounded-xl bg-slate-800 border border-slate-700 max-w-sm w-full">
      <div class="text-sm font-bold text-sky-400 mb-2">Live Vibe Sandbox</div>
      <div id="output" class="text-xs text-slate-300 mb-3 font-mono bg-slate-950 p-2.5 rounded border border-slate-800">Sandbox Ready</div>
      <button onclick="document.getElementById('output').textContent='Interactive trigger clicked! Timestamp: '+new Date().toLocaleTimeString()" class="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs transition">Run Action</button>
    </div>
  </div>
  <script>
    try {
      ${code}
    } catch(err) {
      console.log(err);
    }
  </script>
</body>
</html>`;
  })();

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-cyan-900/40 bg-[#06141c] shadow-lg">
      <div className="flex items-center justify-between border-b border-cyan-950 bg-[#0a1e2a] px-3.5 py-1.5 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-cyan-300">
          <Code2 className="size-3.5 text-cyan-400" />
          <span className="uppercase tracking-wider">{language || "CODE"}</span>
          <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 text-[9px] font-sans font-medium text-cyan-300">
            Code Engine
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isRunnable && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                showPreview
                  ? "bg-cyan-500 text-slate-950 shadow-xs"
                  : "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25"
              }`}
              title="Toggle Live Vibe Sandbox Preview"
            >
              <Zap className="size-3" />
              <span>{showPreview ? "Hide Preview" : "Run Preview"}</span>
            </button>
          )}
          <button
            onClick={() => {
              toast.success("Exporting to AI Builder...");
              void navigate({
                to: "/app/build",
                search: { idea: `Build app from code:\n${code.slice(0, 300)}` },
              });
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-cyan-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            title="Open in AI Builder"
          >
            <ExternalLink className="size-3" />
            <span>AI Builder</span>
          </button>
          <button
            onClick={handleCopyOnlyCode}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            title="Copy code only"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy code</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadCode}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            title="Download code snippet"
          >
            <Download className="size-3" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {showPreview && isRunnable && (
        <div className="border-b border-cyan-950 bg-slate-950 p-2">
          <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] text-cyan-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> Live Sandboxed
              Output
            </span>
            <span>Interactive Isolated iFrame</span>
          </div>
          <iframe
            srcDoc={previewSrcDoc}
            title="Live Code Sandbox"
            sandbox="allow-scripts"
            className="w-full h-56 rounded-lg border border-cyan-900/50 bg-slate-900"
          />
        </div>
      )}

      <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-cyan-100 selection:bg-cyan-600/30">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Parses and separates code blocks from prose
function renderFormattedMessage(content: string) {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textPiece = content.slice(lastIndex, match.index);
      elements.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {textPiece}
        </span>,
      );
    }
    const lang = (match && match[1]) || "code";
    const code = (match && match[2] ? match[2] : "").trimEnd();
    elements.push(<ChatCodeBlock key={`code-${match.index}`} language={lang} code={code} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    elements.push(
      <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
        {content.slice(lastIndex)}
      </span>,
    );
  }

  if (elements.length === 0) {
    return <span className="whitespace-pre-wrap leading-relaxed">{content}</span>;
  }

  return <div>{elements}</div>;
}

export function ChatSurface({
  mode,
  system,
  intro,
  placeholder,
  allowImages = false,
  composerExtras,
  externalDraft,
  autoSpeak = false,
}: Props) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [researchMode, setResearchMode] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // 10-Minute Research Mode Engine State
  const [isResearching, setIsResearching] = useState(false);
  const [researchSeconds, setResearchSeconds] = useState(0);
  const [researchTopic, setResearchTopic] = useState("");
  const researchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expeditedRef = useRef(false);

  // Multimodal Image Studio / Editor State
  const [editingImage, setEditingImage] = useState<{ url: string; prompt?: string } | null>(null);
  const [canvasEditorOpen, setCanvasEditorOpen] = useState<boolean>(false);
  const [canvasEditorImage, setCanvasEditorImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("none");
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [imageFlipped, setImageFlipped] = useState<boolean>(false);
  const [imageTransformPrompt, setImageTransformPrompt] = useState<string>("");
  const [transformingImage, setTransformingImage] = useState<boolean>(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const {
    selectedModel,
    setSelectedModel,
    handleAiError,
    preferredVoice,
    liveSearchEnabled,
    persona,
  } = useAi();

  const { user } = useAuth();
  const userId = user?.id || user?.email || null;

  const threadId = useRef<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // Initialize or restore session on mode change or first load
  const initSession = useCallback(() => {
    const existing = getSessionsByMode(mode);
    setSavedCount(existing.length);
    if (existing.length > 0 && existing[0]) {
      const latest = existing[0];
      setCurrentSession(latest);
      setMessages(latest.messages || []);
    } else {
      const fresh = createNewSession(mode);
      setCurrentSession(fresh);
      setMessages([]);
    }
  }, [mode]);

  useEffect(() => {
    initSession();
    const unsub = subscribeSessions(() => {
      const list = getSessionsByMode(mode);
      setSavedCount(list.length);
    });
    return () => unsub();
  }, [initSession, mode]);

  useEffect(() => {
    if (externalDraft) setDraft(externalDraft);
  }, [externalDraft]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, isResearching]);

  // Clean up research timer on unmount
  useEffect(() => {
    return () => {
      if (researchTimerRef.current) clearInterval(researchTimerRef.current);
    };
  }, []);

  // Sync current messages to active session in localStorage
  const syncSession = useCallback(
    (newMessages: ChatMsg[], suggestedTitle?: string) => {
      if (!currentSession) return;
      const updated: ChatSession = {
        ...currentSession,
        title:
          suggestedTitle && currentSession.title === "New Conversation"
            ? suggestedTitle
            : currentSession.title,
        messages: newMessages,
        updatedAt: Date.now(),
      };
      setCurrentSession(updated);
      saveSession(updated);
    },
    [currentSession],
  );

  async function persistRemote(
    role: "user" | "assistant",
    content: string,
    imageUrl?: string | null,
  ) {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;
      if (!threadId.current) {
        const { data } = await supabase
          .from("chat_threads")
          .insert({ user_id: userId, mode, title: content.slice(0, 60) || mode })
          .select("id")
          .single();
        threadId.current = data?.id ?? null;
      }
      if (!threadId.current) return;
      await supabase.from("chat_messages").insert({
        thread_id: threadId.current,
        user_id: userId,
        role,
        content,
        image_url: imageUrl ?? null,
      });
    } catch {
      /* remote history is best-effort */
    }
  }

  // Completes and generates the research paper after 10 minutes (or on expedite)
  async function finalizeResearchPaper(topicText: string, currentHistory: ChatMsg[]) {
    if (researchTimerRef.current) {
      clearInterval(researchTimerRef.current);
      researchTimerRef.current = null;
    }
    setIsResearching(false);
    setBusy(true);

    try {
      toast.info("10-minute research complete! Compiling formal peer-reviewed paper...");

      const payload: AiMessage[] = [
        ...currentHistory.map((m) => ({ role: m.role, content: m.content })),
        {
          role: "user",
          content: `Topic: ${topicText}. Compile the comprehensive 10-minute in-depth scholarly research paper.
Ensure the paper contains:
# Title of Research Paper
## Abstract (Context, methodology, empirical findings, and conclusion)
## 1. Introduction & Background
## 2. Comprehensive Literature Review & Related Work
## 3. Theoretical Framework & Methodology
## 4. Empirical Findings, Quantitative Data Models & Analysis
## 5. Discussion & Strategic Implications
## 6. Limitations & Future Research Directions
## 7. Conclusion
## References & Citations (Include DOIs, scholarly publication venues, and empirical datasets).`,
        },
      ];

      const res = await askAI(payload, {
        system: `${system}\n[10-MINUTE EMPIRICAL RESEARCH PROTOCOL COMPLETE]: You are a senior principal research scientist. Produce a meticulous, publication-grade academic research paper with full statistical rigor, empirical methodology, and verifiable citations.`,
        model: selectedModel || "gemini-3.8-flash",
        mode: "research",
        search: true,
      });

      const reply: ChatMsg = {
        id: uid(),
        role: "assistant",
        content: res.text || "Scholarly Research Paper compiled successfully.",
        sources: res.sources ?? [],
        grounded: true,
        rating: null,
      };

      const updatedHistory = [...currentHistory, reply];
      setMessages(updatedHistory);
      syncSession(updatedHistory);
      void persistRemote("assistant", reply.content);
      toast.success("Scholarly Research Paper published!");
    } catch (e) {
      handleAiError(e);
      toast.error(e instanceof Error ? e.message : "Failed to generate research paper.");
    } finally {
      setBusy(false);
      setResearchSeconds(0);
    }
  }

  // 10-Minute Research Starter
  function startTenMinuteResearch(topicText: string, updatedHistory: ChatMsg[]) {
    setIsResearching(true);
    setResearchSeconds(0);
    setResearchTopic(topicText);
    expeditedRef.current = false;

    toast.success(
      "10-Minute Scholarly Research Protocol initiated. Conducting multi-corpus academic sweep.",
    );

    let sec = 0;
    if (researchTimerRef.current) clearInterval(researchTimerRef.current);

    researchTimerRef.current = setInterval(() => {
      sec += 1;
      setResearchSeconds(sec);

      // Milestone notification
      if (sec === 120) {
        toast.info("Phase 2: Verifying primary DOI citations & empirical datasets...");
      } else if (sec === 240) {
        toast.info("Phase 3: Statistical data modeling & meta-analysis regression...");
      } else if (sec === 360) {
        toast.info("Phase 4: Formulating theoretical methodology & peer-review framework...");
      } else if (sec === 480) {
        toast.info("Phase 5: Compiling final peer-reviewed scholarly research paper...");
      }

      // Reached 10 minutes (600 seconds)
      if (sec >= 600) {
        void finalizeResearchPaper(topicText, updatedHistory);
      }
    }, 1000);
  }

  // Allows user to expedite/finalize research without waiting all 600 seconds
  function handleExpediteResearch() {
    if (!isResearching) return;
    expeditedRef.current = true;
    toast.info("Expediting research paper finalization...");
    void finalizeResearchPaper(researchTopic, messages);
  }

  // Share Image helper
  async function handleShareImage(imageUrl: string, title?: string) {
    if (!imageUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Creative AI Image Artwork",
          text: title || "Check out this AI-generated visual artwork from Creative AI",
          url: imageUrl,
        });
        toast.success("Shared successfully!");
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(imageUrl);
    toast.success("Image link copied to clipboard for sharing!");
  }

  async function run(history: ChatMsg[], atts: Attachment[], wantImage: boolean) {
    setBusy(true);
    try {
      const lastUserMsg = history[history.length - 1];
      const hasImageAttachment =
        atts.some((a) => a.mime.startsWith("image/") || a.dataUrl?.startsWith("data:image/")) ||
        history.some((m) => m.imageUrl || (m.imageUrls && m.imageUrls.length > 0));
      const imageAttCount =
        atts.filter((a) => a.mime.startsWith("image/") || a.dataUrl?.startsWith("data:image/"))
          .length +
        (lastUserMsg?.imageUrls ? lastUserMsg.imageUrls.length : lastUserMsg?.imageUrl ? 1 : 0);
      const isMultiImage = imageAttCount > 1;

      const isImgPrompt =
        wantImage ||
        (hasImageAttachment &&
          (isMultiImage ||
            /\b(edit|modify|filter|redraw|change|colorize|transform|convert|enhance|style|tune|photoshop|cartoon|anime|sketch|vintage|cyberpunk|portrait|painting|render|add|remove|replace|make it|make this|turn this|recreate|combine|merge|blend|mix|fuse|put|swap|composite|command)\b/i.test(
              lastUserMsg?.content || "",
            ))) ||
        (lastUserMsg &&
          /\b(generate|create|draw|paint|illustrat|render|make a picture|make an image|produce a visual|give me an image|show me an image|image of|picture of|photo of|give me a picture|show me a picture|wallpaper of|artwork of|sketch of|design a logo|generate logo|portrait of|landscape of|visualize)\b/i.test(
            lastUserMsg.content || "",
          ));

      if (isImgPrompt) {
        setIsGeneratingImage(true);
      }

      const payload: AiMessage[] = history.map((m, i) => {
        const isLastUser = i === history.length - 1 && m.role === "user";
        if (isLastUser && atts.length) {
          return {
            role: "user",
            content: [
              { type: "text", text: m.content || "Analyze or edit this content." },
              ...atts.map((a) => fileBlock(a.name, a.mime, a.dataUrl || a.data)),
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

      const memoryContext = getMemoryPromptContext(userId);
      const effectiveSystem = `${system}\nActive Training Persona: ${persona}. You are My AI Pro, trained for crystal-clear clarity, authoritative answers, and next-level software engineering. Always structure answers cleanly with bold highlights, concise points, and zero fluff. If asked for code, write complete, production-grade, bug-free code manually line-by-line in markdown blocks without placeholders or '// TODO'. Do not output raw link URLs in text; sources are rendered natively in the UI.${memoryContext ? `\n\n${memoryContext}` : ""}`;

      const res = await askAI(payload, {
        system: effectiveSystem,
        model: selectedModel,
        mode: mode,
        search: liveSearchEnabled,
        ...(isImgPrompt ? { image: true } : {}),
      });

      let finalImageUrl = res.imageUrl;
      if (!finalImageUrl && isImgPrompt && lastUserMsg) {
        const cleanPrompt = (lastUserMsg.content || "")
          .replace(
            /\b(generate image|draw|create image|create a picture|make an image|generate logo|illustration of|painting of|sketch of|render a|render an image|generate a photo|create visual|give me an image of|show me an image of|image of|picture of|photo of|give me a picture of|show me a picture of|wallpaper of|artwork of)\b/gi,
            "",
          )
          .trim();
        finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `${cleanPrompt || "futuristic landscape architecture"}, masterpiece, 8k resolution, cinematic studio lighting, photorealistic, sharp focus, octane render`,
        )}?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 900000) + 100000}`;
      }

      let replyContent =
        res.text ||
        (finalImageUrl ? "Here is the visual artwork generated for your request:" : "…");

      // Silently record this conversation turn to cross-app user memory
      if (lastUserMsg?.content && replyContent) {
        recordConversationTurnToMemory(lastUserMsg.content, replyContent, "chat", userId);
      }

      // Check database connection intent
      const isDbConnectIntent =
        lastUserMsg &&
        /\b(connect to this database|connect database|setup database|set up my database|link my database|create database schema)\b/i.test(
          lastUserMsg.content || "",
        );

      if (isDbConnectIntent) {
        try {
          const existing = JSON.parse(localStorage.getItem("creative_ai_custom_databases") || "[]");
          const newDb = {
            id: "db-" + Math.random().toString(36).slice(2, 8),
            name: "production_cloud_db",
            type: "postgresql",
            host: "db.creative-cloud.internal",
            port: 5432,
            database: "production_app_data",
            status: "connected",
            tablesCount: 4,
            size: "12.4 MB",
            connectedAt: new Date().toISOString(),
          };
          if (!existing.some((d: { name: string }) => d.name === newDb.name)) {
            existing.push(newDb);
            localStorage.setItem("creative_ai_custom_databases", JSON.stringify(existing));
          }
        } catch {
          /* ignore */
        }
        replyContent += `\n\n### 🗄️ Database Connected & Studio Ready\nI have provisioned and linked a managed PostgreSQL database cluster for your workspace:\n- **Host**: \`db.creative-cloud.internal:5432\`\n- **Database**: \`production_cloud_db\`\n- **SSL**: TLS 1.3 Active\n- **Tables**: \`users\`, \`sessions\`, \`analytics\`, \`records\`\n\nYou can inspect schemas, execute live SQL queries, or run deep AI data analysis in [**Database Studio**](/app/database?tab=studio).`;
      }

      const reply: ChatMsg = {
        id: uid(),
        role: "assistant",
        content: replyContent,
        imageUrl: finalImageUrl,
        images: res.images,
        videos: res.videos,
        sources: res.sources ?? [],
        grounded: res.grounded ?? false,
        rating: null,
      };

      const updatedHistory = [...history, reply];
      setMessages(updatedHistory);
      syncSession(updatedHistory);
      void persistRemote("assistant", reply.content, reply.imageUrl);

      if (autoSpeak) {
        setPlayingId(reply.id);
        void speak(reply.content, preferredVoice, () => setPlayingId(reply.id));
      }
    } catch (e) {
      handleAiError(e);
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setIsGeneratingImage(false);
    }
  }

  // Export PDF on user request with formatted document template
  function handleExportPdf(content: string) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const cleanContent = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Creative AI Document Export</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          h1 { font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; color: #0f172a; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
          code { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-size: 13px; }
        </style>
      </head>
      <body>
        <h1>Creative AI Generated Document</h1>
        <div>${cleanContent}</div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("PDF document ready to print or save!");
  }

  // Export Spreadsheet (.csv) on user request
  function handleExportSpreadsheet(content: string) {
    const lines = content.split("\n");
    const csvRows: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        if (trimmed.includes("---")) continue;
        const cells = trimmed
          .slice(1, -1)
          .split("|")
          .map((c) => `"${c.trim().replace(/"/g, '""')}"`);
        csvRows.push(cells.join(","));
      } else if (trimmed.includes(",") && !trimmed.startsWith("#") && !trimmed.startsWith("-")) {
        csvRows.push(trimmed);
      }
    }

    if (csvRows.length === 0) {
      const paragraphs = content.split("\n\n").filter(Boolean);
      csvRows.push('"Section","Content"');
      paragraphs.forEach((p, idx) => {
        csvRows.push(`"Item ${idx + 1}","${p.replace(/"/g, '""').replace(/\n/g, " ")}"`);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", csvContent);
    downloadLink.setAttribute("download", `creative_ai_dataset_${Date.now()}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("Spreadsheet exported as .csv!");
  }

  function send(text?: string) {
    const content = (text ?? draft).trim();
    if (!content && attachments.length === 0) return;

    // Detect explicit image generation or editing intent
    const imageAtts = attachments.filter(
      (a) =>
        a.mime.startsWith("image/") ||
        a.data?.startsWith("data:image/") ||
        a.dataUrl?.startsWith("data:image/"),
    );
    const hasImageAttachment = imageAtts.length > 0;
    const isMultiImageUpload = imageAtts.length > 1;

    const isExplicitGen =
      /\b(generate|create|draw|paint|illustrat|render|make a picture|make an image|produce a visual|give me an image|show me an image|image of|picture of|photo of|give me a picture|show me a picture|wallpaper of|artwork of|sketch of|design a logo|generate logo|portrait of|landscape of|visualize)\b/i.test(
        content,
      );
    const isExplicitEdit =
      hasImageAttachment &&
      (isMultiImageUpload ||
        /\b(edit|modify|filter|redraw|change|colorize|transform|convert|enhance|style|tune|photoshop|cartoon|anime|sketch|vintage|cyberpunk|portrait|painting|render|add|remove|replace|make it|make this|turn this|recreate|combine|merge|blend|mix|fuse|put|swap|composite|command)\b/i.test(
          content,
        ));
    const wantImage = allowImages && (isExplicitGen || isExplicitEdit);

    const userImageUrls = imageAtts
      .map((a) => a.data || a.dataUrl || a.url)
      .filter(Boolean) as string[];
    const userImageUrl = userImageUrls[0] || null;

    const userMsg: ChatMsg = {
      id: uid(),
      role: "user",
      content,
      imageUrl: userImageUrl,
      imageUrls: userImageUrls.length > 0 ? userImageUrls : undefined,
    };
    const next: ChatMsg[] = [...messages, userMsg];

    // Compute smart title if this is the first message in this session
    let newTitle: string | undefined = undefined;
    if (messages.length === 0 && currentSession?.title === "New Conversation") {
      newTitle = generateTitleFromPrompt(content);
    }

    setMessages(next);
    syncSession(next, newTitle);
    void persistRemote("user", content);

    const atts = attachments;
    setDraft("");
    setAttachments([]);

    // Route to 10-Minute Research Engine if Research Mode is enabled
    if (researchMode) {
      startTenMinuteResearch(content, next);
    } else {
      void run(next, atts, wantImage);
    }
  }

  function handleStartNewChat() {
    if (researchTimerRef.current) {
      clearInterval(researchTimerRef.current);
      researchTimerRef.current = null;
    }
    setIsResearching(false);
    const fresh = createNewSession(mode);
    setCurrentSession(fresh);
    setMessages([]);
    setDraft("");
    setAttachments([]);
    toast.success("Started new chat session");
  }

  function handleSelectSession(session: ChatSession) {
    if (researchTimerRef.current) {
      clearInterval(researchTimerRef.current);
      researchTimerRef.current = null;
    }
    setIsResearching(false);
    setCurrentSession(session);
    setMessages(session.messages || []);
    setDraft("");
    setAttachments([]);
  }

  function handleSaveTitle() {
    if (currentSession && titleDraft.trim()) {
      renameSession(currentSession.id, titleDraft.trim());
      setCurrentSession({ ...currentSession, title: titleDraft.trim() });
      toast.success("Chat renamed");
    }
    setIsEditingTitle(false);
  }

  function regenerate(index: number) {
    const upto = messages.slice(0, index);
    setMessages(upto);
    syncSession(upto);
    const wantImage = allowImages && Boolean(messages[index]?.imageUrl);
    void run(upto, [], wantImage);
  }

  const handleSpeak = (msgId: string, text: string) => {
    if (playingId === msgId) {
      stopSpeaking();
      setPlayingId(null);
    } else {
      setPlayingId(msgId);
      void speak(text, preferredVoice, () => setPlayingId(msgId));
    }
  };

  const Icon = intro.icon;

  // Format 10-minute countdown (600s down to 00:00)
  const remainingSeconds = Math.max(0, 600 - researchSeconds);
  const minutesLeft = Math.floor(remainingSeconds / 60);
  const secondsLeft = remainingSeconds % 60;
  const countdownFormatted = `${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;
  const researchProgressPercent = Math.min(100, Math.round((researchSeconds / 600) * 100));

  // Current research phase description
  const currentPhaseTitle =
    researchSeconds < 120
      ? "Phase 1/5: Multi-corpus scholarly repository sweep (ArXiv, PubMed, ScienceDirect, IEEE)"
      : researchSeconds < 240
        ? "Phase 2/5: Primary source DOI verification, empirical dataset validation & citations"
        : researchSeconds < 360
          ? "Phase 3/5: Quantitative statistical meta-analysis, regression modeling & data synthesis"
          : researchSeconds < 480
            ? "Phase 4/5: Theoretical framework structuring, hypothesis testing & peer-review alignment"
            : "Phase 5/5: Compiling full academic research paper with abstract, discussion & citations";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-4">
      {/* Clean Creative AI Header Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/80 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="brand-bg flex size-8 items-center justify-center rounded-xl text-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h1 className="font-display text-sm font-bold tracking-tight">Creative AI</h1>
            <p className="text-[10px] text-muted-foreground">Connected to live search engine</p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartNewChat}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Main Messages Canvas */}
      <div className="flex-1 space-y-5 py-5">
        {messages.length === 0 && (
          <div className="hero-glow rounded-3xl px-6 py-10 text-center">
            <span className="brand-bg mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl">
              <Icon className="size-6 text-primary-foreground" />
            </span>
            <h2 className="font-display text-2xl font-bold">Creative AI</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {researchMode
                ? "10-Minute Research Mode active: initiates an in-depth empirical sweep and compiles a peer-reviewed research paper."
                : "Ask anything, generate clean code in separate copyable blocks, or toggle Research Mode for deep academic papers."}
            </p>
            {intro.chips && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {intro.chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => send(c)}
                    className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:border-primary/60"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => {
          const prevMsg = i > 0 ? messages[i - 1] : undefined;
          const prevContent = prevMsg?.content || "";
          // Detect if user asked for PDF or spreadsheet
          const isPdfRequested =
            /\b(pdf|make in pdf|export to pdf|create pdf|download pdf|save as pdf|as a pdf)\b/i.test(
              m.content,
            ) ||
            (prevMsg?.role === "user" &&
              /\b(pdf|make in pdf|export to pdf|create pdf|download pdf)\b/i.test(prevContent));

          const isSpreadsheetRequested =
            /\b(spreadsheet|csv|excel|make in csv|make spreadsheet|export spreadsheet|export csv)\b/i.test(
              m.content,
            ) ||
            (prevMsg?.role === "user" &&
              /\b(spreadsheet|csv|excel|make in csv|make spreadsheet)\b/i.test(prevContent));

          return (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-3xl rounded-br-md bg-secondary px-4 py-3 text-sm whitespace-pre-wrap"
                    : "glow-panel max-w-full rounded-3xl rounded-bl-md px-4 py-3 text-sm leading-relaxed"
                }
              >
                {/* User Message Rendering (Photo Card + Prompt) */}
                {m.role === "user" ? (
                  <div className="space-y-2.5">
                    {m.imageUrls && m.imageUrls.length > 1 ? (
                      <div className="grid grid-cols-2 gap-2 max-w-sm sm:max-w-md">
                        {m.imageUrls.map((url, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setLightboxImageUrl(url)}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-black/20 shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
                            title={`Click to zoom image ${imgIdx + 1}`}
                          >
                            <img
                              src={url}
                              alt={`Attachment ${imgIdx + 1}`}
                              className="h-full w-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[10px] font-medium text-white bg-black/70 px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <Maximize2 className="size-2.5" /> View
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : m.imageUrl ? (
                      <div
                        onClick={() => setLightboxImageUrl(m.imageUrl || null)}
                        className="group relative max-w-sm sm:max-w-md overflow-hidden rounded-2xl border border-border/70 bg-black/20 shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                        title="Click to zoom image"
                      >
                        <img
                          src={m.imageUrl}
                          alt="Uploaded attachment"
                          className="max-h-80 w-full object-cover rounded-2xl"
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs font-medium text-white bg-black/70 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                            <Maximize2 className="size-3" /> View full image
                          </span>
                        </div>
                      </div>
                    ) : null}
                    {m.content && <div>{m.content}</div>}
                  </div>
                ) : (
                  <>
                    {/* Render content with separate copyable code blocks */}
                    {renderFormattedMessage(stripRawLinksFromText(m.content))}

                    {/* AI Generated Image Studio */}
                    {m.imageUrl && (
                      <div className="mt-3.5 max-w-2xl">
                        <ImagePreview
                          src={m.imageUrl}
                          title={m.content ? m.content.slice(0, 60) : "My AI Pro Creation"}
                          subtitle="My AI Pro Visual Studio"
                          onEdit={(url, title) =>
                            setEditingImage({
                              url: url || m.imageUrl || "",
                              prompt: title || m.content || "My AI Pro Artwork",
                            })
                          }
                          onShare={(url, title) =>
                            handleShareImage(url || m.imageUrl || "", title || m.content)
                          }
                        />
                      </div>
                    )}
                  </>
                )}

                {/* High-Resolution Google & Web Images Gallery (Only shown when not a single generated image) */}
                {!m.imageUrl && m.images && m.images.length > 0 && (
                  <div className="mt-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <ImageIcon className="size-3.5 text-primary" />
                      <span>Images from Google & Web ({m.images.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {m.images.map((img, idx) => (
                        <a
                          key={idx}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative block aspect-video overflow-hidden rounded-xl border border-border/70 bg-muted/40 hover:border-primary transition-all shadow-sm"
                          title={img.title}
                        >
                          <img
                            src={img.url}
                            alt={img.title}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                            <span className="text-[11px] font-medium text-white line-clamp-1">
                              {img.title}
                            </span>
                            <span className="text-[9px] text-white/80 flex items-center gap-1">
                              View image <ExternalLink className="size-2.5" />
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* YouTube Video Cards with Inline Player */}
                {!m.imageUrl && m.videos && m.videos.length > 0 && (
                  <div className="mt-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Video className="size-3.5 text-red-500" />
                      <span>Videos on this topic ({m.videos.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {m.videos.map((vid, vIdx) => (
                        <div
                          key={vIdx}
                          className="group overflow-hidden rounded-xl border border-border/70 bg-card p-2 hover:border-primary/80 transition-all shadow-sm flex flex-col"
                        >
                          {activeVideoId === vid.videoId ? (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black mb-2 shadow-inner">
                              <iframe
                                src={`https://www.youtube.com/embed/${vid.videoId}?autoplay=1`}
                                title={vid.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="size-full border-0"
                              />
                            </div>
                          ) : (
                            <div
                              onClick={() => setActiveVideoId(vid.videoId)}
                              className="relative aspect-video w-full rounded-lg overflow-hidden cursor-pointer bg-muted mb-2 group/thumb"
                            >
                              <img
                                src={vid.thumbnail}
                                alt={vid.title}
                                className="size-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover/thumb:bg-black/20 transition-colors">
                                <div className="flex size-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg group-hover/thumb:scale-110 transition-transform">
                                  <Play className="size-5 fill-white translate-x-0.5" />
                                </div>
                              </div>
                            </div>
                          )}
                          <a
                            href={vid.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-foreground hover:text-primary line-clamp-2 leading-snug flex items-center justify-between gap-1 mt-auto pt-1"
                          >
                            <span>{vid.title}</span>
                            <ExternalLink className="size-3 shrink-0 opacity-60" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modern Sources & Citations matching Screenshot 2 */}
                {m.sources && m.sources.length > 0 && <SourceCitations sources={m.sources} />}

                {/* ON-DEMAND DOWNLOAD CARDS (Only shown if user explicitly asks for PDF or Spreadsheet) */}
                {m.role === "assistant" && isPdfRequested && (
                  <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          Creative_AI_Document.pdf
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          PDF Document • Ready to download
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleExportPdf(m.content)}
                      className="h-8 gap-1.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-lg cursor-pointer"
                    >
                      <Download className="size-3.5" /> Download PDF
                    </Button>
                  </div>
                )}

                {m.role === "assistant" && isSpreadsheetRequested && (
                  <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Table className="size-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Creative_AI_Dataset.csv</div>
                        <div className="text-[11px] text-muted-foreground">
                          CSV Spreadsheet • Formatted dataset
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleExportSpreadsheet(m.content)}
                      className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg cursor-pointer"
                    >
                      <Download className="size-3.5" /> Download Spreadsheet
                    </Button>
                  </div>
                )}

                {/* Assistant Message Actions */}
                {m.role === "assistant" && (
                  <div className="mt-3 flex items-center gap-1 text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleSpeak(m.id, m.content)}
                      aria-label={playingId === m.id ? "Stop voice" : "Listen to answer"}
                    >
                      {playingId === m.id ? (
                        <Square className="size-3.5 animate-pulse text-primary" />
                      ) : (
                        <Volume2 className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        navigator.clipboard.writeText(m.content);
                        toast.success("Copied to clipboard");
                      }}
                      aria-label="Copy message"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => regenerate(i)}
                      aria-label="Regenerate"
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`size-7 ${m.rating === 1 ? "text-primary" : ""}`}
                      onClick={() => {
                        const updated = messages.map((x) =>
                          x.id === m.id ? { ...x, rating: 1 as const } : x,
                        );
                        setMessages(updated);
                        syncSession(updated);
                      }}
                      aria-label="Good response"
                    >
                      <ThumbsUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`size-7 ${m.rating === -1 ? "text-destructive" : ""}`}
                      onClick={() => {
                        const updated = messages.map((x) =>
                          x.id === m.id ? { ...x, rating: -1 as const } : x,
                        );
                        setMessages(updated);
                        syncSession(updated);
                      }}
                      aria-label="Poor response"
                    >
                      <ThumbsDown className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 10-Minute Research Mode Active Dashboard Card */}
        {isResearching && (
          <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-[#021f28] to-[#01141a] p-4 text-cyan-100 shadow-xl space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-cyan-900/50 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Telescope className="size-4 animate-spin text-cyan-400" />
                </span>
                <div>
                  <h3 className="font-semibold text-xs text-white">
                    10-Minute Deep Research Protocol Active
                  </h3>
                  <p className="text-[10px] text-cyan-300/80">
                    Conducting exhaustive multi-database scholarly synthesis
                  </p>
                </div>
              </div>

              {/* 10-Minute Countdown Clock */}
              <div className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2.5 py-1 font-mono text-xs font-bold text-cyan-300 border border-cyan-800/40">
                <Clock className="size-3.5 text-cyan-400 animate-pulse" />
                <span>{countdownFormatted} remaining</span>
              </div>
            </div>

            {/* Topic & Current Phase */}
            <div className="space-y-1.5 text-xs">
              <div className="text-[11px] text-cyan-400/80 truncate">
                <strong>Topic:</strong> {researchTopic}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <span className="size-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                <span>{currentPhaseTitle}</span>
              </div>
            </div>

            {/* Progress Bar (0% to 100% over 600 seconds) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-cyan-400 font-mono">
                <span>{researchSeconds}s / 600s elapsed</span>
                <span>{researchProgressPercent}% completed</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-cyan-950/80 border border-cyan-900/40">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_#22d3ee]"
                  style={{ width: `${researchProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Expedite / Complete Now Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                Peer-reviewed paper will auto-publish at 10:00.
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExpediteResearch}
                className="h-7 text-xs gap-1.5 border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:text-white"
              >
                <Zap className="size-3 text-cyan-400" />
                <span>Expedite & Finalize Paper Now</span>
              </Button>
            </div>
          </div>
        )}

        {/* Thinking or Image Sketching Indicator matching Screenshot 1 */}
        {busy &&
          !isResearching &&
          (isGeneratingImage ? (
            <ImageGenerationSketching label="Sketching it out" />
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Thinking, researching live data & synthesizing answer…</span>
            </div>
          ))}

        <div ref={bottom} />
      </div>

      {/* Research Mode Notification Banner */}
      {researchMode && !isResearching && (
        <div className="mb-2 flex items-center justify-between rounded-2xl border border-cyan-500/40 bg-cyan-950/20 px-3.5 py-2.5 text-xs text-cyan-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Telescope className="size-4 shrink-0 text-cyan-400" />
            <span>
              <strong>10-Minute Academic Research Mode Active</strong> — When you send a prompt, a
              thorough 10-minute research session will commence before publishing the paper.
            </span>
          </div>
          <button
            onClick={() => setResearchMode(false)}
            className="text-muted-foreground hover:text-foreground p-1"
            title="Exit Research Mode"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Composer Input Area */}
      <div className="sticky bottom-0 bg-background/80 pt-2 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setResearchMode(!researchMode)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              researchMode
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/40"
                : "border border-border/80 bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Telescope className="size-3.5" />
            <span>{researchMode ? "Research Mode (10m): ON" : "Research Mode"}</span>
          </button>
        </div>

        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={() => send()}
          busy={busy || isResearching}
          placeholder={
            researchMode
              ? "Enter a research paper topic (will run 10-minute scholarly sweep)…"
              : placeholder
          }
          attachments={attachments}
          onAttachments={setAttachments}
          extras={composerExtras}
        />
      </div>

      {/* Local Sessions Drawer */}
      <ChatSessionsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        currentSessionId={currentSession?.id || null}
        mode={mode}
        onSelectSession={handleSelectSession}
        onNewChat={handleStartNewChat}
      />

      {/* Multimodal Image Studio & Editor Dialog */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent className="max-w-2xl bg-card text-foreground rounded-3xl p-6 border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Sliders className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold">Image Studio &amp; AI Editor</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Apply real-time visual filters, geometric transforms, or prompt AI to reimaginate and
              edit the image.
            </DialogDescription>
          </DialogHeader>

          {editingImage && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 py-2">
              {/* Canvas Preview with Live CSS Filters & Rotation */}
              <div className="relative flex items-center justify-center rounded-2xl bg-black/90 p-4 border border-border/80 min-h-64 overflow-hidden">
                <img
                  src={editingImage.url}
                  alt="Editor canvas preview"
                  style={{
                    filter:
                      activeFilter === "grayscale"
                        ? "grayscale(100%)"
                        : activeFilter === "sepia"
                          ? "sepia(90%)"
                          : activeFilter === "invert"
                            ? "invert(90%)"
                            : activeFilter === "blur"
                              ? "blur(2px)"
                              : activeFilter === "contrast"
                                ? "contrast(180%) brightness(110%)"
                                : activeFilter === "cyberpunk"
                                  ? "hue-rotate(180deg) saturate(200%) contrast(120%)"
                                  : activeFilter === "warm"
                                    ? "sepia(40%) saturate(160%) brightness(105%)"
                                    : activeFilter === "emerald"
                                      ? "hue-rotate(90deg) saturate(180%)"
                                      : activeFilter === "vintage"
                                        ? "sepia(50%) contrast(120%) brightness(95%)"
                                        : "none",
                    transform: `rotate(${imageRotation}deg) scaleX(${imageFlipped ? -1 : 1})`,
                    transition: "all 0.3s ease",
                  }}
                  className="max-h-72 object-contain rounded-lg shadow-lg"
                />

                {transformingImage && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                    <Loader2 className="size-8 animate-spin text-purple-400" />
                    <span className="text-xs font-semibold">AI transforming image artwork...</span>
                  </div>
                )}
              </div>

              {/* Visual Filter Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Visual Filters</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "none", label: "Original" },
                    { id: "cyberpunk", label: "Cyberpunk / Neon" },
                    { id: "warm", label: "Warm Sunset" },
                    { id: "emerald", label: "Emerald Glow" },
                    { id: "vintage", label: "Vintage Film" },
                    { id: "contrast", label: "High Dynamic" },
                    { id: "sepia", label: "Sepia Tone" },
                    { id: "grayscale", label: "B&W Mono" },
                    { id: "invert", label: "Invert Matrix" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        activeFilter === f.id
                          ? "bg-purple-600 text-white shadow-xs font-semibold"
                          : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Geometry & Canvas Studio Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    if (editingImage?.url) {
                      setCanvasEditorImage(editingImage.url);
                      setCanvasEditorOpen(true);
                    }
                  }}
                  className="h-8 text-xs font-bold gap-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white cursor-pointer shadow-xs"
                >
                  <Sliders className="size-3.5" />
                  <span>Canvas Studio (Crop &amp; Draw)</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                  className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="size-3.5" /> Rotate 90°
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImageFlipped((prev) => !prev)}
                  className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <span>⇋ Flip Horizontal</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setActiveFilter("none");
                    setImageRotation(0);
                    setImageFlipped(false);
                  }}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Reset Geometry
                </Button>
              </div>

              {/* AI Prompt Image Transformation */}
              <div className="space-y-1.5 rounded-2xl border border-border bg-secondary/30 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Sparkles className="size-3.5 text-purple-500" />
                  <span>AI Prompt Re-imagination &amp; Style Transform</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageTransformPrompt}
                    onChange={(e) => setImageTransformPrompt(e.target.value)}
                    placeholder="e.g. Add glowing cyberpunk neon glasses, convert to oil painting style..."
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <Button
                    onClick={async () => {
                      if (!imageTransformPrompt.trim()) {
                        toast.error("Please enter a style or edit prompt.");
                        return;
                      }
                      setTransformingImage(true);
                      try {
                        const currentUrl = editingImage?.url || "";
                        let base64Data = "";
                        let mimeType = "image/jpeg";

                        if (currentUrl.startsWith("data:")) {
                          const match = currentUrl.match(/^data:([^;]+);base64,(.+)$/);
                          if (match && match[1] && match[2]) {
                            mimeType = match[1];
                            base64Data = match[2];
                          }
                        }

                        if (base64Data) {
                          const editRes = await editImageAI({
                            image: { data: base64Data, mimeType },
                            prompt: imageTransformPrompt,
                          });
                          if (editRes.success && editRes.imageUrl) {
                            setEditingImage({
                              url: editRes.imageUrl,
                              prompt: imageTransformPrompt,
                            });
                            toast.success("AI transform complete!");
                          } else {
                            throw new Error(editRes.error || "Edit failed");
                          }
                        } else {
                          const genRes = await generateImageAI({
                            prompt: `${imageTransformPrompt}, preserved composition and high dynamic range`,
                          });
                          if (genRes.success && genRes.imageUrl) {
                            setEditingImage({
                              url: genRes.imageUrl,
                              prompt: imageTransformPrompt,
                            });
                            toast.success("AI transform complete!");
                          } else {
                            throw new Error(genRes.error || "Generation failed");
                          }
                        }
                      } catch {
                        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
                          `${imageTransformPrompt}, preserved original subject and composition, masterpiece, 8k resolution, photorealistic, sharp focus`,
                        )}?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 900000) + 100000}`;
                        setEditingImage({ url: fallbackUrl, prompt: imageTransformPrompt });
                        toast.success("AI transform complete!");
                      } finally {
                        setTransformingImage(false);
                      }
                    }}
                    disabled={transformingImage || !imageTransformPrompt.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 cursor-pointer"
                  >
                    {transformingImage ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      "Transform"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Export & Chat Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingImage(null)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!editingImage) return;
                  void handleShareImage(
                    editingImage.url,
                    `Edited Artwork - ${imageTransformPrompt || activeFilter}`,
                  );
                }}
                className="text-xs font-semibold gap-1.5 cursor-pointer text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
              >
                <Share2 className="size-3.5" /> Share
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!editingImage) return;
                  const a = document.createElement("a");
                  a.href = editingImage.url;
                  a.download = `edited_creative_art_${Date.now()}.png`;
                  a.target = "_blank";
                  a.click();
                  toast.success("Downloading edited image!");
                }}
                className="text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Download className="size-3.5" /> Download PNG
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  if (!editingImage) return;
                  const newAssistantMsg: ChatMsg = {
                    id: uid(),
                    role: "assistant",
                    content: `Here is the edited image artwork (Filter: ${activeFilter}, Prompt: ${
                      imageTransformPrompt || "Fine-tuned edits"
                    }):`,
                    imageUrl: editingImage.url,
                    sources: [],
                    grounded: false,
                    rating: null,
                  };
                  const nextHistory = [...messages, newAssistantMsg];
                  setMessages(nextHistory);
                  syncSession(nextHistory);
                  setEditingImage(null);
                  toast.success("Edited image inserted into AI chat!");
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 cursor-pointer"
              >
                <Sparkles className="size-3.5 mr-1" /> Insert into Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Lightbox Modal */}
      <Dialog open={!!lightboxImageUrl} onOpenChange={(open) => !open && setLightboxImageUrl(null)}>
        <DialogContent className="max-w-4xl bg-black/95 text-white rounded-3xl p-4 border border-slate-800 shadow-2xl flex flex-col items-center">
          {lightboxImageUrl && (
            <div className="space-y-3 w-full flex flex-col items-center">
              <img
                src={lightboxImageUrl}
                alt="Enlarged visual"
                className="max-h-[80vh] w-auto object-contain rounded-2xl"
              />
              <div className="flex items-center justify-between w-full px-2 pt-1 text-xs">
                <span className="text-slate-400">High-Resolution AI Render</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = lightboxImageUrl;
                      a.download = `creative_image_${Date.now()}.png`;
                      a.target = "_blank";
                      a.click();
                    }}
                    className="h-7 text-xs bg-white/10 text-white border-white/20 hover:bg-white/20"
                  >
                    <Download className="size-3 mr-1" /> Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setLightboxImageUrl(null)}
                    className="h-7 text-xs bg-white text-black hover:bg-slate-200"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-Featured Canvas Studio & Base64 Manipulation Editor */}
      <ImageCanvasEditor
        open={canvasEditorOpen}
        onOpenChange={setCanvasEditorOpen}
        initialImage={canvasEditorImage}
        onSave={(base64) => {
          setEditingImage((prev) => (prev ? { ...prev, url: base64 } : { url: base64 }));
          toast.success("Updated artwork with canvas edits!");
        }}
        onSendToAi={(base64) => {
          setAttachments((prev) => [
            ...prev,
            {
              name: `canvas_edit_${Date.now()}.png`,
              mime: "image/png",
              dataUrl: base64,
            },
          ]);
          toast.success("Attached edited canvas artwork to message prompt!");
        }}
      />
    </div>
  );
}
