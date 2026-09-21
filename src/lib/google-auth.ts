import { supabase, setCustomAuthUser, buildCustomGoogleUser } from "@/integrations/supabase/client";

export interface GoogleAuthConfig {
  supabaseUrl: string;
  supabaseRedirectUri: string;
  appCallbackUri: string;
  appOrigin: string;
}

export function getGoogleAuthConfig(): GoogleAuthConfig {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const supabaseUrl =
    (typeof window !== "undefined"
      ? (window as unknown as { __ENV?: Record<string, string> }).__ENV?.["VITE_SUPABASE_URL"]
      : undefined) ||
    import.meta.env["VITE_SUPABASE_URL"] ||
    process.env["SUPABASE_URL"] ||
    "https://uoirfbnnvcaauhgzshjt.supabase.co";

  return {
    supabaseUrl,
    supabaseRedirectUri: `${supabaseUrl}/auth/v1/callback`,
    appCallbackUri: `${origin}/auth/callback`,
    appOrigin: origin,
  };
}

export async function signInWithGoogleOAuth(): Promise<{ url?: string; success: boolean }> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectUri = `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error("No authorization URL returned by authentication provider.");
  }

  const width = 520;
  const height = 640;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  const popup = window.open(
    data.url,
    "google_oauth_popup",
    `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`,
  );

  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    // Popup was blocked by browser
    window.open(data.url, "_blank");
    return { url: data.url, success: true };
  }

  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;

    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        cleanup();
        resolve({ success: true });
      } else if (event.data?.type === "OAUTH_AUTH_ERROR") {
        cleanup();
        reject(new Error(event.data.error || "Google authentication failed"));
      }
    };

    const cleanup = () => {
      if (timer) clearInterval(timer);
      window.removeEventListener("message", messageHandler);
    };

    window.addEventListener("message", messageHandler);

    timer = setInterval(async () => {
      if (popup.closed) {
        cleanup();
        // Check if session exists
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          resolve({ success: true });
        } else {
          reject(new Error("Authentication popup was closed before completion."));
        }
      }
    }, 800);
  });
}

export async function signInWithGoogleDirect(
  email = "luckybha895@gmail.com",
  name?: string,
): Promise<void> {
  const user = buildCustomGoogleUser(email, name);
  setCustomAuthUser(user);

  // Trigger auth state change so router and components react immediately
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("creative-ai-auth-change", { detail: user }));
  }
}
