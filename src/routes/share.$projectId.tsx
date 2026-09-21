import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { unpackDescription } from "@/lib/project-types";

export const Route = createFileRoute("/share/$projectId")({
  head: () => ({
    meta: [
      { title: "An app built with Creative AI" },
      {
        name: "description",
        content: "Someone built this app with Creative AI. Open it and try it live.",
      },
      { property: "og:title", content: "An app built with Creative AI" },
      { property: "og:description", content: "Open it and try it live in your browser." },
    ],
  }),
  component: SharedProject,
});

function SharedProject() {
  const { projectId } = Route.useParams();
  const [state, setState] = useState<{ title: string; description: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("projects")
      .select("title,description")
      .eq("id", projectId)
      .maybeSingle()
      .then(({ data }) => {
        setState(data);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </main>
    );
  }
  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        This app is not available.
      </main>
    );
  }

  const { description, previewHtml } = unpackDescription(state.description);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8">
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold">{state.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </header>
      <iframe
        title={state.title}
        srcDoc={previewHtml}
        sandbox="allow-scripts allow-forms allow-modals"
        className="h-[70vh] w-full rounded-3xl border border-border bg-background"
      />
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Built with{" "}
        <Link to="/" className="brand-text font-semibold">
          Creative AI
        </Link>
      </p>
    </main>
  );
}
