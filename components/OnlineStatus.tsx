"use client";

import { AlertTriangle, Home, Hourglass, RadioTower, WifiOff } from "lucide-react";

export function OnlineGate() {
  return <div className="online-gate" role="status">
    <div className="gate-emblem"><RadioTower size={30} /></div>
    <h3>جارٍ الاتصال بالساحة</h3>
    <p>يتم الآن ربطك بغرفة الخصم…</p>
  </div>;
}

export function OnlineOverlay({ status, errorMessage, onWait, onHome }: { status: "partner-left" | "error" | "ended"; errorMessage?: string; onWait?: () => void; onHome: () => void }) {
  const content = status === "partner-left"
    ? { emblem: <Hourglass size={26} />, title: "غادر الخصم الساحة", message: "تُحفظ مباراتكما هنا قليلًا. يمكنك الانتظار حتى يعود، أو العودة للرئيسية." }
    : status === "ended"
      ? { emblem: <WifiOff size={26} />, title: "انقطع الاتصال", message: "تعذّرت إعادة الاتصال بخادم اللعب. عُد إلى الرئيسية وحاول مجددًا." }
      : { emblem: <AlertTriangle size={26} />, title: "تعذّر الدخول إلى الغرفة", message: errorMessage ?? "الغرفة غير متاحة حاليًا." };
  return <div className="online-overlay" role="alertdialog" aria-label={content.title}>
    <div className="online-overlay-card">
      <div className="confirm-emblem">{content.emblem}</div>
      <h3>{content.title}</h3>
      <p>{content.message}</p>
      <div className="sheet-actions">
        {status === "partner-left" && onWait ? <button className="button button-secondary" onClick={onWait}>الانتظار</button> : null}
        <button className="button button-primary" onClick={onHome}><Home size={18} />العودة للرئيسية</button>
      </div>
    </div>
  </div>;
}