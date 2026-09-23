/**
 * Unified LLM Service Provider Module
 *
 * Establishes a structured interface for managing multi-model routing,
 * switching seamlessly between Qwen-Code specialized coding engines (QwenLM/qwen-code.git),
 * Gemini Multimodal models, DeepSeek MoE, and Autonomous Neural synthesis.
 */

import { askAI, type AiMessage } from "./ai";
import { BUILD_MODELS } from "./models";

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
  name?: string;
}

export interface FimInfillOptions {
  prefix: string;
  suffix: string;
  language?: string;
}

export interface LLMCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  mode?: "chat" | "research" | "coding" | "presentations" | "build" | "voice" | "agent";
  fim?: FimInfillOptions;
  searchGrounding?: boolean;
}

export interface LLMCodeBlock {
  language: string;
  code: string;
  filename?: string;
}

export interface LLMCompletionResponse {
  text: string;
  modelUsed: string;
  providerName: string;
  isCodingSpecialized: boolean;
  codeBlocks: LLMCodeBlock[];
  sources?: Array<{ title: string; url: string }>;
  executionTimeMs: number;
}

export interface LLMProviderSpec {
  id: string;
  name: string;
  description: string;
  supportedModels: string[];
  isCodingSpecialized: boolean;
  supportsFim: boolean;
  formatFimPrompt?: (options: FimInfillOptions) => string;
  generate: (
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ) => Promise<LLMCompletionResponse>;
}

// 1. QWEN-CODE PROVIDER (QwenLM/qwen-code SOTA Coding Engine)
export class QwenCodeLLMProvider implements LLMProviderSpec {
  id = "qwen-code-provider";
  name = "Qwen-Code Engine (QwenLM/qwen-code)";
  description =
    "Official QwenLM state-of-the-art open-source code intelligence engine specializing in polyglot synthesis, Fill-In-The-Middle (FIM) code infilling, 60 FPS HTML5 game loops, and repository-level refactoring.";
  supportedModels = [
    "qwen-code-sota",
    "qwen-2.5-coder-72b",
    "creative-ultra-titan-3.8-max",
    "creative-coder-3.8-max",
  ];
  isCodingSpecialized = true;
  supportsFim = true;

  formatFimPrompt(options: FimInfillOptions): string {
    const lang = options.language || "typescript";
    return `You are Qwen Code Engine in Fill-In-The-Middle (FIM) infilling mode.
Language: ${lang}

<fim_prefix>
${options.prefix}
<fim_suffix>
${options.suffix}
<fim_middle>

Task: Generate ONLY the code that goes into <fim_middle> to perfectly connect prefix and suffix. Output clean code only with zero markdown wrappers.`;
  }

  async generate(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {},
  ): Promise<LLMCompletionResponse> {
    const startTime = Date.now();
    const model = options.model || "qwen-code-sota";

    const aiMessages: AiMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // If FIM option is provided, append FIM instruction prompt
    if (options.fim) {
      const fimPrompt = this.formatFimPrompt(options.fim);
      aiMessages.push({ role: "user", content: fimPrompt });
    }

    const systemPrompt = [
      `You are Qwen Code Engine (QwenLM/qwen-code), the state-of-the-art open-source code intelligence architecture developed by QwenLM and engineered in My AI Pro.`,
      `CRITICAL DIRECTIVES:`,
      `1. Polyglot Precision: Write production-ready, clean TypeScript, JavaScript, Python, Rust, Go, C++, SQL, and HTML5/CSS with strict typing.`,
      `2. Runnable Code: Ensure code snippets are completely self-contained with all imports, dependencies, and execution entry points included.`,
      `3. Game Engines & UI: When requested to build a game, output complete 60 FPS HTML5 Canvas apps with Web Audio sound FX and responsive controls.`,
      options.systemInstruction || "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const result = await askAI(aiMessages, {
      model,
      system: systemPrompt,
      mode: options.mode || "coding",
      search: options.searchGrounding,
    });

    const codeBlocks = extractCodeBlocksFromText(result.text);

