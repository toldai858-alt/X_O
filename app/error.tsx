"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0a0a1a",
        color: "#fff",
        fontFamily: "sans-serif",
        gap: "1rem",
        direction: "rtl",
      }}
    >
      <h2 style={{ fontSize: "1.5rem" }}>حدث خطأ غير متوقع</h2>
      <p style={{ opacity: 0.7 }}>{error.message}</p>
      <button
        onClick={reset}
        style={{
          padding: "0.75rem 2rem",
          background: "#7c3aed",
          color: "#fff",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        حاول مرة أخرى
      </button>
    </div>
  );
}
