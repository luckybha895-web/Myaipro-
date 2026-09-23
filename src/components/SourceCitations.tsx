import React from "react";
import { ExternalLink, Globe } from "lucide-react";

export interface GroundedSourceItem {
  title: string;
  url: string;
  snippet?: string;
}

// Known brand domain map for crisp logos and fallback handling
const DOMAIN_BRAND_NAMES: Record<string, string> = {
  "aws.amazon.com": "Amazon Web Services",
  "amazon.com": "Amazon",
  "awsfundamentals.com": "awsfundamentals.com",
  "wikipedia.org": "Wikipedia",
  "en.wikipedia.org": "Wikipedia",
  "github.com": "GitHub",
  "developer.mozilla.org": "MDN Web Docs",
  "stackoverflow.com": "Stack Overflow",
  "google.com": "Google",
  "microsoft.com": "Microsoft",
  "docs.aws.amazon.com": "AWS Documentation",
  "cloud.google.com": "Google Cloud",
  "supabase.com": "Supabase",
};

export function getDomainFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

export function getFaviconUrl(rawUrl: string): string {
  const domain = getDomainFromUrl(rawUrl);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export function getCleanSourceLabel(source: GroundedSourceItem): string {
  const domain = getDomainFromUrl(source.url);
  if (DOMAIN_BRAND_NAMES[domain]) {
    return DOMAIN_BRAND_NAMES[domain];
  }
  if (source.title && source.title.trim()) {
    // If title has site name, shorten it
    const cleanTitle = source.title.replace(/\s*[-–|•]\s*.*$/, "").trim();
    if (cleanTitle.length <= 28) return cleanTitle;
  }
  return domain;
}

interface SourceCitationsProps {
  sources?: GroundedSourceItem[];
  className?: string;
  onOpenAll?: () => void;
}

/**
 * Helper to remove raw link dumps, "Sources: 1. http..." or citation blocks from the main
 * message body so they are presented cleanly only in the sleek modern pill/sources layout.
 */
export function stripRawLinksFromText(text: string): string {
  if (!text) return "";
  return text
    .replace(
      /(?:###?\s*(?:Sources|References|Citations|Web Sources|Consulted Links)[\s\S]*$)/gi,
      "",
    )
    .replace(
      /(?:\n\n(?:Sources|References|Citations):\s*\n(?:[-*\d.]+\s*(?:\[.*?\]\(https?:\/\/.*?\)|\(?https?:\/\/.*?\))\s*\n*)+$)/gi,
      "",
    )
    .trim();
}

/**
 * High-fidelity Sources & Citations component matching Screenshot 2 (ChatGPT / modern AI assistant):
 * - Top: Clean pill-style source chips displaying app logo, title, and citation count (+1)
 * - Bottom: Minimalist stacked cluster of application & website favicons + "Sources" title
 */
export function SourceCitations({ sources, className = "", onOpenAll }: SourceCitationsProps) {
  if (!sources || sources.length === 0) return null;

  // Filter valid URLs and deduplicate domains for the avatar cluster
  const validSources = sources.filter((s) => s.url && s.url.startsWith("http"));
  if (validSources.length === 0) return null;

  const uniqueDomains: string[] = [];
  const domainSources: GroundedSourceItem[] = [];

  for (const s of validSources) {
    const d = getDomainFromUrl(s.url);
    if (!uniqueDomains.includes(d)) {
      uniqueDomains.push(d);
      domainSources.push(s);
    }
  }

  return (
    <div className={`mt-3 space-y-2.5 pt-2 ${className}`}>
      {/* 1. Pill-style chips matching Screenshot 2: [App Logo] Name +1 */}
      <div className="flex flex-wrap items-center gap-1.5">
        {validSources.slice(0, 6).map((s, idx) => {
          const domain = getDomainFromUrl(s.url);
          const label = getCleanSourceLabel(s);
          const favicon = getFaviconUrl(s.url);

          return (
            <a
              key={idx}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 dark:bg-card/40 hover:bg-accent/80 hover:border-primary/50 px-2.5 py-1 text-xs text-foreground/90 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98]"
              title={s.title || s.url}
            >
              <div className="size-3.5 shrink-0 rounded-full bg-muted/60 overflow-hidden flex items-center justify-center">
                <img
                  src={favicon}
                  alt={domain}
                  className="size-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              <span className="truncate max-w-[200px] text-[11px] font-medium tracking-tight">
                {label}
              </span>

              {/* +1 citation badge matching Screenshot 2 */}
              <span className="text-[10px] text-muted-foreground/70 font-mono font-medium group-hover:text-primary">
                +1
              </span>
            </a>
          );
        })}
      </div>

      {/* 2. Below the chips: Overlapping circular favicons followed by "Sources" */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2">
          {/* Overlapping circular brand logos */}
          <div className="flex -space-x-1.5 items-center">
            {domainSources.slice(0, 4).map((item, idx) => {
              const favicon = getFaviconUrl(item.url);
              const domain = getDomainFromUrl(item.url);
              return (
                <div
                  key={idx}
                  className="relative size-4.5 rounded-full border border-background bg-muted/80 shadow-2xs overflow-hidden flex items-center justify-center p-0.5"
                  title={domain}
                >
                  <img
                    src={favicon}
                    alt={domain}
                    className="size-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenAll) {
                onOpenAll();
              } else if (validSources[0]) {
                window.open(validSources[0].url, "_blank", "noopener,noreferrer");
              }
            }}
            className="text-xs font-semibold text-foreground/85 hover:text-foreground tracking-tight flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Sources</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              ({validSources.length})
            </span>
          </button>
        </div>

        {validSources.length > 1 && (
          <button
            type="button"
            onClick={() => {
              if (onOpenAll) {
                onOpenAll();
              } else {
                validSources.forEach((s) => {
                  window.open(s.url, "_blank", "noopener,noreferrer");
                });
              }
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/50 hover:bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ExternalLink className="size-2.5" />
            <span>Open all</span>
          </button>
        )}
      </div>
    </div>
  );
}
