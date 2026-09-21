import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallback,
});

function AuthCallback() {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function processCallback() {
      try {
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        const hash = url.hash.startsWith("#") ? url.hash.substring(1) : url.hash;
        const hashParams = new URLSearchParams(hash);

        // Check for error in query or hash
        const errorDesc =
          searchParams.get("error_description") ||
          hashParams.get("error_description") ||
          searchParams.get("error") ||
          hashParams.get("error");

        if (errorDesc) {
          throw new Error(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
        }

        // Handle PKCE code exchange if present
        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn("exchangeCodeForSession error:", exchangeError.message);
          }
        }

        // Check session
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (!data.session && !code) {
          // Check if tokens are in hash directly
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });
          }
        }

        const currentSession = (await supabase.auth.getSession()).data.session;

        if (isMounted) {
          setStatus("success");
        }

        // Send message to opener if popup
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "OAUTH_AUTH_SUCCESS",
              provider: "google",
              session: currentSession,
            },
            "*",
          );
          setTimeout(() => {
            window.close();
          }, 600);
        } else {
          // If top-level navigation, redirect to /app
          setTimeout(() => {
            window.location.href = "/app";
          }, 800);
        }
      } catch (err) {
        console.error("OAuth callback processing error:", err);
        const msg = err instanceof Error ? err.message : "Authentication failed";
        if (isMounted) {
          setStatus("error");
          setErrorMessage(msg);
        }
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "OAUTH_AUTH_ERROR",
              error: msg,
            },
            "*",
          );
        }
      }
    }

    processCallback();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-lg">
        {status === "processing" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <h1 className="text-base font-semibold">Completing Google Authentication</h1>
            <p className="text-xs text-muted-foreground">
              Please wait while we verify your credentials...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="size-8 text-emerald-500" />
            <h1 className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              Authentication Successful!
            </h1>
            <p className="text-xs text-muted-foreground">
              Redirecting you to the studio... This window will close automatically.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle className="size-8 text-destructive" />
            <h1 className="text-base font-semibold text-destructive">Authentication Issue</h1>
            <p className="text-xs text-muted-foreground max-w-xs">{errorMessage}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    window.location.href = "/";
                  }
                }}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary/80"
              >
                Close Window
              </button>
              <a
                href="/"
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Go to Sign-In
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
