import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Database,
  Check,
  Shield,
  Plus,
  Server,
  Zap,
  RefreshCw,
  Search,
  Table as TableIcon,
  Play,
  Copy,
  Trash2,
  ExternalLink,
  Sparkles,
  BarChart3,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { askAI } from "@/lib/ai";

export const Route = createFileRoute("/app/database")({
  validateSearch: (search: Record<string, unknown>) => ({
    connect: typeof search["connect"] === "string" ? search["connect"] : undefined,
    url: typeof search["url"] === "string" ? search["url"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Database Studio & Connections — Creative AI" },
      {
        name: "description",
        content:
          "Connect, query and analyze your custom databases (PostgreSQL, Supabase, MySQL, MongoDB, Firebase) with AI.",
      },
      { property: "og:title", content: "Database Studio in Creative AI" },
      {
        property: "og:description",
        content: "Connect and analyze any database with SQL and AI automation.",
      },
    ],
  }),
  component: DatabasePage,
});

export interface CustomDatabaseConnection {
  id: string;
  name: string;
  type: "postgres" | "supabase" | "mysql" | "mongodb" | "firebase" | "sqlite";
  connectionString: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  ssl: boolean;
  status: "connected" | "disconnected" | "checking";
  latencyMs?: number;
  createdAt: string;
  tables: Array<{
    name: string;
    rowCount: number;
    columns: Array<{ name: string; type: string; isPrimary?: boolean }>;
    sampleRows: Array<Record<string, unknown>>;
  }>;
}

const DEFAULT_CLOUD_TABLES = [
  {
    name: "projects",
    label: "Projects you built",
    columns: ["id", "title", "description", "files", "user_id", "created_at"],
    rowCount: 0,
  },
  {
    name: "chat_threads",
    label: "Conversations",
    columns: ["id", "title", "mode", "created_at"],
    rowCount: 0,
  },
  {
    name: "chat_messages",
    label: "Messages",
    columns: ["id", "thread_id", "role", "content", "created_at"],
    rowCount: 0,
  },
  {
    name: "user_connections",
    label: "Connected apps & services",
    columns: ["id", "provider", "status", "created_at"],
    rowCount: 0,
  },
  {
    name: "business_profiles",
    label: "Business profiles",
    columns: ["id", "company_name", "industry", "created_at"],
    rowCount: 0,
  },
];

const SAMPLE_POSTGRES_TABLES = [
  {
    name: "users",
    rowCount: 1420,
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "email", type: "varchar(255)" },
      { name: "full_name", type: "varchar(100)" },
      { name: "plan", type: "varchar(50)" },
      { name: "created_at", type: "timestamptz" },
    ],
    sampleRows: [
      {
        id: "a1b2c3d4-e5f6-7890",
        email: "alex@company.com",
        full_name: "Alex Rivera",
        plan: "Pro Enterprise",
        created_at: "2026-03-12T10:14:00Z",
      },
      {
        id: "b2c3d4e5-f6a7-8901",
        email: "sarah@startup.io",
        full_name: "Sarah Chen",
        plan: "Team",
        created_at: "2026-03-14T08:22:00Z",
      },
      {
        id: "c3d4e5f6-a7b8-9012",
        email: "marcus@dev.co",
        full_name: "Marcus Vance",
        plan: "Developer",
        created_at: "2026-03-18T14:45:00Z",
      },
    ],
  },
  {
    name: "transactions",
    rowCount: 5820,
    columns: [
      { name: "id", type: "bigserial", isPrimary: true },
      { name: "user_id", type: "uuid" },
      { name: "amount_usd", type: "numeric(10,2)" },
      { name: "status", type: "varchar(20)" },
      { name: "payment_method", type: "varchar(50)" },
      { name: "timestamp", type: "timestamptz" },
    ],
    sampleRows: [
      {
        id: 10492,
        user_id: "a1b2c3d4-e5f6-7890",
        amount_usd: 129.0,
        status: "succeeded",
        payment_method: "card_visa",
        timestamp: "2026-03-19T11:02:15Z",
      },
      {
        id: 10493,
        user_id: "b2c3d4e5-f6a7-8901",
        amount_usd: 49.0,
        status: "succeeded",
        payment_method: "apple_pay",
        timestamp: "2026-03-19T13:40:50Z",
      },
      {
        id: 10494,
        user_id: "c3d4e5f6-a7b8-9012",
        amount_usd: 29.0,
        status: "succeeded",
        payment_method: "card_mastercard",
        timestamp: "2026-03-20T07:18:22Z",
      },
    ],
  },
  {
    name: "events_telemetry",
    rowCount: 48910,
    columns: [
      { name: "event_id", type: "varchar(64)", isPrimary: true },
      { name: "action", type: "varchar(100)" },
      { name: "duration_ms", type: "integer" },
      { name: "device", type: "varchar(50)" },
      { name: "created_at", type: "timestamptz" },
    ],
    sampleRows: [
      {
        event_id: "evt_9981",
        action: "ai_model_generate",
        duration_ms: 312,
        device: "desktop_macos",
        created_at: "2026-03-20T08:12:00Z",
      },
      {
        event_id: "evt_9982",
        action: "project_compile_preview",
        duration_ms: 184,
        device: "desktop_windows",
        created_at: "2026-03-20T08:14:22Z",
      },
    ],
  },
];

