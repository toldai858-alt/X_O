"use client";

import { useEffect, useRef, useState } from "react";
import { usePersistedStats } from "@/hooks/usePersistedStats";
import { getWsUrl, playerIdFor } from "@/lib/online";
import type { ClientMessage, MatchState, Player, ServerMessage } from "@/types/game";

export type OnlineStatus = "connecting" | "waiting" | "ready" | "partner-left" | "error" | "ended";

interface OnlineError {
  code: string;
  message: string;
}

const RECONNECT_DELAYS = [800, 1600, 3200, 6000, 10000];

export function useOnlineGame(room: string | null, name: string) {
  const { stats, ready: statsReady, failed: statsFailed, record, reset: resetStats } = usePersistedStats();
  const [status, setStatus] = useState<OnlineStatus>(room ? "connecting" : "ended");
  const [error, setError] = useState<OnlineError | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [players, setPlayers] = useState<Record<Player, string> | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<OnlineStatus>(status);
  const retryRef = useRef(0);
  const manualCloseRef = useRef(false);
  const previousMatchRef = useRef<MatchState | null>(null);
  const nameRef = useRef(name);
  const roomRef = useRef(room);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  const setStatusBoth = (next: OnlineStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  useEffect(() => {
    const previous = previousMatchRef.current;
    if (!match) return;
    previousMatchRef.current = match;
    if (previous && previous.status === "playing" && match.status !== "playing" && match.round === previous.round) {
      record(match.winner);
    }
  }, [match, record]);

  useEffect(() => {
    if (!room) return;
    const roomCode = room.toUpperCase();
    let cancelled = false;
    let settled = false;
    let timer: number | undefined;
    manualCloseRef.current = false;

    const connect = () => {
      const ws = new WebSocket(getWsUrl());
      socketRef.current = ws;
      ws.onopen = () => {
        if (cancelled) {
          ws.close();
          return;
        }
        ws.send(JSON.stringify({ t: "join", room: roomCode, playerId: playerIdFor(roomCode), name: nameRef.current } satisfies ClientMessage));
      };
      ws.onmessage = (event) => {
        if (cancelled) return;
        let message: ServerMessage;
        try {
          message = JSON.parse(String(event.data)) as ServerMessage;
        } catch {
          return;
        }
        switch (message.t) {
          case "init":
            retryRef.current = 0;
            setPlayer(message.player);
            setPlayers(message.players);
            setMatch(message.match);
            previousMatchRef.current = message.match;
            setStatusBoth("waiting");
            break;
          case "ready":
            setStatusBoth("ready");
            break;
          case "state":
            setPlayers(message.players);
            setMatch(message.match);
            break;
          case "partner-left":
            setStatusBoth("partner-left");
            break;
          case "error":
            settled = true;
            manualCloseRef.current = true;
            setError({ code: message.code, message: message.message });
            setStatusBoth("error");
            ws.close();
            break;
          case "pong":
            break;
        }
      };
      ws.onclose = () => {
        if (socketRef.current === ws) socketRef.current = null;
        if (cancelled || settled || manualCloseRef.current) return;
        if (retryRef.current >= RECONNECT_DELAYS.length) {
          setStatusBoth("ended");
          return;
        }
        setStatusBoth("connecting");
        const delay = RECONNECT_DELAYS[retryRef.current];
        retryRef.current += 1;
        timer = window.setTimeout(connect, delay);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      cancelled = true;
      settled = true;
      if (timer) window.clearTimeout(timer);
      manualCloseRef.current = true;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [room]);

  const send = (message: ClientMessage) => {
    if (roomRef.current === null) return;
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(message));
  };

  const ready = status === "ready";
  const myTurn = ready && !!match && !!player && match.status === "playing" && match.currentPlayer === player;

  const move = (board: number, cell: number) => { if (myTurn) send({ t: "move", board, cell }); };
  const next = () => { if (ready) send({ t: "next" }); };
  const reset = () => { if (ready) send({ t: "reset" }); };
  const leave = () => {
    manualCloseRef.current = true;
    send({ t: "leave" });
    socketRef.current?.close();
    socketRef.current = null;
  };

  return {
    status,
    error,
    player,
    match,
    players,
    stats,
    statsReady,
    statsFailed,
    statsReset: resetStats,
    partnerConnected: ready,
    myTurn,
    move,
    next,
    reset,
    leave,
  };
}