import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

interface VerifyRequestBody {
  userId?: string | undefined;
  email?: string | undefined;
  sessionId?: string | undefined;
}

export const Route = createFileRoute("/api/stripe/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as VerifyRequestBody;
          const email = body.email?.trim().toLowerCase();
          const sessionId = body.sessionId?.trim();
          const userId = body.userId;

          const secretKey = process.env["STRIPE_SECRET_KEY"];

          // If session ID was passed (from checkout return)
          if (sessionId) {
            if (secretKey && !sessionId.includes("simulated")) {
              try {
                const stripe = new Stripe(secretKey);
                const session = await stripe.checkout.sessions.retrieve(sessionId, {
                  expand: ["subscription"],
                });

                if (session.payment_status === "paid" || session.status === "complete") {
                  const planId = (session.metadata?.["planId"] || "starter") as
                    "starter" | "developer" | "ultra";

                  return Response.json({
                    hasActiveSubscription: true,
                    planId,
                    verifiedVia: "stripe_session",
                    customerId: typeof session.customer === "string" ? session.customer : null,
                    subscriptionId:
                      typeof session.subscription === "string"
                        ? session.subscription
                        : (session.subscription?.id ?? null),
                    status: "active",
                  });
                }
              } catch (stripeErr) {
                console.warn("Stripe session retrieval error:", stripeErr);
              }
            } else if (sessionId.startsWith("cs_test_")) {
              // Simulated test session from local/preview mode
              return Response.json({
                hasActiveSubscription: true,
                planId: "developer", // Default to Developer or metadata
                verifiedVia: "simulated_stripe_session",
                status: "active",
              });
            }
          }

          // If checking active subscription by user email
          if (secretKey && email) {
            try {
              const stripe = new Stripe(secretKey);
              const customers = await stripe.customers.list({
                email,
                limit: 1,
              });

              if (customers.data.length > 0 && customers.data[0]?.id) {
                const customerId = customers.data[0].id;
                const subscriptions = await stripe.subscriptions.list({
                  customer: customerId,
                  status: "active",
                  limit: 1,
                });

                if (subscriptions.data.length > 0 && subscriptions.data[0]) {
                  const sub = subscriptions.data[0];
                  const amount = sub.items.data[0]?.price?.unit_amount || 0;

                  // Map INR amounts (in paise) to plan ID:
                  // 19900 -> starter (199 INR)
                  // 29900 -> developer (299 INR)
                  // 59900 -> ultra (599 INR)
                  let detectedPlan: "starter" | "developer" | "ultra" = "starter";
                  if (amount >= 59000) {
                    detectedPlan = "ultra";
                  } else if (amount >= 29000) {
                    detectedPlan = "developer";
                  }

                  return Response.json({
                    hasActiveSubscription: true,
                    planId: detectedPlan,
                    customerId,
                    subscriptionId: sub.id,
                    status: sub.status,
                    currentPeriodEnd: sub.current_period_end
                      ? new Date(sub.current_period_end * 1000).toISOString()
                      : null,
                  });
                }
              }
            } catch (stripeCheckErr) {
              console.warn("Stripe customer query error:", stripeCheckErr);
            }
          }

          return Response.json({
            hasActiveSubscription: false,
            planId: null,
            userId,
            status: "inactive",
          });
        } catch (error) {
          console.error("Subscription verification error:", error);
          return Response.json(
            {
              hasActiveSubscription: false,
              error: error instanceof Error ? error.message : "Verification error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
