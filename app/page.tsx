"use client";

import dynamic from "next/dynamic";

const GameApp = dynamic(
  () => import("@/components/GameApp").then((m) => m.GameApp),
  { ssr: false },
);

export default function HomePage() {
  return <GameApp />;
}
