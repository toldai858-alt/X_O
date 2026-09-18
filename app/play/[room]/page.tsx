import { GameApp } from "@/components/GameApp";

export const dynamic = "force-dynamic";

export default async function PlayRoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  return <GameApp room={room} />;
}