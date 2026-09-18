export const getWsUrl = (): string => (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080").replace(/\/+$/, "") || "ws://localhost:8080";
export const isValidRoomCode = (code: string): boolean => {
  const normalized = code.trim().toUpperCase();
  return /^[A-Z2-9]{5}$/.test(normalized);
};
export const normalizeRoom = (code: string): string => code.trim().toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
export const playerKeyFor = (room: string): string => `nuqta-daira:player:${room}`;

const generatePlayerId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export function playerIdFor(room: string): string {
  const key = playerKeyFor(room);
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as unknown;
        if (typeof parsed === "string" && parsed) return parsed;
      } catch { /* fall through to a fresh id */ }
    }
    const fresh = generatePlayerId();
    window.localStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  } catch {
    return generatePlayerId();
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function createRoom(name: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const playerId = generatePlayerId();
    let settled = false;
    const ws = new WebSocket(getWsUrl());
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.close();
      reject(new Error("تعذّر الاتصال. تأكد أن خادم اللعب يعمل."));
    }, 30000);
    ws.onopen = () => ws.send(JSON.stringify({ t: "create", playerId, name }));
    ws.onmessage = (event) => {
      if (settled) return;
      let message: { t?: string; room?: string };
      try { message = JSON.parse(String(event.data)) as typeof message; } catch { return; }
      if (message.t === "init" && message.room) {
        settled = true;
        window.clearTimeout(timeout);
        try { window.localStorage.setItem(playerKeyFor(message.room), JSON.stringify(playerId)); } catch { /* memory-only fallback */ }
        ws.close();
        resolve(message.room);
      }
    };
    ws.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      reject(new Error("تعذّر الاتصال بخادم اللعب."));
    };
  });
}