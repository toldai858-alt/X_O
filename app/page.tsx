"use client";

import dynamic from "next/dynamic";
import { PINGate } from "@/components/PINGate";

const GameApp = dynamic(
  () => import("@/components/GameApp").then((m) => m.GameApp),
  { ssr: false },
);

export default function HomePage() {
  return (
    <PINGate>
      <GameApp />
    </PINGate>
  );
}
