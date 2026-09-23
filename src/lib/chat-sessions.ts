import { notifyUnifiedHistoryUpdated } from "./unified-history";

export type ChatMediaImage = {
  title: string;
  url: string;
  source?: string | undefined;
};

export type ChatMediaVideo = {
  title: string;
  url: string;
  videoId: string;
  thumbnail: string;
};

export type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null | undefined;
  imageUrls?: string[] | undefined;
  images?: ChatMediaImage[] | undefined;
  videos?: ChatMediaVideo[] | undefined;
  sources?: Array<{ title: string; url: string }> | undefined;
  grounded?: boolean | undefined;
  rating?: 1 | -1 | null | undefined;
};

export type ChatSession = {
  id: string;
  title: string;
  mode: "chat" | "research" | "coding" | "presentations" | "build" | "voice" | "agent";
  createdAt: number;
  updatedAt: number;
  messages: ChatMsg[];
};

const STORAGE_KEY = "creative_ai_chat_sessions_v2";
const EVENT_NAME = "creative_ai_sessions_updated";

function uid() {
  return "session_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now().toString(36);
}

export function generateTitleFromPrompt(prompt: string): string {
  if (!prompt) return "New Conversation";
  const clean = prompt
    .replace(/^(can you|please|tell me|explain|how to|write|code|create|draw|make|show me)\s+/i, "")
    .trim();
  const firstLine = clean.split("\n")[0] || clean;
  if (firstLine.length <= 40) {
    return firstLine.charAt(0).toUpperCase() + firstLine.slice(1);
  }
  return firstLine.slice(0, 37).trim() + "…";
}

export function getAllSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.error("Failed to read chat sessions:", err);
    return [];
  }
}

export function getSessionsByMode(mode?: string): ChatSession[] {
  const all = getAllSessions();
  if (!mode) return all;
  return all.filter((s) => s.mode === mode);
}

export function getSessionById(id: string): ChatSession | null {
  const all = getAllSessions();
  return all.find((s) => s.id === id) || null;
}

function persistAll(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
    notifyUnifiedHistoryUpdated();
  } catch (err) {
    console.error("Failed to save chat sessions:", err);
  }
}

export function saveSession(session: ChatSession): void {
  const all = getAllSessions();
  const index = all.findIndex((s) => s.id === session.id);
  const updated = {
    ...session,
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }

  // Keep up to 100 recent sessions to prevent unbounded local storage growth
  const pruned = all.slice(0, 100);
  persistAll(pruned);
}

export function createNewSession(mode: ChatSession["mode"], initialTitle?: string): ChatSession {
  const newSession: ChatSession = {
    id: uid(),
    title: initialTitle || "New Conversation",
    mode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
  saveSession(newSession);
  return newSession;
}

export function deleteSession(id: string): void {
  const all = getAllSessions().filter((s) => s.id !== id);
  persistAll(all);
}

export function renameSession(id: string, newTitle: string): void {
  const all = getAllSessions();
  const session = all.find((s) => s.id === id);
  if (session) {
    session.title = newTitle.trim() || "Untitled Session";
    session.updatedAt = Date.now();
    persistAll(all);
  }
}

export function clearSessionsByMode(mode?: string): void {
  if (!mode) {
    persistAll([]);
    return;
  }
  const remaining = getAllSessions().filter((s) => s.mode !== mode);
  persistAll(remaining);
}

export function subscribeSessions(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
