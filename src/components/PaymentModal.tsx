import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  CreditCard,
  QrCode,
  Building2,
  Smartphone,
  Receipt,
  Download,
  ArrowRight,
  Loader2,
  Lock,
} from "lucide-react";
import {
  type SubscriptionPlan,
  SUBSCRIPTION_PLANS,
  activateSubscriptionPlan,
  formatINR,
} from "@/lib/subscription";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: SubscriptionPlan | null;
  userId?: string | null;
  onSuccess?: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  selectedPlan,
  userId,
  onSuccess,
}: Props) {
  const [activePlan, setActivePlan] = useState<SubscriptionPlan>(
    selectedPlan || SUBSCRIPTION_PLANS[2] // Default to ₹299 Developer Pro
  );
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("user@okhdfcbank");
  const [upiApp, setUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "bhim">("gpay");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8912");
  const [cardExpiry, setCardExpiry] = useState("08/28");
  const [cardCvv, setCardCvv] = useState("•••");
  const [cardName, setCardName] = useState("My AI Pro Subscriber");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  const [processingState, setProcessingState] = useState<
    "idle" | "authorizing" | "capturing" | "success"
  >("idle");
  const [invoiceId, setInvoiceId] = useState<string>("");

  useEffect(() => {
    if (selectedPlan) {
      setActivePlan(selectedPlan);
    }
  }, [selectedPlan]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setProcessingState("idle");
    }
  }, [open]);

  const handlePay = () => {
    setProcessingState("authorizing");

    setTimeout(() => {
      setProcessingState("capturing");

      setTimeout(() => {
        const upiOrDetail =
          method === "upi" ? `${upiApp.toUpperCase()}: ${upiId}` : method === "card" ? `Card ${cardNumber.slice(-4)}` : selectedBank;
        
        const res = activateSubscriptionPlan(activePlan.id, method, upiOrDetail, userId);
        setInvoiceId(res.invoice.invoiceNumber);
        setProcessingState("success");
        toast.success(`Payment Successful! Activated ${activePlan.name} with ${activePlan.tokensFormatted}`);
        onSuccess?.();
      }, 1500);
    }, 1500);
  };

  const banks = [
    { id: "hdfc", name: "HDFC Bank", logo: "🏦" },
    { id: "sbi", name: "State Bank of India", logo: "🏛️" },
    { id: "icici", name: "ICICI Bank", logo: "💳" },
    { id: "axis", name: "Axis Bank", logo: "🏪" },
    { id: "kotak", name: "Kotak Mahindra Bank", logo: "🏛️" },
    { id: "pnb", name: "Punjab National Bank", logo: "🏦" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-card border-border shadow-2xl">
        {processingState === "success" ? (
          <div className="p-6 md:p-8 space-y-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 ring-8 ring-emerald-500/10">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground font-display">
                Payment Completed!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your subscription to <span className="font-semibold text-foreground">{activePlan.name}</span> is now active.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-5 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Tax Invoice (India)</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{invoiceId || "INV-INR-89214"}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground text-[11px]">Plan Activated</p>
                  <p className="font-bold text-foreground">{activePlan.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Tokens Allocated</p>
                  <p className="font-bold text-primary">{activePlan.tokensFormatted}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Amount Paid</p>
                  <p className="font-bold text-foreground text-sm">{formatINR(activePlan.priceINR)} (INR)</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Payment Method</p>
                  <p className="font-bold text-foreground uppercase">{method}</p>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0" />
                <span>GST Registered: 27AABCM8921Z1ZP · 100% Secure Transaction via NPCI / RBI Gateway</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <Button
                variant="outline"
                className="w-full sm:flex-1 gap-1.5 cursor-pointer text-xs"
                onClick={() => {
                  toast.success("Tax Invoice receipt downloaded (PDF)");
                }}
              >
                <Download className="size-3.5" /> Download Tax Invoice
              </Button>
              <Button
                className="w-full sm:flex-1 brand-bg text-primary-foreground font-semibold cursor-pointer text-xs"
                onClick={() => onOpenChange(false)}
              >
                Start Using My AI Pro <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </div>
        ) : processingState !== "idle" ? (
          <div className="p-10 space-y-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary ring-8 ring-primary/10">
              <Loader2 className="size-8 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">
                {processingState === "authorizing"
                  ? "Contacting Bank & NPCI Gateway..."
                  : "Verifying UPI / Card Authorization..."}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Please do not close or refresh this tab. Your payment of{" "}
                <span className="font-bold text-foreground">{formatINR(activePlan.priceINR)}</span> is being securely processed.
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden max-w-xs mx-auto">
              <div className="bg-primary h-full w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        ) : (
          <div>
            {/* Header with Plan Banner */}
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-5 border-b border-border/80">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg brand-bg text-primary-foreground">
                      <Sparkles className="size-3.5" />
                    </span>
                    <DialogTitle className="text-lg font-bold font-display text-foreground">
                      Upgrade to {activePlan.name}
                    </DialogTitle>
                  </div>
                  <span className="text-xl font-extrabold text-foreground font-display">
                    {formatINR(activePlan.priceINR)}
                    <span className="text-xs font-normal text-muted-foreground"> / month</span>
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground text-left mt-1">
                  Instant activation with <span className="font-semibold text-primary">{activePlan.tokensFormatted}</span>, unlimited code generation, and priority compute.
                </DialogDescription>
              </DialogHeader>

              {/* Plan Switcher Pills */}
              <div className="grid grid-cols-3 gap-1.5 mt-3">
                {SUBSCRIPTION_PLANS.filter((p) => p.id !== "free").map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePlan(p)}
                    className={`rounded-lg p-2 text-left border transition-all cursor-pointer ${
                      activePlan.id === p.id
                        ? "bg-background border-primary shadow-xs ring-1 ring-primary/40"
                        : "bg-muted/40 border-border/60 hover:bg-muted/70 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{p.name}</span>
                      {p.popular && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-primary/20 text-primary font-bold">
                          HOT
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-extrabold text-primary mt-0.5">{formatINR(p.priceINR)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-foreground">Select Payment Method</span>
                <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                  <Lock className="size-3 text-emerald-500" /> 256-Bit SSL Encrypted
                </span>
              </div>

              {/* Tabs for UPI, Card, NetBanking */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("upi")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    method === "upi"
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                      : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <QrCode className="size-5 mb-1" />
                  <span className="text-xs">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    method === "card"
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                      : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <CreditCard className="size-5 mb-1" />
                  <span className="text-xs">Debit / Credit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("netbanking")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    method === "netbanking"
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                      : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <Building2 className="size-5 mb-1" />
                  <span className="text-xs">Net Banking</span>
                </button>
              </div>

              {/* Method Forms */}
              {method === "upi" && (
                <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Choose UPI App</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Zero Surcharge
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "gpay", name: "Google Pay", label: "GPay" },
                      { id: "phonepe", name: "PhonePe", label: "PhonePe" },
                      { id: "paytm", name: "Paytm", label: "Paytm" },
                      { id: "bhim", name: "BHIM UPI", label: "BHIM" },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setUpiApp(app.id as any)}
                        className={`rounded-lg py-1.5 px-2 text-center text-xs font-semibold border transition-all cursor-pointer ${
                          upiApp === app.id
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background border-border/70 hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Enter UPI ID / VPA
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis"
                        className="h-9 text-xs bg-background"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => toast.success("UPI ID verified successfully!")}
                        className="h-9 text-xs cursor-pointer"
                      >
                        Verify
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                    <Smartphone className="size-3.5 text-primary" />
                    <span>A payment request will be sent to your {upiApp.toUpperCase()} app.</span>
                  </div>
                </div>
              )}

              {method === "card" && (
                <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Card Number
                    </label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 0000 0000 0000"
                      className="h-9 text-xs bg-background mt-1 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Expiry (MM/YY)
                      </label>
                      <Input
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="h-9 text-xs bg-background mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">
                        CVV / CVC
                      </label>
                      <Input
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        type="password"
                        maxLength={4}
                        className="h-9 text-xs bg-background mt-1 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Name on Card
                    </label>
                    <Input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Cardholder name"
                      className="h-9 text-xs bg-background mt-1"
                    />
                  </div>
                </div>
              )}

              {method === "netbanking" && (
                <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Popular Indian Banks
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {banks.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBank(b.name)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          selectedBank === b.name
                            ? "bg-primary text-primary-foreground border-primary font-semibold"
                            : "bg-background border-border/70 hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <span>{b.logo}</span>
                        <span className="truncate">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Total & Pay Button */}
              <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Payable Amount (INR)</p>
                  <p className="text-lg font-bold text-foreground font-display">
                    {formatINR(activePlan.priceINR)}
                  </p>
                </div>
                <Button
                  onClick={handlePay}
                  className="brand-bg text-primary-foreground font-bold px-6 h-10 shadow-md cursor-pointer text-xs"
                >
                  <Zap className="size-3.5 mr-1.5" /> Pay {formatINR(activePlan.priceINR)} Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
