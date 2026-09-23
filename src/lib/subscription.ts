/**
 * Subscription & Token Management Engine for My AI Pro
 * Handles plans in Indian Rupees (₹), token consumption, payment transactions, and limits.
 */

export interface SubscriptionPlan {
  id: "free" | "starter" | "developer" | "ultra";
  name: string;
  tagline: string;
  priceINR: number;
  tokens: number;
  tokensFormatted: string;
  popular?: boolean;
  badge?: string;
  features: string[];
  maxProjects: number;
  modelsIncluded: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free Trial",
    tagline: "Explore the core generative capabilities",
    priceINR: 0,
    tokens: 500000,
    tokensFormatted: "500,000 Tokens",
    features: [
      "500,000 Free Starter Tokens",
      "AI Chatbot & Live Web Search",
      "Voice Assistant (Standard TTS)",
      "Single Project Sandbox Studio",
      "Community Support",
    ],
    maxProjects: 1,
    modelsIncluded: ["GLM 5.3", "Standard Chat"],
  },
  {
    id: "starter",
    name: "Pro Starter",
    tagline: "For creators, students, and power users",
    priceINR: 199,
    tokens: 1000000,
    tokensFormatted: "1,000,000 Tokens / mo",
    badge: "Great Value",
    features: [
      "1,000,000 High-Speed Tokens",
      "GLM 5.3 + Neural Synthesis",
      "AI Presentation Maker (PDF / PPTX Export)",
      "High-Resolution Visual Art & Canvas Editor",
      "10 Active Projects & Live Sandboxes",
      "Priority Live Search Grounding",
    ],
    maxProjects: 10,
    modelsIncluded: ["GLM 5.3", "Neural V3", "Flux 1.1 Art"],
  },
  {
    id: "developer",
    name: "Developer Pro",
    tagline: "For coders, engineers, and builders",
    priceINR: 299,
    tokens: 2500000,
    tokensFormatted: "2,500,000 Tokens / mo",
    popular: true,
    badge: "Most Popular",
    features: [
      "2,500,000 Developer Tokens",
      "SOTA Code Engine (GLM 5.3 Coder & Qwen 2.5 Coder 72B)",
      "Full-Stack Vibe Coding & Multi-File Architecture",
      "10-Minute Academic Deep Research Mode",
      "Real-Time Low-Latency Voice Assistant",
      "Unlimited Sandboxes & Code Downloads",
      "Automated Unit Test & Refactoring Assistant",
    ],
    maxProjects: 50,
    modelsIncluded: [
      "GLM 5.3 Coder",
      "Qwen 2.5 Coder 72B",
      "DeepSeek Coder V2.5",
      "Claude 3.5 Copilot",
    ],
  },
  {
    id: "ultra",
    name: "Ultra Master",
    tagline: "Unlimited AGI power & autonomous agents",
    priceINR: 599,
    tokens: 10000000,
    tokensFormatted: "10,000,000 Tokens / mo",
    badge: "Max Performance",
    features: [
      "10,000,000 Supercharged Tokens",
      "Autonomous Multi-Agent Device Control (Phone & PC)",
      "Dedicated High-Compute Cluster (Zero Latency)",
      "Continuous Autonomous Memory & Context Sync",
      "Full Codebase Scaffolding & GitHub Sync",
      "Unlimited 4K Art, Video, & Audio Generation",
      "24/7 Dedicated VIP Priority Support",
    ],
    maxProjects: 200,
    modelsIncluded: ["GLM 5.3 Ultra", "Qwen 2.5 Coder 72B", "DeepSeek MoE", "AGI Device Agent"],
  },
];

export interface PaymentTransaction {
  id: string;
  planId: "free" | "starter" | "developer" | "ultra";
  planName: string;
  amountINR: number;
  method: "upi" | "card" | "netbanking" | "free_trial";
  upiId?: string | undefined;
  timestamp: string;
  status: "success" | "pending" | "failed";
  invoiceNumber: string;
}

export interface UserSubscriptionState {
  userId: string;
  planId: "free" | "starter" | "developer" | "ultra";
  tokensUsed: number;
  tokensLimit: number;
  activatedAt: string;
  expiresAt: string;
  hasChosenInitialPlan: boolean;
  transactions: PaymentTransaction[];
}

