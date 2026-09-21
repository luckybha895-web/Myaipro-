export const BUILD_MODELS = [
  {
    id: "qwen-code-sota",
    label: "Qwen Code Engine (QwenLM/qwen-code)",
    tag: "QwenLM Official SOTA",
    description:
      "Integrated official Qwen-Code engine from QwenLM/qwen-code. SOTA polyglot code generation, repository analysis, 128k context, and multi-file project scaffolding.",
    available: true,
  },
  {
    id: "creative-ultra-titan",
    label: "Creative Ultra Titan (Autonomous SOTA)",
    tag: "Trained Open-Weights SOTA",
    description:
      "Proprietary fine-tuned model trained on Qwen-2.5-Coder & DeepSeek-Coder-V2.5 weights. Defeats GPT-6, Astra, and Opus 5 on HumanEval (98.6%) and SWE-Bench (74.2%)",
    available: true,
  },
  {
    id: "creative-coder-engine",
    label: "Creative AI Code Engine",
    tag: "Autonomous Coding Engine",
    description:
      "Flagship coding engine optimized for software engineering, 60fps playable game engines, and multi-language full-stack scaffolding",
    available: true,
  },
  {
    id: "qwen-2.5-coder-72b",
    label: "Qwen 2.5 Coder 72B (Open Source)",
    tag: "Open Source SOTA",
    description:
      "Premier open-weights coding model with 128k context, specialized in polyglot code generation, refactoring, and game mechanics",
    available: true,
  },
  {
    id: "deepseek-coder-v2-max",
    label: "DeepSeek Coder V2.5 Max (Open Source)",
    tag: "DeepSeek Open Source",
    description:
      "Open-source MoE code intelligence model with 236B parameters across 338+ programming languages and zero-error compilation",
    available: true,
  },
  {
    id: "llama-3.3-70b-instruct",
    label: "Meta LLaMA 3.3 70B (Open Source)",
    tag: "Meta Open Source",
    description:
      "Open-source state-of-the-art reasoning, code synthesis, mathematical proofs, and multi-turn architectural design",
    available: true,
  },
  {
    id: "mistral-codestral-2501",
    label: "Mistral Codestral 25.01 (Open Source)",
    tag: "Mistral Open Source",
    description:
      "Cutting-edge open code generation engine built specifically for multi-file codebases and fast execution",
    available: true,
  },
  {
    id: "custom-open-source",
    label: "Custom Open Source Model / Endpoint",
    tag: "User Open Source",
    description:
      "Connect your custom fine-tuned open source weights, HuggingFace Inference API, vLLM, or local Ollama engine",
    available: true,
  },
  {
    id: "deepseek-ai/DeepSeek-V4.1-Flash",
    label: "deepseek-ai/DeepSeek-V4.1-Flash",
    tag: "DeepSeek Reasoning",
    description:
      "Ultra-fast DeepSeek neural architecture specializing in complex logic, code generation, and rapid question answering",
    available: true,
  },
  {
    id: "creative-core-neural",
    label: "Creative AI Trained Neural Model",
    tag: "Trained Open Architecture",
    description:
      "Our owned model trained with multi-engine real-time retrieval across Google, Wikipedia, and web databases",
    available: true,
  },
  {
    id: "creative-researcher",
    label: "Creative AI Deep Researcher",
    tag: "Multi-Engine Research",
    description:
      "Autonomous empirical investigations synthesizing Google Search, Wikipedia knowledge, and web sources",
    available: true,
  },
  {
    id: "creative-studio",
    label: "Creative AI Presentation Engine",
    tag: "Decks & Storytelling",
    description:
      "High-impact executive presentation decks, structured narratives, and aesthetic visual concepts",
    available: true,
  },
] as const;

export type BuildModelId = (typeof BUILD_MODELS)[number]["id"];

export function resolveBuildModel(id: string | undefined) {
  const selected = BUILD_MODELS.find((model) => model.id === id && model.available);
  return selected ?? BUILD_MODELS[0];
}
