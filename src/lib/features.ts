import {
  Sparkles,
  MessageSquare,
  Presentation,
  Bot,
  Mic,
  Code2,
  Database,
  BrainCircuit,
} from "lucide-react";

export type Feature = {
  to: string;
  label: string;
  desc: string;
  icon: typeof Sparkles;
};

export const FEATURES: Feature[] = [
  {
    to: "/app",
    label: "My AI Builder",
    desc: "Describe an idea, get a bespoke full-stack app or 60fps game",
    icon: Sparkles,
  },
  {
    to: "/app/chat",
    label: "AI Chat",
    desc: "Live answers, web research, vision & code",
    icon: MessageSquare,
  },
  {
    to: "/app/voice",
    label: "Voice Assistant",
    desc: "Natural voice, camera, screen & autonomous agent",
    icon: Mic,
  },
  {
    to: "/app/presentations",
    label: "Presentation Maker",
    desc: "Decks generated in 10-20 seconds with Canva tools",
    icon: Presentation,
  },
  {
    to: "/app/coding",
    label: "AI Coding Studio",
    desc: "Deep code generation, live sandbox, games & autonomous debugging",
    icon: Code2,
  },
];
