"use client";

import { useState, useRef, useEffect } from "react";

const PIN_LENGTH = 4;
const CORRECT_PIN = process.env.NEXT_PUBLIC_PIN ?? "1234";

export function PINGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError(false);

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "") && next.join("") === CORRECT_PIN) {
      setAuthorized(true);
    } else if (next.every((d) => d !== "") && next.join("") !== CORRECT_PIN) {
      setError(true);
      setTimeout(() => {
        setDigits(Array(PIN_LENGTH).fill(""));
        setError(false);
        inputRefs.current[0]?.focus();
      }, 600);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError(false);

    if (next.every((d) => d !== "") && next.join("") === CORRECT_PIN) {
      setAuthorized(true);
    } else if (next.every((d) => d !== "")) {
      setError(true);
      setTimeout(() => {
        setDigits(Array(PIN_LENGTH).fill(""));
        setError(false);
        inputRefs.current[0]?.focus();
      }, 600);
    } else {
      inputRefs.current[Math.min(pasted.length, PIN_LENGTH - 1)]?.focus();
    }
  }

  if (authorized) return <>{children}</>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100svh",
        background: "#070812",
        color: "#f4f5ff",
        fontFamily: "Cairo, Tajawal, system-ui, sans-serif",
        gap: "2rem",
        direction: "rtl",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #35dfff, #8054ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
          }}
        >
          ×  ○
        </div>
        <p style={{ color: "#a5aac5", fontSize: "0.95rem" }}>أدخل رمز الدخول</p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          direction: "ltr",
        }}
        onPaste={handlePaste}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            style={{
              width: "60px",
              height: "72px",
              textAlign: "center",
              fontSize: "1.75rem",
              fontWeight: 700,
              borderRadius: "16px",
              border: `2px solid ${error ? "#ff4d6a" : "#ffffff14"}`,
              background: error ? "#ff4d6a12" : "#ffffff06",
              color: "#f4f5ff",
              outline: "none",
              transition: "border-color .2s, background .2s, transform .15s",
              caretColor: "#8054ff",
            }}
            onFocus={(e) => {
              if (!error) e.currentTarget.style.borderColor = "#8054ff";
            }}
            onBlur={(e) => {
              if (!error) e.currentTarget.style.borderColor = "#ffffff14";
            }}
          />
        ))}
      </div>

      {error && (
        <p style={{ color: "#ff4d6a", fontSize: "0.85rem", marginTop: "-0.5rem" }}>
          رمز خاطئ
        </p>
      )}
    </div>
  );
}
