import { Check, RotateCcw, Smartphone, Volume2 } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { DEFAULT_SETTINGS, THEMES } from "@/lib/constants";
import type { GameSettings, Player } from "@/types/game";

interface Props { open: boolean; settings: GameSettings; onChange: (settings: GameSettings) => void; onClose: () => void; onReset: () => void }
export function SettingsSheet({ open, settings, onChange, onClose, onReset }: Props) {
  const changeName = (player: Player, name: string) => onChange({ ...settings, names: { ...settings.names, [player]: name } });
  return <Sheet open={open} title="على ذوقكما" titleId="settings-title" onClose={onClose}>
    <p className="sheet-description">أسماءكما، ألوانكما، أجواؤكما.</p>
    <fieldset className="settings-section"><legend>اللاعبان</legend><div className="name-fields">
      {(["X", "O"] as const).map(player => <label key={player} className={`name-field text-${player.toLowerCase()}`}><span>اسم اللاعب {player === "X" ? "×" : "○"}</span><input aria-label={`اسم اللاعب ${player === "X" ? "×" : "○"}`} value={settings.names[player]} maxLength={24} onChange={event => changeName(player, event.target.value)} onBlur={() => changeName(player, settings.names[player].trim() || DEFAULT_SETTINGS.names[player])} autoComplete="off" dir="auto" /></label>)}
    </div></fieldset>
    <div className="settings-section">
      <div className="toggle-row"><span><Volume2 size={19} /><span>المؤثرات الصوتية<small>نغمات خفيفة مع كل حركة</small></span></span><button type="button" className="toggle" role="switch" aria-label="المؤثرات الصوتية" aria-checked={settings.sound} onClick={() => onChange({ ...settings, sound: !settings.sound })}><span /></button></div>
      <div className="toggle-row"><span><Smartphone size={19} /><span>الاهتزاز<small>لمسة تفاعلية على الأجهزة الداعمة</small></span></span><button type="button" className="toggle" role="switch" aria-label="الاهتزاز" aria-checked={settings.haptics} onClick={() => onChange({ ...settings, haptics: !settings.haptics })}><span /></button></div>
    </div>
    <fieldset className="settings-section"><legend>اختر أجواء الساحة</legend><div className="theme-options">{THEMES.map(theme => <label key={theme.id} className={`theme-option theme-preview-${theme.id} ${settings.theme === theme.id ? "theme-selected" : ""}`}><input type="radio" name="theme" value={theme.id} checked={settings.theme === theme.id} onChange={() => onChange({ ...settings, theme: theme.id })} /><span className="theme-swatch" aria-hidden="true"><i /><i />{settings.theme === theme.id ? <Check size={17} /> : null}</span><span>{theme.name}</span></label>)}</div></fieldset>
    <p className="save-note">تُطبَّق التغييرات وتُحفظ تلقائيًا على جهازك.</p>
    <button className="button button-text" onClick={onReset}><RotateCcw size={16} /> إعادة الإعدادات الافتراضية</button>
  </Sheet>;
}
