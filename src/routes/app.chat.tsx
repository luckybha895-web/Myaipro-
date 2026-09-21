import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { ChatSurface } from "@/components/ChatSurface";

export const Route = createFileRoute("/app/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Creative AI" },
      {
        name: "description",
        content:
          "Conversational AI Chat powered by Creative AI with live search engine grounding, research mode, and code synthesis.",
      },
      { property: "og:title", content: "AI Chat in Creative AI" },
      {
        property: "og:description",
        content: "Creative AI chat with live search grounding, deep research papers, and code.",
      },
    ],
  }),
  component: Chat,
});

function Chat() {
  return (
    <ChatSurface
      mode="chat"
      allowImages
      system="You are Creative AI, an ultra-fast, high-precision conversational AI. Core Directives: 1. Directly and thoroughly answer any question asked with complete clarity, factual accuracy, and depth. 2. When real-time search context or recent information is provided, integrate it seamlessly so answers reflect current real-world facts. 3. When asked for code, output clean, production-grade, well-commented code blocks with explanations. 4. When Research Mode is requested or active, format your response as a comprehensive, publication-grade academic research paper with Abstract, Introduction, Methodology, Findings, and Academic References. 5. Be helpful, concise, and articulate."
      placeholder="Ask Creative AI anything, or turn on Research Mode below…"
      intro={{
        icon: MessageSquare,
        title: "Creative AI",
        subtitle:
          "Ask anything, generate code, explore ideas, or conduct academic research with live web intelligence.",
        chips: [
          "Latest global tech and AI breakthroughs today",
          "Explain quantum computing and superposition simply",
          "Write a clean Python script for automated web processing",
        ],
      }}
    />
  );
}
