import { useState, useEffect, useMemo, useCallback } from "react";
import { History, Plus, Trash2, Edit2, Check, X, Search, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  getSessionsByMode,
  deleteSession,
  renameSession,
  clearSessionsByMode,
  subscribeSessions,
  type ChatSession,
} from "@/lib/chat-sessions";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSessionId: string | null;
  mode: ChatSession["mode"];
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
};

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ChatSessionsDrawer({
  open,
  onOpenChange,
  currentSessionId,
  mode,
  onSelectSession,
  onNewChat,
}: Props) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const refresh = useCallback(() => {
    setSessions(getSessionsByMode(mode));
  }, [mode]);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeSessions(refresh);
    return () => unsubscribe();
  }, [refresh]);

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => {
      if (s.title.toLowerCase().includes(q)) return true;
      return s.messages.some((m) => m.content.toLowerCase().includes(q));
    });
  }, [sessions, search]);

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameSession(id, editTitle.trim());
      toast.success("Chat renamed");
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
    toast.success("Chat session deleted");
    if (currentSessionId === id) {
      onNewChat();
    }
  };

  const handleClearAll = () => {
    if (confirm(`Are you sure you want to clear all ${mode} chat sessions?`)) {
      clearSessionsByMode(mode);
      onNewChat();
      toast.success("History cleared");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-full sm:max-w-md flex-col p-0 bg-card">
        <SheetHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold">
              <History className="size-4 text-primary" />
              <span>Chat History</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground capitalize">
                {mode}
              </span>
            </SheetTitle>
          </div>
          <p className="text-xs text-muted-foreground text-left">
            Locally saved conversations and previous chat sessions
          </p>

          <div className="pt-2">
            <Button
              className="w-full justify-start gap-2 shadow-sm"
              onClick={() => {
                onNewChat();
                onOpenChange(false);
              }}
            >
              <Plus className="size-4" />
              <span>New Conversation</span>
            </Button>
          </div>

          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search chat history…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <MessageSquare className="size-8 opacity-40 mb-2" />
              <p className="text-xs font-medium">No previous sessions found</p>
              <p className="text-[11px] opacity-70 mt-1 max-w-[200px]">
                {search
                  ? "No chats match your search query."
                  : "Your past conversations will be saved here."}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectSession(session);
                      onOpenChange(false);
                    }
                  }}
                  className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors cursor-pointer border ${
                    isActive
                      ? "border-primary/40 bg-primary/10 text-foreground font-medium"
                      : "border-transparent hover:bg-secondary text-secondary-foreground"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-7 text-xs px-1.5"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSaveRename(e as unknown as React.MouseEvent, session.id);
                            if (e.key === "Escape")
                              handleCancelRename(e as unknown as React.MouseEvent);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 text-primary"
                          onClick={(e) => handleSaveRename(e, session.id)}
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 text-muted-foreground"
                          onClick={handleCancelRename}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="truncate font-medium">{session.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-2.5" />
                            {formatRelativeTime(session.updatedAt || session.createdAt)}
                          </span>
                          <span>•</span>
                          <span>
                            {session.messages.length}{" "}
                            {session.messages.length === 1 ? "message" : "messages"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={(e) => handleStartRename(e, session)}
                        aria-label="Rename session"
                      >
                        <Edit2 className="size-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDelete(e, session.id)}
                        aria-label="Delete session"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {sessions.length > 0 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">
              {sessions.length} {sessions.length === 1 ? "session" : "sessions"} saved locally
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] text-muted-foreground hover:text-destructive h-7 px-2"
              onClick={handleClearAll}
            >
              Clear All History
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
