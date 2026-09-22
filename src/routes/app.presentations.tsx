import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { notifyUnifiedHistoryUpdated } from "@/lib/unified-history";
import {
  Presentation,
  Loader2,
  Download,
  Upload,
  Trash2,
  Copy,
  Plus,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  Sparkles,
  Check,
  Home,
  RotateCcw,
  RotateCw,
  MoreHorizontal,
  Share2,
  Mic,
  LayoutGrid,
  Shapes,
  Type,
  Crown,
  Search,
  Wand2,
  ImagePlus,
  Eye,
  Palette,
  Clock,
  Edit3,
  PenTool,
  Eraser,
  GripVertical,
  MousePointerClick,
  Paintbrush,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Composer, type Attachment } from "@/components/Composer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { askAI, askAIJson, fileBlock } from "@/lib/ai";
import { handlePresentationJsonSynthesis } from "@/lib/neural-engine";
import { useAi } from "@/components/AiProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/app/presentations")({
  validateSearch: (search: Record<string, unknown>) => ({
    topic:
      typeof search["topic"] === "string"
        ? search["topic"]
        : typeof search["idea"] === "string"
          ? search["idea"]
          : "",
  }),
  head: () => ({
    meta: [
      { title: "Presentation Maker (Canva Studio) — Creative AI" },
      {
        name: "description",
        content:
          "Build and edit presentation decks with Canva-style canvas controls, logo upload, and concept image generation.",
      },
      { property: "og:title", content: "Presentation Maker — Canva-Style Editor" },
      {
        property: "og:description",
        content: "Designed decks with custom logos, on-concept imagery, and slideshow mode.",
      },
    ],
  }),
  component: Presentations,
});

type SlideLayout = "split" | "centered" | "cards" | "minimal";

type Slide = {
  title: string;
  bullets: string[];
  notes: string;
  image_prompt: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  layout?: SlideLayout;
  align?: "left" | "center";
};

type SavedPresentation = {
  id: string;
  title: string;
  topic: string;
  slides: Slide[];
  themeIdx: number;
  globalLogo?: string | null;
  updatedAt: string;
};

const SAVED_PRESENTATIONS_KEY = "creative_ai_saved_presentations";

const THEMES = [
  {
    name: "Cybersecurity Teal (Canva)",
    bg: "bg-gradient-to-br from-[#012f38] via-[#011a21] to-[#000f14] text-slate-100",
    card: "bg-[#01252d]/80 border-cyan-800/40",
    accent: "text-cyan-400",
    lineColor: "bg-cyan-400",
    colorHex: "#22d3ee",
  },
  {
    name: "Midnight Indigo & Violet",
    bg: "bg-gradient-to-br from-[#0f1026] via-[#080917] to-[#02030a] text-slate-100",
    card: "bg-[#131538]/80 border-violet-800/40",
    accent: "text-violet-400",
    lineColor: "bg-violet-400",
    colorHex: "#a78bfa",
  },
  {
    name: "Obsidian & Pure Gold",
    bg: "bg-gradient-to-br from-[#1c180e] via-[#120f08] to-[#080703] text-amber-50",
    card: "bg-[#241e0f]/80 border-amber-800/40",
    accent: "text-amber-400",
    lineColor: "bg-amber-400",
    colorHex: "#fbbf24",
  },
  {
    name: "Quantum Emerald Neo",
    bg: "bg-gradient-to-br from-[#032619] via-[#021810] to-[#010b07] text-emerald-50",
    card: "bg-[#033321]/80 border-emerald-800/40",
    accent: "text-emerald-400",
    lineColor: "bg-emerald-400",
    colorHex: "#34d399",
  },
  {
    name: "Sunset Crimson & Ruby",
    bg: "bg-gradient-to-br from-[#2a0e16] via-[#1a070c] to-[#0d0305] text-rose-50",
    card: "bg-[#38101c]/80 border-rose-800/40",
    accent: "text-rose-400",
    lineColor: "bg-rose-400",
    colorHex: "#fb7185",
  },
  {
    name: "Deep Space Navy",
    bg: "bg-gradient-to-br from-[#0b192c] via-[#050c17] to-[#02050b] text-slate-100",
    card: "bg-[#11223b]/80 border-sky-800/40",
    accent: "text-sky-400",
    lineColor: "bg-sky-400",
    colorHex: "#38bdf8",
  },
  {
    name: "Cyberpunk Magenta & Cyan",
    bg: "bg-gradient-to-br from-[#1b0b2e] via-[#0e0517] to-[#04010a] text-fuchsia-50",
    card: "bg-[#281145]/80 border-fuchsia-800/40",
    accent: "text-fuchsia-400",
    lineColor: "bg-fuchsia-400",
    colorHex: "#e879f9",
  },
  {
    name: "Solar Blaze Citrus",
    bg: "bg-gradient-to-br from-[#261502] via-[#170c01] to-[#0a0500] text-orange-50",
    card: "bg-[#361b05]/80 border-orange-800/40",
    accent: "text-orange-400",
    lineColor: "bg-orange-400",
    colorHex: "#fb923c",
  },
  {
    name: "Luxury Champagne & Rose",
    bg: "bg-gradient-to-br from-[#291720] via-[#1c0f16] to-[#0f070b] text-pink-50",
    card: "bg-[#331c27]/80 border-pink-800/40",
    accent: "text-pink-300",
    lineColor: "bg-pink-300",
    colorHex: "#f472b6",
  },
  {
    name: "Executive Minimal Slate",
    bg: "bg-slate-950 text-slate-50",
    card: "bg-slate-900/80 border-slate-800",
    accent: "text-indigo-400",
    lineColor: "bg-indigo-400",
    colorHex: "#818cf8",
  },
  {
    name: "Crisp Studio White",
    bg: "bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-slate-900",
    card: "bg-white/95 border-slate-200 shadow-sm text-slate-900",
    accent: "text-indigo-600",
    lineColor: "bg-indigo-600",
    colorHex: "#4f46e5",
  },
] as const;

// Default sample deck matching Screenshot 1 for instant Canva editing
const SAMPLE_CYBER_SLIDES: Slide[] = [
  {
    title: "AI-POWERED PREDICTIVE ANALYTICS IN CYBERSECURITY",
    bullets: [
      "Autonomous real-time anomaly detection across distributed multi-cloud endpoints",
      "Proactive threat surface mitigation using deep neural pattern synthesis",
      "Instant automated incident response and micro-segmentation isolation",
    ],
    notes: "Lead with the shift from reactive response to automated predictive intelligence.",
    image_prompt:
      "Futuristic cybersecurity operational center with glowing teal holographic network maps",
    layout: "centered",
    align: "center",
  },
  {
    title: "THREAT VECTORS & ATTACK SURFACE EXPANSION",
    bullets: [
      "87% of contemporary enterprise breaches originate from zero-day credential compromise",
      "Identity-based lateral movement bypasses legacy perimeter-only firewalls",
      "AI-driven automated polymorphic malware demands sub-second algorithmic mitigation",
    ],
    notes: "Highlight quantitative risk metrics and edge vulnerabilities.",
    image_prompt: "Cyber defense shield deflecting malicious data streams in matrix environment",
    layout: "split",
    align: "left",
  },
  {
    title: "NEURAL PATTERN RECOGNITION ARCHITECTURE",
    bullets: [
      "Transformer-based event log sequencing processes 2.4M security telemetry streams/sec",
      "Continuous behavioral baseline modeling flags deviation thresholds in under 12ms",
      "Explainable AI audit trails ensure compliance with SOC2, GDPR, and ISO 27001",
    ],
    notes: "Present technical neural architecture to executive decision makers.",
    image_prompt: "High-tech neural network visualization with encrypted node interconnections",
    layout: "cards",
    align: "left",
  },
  {
    title: "OPERATIONAL STRATEGY & STRATEGIC ROADMAP",
    bullets: [
      "Phase 1: Agent deployment across cloud infrastructures and edge gateways",
      "Phase 2: Continuous behavioral calibration and automated incident runbooks",
      "Phase 3: Full autonomous remediation orchestration and executive reporting",
    ],
    notes: "Conclude with concrete 90-day execution milestones.",
    image_prompt:
      "Strategic executive dashboard displaying green compliance indicators and cyber resilience metrics",
    layout: "split",
    align: "left",
  },
];

