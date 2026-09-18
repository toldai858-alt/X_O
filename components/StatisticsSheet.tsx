import { ChartNoAxesCombined, Flame, Sparkles, Trash2, Trophy } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { formatNumber, percentage } from "@/lib/utils";
import type { GameSettings, GameStats } from "@/types/game";

export function StatisticsSheet({ open, stats, settings, onClose, onReset }: { open: boolean; stats: GameStats; settings: GameSettings; onClose: () => void; onReset: () => void }) {
  const x = percentage(stats.wins.X, stats.totalRounds);
  const o = percentage(stats.wins.O, stats.totalRounds);
  return <Sheet open={open} title="سجل الساحة" titleId="stats-title" onClose={onClose}>
    <p className="sheet-description">كل جولة تترك أثرًا.</p>
    {stats.totalRounds === 0 ? <div className="empty-stats"><ChartNoAxesCombined size={42} /><h3>الساحة تنتظر أول انتصار</h3><p>أكملا جولتكما الأولى لتبدأ الحكاية هنا.</p></div> : <>
      <div className="total-rounds"><span>الجولات المكتملة</span><strong>{formatNumber(stats.totalRounds)}</strong><Sparkles size={22} /></div>
      <div className="stat-trio"><div><span className="text-x">انتصارات ×</span><strong className="text-x">{formatNumber(stats.wins.X)}</strong></div><div><span>تعادلات</span><strong>{formatNumber(stats.draws)}</strong></div><div><span className="text-o">انتصارات ○</span><strong className="text-o">{formatNumber(stats.wins.O)}</strong></div></div>
      <section className="comparison" aria-label="نسب الانتصارات"><h3>ميزان المنافسة</h3>
        <div className="comparison-labels"><span className="text-x">× <bdi>{settings.names.X}</bdi></span><span className="text-o">○ <bdi>{settings.names.O}</bdi></span></div>
        <div className="comparison-bar" role="img" aria-label={`فوز ×: ${x}%، فوز ○: ${o}%، والباقي تعادلات`}><span className="bar-x" style={{ width: `${stats.wins.X / stats.totalRounds * 100}%` }} /><span className="bar-draw" style={{ width: `${stats.draws / stats.totalRounds * 100}%` }} /><span className="bar-o" style={{ width: `${stats.wins.O / stats.totalRounds * 100}%` }} /></div>
        <div className="comparison-labels"><strong className="text-x">{x}%</strong><span>من إجمالي الجولات</span><strong className="text-o">{o}%</strong></div>
      </section>
      <div className="streak-grid"><div><Flame size={20} /><span>السلسلة الحالية</span><strong>{formatNumber(stats.streak.count)}</strong><small>{stats.streak.player ? settings.names[stats.streak.player] : "بانتظار انتصار جديد"}</small></div><div><Trophy size={20} /><span>أفضل سلسلة</span><strong>{formatNumber(stats.bestStreak.count)}</strong><small>{stats.bestStreak.player ? settings.names[stats.bestStreak.player] : "لم تبدأ بعد"}</small></div></div>
    </>}
    <button className="button button-text danger-text" onClick={onReset} disabled={stats.totalRounds === 0}><Trash2 size={16} /> تصفير الإحصاءات</button>
  </Sheet>;
}
