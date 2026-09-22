import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Bot,
  Mic,
  Presentation,
  Code2,
  FolderCode,
  Plus,
  BrainCircuit,
  LogOut,
  ChevronRight,
  ExternalLink,
  Laptop,
  Terminal,
  History,
  Trash2,
  X,
  Zap,
  Crown,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getUserMemory } from "@/lib/user-memory";
import {
  getUnifiedHistory,
  deleteUnifiedHistoryItem,
  clearAllUnifiedHistory,
  UNIFIED_HISTORY_EVENT,
  type UnifiedHistoryItem,
} from "@/lib/unified-history";
import {
  getSubscription,
  SUBSCRIPTION_EVENT,
  SUBSCRIPTION_PLANS,
  formatINR,
  type UserSubscriptionState,
} from "@/lib/subscription";
import { OnboardingPlanDialog } from "./OnboardingPlanDialog";
import { PaymentModal } from "./PaymentModal";
import { toast } from "sonner";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, username, signOut } = useAuth();
  const { state } = useSidebar();
  const [historyItems, setHistoryItems] = useState<UnifiedHistoryItem[]>([]);
  const [memorySummary, setMemorySummary] = useState<string>("");
  const [subscription, setSubscription] = useState<UserSubscriptionState>(() =>
    getSubscription(user?.id || user?.email)
  );
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const refreshHistory = useCallback(() => {
    setHistoryItems(getUnifiedHistory().slice(0, 15));
  }, []);

  const refreshSubscription = useCallback(() => {
    setSubscription(getSubscription(user?.id || user?.email));
  }, [user?.id, user?.email]);

  useEffect(() => {
    refreshHistory();
    refreshSubscription();

    const handleUpdate = () => refreshHistory();
    const handleSubUpdate = () => refreshSubscription();

    window.addEventListener(UNIFIED_HISTORY_EVENT, handleUpdate);
    window.addEventListener(SUBSCRIPTION_EVENT, handleSubUpdate);
    window.addEventListener("storage", handleSubUpdate);

    // Prompt user on first login or if they haven't chosen a plan yet
    const currentSub = getSubscription(user?.id || user?.email);
    if (!currentSub.hasChosenInitialPlan) {
      // Small timeout so DOM renders smoothly
      const timer = setTimeout(() => {
        setPlanDialogOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }

    // Check user memory context
    const mem = getUserMemory(user?.id || user?.email);
    if (mem.facts.length > 0 || mem.recentTopics.length > 0) {
      setMemorySummary(`${mem.facts.length} facts • ${mem.recentTopics.length} topics`);
    } else {
      setMemorySummary("Active");
    }

    return () => {
      window.removeEventListener(UNIFIED_HISTORY_EVENT, handleUpdate);
      window.removeEventListener(SUBSCRIPTION_EVENT, handleSubUpdate);
      window.removeEventListener("storage", handleSubUpdate);
    };
  }, [user?.id, user?.email, refreshHistory, refreshSubscription]);

  const navItems = [
    {
      title: "My AI Builder",
      url: "/app",
      icon: Code2,
      isActive: location.pathname === "/app" || location.pathname.startsWith("/app/build"),
      badge: "Engine",
    },
    {
      title: "AI Chatbot",
      url: "/app/chat",
      icon: Bot,
      isActive: location.pathname.startsWith("/app/chat"),
    },
    {
      title: "Voice Assistant",
      url: "/app/voice",
      icon: Mic,
      isActive: location.pathname.startsWith("/app/voice"),
      badge: "Realtime",
    },
    {
      title: "Presentation Maker",
      url: "/app/presentations",
      icon: Presentation,
      isActive: location.pathname.startsWith("/app/presentations"),
      badge: "Canva",
    },
  ];

  function getToolMeta(tool: UnifiedHistoryItem["tool"]) {
    switch (tool) {
      case "presentation":
        return {
          icon: Presentation,
          iconColor: "text-amber-500",
          badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          label: "Presentation",
        };
      case "voice":
        return {
          icon: Mic,
          iconColor: "text-emerald-500",
          badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          label: "Voice",
        };
      case "chat":
        return {
          icon: Bot,
          iconColor: "text-purple-500",
          badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
          label: "Chat",
        };
      case "build":
      default:
        return {
          icon: Code2,
          iconColor: "text-cyan-500",
          badgeBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
          label: "Builder",
        };
    }
  }

  function handleDeleteItem(e: React.MouseEvent, item: UnifiedHistoryItem) {
    e.preventDefault();
    e.stopPropagation();
    deleteUnifiedHistoryItem(item);
    refreshHistory();
    toast.success("Removed from history");
  }

  function handleClearHistory() {
    clearAllUnifiedHistory();
    refreshHistory();
    toast.success("Unified history cleared");
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out of workspace");
    void navigate({ to: "/" });
  }

  const avatarUrl = user?.user_metadata?.["avatar_url"] as string | undefined;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/70 bg-card/50 backdrop-blur select-none"
    >
      {/* Sidebar Header: Workspace Identity */}
      <SidebarHeader className="border-b border-border/50 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-accent/60">
              <Link to="/app" className="flex items-center gap-2.5">
                <div className="brand-bg flex size-8 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-sm">
                  <Sparkles className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-display text-sm font-bold tracking-tight">
                    My <span className="brand-text">AI Pro</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Workspace • Enterprise
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {/* Main Workspace Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2">
            Workspace Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.title}
                    className="gap-2.5 px-2.5 py-2 font-medium"
                  >
                    <Link to={item.url}>
                      <item.icon
                        className={`size-4 ${item.isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Unified History Section across all tools */}
        <SidebarGroup className="mt-2">
          <div className="flex items-center justify-between px-2 pb-1">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 p-0 flex items-center gap-1.5">
              <History className="size-3 text-muted-foreground" />
              <span>History</span>
            </SidebarGroupLabel>
            {historyItems.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                title="Clear all history"
                aria-label="Clear all history"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {historyItems.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2.5 py-3 text-center rounded-lg border border-dashed border-border/60 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground">No unified history yet.</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      Activity from Builder, Chat, Voice, & Presentations will appear here.
                    </p>
                  </div>
                </SidebarMenuItem>
              ) : (
                historyItems.map((item) => {
                  const meta = getToolMeta(item.tool);
                  const Icon = meta.icon;
                  return (
                    <SidebarMenuItem key={`${item.tool}-${item.id}`}>
                      <div className="group/item relative flex items-center w-full rounded-lg hover:bg-muted/60 transition-colors">
                        <SidebarMenuButton
                          asChild
                          tooltip={`${item.title} (${meta.label})`}
                          className="px-2.5 py-1.5 text-xs flex-1 truncate pr-7"
                        >
                          <Link to={item.url} className="flex items-center gap-2 truncate">
                            <Icon className={`size-3.5 shrink-0 ${meta.iconColor}`} />
                            <span className="truncate flex-1 font-medium text-foreground/90">
                              {item.title}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold shrink-0 ${meta.badgeBg}`}
                            >
                              {meta.label}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                        <button
                          onClick={(e) => handleDeleteItem(e, item)}
                          className="absolute right-1 opacity-0 group-hover/item:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity rounded"
                          title="Remove from history"
                          aria-label={`Remove ${item.title} from history`}
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cross-App Neural Memory Indicator */}
        <SidebarGroup className="mt-auto pt-2">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <BrainCircuit className="size-4 text-primary shrink-0 animate-pulse" />
              <span className="truncate">Neural Memory</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
              Syncing context between Voice Assistant & Chatbot
            </p>
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-primary">
              <span>Status: Ready</span>
              <span>{memorySummary}</span>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer: Subscription Upgrade Card & User Profile */}
      <SidebarFooter className="border-t border-border/50 p-2 space-y-2">
        {/* Subscription & Token Bar atop Email ID */}
        <div className="rounded-xl border border-border/80 bg-gradient-to-b from-card to-muted/40 p-2.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${subscription.planId === "free" ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
              <span className="text-xs font-bold text-foreground">
                {SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId)?.name || "Free Trial"}
              </span>
            </div>
            <span className="text-[10px] font-extrabold text-primary font-mono">
              {formatINR(SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId)?.priceINR || 0)}
            </span>
          </div>

          {/* Token Usage Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Tokens Used</span>
              <span className="font-mono font-medium text-foreground">
                {subscription.tokensUsed.toLocaleString()} / {subscription.tokensLimit.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  subscription.tokensUsed >= subscription.tokensLimit
                    ? "bg-destructive"
                    : subscription.tokensUsed / subscription.tokensLimit > 0.8
                      ? "bg-amber-500"
                      : "brand-bg"
                }`}
                style={{
                  width: `${Math.min(100, Math.round((subscription.tokensUsed / Math.max(1, subscription.tokensLimit)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Upgrade CTA for Free tier or limit reached */}
          {subscription.planId === "free" || subscription.tokensUsed >= subscription.tokensLimit ? (
            <button
              type="button"
              onClick={() => setPlanDialogOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg brand-bg text-primary-foreground font-bold text-[11px] shadow-sm hover:opacity-95 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                <Crown className="size-3.5 text-amber-300" />
                <span>{subscription.tokensUsed >= subscription.tokensLimit ? "Limit Reached • Upgrade" : "Upgrade from ₹199"}</span>
              </div>
              <ArrowUpRight className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPlanDialogOpen(true)}
              className="w-full flex items-center justify-between px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-semibold transition-colors cursor-pointer"
            >
              <span>Manage Subscription</span>
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-2 p-1.5">
              <div className="flex items-center gap-2 overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={username || "User"}
                    className="size-7 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {(username || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col truncate leading-none">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {username || user?.email?.split("@")[0] || "Guest User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user?.email || "Free Workspace"}
                  </span>
                </div>
              </div>
              {user && (
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                </button>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      {/* Onboarding / Plan Selection Dialog */}
      <OnboardingPlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        userId={user?.id || user?.email}
        onPlanSelected={() => {
          refreshSubscription();
        }}
      />

      {/* Payment Gateway Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        selectedPlan={SUBSCRIPTION_PLANS[1]}
        userId={user?.id || user?.email}
        onSuccess={() => {
          refreshSubscription();
        }}
      />
    </Sidebar>
  );
}
