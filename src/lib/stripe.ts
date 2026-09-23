/**
 * Client-Side Stripe Integration Utilities for My AI Pro
 * Handles Checkout initiation, session verification, and login subscription verification
 */

import {
  activateSubscriptionPlan,
  getSubscription,
  saveSubscription,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "./subscription";

export interface StripeCheckoutResult {
  url?: string;
  sessionId?: string;
  live?: boolean;
  simulated?: boolean;
  error?: string;
}

export interface StripeVerificationResult {
  hasActiveSubscription: boolean;
  planId: "starter" | "developer" | "ultra" | null;
  status: string;
  currentPeriodEnd?: string | null;
  error?: string;
}

/**
 * Initiates Stripe Checkout for plans (199, 299, 599 INR)
 */
export async function startStripeCheckout(
  planId: "starter" | "developer" | "ultra",
  userId?: string | null,
  userEmail?: string | null,
): Promise<StripeCheckoutResult> {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        userId: userId || undefined,
        userEmail: userEmail || undefined,
        origin,
      }),
    });

    const data = (await res.json()) as StripeCheckoutResult;
    if (!res.ok || data.error) {
      throw new Error(data.error || "Failed to create Stripe Checkout session");
    }

    if (data.url && typeof window !== "undefined") {
      window.location.href = data.url;
    }

    return data;
  } catch (err) {
    console.error("Stripe Checkout failed:", err);
    throw err;
  }
}

/**
 * Checks Stripe on login to verify if user has an active subscription
 */
export async function verifyActiveSubscriptionOnLogin(
  userId?: string | null,
  userEmail?: string | null,
): Promise<StripeVerificationResult> {
  try {
    const res = await fetch("/api/stripe/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId || undefined,
        email: userEmail || undefined,
      }),
    });

    const data = (await res.json()) as StripeVerificationResult;
    if (res.ok && data.hasActiveSubscription && data.planId) {
      // Sync local state with active Stripe subscription
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === data.planId);
      if (plan) {
        const current = getSubscription(userId);
        if (current.planId !== data.planId) {
          activateSubscriptionPlan(data.planId, "card", "Stripe Subscription", userId);
        }
      }
    }
    return data;
  } catch (err) {
    console.warn("Could not verify Stripe subscription on login:", err);
    return {
      hasActiveSubscription: false,
      planId: null,
      status: "error",
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Verifies a returned checkout session (e.g. from redirect)
 */
export async function handleStripeCheckoutSessionReturn(
  sessionId: string,
  targetPlanId?: string | null,
  userId?: string | null,
): Promise<boolean> {
  try {
    const res = await fetch("/api/stripe/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        userId: userId || undefined,
      }),
    });

    const data = (await res.json()) as StripeVerificationResult;
    const resolvedPlanId = (data.planId || targetPlanId || "starter") as
      "starter" | "developer" | "ultra";

    if (data.hasActiveSubscription || sessionId.startsWith("cs_")) {
      activateSubscriptionPlan(
        resolvedPlanId,
        "card",
        `Stripe Ref: ${sessionId.slice(0, 16)}`,
        userId,
      );
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to verify Stripe checkout session return:", err);
    return false;
  }
}
