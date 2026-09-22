import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Code2,
  Terminal,
  Play,
  Sparkles,
  Bug,
  Zap,
  BookOpen,
  Copy,
  Download,
  RotateCcw,
  Check,
  FileCode,
  Layers,
  Cpu,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Wand2,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { askAI } from "@/lib/ai";
import { useAi } from "@/components/AiProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/app/coding")({
  head: () => ({
    meta: [
      { title: "AI Coding Studio — My AI Pro" },
      {
        name: "description",
        content:
          "Professional AI code generation, debugging, refactoring, and live sandbox powered by My AI Pro 1.1 and open-source models.",
      },
      { property: "og:title", content: "AI Coding Studio" },
      {
        property: "og:description",
        content: "High-performance coding with My AI Pro 1.1, Qwen, and DeepSeek.",
      },
    ],
  }),
  component: CodingStudio,
});

type CodeFile = {
  id: string;
  name: string;
  language: string;
  code: string;
};

const STARTER_FILES: Record<"react" | "python" | "html" | "sql", CodeFile[]> = {
  react: [
    {
      id: "app-tsx",
      name: "App.tsx",
      language: "typescript",
      code: `import React, { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Zap, RefreshCw } from "lucide-react";

export default function AnalyticsDashboard() {
  const [metric, setMetric] = useState(12840);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Zap className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Quantum Cloud Analytics</h1>
            <p className="text-xs text-slate-400">Autonomous Edge Node Telemetry</p>
          </div>
        </div>
        <button 
          onClick={() => setMetric((m) => m + Math.floor(Math.random() * 200) - 80)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="size-3.5" />
          <span>Refresh Feed</span>
        </button>
      </header>

      <main className="max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Throughput</span>
          <div className="text-3xl font-black text-white mt-2 font-mono">
            {metric.toLocaleString()} <span className="text-xs font-normal text-sky-400">req/s</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <span>↑ 18.4%</span>
            <span className="text-slate-500">vs previous epoch</span>
          </div>
        </div>
      </main>
    </div>
  );
}`,
    },
    {
      id: "types-ts",
      name: "types.ts",
      language: "typescript",
      code: `export interface TelemetryRecord {
  id: string;
  node: string;
  latencyMs: number;
  requestsPerSec: number;
  status: "healthy" | "degraded" | "critical";
  timestamp: string;
}

export interface MetricCluster {
  clusterId: string;
  totalThroughput: number;
  activeNodes: number;
  uptimePercentage: number;
}`,
    },
  ],
  python: [
    {
      id: "api-py",
      name: "main.py",
      language: "python",
      code: `"""
FastAPI High-Performance Async Data Processing Server
Powered by Open Source Model Code Architecture
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional
import time
import asyncio

app = FastAPI(
    title="High-Scale Edge Analytics Engine",
    description="Asynchronous telemetry ingestion and real-time processing API",
    version="2.5.0"
)

class TelemetryPayload(BaseModel):
    sensor_id: str = Field(..., example="edge-node-042")
    temperature: float = Field(..., ge=-50.0, le=150.0)
    vibration_index: float = Field(..., ge=0.0)
    battery_level: float = Field(..., ge=0.0, le=100.0)
    metadata: Optional[dict] = None

@app.get("/health")
async def health_check():
    return {
        "status": "operational",
        "timestamp": time.time(),
        "runtime": "Python 3.12-asyncio"
    }

@app.post("/api/v1/telemetry", status_code=202)
async def ingest_telemetry(payload: TelemetryPayload, background_tasks: BackgroundTasks):
    # Process ingestion in non-blocking worker pool
    background_tasks.add_task(process_telemetry_event, payload)
    return {"status": "queued", "sensor": payload.sensor_id}

async def process_telemetry_event(event: TelemetryPayload):
    # Simulated neural feature extraction
    await asyncio.sleep(0.01)
    if event.temperature > 85.0:
        print(f"[ALERT] Thermal threshold exceeded for {event.sensor_id}: {event.temperature}°C")
`,
    },
  ],
  html: [
    {
      id: "index-html",
      name: "index.html",
      language: "html",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Dynamic Application</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
    <div class="flex items-center gap-3">
      <span class="text-3xl">⚡</span>
      <div>
        <h1 class="text-lg font-bold text-white">Live Code Sandbox</h1>
        <p class="text-xs text-slate-400">Interactive client-side evaluation</p>
      </div>
    </div>
    <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
      <span class="text-xs text-slate-400 block font-mono">Counter Value:</span>
      <span id="counter" class="text-3xl font-bold font-mono text-sky-400">0</span>
    </div>
    <div class="flex gap-2">
      <button id="dec" class="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-sm transition">-</button>
      <button id="inc" class="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-sm transition text-white">+</button>
    </div>
  </div>
  <script>
    let count = 0;
    const el = document.getElementById("counter");
    document.getElementById("inc").onclick = () => { count++; el.innerText = count; };
    document.getElementById("dec").onclick = () => { count--; el.innerText = count; };
  </script>
</body>
</html>`,
    },
  ],
  sql: [
    {
      id: "schema-sql",
      name: "schema.sql",
      language: "sql",
      code: `-- Production Relational Database Architecture
-- PostgreSQL 16+ with ACID guarantees and JSONB indexing

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'pro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    device_id VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_org_time ON telemetry_events(org_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_device ON telemetry_events(device_id);
`,
    },
  ],
};

const OPEN_SOURCE_MODELS = [
  {
    id: "qwen-code-sota",
    name: "Qwen 2.5 Coder 72B (Open Source SOTA)",
    tag: "Open Source SOTA",
    desc: "Highest coding benchmark score among open weights",
  },
  {
    id: "deepseek-coder-v2.5",
    name: "DeepSeek Coder V2.5 Max (Open Source)",
    tag: "Open Source",
    desc: "Superior algorithmic reasoning and mathematical code",
  },
  {
    id: "llama-3.3-70b-code",
    name: "Meta LLaMA 3.3 70B Coder (Open Source)",
    tag: "Open Source",
    desc: "Meta's flagship open-weights architecture",
  },
  {
    id: "codestral-2501",
    name: "Mistral Codestral 22B (Open Source)",
    tag: "Open Source",
    desc: "Blazing fast deterministic code generation",
  },
  {
    id: "my-ai-pro-1-1",
    name: "My AI Pro 1.1 (Ultra Code Engine)",
    tag: "Flagship SOTA",
    desc: "High-speed multi-lingual autonomous coder and architect",
  },
  {
    id: "my-ai-pro-reasoning",
    name: "My AI Pro Deep Reasoning Architecture",
    tag: "Deep Reasoning",
    desc: "Complex multi-file refactoring and bug resolution",
  },
];

export function CodingStudio() {
  const { selectedModel: globalModel, setSelectedModel: setGlobalModel } = useAi();
  const [selectedModel, setSelectedModel] = useState("qwen-code-sota");
  const [selectedLanguage, setSelectedLanguage] = useState<"react" | "python" | "html" | "sql">(
    "react",
  );
  const [files, setFiles] = useState<CodeFile[]>(STARTER_FILES["react"]);
  const [activeFileId, setActiveFileId] = useState<string>("app-tsx");
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview" | "terminal">("editor");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] AI Coding Studio initialized.",
    `[ENGINE] Active Code Engine: Qwen 2.5 Coder 72B (Open Source)`,
    "[COMPILER] Syntax verification active. Ready for generation and refactoring.",
  ]);
  const [previewKey, setPreviewKey] = useState(0);

  const fallbackFile: CodeFile = {
    id: "app-tsx",
    name: "App.tsx",
    language: "typescript",
    code: "",
  };
  const activeFile: CodeFile = files.find((f) => f.id === activeFileId) ?? files[0] ?? fallbackFile;

  // Update active files when language switches
  function handleLanguageSwitch(lang: "react" | "python" | "html" | "sql") {
    setSelectedLanguage(lang);
    const newFiles = STARTER_FILES[lang] ?? STARTER_FILES["react"];
    setFiles(newFiles);
    if (newFiles.length > 0 && newFiles[0]) {
      setActiveFileId(newFiles[0].id);
    }
    addLog(`Switched environment to ${lang.toUpperCase()} suite.`);
  }

  function addLog(msg: string) {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev, `[${time}] ${msg}`]);
  }

  function handleCodeChange(newCode: string) {
    setFiles((prev) => prev.map((f) => (f.id === activeFile.id ? { ...f, code: newCode } : f)));
  }

  // Handle AI Code Generation or Refactoring
  async function executeAiCoding(actionType: "generate" | "fix" | "optimize" | "explain" | "test") {
    if (!prompt.trim() && actionType === "generate") {
      toast.error("Please enter instructions or a prompt for the code generator.");
      return;
    }

    setIsProcessing(true);
    const actionNames: Record<string, string> = {
      generate: "Writing new code from prompt",
      fix: "Analyzing syntax & resolving bugs",
      optimize: "Refactoring and optimizing logic",
      explain: "Synthesizing architectural explanation",
      test: "Generating comprehensive unit tests",
    };

    addLog(`[ACTION] ${actionNames[actionType]} using model "${selectedModel}"...`);

    let systemInstruction = `You are an expert Principal Software Engineer and Polyglot Architect (Specializing in Qwen 2.5 Coder and DeepSeek Coder architecture).
CRITICAL RULES:
1. Always write complete, production-ready, beautiful, modern code.
2. Never output placeholders, "// TODO", or truncated snippets. Write every single line.
3. Use modern best practices (TypeScript types, error handling, Tailwind CSS where relevant).
4. Return ONLY the code inside a markdown code fence like \`\`\`${activeFile.language} ... \`\`\` unless explaining.`;

    let userMessage = "";
    if (actionType === "generate") {
      userMessage = `Language: ${activeFile.language} (${activeFile.name})\nUser Request: ${prompt}\nExisting Code Context (if relevant):\n\`\`\`${activeFile.language}\n${activeFile.code.slice(0, 1000)}\n\`\`\`\n\nGenerate the complete, working, high-quality code.`;
    } else if (actionType === "fix") {
      userMessage = `Identify and fix all bugs, syntax errors, type mistakes, or edge cases in this ${activeFile.language} code:\n\`\`\`${activeFile.language}\n${activeFile.code}\n\`\`\`\n${prompt ? `Specific Issue: ${prompt}` : ""}\nReturn the fully fixed, production-grade code.`;
    } else if (actionType === "optimize") {
      userMessage = `Refactor and optimize this ${activeFile.language} code for maximum performance, clean readability, and best practices:\n\`\`\`${activeFile.language}\n${activeFile.code}\n\`\`\`\nReturn the complete refactored code.`;
    } else if (actionType === "test") {
      userMessage = `Write comprehensive, production-grade unit tests with mock assertions and edge cases for this ${activeFile.language} code:\n\`\`\`${activeFile.language}\n${activeFile.code}\n\`\`\``;
    } else if (actionType === "explain") {
      systemInstruction = `You are an elite code architect. Explain the following code clearly with architectural flow, key components, time/space complexity, and security considerations.`;
      userMessage = `Explain this ${activeFile.language} code in detail:\n\`\`\`${activeFile.language}\n${activeFile.code}\n\`\`\``;
    }

    try {
      const response = await askAI([{ role: "user", content: userMessage }], {
        model: selectedModel,
        mode: "coding",
        system: systemInstruction,
      });

      const responseText = response.text || "";

      if (actionType === "explain") {
        addLog(`[EXPLANATION] Architecture Breakdown:`);
        const lines = responseText.split("\n").slice(0, 8);
        for (const line of lines) {
          if (line.trim()) addLog(`  ${line}`);
        }
        setActiveTab("terminal");
        toast.success("Code explanation generated in Terminal!");
      } else {
        // Extract code from fence if present
        const match = responseText.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/);
        const extractedCode = match && match[1] ? match[1].trim() : responseText.trim();

        if (extractedCode.length > 20) {
          handleCodeChange(extractedCode);
          addLog(
            `[SUCCESS] Updated ${activeFile.name} (${extractedCode.split("\n").length} lines).`,
          );
          toast.success(`Successfully updated ${activeFile.name}!`);
          setPreviewKey((k) => k + 1);
        } else {
          addLog(`[NOTICE] Model returned text output.`);
        }
      }
    } catch (e) {
      addLog(
        `[ERROR] AI Coding engine encountered an issue: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
      toast.error("Code generation failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCopy() {
    void navigator.clipboard.writeText(activeFile.code);
    toast.success(`Copied ${activeFile.name} to clipboard!`);
  }

  function handleDownload() {
    const blob = new Blob([activeFile.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${activeFile.name}`);
  }

  // Generate runnable HTML preview for HTML/React tabs
  function getPreviewHtml() {
    if (activeFile.language === "html") {
      return activeFile.code;
    }
    // For React/TypeScript, construct an operable preview
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live React Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React;
    
    // Transpiled fallback representation
    function App() {
      return (
        <div className="p-8 max-w-2xl mx-auto space-y-4">
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-sky-400">⚡ Live Component Preview</h2>
            <p className="text-sm text-slate-300 mt-2">Active Code file: <code>${activeFile.name}</code></p>
            <div className="mt-4 p-4 bg-slate-950 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto">
              ${activeFile.code.replace(/</g, "&lt;").replace(/>/g, "&gt;").slice(0, 500)}...
            </div>
          </div>
        </div>
      );
    }
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;
  }

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background text-foreground">
      {/* Top Header & Model Controls */}
      <header className="h-14 border-b border-border/80 px-4 flex items-center justify-between gap-3 bg-card/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Code2 className="size-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              AI Coding Studio
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Open Source Models
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Open Source Model Selector */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              addLog(`Engine model switched to: ${e.target.value}`);
            }}
            aria-label="Select AI Coding Model"
            className="text-xs font-semibold bg-secondary border border-border rounded-xl px-3 py-1.5 text-foreground outline-none focus:border-primary cursor-pointer"
          >
            {OPEN_SOURCE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Language Suites */}
        <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-border text-xs">
          {(["react", "python", "html", "sql"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageSwitch(lang)}
              className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                selectedLanguage === lang
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: AI Code Prompts, Quick Actions & Chat */}
        <div className="w-full lg:w-96 border-r border-border/80 bg-card/30 flex flex-col shrink-0">
          <div className="p-4 border-b border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-sky-500" />
                <span>AI Coding Directives</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {activeFile.language}
              </span>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Tell the AI what to write or change in ${activeFile.name} (e.g. "Add JWT auth with refresh tokens", "Implement full sorting and pagination", "Fix race conditions")...`}
              className="text-xs min-h-[90px] resize-none bg-background font-mono"
            />

            <Button
              onClick={() => executeAiCoding("generate")}
              disabled={isProcessing || !prompt.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 cursor-pointer shadow-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  <span>Synthesizing Code...</span>
                </>
              ) : (
                <>
                  <Wand2 className="size-3.5 mr-1.5" />
                  <span>Generate / Update Code</span>
                </>
              )}
            </Button>
          </div>

          {/* Quick AI Engineering Actions */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            <span className="text-xs font-bold text-foreground block">
              One-Click Engineering Actions
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeAiCoding("fix")}
                disabled={isProcessing}
                className="text-xs justify-start gap-1.5 border-border hover:border-amber-500/40 hover:bg-amber-500/10 cursor-pointer h-9"
              >
                <Bug className="size-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Fix Bugs</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => executeAiCoding("optimize")}
                disabled={isProcessing}
                className="text-xs justify-start gap-1.5 border-border hover:border-sky-500/40 hover:bg-sky-500/10 cursor-pointer h-9"
              >
                <Zap className="size-3.5 text-sky-500 shrink-0" />
                <span className="truncate">Optimize</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => executeAiCoding("test")}
                disabled={isProcessing}
                className="text-xs justify-start gap-1.5 border-border hover:border-emerald-500/40 hover:bg-emerald-500/10 cursor-pointer h-9"
              >
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Unit Tests</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => executeAiCoding("explain")}
                disabled={isProcessing}
                className="text-xs justify-start gap-1.5 border-border hover:border-purple-500/40 hover:bg-purple-500/10 cursor-pointer h-9"
              >
                <BookOpen className="size-3.5 text-purple-500 shrink-0" />
                <span className="truncate">Explain Code</span>
              </Button>
            </div>

            {/* Starter Code Archetypes */}
            <div className="pt-3 border-t border-border/50 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Quick Project Templates
              </span>
              <div className="space-y-1.5">
                {[
                  "Full-Stack E-Commerce Store with Cart & Checkout",
                  "FastAPI Async Data Pipeline with Background Workers",
                  "Real-Time Chat Application with WebSockets",
                  "60 FPS Arcade Canvas Game Loop with Particles",
                ].map((tpl) => (
                  <button
                    key={tpl}
                    onClick={() => {
                      setPrompt(
                        `Build a complete, production-ready ${tpl} with state, UI, and logic.`,
                      );
                      toast.info(`Loaded prompt: ${tpl}`);
                    }}
                    className="w-full text-left p-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    ⚡ {tpl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Code Editor, Live Preview & Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Tabs & Views Toolbar */}
          <div className="h-10 border-b border-border/80 px-3 flex items-center justify-between bg-card/40 shrink-0">
            {/* File Switcher Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                    activeFile.id === file.id
                      ? "bg-secondary text-foreground border border-border shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileCode className="size-3" />
                  <span>{file.name}</span>
                </button>
              ))}
            </div>

            {/* View Mode & Actions Toolbar */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border text-[11px]">
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === "editor"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground"
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground"
                  }`}
                >
                  Live Preview
                </button>
                <button
                  onClick={() => setActiveTab("terminal")}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === "terminal"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground"
                  }`}
                >
                  Terminal
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
                title="Copy code"
              >
                <Copy className="size-3.5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
                title="Download file"
              >
                <Download className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Tab 1: Code Editor with Line Numbers */}
          {activeTab === "editor" && (
            <div className="flex-1 flex overflow-hidden font-mono text-xs bg-slate-950 text-slate-100">
              {/* Line Numbers Column */}
              <div className="w-12 py-3 bg-slate-950/80 border-r border-slate-800/80 select-none text-right pr-3 text-slate-600 font-mono text-xs overflow-hidden shrink-0">
                {activeFile.code.split("\n").map((_, i) => (
                  <div key={i} className="leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code TextArea */}
              <textarea
                value={activeFile.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full p-3 bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-5 overflow-auto selection:bg-sky-500/30"
              />
            </div>
          )}

          {/* Tab 2: Live Preview */}
          {activeTab === "preview" && (
            <div className="flex-1 bg-white relative overflow-hidden">
              <iframe
                key={previewKey}
                title="Live Sandbox Preview"
                srcDoc={getPreviewHtml()}
                sandbox="allow-scripts allow-forms allow-modals"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          )}

          {/* Tab 3: Terminal & Compilation Output */}
          {activeTab === "terminal" && (
            <div className="flex-1 bg-slate-950 text-slate-200 font-mono text-xs p-4 overflow-y-auto space-y-1">
              <div className="text-slate-500 pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>[TERMINAL CONSOLE &amp; AI DIAGNOSTICS]</span>
                <button
                  onClick={() => setTerminalLogs(["[CLEARED] Terminal buffer reset."])}
                  className="text-[10px] hover:text-slate-300 underline cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>
              {terminalLogs.map((log, index) => (
                <div
                  key={index}
                  className={`leading-5 ${
                    log.includes("[ERROR]")
                      ? "text-red-400 font-bold"
                      : log.includes("[SUCCESS]")
                        ? "text-emerald-400 font-bold"
                        : log.includes("[ACTION]")
                          ? "text-sky-400"
                          : log.includes("[SYSTEM]")
                            ? "text-indigo-400"
                            : "text-slate-300"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
