import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ArrowRight, Clock } from "lucide-react";
import { Composer, type Attachment } from "@/components/Composer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { FEATURES } from "@/lib/features";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Studio — My AI Pro" },
      {
        name: "description",
        content: "Describe your idea and My AI Pro builds the app for you.",
      },
      { property: "og:title", content: "My AI Pro Studio" },
      { property: "og:description", content: "Describe your idea and watch it get built." },
    ],
  }),
  component: Home,
});

type RecentProject = { id: string; title: string };

function Home() {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentProject[]>([]);

  useEffect(() => {
    supabase
      .from("projects")
      .select("id,title")
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setRecent(data ?? []));
  }, []);

  const tiles = FEATURES.filter((f) => f.to !== "/app");
  const shown = query
    ? tiles.filter((t) => (t.label + t.desc).toLowerCase().includes(query.toLowerCase()))
    : tiles;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
      <section className="hero-glow rounded-3xl px-4 pt-12 pb-8 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          My AI <span className="brand-text">Pro</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Let&apos;s build something, <span className="text-foreground">{username}</span>.
        </p>
      </section>

      {/* Ideas to flow (Horizontally scrollable side bar above prompt input) */}
      <section className="mb-3 space-y-1.5 px-1">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <span className="text-amber-500">💡</span> Ideas to flow &amp; build
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
            Scroll side ➔
          </span>
        </div>
        <div className="flex overflow-x-auto pb-1.5 gap-2 scrollbar-none no-scrollbar">
          {[
            {
              label: "🕹️ 2D Retro Space Arcade Game (WASD & Sound FX)",
              prompt:
                "A 2D retro space arcade game with 60fps canvas, keyboard and touch controls, score tracker, and sound synthesizer",
            },
            {
              label: "🛍️ Minimalist E-Commerce Store with Cart",
              prompt:
                "A modern responsive e-commerce storefront with product catalog, filter tabs, cart drawer, and checkout modal",
            },
            {
              label: "📊 SaaS Analytics & Metrics Dashboard",
              prompt:
                "A high-performance SaaS analytics dashboard with interactive charts, KPIs, and revenue reporting",
            },
            {
              label: "🍕 Food Delivery & Order Tracker App",
              prompt:
                "A food delivery web app for a restaurant with menu items, custom toppings, checkout, and live order status",
            },
            {
              label: "🎯 Kanban Task Management Board",
              prompt:
                "A clean Kanban board with To Do, In Progress, Done columns, task creator, priority badges, and search",
            },
            {
              label: "⚡ AI Code Sandbox & Live Compiler",
              prompt:
                "A modern web-based code playground and compiler supporting TypeScript, HTML, and real-time execution",
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setIdea(item.prompt);
                navigate({ to: "/app/build", search: { idea: item.prompt } });
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <Composer
        value={idea}
        onChange={setIdea}
        attachments={attachments}
        onAttachments={setAttachments}
        placeholder="Describe your app or game (e.g. A 2D Space Arcade Game with sound effects)…"
        onSubmit={() => {
          if (!idea.trim()) return;
          navigate({ to: "/app/build", search: { idea } });
        }}
        extras={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Search features"
            onClick={() => setShowSearch((s) => !s)}
          >
            <Search />
          </Button>
        }
      />

      {showSearch && (
        <div className="mt-3">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search My AI Pro…"
          />
        </div>
      )}

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock className="size-4" /> Recent builds
          </h2>
          <div className="grid gap-2">
            {recent.map((p) => (
              <Link
                key={p.id}
                to="/app/project/$projectId"
                params={{ projectId: p.id }}
                className="glow-panel flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
              >
                {p.title}
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Everything you can do</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {shown.map((f) => (
            <Link key={f.to} to={f.to} className="glow-panel group rounded-2xl p-4">
              <f.icon className="size-5 text-primary" />
              <span className="mt-3 block text-sm font-semibold">{f.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{f.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
