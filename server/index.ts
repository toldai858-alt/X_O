import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { createMatch, nextMatch, playMove } from "../lib/gameLogic.ts";
import type { ClientMessage, MatchState, Player, ServerMessage } from "../types/game.ts";

const PORT = Number(process.env.PORT || "8080");
const SESSION_TTL_MS = 4 * 60 * 1000;
const MAX_ROOM_AGE_MS = 24 * 60 * 60 * 1000;
const HEARTBEAT_MS = 30 * 1000;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

const DEFAULT_NAMES: Record<Player, string> = { X: "اللاعب ×", O: "اللاعب ○" };
const sanitizeName = (name: unknown): string => (typeof name === "string" && name.trim() ? name.trim().slice(0, 24) : DEFAULT_NAMES.X);
const otherPlayer = (player: Player): Player => (player === "X" ? "O" : "X");

type AliveWebSocket = WebSocket & { alive: boolean };

interface Peer {
  playerId: string;
  name: string;
  ws: WebSocket | null;
}

interface Room {
  code: string;
  createdAt: number;
  lastChanged: number;
  peers: { [K in Player]: Peer | null };
  match: MatchState;
}

interface SocketContext {
  room: Room | null;
  player: Player | null;
  playerId: string;
}

const rooms = new Map<string, Room>();

const generateCode = (): string => {
  let code = "";
  do {
    code = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  } while (rooms.has(code));
  return code;
};

const send = (ws: WebSocket, message: ServerMessage): void => {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
};

const broadcast = (room: Room, message: ServerMessage): void => {
  for (const peer of Object.values(room.peers)) {
    if (peer?.ws?.readyState === WebSocket.OPEN) send(peer.ws, message);
  }
};

const touch = (room: Room): void => {
  room.lastChanged = Date.now();
};

const purge = (): void => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    const everyoneGone = Object.values(room.peers).every(peer => !peer?.ws);
    const expired = now - room.lastChanged > SESSION_TTL_MS;
    const tooOld = now - room.createdAt > MAX_ROOM_AGE_MS;
    if ((everyoneGone && expired) || tooOld) rooms.delete(code);
  }
};

const peersOf = (room: Room): Record<Player, string> => ({ X: room.peers.X?.name ?? DEFAULT_NAMES.X, O: room.peers.O?.name ?? DEFAULT_NAMES.O });

const stateMessage = (room: Room): ServerMessage => ({ t: "state", players: peersOf(room), match: room.match });

const attach = (context: SocketContext, room: Room, player: Player): void => {
  context.room = room;
  context.player = player;
};

const joinSlot = (context: SocketContext, room: Room, player: Player, playerId: string, name: string, ws: WebSocket): void => {
  const peer = room.peers[player];
  if (peer) {
    peer.ws = ws;
    peer.name = name;
    peer.playerId = playerId;
  }
  attach(context, room, player);
  touch(room);
  const bothConnected = room.peers.X?.ws?.readyState === WebSocket.OPEN && room.peers.O?.ws?.readyState === WebSocket.OPEN;
  send(ws, { t: "init", room: room.code, player, players: peersOf(room), match: room.match });
  if (bothConnected) broadcast(room, { t: "ready" });
  broadcast(room, stateMessage(room));
};

const handleMessage = (context: SocketContext, raw: unknown, ws: WebSocket): void => {
  let message: ClientMessage;
  try {
    const parsed = JSON.parse(String(raw)) as Partial<ClientMessage>;
    if (typeof parsed.t !== "string") return;
    message = parsed as ClientMessage;
  } catch {
    return;
  }
  switch (message.t) {
    case "ping":
      send(ws, { t: "pong" });
      return;
    case "create": {
      if (context.room) return;
      const code = generateCode();
      const room: Room = {
        code,
        createdAt: Date.now(),
        lastChanged: Date.now(),
        peers: { X: { playerId: message.playerId, name: sanitizeName(message.name), ws: null }, O: null },
        match: createMatch(),
      };
      rooms.set(code, room);
      joinSlot(context, room, "X", message.playerId, sanitizeName(message.name), ws);
      return;
    }
    case "join": {
      if (context.room) return;
      const code = String(message.room ?? "").toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) {
        send(ws, { t: "error", code: "not-found", message: "الغرفة غير موجودة أو انتهت." });
        return;
      }
      const named = sanitizeName(message.name);
      if (room.peers.X?.playerId === message.playerId) {
        joinSlot(context, room, "X", message.playerId, named, ws);
      } else if (room.peers.O?.playerId === message.playerId) {
        joinSlot(context, room, "O", message.playerId, named, ws);
      } else if (!room.peers.O) {
        room.peers.O = { playerId: message.playerId, name: named, ws: null };
        joinSlot(context, room, "O", message.playerId, named, ws);
      } else {
        send(ws, { t: "error", code: "full", message: "الغرفة ممتلئة." });
      }
      return;
    }
    case "move": {
      const room = context.room;
      const player = context.player;
      if (!room || !player || room.match.currentPlayer !== player) return;
      const updated = playMove(room.match, Number(message.board), Number(message.cell));
      if (!updated) return;
      room.match = updated;
      touch(room);
      broadcast(room, stateMessage(room));
      return;
    }
    case "next": {
      const room = context.room;
      if (!room) return;
      room.match = nextMatch(room.match);
      touch(room);
      broadcast(room, stateMessage(room));
      return;
    }
    case "reset": {
      const room = context.room;
      if (!room) return;
      room.match = createMatch();
      touch(room);
      broadcast(room, stateMessage(room));
      return;
    }
    case "leave": {
      const room = context.room;
      const player = context.player;
      if (!room || !player) return;
      const peer = room.peers[player];
      if (peer) peer.ws = null;
      const partner = room.peers[otherPlayer(player)];
      if (partner?.ws?.readyState === WebSocket.OPEN) send(partner.ws, { t: "partner-left" });
      return;
    }
  }
};

const httpServer = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", ws => {
  const socket = ws as AliveWebSocket;
  socket.alive = true;
  const context: SocketContext = { room: null, player: null, playerId: "" };
  socket.on("pong", () => {
    socket.alive = true;
  });
  socket.on("message", data => handleMessage(context, data.toString(), socket));
  socket.on("close", () => {
    const room = context.room;
    const player = context.player;
    if (!room || !player) return;
    const peer = room.peers[player];
    if (peer) peer.ws = null;
    const partner = room.peers[otherPlayer(player)];
    if (partner?.ws?.readyState === WebSocket.OPEN) send(partner.ws, { t: "partner-left" });
  });
  socket.on("error", () => undefined);
});

setInterval(() => {
  for (const ws of wss.clients) {
    const socket = ws as AliveWebSocket;
    if (!socket.alive) {
      socket.terminate();
      continue;
    }
    socket.alive = false;
    socket.ping();
  }
}, HEARTBEAT_MS);

setInterval(purge, 30 * 1000);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[nuqta-daira] WebSocket server listening on ws://0.0.0.0:${PORT}`);
});