import { Droplets, AlertTriangle, Clock, ArrowLeftRight } from 'lucide-react';

function KPICard({ icon: Icon, label, value, sub, color, loading, glow, badge, compact = false }) {
  return (
    <div
      className={`bg-[#0c1428]/95 border border-slate-800/95 rounded-2xl ${
        compact ? 'p-3.5 sm:p-4' : 'p-3.5 sm:p-5'
      } flex flex-col justify-between gap-2.5 sm:gap-3 glass-card-hover fade-up min-w-0 ${
        glow ? 'glow-red border-rose-500/45' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="rounded-xl p-2 sm:p-2.5 flex-shrink-0"
            style={{ background: `${color}1a`, border: `1px solid ${color}38` }}
          >
            <Icon size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color }} />
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-300 uppercase tracking-wider font-bold leading-tight whitespace-normal">
            {label}
          </p>
        </div>

        {badge && (
          <span
            className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md flex-shrink-0"
            style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}
          >
            {badge}
          </span>
        )}
      </div>

      <div>
        {loading ? (
          <div className="h-7 sm:h-8 w-20 sm:w-24 rounded-lg animate-pulse bg-slate-800/80" />
        ) : (
          <p className="metric-value font-mono" style={{ color }}>
            {typeof value === 'number' ? value.toLocaleString() : value ?? '--'}
          </p>
        )}
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 sm:mt-1.5 leading-snug whitespace-normal">{sub}</p>
      </div>
    </div>
  );
}

export default function KPIBar({
  kpi,
  loading,
  nodeCount = 12,
  criticalThreshold = 15,
  expiryWindowHours = 48,
  compact = false,
}) {
  return (
    <div className={`grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 ${compact ? 'gap-3 sm:gap-4' : 'gap-3 sm:gap-4 lg:gap-6'}`}>
      <KPICard
        icon={Droplets}
        label="TOTAL REGIONAL UNITS"
        value={kpi?.total_units}
        sub={`Live stock across ${nodeCount} Ranchi nodes`}
        color="#38bdf8"
        badge="RANCHI"
        loading={loading}
        compact={compact}
      />
      <KPICard
        icon={AlertTriangle}
        label="CRITICAL SHORTAGES"
        value={kpi?.critical_alerts}
        sub={`Blood groups below ${criticalThreshold} units`}
        color="#f43f5e"
        badge={(kpi?.critical_alerts ?? 0) > 5 ? 'SURGE' : 'MONITOR'}
        loading={loading}
        glow={(kpi?.critical_alerts ?? 0) > 5}
        compact={compact}
      />
      <KPICard
        icon={Clock}
        label={`EXPIRING WITHIN ${expiryWindowHours}H`}
        value={kpi?.expiring_soon_units}
        sub="Prioritized for FIFO transfer"
        color="#fbbf24"
        badge="FIFO"
        loading={loading}
        compact={compact}
      />
      <KPICard
        icon={ArrowLeftRight}
        label="ACTIVE TRANSFERS"
        value={kpi?.active_transfers ?? 0}
        sub="Cold-chain couriers in transit"
        color="#34d399"
        badge="4.2°C"
        loading={loading}
        compact={compact}
      />
    </div>
  );
}
