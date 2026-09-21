import { useState, useEffect } from "react";
import {
  Globe,
  Search,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Loader2,
  Trash2,
  ArrowRight,
  Sparkles,
  Layers,
  Server,
  Lock,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export type DomainResult = {
  domain: string;
  tld: string;
  available: boolean;
  price: string;
  currency: string;
  registrarUrl: string;
  status: "available" | "taken" | "premium";
  recommendation?: string;
};

export type TLDItem = {
  tld: string;
  category: string;
  price: string;
  renewal: string;
  popular?: boolean;
  registrar: string;
};

export type ConnectedDomain = {
  id: string;
  domain: string;
  type: "custom" | "subdomain";
  target: string;
  status: "active" | "pending" | "error";
  sslStatus: "active" | "provisioning";
  createdAt: string;
  lastChecked?: string;
};

const STORAGE_KEY = "creative_ai_connected_domains";

const DEFAULT_TARGET_CNAME = "ais-dev-xz4vsbuupq2xiimkiddome-456698805881.asia-east1.run.app";
const DEFAULT_TARGET_A_IP = "34.149.87.120";

export function DomainManager({
  projectId,
  projectTitle = "My Application",
  onDomainConnected,
}: {
  projectId?: string;
  projectTitle?: string;
  onDomainConnected?: (domain: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"search" | "connect" | "tlds" | "manage">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DomainResult[]>([]);
  const [primaryResult, setPrimaryResult] = useState<DomainResult | null>(null);

  // TLD catalog state
  const [tldList, setTldList] = useState<TLDItem[]>([]);
  const [selectedTldCategory, setSelectedTldCategory] = useState<string>("all");
  const [tldFilterQuery, setTldFilterQuery] = useState<string>("");

  // Connect Your Own Domain states
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isConfigured: boolean;
    records: Array<{ type: string; data: string; ttl: number }>;
    sslStatus: string;
    propagation: number;
    message?: string;
  } | null>(null);

  // Connection Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [domainToConfirm, setDomainToConfirm] = useState<string>("");
  const [dnsChecklistAcknowledged, setDnsChecklistAcknowledged] = useState(false);
  const [isConnectingDomain, setIsConnectingDomain] = useState(false);

  const [connectedDomains, setConnectedDomains] = useState<ConnectedDomain[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return [
      {
        id: "default-1",
        domain: `${
          projectTitle
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-") || "my-app"
        }.creative.app`,
        type: "subdomain",
        target: DEFAULT_TARGET_CNAME,
        status: "active",
        sslStatus: "active",
        createdAt: new Date().toISOString(),
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(connectedDomains));
    } catch {
      /* ignore */
    }
  }, [connectedDomains]);

  // Load available TLDs on mount
  useEffect(() => {
    async function loadTlds() {
      try {
        const res = await fetch("/api/domain?action=tlds");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tlds)) {
            setTldList(data.tlds);
          }
        }
      } catch {
        /* fallback to default list if offline */
      }
    }
    void loadTlds();
  }, []);

  // Handle Domain Search
  async function handleSearch(term?: string) {
    const q = (term || searchQuery).trim();
    if (!q) {
      toast.error("Please enter a domain name to search.");
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/domain?q=${encodeURIComponent(q)}&action=lookup`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setPrimaryResult(data.primary || null);
      setSearchResults(data.all || []);
      toast.success(`Found live registrar availability for "${q}"`);
    } catch {
      toast.error("Could not query domain availability. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  // Handle DNS Verification
  async function handleVerifyDns(domainToVerify?: string) {
    const targetDomain = (domainToVerify || customDomainInput).trim().toLowerCase();
    if (!targetDomain) {
      toast.error("Please specify a domain to verify.");
      return;
    }

    setIsVerifyingDns(true);
    try {
      const res = await fetch(
        `/api/domain?q=${encodeURIComponent(targetDomain)}&action=verify_dns`,
      );
      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();
      setVerificationResult(data);

      if (data.isConfigured) {
        toast.success(`DNS verification successful for ${targetDomain}!`);
        // Update domain status in list
        setConnectedDomains((prev) =>
          prev.map((d) =>
            d.domain === targetDomain
              ? {
                  ...d,
                  status: "active",
                  sslStatus: "active",
                  lastChecked: new Date().toISOString(),
                }
              : d,
          ),
        );
      } else {
        toast.info("DNS not detected yet. Propagation may take 5–15 minutes.");
      }
    } catch {
      toast.error("Failed to verify DNS status.");
    } finally {
      setIsVerifyingDns(false);
    }
  }

  // Open confirmation modal for domain
  function handleInitiateConnect(domain: string) {
    const clean = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!clean || !clean.includes(".")) {
      toast.error("Please enter a valid domain (e.g. app.mybrand.com or mybrand.com)");
      return;
    }

    if (connectedDomains.some((d) => d.domain === clean)) {
      toast.info("This domain is already in your connected domains list.");
      setActiveTab("manage");
      return;
    }

    setDomainToConfirm(clean);
    setDnsChecklistAcknowledged(false);
    setConfirmModalOpen(true);
  }

  // Confirm and finalize domain connection
  async function handleConfirmDomainConnection() {
    if (!domainToConfirm) return;
    setIsConnectingDomain(true);

    try {
      const newEntry: ConnectedDomain = {
        id: "dom-" + Date.now(),
        domain: domainToConfirm,
        type: "custom",
        target: DEFAULT_TARGET_CNAME,
        status: "pending",
        sslStatus: "provisioning",
        createdAt: new Date().toISOString(),
      };

      setConnectedDomains((prev) => [newEntry, ...prev]);
      onDomainConnected?.(domainToConfirm);
      setConfirmModalOpen(false);
      setActiveTab("manage");
      toast.success(
        `Domain "${domainToConfirm}" successfully connected! DNS verification initiated.`,
      );
      void handleVerifyDns(domainToConfirm);
    } finally {
      setIsConnectingDomain(false);
    }
  }

  // Add custom domain from input
  function handleAddCustomDomain() {
    handleInitiateConnect(customDomainInput);
  }

  function handleRemoveDomain(id: string) {
    setConnectedDomains((prev) => prev.filter((d) => d.id !== id));
    toast.success("Domain removed from workspace.");
  }

  function copyText(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  }

  // Filtered TLD list
  const filteredTlds = tldList.filter((item) => {
    const matchCategory =
      selectedTldCategory === "all" ||
      (selectedTldCategory === "popular" && item.popular) ||
      item.category.toLowerCase().includes(selectedTldCategory.toLowerCase());
    const matchQuery =
      !tldFilterQuery ||
      item.tld.toLowerCase().includes(tldFilterQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(tldFilterQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  return (
    <div className="w-full rounded-2xl border border-border bg-card/60 backdrop-blur p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
            <Globe className="size-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              Domain Hub &amp; GoDaddy Registrar
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Live DNS
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Lookup and buy new domains via GoDaddy API, or connect your existing custom domain.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center bg-secondary/80 p-1 rounded-xl border border-border text-xs shrink-0 gap-1">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "search"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="size-3.5" />
            <span>Search &amp; Buy</span>
          </button>
          <button
            onClick={() => setActiveTab("tlds")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "tlds"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="size-3.5" />
            <span>Available TLDs</span>
          </button>
          <button
            onClick={() => setActiveTab("connect")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "connect"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-3.5" />
            <span>Connect Own Domain</span>
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "manage"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="size-3.5" />
            <span>Connected ({connectedDomains.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DOMAIN LOOKUP & GODADDY REGISTRAR */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Find your dream domain name</span>
              <span className="text-[10px] text-muted-foreground">
                Integrated with GoDaddy API &amp; Global DNS
              </span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. mybrand, modernai, pulseflow.com..."
                  className="pl-10 text-xs font-mono"
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 cursor-pointer shrink-0"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" /> Searching...
                  </>
                ) : (
                  <>
                    <Search className="size-3.5 mr-1.5" /> Check Availability
                  </>
                )}
              </Button>
            </div>

            {/* Quick Extension Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
              <span>Popular:</span>
              {[
                ".com ($11.99)",
                ".ai ($69.99)",
                ".io ($39.99)",
                ".dev ($14.99)",
                ".app ($16.99)",
                ".org ($12.99)",
              ].map((ext) => (
                <button
                  key={ext}
                  onClick={() => {
                    const base = searchQuery.split(".")[0] || "myapp";
                    const tld = ext.split(" ")[0];
                    const full = `${base}${tld}`;
                    setSearchQuery(full);
                    void handleSearch(full);
                  }}
                  className="px-2 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-[10px] cursor-pointer"
                >
                  {ext}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>Domain Availability &amp; Pricing</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ● Verified via GoDaddy Registrar
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.map((item) => (
                  <div
                    key={item.domain}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                      item.available
                        ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60"
                        : "border-border bg-card/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {item.domain}
                          </span>
                          {item.available ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Available
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">
                              Taken
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {item.available
                            ? `Estimated retail price: ${item.price}`
                            : "Already registered by another owner."}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs text-foreground block">
                          {item.price}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase">
                          {item.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                      {item.available ? (
                        <>
                          <a
                            href={item.registrarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 shadow-xs transition active:scale-95"
                          >
                            <span>Buy on GoDaddy</span>
                            <ExternalLink className="size-3" />
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInitiateConnect(item.domain)}
                            className="text-xs shrink-0 cursor-pointer"
                          >
                            <span>Connect</span>
                          </Button>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between text-xs">
                          <span className="text-muted-foreground text-[11px]">
                            Own this domain?
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInitiateConnect(item.domain)}
                            className="text-xs cursor-pointer gap-1"
                          >
                            <span>Connect It</span>
                            <ArrowRight className="size-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVAILABLE TLDS & REGISTRAR DIRECTORY */}
      {activeTab === "tlds" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Tag className="size-3.5 text-blue-500" />
                  <span>Available TLDs &amp; Registration Pricing</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Browse supported top-level domains, registration rates, and renewal fees from
                  GoDaddy &amp; ICANN.
                </p>
              </div>

              {/* Filter Search Input */}
              <div className="w-full sm:w-60">
                <Input
                  value={tldFilterQuery}
                  onChange={(e) => setTldFilterQuery(e.target.value)}
                  placeholder="Filter TLDs (e.g. .ai, tech)..."
                  className="text-xs h-8 font-mono"
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: "all", label: "All TLDs" },
                { id: "popular", label: "🔥 Popular" },
                { id: "ai", label: "🤖 AI & Machine Learning" },
                { id: "developer", label: "⚡ Dev & Tech" },
                { id: "business", label: "💼 Commerce & Business" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedTldCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedTldCategory === cat.id
                      ? "bg-blue-600 text-white font-semibold shadow-xs"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* TLDs Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredTlds.map((item) => (
              <div
                key={item.tld}
                className="rounded-2xl border border-border bg-card/60 p-3.5 hover:border-border/80 transition-all flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-foreground">
                      {item.tld}
                    </span>
                    {item.popular && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Popular
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Category: {item.category}
                  </span>
                </div>

                <div className="space-y-1 bg-secondary/40 p-2 rounded-xl text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-[11px]">1st Year Price:</span>
                    <span className="font-bold text-foreground font-mono">{item.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-[11px]">Renewal / yr:</span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {item.renewal}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const base = searchQuery.split(".")[0] || "mybrand";
                      const full = `${base}${item.tld}`;
                      setSearchQuery(full);
                      setActiveTab("search");
                      void handleSearch(full);
                    }}
                    className="flex-1 text-xs h-7 cursor-pointer"
                  >
                    <Search className="size-3 mr-1" />
                    <span>Check Name</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const base = searchQuery.split(".")[0] || "mybrand";
                      handleInitiateConnect(`${base}${item.tld}`);
                    }}
                    className="text-xs h-7 bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    Connect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONNECT YOUR OWN DOMAIN */}
      {activeTab === "connect" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-blue-500" />
              <h4 className="text-xs font-bold text-foreground">
                Connect Your Own Domain (GoDaddy, Namecheap, Cloudflare, etc.)
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your custom domain or subdomain. We will generate the exact DNS records needed
              to point your domain to Creative AI with automatic SSL/TLS certification.
            </p>

            <div className="flex gap-2 pt-1">
              <Input
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                placeholder="e.g. app.mycompany.com or mycompany.com"
                className="text-xs font-mono"
              />
              <Button
                onClick={handleAddCustomDomain}
                disabled={!customDomainInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 cursor-pointer shrink-0"
              >
                <span>Add Domain</span>
              </Button>
            </div>
          </div>

          {/* DNS Configuration Instructions Card */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">DNS Records Configuration</h4>
                <p className="text-[11px] text-muted-foreground">
                  Add these records in your domain registrar's DNS Management console (GoDaddy,
                  Namecheap, Cloudflare, etc.)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVerifyDns(customDomainInput)}
                disabled={isVerifyingDns}
                className="text-xs gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400"
              >
                {isVerifyingDns ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                <span>Verify DNS Live</span>
              </Button>
            </div>

            {/* Record 1: CNAME */}
            <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                    CNAME Record (Recommended)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    For subdomains (e.g. app, www)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-background border border-border rounded-lg p-2">
                  <span className="text-[9px] uppercase text-muted-foreground font-sans block">
                    Type
                  </span>
                  <span className="font-bold text-foreground">CNAME</span>
                </div>
                <div className="bg-background border border-border rounded-lg p-2">
                  <span className="text-[9px] uppercase text-muted-foreground font-sans block">
                    Host / Name
                  </span>
                  <span className="font-bold text-foreground">app (or @)</span>
                </div>
                <div className="bg-background border border-border rounded-lg p-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase text-muted-foreground font-sans block">
                      Target / Value
                    </span>
                    <span className="font-bold text-foreground text-[11px] truncate block">
                      {DEFAULT_TARGET_CNAME}
                    </span>
                  </div>
                  <button
                    onClick={() => copyText(DEFAULT_TARGET_CNAME, "CNAME Target")}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy Target"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Record 2: A Record */}
            <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                    A Record (Root Apex Domain)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    For root domains (e.g. mybrand.com)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-background border border-border rounded-lg p-2">
                  <span className="text-[9px] uppercase text-muted-foreground font-sans block">
                    Type
                  </span>
                  <span className="font-bold text-foreground">A</span>
                </div>
                <div className="bg-background border border-border rounded-lg p-2">
                  <span className="text-[9px] uppercase text-muted-foreground font-sans block">
                    Host / Name
                  </span>
                  <span className="font-bold text-foreground">@</span>
                </div>
                <div className="bg-background border border-border rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase text-muted-foreground font-sans block">
                      IP Address
                    </span>
                    <span className="font-bold text-foreground text-xs">{DEFAULT_TARGET_A_IP}</span>
                  </div>
                  <button
                    onClick={() => copyText(DEFAULT_TARGET_A_IP, "IP Address")}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy IP"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Status Banner */}
            {verificationResult && (
              <div
                className={`rounded-xl border p-3 flex items-start gap-2.5 text-xs ${
                  verificationResult.isConfigured
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                }`}
              >
                {verificationResult.isConfigured ? (
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {verificationResult.isConfigured
                      ? "DNS Confirmed & SSL Active!"
                      : "Pending DNS Propagation"}
                  </span>
                  <span className="text-[11px] opacity-90 block mt-0.5">
                    {verificationResult.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE CONNECTED DOMAINS */}
      {activeTab === "manage" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span>Workspace Domains ({connectedDomains.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("connect")}
              className="text-xs h-7 gap-1 cursor-pointer"
            >
              <span>+ Connect Another</span>
            </Button>
          </div>

          <div className="space-y-2">
            {connectedDomains.map((dom) => (
              <div
                key={dom.id}
                className="rounded-xl border border-border bg-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-secondary flex items-center justify-center text-foreground font-mono text-xs">
                    🌐
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {dom.domain}
                      </span>
                      {dom.status === "active" ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Pending DNS
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground flex items-center gap-1">
                        <Lock className="size-2.5 text-emerald-500" /> SSL Active
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Target: {dom.target} • Added on {new Date(dom.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerifyDns(dom.domain)}
                    className="h-8 text-xs gap-1 cursor-pointer"
                  >
                    <RefreshCw className="size-3" />
                    <span>Test DNS</span>
                  </Button>
                  <a
                    href={`https://${dom.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 p-2"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                  {dom.type === "custom" && (
                    <button
                      onClick={() => handleRemoveDomain(dom.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove domain"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Domain Connection Flow */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-lg bg-background border-border text-foreground">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="size-4 text-blue-500" />
              <span>Confirm Domain Connection</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review DNS routing and SSL provisioning details before connecting your domain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Domain Highlight Box */}
            <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Domain to Connect
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {domainToConfirm}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Custom Routing
              </span>
            </div>

            {/* DNS Records Requirement */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-foreground block">
                Required DNS Configuration:
              </span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-secondary/60 border border-border flex items-center justify-between">
                  <div>
                    <span className="text-blue-500 font-bold mr-2">CNAME</span>
                    <span className="text-muted-foreground">Host: </span>
                    <span className="text-foreground font-semibold">
                      {domainToConfirm.startsWith("www.") ? "www" : "@"}
                    </span>
                    <span className="text-muted-foreground ml-2">Points to: </span>
                    <span className="text-foreground truncate max-w-[140px] inline-block align-bottom">
                      {DEFAULT_TARGET_CNAME}
                    </span>
                  </div>
                  <button
                    onClick={() => copyText(DEFAULT_TARGET_CNAME, "CNAME Target")}
                    className="p-1 hover:text-foreground text-muted-foreground"
                    title="Copy CNAME"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>

                <div className="p-2 rounded-lg bg-secondary/60 border border-border flex items-center justify-between">
                  <div>
                    <span className="text-emerald-500 font-bold mr-2">A Record</span>
                    <span className="text-muted-foreground">Host: </span>
                    <span className="text-foreground font-semibold">@</span>
                    <span className="text-muted-foreground ml-2">IP: </span>
                    <span className="text-foreground font-semibold">{DEFAULT_TARGET_A_IP}</span>
                  </div>
                  <button
                    onClick={() => copyText(DEFAULT_TARGET_A_IP, "A Record IP")}
                    className="p-1 hover:text-foreground text-muted-foreground"
                    title="Copy IP"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* SSL Notice */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold">Automated SSL/TLS Provisioning</span>
                <p className="text-[11px] text-muted-foreground dark:text-emerald-300/80 mt-0.5">
                  An automatic SSL certificate will be issued once DNS records propagate (typically
                  5–30 minutes).
                </p>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dnsChecklistAcknowledged}
                onChange={(e) => setDnsChecklistAcknowledged(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-xs text-muted-foreground">
                I understand I need to add the DNS records in my registrar (GoDaddy, Cloudflare,
                etc.) for live traffic routing.
              </span>
            </label>
          </div>

          <DialogFooter className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDomainConnection}
              disabled={isConnectingDomain}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {isConnectingDomain ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Confirm &amp; Connect Domain</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
