import { useEffect } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { verifyActiveSubscriptionOnLogin, handleStripeCheckoutSessionReturn } from "@/lib/stripe";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch {
      // ignore
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      return { user: sessionData.session.user };
    }
    return { user: null };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = useAuth();

  useEffect(() => {
    // 1. Handle return from Stripe Checkout
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isStripeSuccess = params.get("stripe_success") === "true";
      const isStripeCancel = params.get("stripe_cancel") === "true";
      const sessionId = params.get("session_id");
      const planId = params.get("plan");

      if (isStripeSuccess && sessionId) {
        handleStripeCheckoutSessionReturn(sessionId, planId, user?.id || user?.email).then(
          (activated) => {
            if (activated) {
              const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
              toast.success(
                `Stripe subscription activated! Welcome to ${plan?.name || "Pro"} with ${plan?.tokensFormatted || "bonus tokens"}.`,
              );
            }
            // Clean URL parameters cleanly
            window.history.replaceState({}, document.title, window.location.pathname);
          },
        );
      } else if (isStripeCancel) {
        toast.info("Stripe checkout cancelled. You can upgrade anytime.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // 2. Implement check to verify active subscriptions upon login
    if (user?.email || user?.id) {
      verifyActiveSubscriptionOnLogin(user.id, user.email).then((result) => {
        if (result.hasActiveSubscription && result.planId) {
          const plan = SUBSCRIPTION_PLANS.find((p) => p.id === result.planId);
          console.info("[Stripe] Active subscription verified for user:", user.email, plan?.name);
        }
      });
    }
  }, [user?.id, user?.email]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <AppHeader />
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
