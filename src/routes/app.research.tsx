import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Telescope, Download, Mail, MessageCircle, Globe, Sparkles } from "lucide-react";
import { ChatSurface } from "@/components/ChatSurface";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/research")({
  head: () => ({
    meta: [
      { title: "Deep Research — My AI Pro" },
      {
        name: "description",
        content:
          "Investigate any topic with live Search Grounding and receive comprehensive structured reports powered by My AI Pro 1.1.",
      },
      { property: "og:title", content: "Deep Research in My AI Pro" },
      {
        property: "og:description",
        content: "Live-grounded research reports with verified source citations.",
      },
    ],
  }),
  component: Research,
});

const DEPTH_OPTIONS = [
  { id: "comprehensive", label: "Full Empirical Report" },
  { id: "brief", label: "Executive Brief" },
  { id: "market", label: "Market & Competitor Matrix" },
] as const;

function Research() {
  const [depth, setDepth] = useState<"comprehensive" | "brief" | "market">("comprehensive");

  const systemPrompt = `You are My AI Pro Deep Research Agent, powered by the My AI Pro 1.1 model architecture, created and built by Bhavyash Redd.
Current Research Depth: ${depth}.
Instructions:
- Query real-time web facts, news, and market information using live search grounding.
- If asked which model you are using, state that you are running My AI Pro 1.1. If asked who built you, state that you were built by Bhavyash Redd.
- Provide a rigorous, structured document with:
  1. Executive Summary & Core Hypothesis
  2. Verified Key Empirical Findings (bulleted, with metrics/dates)
  3. Industry/Technical Landscape Analysis
  4. Counter-arguments & Risk Analysis
  5. Actionable Strategic Takeaways
  6. Sources & References (explicitly cite the primary sources discovered)
- Always be objective, highly factual, and authoritative.`;

  return (
    <div className="flex flex-1 flex-col">
      {/* Action and Depth Bar */}
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
            <Sparkles className="size-3 text-primary" /> Scope:
          </span>
          {DEPTH_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDepth(opt.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                depth === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-7 text-xs"
          >
            <Download className="size-3 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
            <a
              href="https://wa.me/?text=Check%20out%20my%20Creative%20AI%20research%20report"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-3 mr-1" /> WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
            <a href="mailto:?subject=Creative%20AI%20Research%20Report">
              <Mail className="size-3 mr-1" /> Email
            </a>
          </Button>
        </div>
      </div>

      <ChatSurface
        mode="research"
        system={systemPrompt}
        placeholder="Enter any market, technology, or topic to investigate in depth…"
        intro={{
          icon: Telescope,
          title: "Deep Research Agent",
          subtitle:
            "Enter any subject. Our owned research engine uses live Google web grounding to deliver deep empirical reports.",
          chips: [
            "Global humanoid robotics landscape 2026",
            "Next-gen battery technologies for EVs",
            "B2B SaaS churn reduction benchmarks",
          ],
        }}
      />
    </div>
  );
}
