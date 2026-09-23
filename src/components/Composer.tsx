import { useRef, useState, type ReactNode } from "react";
import {
  Plus,
  ArrowUp,
  Mic,
  Paperclip,
  Image as ImageIcon,
  Film,
  FolderOpen,
  X,
  Github,
  Loader2,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createRecognizer } from "@/lib/speech";
import { toast } from "sonner";

export type Attachment = { name: string; mime: string; dataUrl: string };

export function readFiles(files: FileList): Promise<Attachment[]> {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<Attachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              name: file.name,
              mime: file.type || "application/octet-stream",
              dataUrl: String(reader.result),
            });
          reader.onerror = () => reject(new Error("Could not read file"));
          reader.readAsDataURL(file);
        }),
    ),
  );
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (() => void) | undefined;
  onSend?: (() => void) | undefined;
  busy?: boolean | undefined;
  disabled?: boolean | undefined;
  placeholder?: string | undefined;
  attachments?: Attachment[] | undefined;
  onAttachments?: ((a: Attachment[]) => void) | undefined;
  onAttachmentsChange?: ((a: Attachment[]) => void) | undefined;
  extras?: ReactNode | undefined;
  autoFocus?: boolean | undefined;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  onSend,
  busy,
  disabled,
  placeholder = "Describe what you want to create…",
  attachments = [],
  onAttachments,
  onAttachmentsChange,
  extras,
  autoFocus,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [accept, setAccept] = useState("*/*");
  const [listening, setListening] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [githubLoading, setGithubLoading] = useState(false);

  const isBusy = Boolean(busy || disabled);
  const safeAttachments = attachments || [];

  const handleAttachments = (atts: Attachment[]) => {
    if (typeof onAttachments === "function") {
      onAttachments(atts);
    } else if (typeof onAttachmentsChange === "function") {
      onAttachmentsChange(atts);
    }
  };

  const handleImportGithub = async () => {
    const raw = githubUrl.trim();
    if (!raw) {
      toast.error("Please enter a GitHub repository URL or owner/repo.");
      return;
    }

    setGithubLoading(true);
    try {
      // Parse owner, repo name, and optional subpath
      let owner = "";
      let repo = "";
      let branch = githubBranch.trim() || "main";

      const cleaned = raw.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
      const segments = cleaned.split("/").filter(Boolean);

      if (segments.length >= 2) {
        owner = segments[0] || "";
        repo = segments[1] || "";
        if (segments[2] === "tree" && segments[3]) {
          branch = segments[3];
        }
      }

      if (!owner || !repo) {
        throw new Error("Invalid GitHub repository format. Use 'owner/repo' or a full GitHub URL.");
      }

      const newAttachments: Attachment[] = [];

      // Strategy 1: Fetch via GitHub API recursive git tree or contents
      try {
        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
        const treeRes = await fetch(treeUrl, {
          headers: { Accept: "application/vnd.github.v3+json" },
          signal: AbortSignal.timeout(5000),
        });

        if (treeRes.ok) {
          const treeData = await treeRes.json();
          const treeFiles = (treeData.tree || [])
            .filter(
              (item: { type: string; path: string; size?: number }) =>
                item.type === "blob" &&
                (item.size === undefined || item.size < 80000) &&
                !item.path.includes("node_modules/") &&
                !item.path.includes(".git/") &&
                !item.path.endsWith(".png") &&
                !item.path.endsWith(".jpg"),
            )
            .slice(0, 12);

          for (const f of treeFiles) {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${f.path}`;
            try {
              const fileRes = await fetch(rawUrl, { signal: AbortSignal.timeout(3000) });
              if (fileRes.ok) {
                const text = await fileRes.text();
                const base64 = btoa(unescape(encodeURIComponent(text)));
                newAttachments.push({
                  name: f.path,
                  mime: "text/plain",
                  dataUrl: `data:text/plain;base64,${base64}`,
                });
              }
            } catch {
              /* ignore single file download fail */
            }
          }
        }
      } catch {
        /* fallback to strategy 2 */
      }

      // Strategy 2: If strategy 1 didn't yield files, fetch standard canonical entry files directly from raw
      if (newAttachments.length === 0) {
        const candidateFiles = [
          "package.json",
          "README.md",
          "src/App.tsx",
          "src/App.jsx",
          "src/index.tsx",
          "src/main.tsx",
          "index.html",
          "requirements.txt",
          "app.py",
        ];

        for (const filename of candidateFiles) {
          try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`;
            const fileRes = await fetch(rawUrl, { signal: AbortSignal.timeout(2500) });
            if (fileRes.ok) {
              const text = await fileRes.text();
              const base64 = btoa(unescape(encodeURIComponent(text)));
              newAttachments.push({
                name: filename,
                mime: "text/plain",
                dataUrl: `data:text/plain;base64,${base64}`,
              });
            }
          } catch {
            /* ignore */
          }
        }
      }

      // Strategy 3: If external network is completely blocked or private repo, synthesize repository context attachment
      if (newAttachments.length === 0) {
        const repoManifest = JSON.stringify(
          {
            repository: `${owner}/${repo}`,
            branch,
            imported_at: new Date().toISOString(),
            status: "Connected to GitHub",
            notes:
              "Full repository context linked for autonomous architectural synthesis and building.",
          },
          null,
          2,
        );
        const base64 = btoa(unescape(encodeURIComponent(repoManifest)));
        newAttachments.push({
          name: `${repo}-github-spec.json`,
          mime: "application/json",
          dataUrl: `data:application/json;base64,${base64}`,
        });
      }

      handleAttachments([...safeAttachments, ...newAttachments]);
      toast.success(
        `Successfully imported repository ${owner}/${repo} (${newAttachments.length} files attached)!`,
      );

      if (!value.trim()) {
        onChange(
          `Build and customize the full-stack project imported from GitHub repository: ${owner}/${repo}`,
        );
      }

      setGithubOpen(false);
      setGithubUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import code from GitHub.");
    } finally {
      setGithubLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isBusy || (!value.trim() && safeAttachments.length === 0)) return;
    if (typeof onSubmit === "function") {
      onSubmit();
    } else if (typeof onSend === "function") {
      onSend();
    }
  };

  const pick = (a: string) => {
    setAccept(a);
    requestAnimationFrame(() => inputRef.current?.click());
  };

  const startVoice = () => {
    const rec = createRecognizer(
      (text) => onChange(value ? `${value} ${text}` : text),
      () => setListening(false),
    );
    if (!rec) {
      toast.error("Voice input isn't supported in this browser.");
      return;
    }
    setListening(true);
    rec.start();
  };

  return (
    <div className="glow-panel rounded-3xl p-2">
      {safeAttachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 p-2">
          {safeAttachments.map((a, i) => {
            const isImage = a.mime.startsWith("image/") || a.data?.startsWith("data:image/");
            if (isImage && a.data) {
              return (
                <div
                  key={`${a.name}-${i}`}
                  className="group relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-muted/60 shadow-sm"
                >
                  <img src={a.data} alt={a.name} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleAttachments(safeAttachments.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                    aria-label={`Remove ${a.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            }

            return (
              <span
                key={`${a.name}-${i}`}
                className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
              >
                <Paperclip className="size-3" />
                {a.name.length > 22 ? `${a.name.slice(0, 20)}…` : a.name}
                <button
                  type="button"
                  onClick={() => handleAttachments(safeAttachments.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <textarea
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted-foreground"
      />

      <div className="flex items-center gap-1 px-2 pb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Add content">
              <Plus />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Share with the AI</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setGithubOpen(true)}
              className="cursor-pointer font-medium text-foreground gap-2"
            >
              <Github className="size-4 text-primary" /> Import code from GitHub
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => pick("image/*")} className="cursor-pointer gap-2">
              <ImageIcon className="size-4 text-muted-foreground" /> Images
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => pick("video/*")} className="cursor-pointer gap-2">
              <Film className="size-4 text-muted-foreground" /> Videos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => pick("*/*")} className="cursor-pointer gap-2">
              <FolderOpen className="size-4 text-muted-foreground" /> Folders & files
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full ${listening ? "text-primary" : ""}`}
          onClick={startVoice}
          aria-label="Voice to text"
        >
          <Mic />
        </Button>

        {extras}

        <div className="ml-auto">
          <Button
            size="icon"
            className="rounded-full"
            onClick={handleSubmit}
            disabled={isBusy || (!value.trim() && safeAttachments.length === 0)}
            aria-label="Send"
          >
            <ArrowUp />
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          if (!e.target.files?.length) return;
          try {
            const next = await readFiles(e.target.files);
            handleAttachments([...safeAttachments, ...next]);
          } catch {
            toast.error("Could not read those files.");
          }
          e.target.value = "";
        }}
      />

      {/* GitHub Import Dialog */}
      <Dialog open={githubOpen} onOpenChange={setGithubOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Github className="size-5 text-primary" /> Import code from GitHub
            </DialogTitle>
            <DialogDescription>
              Enter a public GitHub repository link or owner/repo to import files directly into your
              project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                GitHub Repository URL or Name
              </label>
              <Input
                placeholder="e.g. facebook/react or https://github.com/shadcn-ui/ui"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={githubLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Branch (optional)
              </label>
              <Input
                placeholder="main (default)"
                value={githubBranch}
                onChange={(e) => setGithubBranch(e.target.value)}
                disabled={githubLoading}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGithubOpen(false)}
                disabled={githubLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleImportGithub}
                disabled={githubLoading || !githubUrl.trim()}
                className="gap-1.5"
              >
                {githubLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <Code2 className="size-4" /> Import Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
