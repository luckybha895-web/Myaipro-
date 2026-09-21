import { useEffect, useState } from "react";
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
import { toast } from "sonner";

interface LocalProjectSummary {
  id: string;
  title: string;
  created_at?: string;
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, username, signOut } = useAuth();
  const { state } = useSidebar();
  const [projects, setProjects] = useState<LocalProjectSummary[]>([]);
  const [memorySummary, setMemorySummary] = useState<string>("");

  useEffect(() => {
    // Load local workspace projects
    try {
      const raw = localStorage.getItem("creative_ai_local_projects");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<
          string,
          { id: string; title: string; created_at?: string }
        >;
        const list = Object.values(parsed)
          .sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
          )
          .slice(0, 6);
        setProjects(list);
      }
    } catch {
      /* ignore */
    }

    // Check user memory context
    const mem = getUserMemory(user?.id || user?.email);
    if (mem.facts.length > 0 || mem.recentTopics.length > 0) {
      setMemorySummary(`${mem.facts.length} facts • ${mem.recentTopics.length} topics`);
    } else {
      setMemorySummary("Active");
    }
  }, [user?.id, user?.email]);

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
                    Creative <span className="brand-text">AI</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Workspace • Pro
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

        {/* Workspace Projects Section */}
        <SidebarGroup className="mt-2">
          <div className="flex items-center justify-between px-2 pb-1">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 p-0">
              Recent Projects
            </SidebarGroupLabel>
            <button
              onClick={() => navigate({ to: "/app" })}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="New Project"
              aria-label="Create new project"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="text-xs text-muted-foreground hover:text-foreground px-2.5"
                  >
                    <Link to="/app">
                      <Plus className="size-3.5 text-primary" />
                      <span>Create first app</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                projects.map((proj) => (
                  <SidebarMenuItem key={proj.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={proj.title}
                      className="px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Link
                        to="/app/project/$projectId"
                        params={{ projectId: proj.id }}
                        className="flex items-center gap-2 truncate"
                      >
                        <FolderCode className="size-3.5 shrink-0 text-cyan-500/80" />
                        <span className="truncate flex-1">{proj.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
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

      {/* Sidebar Footer: User Profile & Controls */}
      <SidebarFooter className="border-t border-border/50 p-2">
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
                    {(username || user?.email || "U")[0].toUpperCase()}
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
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="size-3.5" />
                </button>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
