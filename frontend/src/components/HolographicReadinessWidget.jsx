import { useState } from 'react';
import { ShieldCheck, Activity, ThermometerSnowflake } from 'lucide-react';

export default function HolographicReadinessWidget({
  hospitals = [],
  kpi,
  traumaActive = false,
  onClickOverview,
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, hovered: false });

  const totalNodes = hospitals.length || 12;
  const safeNodes = hospitals.filter(h => h.status === 'safe').length;
  const critNodes = hospitals.filter(h => h.status === 'critical').length;

  const baseScore = totalNodes
    ? Math.round(((safeNodes * 1 + (totalNodes - safeNodes - critNodes) * 0.65 + critNodes * 0.2) / totalNodes) * 100)
    : 84;
  const readinessScore = Math.max(38, Math.min(99, traumaActive ? baseScore - 12 : baseScore));

  const ringColor =
    readinessScore >= 75 ? '#34d399' : readinessScore >= 55 ? '#fbbf24' : '#f43f5e';
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference * (1 - readinessScore / 100);

  const handleMouseMove = e => {
    if (
      typeof window !== 'undefined' &&
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 18;
    const rx = (0.5 - py) * 16;
    setTilt({
      rx: Number(rx.toFixed(2)),
      ry: Number(ry.toFixed(2)),
      gx: Math.round(px * 100),
      gy: Math.round(py * 100),
      hovered: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, hovered: false });
  };

  return (
    <div
      className="holo-perspective h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        onClick={onClickOverview}
        role={onClickOverview ? 'button' : undefined}
        tabIndex={onClickOverview ? 0 : undefined}
        onKeyDown={e => {
          if (onClickOverview && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClickOverview();
          }
        }}
        className={`holo-card-inner relative h-full rounded-2xl border p-4 overflow-hidden select-none ${
          onClickOverview ? 'cursor-pointer' : ''
        } ${
          traumaActive
            ? 'border-rose-500/50 bg-gradient-to-br from-rose-950/60 via-[#0c1428]/90 to-slate-950/95'
            : 'border-sky-500/30 bg-gradient-to-br from-[#0e1a36]/90 via-[#091224]/95 to-[#070d1c]/95'
        }`}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.hovered ? 1.015 : 1})`,
          boxShadow: tilt.hovered
            ? '0 22px 45px -12px rgba(14, 165, 233, 0.25), 0 0 28px rgba(225, 29, 72, 0.16)'
            : '0 14px 32px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Dynamic Holographic Specular Sheen */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: tilt.hovered ? 0.9 : 0.35,
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(56, 189, 248, 0.18), rgba(244, 63, 94, 0.08) 40%, transparent 72%)`,
          }}
        />

        {/* Subtle Hologram Scanlines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(148,163,184,0.08) 0px, rgba(148,163,184,0.08) 1px, transparent 1px, transparent 5px)',
          }}
        />

        <div className="relative z-10 flex items-center justify-between gap-4 h-full">
          {/* 3D Animated SVG Pulse Emblem */}
          <div className="holo-layer-2 relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {/* Outer Dashed Hologram Orbit */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(56, 189, 248, 0.32)"
                strokeWidth="1"
                strokeDasharray="5 4"
                className="orbit-spin-slow"
              />
              {/* Inner Counter-Rotating Ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(244, 63, 94, 0.28)"
                strokeWidth="1"
                strokeDasharray="12 8"
                className="orbit-spin-reverse"
              />
              {/* Track Ring */}
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="rgba(6, 11, 25, 0.72)"
                stroke="rgba(51, 65, 85, 0.65)"
                strokeWidth="5"
              />
              {/* Readiness Progress Arc */}
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke={ringColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 50 50)"
                style={{
                  filter: `drop-shadow(0 0 7px ${ringColor})`,
                  transition: 'stroke-dashoffset 0.6s ease',
                }}
              />
              {/* Concentric Halo */}
              <circle
                cx="50"
                cy="50"
                r="26"
                fill="none"
                stroke={ringColor}
                strokeWidth="1"
                opacity="0.3"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-lg font-black font-mono leading-none"
                style={{ color: ringColor }}
              >
                {readinessScore}%
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">
                READY
              </span>
            </div>
          </div>

          {/* 3D Floating Telemetry Info */}
          <div className="holo-layer-1 flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300">
                <Activity size={11} className="text-sky-400" />
                3D Supply Readiness
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {totalNodes}/{totalNodes} LIVE
              </span>
            </div>

            <p className="text-xs font-bold text-white leading-snug">
              {traumaActive
                ? 'Trauma Surge Compensation Active'
                : readinessScore >= 75
                ? 'Ranchi Grid Nominal Buffer'
                : 'Proactive Rebalance Engaged'}
            </p>

            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 pt-0.5">
              <span className="flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-400" />
                {safeNodes} Safe
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-sky-300">
                <ThermometerSnowflake size={11} />
                4.2°C
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-rose-300">{kpi?.active_transfers ?? 0} En Route</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