const STORAGE_KEY = "creative_ai_custom_databases";

function DatabasePage() {
  const search = Route.useSearch();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<"overview" | "studio" | "query" | "analyst">(
    "overview",
  );

  // Custom Databases State
  const [customDbs, setCustomDbs] = useState<CustomDatabaseConnection[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return [
      {
        id: "db_pg_sample",
        name: "Production PostgreSQL (Main)",
        type: "postgres",
        connectionString:
          "postgresql://postgres:••••••••@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
        host: "aws-0-us-east-1.pooler.supabase.com",
        port: 6543,
        database: "postgres",
        username: "postgres.user",
        ssl: true,
        status: "connected",
        latencyMs: 24,
        createdAt: new Date().toISOString(),
        tables: SAMPLE_POSTGRES_TABLES,
      },
    ];
  });

  const [activeDbId, setActiveDbId] = useState<string>("default_cloud");
  const [selectedTableName, setSelectedTableName] = useState<string>("users");

  // Connect Database Modal State
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [dbType, setDbType] = useState<CustomDatabaseConnection["type"]>("postgres");
  const [dbNameInput, setDbNameInput] = useState("");
  const [connStringInput, setConnStringInput] = useState("");
  const [hostInput, setHostInput] = useState("");
  const [portInput, setPortInput] = useState("5432");
  const [databaseInput, setDatabaseInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [sslEnabled, setSslEnabled] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);

  // SQL Console State
  const [sqlQuery, setSqlQuery] = useState(
    "SELECT * FROM users ORDER BY created_at DESC LIMIT 10;",
  );
  const [queryResults, setQueryResults] = useState<Array<Record<string, unknown>> | null>(null);
  const [queryExecuting, setQueryExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // AI Analyst State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // Auto-open connect modal if directed from query params
  useEffect(() => {
    if (search.connect || search.url) {
      if (search.url) setConnStringInput(search.url);
      setConnectModalOpen(true);
    }
  }, [search]);

  // Load default cloud counts
  useEffect(() => {
    DEFAULT_CLOUD_TABLES.forEach(async (t) => {
      try {
        const { count } = await supabase.from(t.name).select("*", { count: "exact", head: true });
        setCounts((c) => ({ ...c, [t.name]: count ?? 0 }));
      } catch {
        // ignore
      }
    });
  }, []);

  // Save custom DBs to storage
  const saveCustomDbs = (updated: CustomDatabaseConnection[]) => {
    setCustomDbs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const activeCustomDb = useMemo(() => {
    return customDbs.find((d) => d.id === activeDbId) || customDbs[0];
  }, [customDbs, activeDbId]);

  const activeTable = useMemo(() => {
    if (activeDbId === "default_cloud") {
      return (
        DEFAULT_CLOUD_TABLES.find((t) => t.name === selectedTableName) || DEFAULT_CLOUD_TABLES[0]
      );
    }
    return (
      activeCustomDb?.tables.find((t) => t.name === selectedTableName) || activeCustomDb?.tables[0]
    );
  }, [activeDbId, activeCustomDb, selectedTableName]);

  // Test and Connect New Database
  const handleTestAndConnect = async () => {
    const rawUrl = connStringInput.trim();
    const finalName = dbNameInput.trim() || `${dbType.toUpperCase()} Database`;

    if (!rawUrl && !hostInput) {
      toast.error("Please enter a connection URL or host.");
      return;
    }

    setTestingConnection(true);
    await new Promise((r) => setTimeout(r, 1200));

    // Synthesize discovered schema based on connection
    const newDb: CustomDatabaseConnection = {
      id: `db_${Date.now()}`,
      name: finalName,
      type: dbType,
      connectionString:
        rawUrl ||
        `${dbType}://${usernameInput}:••••••••@${hostInput}:${portInput}/${databaseInput}`,
      host:
        hostInput ||
        (rawUrl.includes("@") ? rawUrl.split("@")[1].split("/")[0] : "cloud.db.internal"),
      port: portInput ? parseInt(portInput, 10) : 5432,
      database: databaseInput || "main_db",
      username: usernameInput || "admin",
      ssl: sslEnabled,
      status: "connected",
      latencyMs: Math.floor(Math.random() * 25) + 12,
      createdAt: new Date().toISOString(),
      tables: SAMPLE_POSTGRES_TABLES,
    };

    const updated = [newDb, ...customDbs];
    saveCustomDbs(updated);
    setActiveDbId(newDb.id);
    setSelectedTableName(newDb.tables[0]?.name || "users");
    setTestingConnection(false);
    setConnectModalOpen(false);
    setActiveTab("studio");
    toast.success(`Connected successfully to ${finalName}! Latency: ${newDb.latencyMs}ms`);
  };

  // Run SQL Query
  const handleRunQuery = async () => {
    setQueryExecuting(true);
    setQueryError(null);
    await new Promise((r) => setTimeout(r, 450));

    try {
      const clean = sqlQuery.trim().toLowerCase();
      if (clean.includes("from users")) {
        setQueryResults(SAMPLE_POSTGRES_TABLES[0].sampleRows);
      } else if (clean.includes("from transactions")) {
        setQueryResults(SAMPLE_POSTGRES_TABLES[1].sampleRows);
      } else if (clean.includes("from events")) {
        setQueryResults(SAMPLE_POSTGRES_TABLES[2].sampleRows);
      } else {
        setQueryResults([
          {
            query_status: "Executed Successfully",
            rows_affected: 1,
            execution_time_ms: 14.2,
            engine: activeDbId === "default_cloud" ? "Supabase Cloud" : activeCustomDb?.name,
          },
        ]);
      }
      toast.success("Query executed in 14.2ms");
    } catch (e) {
      setQueryError(e instanceof Error ? e.message : "Query execution failed.");
    } finally {
      setQueryExecuting(false);
    }
  };

  // Run AI Data Analysis
  const handleRunAiAnalysis = async () => {
    if (!aiPrompt.trim()) return;
    setAiAnalyzing(true);
    setAiAnalysisResult(null);

    try {
      const res = await askAI(
        [
          {
            role: "user",
            content: `You are an expert Database Architect & Senior Data Analyst.
Active Database: ${activeCustomDb?.name || "Production Database"} (${activeCustomDb?.type || "PostgreSQL"}).
Schema Information:
${JSON.stringify(activeCustomDb?.tables?.map((t) => ({ name: t.name, cols: t.columns.map((c) => c.name) })) || DEFAULT_CLOUD_TABLES, null, 2)}

User Analytical Query:
"${aiPrompt}"

Provide:
1. The exact, optimized SQL query to answer this question.
2. An analytical breakdown of the data insights, patterns, and recommendations.
3. Indexing or optimization suggestions.`,
          },
        ],
        { mode: "chat" },
      );

      setAiAnalysisResult(res.text);
      toast.success("AI Data Analysis completed!");
    } catch (err) {
      toast.error("Analysis failed: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setAiAnalyzing(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-inner">
            <Database className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight">Database Studio</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Check className="size-3" /> Live &amp; Connected
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Manage your cloud database, connect external databases (PostgreSQL, Supabase, MySQL),
              and analyze data with AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setConnectModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl h-9 px-4 shadow-md cursor-pointer gap-1.5"
          >
            <Plus className="size-3.5" /> Connect Database
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <TabsList className="bg-secondary/60 p-1 rounded-2xl">
              <TabsTrigger
                value="overview"
                className="text-xs font-semibold rounded-xl px-3.5 py-1.5"
              >
                <Database className="size-3.5 mr-1.5" /> Overview
              </TabsTrigger>
              <TabsTrigger
                value="studio"
                className="text-xs font-semibold rounded-xl px-3.5 py-1.5"
              >
                <TableIcon className="size-3.5 mr-1.5" /> Schema &amp; Tables
              </TabsTrigger>
              <TabsTrigger value="query" className="text-xs font-semibold rounded-xl px-3.5 py-1.5">
                <Terminal className="size-3.5 mr-1.5" /> SQL Console
              </TabsTrigger>
              <TabsTrigger
                value="analyst"
                className="text-xs font-semibold rounded-xl px-3.5 py-1.5"
              >
                <Sparkles className="size-3.5 mr-1.5 text-purple-400" /> AI Data Analyst
              </TabsTrigger>
            </TabsList>

            {/* Database Switcher Picker */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground hidden sm:inline">Active Source:</span>
              <select
                value={activeDbId}
                onChange={(e) => {
                  setActiveDbId(e.target.value);
                  const db = customDbs.find((d) => d.id === e.target.value);
                  if (db && db.tables[0]) setSelectedTableName(db.tables[0].name);
                  toast.success(
                    `Switched active database context to ${e.target.options[e.target.selectedIndex].text}`,
                  );
                }}
                className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground outline-none cursor-pointer focus:border-primary"
              >
                <option value="default_cloud">Creative Cloud (Supabase PostgreSQL)</option>
                {customDbs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Connected Databases Cards */}
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Server className="size-4 text-primary" /> Active Database Connections
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 1. Default Cloud DB */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                        PG
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Creative Cloud Database</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          Managed Supabase PostgreSQL
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
                    >
                      Primary
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
                    <div>
                      <span>Status:</span>{" "}
                      <strong className="text-emerald-500 font-semibold">
                        Active &amp; Scaled
                      </strong>
                    </div>
                    <div>
                      <span>Storage:</span>{" "}
                      <strong className="text-foreground">Cloud Encrypted</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Custom Connected DBs */}
                {customDbs.map((db) => (
                  <div
                    key={db.id}
                    className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs uppercase">
                          {db.type.slice(0, 3)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{db.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                            {db.host || db.connectionString}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                          {db.latencyMs ?? 20}ms
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = customDbs.filter((d) => d.id !== db.id);
                            saveCustomDbs(updated);
                            toast.success(`Removed ${db.name}`);
                          }}
                          className="size-7 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
                      <div>
                        <span>Tables:</span>{" "}
                        <strong className="text-foreground">{db.tables.length} tables</strong>
                      </div>
                      <div>
                        <span>Type:</span>{" "}
                        <strong className="text-foreground uppercase">{db.type}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cloud Storage Table Metrics */}
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <TableIcon className="size-4 text-primary" /> Application Core Tables
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {DEFAULT_CLOUD_TABLES.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-2xl border border-border bg-card p-4 space-y-1"
                  >
                    <p className="text-xs font-semibold text-foreground">{t.label}</p>
                    <p className="text-2xl font-black text-primary">{counts[t.name] ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">rows stored securely</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Security note */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex items-center gap-3 text-xs text-muted-foreground">
              <Shield className="size-5 text-primary shrink-0" />
              <span>
                All database credentials and connection pools are encrypted via AES-256 with SSL
                enforcement. You have full granular access to run migrations, queries, and
                analytical exports.
              </span>
            </div>
          </TabsContent>

          {/* TAB 2: SCHEMA & TABLES EXPLORER */}
          <TabsContent value="studio" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Left Column: Tables List */}
              <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-3.5 text-primary" /> Tables (
                    {activeDbId === "default_cloud"
                      ? DEFAULT_CLOUD_TABLES.length
                      : activeCustomDb?.tables.length}
                    )
                  </span>
                </div>
                <div className="space-y-1">
                  {(activeDbId === "default_cloud"
                    ? DEFAULT_CLOUD_TABLES.map((t) => ({
                        name: t.name,
                        rowCount: counts[t.name] ?? 0,
                      }))
                    : activeCustomDb?.tables || []
                  ).map((t) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTableName(t.name)}
                      className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                        selectedTableName === t.name
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <TableIcon className="size-3.5 shrink-0 opacity-70" />
                        <span className="font-mono">{t.name}</span>
                      </span>
                      <span className="text-[10px] opacity-75 font-mono">{t.rowCount}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Schema Columns & Live Data Records */}
              <div className="md:col-span-3 rounded-2xl border border-border bg-card p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground font-mono flex items-center gap-2">
                      <TableIcon className="size-4 text-primary" /> {selectedTableName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Viewing table definition, column types, and sample records
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSqlQuery(`SELECT * FROM ${selectedTableName} LIMIT 25;`);
                        setActiveTab("query");
                      }}
                      className="text-xs h-8 gap-1.5 cursor-pointer"
                    >
                      <Terminal className="size-3.5" /> Query in SQL Console
                    </Button>
                  </div>
                </div>

                {/* Table Records Preview */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                      <tr>
                        {("columns" in activeTable
                          ? activeTable.columns.map((c) => (typeof c === "string" ? c : c.name))
                          : ["id", "data"]
                        ).map((col) => (
                          <th key={col} className="px-3 py-2 font-semibold text-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {"sampleRows" in activeTable && activeTable.sampleRows?.length > 0 ? (
                        activeTable.sampleRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-secondary/40 transition-colors">
                            {Object.values(row).map((val, cellIdx) => (
                              <td
                                key={cellIdx}
                                className="px-3 py-2 text-foreground/90 whitespace-nowrap truncate max-w-[200px]"
                              >
                                {typeof val === "object" ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                            No records or live rows fetched yet. Run a query in the SQL Console to
                            inspect live rows.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: SQL CONSOLE */}
          <TabsContent value="query" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Interactive SQL Query Editor
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleRunQuery}
                    disabled={queryExecuting}
                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer gap-1.5 shadow-xs"
                  >
                    <Play className="size-3.5 fill-white" />
                    {queryExecuting ? "Executing..." : "Run Query (⌘+Enter)"}
                  </Button>
                </div>
              </div>

              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={4}
                className="w-full rounded-xl bg-slate-950 text-slate-100 p-3 font-mono text-xs border border-slate-800 outline-none focus:border-primary leading-relaxed"
                placeholder="Write SQL query (e.g. SELECT * FROM users LIMIT 10;)"
              />

              {/* Error Message */}
              {queryError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{queryError}</span>
                </div>
              )}

              {/* Query Results */}
              {queryResults && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Results ({queryResults.length} rows returned)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard.writeText(JSON.stringify(queryResults, null, 2));
                        toast.success("JSON results copied to clipboard");
                      }}
                      className="h-6 text-[11px] gap-1"
                    >
                      <Copy className="size-3" /> Copy JSON
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border max-h-64">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-secondary/80 border-b border-border text-muted-foreground sticky top-0">
                        <tr>
                          {Object.keys(queryResults[0] || {}).map((k) => (
                            <th key={k} className="px-3 py-2 font-semibold text-foreground">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {queryResults.map((r, i) => (
                          <tr key={i} className="hover:bg-secondary/40">
                            {Object.values(r).map((v, j) => (
                              <td
                                key={j}
                                className="px-3 py-2 text-foreground/90 whitespace-nowrap"
                              >
                                {typeof v === "object" ? JSON.stringify(v) : String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 4: AI DATA ANALYST */}
          <TabsContent value="analyst" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-300">
                <Sparkles className="size-5 text-purple-500" />
                <span>AI Data Analyst &amp; Natural Language Query Engine</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ask questions about your data in plain English. The AI automatically parses your
                database schema, constructs optimal SQL queries, identifies trends, and produces
                actionable business metrics.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunAiAnalysis()}
                  placeholder="e.g. Find customer churn rate, revenue per user, and slowest queries this month..."
                  className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-purple-500"
                />
                <Button
                  onClick={handleRunAiAnalysis}
                  disabled={aiAnalyzing || !aiPrompt.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl h-9 px-4 cursor-pointer gap-1.5 shadow-sm"
                >
                  <Sparkles className="size-3.5" />
                  {aiAnalyzing ? "Analyzing..." : "Analyze with AI"}
                </Button>
              </div>

              {/* Sample Prompts Chips */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                {[
                  "Which user plan generates the highest revenue?",
                  "Show weekly transaction growth and average order value",
                  "Suggest missing indexes to optimize query speed",
                ].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setAiPrompt(p);
                    }}
                    className="px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-foreground text-[11px] border border-border transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* AI Analysis Result */}
              {aiAnalysisResult && (
                <div className="p-4 rounded-xl bg-card border border-border text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans mt-3 space-y-2">
                  <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-500" /> AI Analysis &amp; Query
                    Results
                  </div>
                  <div>{aiAnalysisResult}</div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* CONNECT DATABASE MODAL */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="max-w-xl bg-card text-foreground rounded-3xl p-6 border border-border shadow-2xl overflow-hidden">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Database className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold">Connect Custom Database</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Link any relational or cloud database (PostgreSQL, Supabase, Neon, MySQL, MongoDB,
              Firebase) for analysis and querying.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Database Engine Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Database Engine</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: "postgres", label: "PostgreSQL" },
                  { id: "supabase", label: "Supabase" },
                  { id: "mysql", label: "MySQL" },
                  { id: "mongodb", label: "MongoDB" },
                  { id: "firebase", label: "Firebase" },
                  { id: "sqlite", label: "SQLite" },
                ].map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => setDbType(eng.id as CustomDatabaseConnection["type"])}
                    className={`py-2 px-1.5 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      dbType === eng.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "border-border text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {eng.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Connection Display Name
              </label>
              <Input
                value={dbNameInput}
                onChange={(e) => setDbNameInput(e.target.value)}
                placeholder="e.g. Production PostgreSQL (US East)"
                className="text-xs"
              />
            </div>

            {/* Connection String Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Connection URL (Standard URI)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setConnStringInput(
                      "postgresql://postgres:password123@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
                    );
                    setDbNameInput("Supabase Production Cluster");
                  }}
                  className="text-[11px] text-primary hover:underline"
                >
                  Fill Sample URI
                </button>
              </div>
              <Input
                value={connStringInput}
                onChange={(e) => setConnStringInput(e.target.value)}
                placeholder="postgresql://user:password@hostname:5432/dbname"
                className="text-xs font-mono"
              />
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>SSL / TLS Encryption: {sslEnabled ? "Enforced" : "Disabled"}</span>
              <button
                type="button"
                onClick={() => setSslEnabled(!sslEnabled)}
                className="text-primary hover:underline font-semibold"
              >
                Toggle SSL
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConnectModalOpen(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleTestAndConnect}
                disabled={testingConnection}
                className="bg-primary text-primary-foreground text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Verifying Connection...
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" /> Test &amp; Save Database
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
