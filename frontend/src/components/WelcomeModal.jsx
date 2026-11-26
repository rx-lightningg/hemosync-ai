import { useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  Compass,
  Users,
  X,
  Building2,
  Droplets,
  AlertTriangle,
  ThermometerSnowflake,
  LogIn,
} from 'lucide-react';
import DrAriaIllustration from './DrAriaIllustration';

export default function WelcomeModal({
  open,
  onClose,
  onEnterCoordinator,
  onEnterCitizen,
  onOpenAuth,
  onStartTour,
  kpi,
  hospitals = [],
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const nodeCount = hospitals.length || 12;

  const stats = [
    {
      icon: Building2,
      label: 'Ranchi Nodes',
      value: `${nodeCount} Live`,
      color: '#38bdf8',
    },
    {
      icon: Droplets,
      label: 'Regional Units',
      value: kpi?.total_units ? kpi.total_units.toLocaleString() : '5,400+',
      color: '#f43f5e',
    },
    {
      icon: AlertTriangle,
      label: 'Critical Alerts',
      value: kpi?.critical_alerts ?? '--',
      color: '#fbbf24',
    },
    {
      icon: ThermometerSnowflake,
      label: 'Cold-Chain',
      value: '4.2°C SLA',
      color: '#34d399',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="fixed inset-0 bg-[#040814]/88"
        onClick={onClose}
      />

      <div className="relative z-10 w-[95vw] sm:w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-3xl border border-slate-700/75 bg-[#091226] shadow-[0_0_80px_rgba(56,189,248,0.18),0_0_50px_rgba(225,29,72,0.16)] fade-up my-auto">
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-sky-400 to-emerald-400" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close welcome screen"
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="p-4 sm:p-8 lg:p-10 space-y-5 sm:space-y-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
            {/* Left: Illustrated Dr. Aria Character */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center gap-3">
              <DrAriaIllustration size="lg" />
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/35 text-[11px] font-bold text-sky-300">
                  <Activity size={12} className="text-sky-400" />
                  Dr. Aria — HemoSync Guide
                </span>
              </div>
            </div>

            {/* Right: Title + Friendly Speech Bubble (3 simple sentences) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold">
                  Ranchi, Jharkhand Blood Network
                </p>
                <h2
                  id="welcome-title"
                  className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1"
                >
                  Hemo<span className="text-rose-500">Sync</span>{' '}
                  <span className="font-light text-slate-300">AI</span>
                </h2>
              </div>

              {/* Clean Speech Bubble */}
              <div className="relative rounded-2xl bg-slate-900/85 border border-sky-500/30 p-4 sm:p-5 space-y-2.5 text-sm text-slate-200 leading-relaxed shadow-inner">
                <p>
                  &ldquo;Hi, I&apos;m <strong className="text-white">Dr. Aria</strong>! HemoSync AI watches blood supplies across all {nodeCount} Ranchi hospitals in real time and predicts shortages days before they happen.
                </p>
                <p>
                  Instead of scrambling during an emergency, hospital teams can send surplus units across the city in one click—or call verified local donors within 3 km.
                </p>
                <p className="text-sky-300 font-medium">
                  Choose your view below to jump straight in, or take a quick 30-second guided tour with me!&rdquo;
                </p>
              </div>

              {/* Quick Tour Trigger */}
              <div>
                <button
                  type="button"
                  onClick={onStartTour}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-sky-200 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 transition-all cursor-pointer"
                >
                  <Compass size={15} className="text-sky-400" />
                  Start Guided Tour (Dr. Aria)
                </button>
              </div>
            </div>
          </div>

          {/* Live Ranchi Network Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="p-3.5 rounded-2xl bg-slate-950/75 border border-slate-800/90 flex items-center gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}38` }}
                  >
                    <Icon size={16} style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {s.label}
                    </p>
                    <p className="text-sm sm:text-base font-extrabold font-mono text-white mt-0.5">
                      {s.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Entry Mode Selector Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 flex-wrap">
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-sky-200 bg-slate-900/90 hover:bg-slate-800 border border-sky-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={15} className="text-sky-400" />
                <span>Sign In / Register</span>
              </button>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:ml-auto">
              <button
                type="button"
                onClick={onEnterCitizen}
                className="px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-emerald-200 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-400/45 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users size={16} className="text-emerald-300" />
                <span>Public Blood Finder (Citizen View)</span>
              </button>

              <button
                type="button"
                onClick={onEnterCoordinator}
                className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 border border-rose-400/50 shadow-[0_0_28px_rgba(225,29,72,0.5)] hover:shadow-[0_0_40px_rgba(225,29,72,0.75)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter as Regional Coordinator</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