const STORAGE_PREFIX = "myai_subscription_v2_";
export const SUBSCRIPTION_EVENT = "myai_subscription_changed";

function getStorageKey(userId?: string | null): string {
  const safeId = (userId || "default_user").replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${STORAGE_PREFIX}${safeId}`;
}

export function getDefaultSubscription(userId?: string | null): UserSubscriptionState {
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    userId: userId || "default_user",
    planId: "free",
    tokensUsed: 1240, // realistic initial starter sample
    tokensLimit: 500000,
    activatedAt: now.toISOString(),
    expiresAt: nextMonth.toISOString(),
    hasChosenInitialPlan: false,
    transactions: [],
  };
}

export function getSubscription(userId?: string | null): UserSubscriptionState {
  if (typeof window === "undefined") {
    return getDefaultSubscription(userId);
  }

  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const defaultState = getDefaultSubscription(userId);
      localStorage.setItem(key, JSON.stringify(defaultState));
      return defaultState;
    }
    const state = JSON.parse(raw) as UserSubscriptionState;

    // Auto-heal / upgrade legacy free trial state to generous 500,000 limit
    if (
      state.planId === "free" &&
      (state.tokensLimit < 500000 || state.tokensUsed >= state.tokensLimit)
    ) {
      state.tokensLimit = 500000;
      state.tokensUsed = Math.min(state.tokensUsed, 50000);
      localStorage.setItem(key, JSON.stringify(state));
    }
    return state;
  } catch {
    return getDefaultSubscription(userId);
  }
}

export function saveSubscription(state: UserSubscriptionState): void {
  if (typeof window === "undefined") return;
  const key = getStorageKey(state.userId);
  try {
    localStorage.setItem(key, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(SUBSCRIPTION_EVENT, { detail: state }));
  } catch (err) {
    console.error("Failed to save subscription state:", err);
  }
}

/**
 * Deducts tokens upon generation turn
 */
export function consumeTokens(
  amount: number,
  userId?: string | null,
): { allowed: boolean; remaining: number; state: UserSubscriptionState } {
  let current = getSubscription(userId);

  // If token limit reached, auto-grant a free loyalty top-up so user workflow is never broken
  if (current.tokensUsed >= current.tokensLimit) {
    current = {
      ...current,
      tokensLimit: current.tokensLimit + 250000,
    };
    saveSubscription(current);
  }

  const updated: UserSubscriptionState = {
    ...current,
    tokensUsed: Math.min(current.tokensLimit, current.tokensUsed + amount),
  };

  saveSubscription(updated);
  const remaining = Math.max(0, updated.tokensLimit - updated.tokensUsed);
  return {
    allowed: true,
    remaining,
    state: updated,
  };
}

/**
 * Activate or upgrade a subscription plan
 */
export function activateSubscriptionPlan(
  planId: "free" | "starter" | "developer" | "ultra",
  paymentMethod: "upi" | "card" | "netbanking" | "free_trial",
  upiOrCardDetail?: string | undefined,
  userId?: string | null,
): { success: boolean; state: UserSubscriptionState; invoice: PaymentTransaction } {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[0];
  const current = getSubscription(userId);

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const invoiceNum = `INV-INR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const txn: PaymentTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    planId: plan.id,
    planName: plan.name,
    amountINR: plan.priceINR,
    method: paymentMethod,
    upiId: upiOrCardDetail,
    timestamp: now.toISOString(),
    status: "success",
    invoiceNumber: invoiceNum,
  };

  const updated: UserSubscriptionState = {
    ...current,
    planId: plan.id,
    tokensLimit: plan.tokens,
    tokensUsed: 0, // Reset usage upon plan upgrade or renewal
    activatedAt: now.toISOString(),
    expiresAt: nextMonth.toISOString(),
    hasChosenInitialPlan: true,
    transactions: [txn, ...current.transactions],
  };

  saveSubscription(updated);
  return { success: true, state: updated, invoice: txn };
}

/**
 * Mark that the user has acknowledged the initial plan selection
 */
export function setInitialPlanChosen(userId?: string | null): void {
  const current = getSubscription(userId);
  if (!current.hasChosenInitialPlan) {
    saveSubscription({
      ...current,
      hasChosenInitialPlan: true,
    });
  }
}

/**
 * Format Indian Rupees with proper Indian number grouping (e.g. ₹199, ₹1,299, ₹10,000)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
