import { useEffect, useState } from 'react';
import {
  Settings,
  X,
  Volume2,
  Play,
  Sliders,
  Clock,
  LayoutGrid,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DEFAULT_SETTINGS, SOUND_THEMES } from '../constants/blood';
import { playAlertSound } from '../utils/sound';

export default function SettingsModal({
  open,
  onClose,
  settings,
  onUpdateSettings,
  soundEnabled,
  onToggleSound,
}) {
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleTestSound = () => {
    playAlertSound({
      enabled: true,
      theme: settings.soundTheme,
      volume: settings.masterVolume,
    });
  };

  const handleReset = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  const hasGeminiKey = Boolean(String(settings.geminiApiKey || '').trim());

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="fixed inset-0 bg-slate-950/85" onClick={onClose} />

      <div className="relative z-10 w-[95vw] sm:w-full max-w-xl max-h-[88vh] overflow-y-auto bg-[#0b1326] border border-slate-700/80 rounded-2xl shadow-2xl fade-up">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/35 flex items-center justify-center text-sky-400">
              <Settings size={18} />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-sm font-extrabold text-white">
                Command Center Settings
              </h2>
              <p className="text-xs text-slate-400">
                Configure alert thresholds, Web Audio engine, Copilot LLM &amp; workspace layout
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Critical Stock Threshold */}
          <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="critical-threshold-slider"
                className="text-xs font-bold text-white flex items-center gap-2"
              >
                <Sliders size={14} className="text-rose-400" />
                Critical Stock Threshold
              </label>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                &lt; {settings.criticalThreshold} units
              </span>
            </div>
            <input
              id="critical-threshold-slider"
              type="range"
              min={5}
              max={30}
              step={1}
              value={settings.criticalThreshold}
              onChange={e =>
                onUpdateSettings({ ...settings, criticalThreshold: Number(e.target.value) })
              }
              className="w-full hemo-slider"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>5u (Lean)</span>
              <span>15u (Default)</span>
              <span>30u (Strict Buffer)</span>
            </div>
          </div>

          {/* Expiry Warning Window */}
          <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Clock size={14} className="text-amber-400" />
                Expiry Warning Window
              </span>
              <span className="text-[11px] font-mono text-amber-300">
                {settings.expiryWindowHours}h FIFO Horizon
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[24, 48, 72].map(hours => {
                const active = settings.expiryWindowHours === hours;
                return (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, expiryWindowHours: hours })}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.2)]'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {hours}h {hours === 48 ? '(Default)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Web Audio Sound Engine */}
          <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <Volume2 size={14} className="text-sky-400" />
                  Audio Alert Sound Engine
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Synthesized Web Audio telemetry &amp; dispatch cues
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleSound}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                  soundEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {soundEnabled ? 'Audio Enabled' : 'Muted'}
              </button>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="sound-theme-select"
                className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold"
              >
                Audio Alert Sound Theme
              </label>
              <div className="flex items-center gap-2.5">
                <select
                  id="sound-theme-select"
                  value={settings.soundTheme}
                  onChange={e => onUpdateSettings({ ...settings, soundTheme: e.target.value })}
                  className="select-dark flex-1 text-xs"
                >
                  {SOUND_THEMES.map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.label} — {theme.desc}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 cursor-pointer flex-shrink-0 transition-all"
                >
                  <Play size={13} />
                  Test Sound
                </button>
              </div>
            </div>

            {/* Master Volume Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="master-volume-slider" className="font-semibold text-slate-300">
                  Master Volume
                </label>
                <span className="font-mono font-bold text-sky-300">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                id="master-volume-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(settings.masterVolume * 100)}
                onChange={e =>
                  onUpdateSettings({
                    ...settings,
                    masterVolume: Number(e.target.value) / 100,
                  })
                }
                className="w-full hemo-slider"
              />
            </div>
          </div>

          {/* Optional Gemini API Key for Live LLM Mode */}
          <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label
                htmlFor="gemini-api-key-input"
                className="text-xs font-bold text-white flex items-center gap-2"
              >
                <Sparkles size={14} className="text-violet-400" />
                Gemini API Key (Optional — Live LLM Mode)
              </label>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  hasGeminiKey
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {hasGeminiKey ? 'Live LLM: gemini-3-flash-preview' : 'Offline Smart Engine Active'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="gemini-api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={settings.geminiApiKey || ''}
                  onChange={e =>
                    onUpdateSettings({ ...settings, geminiApiKey: e.target.value })
                  }
                  placeholder="Optional AIza... key (leave blank for instant 100% offline engine)"
                  className="w-full pr-9 pl-3 py-2 rounded-xl text-xs bg-slate-900/95 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/60"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  aria-label={showKey ? 'Hide Gemini API key' : 'Show Gemini API key'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {hasGeminiKey && (
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, geminiApiKey: '' })}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Stored locally in your browser. When blank, HemoSync Copilot runs on the instant live-state clinical engine with zero external network dependency.
            </p>
          </div>

          {/* Compact vs Spacious Layout Toggle */}
          <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <LayoutGrid size={14} className="text-violet-400" />
                Workspace Density
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {settings.layoutDensity === 'spacious'
                  ? 'Spacious (p-6 · gap-6)'
                  : 'Compact (p-4 · gap-4)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'spacious', label: 'Spacious Layout', sub: 'Generous breathing room' },
                { id: 'compact', label: 'Compact Layout', sub: 'High-density command view' },
              ].map(opt => {
                const active = settings.layoutDensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, layoutDensity: opt.id })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-violet-500/15 border-violet-400/60 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{opt.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 cursor-pointer"
          >
            <RotateCcw size={13} />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-approve flex items-center gap-1.5 px-5 py-2.5 text-xs"
          >
            <CheckCircle2 size={14} />
            Save &amp; Apply
          </button>
        </div>
      </div>
    </div>
  );
}
