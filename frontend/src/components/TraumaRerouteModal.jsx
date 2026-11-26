import { useState } from 'react';
import {
  Siren,
  X,
  ArrowRight,
  Zap,
  Clock,
  Navigation,
  ShieldAlert,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import NearbyDonorsPanel from './NearbyDonorsPanel';

export default function TraumaRerouteModal({
  incident,
  onClose,
  onExecuteReroute,
  onCallDonor,
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dispatching, setDispatching] = useState(false);

  if (!incident) return null;

  const options = incident.reroute_options || [];
  const chosen = options[selectedIdx] || options[0];

  const handleDispatch = async () => {
    if (!chosen) return;
    setDispatching(true);
    try {
      await onExecuteReroute({
        from_id: chosen.from_id,
        to_id: incident.hospital.id,
        blood_group: incident.blood_group,
        units: chosen.suggested_units,
        priority: 'HIGH',
      });
      onClose();
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-950/85" onClick={onClose} />

      <div className="relative z-10 w-[95vw] sm:w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-[#0a1225] border border-rose-500/50 rounded-2xl shadow-[0_0_50px_rgba(225,29,72,0.35)] fade-up my-auto">
        {/* Urgent Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 border-b border-rose-500/35 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 glow-pulse">
              <Siren size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500 text-white">
                  CODE RED · {incident.incident_id}
                </span>
                <span className="text-[11px] font-mono text-rose-300">Instant AI Reroute</span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-0.5">
                Massive Trauma Depletion at {incident.hospital?.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Close trauma modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Shock Drop Summary */}
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/35 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-rose-400 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">
                  {incident.blood_group} Reserve Critically Depleted
                </p>
                <p className="text-slate-300 mt-0.5">
                  {incident.hospital?.name} ({incident.hospital?.city}) stock dropped from{' '}
                  <span className="font-mono text-slate-200">{incident.previous_units}u</span> to{' '}
                  <span className="font-mono font-extrabold text-rose-400">
                    {incident.current_units} units
                  </span>
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {incident.blood_group}: 2u LEFT
            </span>
          </div>

          {/* AI Ranked Donor Options */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              AI-Ranked Cold-Chain Reroute Options
            </p>

            <div className="space-y-2.5">
              {options.map((opt, idx) => {
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={opt.from_id}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-400/70 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                        : 'bg-slate-950/65 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {idx === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                            AI OPTIMAL
                          </span>
                        )}
                        <span className="text-xs font-bold text-white">{opt.from_hospital}</span>
                        <ArrowRight size={12} className="text-slate-500" />
                        <span className="text-xs font-semibold text-rose-300">
                          {incident.hospital?.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span>
                          Dispatch <strong className="text-white font-mono">{opt.suggested_units}u {incident.blood_group}</strong> (of {opt.available_units}u avail)
                        </span>
                        <span className="flex items-center gap-1 font-mono text-sky-300">
                          <Navigation size={10} /> {opt.distance_km} km
                        </span>
                        <span className="flex items-center gap-1 font-mono text-amber-300">
                          <Clock size={10} /> ETA {opt.eta_minutes} min
                        </span>
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {opt.ai_confidence}% match
                      </span>
                      {isSelected && (
                        <CheckCircle2 size={15} className="text-sky-400 ml-auto mt-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Last-Resort Direct Call Nearby Donors */}
          {onCallDonor && incident.hospital && (
            <NearbyDonorsPanel
              hospital={incident.hospital}
              bloodGroup={incident.blood_group}
              onCallDonor={onCallDonor}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-slate-400">
            Draws live animated dispatch route &amp; activates 4.2°C courier telemetry
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleDispatch}
              disabled={!chosen || dispatching}
              className="btn-primary flex items-center gap-2"
            >
              {dispatching ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Dispatching Rapid Unit...
                </>
              ) : (
                <>
                  <Truck size={14} />
                  Execute AI Reroute ({chosen?.suggested_units}u {incident.blood_group})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
