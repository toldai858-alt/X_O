"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChartNoAxesCombined, Globe, Settings2, Sparkles, UsersRound } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { PlayerSymbol } from "@/components/PlayerSymbol";
import { formatNumber } from "@/lib/utils";
import type { GameStats } from "@/types/game";

interface Props { stats: GameStats; ready: boolean; onStart: () => void; onOnline: () => void; onSettings: () => void; onStats: () => void }
export function StartScreen({ stats, ready, onStart, onOnline, onSettings, onStats }: Props) {
  const reduced = useReducedMotion();
  const item = { hidden: { opacity: 0, y: reduced ? 0 : 16 }, show: { opacity: 1, y: 0 } };
  return <motion.section className="start-screen" aria-label="الشاشة الرئيسية" initial="hidden" animate="show" exit={{ opacity: 0 }} variants={{ show: { transition: { staggerChildren: reduced ? 0 : 0.09 } } }}>
    <header className="start-header">
      <div className="brand-mini"><span className="brand-dot" /> مساحة صغيرة. تحدٍّ كبير.</div>
      <IconButton label="الإعدادات" onClick={onSettings} disabled={!ready}><Settings2 size={20} /></IconButton>
    </header>
    <div className="start-main">
      <motion.div variants={item} className="eyebrow"><Sparkles size={13} /> الساحة لكما</motion.div>
      <motion.div variants={item} className="hero-emblem" aria-hidden="true">
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        <div className="hero-mark mark-x"><PlayerSymbol player="X" /></div>
        <div className="hero-mark mark-o"><PlayerSymbol player="O" /></div>
        <span className="orbital-dot" /><span className="emblem-spark">✦</span>
      </motion.div>
      <motion.h1 variants={item}><span>×</span></motion.h1>
      <motion.p variants={item} className="start-subtitle">تحدَّ صديقك في ساحة النيون</motion.p>
      <motion.div variants={item} className="start-actions">
        <button className="button button-primary start-cta" onClick={onStart} disabled={!ready}>ابدأ الجولة <ArrowLeft size={21} /></button>
        <button className="button button-secondary" onClick={onOnline} disabled={!ready}><Globe size={19} /> تحدٍّ عبر الإنترنت</button>
        <button className="button button-secondary" onClick={onStats} disabled={!ready}><ChartNoAxesCombined size={19} /> الإحصاءات</button>
      </motion.div>
      <motion.div variants={item} className="stats-preview" aria-label="ملخص الإحصاءات">
        <div><span className="preview-label"><span className="text-x">×</span> انتصارات</span><strong className="text-x">{formatNumber(stats.wins.X)}</strong></div>
        <div><span className="preview-label">تعادلات</span><strong>{formatNumber(stats.draws)}</strong></div>
        <div><span className="preview-label"><span className="text-o">○</span> انتصارات</span><strong className="text-o">{formatNumber(stats.wins.O)}</strong></div>
      </motion.div>
    </div>
    <motion.footer variants={item} className="start-footer"><UsersRound size={15} /><span>لاعبان · جهاز واحد · أو إنترنت بعيدًا بعيدًا</span></motion.footer>
  </motion.section>;
}
