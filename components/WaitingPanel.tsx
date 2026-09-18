"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/online";

export function WaitingPanel({ room }: { room: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);
  const share = async () => {
    if (await copyText(room)) {
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1500);
    }
  };
  return <div className="waiting-panel" role="status">
    <div className="waiting-orbit" aria-hidden="true"><span className="waiting-pulse" /></div>
    <h3>بانتظار الصديق</h3>
    <p>أرسل له هذا الرمز ليدخل الساحة معك.</p>
    <div className="waiting-room">
      <button className="room-chip" onClick={share} aria-label="نسخ رمز الغرفة"><span className="room-chip-code">{room}</span>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
      <button className="button button-secondary" onClick={share}>{copied ? "تم النسخ" : "نسخ الرمز"}</button>
    </div>
  </div>;
}