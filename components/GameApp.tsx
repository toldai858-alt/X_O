"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { Plus, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { ConfirmDialog, type Confirmation } from "@/components/ConfirmDialog";
import { GameBoard } from "@/components/GameBoard";
import { GameHeader } from "@/components/GameHeader";
import { IconButton } from "@/components/IconButton";
import { NeonBackground } from "@/components/NeonBackground";
import { OnlineGate, OnlineOverlay } from "@/components/OnlineStatus";
import { OnlineSheet } from "@/components/OnlineSheet";
import { PlayerCard } from "@/components/PlayerCard";
import { ResultModal } from "@/components/ResultModal";
import { SettingsSheet } from "@/components/SettingsSheet";
import { StartScreen } from "@/components/StartScreen";
import { StatisticsSheet } from "@/components/StatisticsSheet";
import { WaitingPanel } from "@/components/WaitingPanel";
import { useGame } from "@/hooks/useGame";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { useSound } from "@/hooks/useSound";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "@/lib/constants";
import { gameReducer, isMatchEmpty } from "@/lib/gameLogic";
import { parseSettings } from "@/lib/storage";
import { formatNumber } from "@/lib/utils";
import type { GameStatus } from "@/types/game";

export function GameApp({ room }: { room?: string }) {
  const router = useRouter();
  const online = room !== undefined;
  const { state, dispatch, ready: gameReady, storageFailed: localStatsFailed } = useGame();
  const { value: settings, setValue: setSettings, ready: settingsReady, failed } = useLocalStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS, parseSettings);
  const onlineGame = useOnlineGame(online ? room : null, settings.names.X.trim() || DEFAULT_SETTINGS.names.X);
  const [sheet, setSheet] = useState<"settings" | "stats" | "online" | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [partnerLeftDismissed, setPartnerLeftDismissed] = useState(false);
  const reduced = useReducedMotion();
  const sound = useSound(settings.sound);
  const haptic = useHapticFeedback(settings.haptics);

  const localNames = { X: settings.names.X.trim() || DEFAULT_SETTINGS.names.X, O: settings.names.O.trim() || DEFAULT_SETTINGS.names.O };
  const names = online ? onlineGame.players ?? localNames : localNames;
  const match = online ? onlineGame.match ?? state.match : state.match;
  const stats = online ? onlineGame.stats : state.stats;
  const storageFailed = (online ? onlineGame.statsFailed : localStatsFailed) || failed;
  const ready = online ? settingsReady : gameReady && settingsReady;
  const onlineStatus = online ? onlineGame.status : null;
  const inProgress = !!match && match.status === "playing" && !isMatchEmpty(match);
  const matchStarted = !!match && (match.boards.some(mini => mini.cells.some(Boolean)) || match.round > 1);

  useEffect(() => {
    if (!match || match.status === "playing") return;
    const timer = window.setTimeout(() => setResultVisible(true), reduced ? 80 : 780);
    return () => window.clearTimeout(timer);
  }, [match, reduced]);

  const onlinePrevRef = useRef<GameStatus | null>(null);
  const onlinePrevRoundRef = useRef(0);
  useEffect(() => {
    if (!online || !match) return;
    const previous = onlinePrevRef.current;
    if (previous === "playing" && match.status !== "playing" && match.round === onlinePrevRoundRef.current) {
      sound(match.status === "won" ? "win" : "draw");
      haptic(match.status === "won");
    }
    onlinePrevRef.current = match.status;
    onlinePrevRoundRef.current = match.round;
  }, [online, match, sound, haptic]);

  const next = () => {
    setResultVisible(false);
    if (online) onlineGame.next();
    else { dispatch({ type: "next" }); sound("start"); }
  };
  const reset = () => {
    const action = () => {
      setResultVisible(false);
      if (online) onlineGame.reset();
      else { dispatch({ type: "reset-match" }); sound("start"); }
    };
    if (matchStarted) setConfirmation({ title: "نبدأ مباراة جديدة؟", message: "ستُصفَّر نتائج المباراة الحالية. تبقى الإنجازات في الإحصاءات محفوظة.", action: "إعادة المباراة", onConfirm: action });
    else action();
  };
  const leave = () => {
    const action = () => {
      setResultVisible(false);
      if (online) { onlineGame.leave(); router.push("/"); }
      else dispatch({ type: "leave" });
    };
    if (inProgress) setConfirmation({ title: online ? "تغادر الساحة؟" : "تغادران الساحة؟", message: online ? "ستترك الغرفة ويبقى الرابط صالحًا لدقائق حتى يتمكّن الخصم أو أنت من العودة." : "ستنتهي المباراة ولن تُحتسب الجولة غير المكتملة. تبقى الإحصاءات السابقة محفوظة.", action: "العودة للرئيسية", onConfirm: action });
    else action();
  };
  const select = (board: number, cell: number) => {
    if (online) {
      if (onlineGame.myTurn) { onlineGame.move(board, cell); sound("move"); }
      return;
    }
    const updated = gameReducer(state, { type: "move", board, cell });
    if (updated === state) return;
    dispatch({ type: "move", board, cell });
    sound(updated.match.status === "won" ? "win" : updated.match.status === "draw" ? "draw" : "move");
    haptic(updated.match.status === "won");
  };
  const statusText = !match
    ? ""
    : online && onlineStatus === "partner-left"
      ? "غادر الخصم الساحة — يمكنك الانتظار ليعود."
      : match.status === "won" && match.winner
        ? `الفوز من نصيب ${names[match.winner]}`
        : match.status === "draw"
          ? "تعادل ذكي — كل اللوحات محسومة"
          : match.activeBoard !== null
            ? `دور ${names[match.currentPlayer]} — داخل اللوحة ${formatNumber(match.activeBoard + 1)}`
            : `دور ${names[match.currentPlayer]} — اختر لوحة`;
  const overlay: "partner-left" | "error" | "ended" | null = !online
    ? null
    : onlineStatus === "partner-left" && !partnerLeftDismissed
      ? "partner-left"
      : onlineStatus === "error"
        ? "error"
        : onlineStatus === "ended"
          ? "ended"
          : null;
  return <MotionConfig reducedMotion="user"><main className="app-shell" data-theme={settings.theme}>
    <NeonBackground />
    <AnimatePresence mode="wait" initial={false}>
      {!online && state.screen === "start" ? <StartScreen key="start" stats={stats} ready={ready} onStart={() => { dispatch({ type: "start" }); sound("start"); }} onOnline={() => setSheet("online")} onSettings={() => setSheet("settings")} onStats={() => setSheet("stats")} /> : <motion.section key={online ? `online-${room}` : "game"} className="game-screen" aria-label={online ? "ساحة اللعب عبر الإنترنت" : "ساحة اللعب"} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <GameHeader round={match?.round ?? 1} onBack={leave} onSettings={() => setSheet("settings")} onlineRoom={online ? room : undefined} />
        <div className="match-content">
          {match ? <><div className="players-row"><PlayerCard player="X" name={names.X} wins={match.scores.X} active={match.status === "playing" && match.currentPlayer === "X"} /><span className="versus" aria-hidden="true">×<span>ضد</span>○</span><PlayerCard player="O" name={names.O} wins={match.scores.O} active={match.status === "playing" && match.currentPlayer === "O"} /></div>
            <div className="turn-status" data-player={match.winner ?? match.currentPlayer} role="status" aria-live="polite" aria-atomic="true"><span className={match.status === "draw" ? "status-dot status-draw" : "status-dot"} />{statusText}</div>
            {online && onlineStatus === "waiting" ? <WaitingPanel room={room!} /> : <GameBoard match={match} onSelect={select} disabled={online && !onlineGame.myTurn} />}
            <p className="board-caption">{match.status === "playing" ? "احسم ثلاث لوحات على خط واحد. كل حركة تحدد اللوحة التالية." : "جولة انتهت، وتحدٍّ جديد ينتظركما."}</p>
            <div className="game-controls"><button className="button button-primary" onClick={() => { if (inProgress) setConfirmation({ title: "نبدأ الجولة من جديد؟", message: "ستُلغى حركات هذه الجولة دون احتساب نتيجة. يبقى اللاعب الذي بدأها أولًا.", action: "جولة جديدة", onConfirm: next }); else next(); }}><Plus size={20} /> جولة جديدة</button><IconButton label={settings.sound ? "كتم الصوت" : "تشغيل الصوت"} aria-pressed={settings.sound} onClick={() => setSettings({ ...settings, sound: !settings.sound })}>{settings.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</IconButton></div>
            <button className="button button-text reset-match" onClick={reset}><RotateCcw size={15} /> إعادة المباراة</button>
          </> : <OnlineGate />}
        </div>
        <footer className="game-footer"><span className="brand-dot" /> لحظة تركيز. حركة تصنع الفرق.</footer>
      </motion.section>}
    </AnimatePresence>
    {storageFailed ? <p className="storage-notice" role="status">الحفظ غير متاح على هذا الجهاز. يمكنكما متابعة اللعب.</p> : null}
    {overlay ? <OnlineOverlay status={overlay} errorMessage={onlineGame.error?.message} onWait={() => setPartnerLeftDismissed(true)} onHome={() => { if (online) { onlineGame.leave(); router.push("/"); } else dispatch({ type: "leave" }); }} /> : null}
    <ResultModal open={!!match && match.status !== "playing" && resultVisible && sheet === null} winner={match?.winner ?? null} name={match?.winner ? names[match.winner] : ""} round={match?.round ?? 1} onClose={() => setResultVisible(false)} onNext={next} onReset={reset} />
    <OnlineSheet key={sheet === "online" ? "online-open" : "online-closed"} open={sheet === "online"} name={settings.names.X.trim() || DEFAULT_SETTINGS.names.X} onClose={() => setSheet(null)} />
    <SettingsSheet open={sheet === "settings"} settings={settings} onChange={setSettings} onClose={() => setSheet(null)} onReset={() => setConfirmation({ title: "استعادة الإعدادات؟", message: "ستعود أسماء اللاعبين والصوت والاهتزاز والألوان إلى إعداداتها الأصلية.", action: "استعادة الافتراضي", onConfirm: () => setSettings(DEFAULT_SETTINGS) })} />
    <StatisticsSheet open={sheet === "stats"} stats={stats} settings={{ ...settings, names }} onClose={() => setSheet(null)} onReset={() => setConfirmation({ title: "تصفير سجل الساحة؟", message: "ستُحذف جميع الإحصاءات وسلاسل الانتصارات المحفوظة على هذا الجهاز. لا يمكن التراجع عن الحذف.", action: "تصفير الإحصاءات", onConfirm: () => { if (online) onlineGame.statsReset(); else dispatch({ type: "reset-stats" }); } })} />
    <ConfirmDialog confirmation={confirmation} onClose={() => setConfirmation(null)} />
  </main></MotionConfig>;
}