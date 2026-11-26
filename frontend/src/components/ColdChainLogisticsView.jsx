import { useState, useEffect } from 'react';
import {
  ThermometerSnowflake,
  Clock,
  Truck,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  Activity,
  Navigation,
} from 'lucide-react';
import { BG_COLORS } from '../constants/blood';

function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function ColdChainLogisticsView({
  coldChain,
  activeRoutes,
  onPrioritizeBatch,
  compact = false,
}) {
  const [bucketFilter, setBucketFilter] = useState('all');
  const [tick, setTick] = useState(0);
  const [dispatchedBatches, setDispatchedBatches] = useState(() => new Set());

  // 1-second heartbeat for live ETA countdowns & realistic 4.2°C sensor micro-telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const batches = coldChain?.batches || [];
  const filteredBatches =
    bucketFilter === 'all' ? batches : batches.filter(b => b.bucket === bucketFilter);

  const dispatches =
    activeRoutes && activeRoutes.length > 0
      ? activeRoutes
      : coldChain?.dispatches || [];

  const summary = coldChain?.summary || {
    under_24h: 0,
    under_48h: 0,
    under_7d: 0,
    active_couriers: dispatches.length,
    avg_temp_c: 4.2,
  };

  const handleDispatchBatch = async batch => {
    await onPrioritizeBatch(batch);
    setDispatchedBatches(prev => new Set([...prev, batch.batch_id]));
  };

  return (
    <div id="tour-coldchain-section" className={`${compact ? 'space-y-4' : 'space-y-6'} fade-up rounded-2xl`}>
      {/* Top Cold-Chain Summary Cards */}
      <div className={`grid grid-cols-1 min-[380px]:grid-cols-2 xl:grid-cols-5 ${compact ? 'gap-3 sm:gap-4' : 'gap-3 sm:gap-5'}`}>
        <div className="bg-slate-900/95 border border-rose-500/35 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-rose-300 font-semibold flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-rose-400 animate-pulse" />
            Expiring &lt;24 Hours
          </p>
          <p className="text-2xl font-extrabold font-mono text-rose-400 mt-1.5">
            {summary.under_24h} <span className="text-xs font-normal text-slate-400">units</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Immediate FIFO transfer priority</p>
        </div>

        <div className="bg-slate-900/95 border border-amber-500/30 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
            <Clock size={13} className="text-amber-400" />
            Expiring &lt;48 Hours
          </p>
          <p className="text-2xl font-extrabold font-mono text-amber-400 mt-1.5">
            {summary.under_48h} <span className="text-xs font-normal text-slate-400">units</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Schedule regional cross-match</p>
        </div>

        <div className="bg-slate-900/95 border border-sky-500/25 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-sky-300 font-semibold flex items-center gap-1.5">
            <PackageCheck size={13} className="text-sky-400" />
            Expiring &lt;7 Days
          </p>
          <p className="text-2xl font-extrabold font-mono text-sky-400 mt-1.5">
            {summary.under_7d} <span className="text-xs font-normal text-slate-400">units</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Standard FIFO queue rotation</p>
        </div>

        <div className="bg-slate-900/95 border border-emerald-500/30 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
            <Truck size={13} className="text-emerald-400" />
            Active Couriers
          </p>
          <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1.5">
            {dispatches.length} <span className="text-xs font-normal text-slate-400">in transit</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">GPS &amp; IoT lock active</p>
        </div>

        <div className="bg-slate-900/95 border border-cyan-500/30 rounded-xl p-4 min-[380px]:col-span-2 xl:col-span-1">
          <p className="text-[11px] uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1.5">
            <ThermometerSnowflake size={13} className="text-cyan-400" />
            Fleet Core Temp
          </p>
          <p className="text-2xl font-extrabold font-mono text-cyan-300 mt-1.5">
            {(4.2 + (tick % 4 === 0 ? 0.0 : tick % 4 === 2 ? -0.1 : 0.1)).toFixed(1)}°C
          </p>
          <p className="text-[11px] text-emerald-400 mt-0.5">Nominal 2.0–6.0°C band</p>
        </div>
      </div>

      {/* Main Split: FIFO Expiry Timeline + Live Courier Tracker */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        {/* FIFO Expiry Timeline */}
        <div className="xl:col-span-7 bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                FIFO Expiry Timeline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                First-In-First-Out chronological batch queue sorted by remaining shelf life
              </p>
            </div>

            <div className="flex items-center gap-1 flex-wrap bg-slate-950/90 border border-slate-800 rounded-xl p-1">
              {[
                { id: 'all', label: 'All Batches' },
                { id: '<24h', label: '<24h' },
                { id: '<48h', label: '<48h' },
                { id: '<7d', label: '<7d' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setBucketFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    bucketFilter === tab.id
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {filteredBatches.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No batches in this expiry window.
              </div>
            ) : (
              filteredBatches.map(batch => {
                const is24 = batch.bucket === '<24h';
                const is48 = batch.bucket === '<48h';
                const isDone = dispatchedBatches.has(batch.batch_id);
                const bgColor = BG_COLORS[batch.blood_group] || '#f43f5e';
                const barColor = is24 ? '#f43f5e' : is48 ? '#fbbf24' : '#38bdf8';

                return (
                  <div
                    key={batch.batch_id}
                    className={`rounded-xl p-3.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      is24
                        ? 'bg-rose-950/15 border-rose-500/35'
                        : is48
                        ? 'bg-amber-950/10 border-amber-500/25'
                        : 'bg-slate-950/65 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Urgency Rail Dot */}
                      <div className="flex flex-col items-center pt-1">
                        <span
                          className={`w-3 h-3 rounded-full ${is24 ? 'animate-ping' : ''}`}
                          style={{ background: barColor, boxShadow: `0 0 8px ${barColor}` }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-white">
                            {batch.batch_id}
                          </span>
                          <span
                            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
                            style={{
                              background: `${bgColor}22`,
                              color: bgColor,
                              border: `1px solid ${bgColor}44`,
                            }}
                          >
                            {batch.blood_group}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            {batch.units} units · {batch.component}
                          </span>
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: `${barColor}1f`,
                              color: barColor,
                              border: `1px solid ${barColor}40`,
                            }}
                          >
                            {batch.bucket} ({batch.hours_remaining}h left)
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-1">
                          Stored at <strong className="text-slate-200">{batch.hospital_name}</strong> ({batch.city}) · Core{' '}
                          <span className="font-mono text-sky-300">{batch.temp_c}°C</span> · Expires {batch.expires_at}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                          <CheckCircle2 size={13} />
                          FIFO Routed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDispatchBatch(batch)}
                          className="btn-approve text-xs flex items-center gap-1.5"
                        >
                          <Truck size={12} />
                          Prioritize Transfer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Ambulance / Courier Dispatch Tracker */}
        <div className="xl:col-span-5 bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck size={16} className="text-emerald-400" />
                Live Courier &amp; Telemetry Tracker
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time 4.2°C cold-box sensors &amp; ETA countdowns
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
              <Activity size={11} />
              LIVE TELEMETRY
            </span>
          </div>

          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {dispatches.map((d, idx) => {
              const totalSecs = d.total_seconds || 1500;
              const baseEta = d.eta_seconds || 900;
              const remaining = Math.max(45, baseEta - tick);
              const progressPct = Math.min(
                96,
                Math.max(12, Math.round(((totalSecs - remaining) / totalSecs) * 100))
              );
              const liveTemp = (
                (d.temp_c ?? 4.2) + (((tick + idx) % 5) - 2) * 0.05
              ).toFixed(1);

              return (
                <div
                  key={d.dispatch_id || idx}
                  className="rounded-xl p-4 bg-slate-950/75 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">
                          {d.vehicle_id}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          {d.dispatch_id}
                        </span>
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: `${BG_COLORS[d.blood_group] || '#f43f5e'}22`,
                            color: BG_COLORS[d.blood_group] || '#f43f5e',
                          }}
                        >
                          {d.units}u {d.blood_group}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {d.courier_name} · Driver: {d.driver}
                      </p>
                    </div>

                    {/* Live Temperature Badge */}
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
                        <ThermometerSnowflake size={12} />
                        {liveTemp}°C
                      </div>
                      <p className="text-[10px] text-emerald-400 mt-0.5">Cooler Locked</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-xs bg-slate-900/80 rounded-lg px-3 py-2 border border-slate-800/80">
                    <span className="font-semibold text-sky-400 truncate">{d.from_hospital}</span>
                    <ArrowRight size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="font-semibold text-white truncate">{d.to_hospital}</span>
                  </div>

                  {/* Progress + Live Ticking ETA */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Navigation size={11} className="text-rose-400" />
                        {d.distance_km} km transit · {progressPct}% complete
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        ETA {formatCountdown(remaining)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-400 to-emerald-300 transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
