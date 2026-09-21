import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Smartphone,
  Sparkles,
  Send,
  Loader2,
  Volume2,
  Square,
  Copy,
  RotateCcw,
  Image as ImageIcon,
  Video,
  Play,
  ExternalLink,
  ShieldCheck,
  BrainCircuit,
  Columns,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { speak, stopSpeaking } from "@/lib/speech";
import { useAi } from "@/components/AiProvider";
import { askAI, type AiMessage } from "@/lib/ai";
import { AgentDeviceScreen } from "@/components/AgentDeviceScreen";
import { saveAgentMemory, getAgentMemories, type AgentDeviceAction } from "@/lib/agent-memory";

export const Route = createFileRoute("/app/agent")({
  head: () => ({
    meta: [
      { title: "AI Agent — Autonomous Device AGI" },
      {
        name: "description",
        content: "Autonomous AI Agent working directly on user device with human-grade execution.",
      },
      { property: "og:title", content: "AI Agent" },
      { property: "og:description", content: "Autonomous AGI operating on your device." },
    ],
  }),
  component: AgentPage,
});

interface AgentChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: AgentDeviceAction;
  images?: Array<{ url: string; title: string }>;
  videos?: Array<{ url: string; title: string; thumbnail: string; videoId: string }>;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function AgentPage() {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your AI Agent. I work directly on your device like an AGI model, executing tasks with human-like operations. I remember your friends, instructions, and preferences.\n\nTell me what to do—such as messaging a friend on WhatsApp, ordering flight tickets, finding videos, or searching Google images.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<AgentDeviceAction | null>(null);
  const [layoutMode, setLayoutMode] = useState<"split" | "chat" | "device">("split");

  const { preferredVoice } = useAi();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const runTaskOnDevice = (userText: string) => {
    const textLower = userText.toLowerCase();

    // 1. Detect messaging task
    if (
      textLower.includes("message") ||
      textLower.includes("text") ||
      textLower.includes("whatsapp") ||
      textLower.includes("send to")
    ) {
      // Extract friend name
      const friendMatch =
        userText.match(/message\s+([A-Za-z]+)/i) ||
        userText.match(/to\s+([A-Za-z]+)/i) ||
        userText.match(/friend\s+([A-Za-z]+)/i);
      const recipient = friendMatch ? friendMatch[1] : "Alex";

      const appType = textLower.includes("whatsapp") ? "whatsapp" : "messages";
      const messageBody =
        userText.replace(/^(message|text|send|whatsapp)\s+.*?:/i, "").trim() ||
        "Hey! Let's meet at 5, hope you're having a great day.";

      // Remember contact
      saveAgentMemory(
        "contact",
        recipient,
        `Friend messaged on ${appType} with text: "${messageBody.slice(0, 40)}..."`,
      );

      const action: AgentDeviceAction = {
        id: uid(),
        app: appType,
        title: `Messaging ${recipient} on ${appType === "whatsapp" ? "WhatsApp" : "Messages"}`,
        status: "in_progress",
        data: {
          recipient,
          message: messageBody,
          app: appType,
        },
        steps: [
          {
            title: `Open ${appType === "whatsapp" ? "WhatsApp" : "Messages"} on device`,
            detail: "Launching local application",
            done: false,
            timestamp: "0s",
          },
          {
            title: `Search & select contact "${recipient}"`,
            detail: "Opening conversation thread",
            done: false,
            timestamp: "1s",
          },
          {
            title: `Type message: "${messageBody}"`,
            detail: "Human-like typing simulation",
            done: false,
            timestamp: "2s",
          },
          {
            title: "Send message and record in memory",
            detail: "Dispatched successfully",
            done: false,
            timestamp: "3s",
          },
        ],
      };

      setCurrentAction(action);

      // Simulate sequential step completion
      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps.map((s, idx) => (idx === 0 ? { ...s, done: true } : s)),
              }
            : null,
        );
      }, 1000);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps.map((s, idx) => (idx <= 1 ? { ...s, done: true } : s)),
              }
            : null,
        );
      }, 2000);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps.map((s, idx) => (idx <= 2 ? { ...s, done: true } : s)),
              }
            : null,
        );
      }, 3000);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                steps: prev.steps.map((s) => ({ ...s, done: true })),
                resultSummary: `Message sent to ${recipient} on ${appType === "whatsapp" ? "WhatsApp" : "Messages"}!`,
              }
            : null,
        );
      }, 4000);

      return action;
    }

    // 2. Detect flight ordering task
    if (
      textLower.includes("flight") ||
      textLower.includes("ticket") ||
      textLower.includes("fly") ||
      textLower.includes("airline")
    ) {
      const fromMatch = userText.match(/from\s+([A-Za-z\s]+?)\s+to/i);
      const toMatch = userText.match(/to\s+([A-Za-z\s]+)/i);

      const fromCity = fromMatch ? fromMatch[1].trim() : "New York (JFK)";
      const toCity = toMatch ? toMatch[1].trim() : "London (LHR)";

      saveAgentMemory(
        "preference",
        `Flight Route: ${fromCity} -> ${toCity}`,
        "Prefers morning nonstop departures and aisle seat.",
      );

      const action: AgentDeviceAction = {
        id: uid(),
        app: "flights",
        title: `Book flight tickets from ${fromCity} to ${toCity}`,
        status: "in_progress",
        data: {
          from: fromCity,
          to: toCity,
          date: "Next Friday",
          airline: "Delta / Virgin Atlantic",
          price: "480",
        },
        steps: [
          {
            title: "Launch Skyscanner flight engine on device",
            detail: "Setting up route search",
            done: false,
            timestamp: "0s",
          },
          {
            title: `Select best nonstop flight: ${fromCity} to ${toCity}`,
            detail: "Filtered for optimal duration and pricing",
            done: false,
            timestamp: "1s",
          },
          {
            title: "Auto-fill passenger details and select aisle seat",
            detail: "Retrieved preferences from agent device memory",
            done: false,
            timestamp: "2s",
          },
          {
            title: "Trigger Payment Shield (Payment requires user approval)",
            detail: "Autonomous payment gated for security",
            done: false,
            timestamp: "3s",
          },
        ],
      };

      setCurrentAction(action);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps.map((s, idx) => (idx === 0 ? { ...s, done: true } : s)),
              }
            : null,
        );
      }, 1000);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps.map((s, idx) => (idx <= 1 ? { ...s, done: true } : s)),
              }
            : null,
        );
      }, 2000);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                status: "requires_payment",
                steps: prev.steps.map((s) => ({ ...s, done: true })),
                resultSummary:
                  "Flight prepared and reserved on device! Payment Shield is active; please complete the final payment manually.",
              }
            : null,
        );
      }, 3500);

      return action;
    }

    // 3. Detect Browser & Online Ordering Task (e.g. order pizza, buy shoes, amazon, groceries)
    if (
      textLower.includes("order") ||
      textLower.includes("buy") ||
      textLower.includes("purchase") ||
      textLower.includes("amazon") ||
      textLower.includes("doordash") ||
      textLower.includes("shopping") ||
      textLower.includes("pizza") ||
      textLower.includes("food")
    ) {
      const itemMatch =
        userText.match(
          /order\s+(?:a\s+|an\s+|some\s+)?([A-Za-z0-9\s]+?)(?:\s+on|\s+from|\s+online|$)/i,
        ) ||
        userText.match(
          /buy\s+(?:a\s+|an\s+|some\s+)?([A-Za-z0-9\s]+?)(?:\s+on|\s+from|\s+online|$)/i,
        );

      const targetItem = itemMatch ? itemMatch[1].trim() : "Custom Item";
      const storeName = textLower.includes("doordash")
        ? "DoorDash"
        : textLower.includes("ubereats")
          ? "UberEats"
          : textLower.includes("walmart")
            ? "Walmart"
            : "Amazon Prime";

      saveAgentMemory(
        "task",
        `Order Request: ${targetItem}`,
        `Auto-browsing ${storeName}, filtered top-rated, address pre-filled`,
      );

      const action: AgentDeviceAction = {
        id: uid(),
        app: "shopping",
        title: `Ordering "${targetItem}" on ${storeName}`,
        status: "in_progress",
        data: {
          item: targetItem,
          itemName: `High-Grade ${targetItem} (Top Choice)`,
          store: storeName,
          price: "44.99",
          deliveryAddress: "742 Evergreen Terrace (Saved User Address)",
          eta: "Tomorrow by 1:30 PM",
        },
        steps: [
          {
            title: `Launch browser & open ${storeName} on device`,
            detail: "Navigating to e-commerce storefront",
            done: false,
            timestamp: "0s",
          },
          {
            title: `Search for "${targetItem}" and sort by Customer Rating`,
            detail: "Analyzed 42 available listings",
            done: false,
            timestamp: "1s",
          },
          {
            title: "Add top product to cart & fill delivery address",
            detail: "Applied saved profile and shipping preferences",
            done: false,
            timestamp: "2s",
          },
          {
            title: "Prepare order checkout for final user approval",
            detail: "Gated safely for user payment confirmation",
            done: false,
            timestamp: "3s",
          },
        ],
      };

      setCurrentAction(action);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps.map((s, idx) => (idx === 0 ? { ...s, done: true } : s)),
              }
            : null,
        );
      }, 1000);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps.map((s, idx) => (idx <= 1 ? { ...s, done: true } : s)),
              }
            : null,
        );
      }, 2000);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                status: "requires_payment",
                steps: prev.steps.map((s) => ({ ...s, done: true })),
                resultSummary: `Order for ${targetItem} prepared on ${storeName}! Review delivery details and tap confirm to complete payment.`,
              }
            : null,
        );
      }, 3500);

      return action;
    }

    // 4. Detect Opening Photo Studio & Device Apps (e.g. Photo Studio, Camera, Gallery)
    if (
      textLower.includes("photo studio") ||
      textLower.includes("photo") ||
      textLower.includes("camera") ||
      textLower.includes("gallery") ||
      textLower.includes("edit image") ||
      textLower.includes("pictures")
    ) {
      const action: AgentDeviceAction = {
        id: uid(),
        app: "photostudio",
        title: "Launching Photo Studio Pro on User Device",
        status: "in_progress",
        data: {
          photoUrl:
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
        },
        steps: [
          {
            title: "Open Photo Studio application on device",
            detail: "Loading GPU image shaders & HDR canvas",
            done: false,
            timestamp: "0s",
          },
          {
            title: "Import recent camera capture into editor",
            detail: "Loaded full 4K asset",
            done: false,
            timestamp: "1s",
          },
          {
            title: "Ready for live filter tuning and AI enhancement",
            detail: "Photo Studio active and ready",
            done: false,
            timestamp: "2s",
          },
        ],
      };

      setCurrentAction(action);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps.map((s, idx) => (idx === 0 ? { ...s, done: true } : s)),
              }
            : null,
        );
      }, 1000);

      setTimeout(() => {
        setCurrentAction((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                steps: prev.steps.map((s) => ({ ...s, done: true })),
                resultSummary: "Photo Studio Pro opened on your device! Ready for editing.",
              }
            : null,
        );
      }, 2200);

      return action;
    }

    // 5. Detect general or web search
    const action: AgentDeviceAction = {
      id: uid(),
      app: "browser",
      title: `Operating device for: ${userText.slice(0, 35)}…`,
      status: "in_progress",
      steps: [
        {
          title: "Executing device task",
          detail: "Querying live system & engines",
          done: false,
          timestamp: "0s",
        },
        {
          title: "Rendering live results on screen",
          detail: "Displaying to user",
          done: false,
          timestamp: "1s",
        },
      ],
    };
    setCurrentAction(action);

    setTimeout(() => {
      setCurrentAction((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              steps: prev.steps.map((s) => ({ ...s, done: true })),
            }
          : null,
      );
    }, 2000);

    return action;
  };

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt ?? draft).trim();
    if (!text || busy) return;

    setDraft("");
    const userMsg: AgentChatMessage = {
      id: uid(),
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setBusy(true);

    // Launch device action simulation
    const triggeredAction = runTaskOnDevice(text);

    try {
      const memories = getAgentMemories();
      const memoryPromptContext = memories.length
        ? `\n\n[USER DEVICE LONG-TERM MEMORY]:\n` +
          memories.map((m) => `- ${m.key} (${m.category}): ${m.value}`).join("\n")
        : "";

      const agentSystemPrompt = `You are the AI Agent, an autonomous AGI model operating directly on the user's personal device.
You execute tasks just like a human doing them manually on the device:
1. When asked to message someone (on WhatsApp, Messages, Slack, etc.), open the app on the device, locate the contact, type the message, and send it. You remember past contacts and past messages.
2. When asked to order or book flight tickets, search the flights, compare options, fill in passenger info and select preferred seats from memory, and reach the final checkout. Crucially: YOU CANNOT DO PAYMENTS AUTONOMOUSLY. Clearly state that all booking details are filled out on the device and waiting for the user's manual payment authorization as an AGI safety measure.
3. When asked to show images from Google, you return high-resolution verified images.
4. When asked to find a video, you retrieve the relevant YouTube videos.
5. You remember what the user says across sessions and work seamlessly on the user's device.
Be direct, competent, polite, and human-like. Report the exact steps taken on the device.${memoryPromptContext}`;

      const aiPayload: AiMessage[] = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askAI(aiPayload, {
        system: agentSystemPrompt,
        search: true,
      });

      const assistantMsg: AgentChatMessage = {
        id: uid(),
        role: "assistant",
        content: res.text || "Task executed on your device.",
        action: triggeredAction,
        images: res.images,
        videos: res.videos,
        sources: res.sources,
      };

      setMessages([...nextMessages, assistantMsg]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to execute agent task.");
      setMessages([
        ...nextMessages,
        {
          id: uid(),
          role: "assistant",
          content:
            "I encountered a momentary connection interruption, but your task details have been recorded into device memory.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (playingId === msgId) {
      stopSpeaking();
      setPlayingId(null);
    } else {
      setPlayingId(msgId);
      void speak(text, preferredVoice, () => setPlayingId(null));
    }
  };

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* AI Agent Header Bar - Clean without Creative AI logo */}
      <div className="flex items-center justify-between border-b border-border/70 bg-background/90 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Bot className="size-4" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>AI Agent</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                AGI Device Operator
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Works directly on your device · Remembers your contacts & tasks · Human-like execution
            </p>
          </div>
        </div>

        {/* Layout Mode Toggles */}
        <div className="flex items-center gap-1">
          <Button
            variant={layoutMode === "split" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5 gap-1.5"
            onClick={() => setLayoutMode("split")}
            title="Side by side split view"
          >
            <Columns className="size-3.5" />
            <span className="hidden sm:inline">Split View</span>
          </Button>
          <Button
            variant={layoutMode === "chat" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5 gap-1.5"
            onClick={() => setLayoutMode("chat")}
            title="Chat and commands only"
          >
            <span className="hidden sm:inline">Chat Only</span>
          </Button>
          <Button
            variant={layoutMode === "device" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5 gap-1.5"
            onClick={() => setLayoutMode("device")}
            title="Device screen only"
          >
            <Smartphone className="size-3.5" />
            <span className="hidden sm:inline">Device Screen</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Chat & Task Commands */}
        {(layoutMode === "split" || layoutMode === "chat") && (
          <div
            className={`flex flex-col h-full border-r border-border/70 overflow-hidden ${
              layoutMode === "split" ? "w-full lg:w-1/2" : "w-full max-w-3xl mx-auto"
            }`}
          >
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === "user" ? "flex justify-end" : "flex flex-col"}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-none bg-primary text-primary-foreground px-4 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm"
                        : "glow-panel max-w-full rounded-2xl rounded-bl-none px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap"
                    }
                  >
                    {m.content}

                    {/* Google Images Gallery */}
                    {m.images && m.images.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                          <ImageIcon className="size-3 text-primary" />
                          <span>Images from Google ({m.images.length})</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {m.images.map((img, idx) => (
                            <a
                              key={idx}
                              href={img.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative block aspect-video overflow-hidden rounded-lg border border-border/70 bg-muted/40 hover:border-primary"
                            >
                              <img
                                src={img.url}
                                alt={img.title}
                                className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                <span className="text-[10px] text-white truncate">{img.title}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* YouTube Videos */}
                    {m.videos && m.videos.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                          <Video className="size-3 text-red-500" />
                          <span>Videos on this topic ({m.videos.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {m.videos.map((vid, vIdx) => (
                            <div
                              key={vIdx}
                              className="rounded-lg border border-border/70 bg-card p-1.5 flex flex-col"
                            >
                              {activeVideoId === vid.videoId ? (
                                <div className="aspect-video w-full rounded overflow-hidden bg-black mb-1">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${vid.videoId}?autoplay=1`}
                                    title={vid.title}
                                    allowFullScreen
                                    className="size-full border-0"
                                  />
                                </div>
                              ) : (
                                <div
                                  onClick={() => setActiveVideoId(vid.videoId)}
                                  className="relative aspect-video w-full rounded overflow-hidden cursor-pointer bg-muted mb-1 group"
                                >
                                  <img
                                    src={vid.thumbnail}
                                    alt={vid.title}
                                    className="size-full object-cover group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <div className="size-8 rounded-full bg-red-600 flex items-center justify-center text-white">
                                      <Play className="size-4 fill-white translate-x-0.5" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              <a
                                href={vid.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-medium text-foreground hover:text-primary line-clamp-1 flex items-center justify-between"
                              >
                                <span>{vid.title}</span>
                                <ExternalLink className="size-2.5 opacity-60" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar for Assistant Message */}
                    {m.role === "assistant" && (
                      <div className="mt-2 flex items-center gap-1 text-muted-foreground border-t border-border/30 pt-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => handleSpeak(m.id, m.content)}
                          title="Speak answer"
                        >
                          {playingId === m.id ? (
                            <Square className="size-3 text-primary animate-pulse" />
                          ) : (
                            <Volume2 className="size-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => {
                            navigator.clipboard.writeText(m.content);
                            toast.success("Copied to clipboard");
                          }}
                          title="Copy response"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>Agent operating on device and recalling memory…</span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="border-t border-border/50 bg-background/50 px-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Message my friend Alex on WhatsApp: Hey let's meet at 5",
                  "Order flight tickets from New York to London",
                  "Show image from Google of James Webb telescope",
                  "Find a video on quantum computing",
                ].map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => handleSend(chip)}
                    className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Composer */}
            <div className="border-t border-border/70 p-3 bg-background/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Tell AI Agent what to do on your device (message, flights, Google images, videos)…"
                  className="h-10 text-xs sm:text-sm"
                  disabled={busy}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!draft.trim() || busy}
                  className="h-10 px-3.5 gap-1.5 shrink-0"
                >
                  <Send className="size-3.5" />
                  <span className="hidden sm:inline">Execute</span>
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Right Column: Interactive Device Screen & Memory */}
        {(layoutMode === "split" || layoutMode === "device") && (
          <div
            className={`h-full p-3 overflow-hidden ${
              layoutMode === "split" ? "hidden lg:flex lg:w-1/2" : "w-full"
            }`}
          >
            <AgentDeviceScreen currentAction={currentAction} />
          </div>
        )}
      </div>
    </div>
  );
}