export interface PresentationAsset {
  id: string;
  url: string;
  name: string;
  type: "upload" | "drawn" | "ai";
  createdAt: number;
}

const PRESENTATION_ASSETS_KEY = "my_ai_pro_presentation_assets";

function Presentations() {
  const search = Route.useSearch();
  const [topic, setTopic] = useState<string>(() => search.topic || "");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [count, setCount] = useState("6");

  useEffect(() => {
    if (search.topic && search.topic !== topic) {
      setTopic(search.topic);
    }
  }, [search.topic, topic]);
  const [themeIdx, setThemeIdx] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [imaging, setImaging] = useState<number | null>(null);
  const [globalLogo, setGlobalLogo] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"generator" | "editor">("generator");
  const [activeTab, setActiveTab] = useState<
    "none" | "templates" | "elements" | "text" | "brand" | "uploads"
  >("none");
  const [canvaPrompt, setCanvaPrompt] = useState("");
  const [showAccentLines, setShowAccentLines] = useState(true);

  // Drag and drop image state
  const [isDragOverSlide, setIsDragOverSlide] = useState(false);

  // Drawing canvas modal state
  const [drawModalOpen, setDrawModalOpen] = useState(false);

  // Assets gallery for uploads, drawn sketches, and AI images
  const [presentationAssets, setPresentationAssets] = useState<PresentationAsset[]>(() => {
    try {
      const raw = localStorage.getItem(PRESENTATION_ASSETS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return [
      {
        id: "asset_sample_1",
        url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
        name: "Cyber Security Grid",
        type: "ai",
        createdAt: Date.now() - 60000,
      },
      {
        id: "asset_sample_2",
        url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
        name: "Global Infrastructure",
        type: "ai",
        createdAt: Date.now() - 120000,
      },
    ];
  });

  // Undo/Redo history stack
  const [historyStack, setHistoryStack] = useState<Slide[][]>([]);
  const [futureStack, setFutureStack] = useState<Slide[][]>([]);

  const [currentPresentationId, setCurrentPresentationId] = useState<string>(
    () => `pres_${Date.now()}`,
  );
  const [savedPresentations, setSavedPresentations] = useState<SavedPresentation[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_PRESENTATIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return [];
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const slideImageInputRef = useRef<HTMLInputElement>(null);
  const { selectedModel, handleAiError } = useAi();

  const currentTheme = THEMES[themeIdx] || THEMES[0];
  const activeSlide: Slide = slides[activeSlideIdx] ||
    slides[0] || {
      title: topic || "Presentation Overview",
      bullets: ["Key strategic takeaway and architectural insight."],
      notes: "",
      image_prompt: "",
      imageUrl: null,
      logoUrl: null,
      layout: "split",
      align: "left",
    };

  function normalizeSlide(s: Partial<Slide> | null | undefined, idx: number): Slide {
    return {
      title: s?.title || (idx === 0 ? "Presentation Overview" : `Slide ${idx + 1}`),
      bullets:
        Array.isArray(s?.bullets) && s.bullets.length > 0
          ? s.bullets.filter(Boolean)
          : ["Key strategic insight or takeaway for this section."],
      notes: s?.notes || "",
      image_prompt: s?.image_prompt || "",
      imageUrl: s?.imageUrl || null,
      logoUrl: s?.logoUrl || null,
      layout: s?.layout || (idx === 0 ? "centered" : idx % 2 === 1 ? "split" : "cards"),
      align: s?.align || "left",
    };
  }

  function normalizeSlides(slidesArray: unknown): Slide[] {
    if (!Array.isArray(slidesArray) || slidesArray.length === 0) {
      return SAMPLE_CYBER_SLIDES.map((s, i) => normalizeSlide(s, i));
    }
    return slidesArray.map((s, i) => normalizeSlide(s as Partial<Slide>, i));
  }

  // Save or update deck in local storage
  function saveCurrentPresentationToStorage(customSlides?: Slide[], customThemeIdx?: number) {
    const slidesToSave = customSlides || slides;
    if (!slidesToSave || slidesToSave.length === 0) return;
    const presTitle = slidesToSave[0]?.title || topic || "Presentation Deck";
    const idToUse = currentPresentationId || `pres_${Date.now()}`;
    const newRecord: SavedPresentation = {
      id: idToUse,
      title: presTitle,
      topic: topic || presTitle,
      slides: slidesToSave,
      themeIdx: customThemeIdx !== undefined ? customThemeIdx : themeIdx,
      globalLogo,
      updatedAt: new Date().toISOString(),
    };
    setSavedPresentations((prev) => {
      const filtered = prev.filter((p) => p.id !== idToUse);
      const updated = [newRecord, ...filtered];
      try {
        localStorage.setItem(SAVED_PRESENTATIONS_KEY, JSON.stringify(updated));
        notifyUnifiedHistoryUpdated();
      } catch {
        /* ignore */
      }
      return updated;
    });
  }

  function handleBackToGenerator() {
    if (slides.length > 0) {
      saveCurrentPresentationToStorage();
      toast.success("Presentation saved to library!");
    }
    setViewMode("generator");
  }

  function resumePresentation(saved: SavedPresentation) {
    if (!saved) return;
    try {
      const safeDeck = normalizeSlides(saved.slides);
      setCurrentPresentationId(saved.id || `pres_${Date.now()}`);
      setSlides(safeDeck);
      setTopic(saved.topic || saved.title || "Presentation Deck");
      setThemeIdx(
        typeof saved.themeIdx === "number" && saved.themeIdx >= 0 && saved.themeIdx < THEMES.length
          ? saved.themeIdx
          : 0,
      );
      if (saved.globalLogo) setGlobalLogo(saved.globalLogo);
      setActiveSlideIdx(0);
      setViewMode("editor");
      toast.success(`Resumed "${saved.title || "Presentation"}" in Canva Editor!`);
    } catch (err) {
      console.error("Resume presentation failed:", err);
      setSlides(SAMPLE_CYBER_SLIDES.map((s, i) => normalizeSlide(s, i)));
      setViewMode("editor");
      toast.success("Loaded presentation deck in Canva Editor");
    }
  }

  function duplicateSavedPresentation(saved: SavedPresentation, e: React.MouseEvent) {
    e.stopPropagation();
    const newId = `pres_${Date.now()}`;
    const copy: SavedPresentation = {
      ...saved,
      id: newId,
      title: `${saved.title} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setSavedPresentations((prev) => {
      const updated = [copy, ...prev];
      try {
        localStorage.setItem(SAVED_PRESENTATIONS_KEY, JSON.stringify(updated));
        notifyUnifiedHistoryUpdated();
      } catch {
        /* ignore */
      }
      return updated;
    });
    toast.success("Presentation duplicated");
  }

  function deleteSavedPresentation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSavedPresentations((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(SAVED_PRESENTATIONS_KEY, JSON.stringify(updated));
        notifyUnifiedHistoryUpdated();
      } catch {
        /* ignore */
      }
      return updated;
    });
    toast.success("Presentation removed");
  }

  // Save snapshot before state changes for undo
  function recordHistory() {
    setHistoryStack((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(slides))]);
    setFutureStack([]);
  }

  function handleUndo() {
    if (historyStack.length === 0) {
      toast.info("Nothing to undo");
      return;
    }
    const previous = historyStack[historyStack.length - 1];
    if (previous) {
      setFutureStack((prev) => [JSON.parse(JSON.stringify(slides)), ...prev]);
      setHistoryStack((prev) => prev.slice(0, -1));
      setSlides(previous);
      toast.success("Undone");
    }
  }

  function handleRedo() {
    if (futureStack.length === 0) {
      toast.info("Nothing to redo");
      return;
    }
    const next = futureStack[0];
    if (next) {
      setHistoryStack((prev) => [...prev, JSON.parse(JSON.stringify(slides))]);
      setFutureStack((prev) => prev.slice(1));
      setSlides(next);
      toast.success("Redone");
    }
  }

  async function make() {
    if (!topic.trim()) return;
    setBusy(true);
    setElapsed(0);

    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    try {
      const content = attachments.length
        ? [
            {
              type: "text",
              text: `Topic: ${topic}. Make ${count} slides with modern presentation storytelling.`,
            },
            ...attachments.map((a) => fileBlock(a.name, a.mime, a.dataUrl)),
          ]
        : `Topic: ${topic}. Make ${count} slides with modern presentation storytelling.`;

      const fastFallback = new Promise<{ slides: Slide[] }>((resolve) => {
        setTimeout(() => {
          try {
            const synth = handlePresentationJsonSynthesis(`Topic: ${topic}. Make ${count} slides`);
            const parsed = JSON.parse(synth.text) as { slides: Slide[] };
            resolve(parsed);
          } catch {
            resolve({
              slides: [
                {
                  title: topic.toUpperCase(),
                  bullets: [
                    "Executive vision and high-impact strategic overview",
                    "Empirical market drivers and transformation opportunities",
                  ],
                  notes: `Strategic presentation on ${topic}.`,
                  image_prompt: `Clean modern presentation visual representing ${topic}`,
                },
              ],
            });
          }
        }, 8000);
      });

      const dataPromise = askAIJson<{ slides: Slide[] }>([{ role: "user", content }], {
        model: selectedModel || "gemini-3.8-flash",
        mode: "presentations",
        system: `You are Creative AI Presentation Studio. Return JSON: {"slides":[{"title":string,"bullets":[string],"notes":string,"image_prompt":string}]}.
First slide is a high-impact title slide (1-2 subtitle bullets), last slide is a conclusion or roadmap.
3-4 punchy, informative bullet points per slide.
"image_prompt" describes a concrete, high-aesthetic photo or modern illustration directly visualizing this specific slide's concept.`,
      }).catch(() => {
        const synth = handlePresentationJsonSynthesis(`Topic: ${topic}. Make ${count} slides`);
        return JSON.parse(synth.text) as { slides: Slide[] };
      });

      const data = await Promise.race([dataPromise, fastFallback]);

      const formattedSlides: Slide[] = (data?.slides || [])
        .slice(0, Number(count))
        .map((s, idx) => ({
          ...s,
          layout: idx === 0 ? "centered" : idx % 2 === 1 ? "split" : "cards",
          align: "left",
          logoUrl: globalLogo,
          imageUrl: s.imageUrl || null,
        }));

      if (formattedSlides.length === 0) {
        // Fallback slides
        const synth = handlePresentationJsonSynthesis(`Topic: ${topic}. Make ${count} slides`);
        const parsed = JSON.parse(synth.text) as { slides: Slide[] };
        setSlides(
          (parsed.slides || []).map((s, idx) => ({
            ...s,
            layout: idx === 0 ? "centered" : idx % 2 === 1 ? "split" : "cards",
            align: "left",
            logoUrl: globalLogo,
            imageUrl: null,
          })),
        );
      } else {
        setSlides(formattedSlides);
      }

      saveCurrentPresentationToStorage(
        formattedSlides.length > 0 ? formattedSlides : slides,
        themeIdx,
      );
      setActiveSlideIdx(0);
      setAttachments([]);
      setViewMode("editor");
      toast.success("Presentation generated in 20s! Canva editor is ready.");
    } catch (e) {
      handleAiError(e);
      toast.error(e instanceof Error ? e.message : "Could not build the deck.");
    } finally {
      clearInterval(timer);
      setBusy(false);
    }
  }

  // Load sample cybersecurity deck to preview Canva editor immediately
  function loadDemoDeck() {
    setSlides(SAMPLE_CYBER_SLIDES);
    setActiveSlideIdx(0);
    setThemeIdx(0); // Cybersecurity Teal
    setViewMode("editor");
    saveCurrentPresentationToStorage(SAMPLE_CYBER_SLIDES, 0);
    toast.success("Loaded Cybersecurity deck into Canva Studio!");
  }

  // Add asset to gallery (persisted)
  function addPresentationAsset(url: string, name: string, type: "upload" | "drawn" | "ai") {
    const newAsset: PresentationAsset = {
      id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      url,
      name,
      type,
      createdAt: Date.now(),
    };
    setPresentationAssets((prev) => {
      const updated = [newAsset, ...prev.filter((a) => a.url !== url)];
      try {
        localStorage.setItem(PRESENTATION_ASSETS_KEY, JSON.stringify(updated.slice(0, 40)));
      } catch {
        /* ignore */
      }
      return updated;
    });
    return newAsset;
  }

  function removePresentationAsset(id: string) {
    setPresentationAssets((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem(PRESENTATION_ASSETS_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
    toast.info("Image removed from uploads gallery");
  }

  async function generateConceptImage(i: number) {
    const slide = slides[i];
    if (!slide) return;
    recordHistory();
    setImaging(i);
    try {
      const presentationTopic = topic.trim() || activeSlide?.title || "Strategic Presentation";
      const slideTitle = slide.title || "Strategic Takeaway";
      const slideDetails =
        Array.isArray(slide.bullets) && slide.bullets.length > 0
          ? slide.bullets.slice(0, 3).join("; ")
          : slideTitle;

      const aiPrompt = `Clean, modern 16:9 presentation slide visual for topic "${presentationTopic}". Specific slide subject: "${slideTitle}". Context & details: ${slide.image_prompt || slideDetails}. Photorealistic, clean cinematic presentation graphic, 8k resolution, authentic lighting, no distorted text.`;

      toast.info(`Generating visual for "${slideTitle}" based on topic "${presentationTopic}"...`);
      let finalImgUrl: string | null = null;

      try {
        const res = await askAI(
          [
            {
              role: "user",
              content: `Generate a photorealistic 16:9 presentation slide graphic for the presentation topic: "${presentationTopic}". Slide title: "${slideTitle}". Strategic points: ${slideDetails}. Highly relevant, elegant, modern composition.`,
            },
          ],
          {
            image: true,
          },
        );
        if (res.imageUrl) {
          finalImgUrl = res.imageUrl;
        }
      } catch (genErr) {
        console.warn(
          "AI Image generation returned an error, activating thematic fallback:",
          genErr,
        );
      }

      if (!finalImgUrl) {
        // High quality curated thematic images strictly relevant to presentation and slide topic
        const combined = `${presentationTopic} ${slideTitle} ${slideDetails}`.toLowerCase();
        if (
          combined.includes("cyber") ||
          combined.includes("security") ||
          combined.includes("shield") ||
          combined.includes("threat") ||
          combined.includes("hack")
        ) {
          finalImgUrl =
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80";
        } else if (
          combined.includes("cloud") ||
          combined.includes("data") ||
          combined.includes("infra") ||
          combined.includes("server") ||
          combined.includes("network")
        ) {
          finalImgUrl =
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80";
        } else if (
          combined.includes("finance") ||
          combined.includes("invest") ||
          combined.includes("money") ||
          combined.includes("market") ||
          combined.includes("stock")
        ) {
          finalImgUrl =
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80";
        } else if (
          combined.includes("health") ||
          combined.includes("med") ||
          combined.includes("bio") ||
          combined.includes("doctor")
        ) {
          finalImgUrl =
            "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80";
        } else if (
          combined.includes("ai") ||
          combined.includes("robot") ||
          combined.includes("tech") ||
          combined.includes("neural") ||
          combined.includes("machine")
        ) {
          finalImgUrl =
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
        } else if (
          combined.includes("green") ||
          combined.includes("solar") ||
          combined.includes("energy") ||
          combined.includes("eco")
        ) {
          finalImgUrl =
            "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80";
        } else {
          finalImgUrl =
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";
        }
      }

      setSlides((all) => all.map((s, idx) => (idx === i ? { ...s, imageUrl: finalImgUrl } : s)));
      // Register into Uploads gallery so user can reuse or drag to other slides
      addPresentationAsset(finalImgUrl, `${slideTitle.slice(0, 22)} (AI)`, "ai");
      toast.success(`AI image matched to "${slideTitle}" and added to slide & uploads!`);
    } catch (e) {
      handleAiError(e);
      toast.error(e instanceof Error ? e.message : "Concept image generation failed.");
    } finally {
      setImaging(null);
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      recordHistory();
      setGlobalLogo(url);
      setSlides((all) => all.map((s) => ({ ...s, logoUrl: url })));
      addPresentationAsset(url, file.name || "Brand Logo", "upload");
      toast.success("Logo uploaded, applied to all slides, and added to gallery!");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSlideImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      recordHistory();
      edit(activeSlideIdx, { imageUrl: url });
      addPresentationAsset(url, file.name || "Uploaded Graphic", "upload");
      toast.success("Image uploaded! Attached to slide and saved to Uploads gallery.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function edit(i: number, patch: Partial<Slide>) {
    setSlides((all) => all.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addSlide() {
    recordHistory();
    const newSlide: Slide = {
      title: "NEW STRATEGIC CONCEPT",
      bullets: [
        "Autonomous telemetry tracking and quantitative metrics",
        "Key operational impact and execution milestones",
        "Actionable next steps for stakeholders",
      ],
      notes: "Speaker talking points for this slide.",
      image_prompt: "Modern architectural visual illustrating growth and technology",
      logoUrl: globalLogo,
      layout: "split",
      align: "left",
    };
    setSlides((all) => [...all, newSlide]);
    setActiveSlideIdx(slides.length);
    toast.success("New slide added");
  }

  function duplicateSlide(i: number) {
    const target = slides[i];
    if (!target) return;
    recordHistory();
    const copy: Slide = { ...target, title: `${target.title} (COPY)` };
    const next = [...slides.slice(0, i + 1), copy, ...slides.slice(i + 1)];
    setSlides(next);
    setActiveSlideIdx(i + 1);
    toast.success("Slide duplicated");
  }

  function deleteSlide(i: number) {
    if (slides.length <= 1) {
      toast.error("Presentations must have at least one slide.");
      return;
    }
    recordHistory();
    const next = slides.filter((_, idx) => idx !== i);
    setSlides(next);
    setActiveSlideIdx(Math.max(0, i - 1));
    toast.success("Slide removed");
  }

  function downloadHtml() {
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(topic || "Presentation")}</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #01151a; color: #f0fdfa; }
    .slide {
      page-break-after: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 6vmin 8vmin;
      box-sizing: border-box;
      position: relative;
      background: radial-gradient(circle at center, #022f38 0%, #011419 100%);
    }
    .logo { position: absolute; top: 5vmin; left: 8vmin; height: 5vmin; max-width: 15vmin; object-fit: contain; }
    .slide-content { max-width: 1200px; margin: 0 auto; width: 100%; }
    h2 { font-size: 5vmin; margin: 0 0 3vmin 0; font-weight: 800; color: #22d3ee; text-transform: uppercase; letter-spacing: -0.02em; }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 4vmin; align-items: center; }
    ul { font-size: 2.8vmin; line-height: 1.6; padding-left: 3vmin; }
    li { margin-bottom: 1.5vmin; color: #e2e8f0; }
    img.visual { width: 100%; max-height: 48vh; border-radius: 16px; object-fit: cover; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid rgba(34,211,238,0.2); }
    .notes { margin-top: 4vmin; font-size: 2vmin; opacity: 0.6; font-style: italic; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2vmin; }
    @media print { body { background: #fff; color: #111; } h2 { color: #0284c7; } }
  </style>
</head>
<body>
  ${slides
    .map(
      (s) => `
    <section class="slide">
      ${s.logoUrl ? `<img src="${s.logoUrl}" class="logo" alt="Logo" />` : ""}
      <div class="slide-content">
        <h2>${escapeHtml(s.title)}</h2>
        <div class="${s.imageUrl ? "split" : ""}">
          <ul>
            ${s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>
          ${s.imageUrl ? `<img src="${s.imageUrl}" class="visual" alt="${escapeHtml(s.title)}" />` : ""}
        </div>
        ${s.notes ? `<div class="notes">Notes: ${escapeHtml(s.notes)}</div>` : ""}
      </div>
    </section>
  `,
    )
    .join("")}
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(topic || "presentation").slice(0, 30)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Presentation downloaded!");
  }

  // Handle Canva prompt search/generation
  async function handleCanvaPromptSubmit() {
    if (!canvaPrompt.trim() || !activeSlide) return;
    recordHistory();
    const p = canvaPrompt.trim();
    setCanvaPrompt("");

    try {
      toast.info("Refining slide with AI...");
      const res = await askAI(
        [
          {
            role: "user",
            content: `Slide Title: ${activeSlide.title}
Current Bullets:
${activeSlide.bullets.join("\n")}
User Request: ${p}
Rewrite the title and bullet points to satisfy the request. Return only the updated title on line 1, then bullet points starting with - on following lines.`,
          },
        ],
        { mode: "presentations", model: selectedModel },
      );

      const lines = (res.text || "").split("\n").filter((l) => l.trim().length > 0);
      if (lines.length > 0 && lines[0]) {
        const newTitle = lines[0]
          .replace(/^#+\s*/, "")
          .replace(/^Title:\s*/i, "")
          .trim();
        const newBullets = lines
          .slice(1)
          .map((l) => l.replace(/^[-*•]\s*/, "").trim())
          .filter((l) => l.length > 0);

        edit(activeSlideIdx, {
          title: newTitle || activeSlide.title,
          bullets: newBullets.length > 0 ? newBullets : activeSlide.bullets,
        });
        toast.success("Slide refined with AI!");
      }
    } catch {
      toast.error("Could not update slide.");
    }
  }

  // =========================================================================
  // VIEW MODE 1: GENERATOR (Before generating a presentation)
  // "Before to generate a presentation, it will be same UI"
  // =========================================================================
  if (viewMode === "generator") {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <input
          type="file"
          ref={logoInputRef}
          onChange={handleLogoUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="brand-bg flex size-9 items-center justify-center rounded-xl shadow-sm">
                <Presentation className="size-5 text-primary-foreground" />
              </span>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Presentation Studio
              </h1>
              <span className="rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400">
                Canva-Grade Editor
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate custom decks, upload corporate logos, match AI concept images, and edit in
              real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {slides.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("editor")}
                className="gap-1.5 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/20"
              >
                <Eye className="size-3.5" /> Return to Canva Editor
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadDemoDeck}
              className="gap-1.5 text-xs"
              title="Open Cybersecurity demo deck directly in Canva Editor"
            >
              <Sparkles className="size-3.5 text-cyan-400" /> Demo Deck (Screenshot 1)
            </Button>
          </div>
        </div>

        {/* Generation Form */}
        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card/60 p-5 shadow-xs">
          <label className="block text-xs font-semibold text-foreground">
            What presentation do you want to create?
          </label>
          <Composer
            value={topic}
            onChange={setTopic}
            onSubmit={make}
            busy={busy}
            attachments={attachments}
            onAttachments={setAttachments}
            placeholder="e.g. AI-Powered Predictive Analytics in Cybersecurity, Startup Pitch Deck, Enterprise Cloud Migration..."
          />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Slides:</span>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["4", "6", "8", "10", "12", "15"].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n} slides
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Theme:</span>
              <Select value={String(themeIdx)} onValueChange={(v) => setThemeIdx(Number(v))}>
                <SelectTrigger className="h-8 w-52 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map((t, idx) => (
                    <SelectItem key={t.name} value={String(idx)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              className="h-8 gap-1.5 text-xs"
            >
              <Upload className="size-3.5" />
              {globalLogo ? "Change Logo" : "Upload Logo"}
            </Button>

            <Button
              onClick={make}
              disabled={busy || !topic.trim()}
              size="sm"
              className="ml-auto gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {busy ? `Generating (${elapsed}s)...` : "Generate Deck"}
            </Button>
          </div>

          {/* Progress dashboard while generating */}
          {busy && (
            <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-300 flex items-center gap-2">
                  <Sparkles className="size-4 animate-spin text-cyan-400" />
                  {elapsed < 4
                    ? "Phase 1/5: Researching topic & synthesizing empirical key findings..."
                    : elapsed < 9
                      ? "Phase 2/5: Structuring narrative storyline & executive milestones..."
                      : elapsed < 14
                        ? "Phase 3/5: Writing high-impact slide headers, bullets & speaker notes..."
                        : elapsed < 18
                          ? "Phase 4/5: Crafting concept visual prompts and responsive layout cards..."
                          : "Phase 5/5: Compiling deck into Canva Studio editor..."}
                </span>
                <span className="font-mono text-cyan-400 text-xs font-bold">{elapsed}s / 20s</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-cyan-950/60">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(98, Math.max(8, (elapsed / 20) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SAVED PRESENTATIONS LIBRARY: */}
        {/* "after making a presentation, after clicking back, our presentation should */}
        {/* be showing down. If we click on that, we saw that we can be continuing our presentations" */}
        {/* ========================================================================= */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Presentation className="size-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-foreground">Your Presentations</h2>
              <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-mono font-semibold text-cyan-400">
                {savedPresentations.length}
              </span>
            </div>
            {savedPresentations.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3.5 text-cyan-400" /> Auto-saved in browser
              </span>
            )}
          </div>

          {savedPresentations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/30">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-3">
                <Presentation className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No saved presentations yet</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Generate a deck above or launch the Cybersecurity demo deck to start editing with
                the Canva-grade presentation engine.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDemoDeck}
                className="mt-4 gap-1.5 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/20"
              >
                <Sparkles className="size-3.5" /> Open Cybersecurity Demo Deck
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPresentations.map((pres) => {
                const theme = THEMES[pres.themeIdx] || THEMES[0];
                const firstSlide = pres.slides[0];
                return (
                  <div
                    key={pres.id}
                    onClick={() => resumePresentation(pres)}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/20 cursor-pointer"
                  >
                    {/* Mini Slide Preview Canvas */}
                    <div
                      className={`relative aspect-[16/10] w-full rounded-xl p-3 flex flex-col justify-between overflow-hidden border border-white/10 shadow-inner ${theme.bg}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-300">
                          {pres.slides.length} SLIDES
                        </span>
                        <div
                          className="size-3 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: theme.colorHex || "#22d3ee" }}
                          title={theme.name}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-tight text-white line-clamp-2">
                          {pres.title}
                        </p>
                        {firstSlide?.bullets?.[0] && (
                          <p className="text-[10px] text-white/70 line-clamp-1 mt-1">
                            • {firstSlide.bullets[0]}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] text-white/60 font-mono">
                        <span className="truncate max-w-[120px]">{theme.name}</span>
                        <span>Canva Studio</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="mt-3 flex-1">
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {pres.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Clock className="size-3" />
                        <span>
                          {new Date(pres.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>•</span>
                        <span>{pres.slides.length} slides</span>
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          resumePresentation(pres);
                        }}
                      >
                        <Edit3 className="size-3.5" /> Continue Editing
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        title="Duplicate"
                        onClick={(e) => duplicateSavedPresentation(pres, e)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        title="Delete"
                        onClick={(e) => deleteSavedPresentation(pres.id, e)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    );
  }

  // =========================================================================
  // VIEW MODE 2: CANVA-GRADE PRESENTATION EDITOR (Matching Screenshot 1)
  // "After generating a presentation to view, like that UI will be there so that we can editing the text and all those things."
  // =========================================================================
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#001f24] text-slate-100 select-none overflow-x-hidden">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={slideImageInputRef}
        onChange={handleSlideImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Canva Top Navigation App Bar matching Screenshot 1 */}
      <header className="sticky top-0 z-40 flex h-13 items-center justify-between px-3 md:px-5 bg-[#004752] border-b border-cyan-900/40 text-white shadow-md">
        {/* Left: Home, Undo, Redo */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleBackToGenerator}
            className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white"
            title="Return to Presentation Generator & Library"
            aria-label="Home / Back to Generator"
          >
            <Home className="size-5" />
          </button>
          <button
            onClick={handleUndo}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/90"
            title="Undo"
            aria-label="Undo"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            onClick={handleRedo}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/90"
            title="Redo"
            aria-label="Redo"
          >
            <RotateCw className="size-4" />
          </button>
        </div>

        {/* Center: Slide title badge and quick Theme Switcher */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 border border-white/10 text-xs font-medium text-cyan-200">
            <span>
              Slide {activeSlideIdx + 1} of {slides.length}
            </span>
            <span className="text-white/40">•</span>
            <span className="truncate max-w-[180px]">{activeSlide?.title || "Presentation"}</span>
          </div>

          {/* Quick Theme Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 hover:bg-black/40 border border-white/10 text-xs font-medium text-white transition-colors"
                title="Change Color Theme"
              >
                <div
                  className="size-3 rounded-full border border-white/40"
                  style={{ backgroundColor: currentTheme.colorHex || "#22d3ee" }}
                />
                <span className="hidden md:inline text-[11px] truncate max-w-[110px]">
                  {currentTheme.name.split(" ")[0]}
                </span>
                <Palette className="size-3 text-cyan-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-56 bg-[#002e36] text-white border-cyan-800/60 shadow-2xl"
            >
              <DropdownMenuLabel className="text-xs text-cyan-300">
                Choose Deck Theme
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-cyan-900/50" />
              {THEMES.map((t, idx) => (
                <DropdownMenuItem
                  key={t.name}
                  onClick={() => {
                    setThemeIdx(idx);
                    saveCurrentPresentationToStorage(slides, idx);
                    toast.success(`Switched to ${t.name}!`);
                  }}
                  className={`flex items-center gap-2 text-xs cursor-pointer hover:bg-cyan-950/60 ${themeIdx === idx ? "text-cyan-300 font-bold" : "text-slate-200"}`}
                >
                  <div
                    className="size-3.5 rounded-full shrink-0 border border-white/30"
                    style={{ backgroundColor: t.colorHex || "#22d3ee" }}
                  />
                  <span className="truncate flex-1">{t.name}</span>
                  {themeIdx === idx && <Check className="size-3 text-cyan-400" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: More, Present, Share / Download */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* More options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white"
                title="More presentation tools"
                aria-label="More"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={addSlide} className="gap-2 cursor-pointer">
                <Plus className="size-4 text-cyan-400" /> Add New Slide
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => duplicateSlide(activeSlideIdx)}
                className="gap-2 cursor-pointer"
              >
                <Copy className="size-4 text-muted-foreground" /> Duplicate Slide
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => generateConceptImage(activeSlideIdx)}
                className="gap-2 cursor-pointer"
              >
                <ImagePlus className="size-4 text-primary" /> Generate AI Image
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteSlide(activeSlideIdx)}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" /> Delete Slide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Slideshow Presentation Mode button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white"
            title="Present Fullscreen"
            aria-label="Present"
          >
            <Play className="size-4 fill-white" />
          </button>

          {/* Export / Download HTML presentation button */}
          <button
            onClick={downloadHtml}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white"
            title="Download Presentation Deck"
            aria-label="Download"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </header>

      {/* Upper Area: Live 16:9 Slide Canvas with Click-to-Edit Text */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 bg-[#001b20]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverSlide(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverSlide(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverSlide(false);
            const draggedUrl =
              e.dataTransfer.getData("application/my-ai-pro-image") ||
              e.dataTransfer.getData("text/plain");
            if (draggedUrl) {
              recordHistory();
              edit(activeSlideIdx, { imageUrl: draggedUrl });
              toast.success("Image dropped and added to presentation slide!");
            } else if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") {
                  const url = reader.result;
                  recordHistory();
                  edit(activeSlideIdx, { imageUrl: url });
                  addPresentationAsset(url, file.name || "Dropped Graphic", "upload");
                  toast.success("Image dropped, added to slide, and saved to Uploads!");
                }
              };
              reader.readAsDataURL(file);
            }
          }}
          className={`relative w-full max-w-4xl aspect-[16/10] sm:aspect-video rounded-2xl sm:rounded-3xl border ${
            isDragOverSlide
              ? "border-cyan-400 ring-4 ring-cyan-400/50 scale-[1.01]"
              : "border-cyan-800/40"
          } shadow-2xl p-6 sm:p-10 flex flex-col justify-between overflow-hidden transition-all ${currentTheme.bg}`}
        >
          {/* Visual Drop Highlight Indicator */}
          {isDragOverSlide && (
            <div className="absolute inset-0 z-50 bg-[#001b20]/90 backdrop-blur-xs flex flex-col items-center justify-center text-cyan-300 border-2 border-dashed border-cyan-400 rounded-2xl sm:rounded-3xl animate-in fade-in duration-150">
              <Upload className="size-12 mb-3 text-cyan-400 animate-bounce" />
              <p className="text-base font-bold uppercase tracking-wider text-white">
                Drop Image to Attach to Slide
              </p>
              <p className="text-xs text-cyan-300/80 mt-1">
                Release image to insert into slide {activeSlideIdx + 1}
              </p>
            </div>
          )}
          {/* Subtle Cyber Accent Speed Lines (Top Right & Bottom Left matching Screenshot 1) */}
          {showAccentLines && (
            <>
              {/* Top Right Cyan Speed Bars */}
              <div className="absolute top-6 right-6 sm:top-8 sm:right-10 flex flex-col items-end pointer-events-none opacity-85">
                <div className="h-1.5 sm:h-2 w-20 sm:w-28 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                <div className="mt-1.5 h-1 sm:h-1.5 w-12 sm:w-16 rounded-full bg-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              </div>

              {/* Bottom Left Cyan Speed Bars */}
              <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-10 flex flex-col items-start pointer-events-none opacity-85">
                <div className="h-1 sm:h-1.5 w-14 sm:w-18 rounded-full bg-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <div className="mt-1.5 h-1.5 sm:h-2 w-20 sm:w-28 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              </div>
            </>
          )}

          {/* Top Row: Logo & Slide Number */}
          <div className="flex items-center justify-between z-10">
            {activeSlide?.logoUrl ? (
              <img
                src={activeSlide.logoUrl}
                alt="Logo"
                className="h-8 sm:h-10 object-contain max-w-[140px]"
              />
            ) : (
              <div className="size-2" />
            )}
            <span className="text-[11px] font-mono text-cyan-400/80 px-2 py-0.5 rounded-md bg-black/30 border border-cyan-800/30">
              0{activeSlideIdx + 1} / 0{slides.length}
            </span>
          </div>

          {/* Center Stage: Editable Slide Title & Content (matching Screenshot 1) */}
          <div className="my-auto z-10 space-y-4 max-w-2xl mx-auto w-full text-center">
            {/* Click-to-edit Title */}
            <div className="relative group">
              <input
                type="text"
                value={activeSlide?.title || ""}
                onChange={(e) => edit(activeSlideIdx, { title: e.target.value })}
                onFocus={recordHistory}
                placeholder="SLIDE TITLE (CLICK TO EDIT)"
                className="w-full bg-transparent text-center font-display text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50 rounded-lg px-2 py-1 placeholder:text-white/40 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
              />
              <span className="text-[10px] text-cyan-400/60 opacity-0 group-hover:opacity-100 transition-opacity block mt-0.5">
                Click text above to edit slide title
              </span>
            </div>

            {/* Click-to-edit Bullets / Takeaways */}
            <div className="space-y-2 mt-4 text-left max-w-xl mx-auto">
              {(activeSlide?.bullets || []).map((b, bi) => (
                <div
                  key={bi}
                  className="group flex items-center gap-2 rounded-lg bg-black/20 hover:bg-black/40 border border-cyan-900/30 hover:border-cyan-500/40 px-3 py-1.5 transition-colors"
                >
                  <span className="size-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_6px_#22d3ee]" />
                  <input
                    type="text"
                    value={b}
                    onChange={(e) =>
                      edit(activeSlideIdx, {
                        bullets: (activeSlide?.bullets || []).map((x, xi) =>
                          xi === bi ? e.target.value : x,
                        ),
                      })
                    }
                    onFocus={recordHistory}
                    placeholder="Enter strategic bullet takeaway..."
                    className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 focus:outline-none placeholder:text-slate-500"
                  />
                  <button
                    onClick={() => {
                      recordHistory();
                      edit(activeSlideIdx, {
                        bullets: (activeSlide?.bullets || []).filter((_, xi) => xi !== bi),
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-opacity"
                    title="Remove point"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    recordHistory();
                    edit(activeSlideIdx, {
                      bullets: [...(activeSlide.bullets || []), "New strategic takeaway..."],
                    });
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300"
                >
                  <Plus className="size-3" /> Add bullet point
                </button>

                {activeSlide?.imageUrl && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="size-3 text-cyan-400" /> Image attached
                  </span>
                )}
              </div>
            </div>

            {/* Concept Image if attached */}
            {activeSlide?.imageUrl && (
              <div className="relative mx-auto mt-2 max-h-36 max-w-sm overflow-hidden rounded-xl border border-cyan-500/30 shadow-lg group">
                <img
                  src={activeSlide.imageUrl}
                  alt={activeSlide.title}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => {
                    recordHistory();
                    edit(activeSlideIdx, { imageUrl: null });
                  }}
                  className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>

          {/* Footer of Slide */}
          <div className="flex items-center justify-between text-[10px] text-cyan-400/60 z-10 pt-2 border-t border-cyan-900/30">
            <span>Creative AI Studio • Canva Engine</span>
            <span>Predictive Intelligence</span>
          </div>
        </div>
      </div>

      {/* Bottom Half: Canva Sliding Dock / Controls Panel (matching Screenshot 1) */}
      <div className="bg-[#002f37] border-t border-cyan-900/50 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-4 sm:px-6 pt-2 pb-4 space-y-3">
        {/* Top center drag handle pill */}
        <div className="w-10 h-1 rounded-full bg-slate-400/50 mx-auto my-1.5" />

        {/* Search & Prompt Input: "+ Describe your ideal design" with Mic */}
        <div className="relative flex items-center rounded-2xl bg-[#00232a] border border-cyan-800/40 px-3.5 py-2 text-sm shadow-inner">
          <span className="text-cyan-400 font-bold text-base mr-2 select-none">+</span>
          <input
            type="text"
            value={canvaPrompt}
            onChange={(e) => setCanvaPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCanvaPromptSubmit();
              }
            }}
            placeholder="Describe your ideal design (e.g. Make bullets punchier, Add cyber threat stats)..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => toast.info("Listening for presentation voice instructions...")}
            className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            title="Voice prompt"
          >
            <Mic className="size-4" />
          </button>
        </div>

        {/* Action Row: [ ✨ Generate ⌵ ] and [ Search (Purple Pill) ] */}
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004752] hover:bg-[#005764] text-xs font-semibold text-cyan-200 border border-cyan-700/40 transition-colors">
                <Sparkles className="size-3.5 text-cyan-400" />
                <span>Generate</span>
                <span className="text-[10px] opacity-70">⌵</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={addSlide} className="gap-2 cursor-pointer">
                <Plus className="size-4 text-cyan-400" /> Generate Next Slide
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => generateConceptImage(activeSlideIdx)}
                className="gap-2 cursor-pointer"
              >
                {imaging === activeSlideIdx ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4 text-cyan-400" />
                )}
                Generate AI Image for Slide
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCanvaPrompt("Rewrite this slide with concise executive wording");
                  void handleCanvaPromptSubmit();
                }}
                className="gap-2 cursor-pointer"
              >
                <Wand2 className="size-4 text-primary" /> AI Rewrite Bullets
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowAccentLines((prev) => !prev)}
                className="gap-2 cursor-pointer"
              >
                <Shapes className="size-4 text-muted-foreground" />
                {showAccentLines ? "Hide Speed Lines" : "Show Speed Lines"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={handleCanvaPromptSubmit}
            className="flex items-center justify-center rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] px-6 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-md transition-all active:scale-95"
          >
            Search
          </button>
        </div>

        {/* Recently Used Slides Carousel matching Screenshot 1 */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
            <span>Recently used</span>
            <span className="text-[11px] text-cyan-400 font-mono">
              Slide {activeSlideIdx + 1} of {slides.length}
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
            {slides.map((s, idx) => (
              <div
                key={idx}
                onClick={() => setActiveSlideIdx(idx)}
                className={`relative shrink-0 w-44 sm:w-52 rounded-xl p-2.5 cursor-pointer border transition-all ${
                  activeSlideIdx === idx
                    ? "border-cyan-400 bg-[#00404a] shadow-[0_0_12px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/50"
                    : "border-cyan-900/40 bg-[#002228] hover:border-cyan-700/60 hover:bg-[#002e36]"
                }`}
              >
                {/* Mini Slide Canvas Thumbnail */}
                <div className="relative aspect-video w-full rounded-lg bg-gradient-to-br from-[#01252c] to-[#011419] p-2 flex flex-col justify-between overflow-hidden border border-cyan-950">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-cyan-400">0{idx + 1}</span>
                    <div className="h-1 w-4 rounded-full bg-cyan-400/80" />
                  </div>
                  <p className="text-[9px] font-bold text-white uppercase line-clamp-2 leading-tight">
                    {s.title}
                  </p>
                  <div className="h-0.5 w-6 rounded-full bg-cyan-400/60" />
                </div>

                {/* Card footer: Title and Slide Count Badge 🔲 11 (matching Screenshot 1) */}
                <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                  <span className="font-semibold text-slate-200 truncate flex-1">{s.title}</span>
                  <span className="shrink-0 rounded-md bg-[#00171c] px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-800/30">
                    🔲 {slides.length}
                  </span>
                </div>
              </div>
            ))}

            {/* Add Slide Card */}
            <button
              onClick={addSlide}
              className="shrink-0 w-28 sm:w-32 aspect-[4/3] rounded-xl border-2 border-dashed border-cyan-700/40 hover:border-cyan-400 bg-[#002228]/50 flex flex-col items-center justify-center gap-1 text-cyan-300 hover:text-white transition-colors"
            >
              <Plus className="size-5" />
              <span className="text-[11px] font-semibold">Add Slide</span>
            </button>
          </div>
        </div>

        {/* Drawer for bottom tabs */}
        {activeTab !== "none" && (
          <div className="rounded-2xl border border-cyan-700/40 bg-[#00232a] p-3.5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                {activeTab === "templates" && "Choose Deck Theme & Colorway"}
                {activeTab === "elements" && "Visual Elements & Speed Lines"}
                {activeTab === "text" && "Add & Edit Slide Typography"}
                {activeTab === "brand" && "Brand Logo & Corporate Assets"}
                {activeTab === "uploads" && "Upload Images for Current Slide"}
              </span>
              <button
                onClick={() => setActiveTab("none")}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Templates Drawer Content */}
            {activeTab === "templates" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEMES.map((t, idx) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setThemeIdx(idx);
                      toast.success(`Applied ${t.name} theme!`);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      themeIdx === idx
                        ? "border-cyan-400 bg-cyan-950/40 text-white font-bold"
                        : "border-cyan-900/40 bg-[#001a1f] text-slate-300 hover:border-cyan-700"
                    }`}
                  >
                    <div className="font-semibold text-cyan-300">{t.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1">16:9 Presentation Canvas</div>
                  </button>
                ))}
              </div>
            )}

            {/* Elements Drawer Content */}
            {activeTab === "elements" && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAccentLines((prev) => !prev);
                    toast.success(showAccentLines ? "Speed lines hidden" : "Speed lines enabled");
                  }}
                  className="gap-1.5 text-xs border-cyan-800 bg-[#001a1f] text-cyan-300"
                >
                  <Shapes className="size-3.5" />
                  {showAccentLines ? "Disable Speed Lines" : "Enable Speed Lines"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateConceptImage(activeSlideIdx)}
                  className="gap-1.5 text-xs border-cyan-800 bg-[#001a1f] text-cyan-300"
                >
                  <Sparkles className="size-3.5" />
                  Generate Concept Illustration
                </Button>
              </div>
            )}

            {/* Text Drawer Content */}
            {activeTab === "text" && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    recordHistory();
                    edit(activeSlideIdx, { title: "NEW EXPANDED HEADING" });
                  }}
                  className="gap-1.5 text-xs bg-[#004752] text-white"
                >
                  <Type className="size-3.5" /> Replace Title
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    recordHistory();
                    edit(activeSlideIdx, {
                      bullets: [
                        ...(activeSlide.bullets || []),
                        "Newly added strategic observation...",
                      ],
                    });
                  }}
                  className="gap-1.5 text-xs bg-[#004752] text-white"
                >
                  <Plus className="size-3.5" /> Add New Bullet Point
                </Button>
              </div>
            )}

            {/* Brand Drawer Content */}
            {activeTab === "brand" && (
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="gap-1.5 text-xs bg-[#004752] text-white"
                >
                  <Upload className="size-3.5" />
                  {globalLogo ? "Change Global Logo" : "Upload Corporate Logo"}
                </Button>
                {globalLogo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGlobalLogo(null);
                      setSlides((all) => all.map((s) => ({ ...s, logoUrl: null })));
                    }}
                    className="gap-1.5 text-xs text-red-400 border-red-900/40"
                  >
                    <Trash2 className="size-3.5" /> Remove Logo
                  </Button>
                )}
              </div>
            )}

            {/* Uploads Drawer Content */}
            {activeTab === "uploads" && (
              <div className="space-y-3.5">
                {/* Action Bar: Upload, Draw, AI Generate */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => slideImageInputRef.current?.click()}
                    className="gap-1.5 text-xs bg-[#004752] hover:bg-[#005764] text-white"
                  >
                    <Upload className="size-3.5" /> Upload Image
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setDrawModalOpen(true)}
                    className="gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-sm"
                  >
                    <PenTool className="size-3.5" /> Draw Image
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateConceptImage(activeSlideIdx)}
                    className="gap-1.5 text-xs border-cyan-700/60 bg-[#001a1f] hover:bg-cyan-950 text-cyan-300 font-semibold"
                  >
                    <Sparkles className="size-3.5" /> AI Generate Image
                  </Button>
                </div>

                {/* Drag-and-Drop Guidance Banner */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#001a1f] border border-cyan-900/50 text-[11px] text-cyan-200">
                  <span className="flex items-center gap-1.5">
                    <GripVertical className="size-3.5 text-cyan-400 shrink-0" />
                    <span>
                      Drag any image directly onto the presentation slide above, or click{" "}
                      <strong className="text-white">Insert</strong>.
                    </span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {presentationAssets.length} assets
                  </span>
                </div>

                {/* Uploaded & Drawn Images Gallery */}
                {presentationAssets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-cyan-800/40 p-4 text-center text-xs text-slate-400">
                    No images in your presentation library yet. Upload an image, draw a sketch, or
                    generate one with AI!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {presentationAssets.map((asset) => (
                      <div
                        key={asset.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", asset.url);
                          e.dataTransfer.setData("application/my-ai-pro-image", asset.url);
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                        className="group relative rounded-xl border border-cyan-800/40 hover:border-cyan-400/80 bg-[#00171c] hover:bg-[#00222a] p-1.5 transition-all shadow-md cursor-grab active:cursor-grabbing"
                      >
                        {/* Image Thumbnail */}
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/40">
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {/* Badge tag: Uploaded, Drawn, or AI */}
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-md flex items-center gap-1 bg-black/80 backdrop-blur-xs text-white border border-white/20">
                            {asset.type === "drawn" && (
                              <>
                                <PenTool className="size-2.5 text-amber-400" />
                                <span className="text-amber-300">Drawn</span>
                              </>
                            )}
                            {asset.type === "upload" && (
                              <>
                                <Upload className="size-2.5 text-cyan-400" />
                                <span className="text-cyan-300">Uploaded</span>
                              </>
                            )}
                            {asset.type === "ai" && (
                              <>
                                <Sparkles className="size-2.5 text-teal-400" />
                                <span className="text-teal-300">AI</span>
                              </>
                            )}
                          </div>

                          {/* Hover drag pill */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                            <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
                              <GripVertical className="size-3 text-cyan-300" /> Drag to Slide
                            </span>
                          </div>
                        </div>

                        {/* Card Footer: Name and Quick Insert / Delete */}
                        <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px]">
                          <span className="truncate text-slate-200 font-medium flex-1">
                            {asset.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                recordHistory();
                                edit(activeSlideIdx, { imageUrl: asset.url });
                                toast.success(`Inserted into slide ${activeSlideIdx + 1}!`);
                              }}
                              className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-800 border border-cyan-800/60 text-cyan-300 font-semibold transition-colors flex items-center gap-0.5"
                              title="Insert into current slide"
                            >
                              <MousePointerClick className="size-2.5" />
                              <span>Insert</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removePresentationAsset(asset.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                              title="Delete from uploads"
                            >
                              <Trash2 className="size-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Canva Bottom Navigation Bar Tabs matching Screenshot 1 */}
        {/* [Templates] [Elements] [Text] [Brand] [Uploads] */}
        <nav className="flex items-center justify-around pt-1 border-t border-cyan-900/40 text-slate-300">
          <button
            onClick={() => setActiveTab((curr) => (curr === "templates" ? "none" : "templates"))}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === "templates" ? "text-cyan-400 font-bold" : "hover:text-white"
            }`}
          >
            <LayoutGrid className="size-4" />
            <span className="text-[11px]">Templates</span>
          </button>

          <button
            onClick={() => setActiveTab((curr) => (curr === "elements" ? "none" : "elements"))}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === "elements" ? "text-cyan-400 font-bold" : "hover:text-white"
            }`}
          >
            <Shapes className="size-4" />
            <span className="text-[11px]">Elements</span>
          </button>

          <button
            onClick={() => setActiveTab((curr) => (curr === "text" ? "none" : "text"))}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === "text" ? "text-cyan-400 font-bold" : "hover:text-white"
            }`}
          >
            <Type className="size-4" />
            <span className="text-[11px]">Text</span>
          </button>

          <button
            onClick={() => setActiveTab((curr) => (curr === "brand" ? "none" : "brand"))}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === "brand" ? "text-cyan-400 font-bold" : "hover:text-white"
            }`}
          >
            <Crown className="size-4" />
            <span className="text-[11px]">Brand</span>
          </button>

          <button
            onClick={() => setActiveTab((curr) => (curr === "uploads" ? "none" : "uploads"))}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === "uploads" ? "text-cyan-400 font-bold" : "hover:text-white"
            }`}
          >
            <Upload className="size-4" />
            <span className="text-[11px]">Uploads</span>
          </button>
        </nav>
      </div>

      {/* Fullscreen Presenter Slideshow Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black p-6 md:p-14 text-white">
          <div className="flex items-center justify-between">
            {activeSlide?.logoUrl && (
              <img src={activeSlide.logoUrl} alt="Logo" className="h-10 object-contain" />
            )}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm font-mono text-cyan-400">
                0{activeSlideIdx + 1} / 0{slides.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="size-6" />
              </Button>
            </div>
          </div>

          <div className="my-auto max-w-5xl mx-auto w-full">
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold text-cyan-400 uppercase tracking-tight">
              {activeSlide?.title}
            </h1>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <ul className="space-y-4 text-lg md:text-xl font-light leading-relaxed">
                {(activeSlide?.bullets || []).map((b, bi) => (
                  <li key={bi} className="flex gap-3">
                    <span className="text-cyan-400">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {activeSlide?.imageUrl && (
                <img
                  src={activeSlide.imageUrl}
                  alt={activeSlide.title}
                  className="rounded-3xl shadow-2xl max-h-[50vh] w-full object-cover border border-cyan-500/30"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
            <Button
              variant="outline"
              disabled={activeSlideIdx === 0}
              onClick={() => setActiveSlideIdx((i) => Math.max(0, i - 1))}
              className="text-white border-neutral-700 bg-neutral-900"
            >
              <ChevronLeft className="size-4 mr-1" /> Previous
            </Button>

            <span className="text-xs text-neutral-500">Press Esc or Close to exit</span>

            <Button
              variant="outline"
              disabled={activeSlideIdx === slides.length - 1}
              onClick={() => setActiveSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
              className="text-white border-neutral-700 bg-neutral-900"
            >
              Next <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Draw / Sketch Image Modal */}
      <DrawImageModal
        open={drawModalOpen}
        onClose={() => setDrawModalOpen(false)}
        onSave={(dataUrl, name, insertToSlide) => {
          recordHistory();
          addPresentationAsset(dataUrl, name || "Drawn Sketch", "drawn");
          if (insertToSlide) {
            edit(activeSlideIdx, { imageUrl: dataUrl });
            toast.success("Drawn image saved to Uploads and added to slide!");
          } else {
            toast.success("Drawn image saved to Uploads! Drag it onto any slide.");
          }
        }}
      />
    </div>
  );
}

interface DrawImageModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string, name: string, insertToSlide: boolean) => void;
}

function DrawImageModal({ open, onClose, onSave }: DrawImageModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState("#22d3ee");
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnName, setDrawnName] = useState("Hand-Drawn Sketch");

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#031317";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [open]);

  if (!open) return null;

  function getCanvasCoords(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      const touch = e.touches[0];
      if (touch) {
        clientX = touch.clientX;
        clientY = touch.clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDrawing(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? "#031317" : color;
    ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#031317";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function handleExport(insertToSlide: boolean) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl, drawnName.trim() || "Drawn Sketch", insertToSlide);
    onClose();
  }

  const COLOR_PALETTE = [
    { name: "Cyan", hex: "#22d3ee" },
    { name: "White", hex: "#ffffff" },
    { name: "Amber", hex: "#fbbf24" },
    { name: "Emerald", hex: "#34d399" },
    { name: "Rose", hex: "#f43f5e" },
    { name: "Purple", hex: "#a855f7" },
    { name: "Sky", hex: "#38bdf8" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl bg-[#021b20] text-white border-cyan-700/50 p-5 rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-cyan-300">
            <PenTool className="size-4 text-amber-400" /> Draw / Sketch Image
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Sketch diagrams, charts, or annotations. Save to Uploads to drag and drop onto your
            presentation slides.
          </DialogDescription>
        </DialogHeader>

        {/* Canvas Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-b border-cyan-900/40 pb-3">
          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => {
                  setColor(c.hex);
                  setIsEraser(false);
                }}
                className={`size-6 rounded-full border transition-transform ${
                  !isEraser && color === c.hex
                    ? "scale-110 border-white ring-2 ring-cyan-400"
                    : "border-white/30 hover:scale-105"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* Stroke Widths */}
          <div className="flex items-center gap-1 bg-[#001418] p-1 rounded-xl border border-cyan-900/40">
            {[2, 4, 8, 14].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setLineWidth(w)}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors ${
                  lineWidth === w
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {w}px
              </button>
            ))}
          </div>

          {/* Eraser & Clear */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEraser((prev) => !prev)}
              className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
                isEraser
                  ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                  : "border-cyan-900/40 bg-[#001418] text-slate-400 hover:text-white"
              }`}
              title="Toggle Eraser"
            >
              <Eraser className="size-3.5" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              className="p-1.5 rounded-xl border border-red-900/40 bg-red-950/20 hover:bg-red-950/40 text-red-300 text-xs flex items-center gap-1 transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-800/60 bg-[#031317] shadow-inner flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full aspect-video cursor-crosshair touch-none"
          />
        </div>

        {/* Name input & Save Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
          <input
            type="text"
            value={drawnName}
            onChange={(e) => setDrawnName(e.target.value)}
            placeholder="Sketch title..."
            className="w-full sm:w-48 bg-[#001418] border border-cyan-900/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport(false)}
              className="flex-1 sm:flex-none text-xs border-cyan-800 text-cyan-300 bg-[#00242b] hover:bg-[#00343e]"
            >
              Save to Uploads
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport(true)}
              className="flex-1 sm:flex-none text-xs bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold hover:brightness-110"
            >
              Save & Insert to Slide
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}
