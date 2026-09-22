export interface AgentMemoryItem {
  id: string;
  category: "contact" | "preference" | "task" | "device_credential" | "note";
  key: string;
  value: string;
  timestamp: string;
}

export interface AgentDeviceAction {
  id: string;
  app:
    | "messages"
    | "whatsapp"
    | "flights"
    | "browser"
    | "email"
    | "calendar"
    | "general"
    | "photostudio"
    | "shopping";
  title: string;
  status: "idle" | "in_progress" | "completed" | "requires_payment";
  steps: Array<{
    title: string;
    detail: string;
    done: boolean;
    timestamp: string;
  }>;
  resultSummary?: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any> | undefined;
}

const STORAGE_KEY = "create_your_ai_agent_memory";
const TASKS_KEY = "create_your_ai_agent_tasks";

const DEFAULT_MEMORIES: AgentMemoryItem[] = [
  {
    id: "mem_1",
    category: "contact",
    key: "Alex",
    value: "+1 (555) 019-2834 · Close friend · Prefers WhatsApp or iMessage",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mem_2",
    category: "contact",
    key: "Mom",
    value: "+1 (555) 014-9921 · Family · Prefers Messages",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mem_3",
    category: "preference",
    key: "Flight Preferences",
    value: "Aisle seat, Morning departures, Economy Plus or Business, prefers direct routes",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mem_4",
    category: "preference",
    key: "Payment Policy",
    value: "Autonomous execution allowed for booking & prep. Strict human-gate for final payment.",
    timestamp: new Date().toISOString(),
  },
];

export function getAgentMemories(): AgentMemoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMORIES));
      return DEFAULT_MEMORIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MEMORIES;
  }
}

export function saveAgentMemory(
  category: AgentMemoryItem["category"],
  key: string,
  value: string,
): AgentMemoryItem {
  const list = getAgentMemories();
  const existingIdx = list.findIndex(
    (m) => m.key.toLowerCase() === key.toLowerCase() && m.category === category,
  );
  const item: AgentMemoryItem = {
    id: "mem_" + Math.random().toString(36).slice(2, 9),
    category,
    key,
    value,
    timestamp: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    list[existingIdx] = item;
  } else {
    list.unshift(item);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return item;
}

export function deleteAgentMemory(id: string): void {
  const list = getAgentMemories().filter((m) => m.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getAgentTasks(): AgentDeviceAction[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAgentTask(task: AgentDeviceAction): void {
  const list = getAgentTasks();
  const idx = list.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    list[idx] = task;
  } else {
    list.unshift(task);
  }
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {
    /* ignore */
  }
}
