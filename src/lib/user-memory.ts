/**
 * Creative AI - Persistent User Memory & Knowledge Context System
 * Stores and analyzes user preferences, history, and conversation context across
 * both the AI Chatbot and Voice Assistant.
 * Synchronizes with user account and localStorage so that even in new chats or new tabs,
 * the AI seamlessly remembers past topics without explicitly cluttering the chat view.
 */

export interface UserMemoryFact {
  id: string;
  fact: string;
  category: "preference" | "topic" | "project" | "personal" | "workflow";
  timestamp: string;
}

export interface UserMemoryProfile {
  userId: string;
  username?: string;
  email?: string;
  facts: UserMemoryFact[];
  recentTopics: string[];
  lastSpokenWithVoice?: string;
  lastChattedWithBot?: string;
  summary: string;
  updatedAt: string;
}

const MEMORY_STORAGE_PREFIX = "creative_ai_memory_";

export function getMemoryKey(userId?: string | null): string {
  if (!userId || userId.trim() === "") return `${MEMORY_STORAGE_PREFIX}global_guest`;
  return `${MEMORY_STORAGE_PREFIX}${userId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/**
 * Retrieve the current stored memory profile for a user
 */
export function getUserMemory(userId?: string | null): UserMemoryProfile {
  const key = getMemoryKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as UserMemoryProfile;
      if (parsed && Array.isArray(parsed.facts)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to read user memory:", e);
  }

  return {
    userId: userId || "guest",
    facts: [],
    recentTopics: [],
    summary: "",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Save user memory profile
 */
export function saveUserMemory(profile: UserMemoryProfile): void {
  const key = getMemoryKey(profile.userId);
  try {
    profile.updatedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(profile));
  } catch (e) {
    console.warn("Failed to persist user memory:", e);
  }
}

/**
 * Extract key topics and facts from a conversation turn
 */
function extractKnowledge(
  userText: string,
  assistantText: string,
): { topics: string[]; facts: string[] } {
  const lowerUser = userText.toLowerCase();
  const topics: string[] = [];
  const facts: string[] = [];

  // Detect project or work topics
  const projectMatches = userText.match(
    /(?:building|working on|creating|developing|coding|designing|making)\s+(?:a|an|the|my)?\s+([a-zA-Z0-9\s-]{3,35})(?:\b|\.|,)/i,
  );
  if (projectMatches && projectMatches[1]) {
    const proj = projectMatches[1].trim();
    if (!["something", "an app", "a project", "this", "it"].includes(proj.toLowerCase())) {
      topics.push(`Project: ${proj}`);
      facts.push(`User is working on or interested in: ${proj}`);
    }
  }

  // Detect preferences (languages, frameworks, tools)
  const techKeywords = [
    "react",
    "vue",
    "angular",
    "next.js",
    "typescript",
    "python",
    "tailwind",
    "flask",
    "django",
    "fastapi",
    "sql",
    "supabase",
    "docker",
    "rust",
    "c++",
    "go",
    "canva",
    "figma",
    "presentation",
  ];
  for (const tech of techKeywords) {
    if (lowerUser.includes(tech)) {
      topics.push(tech.toUpperCase());
    }
  }

  // Detect user personal attributes or preferences
  const prefMatches = userText.match(
    /(?:i like|i prefer|i want|i love|my name is|i am a|i'm a)\s+([a-zA-Z0-9\s-]{3,40})/i,
  );
  if (prefMatches && prefMatches[1]) {
    facts.push(`User statement: "${prefMatches[0].trim()}"`);
  }

  // If conversation turn is substantial, capture a short summary
  if (userText.length > 15) {
    const cleanTurnSummary = userText.length > 70 ? userText.slice(0, 67) + "..." : userText;
    topics.push(cleanTurnSummary);
  }

  return { topics, facts };
}

/**
 * Record a conversation turn from either the Chatbot or Voice Assistant.
 * Keeps memory compact, deduplicated, and up to date.
 */
export function recordConversationTurnToMemory(
  userText: string,
  assistantText: string,
  source: "chat" | "voice",
  userId?: string | null,
): void {
  if (!userText || userText.trim().length < 4) return;

  const profile = getUserMemory(userId);
  const { topics, facts } = extractKnowledge(userText, assistantText);

  // Update timestamps
  if (source === "voice") {
    profile.lastSpokenWithVoice = new Date().toISOString();
  } else {
    profile.lastChattedWithBot = new Date().toISOString();
  }

  // Add new facts (limit to 25 unique facts)
  for (const factText of facts) {
    if (!profile.facts.some((f) => f.fact.toLowerCase() === factText.toLowerCase())) {
      profile.facts.push({
        id: `fact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fact: factText,
        category: factText.includes("User statement") ? "preference" : "project",
        timestamp: new Date().toISOString(),
      });
    }
  }
  if (profile.facts.length > 25) {
    profile.facts = profile.facts.slice(-25);
  }

  // Add recent topics (limit to 15 unique items)
  for (const t of topics) {
    if (!profile.recentTopics.includes(t)) {
      profile.recentTopics.unshift(t);
    }
  }
  if (profile.recentTopics.length > 15) {
    profile.recentTopics = profile.recentTopics.slice(0, 15);
  }

  // Synthesize compact summary
  const topicList = profile.recentTopics.slice(0, 8).join(", ");
  const factList = profile.facts
    .slice(-5)
    .map((f) => f.fact)
    .join("; ");
  profile.summary = `Recent topics: [${topicList}]. Known details: [${factList}].`;

  saveUserMemory(profile);
}

/**
 * Formats user memory into a silent background prompt block for the AI.
 * This is hidden from the user's UI bubbles, but guides the AI's understanding.
 */
export function getMemoryPromptContext(userId?: string | null): string {
  const profile = getUserMemory(userId);

  if (profile.facts.length === 0 && profile.recentTopics.length === 0) {
    return "";
  }

  const factsStr = profile.facts
    .slice(-8)
    .map((f) => `- ${f.fact}`)
    .join("\n");

  const topicsStr = profile.recentTopics.slice(0, 8).join(", ");

  return `
[PERSISTENT USER MEMORY & BACKGROUND CONTEXT]
The following information is remembered from previous interactions with this user across both the Voice Assistant and Chatbot:
- Recent discussion topics: ${topicsStr || "General software & creative inquiry"}
${factsStr ? `- Known User Facts & Preferences:\n${factsStr}` : ""}

GUIDELINES FOR USING THIS MEMORY:
1. DO NOT explicitly mention "I checked my memory database" or "According to my records" unless the user specifically asks "Do you remember me?" or "What did we talk about earlier?".
2. If the user asks a question referring to a previous topic (e.g. "remember my app", "what did we decide", "can you improve the code we wrote"), use this context seamlessly to answer accurately.
3. If the user introduces a NEW topic (e.g. "What is the speed of light?"), answer the new topic directly and naturally without awkwardly forcing old topics into it.
4. Keep responses helpful, tailored, and intelligent.
`;
}
