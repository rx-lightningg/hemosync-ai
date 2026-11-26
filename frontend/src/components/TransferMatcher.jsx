import { useState } from 'react';
import { ArrowRight, CheckCircle2, Truck, Zap, Clock, Navigation } from 'lucide-react';
import { BG_COLORS } from '../constants/blood';

export default function TransferMatcher({
  transfers,
  approvedIds,
  onApprove,
  loading,
  maxVisible = 3,
}) {
  const [approvingId, setApprovingId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const handleApprove = async t => {
    setApprovingId(t.id);
    try {
      await onApprove(t);
    } finally {
      setApprovingId(null);
    }
  };

  const pendingCount = transfers.filter(t => !approvedIds.has(t.id)).length;
  const visibleTransfers = showAll ? transfers : transfers.slice(0, maxVisible);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 sm:p-4 h-full flex flex-col lg:min-h-[470px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap size={15} className="text-amber-400" />
            Top {Math.min(maxVisible, Math.max(1, transfers.length))} AI Smart Transfers
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Expiry-aware FIFO &amp; proximity rebalance recommendations
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap flex-shrink-0">
          {pendingCount} pending
        </span>
      </div>

      {/* Transfer List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {loading && transfers.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl p-3 bg-slate-800/40 border border-slate-800 h-24"
            />
          ))
        ) : transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-center">
            <CheckCircle2 size={30} className="text-emerald-400 mb-2" />
            <p className="text-sm text-emerald-400 font-semibold">All inventories balanced</p>
            <p className="text-xs text-slate-400 mt-1">
              No critical shortages requiring inter-facility dispatch.
            </p>
          </div>
        ) : (
          visibleTransfers.map((t, idx) => {
            const approved = approvedIds.has(t.id);
            const isApproving = approvingId === t.id;
            const bgColor = BG_COLORS[t.blood_group] || '#f43f5e';

            return (
              <div
                key={t.id}
                className={`rounded-xl p-3.5 transition-all slide-in border ${
                  approved
                    ? 'bg-emerald-950/20 border-emerald-500/30 opacity-70'
                    : t.priority === 'HIGH'
                    ? 'bg-slate-950/65 border-rose-500/30 hover:border-rose-500/55'
                    : 'bg-slate-950/65 border-slate-800 hover:border-slate-700'
                }`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Priority + Blood Group + CTA */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={
                        approved
                          ? 'tag-approved'
                          : t.priority === 'HIGH'
                          ? 'tag-high'
                          : 'tag-medium'
                      }
                    >
                      {approved ? 'DISPATCHED' : t.priority}
                    </span>
                    <span
                      className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                      style={{
                        background: `${bgColor}20`,
                        color: bgColor,
                        border: `1px solid ${bgColor}45`,
                      }}
                    >
                      {t.blood_group}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{t.units}u</span>
                  </div>

                  {approved ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <Truck size={13} />
                      En Route
                    </span>
                  ) : (
                    <button
                      className="btn-approve flex items-center gap-1"
                      disabled={isApproving}
                      onClick={() => handleApprove(t)}
                    >
                      {isApproving ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Dispatching
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} />
                          Approve &amp; Dispatch
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Route */}
                <div className="flex items-center gap-1.5 text-xs mb-1.5 flex-wrap">
                  <span className="font-semibold text-sky-400 truncate max-w-[140px]">
                    {t.from_hospital}
                  </span>
                  <ArrowRight size={12} className="text-slate-500 flex-shrink-0" />
                  <span className="font-semibold text-white truncate max-w-[140px]">
                    {t.to_hospital}
                  </span>
                </div>

                {/* Reason + Distance/ETA */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <p className="truncate">{t.reason}</p>
                  {t.distance_km && (
                    <span className="flex items-center gap-1 font-mono text-slate-500 flex-shrink-0">
                      <Navigation size={10} />
                      {t.distance_km}km · <Clock size={10} />
                      {t.eta_minutes}m
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expand/Collapse Remaining Recommendations */}
      {transfers.length > maxVisible && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs font-semibold text-sky-400 hover:text-sky-300 text-center w-full cursor-pointer"
        >
          {showAll
            ? `Show Top ${maxVisible} Only`
            : `View All ${transfers.length} AI Recommendations (+${transfers.length - maxVisible} more)`}
        </button>
      )}
    </div>
  );
}
