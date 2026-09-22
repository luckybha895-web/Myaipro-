/**
 * Creative AI Unified History Service
 * Aggregates all activity from Presentation Maker, Voice Assistant, AI Chatbot, and My AI Builder
 * into a single unified chronological history stream.
 */

export type HistoryToolType = "presentation" | "voice" | "chat" | "build";

export interface UnifiedHistoryItem {
  id: string;
  tool: HistoryToolType;
  title: string;
  timestamp: string;
  url: string;
  preview?: string;
  badge: string;
}

export const UNIFIED_HISTORY_EVENT = "creative_ai_unified_history_updated";

export function notifyUnifiedHistoryUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNIFIED_HISTORY_EVENT));
  }
}

/**
 * Retrieve aggregated, unified history from all 4 creative tools:
 * - Presentation Maker
 * - Voice Assistant
 * - AI Chatbot
 * - My AI Builder
 */
export function getUnifiedHistory(): UnifiedHistoryItem[] {
  if (typeof window === "undefined") return [];

  const items: UnifiedHistoryItem[] = [];

  // 1. PRESENTATION MAKER HISTORY
  try {
    const rawPres = localStorage.getItem("creative_ai_saved_presentations");
    if (rawPres) {
      const presList = JSON.parse(rawPres) as Array<{
        id: string;
        title?: string;
        topic?: string;
        updatedAt?: string;
        slides?: Array<{ title?: string }>;
      }>;
      for (const p of presList) {
        if (!p || !p.id) continue;
        const displayTitle = p.title || p.topic || "Presentation Deck";
        const slideCount = Array.isArray(p.slides) ? p.slides.length : 0;
        items.push({
          id: p.id,
          tool: "presentation",
          title: displayTitle,
          timestamp: p.updatedAt || new Date().toISOString(),
          url: `/app/presentations?topic=${encodeURIComponent(p.topic || displayTitle)}`,
          preview: slideCount > 0 ? `${slideCount} slides` : "Slide deck",
          badge: "Presentation",
        });
      }
    }
  } catch (err) {
    console.warn("Failed reading presentation history:", err);
  }

  // 2. MY AI BUILDER PROJECTS
  try {
    const rawProjects = localStorage.getItem("creative_ai_local_projects");
    if (rawProjects) {
      const parsed = JSON.parse(rawProjects) as Record<
        string,
        { id: string; title: string; created_at?: string; prompt?: string }
      >;
      for (const proj of Object.values(parsed)) {
        if (!proj || !proj.id) continue;
        items.push({
          id: proj.id,
          tool: "build",
          title: proj.title || "Web Application",
          timestamp: proj.created_at || new Date().toISOString(),
          url: `/app/project/${proj.id}`,
          preview: proj.prompt ? proj.prompt.slice(0, 40) : "Builder project",
          badge: "My AI Builder",
        });
      }
    }
  } catch (err) {
    console.warn("Failed reading builder projects:", err);
  }

  // 3. AI CHATBOT SESSIONS
  try {
    const rawChat = localStorage.getItem("creative_ai_chat_sessions_v2");
    if (rawChat) {
      const chatSessions = JSON.parse(rawChat) as Array<{
        id: string;
        title: string;
        mode?: string;
        updatedAt?: string;
        createdAt?: string;
        messages?: Array<{ content?: unknown }>;
      }>;
      for (const s of chatSessions) {
        if (!s || !s.id) continue;
        if (s.mode === "voice") {
          // Add to Voice tool items
          items.push({
            id: s.id,
            tool: "voice",
            title: s.title || "Voice Conversation",
            timestamp: s.updatedAt || s.createdAt || new Date().toISOString(),
            url: `/app/voice`,
            preview: "Voice session",
            badge: "Voice Assistant",
          });
        } else {
          items.push({
            id: s.id,
            tool: "chat",
            title: s.title || "AI Conversation",
            timestamp: s.updatedAt || s.createdAt || new Date().toISOString(),
            url: `/app/chat?session=${s.id}`,
            preview: s.mode ? `${s.mode} session` : "Chat history",
            badge: "AI Chatbot",
          });
        }
      }
    }
  } catch (err) {
    console.warn("Failed reading chatbot sessions:", err);
  }

  // 4. VOICE ASSISTANT TURNS (if stored standalone)
  try {
    const rawVoice = localStorage.getItem("creative_ai_voice_turns");
    if (rawVoice) {
      const voiceTurns = JSON.parse(rawVoice) as Array<{
        id?: string;
        userSpeech?: string;
        aiResponse?: string;
        timestamp?: number;
      }>;
      if (voiceTurns.length > 0) {
        // Group recent voice activity if not already present from sessions
        const latestTurn = voiceTurns[voiceTurns.length - 1];
        const existingVoice = items.find((it) => it.tool === "voice");
        if (!existingVoice && latestTurn) {
          items.push({
            id: "voice-turns-latest",
            tool: "voice",
            title: latestTurn.userSpeech
              ? `"${latestTurn.userSpeech.slice(0, 30)}..."`
              : "Voice Conversation",
            timestamp: latestTurn.timestamp
              ? new Date(latestTurn.timestamp).toISOString()
              : new Date().toISOString(),
            url: `/app/voice`,
            preview: `${voiceTurns.length} voice turns`,
            badge: "Voice Assistant",
          });
        }
      }
    }
  } catch (err) {
    console.warn("Failed reading voice turns:", err);
  }

  // Sort descending by timestamp (newest first)
  return items.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return timeB - timeA;
  });
}

/**
 * Delete an individual unified history item across whichever subsystem owns it.
 */
export function deleteUnifiedHistoryItem(item: UnifiedHistoryItem): boolean {
  if (typeof window === "undefined" || !item) return false;

  try {
    if (item.tool === "presentation") {
      const raw = localStorage.getItem("creative_ai_saved_presentations");
      if (raw) {
        const list = JSON.parse(raw) as Array<{ id: string }>;
        const updated = list.filter((p) => p.id !== item.id);
        localStorage.setItem("creative_ai_saved_presentations", JSON.stringify(updated));
      }
    } else if (item.tool === "build") {
      const raw = localStorage.getItem("creative_ai_local_projects");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        delete parsed[item.id];
        localStorage.setItem("creative_ai_local_projects", JSON.stringify(parsed));
      }
    } else if (item.tool === "chat" || item.tool === "voice") {
      const raw = localStorage.getItem("creative_ai_chat_sessions_v2");
      if (raw) {
        const list = JSON.parse(raw) as Array<{ id: string }>;
        const updated = list.filter((s) => s.id !== item.id);
        localStorage.setItem("creative_ai_chat_sessions_v2", JSON.stringify(updated));
      }
      if (item.id === "voice-turns-latest") {
        localStorage.removeItem("creative_ai_voice_turns");
      }
    }

    notifyUnifiedHistoryUpdated();
    return true;
  } catch (err) {
    console.error("Failed deleting unified history item:", err);
    return false;
  }
}

/**
 * Clear all unified history across all 4 tools.
 */
export function clearAllUnifiedHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("creative_ai_saved_presentations");
    localStorage.removeItem("creative_ai_local_projects");
    localStorage.removeItem("creative_ai_chat_sessions_v2");
    localStorage.removeItem("creative_ai_voice_turns");
    notifyUnifiedHistoryUpdated();
  } catch (err) {
    console.error("Failed clearing unified history:", err);
  }
}
