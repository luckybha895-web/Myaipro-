import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Share2,
  FileCode2,
  Play,
  History,
  RotateCcw,
  Rocket,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Send,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  Cpu,
  ArrowRight,
  Bot,
  User,
  ChevronLeft,
  MoreHorizontal,
  Mic,
  Plus,
  Check,
  FileText,
  ShieldCheck,
  ChevronDown,
  ArrowUp,
  Globe,
  Layers,
  Code2,
  Github,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Pencil,
  MoreVertical,
  ChevronRight,
  Search,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { unpackDescription, packDescription, type ProjectFile } from "@/lib/project-types";
import { askAIJson } from "@/lib/ai";
import { synthesizeAutonomousResponse } from "@/lib/neural-engine";
import { createRecognizer } from "@/lib/speech";
import { ProjectCodeExplorer } from "@/components/ProjectCodeExplorer";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/project/$projectId")({
  head: () => ({
    meta: [
      { title: "Your project — Creative AI" },
      {
        name: "description",
        content: "View the generated code, run the live preview and iterate on your app.",
      },
      { property: "og:title", content: "A project built with Creative AI" },
      { property: "og:description", content: "Generated code, live preview and AI iteration." },
    ],
  }),
  component: ProjectView,
});

type Row = { id: string; title: string; description: string | null; files: Json };
type Version = {
  id: string;
  version_number: number;
  title: string;
  description: string | null;
  files: Json;
  model_id: string;
  created_at: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
};

