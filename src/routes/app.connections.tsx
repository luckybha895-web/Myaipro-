import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Plug, Search, Globe, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONNECTORS, type ConnectorApp } from "@/lib/connectors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainManager } from "@/components/DomainManager";

export const Route = createFileRoute("/app/connections")({
  head: () => ({
    meta: [
      { title: "Connections & Domains — Creative AI" },
      {
        name: "description",
        content: "Connect Gmail, GoDaddy Domains, Stripe, WhatsApp, and 80+ more apps to your AI.",
      },
      { property: "og:title", content: "Connections in Creative AI" },
      {
        property: "og:description",
        content: "Plug 80+ apps and GoDaddy custom domains into your AI.",
      },
    ],
  }),
  component: Connections,
});

function Connections() {
  const [section, setSection] = useState<"apps" | "domains">("apps");
  const [query, setQuery] = useState("");
  const [connected, setConnected] = useState<string[]>([]);
  const [active, setActive] = useState<ConnectorApp | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("user_connections")
      .select("app_id")
      .then(({ data }) => setConnected((data ?? []).map((r) => r.app_id)));
  }, []);

  const list = CONNECTORS.filter((c) =>
    (c.name + c.category + c.how).toLowerCase().includes(query.toLowerCase()),
  );

  async function connect() {
    if (!active) return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in again.");
      const { error } = await supabase.from("user_connections").upsert(
        {
          user_id: auth.user.id,
          app_id: active.id,
          status: "connected",
          config: { fields: Object.keys(values) },
        },
        { onConflict: "user_id,app_id" },
      );
      if (error) throw error;
      setConnected((c) => Array.from(new Set([...c, active.id])));
      toast.success(`${active.name} connected`);
      setActive(null);
      setValues({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not connect.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Connections &amp; Custom Domains</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect 80+ external apps, API integrations, and GoDaddy custom domains to your
            projects.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-border text-xs shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setSection("apps")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              section === "apps"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plug className="size-3.5" />
            <span>App Integrations ({CONNECTORS.length})</span>
          </button>
          <button
            onClick={() => setSection("domains")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              section === "domains"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="size-3.5 text-blue-500" />
            <span>Custom Domains &amp; GoDaddy</span>
          </button>
        </div>
      </div>

      {section === "domains" ? (
        <DomainManager projectTitle="My AI Application" />
      ) : (
        <>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps…"
              className="pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className="glow-panel rounded-2xl p-4 text-left transition-colors hover:border-primary/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.emoji}</span>
                  <span className="text-sm font-semibold">{c.name}</span>
                  {connected.includes(c.id) && <Check className="ml-auto size-4 text-primary" />}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{c.how}</p>
                <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                  {c.category}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <Dialog open={Boolean(active)} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {active?.emoji} Connect {active?.name}
            </DialogTitle>
            <DialogDescription>{active?.how}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {active?.fields.map((f) => (
              <div key={f} className="space-y-1.5">
                <Label htmlFor={f}>{f}</Label>
                <Input
                  id={f}
                  type="password"
                  value={values[f] ?? ""}
                  onChange={(e) => setValues({ ...values, [f]: e.target.value })}
                  placeholder={
                    f === "OAuth login"
                      ? "Click connect to authorise"
                      : `Paste your ${f.toLowerCase()}`
                  }
                />
              </div>
            ))}
            <Button className="w-full" onClick={connect}>
              <Plug /> Connect {active?.name}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
