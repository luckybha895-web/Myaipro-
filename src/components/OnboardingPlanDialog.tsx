import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  Bot,
  Code2,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  activateSubscriptionPlan,
  setInitialPlanChosen,
  formatINR,
} from "@/lib/subscription";
import { PaymentModal } from "./PaymentModal";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string | null;
  onPlanSelected?: (plan: SubscriptionPlan) => void;
}

export function OnboardingPlanDialog({
  open,
  onOpenChange,
  userId,
  onPlanSelected,
}: Props) {
  const [selectedPlanForPayment, setSelectedPlanForPayment] =
    useState<SubscriptionPlan | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.id === "free") {
      activateSubscriptionPlan("free", "free_trial", undefined, userId);
      setInitialPlanChosen(userId);
      toast.success("Free Trial Activated! 10,000 Tokens added to your workspace.");
      onPlanSelected?.(plan);
      onOpenChange(false);
    } else {
      setSelectedPlanForPayment(plan);
      setPaymentOpen(true);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentOpen(false);
    onOpenChange(false);
    if (selectedPlanForPayment) {
      onPlanSelected?.(selectedPlanForPayment);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border shadow-2xl max-h-[90vh] flex flex-col">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border-b border-border/70 text-center relative shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-2">
              <Sparkles className="size-3.5" /> Welcome to My AI Pro
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
              Select Your Plan to Get Started
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
              Choose the tier that fits your creative &amp; engineering workflow. You can upgrade, downgrade, or cancel anytime. All prices are in Indian Rupees (₹).
            </DialogDescription>
          </div>

          {/* Pricing Grid */}
          <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isPopular = plan.popular;
              const isFree = plan.id === "free";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                    isPopular
                      ? "border-primary bg-primary/[0.04] shadow-md ring-2 ring-primary/30"
                      : "border-border/70 bg-card hover:border-border hover:shadow-xs"
                  }`}
                >
                  {plan.badge && (
                    <span
                      className={`absolute -top-2.5 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs ${
                        isPopular
                          ? "brand-bg text-primary-foreground"
                          : "bg-muted border border-border text-foreground"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground font-display">
                        {plan.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="border-y border-border/50 py-2.5 my-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-foreground font-display">
                          {formatINR(plan.priceINR)}
                        </span>
                        {!isFree && (
                          <span className="text-[11px] text-muted-foreground">/ month</span>
                        )}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                        <Zap className="size-3 shrink-0" />
                        <span>{plan.tokensFormatted}</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight text-foreground/90">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 mt-auto">
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      variant={isPopular ? "default" : isFree ? "outline" : "secondary"}
                      className={`w-full text-xs font-bold h-9 cursor-pointer ${
                        isPopular
                          ? "brand-bg text-primary-foreground shadow-sm"
                          : isFree
                            ? "hover:bg-muted/80"
                            : ""
                      }`}
                    >
                      {isFree ? (
                        "Start Free Trial"
                      ) : (
                        <>
                          Choose {plan.name} <ArrowRight className="size-3 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with safety note */}
          <div className="border-t border-border/70 p-3.5 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>100% Secure Payments via UPI (GPay/PhonePe), RuPay, Cards &amp; NetBanking.</span>
            </div>
            <button
              onClick={() => {
                setInitialPlanChosen(userId);
                onOpenChange(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              Continue with Free starter
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Gateway Modal */}
      {selectedPlanForPayment && (
        <PaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          selectedPlan={selectedPlanForPayment}
          userId={userId}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
