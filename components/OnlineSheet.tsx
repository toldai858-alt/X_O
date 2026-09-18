"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, Link2 } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { createRoom, isValidRoomCode, normalizeRoom } from "@/lib/online";

export function OnlineSheet({ open, name, onClose }: { open: boolean; name: string; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const join = () => {
    const normalized = normalizeRoom(code);
    if (!isValidRoomCode(normalized)) {
      setError("أدخل رمز الغرفة الكامل — خمسة أحرف.");
      inputRef.current?.focus();
      return;
    }
    router.push(`/play/${normalized}`);
  };
  const create = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const room = await createRoom(name);
      router.push(`/play/${room}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذّر إنشاء الغرفة.");
      setBusy(false);
    }
  };
  return <Sheet open={open} title="تحدٍ عبر الإنترنت" titleId="online-title" onClose={onClose}>
    <p className="sheet-description">أنشئ غرفة ومرّر رمزها لصديقك، أو أدخل رمز غرفة صديقك. اللعب لحظي بين الجهازين.</p>
    <div className="sheet-actions">
      <button className="button button-primary" onClick={create} disabled={busy}><Dices size={19} />{busy ? "جارٍ تجهيز الساحة…" : "أنشئ غرفة جديدة"}</button>
      <div className="join-divider"><span>أو انضم برمز الغرفة</span></div>
      <form className="join-form" onSubmit={event => { event.preventDefault(); join(); }}>
        <input ref={inputRef} className="join-input" dir="ltr" value={code} onChange={event => setCode(normalizeRoom(event.target.value))} placeholder="أدخل الرمز" autoComplete="off" inputMode="text" aria-label="رمز الغرفة" />
        <button className="button button-secondary affirm" type="submit"><Link2 size={17} />انضم</button>
      </form>
      {error ? <p className="online-error" role="alert">{error}</p> : null}
    </div>
  </Sheet>;
}