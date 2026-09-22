import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Sparkles, Bot, Mic, Presentation, Database } from "lucide-react";

export function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    {
      title: "Builder",
      url: "/app",
      icon: Sparkles,
      isActive: location.pathname === "/app" || location.pathname.startsWith("/app/build"),
    },
    {
      title: "Chat",
      url: "/app/chat",
      icon: Bot,
      isActive: location.pathname.startsWith("/app/chat"),
    },
    {
      title: "Voice",
      url: "/app/voice",
      icon: Mic,
      isActive: location.pathname.startsWith("/app/voice"),
    },
    {
      title: "Decks",
      url: "/app/presentations",
      icon: Presentation,
      isActive: location.pathname.startsWith("/app/presentations"),
    },
    {
      title: "AWS & DB",
      url: "/app/database",
      icon: Database,
      isActive: location.pathname.startsWith("/app/database"),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-lg px-2 py-1.5 shadow-lg safe-area-bottom"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                item.isActive
                  ? "text-primary font-bold scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  item.isActive ? "bg-primary/15 text-primary" : ""
                }`}
              >
                <Icon className="size-4.5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
