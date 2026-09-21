import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  MoreVertical,
  LogOut,
  Sparkles,
  ArrowLeft,
  Bot,
  History,
  MessageSquare,
  Mic,
  Presentation,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChatSessionsDrawer } from "@/components/ChatSessionsDrawer";
import type { ChatSession } from "@/lib/chat-sessions";

export function AppHeader({ back }: { back?: boolean }) {
  const navigate = useNavigate();
  const { user, username } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);

  const avatarUrl = user?.user_metadata?.["avatar_url"] as string | undefined;
  const isGoogle =
    user?.app_metadata?.["provider"] === "google" ||
    user?.user_metadata?.["provider"] === "google" ||
    user?.email?.includes("gmail");

  const handleSelectSession = (session: ChatSession) => {
    setHistoryOpen(false);
    navigate({ to: "/app/chat" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 mr-1 text-muted-foreground hover:text-foreground" />

        {back ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/app" })}
            aria-label="Back"
          >
            <ArrowLeft />
          </Button>
        ) : (
          <span className="brand-bg flex size-8 items-center justify-center rounded-xl">
            <Sparkles className="size-4 text-primary-foreground" />
          </span>
        )}

        {/* Create your AI Brand Title */}
        <div className="flex items-center gap-1.5">
          <Link to="/app" className="font-display text-lg font-bold tracking-tight">
            Create your <span className="brand-text">AI</span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Quick History Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            title="Chat & Voice History"
            aria-label="Open session history"
          >
            <History className="size-3.5 text-primary" />
            <span className="hidden sm:inline">History</span>
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/60 bg-muted/40 text-xs hover:bg-muted/70 transition-colors cursor-pointer"
                  aria-label="User account menu"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="size-5 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                      {username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate font-medium text-foreground">
                    {username}
                  </span>
                  {isGoogle && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                      Google
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-xl border-border/80">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{username}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setHistoryOpen(true)}
                  className="font-medium cursor-pointer flex items-center gap-2"
                >
                  <History className="size-4 text-primary" />
                  <span>Conversation History</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                  className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Slide-out Session History Drawer */}
      <ChatSessionsDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        currentSessionId={null}
        mode="chat"
        onSelectSession={handleSelectSession}
        onNewChat={() => {
          setHistoryOpen(false);
          navigate({ to: "/app/chat" });
        }}
      />
    </header>
  );
}
