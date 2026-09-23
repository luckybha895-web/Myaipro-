import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

interface CheckoutRequestBody {
  planId: "starter" | "developer" | "ultra";
  userId?: string | undefined;
  userEmail?: string | undefined;
  origin?: string | undefined;
}

const STRIPE_PLANS: Record<
  "starter" | "developer" | "ultra",
  { name: string; priceINR: number; tokens: number; tokensFormatted: string }
> = {
  starter: {
    name: "Pro Starter Plan",
    priceINR: 199,
    tokens: 250000,
    tokensFormatted: "250,000 Tokens / mo",
  },
  developer: {
    name: "Developer Pro Plan",
    priceINR: 299,
    tokens: 750000,
    tokensFormatted: "750,000 Tokens / mo",
  },
  ultra: {
    name: "Ultra Master Plan",
    priceINR: 599,
    tokens: 2500000,
    tokensFormatted: "2,500,000 Tokens / mo",
  },
};

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as CheckoutRequestBody;
          const planId = body.planId;
          const plan = STRIPE_PLANS[planId];

          if (!plan) {
            return Response.json(
              {
                error:
                  "Invalid subscription plan. Choose starter (199), developer (299), or ultra (599).",
              },
              { status: 400 },
            );
          }

          const userId = body.userId || "anonymous_user";
          const userEmail = body.userEmail?.trim();

          const reqUrl = new URL(request.url);
          const origin = body.origin || reqUrl.origin;

          const secretKey = process.env["STRIPE_SECRET_KEY"];

          if (secretKey) {
            const stripe = new Stripe(secretKey);

            // Create a real Stripe Checkout Session for Indian Rupees
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ["card"],
              billing_address_collection: "auto",
              customer_email: userEmail || undefined,
              client_reference_id: userId,
              line_items: [
                {
                  price_data: {
                    currency: "inr",
                    product_data: {
                      name: `My AI Pro: ${plan.name}`,
                      description: `${plan.tokensFormatted} - SOTA AI Models & Coding Suite`,
                    },
                    unit_amount: plan.priceINR * 100, // 19900, 29900, 59900 paise
                    recurring: {
                      interval: "month",
                    },
                  },
                  quantity: 1,
                },
              ],
              mode: "subscription",
              metadata: {
                userId,
                userEmail: userEmail || "",
                planId,
                tokensLimit: String(plan.tokens),
                currency: "INR",
              },
              success_url: `${origin}/app?stripe_success=true&session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
              cancel_url: `${origin}/app?stripe_cancel=true`,
            });

            return Response.json({
              url: session.url,
              sessionId: session.id,
              live: true,
              plan,
            });
          }

          // Fallback simulation when STRIPE_SECRET_KEY is not configured yet
          const simulatedSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          const simulatedReturnUrl = `${origin}/app?stripe_success=true&session_id=${simulatedSessionId}&plan=${planId}&simulated=true`;

          return Response.json({
            url: simulatedReturnUrl,
            sessionId: simulatedSessionId,
            live: false,
            simulated: true,
            plan,
            message: "Stripe test mode active (configure STRIPE_SECRET_KEY for live charges).",
          });
        } catch (error) {
          console.error("Stripe Checkout error:", error);
          return Response.json(
            {
              error: error instanceof Error ? error.message : "Failed to initiate Stripe checkout",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