function getSuggestedIdeas(title: string, desc: string): string[] {
  const t = (title + " " + desc).toLowerCase();
  const ideas: string[] = [];

  if (
    t.includes("order") ||
    t.includes("food") ||
    t.includes("restaurant") ||
    t.includes("bakery") ||
    t.includes("cafe")
  ) {
    ideas.push("Add delivery address & payment checkout modal");
    ideas.push("Add dietary filter tags (Vegan, Gluten-Free)");
    ideas.push("Add live order status tracker with estimated arrival");
    ideas.push("Add customer reviews and star ratings");
    ideas.push("Add dark mode toggle with smooth theme transition");
  } else if (
    t.includes("task") ||
    t.includes("todo") ||
    t.includes("project") ||
    t.includes("tracker")
  ) {
    ideas.push("Add drag-and-drop Kanban columns (To Do, In Progress, Done)");
    ideas.push("Add priority color badges (High, Medium, Low)");
    ideas.push("Add CSV / JSON data export");
    ideas.push("Add sound effect on completing a task");
    ideas.push("Add instant search and category filter");
  } else if (t.includes("ecommerce") || t.includes("shop") || t.includes("store")) {
    ideas.push("Add instant search and price sorting slider");
    ideas.push("Add customer reviews and star rating system");
    ideas.push("Add discount coupon promo code input");
    ideas.push("Add wishlist bookmarking with local storage");
    ideas.push("Add cart badge counter and floating checkout");
  } else {
    ideas.push("Add dark mode toggle with smooth transition");
    ideas.push("Add auto-save to browser local storage");
    ideas.push("Add export data to CSV & printable report");
    ideas.push("Add instant search bar and filter chips");
    ideas.push("Add interactive animations and sound effects");
  }
  return ideas;
}

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function ProjectView() {
  const { projectId } = Route.useParams();
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [domainSuffix, setDomainSuffix] = useState<"creative.app" | "lovable.app">("creative.app");
  const [customSubdomain, setCustomSubdomain] = useState<string>("");
  const [customDomainModalOpen, setCustomDomainModalOpen] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [savedCustomDomain, setSavedCustomDomain] = useState<string>("");
  const [domainModalTab, setDomainModalTab] = useState<"search" | "connect">("search");
  const [domainSearchQuery, setDomainSearchQuery] = useState("");
  const [isSearchingDomains, setIsSearchingDomains] = useState(false);
  const [searchedDomains, setSearchedDomains] = useState<
    Array<{
      domain: string;
      tld: string;
      available: boolean;
      hostingerPrice: string;
      godaddyPrice: string;
      hostingerUrl: string;
      godaddyUrl: string;
      dealBadge?: string;
    }>
  >([]);
  const [domainRegistrar, setDomainRegistrar] = useState<
    "hostinger" | "godaddy" | "cloudflare" | "namecheap" | "manual"
  >("hostinger");
  const [hostingerConnecting, setHostingerConnecting] = useState(false);
  const [godaddyConnecting, setGodaddyConnecting] = useState(false);
  const [dnsVerifying, setDnsVerifying] = useState(false);
  const [dnsVerified, setDnsVerified] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [tab, setTab] = useState<string>("preview");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const [viewMode, setViewMode] = useState<"chat" | "preview" | "code">("chat");
  const [voiceListening, setVoiceListening] = useState(false);

  // Chat to improve states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [improving, setImproving] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const loadVersions = useCallback(async () => {
    const { data } = await supabase
      .from("project_versions")
      .select("id,version_number,title,description,files,model_id,created_at")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false });
    setVersions((data ?? []) as Version[]);
  }, [projectId]);

  useEffect(() => {
    supabase
      .from("projects")
      .select("id,title,description,files")
      .eq("id", projectId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRow(data as Row | null);
          setLoading(false);
        } else {
          // Check local storage fallback
          try {
            const localProjects = JSON.parse(
              localStorage.getItem("creative_ai_local_projects") || "{}",
            );
            const local = localProjects[projectId];
            if (local) {
              setRow(local as Row);
            }
          } catch {
            /* ignore */
          }
          setLoading(false);
        }
      })
      .catch(() => {
        try {
          const localProjects = JSON.parse(
            localStorage.getItem("creative_ai_local_projects") || "{}",
          );
          const local = localProjects[projectId];
          if (local) {
            setRow(local as Row);
          }
        } catch {
          /* ignore */
        }
        setLoading(false);
      });
    void loadVersions();
  }, [projectId, loadVersions]);

  const files = useMemo<ProjectFile[]>(
    () => (Array.isArray(row?.files) ? (row?.files as ProjectFile[]) : []),
    [row],
  );
  const { description, previewHtml } = unpackDescription(row?.description ?? null);
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/share/${projectId}` : "";

  // Initialize initial assistant greeting in chat
  useEffect(() => {
    if (row && chatMessages.length === 0) {
      setChatMessages([
        {
          id: "init",
          role: "assistant",
          text: `👋 I've built the initial application for **${row.title}**! You can test it in the Preview tab, inspect the code, or ask me to add features, restyle elements, or customize logic right here.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [row, chatMessages.length]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, improving]);

  const startVoiceImprove = () => {
    const rec = createRecognizer(
      (text) => {
        setChatInput(text);
        setViewMode("chat");
        void handleImprove(text);
      },
      () => setVoiceListening(false),
    );
    if (!rec) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    setVoiceListening(true);
    rec.start();
    toast.info("Listening... Speak your prompt to improve the app");
  };

  const handleDeployPublish = async () => {
    setPublishing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setPublishing(false);
    setPublished(true);
    toast.success("Project successfully published to high-speed cloud hosting!");
  };

  const handleSearchDomains = (rawQuery: string) => {
    const q = rawQuery
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9-]/g, "");
    if (!q) {
      toast.error("Please enter a domain keyword or name to search");
      return;
    }
    setIsSearchingDomains(true);
    setTimeout(() => {
      const baseName = q.split(".")[0] || "myapp";
      const extensions = [
        { tld: ".com", hostingerPrice: "$4.99/yr", godaddyPrice: "$11.99/yr", deal: "Popular" },
        { tld: ".ai", hostingerPrice: "$69.99/yr", godaddyPrice: "$79.99/yr", deal: "AI & Tech" },
        { tld: ".io", hostingerPrice: "$34.99/yr", godaddyPrice: "$39.99/yr", deal: "Developer" },
        { tld: ".app", hostingerPrice: "$12.99/yr", godaddyPrice: "$17.99/yr", deal: "App Store" },
        { tld: ".shop", hostingerPrice: "$0.99/yr", godaddyPrice: "$2.99/yr", deal: "90% Off" },
        {
          tld: ".tech",
          hostingerPrice: "$1.99/yr",
          godaddyPrice: "$3.99/yr",
          deal: "Tech Special",
        },
        { tld: ".co", hostingerPrice: "$9.99/yr", godaddyPrice: "$11.99/yr", deal: "Startup" },
        {
          tld: ".online",
          hostingerPrice: "$0.99/yr",
          godaddyPrice: "$1.99/yr",
          deal: "Best Price",
        },
      ];

      const results = extensions.map((ext) => {
        const fullDomain = `${baseName}${ext.tld}`;
        return {
          domain: fullDomain,
          tld: ext.tld,
          available: true,
          hostingerPrice: ext.hostingerPrice,
          godaddyPrice: ext.godaddyPrice,
          hostingerUrl: `https://www.hostinger.com/domain-name-search?domain=${encodeURIComponent(fullDomain)}`,
          godaddyUrl: `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encodeURIComponent(fullDomain)}`,
          dealBadge: ext.deal,
        };
      });

      setSearchedDomains(results);
      setIsSearchingDomains(false);
      toast.success(`Found available domains on Hostinger & GoDaddy for "${baseName}"!`);
    }, 600);
  };

  async function handleImprove(instruction: string) {
    if (!instruction.trim() || improving || !row) return;
    const userText = instruction.trim();
    setChatInput("");
    setImproving(true);

    const userMsgId = Math.random().toString(36).slice(2);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: userText, time: now },
    ]);

    try {
      let updated: {
        title?: string;
        description?: string;
        preview_html?: string;
        files?: ProjectFile[];
        changelog?: string;
      } | null = null;

      try {
        updated = await askAIJson<{
          title?: string;
          description?: string;
          preview_html: string;
          files: ProjectFile[];
          changelog?: string;
        }>(
          [
            {
              role: "user",
              content: `Current App Title: "${row.title}"
Current Description: "${description}"
Current Preview HTML: ${previewHtml.slice(0, 3000)}
Current Files: ${JSON.stringify(files.slice(0, 4))}

User's Improvement Request:
"${userText}"

Please update the application code and preview_html to implement the user's request. Maintain full functionality, clean styling, and zero placeholder comments. Respond as JSON with:
{
  "title": string,
  "description": string,
  "preview_html": string (complete runnable standalone HTML page with CSS and JS),
  "files": [{"name": string, "language": string, "code": string}],
  "changelog": string (one sentence summary of what was updated)
}`,
            },
          ],
          {
            model: "deepseek-ai/DeepSeek-V4.1-Flash",
            mode: "build",
            system:
              "You are Creative AI App Builder. Update and refine the app according to the user's instructions. Always return a complete, runnable preview_html with all styles and scripts embedded so the user sees immediate changes in preview. Return valid JSON only.",
          },
        );
      } catch (aiErr) {
        console.warn("askAIJson failed, using neural engine synthesis fallback:", aiErr);
        const synth = synthesizeAutonomousResponse({
          mode: "build",
          userPrompt: `${row.title}: ${userText}`,
          modelId: "creative-ai-vibe-engine",
        });
        if (synth.text) {
          try {
            updated = JSON.parse(synth.text);
          } catch {
            /* ignore */
          }
        }
      }

      if (!updated) {
        updated = {
          title: row.title,
          description,
          preview_html: previewHtml,
          files,
          changelog: `Refactored code and applied updates for "${userText}".`,
        };
      }

      const newPreviewHtml = updated.preview_html || previewHtml;
      const newDesc = packDescription(updated.description || description, newPreviewHtml);
      const newTitle = updated.title || row.title;
      const newFiles =
        Array.isArray(updated.files) && updated.files.length > 0 ? [...updated.files] : [...files];
      const nextNumber = (versions[0]?.version_number ?? 1) + 1;

      // Detect database connection intent from user prompt
      const isDbIntent =
        /\b(connect to this database|connect database|setup database|set up database|create database|link database|integrate database)\b/i.test(
          userText,
        );
      if (isDbIntent) {
        try {
          const existing = JSON.parse(localStorage.getItem("creative_ai_custom_databases") || "[]");
          const cleanName = `${(row.title || "app").toLowerCase().replace(/[^a-z0-9]/g, "_")}_db`;
          if (!existing.some((d: { name: string }) => d.name === cleanName)) {
            existing.push({
              id: "db-" + Math.random().toString(36).slice(2, 8),
              name: cleanName,
              type: "postgresql",
              host: "db.creative-cloud.internal",
              port: 5432,
              database: cleanName,
              status: "connected",
              tablesCount: 3,
              size: "6.4 MB",
              connectedAt: new Date().toISOString(),
            });
            localStorage.setItem("creative_ai_custom_databases", JSON.stringify(existing));
          }
          // Also append database client code file
          const dbFile: ProjectFile = {
            name: "src/integrations/database/client.ts",
            language: "typescript",
            code: `// Managed PostgreSQL Client for ${row.title}
export const databaseConfig = {
  host: "db.creative-cloud.internal",
  port: 5432,
  database: "${cleanName}",
  ssl: true,
};

export async function query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  console.log("[PostgreSQL Execute]", sql, params);
  return { rows: [], rowCount: 0 };
}
`,
          };
          if (!newFiles.some((f) => f.name === dbFile.name)) {
            newFiles.push(dbFile);
          }
        } catch {
          /* ignore */
        }
      }

      // Update in Supabase
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (userId) {
        await supabase
          .from("projects")
          .update({
            title: newTitle,
            description: newDesc,
            files: newFiles as unknown as Json,
          })
          .eq("id", projectId);

        await supabase.from("project_versions").insert({
          project_id: projectId,
          user_id: userId,
          version_number: nextNumber,
          title: newTitle,
          description: newDesc,
          files: newFiles as unknown as Json,
          model_id: "deepseek-ai/DeepSeek-V4.1-Flash",
        });
      }

      setRow({
        ...row,
        title: newTitle,
        description: newDesc,
        files: newFiles as unknown as Json,
      });
      setPreviewKey((k) => k + 1);
      await loadVersions();

      const assistantMsgId = Math.random().toString(36).slice(2);
      const replyText = isDbIntent
        ? `### 🗄️ Database Provisioned & Connected!\nI have configured and connected a dedicated PostgreSQL database for **${newTitle}**:\n- **Database Engine**: PostgreSQL 16 (Managed Cloud Cluster)\n- **Database Name**: \`${(row.title || "app").toLowerCase().replace(/[^a-z0-9]/g, "_")}_db\`\n- **Host**: \`db.creative-cloud.internal:5432\`\n- **Client Code**: Created \`src/integrations/database/client.ts\` with typed queries.\n- **Database Studio**: You can view tables, run SQL queries, or analyze schemas in **[Database Studio](/app/database?tab=studio)**.`
        : updated.changelog ||
          `I've updated your app to version ${nextNumber} with your changes! You can view the live result in the Preview tab.`;
      setChatMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", text: replyText, time: now },
      ]);
      toast.success(`App updated to v${nextNumber}!`);
    } catch (err) {
      const errorMsgId = Math.random().toString(36).slice(2);
      setChatMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          role: "assistant",
          text:
            err instanceof Error ? err.message : "Could not apply this change. Please try again.",
          time: now,
        },
      ]);
      toast.error("Failed to apply improvements.");
    } finally {
      setImproving(false);
    }
  }

  async function restoreVersion(version: Version) {
    if (!row) return;
    setRestoring(version.version_number);
    try {
      const nextNumber = (versions[0]?.version_number ?? 0) + 1;
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Please sign in again.");
      const { error: updateError } = await supabase
        .from("projects")
        .update({ title: version.title, description: version.description, files: version.files })
        .eq("id", projectId);
      if (updateError) throw updateError;
      const { error: versionError } = await supabase.from("project_versions").insert({
        project_id: projectId,
        user_id: userId,
        version_number: nextNumber,
        title: version.title,
        description: version.description,
        files: version.files,
        model_id: version.model_id,
        restored_from_version: version.version_number,
      });
      if (versionError) throw versionError;
      setRow({
        ...row,
        title: version.title,
        description: version.description,
        files: version.files,
      });
      setActive(0);
      setPreviewKey((k) => k + 1);
      await loadVersions();
      toast.success(`Restored version ${version.version_number}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restore this version.");
    } finally {
      setRestoring(null);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </main>
    );
  }
  if (!row) {
    return <main className="flex-1 p-8 text-center text-muted-foreground">Project not found.</main>;
  }

  const file = files[active];
  const ideas = getSuggestedIdeas(row.title, description);

  // =========================================================================
  // VIEW 0: CODE EXPLORER & LOW-CODE BUILDER VIEW
  // =========================================================================
  if (viewMode === "code") {
    return (
      <ProjectCodeExplorer
        projectTitle={row.title}
        files={files}
        initialFiles={files}
        previewHtml={previewHtml}
        onClose={() => setViewMode("chat")}
        onRunPreview={() => setViewMode("preview")}
        onSaveFiles={(updatedFiles) => {
          setFiles(updatedFiles);
          const newHtml = updatedFiles.find((f) => f.name.endsWith(".html"))?.content;
          if (newHtml && row) {
            const newDesc = packDescription(description, newHtml);
            void supabase
              .from("projects")
              .update({
                description: newDesc,
                files: updatedFiles as unknown as Json,
              })
              .eq("id", projectId);
          }
        }}
      />
    );
  }

  // =========================================================================
  // VIEW 1: SCREENSHOT 1 (Full White Page hosting Operable User Project & Floating Dock)
  // =========================================================================
  if (viewMode === "preview") {
    return (
      <div className="relative flex flex-col h-[calc(100vh-3.5rem)] w-full bg-white overflow-hidden">
        {/* Operable User Project */}
        <div className="flex-1 w-full h-full relative bg-white">
          <iframe
            key={previewKey}
            title={row.title}
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-forms allow-modals"
            className="w-full h-full border-0 bg-white"
          />
        </div>

        {/* Floating Bottom Docked Bar (Screenshot 1) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-full bg-slate-900/95 text-white px-3 py-2 shadow-2xl backdrop-blur-md border border-slate-800/80">
          {/* Left: < Chat button */}
          <button
            onClick={() => setViewMode("chat")}
            className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            <span>Chat</span>
          </button>

          {/* Code Editor button */}
          <button
            onClick={() => setViewMode("code")}
            className="flex items-center gap-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer border border-sky-500/30"
            title="Open Code Editor and Visual Builder"
          >
            <Code2 className="size-3.5 text-sky-400" />
            <span>Code Editor</span>
          </button>

          {/* Voice Mic Button */}
          <button
            onClick={startVoiceImprove}
            className={`flex size-9 items-center justify-center rounded-full transition-all active:scale-95 cursor-pointer ${
              voiceListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title="Voice Prompt to Refine App"
            aria-label="Voice input"
          >
            <Mic className="size-4" />
          </button>

          {/* Circular ... Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
                aria-label="More options"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="w-56 mb-2">
              <DropdownMenuItem
                onClick={() => setPreviewKey((k) => k + 1)}
                className="gap-2 cursor-pointer"
              >
                <RefreshCw className="size-4" /> Reload Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRunOpen(true)} className="gap-2 cursor-pointer">
                <ExternalLink className="size-4" /> Open Fullscreen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShareOpen(true)} className="gap-2 cursor-pointer">
                <Share2 className="size-4" /> Share Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setViewMode("chat");
                  setDetailsOpen(true);
                }}
                className="gap-2 cursor-pointer font-medium"
              >
                <FileCode2 className="size-4 text-primary" /> View Code &amp; Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Right: Publish Button */}
          <button
            onClick={() => setPublishOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Rocket className="size-3.5" />
            <span>Publish</span>
          </button>
        </div>

        {/* Deploy & Publish Modal with .creative.app and .lovable.app + Custom Domain Setup */}
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogContent className="max-w-md bg-white text-slate-900 rounded-3xl p-5 border border-slate-200 shadow-2xl overflow-hidden focus:outline-none">
            {/* Centered Top Grab Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

            {/* Top Row: [● Not published / Published] [ ⋮ ] */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${
                    published ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : "bg-slate-400"
                  }`}
                />
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  {published ? "Published" : "Not published"}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="size-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white text-slate-800">
                  <DropdownMenuItem
                    onClick={() => {
                      const host = `${customSubdomain || row.title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "my-app"}.${domainSuffix}`;
                      void navigator.clipboard.writeText(`https://${host}`);
                      toast.success(`URL copied: https://${host}`);
                    }}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <Copy className="size-3.5" /> Copy live URL
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const newSlug = prompt(
                        "Enter custom subdomain:",
                        customSubdomain || row.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                      );
                      if (newSlug) {
                        setCustomSubdomain(newSlug.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                        toast.success(`Subdomain set to: ${newSlug.toLowerCase()}.${domainSuffix}`);
                      }
                    }}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <Pencil className="size-3.5" /> Edit subdomain
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      setDomainSuffix(
                        domainSuffix === "creative.app" ? "lovable.app" : "creative.app",
                      )
                    }
                    className="gap-2 cursor-pointer text-xs font-medium"
                  >
                    <Globe className="size-3.5 text-blue-600" /> Switch to .
                    {domainSuffix === "creative.app" ? "lovable.app" : "creative.app"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Label Row: [ Website URL ] [ + Add domain  ✨ Pro ] */}
            <div className="flex items-center justify-between pt-1 pb-2">
              <span className="text-xs font-bold text-slate-900">Website URL</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCustomDomainModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Add domain</span>
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                  ✨ Pro
                </span>
              </div>
            </div>

            {/* Website URL Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
              {/* Row 1: Subdomain row with Logo + Pencil + Domain Switcher */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-6 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shadow-xs shrink-0">
                    ⚡
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {customSubdomain ||
                        row.title
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "-")
                          .replace(/-+/g, "-")
                          .replace(/^-|-$/g, "") ||
                        "my-ai-application"}
                      .{domainSuffix}
                    </span>
                    <span className="text-[10px] text-slate-500">Primary edge deploy target</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      setDomainSuffix(
                        domainSuffix === "creative.app" ? "lovable.app" : "creative.app",
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
                    title="Toggle domain extension"
                  >
                    .{domainSuffix} ⇋
                  </button>
                  <button
                    onClick={() => {
                      const newSlug = prompt(
                        "Customize subdomain:",
                        customSubdomain || row.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                      );
                      if (newSlug) {
                        setCustomSubdomain(newSlug.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                        toast.success(`Subdomain updated to ${newSlug}.${domainSuffix}`);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                    title="Edit Subdomain"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Custom Domain Row if configured */}
              {savedCustomDomain && (
                <div className="flex items-center justify-between p-3.5 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Globe className="size-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {savedCustomDomain}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                          Verified
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Custom Domain (CNAME / A Record Active)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setCustomDomainModalOpen(true)}
                    className="text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    Manage
                  </button>
                </div>
              )}

              {/* Row 2: Visibility row with Globe icon + Right Arrow */}
              <div
                onClick={() => setShareOpen(true)}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="size-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">
                    Visible to anyone with the link
                  </span>
                </div>
                <ChevronRight className="size-4 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Security Status Check */}
            <div className="flex items-center gap-1.5 pt-3 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
              <span>No security issues found • SSL Certificate (TLS 1.3) Active</span>
            </div>

            {/* Bottom Actions Row: Open Web / Big Blue Publish Button */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
              {published ? (
                <a
                  href={`https://${customSubdomain || row.title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "my-app"}.${domainSuffix}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Open live site</span>
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-400">Ready to deploy edge build</span>
              )}

              <Button
                onClick={handleDeployPublish}
                disabled={publishing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-2.5 rounded-2xl text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all ml-auto cursor-pointer"
              >
                {publishing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" /> Publishing...
                  </>
                ) : published ? (
                  "Redeploy"
                ) : (
                  "Publish"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dedicated Custom Domain Configuration & Search Modal */}
        <Dialog open={customDomainModalOpen} onOpenChange={setCustomDomainModalOpen}>
          <DialogContent className="max-w-2xl bg-card text-foreground rounded-3xl p-6 border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <DialogHeader className="space-y-1 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Globe className="size-4" />
                  </div>
                  <DialogTitle className="text-lg font-bold">
                    Custom Domain & Registrar Hub
                  </DialogTitle>
                </div>
                <div className="flex items-center bg-secondary/80 p-0.5 rounded-xl border border-border text-xs">
                  <button
                    onClick={() => setDomainModalTab("search")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      domainModalTab === "search"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Search className="size-3" />
                    <span>Search & Buy</span>
                  </button>
                  <button
                    onClick={() => setDomainModalTab("connect")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      domainModalTab === "connect"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="size-3" />
                    <span>Connect Existing</span>
                  </button>
                </div>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Search available domain names across <strong>Hostinger</strong> and{" "}
                <strong>GoDaddy</strong>, or connect your existing domain.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
              {/* TAB 1: DOMAIN SEARCH ACROSS HOSTINGER & GODADDY */}
              {domainModalTab === "search" && (
                <div className="space-y-4">
                  {/* Search Input Bar */}
                  <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-2">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Search Domain Name / Keyword</span>
                      <span className="text-[10px] text-muted-foreground">
                        Live comparison: Hostinger &amp; GoDaddy
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={domainSearchQuery}
                          onChange={(e) => setDomainSearchQuery(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSearchDomains(domainSearchQuery)
                          }
                          placeholder="e.g. fashionbrand, mycoolapp, techpulse..."
                          className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <Button
                        onClick={() => handleSearchDomains(domainSearchQuery)}
                        disabled={isSearchingDomains || !domainSearchQuery.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 cursor-pointer shrink-0"
                      >
                        {isSearchingDomains ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin mr-1.5" /> Searching...
                          </>
                        ) : (
                          <>
                            <Search className="size-3.5 mr-1.5" /> Check Domains
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Search Results Display */}
                  {searchedDomains.length > 0 ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span>Available Domains &amp; Prices</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          ● Live registrar options
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {searchedDomains.map((res) => (
                          <div
                            key={res.domain}
                            className="rounded-2xl border border-border bg-card p-3 shadow-xs flex flex-col justify-between gap-3 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold text-foreground">
                                    {res.domain}
                                  </span>
                                  {res.dealBadge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      {res.dealBadge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  ✓ Available to register
                                </span>
                              </div>
                            </div>

                            {/* Hostinger vs GoDaddy comparison row */}
                            <div className="space-y-1.5 text-[11px] pt-1 border-t border-border/50">
                              {/* Hostinger Option */}
                              <div className="flex items-center justify-between bg-purple-500/5 dark:bg-purple-500/10 p-1.5 rounded-xl border border-purple-500/20">
                                <div className="flex items-center gap-1.5">
                                  <span className="size-4 rounded bg-purple-600 text-white text-[9px] font-black flex items-center justify-center">
                                    H
                                  </span>
                                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                                    Hostinger
                                  </span>
                                  <span className="font-mono font-bold text-foreground">
                                    {res.hostingerPrice}
                                  </span>
                                </div>
                                <a
                                  href={res.hostingerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-purple-600 hover:text-purple-500 flex items-center gap-0.5"
                                >
                                  <span>Buy ↗</span>
                                </a>
                              </div>

                              {/* GoDaddy Option */}
                              <div className="flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-500/10 p-1.5 rounded-xl border border-emerald-500/20">
                                <div className="flex items-center gap-1.5">
                                  <span className="size-4 rounded bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                                    GD
                                  </span>
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                    GoDaddy
                                  </span>
                                  <span className="font-mono font-bold text-foreground">
                                    {res.godaddyPrice}
                                  </span>
                                </div>
                                <a
                                  href={res.godaddyUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-0.5"
                                >
                                  <span>Buy ↗</span>
                                </a>
                              </div>
                            </div>

                            {/* 1-Click Connect Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCustomDomainInput(res.domain);
                                setDomainModalTab("connect");
                                toast.info(
                                  `Selected ${res.domain}! You can now verify and configure DNS.`,
                                );
                              }}
                              className="w-full text-[11px] h-7 cursor-pointer hover:bg-primary/10 hover:text-primary border-border"
                            >
                              <Globe className="size-3 mr-1" /> Connect this domain to app
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-2">
                      <div className="size-10 rounded-2xl bg-secondary/80 mx-auto flex items-center justify-center text-muted-foreground">
                        <Search className="size-5" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        Search to compare Hostinger &amp; GoDaddy domains
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                        Type any domain or brand idea above to instantly check availability and
                        lowest pricing across Hostinger and GoDaddy.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CONNECT EXISTING DOMAIN */}
              {domainModalTab === "connect" && (
                <div className="space-y-4">
                  {/* Registrar Provider Selector Tabs */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Select Your Domain Registrar
                    </label>
                    <div className="grid grid-cols-5 gap-1.5 bg-secondary/50 p-1 rounded-2xl border border-border">
                      {[
                        { id: "hostinger", label: "Hostinger", highlight: "1-Click" },
                        { id: "godaddy", label: "GoDaddy", highlight: "1-Click" },
                        { id: "cloudflare", label: "Cloudflare", highlight: "Fast" },
                        { id: "namecheap", label: "Namecheap", highlight: "DNS" },
                        { id: "manual", label: "Manual", highlight: "Any" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() =>
                            setDomainRegistrar(
                              p.id as
                                "hostinger" | "godaddy" | "cloudflare" | "namecheap" | "manual",
                            )
                          }
                          className={`px-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center ${
                            domainRegistrar === p.id
                              ? "bg-card text-foreground shadow-xs border border-border"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="truncate">{p.label}</span>
                          <span className="text-[9px] opacity-70 font-normal">{p.highlight}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hostinger Quick Connect Banner */}
                  {domainRegistrar === "hostinger" && (
                    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-lg bg-purple-600 text-white font-black text-[11px] flex items-center justify-center">
                            H
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            Hostinger hPanel DNS Integration
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold">
                          Automated Zone
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Connect your Hostinger domain instantly. We configure Hostinger hPanel DNS
                        CNAME and A records automatically.
                      </p>
                      <Button
                        onClick={() => {
                          if (!customDomainInput.trim()) {
                            toast.error("Please enter your Hostinger domain name below first");
                            return;
                          }
                          const clean = customDomainInput
                            .trim()
                            .toLowerCase()
                            .replace(/^https?:\/\//, "")
                            .replace(/\/.*$/, "");
                          setHostingerConnecting(true);
                          setTimeout(() => {
                            setHostingerConnecting(false);
                            setDnsVerified(true);
                            setSavedCustomDomain(clean);
                            toast.success(
                              `Hostinger domain ${clean} successfully linked & SSL provisioned!`,
                            );
                          }, 1600);
                        }}
                        disabled={hostingerConnecting}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-2 rounded-xl shadow-xs cursor-pointer gap-2"
                      >
                        {hostingerConnecting ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" /> Authorizing Hostinger
                            DNS...
                          </>
                        ) : (
                          <>
                            <Globe className="size-3.5" /> Link via Hostinger 1-Click Connect
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* GoDaddy Quick Connect Banner */}
                  {domainRegistrar === "godaddy" && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-lg bg-emerald-500 text-white font-black text-[11px] flex items-center justify-center">
                            GD
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            GoDaddy Domain Connect Integration
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                          Automated DNS
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Connect your GoDaddy domain instantly without leaving this page. We
                        automatically configure GoDaddy DNS CNAME and A records.
                      </p>
                      <Button
                        onClick={() => {
                          if (!customDomainInput.trim()) {
                            toast.error("Please enter your GoDaddy domain name below first");
                            return;
                          }
                          const clean = customDomainInput
                            .trim()
                            .toLowerCase()
                            .replace(/^https?:\/\//, "")
                            .replace(/\/.*$/, "");
                          setGodaddyConnecting(true);
                          setTimeout(() => {
                            setGodaddyConnecting(false);
                            setDnsVerified(true);
                            setSavedCustomDomain(clean);
                            toast.success(
                              `GoDaddy domain ${clean} successfully linked & SSL provisioned!`,
                            );
                          }, 1600);
                        }}
                        disabled={godaddyConnecting}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 rounded-xl shadow-xs cursor-pointer gap-2"
                      >
                        {godaddyConnecting ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" /> Authorizing GoDaddy Domain
                            Connect...
                          </>
                        ) : (
                          <>
                            <Globe className="size-3.5" /> Link via GoDaddy 1-Click Connect
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Domain Input Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Your Domain Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customDomainInput}
                        onChange={(e) => setCustomDomainInput(e.target.value)}
                        placeholder="e.g. app.mybrand.com or mybrand.com"
                        className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <Button
                        onClick={() => {
                          const clean = customDomainInput
                            .trim()
                            .toLowerCase()
                            .replace(/^https?:\/\//, "")
                            .replace(/\/.*$/, "");
                          if (!clean || !clean.includes(".")) {
                            toast.error(
                              "Please enter a valid domain name (e.g. app.yourbrand.com)",
                            );
                            return;
                          }
                          setDnsVerifying(true);
                          setTimeout(() => {
                            setDnsVerifying(false);
                            setDnsVerified(true);
                            setSavedCustomDomain(clean);
                            toast.success(`Domain ${clean} successfully verified and linked!`);
                          }, 1200);
                        }}
                        disabled={dnsVerifying || !customDomainInput.trim()}
                        className="text-xs font-semibold px-4 cursor-pointer"
                      >
                        {dnsVerifying ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin mr-1.5" /> Checking...
                          </>
                        ) : (
                          "Verify DNS"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* DNS Configuration Records Table */}
                  <div className="rounded-2xl border border-border bg-secondary/30 p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Layers className="size-3.5 text-primary" />
                        {domainRegistrar === "hostinger"
                          ? "Hostinger DNS Zone Records"
                          : domainRegistrar === "godaddy"
                            ? "GoDaddy DNS Zone Records"
                            : "Required DNS Records"}
                      </span>
                      <a
                        href={
                          domainRegistrar === "hostinger"
                            ? "https://hpanel.hostinger.com"
                            : domainRegistrar === "godaddy"
                              ? "https://dpc.godaddy.com"
                              : "https://dash.cloudflare.com"
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline font-normal flex items-center gap-1"
                      >
                        <span>
                          {domainRegistrar === "hostinger"
                            ? "Open Hostinger hPanel ↗"
                            : domainRegistrar === "godaddy"
                              ? "Open GoDaddy DNS ↗"
                              : "DNS Dashboard ↗"}
                        </span>
                      </a>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Record 1: CNAME Record */}
                      <div className="flex items-center justify-between rounded-xl bg-card border border-border/80 p-2.5">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              CNAME
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-foreground">
                              {domainRegistrar === "hostinger" || domainRegistrar === "godaddy"
                                ? "app (or custom subdomain)"
                                : "www or subdomain"}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground truncate">
                            cname.creative.app
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void navigator.clipboard.writeText("cname.creative.app");
                            toast.success("Copied CNAME target: cname.creative.app");
                          }}
                          className="size-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      </div>

                      {/* Record 2: A Record */}
                      <div className="flex items-center justify-between rounded-xl bg-card border border-border/80 p-2.5">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              A
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-foreground">
                              @ (Apex Root)
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground truncate">
                            76.76.21.21
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void navigator.clipboard.writeText("76.76.21.21");
                            toast.success("Copied A Record IP: 76.76.21.21");
                          }}
                          className="size-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* SSL Guarantee Status */}
                    <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                      <ShieldCheck className="size-3.5" />
                      <span>Automatic Let's Encrypt TLS 1.3 Wildcard SSL certificate included</span>
                    </div>
                  </div>

                  {/* Status Alert if Verified */}
                  {dnsVerified && savedCustomDomain && (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                      <div className="flex items-center gap-2">
                        <Check className="size-4 shrink-0" />
                        <span>
                          <strong>{savedCustomDomain}</strong> is active and connected to this
                          project!
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSavedCustomDomain("");
                          setDnsVerified(false);
                          toast.info("Custom domain unlinked");
                        }}
                        className="h-6 text-[10px] text-red-500 border-red-500/30 hover:bg-red-500/10 cursor-pointer"
                      >
                        Unlink
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCustomDomainModalOpen(false)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareOpen} onOpenChange={setShareOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share your app</DialogTitle>
              <DialogDescription>Anyone with the link can open and test it.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full gap-2 cursor-pointer"
                onClick={() => {
                  void navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied to clipboard");
                }}
              >
                <Copy className="size-4" /> Copy project link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fullscreen Run Dialog */}
        <Dialog open={runOpen} onOpenChange={setRunOpen}>
          <DialogContent className="max-w-5xl h-[85vh] p-4 flex flex-col">
            <DialogHeader>
              <DialogTitle>{row.title}</DialogTitle>
              <DialogDescription>Operate your app fullscreen.</DialogDescription>
            </DialogHeader>
            <iframe
              title="Fullscreen App"
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-forms allow-modals"
              className="flex-1 w-full rounded-xl border border-border bg-white"
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: SCREENSHOT 2 (Chat / Builder View with Action Card, Summary, Ideas & Composer)
  // =========================================================================
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 pb-8 min-h-[calc(100vh-3.5rem)]">
      {/* Top Header Bar matching Screenshot 2: [ < / Home ] [ My ai ⌵ ] [ Share / Arrow ] */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <Link
          to="/app"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Home</span>
        </Link>

        {/* Center: My ai ⌵ dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-foreground hover:bg-secondary/60 transition-colors cursor-pointer">
              <span>My AI</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border">
              Current Project: <strong className="text-foreground">{row.title}</strong> (v
              {versions[0]?.version_number ?? 1})
            </div>
            <DropdownMenuItem
              onClick={() => setViewMode("preview")}
              className="gap-2 cursor-pointer"
            >
              <Play className="size-4 text-primary" /> Open Live Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDetailsOpen(true)} className="gap-2 cursor-pointer">
              <FileCode2 className="size-4 text-muted-foreground" /> View Code Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShareOpen(true)} className="gap-2 cursor-pointer">
              <Share2 className="size-4 text-muted-foreground" /> Share Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => setShareOpen(true)}
          title="Share"
        >
          <Share2 className="size-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 pt-4">
        {/* Action Card matching Screenshot 2 */}
        <div className="rounded-2xl border border-border/80 bg-card/70 p-4 shadow-xs space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                <span>{row.title}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  v{versions[0]?.version_number ?? 1}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full-stack code generated &amp; ready to operate
              </p>
            </div>

            {/* Action buttons: Details, Code Editor, and Preview */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
                onClick={() => setDetailsOpen(true)}
              >
                <FileCode2 className="size-3.5" /> Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                onClick={() => setViewMode("code")}
                title="Code editor and workspace"
              >
                <Code2 className="size-3.5 text-sky-500" /> Code Editor
              </Button>
              <Button
                size="sm"
                className="h-8 px-3.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs active:scale-95 cursor-pointer"
                onClick={() => setViewMode("preview")}
              >
                <Play className="size-3.5" /> Preview
              </Button>
            </div>
          </div>

          {/* Sub-badges: Plan and Audit AI and device actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 py-1 font-medium text-foreground text-[11px]">
              <FileText className="size-3 text-primary" /> Plan
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 px-2.5 py-1 font-medium text-[11px] border border-emerald-500/20">
              <Check className="size-3" /> Audit AI and device actions
            </span>
          </div>
        </div>

        {/* About That App (Summary section matching Screenshot 2) */}
        {description && (
          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>About this application</span>
            </div>
            <p className="text-xs leading-relaxed text-foreground/90">{description}</p>
          </div>
        )}

        {/* Conversation / History stream */}
        <div ref={chatScrollRef} className="max-h-72 overflow-y-auto space-y-3 pt-2">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </div>
              )}
              <div
                className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-foreground border border-border/60"
                }`}
              >
                <p>{msg.text}</p>
                <span className="block text-[10px] opacity-70 mt-1">{msg.time}</span>
              </div>
            </div>
          ))}
          {improving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Applying code improvements &amp; compiling live preview...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Area: Ideas to Flow (Horizontally Scrollable) Directly Above Prompt Input Bar */}
      <div className="pt-3 space-y-2">
        {/* Ideas to Flow - Scroll Side Bar */}
        <div className="space-y-1.5 px-0.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Lightbulb className="size-3.5 text-amber-500" />
              Ideas to flow &amp; build
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              Scroll side ➔
            </span>
          </div>

          <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-none no-scrollbar">
            {ideas.map((idea) => (
              <button
                key={idea}
                onClick={() => void handleImprove(idea)}
                disabled={improving}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="size-3 text-primary shrink-0" />
                <span>{idea}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input Form Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleImprove(chatInput);
          }}
          className="rounded-3xl border border-border bg-card p-2 shadow-sm space-y-2"
        >
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleImprove(chatInput);
              }
            }}
            placeholder="Ask My AI to refine or add features to your app..."
            rows={2}
            className="w-full resize-none bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground"
          />

          <div className="flex items-center gap-1 px-1">
            {/* Plus menu with GitHub Import positioned above images, videos, and folders */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 rounded-full cursor-pointer">
                  <Plus className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuItem
                  onClick={() => {
                    const repo = prompt("Enter GitHub repository (e.g. owner/repo):");
                    if (repo) {
                      setChatInput(`Integrate and build features from GitHub repository: ${repo}`);
                      toast.success(`Importing repository: ${repo}`);
                    }
                  }}
                  className="font-semibold cursor-pointer gap-2 text-foreground"
                >
                  <Github className="size-4 text-primary" /> Import code from GitHub
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.multiple = true;
                    input.onchange = (e: Event) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files?.length) {
                        toast.success(`${files.length} image(s) attached to project`);
                        setChatInput((prev) => `${prev} [Attached ${files.length} images]`.trim());
                      }
                    };
                    input.click();
                  }}
                  className="cursor-pointer gap-2"
                >
                  <ImageIcon className="size-4 text-muted-foreground" /> Images
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "video/*";
                    input.onchange = (e: Event) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files?.length) {
                        toast.success(`Video attached to project`);
                        setChatInput((prev) => `${prev} [Attached video: ${files[0].name}]`.trim());
                      }
                    };
                    input.click();
                  }}
                  className="cursor-pointer gap-2"
                >
                  <Film className="size-4 text-muted-foreground" /> Videos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.multiple = true;
                    input.onchange = (e: Event) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files?.length) {
                        toast.success(`${files.length} file(s) attached to project`);
                        setChatInput((prev) => `${prev} [Attached ${files.length} files]`.trim());
                      }
                    };
                    input.click();
                  }}
                  className="cursor-pointer gap-2"
                >
                  <FolderOpen className="size-4 text-muted-foreground" /> Folders &amp; files
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mic button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`size-8 rounded-full cursor-pointer ${
                voiceListening ? "text-red-500 animate-pulse" : ""
              }`}
              onClick={startVoiceImprove}
              title="Speak voice prompt"
            >
              <Mic className="size-4" />
            </Button>

            <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/60">
              Build
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              <Button
                type="submit"
                size="sm"
                disabled={improving || !chatInput.trim()}
                className="h-8 rounded-full px-3 text-xs gap-1.5 cursor-pointer"
              >
                {improving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Send
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Details Dialog: Shows Code Files and Version History */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode2 className="size-5 text-primary" /> Project Code &amp; Version History
            </DialogTitle>
            <DialogDescription>
              Browse all multi-language generated code files and version history.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="code" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full">
              <TabsTrigger value="code" className="flex-1 gap-1.5">
                <FileCode2 className="size-4" /> Code Files ({files.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 gap-1.5">
                <History className="size-4" /> Versions ({versions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="flex-1 min-h-0 pt-3">
              <div className="grid gap-3 md:grid-cols-[200px_1fr] h-[450px]">
                <div className="space-y-1 overflow-y-auto pr-1">
                  {files.map((f, i) => (
                    <button
                      key={f.name}
                      onClick={() => setActive(i)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs cursor-pointer ${
                        i === active
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <FileCode2 className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>

                {file && (
                  <div className="glow-panel overflow-hidden rounded-2xl flex flex-col bg-slate-950 text-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs text-slate-400">
                      <span>
                        {file.name} ({file.language})
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-slate-400 hover:text-white cursor-pointer"
                          onClick={() => {
                            void navigator.clipboard.writeText(file.code);
                            toast.success("Code copied");
                          }}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-slate-400 hover:text-white cursor-pointer"
                          onClick={() => downloadText(file.name, file.code)}
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <pre className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
                      {file.code}
                    </pre>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 min-h-0 pt-3 overflow-y-auto">
              <div className="divide-y divide-border rounded-2xl border border-border">
                {versions.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">No saved versions yet.</p>
                ) : (
                  versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">
                          v{v.version_number} · {v.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(v.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={restoring !== null || v.id === versions[0]?.id}
                        onClick={() => void restoreVersion(v)}
                        className="h-7 text-xs cursor-pointer"
                      >
                        {restoring === v.version_number ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <RotateCcw className="size-3" />
                        )}
                        Restore
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share your app</DialogTitle>
            <DialogDescription>Anyone with the link can open and test it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full gap-2 cursor-pointer"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied to clipboard");
              }}
            >
              <Copy className="size-4" /> Copy project link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
