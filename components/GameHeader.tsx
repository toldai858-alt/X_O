"use client";

import { ArrowRight, Check, Copy, Settings2 } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { formatNumber } from "@/lib/utils";
import { copyText } from "@/lib/online";
import { useEffect, useRef, useState } from "react";

export function GameHeader({ round, onBack, onSettings, onlineRoom }: { round: number; onBack: () => void; onSettings: () => void; onlineRoom?: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);
  const share = async () => {
    if (!onlineRoom) return;
    if (await copyText(onlineRoom)) {
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1500);
    }
  };
  return <header className="game-header">
    <IconButton label="العودة للرئيسية" onClick={onBack}><ArrowRight size={21} /></IconButton>
    <div>
      <span className="round-label">الجولة <b>{formatNumber(round).padStart(2, "0")}</b></span>
      {onlineRoom ? <button className="room-chip room-chip-sm" onClick={share} aria-label="نسخ رمز الغرفة"><span className="room-chip-code">{onlineRoom}</span>{copied ? <Check size={13} /> : <Copy size={13} />}</button> : null}
    </div>
    <IconButton label="الإعدادات" onClick={onSettings}><Settings2 size={20} /></IconButton>
  </header>;
}