    return {
      text: result.text,
      modelUsed: model,
      providerName: this.name,
      isCodingSpecialized: true,
      codeBlocks,
      sources: result.sources || [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// 2. GEMINI MULTIMODAL PROVIDER
export class GeminiMultimodalLLMProvider implements LLMProviderSpec {
  id = "gemini-multimodal-provider";
  name = "Google Gemini Multimodal Engine";
  description =
    "High-throughput multimodal AI engine for reasoning, search grounding, vision analysis, and general chat.";
  supportedModels = [
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview",
    "creative-core-3.8",
  ];
  isCodingSpecialized = false;
  supportsFim = false;

  async generate(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {},
  ): Promise<LLMCompletionResponse> {
    const startTime = Date.now();
    const model = options.model || "gemini-3.8-flash";

    const aiMessages: AiMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await askAI(aiMessages, {
      model,
      system: options.systemInstruction,
      mode: options.mode || "chat",
      search: options.searchGrounding,
    });

    const codeBlocks = extractCodeBlocksFromText(result.text);

    return {
      text: result.text,
      modelUsed: model,
      providerName: this.name,
      isCodingSpecialized: false,
      codeBlocks,
      sources: result.sources || [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// 3. DEEPSEEK MOE PROVIDER
export class DeepSeekLLMProvider implements LLMProviderSpec {
  id = "deepseek-provider";
  name = "DeepSeek MoE Reasoning Provider";
  description =
    "Open-source Mixture-of-Experts architecture for complex logic, mathematical proofs, and algorithmic optimization.";
  supportedModels = ["deepseek-coder-v2-max", "deepseek-ai/DeepSeek-V4.1-Flash"];
  isCodingSpecialized = true;
  supportsFim = false;

  async generate(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {},
  ): Promise<LLMCompletionResponse> {
    const startTime = Date.now();
    const model = options.model || "deepseek-coder-v2-max";

    const aiMessages: AiMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await askAI(aiMessages, {
      model,
      system: options.systemInstruction,
      mode: options.mode || "coding",
      search: options.searchGrounding,
    });

    const codeBlocks = extractCodeBlocksFromText(result.text);

    return {
      text: result.text,
      modelUsed: model,
      providerName: this.name,
      isCodingSpecialized: true,
      codeBlocks,
      sources: result.sources || [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// Helper utility to parse markdown code blocks
export function extractCodeBlocksFromText(text: string): LLMCodeBlock[] {
  const blocks: LLMCodeBlock[] = [];
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const language = match[1]?.trim() || "typescript";
    const code = match[2]?.trim() || "";
    if (code) {
      blocks.push({ language, code });
    }
  }

  return blocks;
}

// Helper utility to detect coding-specific prompts
export function isCodingPrompt(
  input: string | LLMMessage[],
  options?: LLMCompletionOptions,
): boolean {
  if (options?.mode === "coding" || options?.fim) {
    return true;
  }

  const textToAnalyze =
    typeof input === "string"
      ? input
      : input
          .map((m) => m.content)
          .join("\n")
          .toLowerCase();

  const lower = textToAnalyze.toLowerCase();

  // 1. Direct code blocks or structural syntaxes
  if (
    /```(?:ts|typescript|js|javascript|py|python|html|css|sql|rust|go|cpp|csharp|json|sh|bash)?/i.test(
      textToAnalyze,
    )
  ) {
    return true;
  }

  // 2. Strong programmatic indicator patterns
  const codingKeywords = [
    "function",
    "const ",
    "let ",
    "var ",
    "import ",
    "export ",
    "def ",
    "return ",
    "class ",
    "interface ",
    "type ",
    "enum ",
    "async ",
    "await ",
    "typeof ",
    "console.log",
    "print(",
    "select * from",
    "sql query",
    "regex",
    "api endpoint",
    "react component",
    "vue component",
    "tailwind css",
    "dockerfile",
    "tsconfig",
    "package.json",
    "algorithm",
    "debug this",
    "fix the bug",
    "syntax error",
    "runtime error",
    "refactor this code",
    "write a python",
    "write a script",
    "write a function",
    "write a program",
    "build a website",
    "build an app",
    "create a backend",
    "rest api",
    "graphql",
    "unit test",
    "jest test",
    "pytest",
    "qwen-code",
    "codestral",
  ];

  const matchedKeywords = codingKeywords.filter((kw) => lower.includes(kw));
  if (matchedKeywords.length >= 2) {
    return true;
  }

  // 3. Regex checks for code generation requests
  if (
    /\b(write|create|generate|implement|refactor|debug|fix|optimize)\s+(?:a\s+|an\s+|the\s+)?(?:typescript|javascript|python|react|html|css|sql|rust|go|c\+\+|node|express|api|function|hook|component|script|algorithm|regex|class|test|dockerfile)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  return false;
}

// UNIFIED LLM SERVICE REGISTRY & ROUTER
export class LLMService {
  private static qwenProvider: LLMProviderSpec = new QwenCodeLLMProvider();
  private static geminiProvider: LLMProviderSpec = new GeminiMultimodalLLMProvider();
  private static deepseekProvider: LLMProviderSpec = new DeepSeekLLMProvider();

  private static providers: LLMProviderSpec[] = [
    LLMService.qwenProvider,
    LLMService.geminiProvider,
    LLMService.deepseekProvider,
  ];

  /**
   * Check whether a given text or message history represents a coding task
   */
  static isCodingTask(input: string | LLMMessage[], options?: LLMCompletionOptions): boolean {
    return isCodingPrompt(input, options);
  }

  /**
   * Specialized model router:
   * Intercepts coding prompts and routes them exclusively to Qwen-Code SOTA model,
   * while preserving standard LLM routing for general chat queries.
   */
  static resolveModelAndProvider(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {},
  ): {
    provider: LLMProviderSpec;
    model: string;
    isCodingInterception: boolean;
  } {
    const isCoding = isCodingPrompt(messages, options);

    // If explicit model was requested
    if (options.model) {
      const explicitProvider = this.getProvider(options.model);
      return {
        provider: explicitProvider,
        model: options.model,
        isCodingInterception: isCoding && explicitProvider.isCodingSpecialized,
      };
    }

    // Specialized Routing Interception
    if (isCoding) {
      // Exclusively route coding prompts to Qwen-Code SOTA engine
      return {
        provider: this.qwenProvider,
        model: "qwen-code-sota",
        isCodingInterception: true,
      };
    }

    // Default to Standard General Chat LLM (Gemini Multimodal)
    return {
      provider: this.geminiProvider,
      model: "gemini-3.8-flash",
      isCodingInterception: false,
    };
  }

  /** Get provider for a given model ID or task type */
  static getProvider(modelId?: string): LLMProviderSpec {
    if (!modelId) {
      return this.qwenProvider; // Default to Qwen Code provider
    }

    const lower = modelId.toLowerCase();
    for (const provider of this.providers) {
      if (provider.supportedModels.some((m) => m.toLowerCase() === lower)) {
        return provider;
      }
    }

    // Default matching rules
    if (lower.includes("qwen") || lower.includes("coder") || lower.includes("code")) {
      return this.qwenProvider; // Qwen Code
    }
    if (lower.includes("deepseek")) {
      return this.deepseekProvider; // DeepSeek
    }

    return this.geminiProvider; // Gemini Multimodal
  }

  /**
   * Unified completion execution router with intelligent specialized prompt interception
   */
  static async generateCompletion(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {},
  ): Promise<LLMCompletionResponse> {
    const { provider, model, isCodingInterception } = this.resolveModelAndProvider(
      messages,
      options,
    );

    const mergedOptions: LLMCompletionOptions = {
      ...options,
      model,
      mode: isCodingInterception ? "coding" : options.mode || "chat",
    };

    const response = await provider.generate(messages, mergedOptions);

    return {
      ...response,
      modelUsed: model,
      providerName: provider.name,
      isCodingSpecialized: isCodingInterception || provider.isCodingSpecialized,
    };
  }

  /**
   * Format Fill-In-The-Middle (FIM) prompt for specialized Qwen-Code code infilling
   */
  static formatFimPrompt(prefix: string, suffix: string, language = "typescript"): string {
    const qwenProvider = this.providers[0] as QwenCodeLLMProvider;
    return qwenProvider.formatFimPrompt({ prefix, suffix, language });
  }

  /** List all active models with provider tags */
  static getActiveModels() {
    return BUILD_MODELS.map((m) => {
      const provider = this.getProvider(m.id);
      return {
        ...m,
        providerName: provider.name,
        isCodingSpecialized: provider.isCodingSpecialized,
      };
    });
  }
}

export * from "./code-engine";
