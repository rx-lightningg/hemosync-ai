import { Activity, RefreshCw } from 'lucide-react';

export default function Header({ scenario, setScenario, scenarios, lastUpdated, loading }) {
  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: 'rgba(8,13,23,0.97)', borderColor: 'var(--border)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center glow-pulse" style={{ background: 'linear-gradient(135deg, #be123c, #7f1d1d)' }}>
              <span className="text-lg">🩸</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              Hemo<span style={{ color: '#e11d48' }}>Sync</span> <span className="font-light text-slate-400 text-base">AI</span>
            </h1>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Predictive Blood Network · Regional Command</p>
          </div>
        </div>

        {/* Center: live badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px #34d399', animation: 'glowPulse 2s ease-in-out infinite' }}></span>
          <span className="text-xs font-semibold text-emerald-400">LIVE</span>
          <span className="text-xs text-slate-500">· Delhi NCR Region</span>
          {loading && <RefreshCw size={12} className="text-slate-500 animate-spin" />}
        </div>

        {/* Right: scenario + time */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500">Last Sync</p>
            <p className="text-xs font-mono text-slate-400">
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <select
            className="select-dark text-xs"
            value={scenario}
            onChange={e => setScenario(e.target.value)}
          >
            {scenarios.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono" style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.25)', color: '#f43f5e' }}>
            <Activity size={12} />
            <span>8 Nodes</span>
          </div>
        </div>
      </div>
    </header>
  );
}
