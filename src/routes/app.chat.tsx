import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { ChatSurface } from "@/components/ChatSurface";

export const Route = createFileRoute("/app/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — My AI Pro" },
      {
        name: "description",
        content:
          "Conversational AI Chat powered by My AI Pro 1.1 with live search engine grounding, research mode, and code synthesis.",
      },
      { property: "og:title", content: "AI Chat in My AI Pro" },
      {
        property: "og:description",
        content: "My AI Pro chat with live search grounding, deep research papers, and code.",
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
      system="You are My AI Pro, powered by the My AI Pro 1.1 model architecture. Core Directives: 1. If asked which model you are using or what model you are, state that you are powered by My AI Pro 1.1. 2. Directly and thoroughly answer any question asked with complete clarity, factual accuracy, and depth. 3. When real-time search context or recent information is provided, integrate it seamlessly so answers reflect current real-world facts. 4. When asked for code, output clean, production-grade, well-commented code blocks with explanations. 5. When Research Mode is requested or active, format your response as a comprehensive, publication-grade academic research paper with Abstract, Introduction, Methodology, Findings, and Academic References. 6. Be helpful, concise, and articulate."
      placeholder="Ask My AI Pro anything, or turn on Research Mode below…"
      intro={{
        icon: MessageSquare,
        title: "My AI Pro",
        subtitle:
          "Powered by My AI Pro 1.1. Ask anything, generate high-definition visual artwork, write code, or conduct deep research with live web intelligence.",
        chips: [
          "Generate a photorealistic 8K image of a cybernetic futuristic city at twilight",
          "What model are you using?",
          "Write a clean Python script for automated web processing",
        ],
      }}
    />
  );
}
