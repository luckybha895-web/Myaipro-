import { useState, useEffect } from "react";
import {
  Smartphone,
  Laptop,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plane,
  MessageSquare,
  Globe,
  Search,
  Send,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CreditCard,
  User,
  History,
  BrainCircuit,
  Trash2,
  Plus,
  ShoppingBag,
  Camera,
  Wand2,
  SlidersHorizontal,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getAgentMemories,
  saveAgentMemory,
  deleteAgentMemory,
  type AgentMemoryItem,
  type AgentDeviceAction,
} from "@/lib/agent-memory";

interface Props {
  currentAction: AgentDeviceAction | null;
  onClearAction?: (() => void) | undefined;
}

export function AgentDeviceScreen({ currentAction, onClearAction }: Props) {
  const [viewMode, setViewMode] = useState<"phone" | "desktop">("phone");
  const [activeTab, setActiveTab] = useState<"screen" | "memory">("screen");
  const [memories, setMemories] = useState<AgentMemoryItem[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    setMemories(getAgentMemories());
  }, []);

  // Simulate realistic human cursor movements when an action is running
  useEffect(() => {
    if (!currentAction || currentAction.status !== "in_progress") return;

    const interval = setInterval(() => {
      setCursorPos({
        x: Math.floor(20 + Math.random() * 60),
        y: Math.floor(30 + Math.random() * 50),
      });
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 300);
    }, 1800);

    return () => clearInterval(interval);
  }, [currentAction]);

  const handleAddMemory = () => {
    if (!newKey.trim() || !newVal.trim()) return;
    saveAgentMemory("preference", newKey.trim(), newVal.trim());
    setMemories(getAgentMemories());
    setNewKey("");
    setNewVal("");
  };

  const handleDeleteMemory = (id: string) => {
    deleteAgentMemory(id);
    setMemories(getAgentMemories());
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border/80 bg-card/60 shadow-lg overflow-hidden">
      {/* Top Device Bar */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-foreground">
            User Device Display · Live AGI Execution
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={activeTab === "screen" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5 gap-1"
            onClick={() => setActiveTab("screen")}
          >
            {viewMode === "phone" ? (
              <Smartphone className="size-3.5" />
            ) : (
              <Laptop className="size-3.5" />
            )}
            <span>Screen</span>
          </Button>
          <Button
            variant={activeTab === "memory" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5 gap-1"
            onClick={() => setActiveTab("memory")}
          >
            <BrainCircuit className="size-3.5 text-primary" />
            <span>Memory ({memories.length})</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            onClick={() => setViewMode(viewMode === "phone" ? "desktop" : "phone")}
            title="Toggle phone / desktop view"
          >
            {viewMode === "phone" ? (
              <Laptop className="size-3.5" />
            ) : (
              <Smartphone className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {activeTab === "memory" ? (
        /* Agent Memory Inspector */
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <BrainCircuit className="size-4 text-primary" />
              AGI Long-Term Device Memory
            </p>
            <p>
              The AI Agent automatically stores your friends, flight preferences, and custom device
              instructions here. It references this knowledge whenever performing tasks.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Remembered Knowledge
            </h4>
            <div className="space-y-2">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="group flex items-start justify-between gap-2 rounded-xl border border-border/70 bg-background/80 p-2.5 text-xs shadow-sm"
                >
                  <div>
                    <span className="inline-block rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground mb-1 uppercase">
                      {m.category}
                    </span>
                    <p className="font-semibold text-foreground">{m.key}</p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{m.value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteMemory(m.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add custom memory */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium text-foreground">Add Custom Memory / Fact</p>
            <Input
              placeholder="Topic or Contact (e.g. John's Email, Airline Preferences)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Value / Details to remember"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={handleAddMemory}
              disabled={!newKey.trim() || !newVal.trim()}
              className="h-7 text-xs w-full gap-1"
            >
              <Plus className="size-3" /> Save to Agent Memory
            </Button>
          </div>
        </div>
      ) : (
        /* Live Device Screen Simulation */
        <div className="flex-1 flex flex-col p-3 overflow-hidden bg-slate-950/40 relative">
          {/* Simulated Device Frame */}
          <div
            className={`mx-auto flex flex-col flex-1 w-full relative overflow-hidden transition-all duration-300 rounded-2xl border-2 border-border/90 bg-background shadow-2xl ${
              viewMode === "phone" ? "max-w-[360px]" : "max-w-full"
            }`}
          >
            {/* Phone Notch / Status bar */}
            <div className="flex items-center justify-between border-b border-border/40 bg-muted/60 px-4 py-1 text-[11px] font-medium text-muted-foreground">
              <span>9:41 AM</span>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                <span>5G · 100%</span>
              </div>
            </div>

            {/* Simulated Human Cursor Overlay */}
            {currentAction?.status === "in_progress" && (
              <div
                className="absolute pointer-events-none z-50 transition-all duration-500 ease-out"
                style={{ top: `${cursorPos.y}%`, left: `${cursorPos.x}%` }}
              >
                <div
                  className={`size-6 rounded-full border-2 border-white bg-primary/80 shadow-md flex items-center justify-center transition-transform ${
                    isClicking ? "scale-75 bg-primary ring-4 ring-primary/40" : "scale-100"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-white"></span>
                </div>
                <div className="ml-5 mt-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-medium text-white shadow">
                  Agent Operating
                </div>
              </div>
            )}

            {/* Screen Content depending on Action */}
            <div className="flex-1 flex flex-col overflow-y-auto p-3 bg-muted/10">
              {currentAction ? (
                <div className="flex flex-col h-full space-y-3">
                  {/* Active App Header */}
                  <div className="flex items-center justify-between rounded-xl bg-card border border-border/60 p-2.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      {currentAction.app === "whatsapp" || currentAction.app === "messages" ? (
                        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
                          <MessageSquare className="size-4" />
                        </div>
                      ) : currentAction.app === "flights" ? (
                        <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                          <Plane className="size-4" />
                        </div>
                      ) : currentAction.app === "shopping" ? (
                        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                          <ShoppingBag className="size-4" />
                        </div>
                      ) : currentAction.app === "photostudio" ? (
                        <div className="flex size-7 items-center justify-center rounded-lg bg-purple-600 text-white">
                          <Camera className="size-4" />
                        </div>
                      ) : (
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <Globe className="size-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-foreground capitalize">
                          {currentAction.app === "whatsapp"
                            ? "WhatsApp Device App"
                            : currentAction.app === "flights"
                              ? "Flight Booking (Skyscanner)"
                              : currentAction.app === "messages"
                                ? "Messages App"
                                : currentAction.app === "shopping"
                                  ? "Browser Auto-Order Engine"
                                  : currentAction.app === "photostudio"
                                    ? "Photo Studio Device App"
                                    : "Device Web Operator"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{currentAction.title}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        currentAction.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : currentAction.status === "requires_payment"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-primary/10 text-primary animate-pulse"
                      }`}
                    >
                      {currentAction.status === "completed"
                        ? "Task Finished"
                        : currentAction.status === "requires_payment"
                          ? "Payment Shield"
                          : "Simulating Human Input…"}
                    </span>
                  </div>

                  {/* App Screen Details */}
                  {currentAction.app === "whatsapp" || currentAction.app === "messages" ? (
                    <div className="flex-1 rounded-xl border border-border/60 bg-card p-3 flex flex-col justify-between shadow-inner">
                      {/* Chat recipient header */}
                      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                        <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                          {String(currentAction.data?.["recipient"] || "F").charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {String(currentAction.data?.["recipient"] || "Friend")}
                          </p>
                          <p className="text-[9px] text-emerald-500">Online · Mobile</p>
                        </div>
                      </div>

                      {/* Chat Bubbles */}
                      <div className="my-auto space-y-2 py-3">
                        <div className="rounded-2xl rounded-bl-none bg-muted/60 p-2 text-[11px] max-w-[80%] text-foreground">
                          Hey! How are you doing?
                        </div>
                        <div className="ml-auto rounded-2xl rounded-br-none bg-primary p-2.5 text-[11px] max-w-[85%] text-primary-foreground shadow-sm">
                          {String(
                            currentAction.data?.["message"] ||
                              "Hey! Let's catch up and discuss the project.",
                          )}
                          <div className="text-[9px] text-primary-foreground/70 text-right mt-1 flex items-center justify-end gap-1">
                            <span>9:41 AM</span>
                            <CheckCircle2 className="size-3 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Simulated Input Field */}
                      <div className="flex items-center gap-1.5 border-t border-border/40 pt-2">
                        <div className="flex-1 rounded-full bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground border border-border/60">
                          Message sent via device
                        </div>
                        <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Send className="size-3" />
                        </div>
                      </div>
                    </div>
                  ) : currentAction.app === "flights" ? (
                    <div className="flex-1 rounded-xl border border-border/60 bg-card p-3 flex flex-col space-y-2.5 shadow-inner">
                      {/* Search parameters */}
                      <div className="rounded-lg bg-muted/40 p-2 text-xs flex items-center justify-between border border-border/50">
                        <div>
                          <p className="font-bold text-foreground">
                            {String(currentAction.data?.["from"] || "NYC")} ✈️{" "}
                            {String(currentAction.data?.["to"] || "LON")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Date: {String(currentAction.data?.["date"] || "Next Week")} · 1
                            Passenger
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-primary">Best Deal</span>
                      </div>

                      {/* Flight options */}
                      <div className="space-y-1.5 flex-1 overflow-y-auto">
                        <div className="rounded-lg border-2 border-primary/60 bg-primary/5 p-2.5 text-xs flex items-center justify-between shadow-sm">
                          <div>
                            <p className="font-bold text-foreground">Nonstop · 7h 15m</p>
                            <p className="text-[10px] text-muted-foreground">
                              {String(currentAction.data?.["airline"] || "Delta / Virgin Atlantic")}
                            </p>
                            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                              ✓ Aisle Seat Selected from Memory
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">
                              ${String(currentAction.data?.["price"] || "480")}
                            </p>
                            <span className="text-[9px] text-muted-foreground">Round trip</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Shield Gate */}
                      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200">
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <ShieldCheck className="size-4 text-amber-500" />
                          <span>AGI Payment Shield Active</span>
                        </div>
                        <p className="text-[10px] leading-relaxed">
                          All flight details, passenger names, and preferences are populated. As per
                          AGI safety policy, autonomous payments are disabled. You can complete the
                          1-tap checkout yourself.
                        </p>
                      </div>
                    </div>
                  ) : currentAction.app === "shopping" ? (
                    <div className="flex-1 rounded-xl border border-border/60 bg-card p-3 flex flex-col space-y-2.5 shadow-inner">
                      {/* Browser address bar */}
                      <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-[11px] font-mono text-muted-foreground border border-border/50">
                        <Globe className="size-3 text-amber-500" />
                        <span className="truncate">
                          https://store.amazon.com/search?q=
                          {encodeURIComponent(String(currentAction.data?.["item"] || "item"))}
                        </span>
                      </div>

                      {/* Store product card */}
                      <div className="rounded-xl border border-border bg-background p-3 space-y-2 shadow-xs">
                        <div className="flex gap-2.5">
                          <div className="size-14 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 font-bold text-2xl">
                            🛍️
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-600 mb-0.5">
                              {String(currentAction.data?.["store"] || "Online Store")} · Best Rated
                            </span>
                            <p className="text-xs font-bold text-foreground truncate">
                              {String(
                                currentAction.data?.["itemName"] ||
                                  currentAction.data?.["item"] ||
                                  "Product",
                              )}
                            </p>
                            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                              ${String(currentAction.data?.["price"] || "39.99")} · In Stock
                            </p>
                          </div>
                        </div>

                        {/* Order Address & Cart details */}
                        <div className="rounded-lg bg-muted/40 p-2 text-[10px] space-y-1 text-muted-foreground">
                          <p className="flex justify-between">
                            <span>Delivery to:</span>
                            <span className="font-semibold text-foreground">
                              {String(
                                currentAction.data?.["deliveryAddress"] ||
                                  "742 Evergreen Terrace (Saved)",
                              )}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span>Est. Arrival:</span>
                            <span className="font-semibold text-emerald-600">
                              {String(currentAction.data?.["eta"] || "Tomorrow by 2:00 PM")}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Safe Payment Gate / Approval */}
                      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-900 dark:text-amber-200">
                        <div className="flex items-center gap-1.5 font-bold mb-0.5">
                          <ShieldCheck className="size-4 text-amber-500" />
                          <span>Order Prepared on Device</span>
                        </div>
                        <p className="text-[10px] leading-relaxed">
                          Cart and shipping address are filled. Tap below to confirm and finalize
                          order safely.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => {
                            toast.success("Order dispatched successfully! Confirmation #ORD-9281");
                          }}
                          className="w-full mt-2 bg-amber-600 hover:bg-amber-500 text-white font-bold h-7 text-xs rounded-lg cursor-pointer"
                        >
                          Confirm &amp; Place Order ($
                          {String(currentAction.data?.["price"] || "39.99")})
                        </Button>
                      </div>
                    </div>
                  ) : currentAction.app === "photostudio" ? (
                    <div className="flex-1 rounded-xl border border-border/60 bg-card p-3 flex flex-col space-y-2.5 shadow-inner">
                      {/* Photo Studio Top Bar */}
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Camera className="size-4 text-purple-500" />
                          <span className="text-xs font-bold text-foreground">
                            Photo Studio Pro
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-semibold">
                          HDR Engine Active
                        </span>
                      </div>

                      {/* Simulated Canvas with Filters */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-tr from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 flex items-center justify-center p-2">
                        <img
                          src={String(
                            currentAction.data?.["photoUrl"] ||
                              "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
                          )}
                          alt="Photo Studio preview"
                          className="max-h-full max-w-full object-cover rounded-lg shadow-lg"
                        />
                        <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white backdrop-blur-xs flex items-center gap-1">
                          <Wand2 className="size-3 text-purple-400" /> AI Enhanced
                        </div>
                      </div>

                      {/* Photo Studio Filter Controls */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Quick Presets
                        </p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {["Cyberpunk", "Cinematic", "Vivid HDR", "Monochrome", "Vintage"].map(
                            (filter) => (
                              <button
                                key={filter}
                                onClick={() => toast.success(`Applied ${filter} filter to photo`)}
                                className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-secondary hover:bg-purple-500 hover:text-white transition-colors cursor-pointer"
                              >
                                {filter}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success("Photo saved to Device Camera Roll & Gallery!");
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-7 text-xs rounded-lg cursor-pointer gap-1"
                      >
                        <ImageIcon className="size-3.5" /> Save High-Res Photo to Gallery
                      </Button>
                    </div>
                  ) : (
                    /* General Web/App Screen */
                    <div className="flex-1 rounded-xl border border-border/60 bg-card p-3 flex flex-col space-y-2 shadow-inner">
                      <div className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-mono text-muted-foreground truncate">
                        https://device.local/{currentAction.app}
                      </div>
                      <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                        <CheckCircle2 className="size-10 text-emerald-500 mb-2 animate-bounce" />
                        <p className="text-xs font-bold text-foreground">
                          {currentAction.resultSummary || "Device operation completed successfully"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Human-like typing and app interactions executed on device.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Progress Checklist */}
                  <div className="rounded-xl border border-border/70 bg-card p-2.5 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Execution Steps ({currentAction.steps.length})
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {currentAction.steps.map((st, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-1.5 text-xs text-foreground"
                        >
                          {st.done ? (
                            <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                          ) : (
                            <Clock className="size-3 text-primary animate-spin shrink-0" />
                          )}
                          <span
                            className={
                              st.done ? "text-muted-foreground line-through" : "font-medium"
                            }
                          >
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Idle Screen */
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Smartphone className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Device Ready for AGI</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                      Give the AI Agent a task in the chat (e.g., "Message my friend Alex", "Order
                      flight tickets to London", "Show images from Google", or "Find a video").
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card p-3 text-left w-full space-y-1.5 text-xs">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Supported Device Actions
                    </p>
                    <p className="text-foreground">💬 Open WhatsApp / Messages & send texts</p>
                    <p className="text-foreground">✈️ Book flight tickets (with Payment Shield)</p>
                    <p className="text-foreground">🖼️ Search Google for high-res images</p>
                    <p className="text-foreground">🎬 Find YouTube videos & play them</p>
                    <p className="text-foreground">
                      🧠 Auto-remembers contacts & past instructions
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
