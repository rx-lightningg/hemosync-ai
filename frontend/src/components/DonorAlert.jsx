import { useState } from 'react';
import {
  Bell,
  Smartphone,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Siren,
  ArrowUpRight,
} from 'lucide-react';
import { BG_COLORS, BLOOD_GROUPS } from '../constants/blood';

export default function DonorAlert({
  hospitals,
  alertResult,
  alertLoading,
  onAlert,
  onOpenDonorHub,
}) {
  const [selectedBG, setSelectedBG] = useState('O-');
  const [triggered, setTriggered] = useState(false);

  const criticalTypes = new Set();
  hospitals.forEach(h => {
    Object.entries(h.inventory || {}).forEach(([bg, data]) => {
      if (data.status === 'critical') criticalTypes.add(bg);
    });
  });

  const handleTrigger = async () => {
    setTriggered(false);
    await onAlert(selectedBG);
    setTriggered(true);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell size={15} className="text-rose-500" />
            Emergency Donor Alert
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant SMS / App / WhatsApp dispatch
          </p>
        </div>
        {onOpenDonorHub && (
          <button
            onClick={onOpenDonorHub}
            className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-0.5 cursor-pointer"
          >
            Full Hub <ArrowUpRight size={12} />
          </button>
        )}
      </div>

      {criticalTypes.size > 0 && (
        <div className="mb-3 p-3 rounded-xl flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30">
          <AlertCircle size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-300">Critical Shortage Detected</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[...criticalTypes].map(bg => (
                <button
                  key={bg}
                  onClick={() => setSelectedBG(bg)}
                  className="text-[11px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer transition-transform hover:scale-105"
                  style={{
                    background: `${BG_COLORS[bg]}24`,
                    color: BG_COLORS[bg],
                    border: `1px solid ${BG_COLORS[bg]}45`,
                  }}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <p className="text-xs text-slate-300 mb-2 font-semibold">Select Target Blood Group</p>
        <div className="grid grid-cols-4 gap-1.5">
          {BLOOD_GROUPS.map(bg => {
            const isCrit = criticalTypes.has(bg);
            const isSel = selectedBG === bg;
            return (
              <button
                key={bg}
                onClick={() => setSelectedBG(bg)}
                className="text-xs font-mono font-bold py-2 rounded-lg transition-all cursor-pointer"
                style={{
                  background: isSel
                    ? `${BG_COLORS[bg]}26`
                    : isCrit
                    ? 'rgba(244,63,94,0.08)'
                    : 'rgba(15,23,42,0.75)',
                  border: isSel
                    ? `2px solid ${BG_COLORS[bg]}`
                    : isCrit
                    ? '1px solid rgba(244,63,94,0.35)'
                    : '1px solid rgba(51,65,85,0.8)',
                  color: isSel ? BG_COLORS[bg] : isCrit ? '#fda4af' : '#94a3b8',
                }}
              >
                {bg}
                {isCrit && (
                  <span className="block text-[9px] text-rose-400 font-semibold leading-tight mt-0.5">
                    CRIT
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-slate-950/65 border border-slate-800 space-y-2">
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          Active Dispatch Channels
        </p>
        {[
          { icon: Smartphone, label: 'SMS Blast', sub: 'Ranchi Donor Registry' },
          { icon: Bell, label: 'Push Notification', sub: 'HemoSync Mobile Network' },
          { icon: MessageSquare, label: 'WhatsApp Alerts', sub: 'Verified Opt-In Cohorts' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
              <Icon size={12} className="text-rose-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-200 font-medium leading-none">{label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          </div>
        ))}
      </div>

      <button
        className="btn-primary w-full flex items-center justify-center gap-2 mt-auto"
        onClick={handleTrigger}
        disabled={alertLoading}
      >
        {alertLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Dispatching Blast...
          </>
        ) : (
          <>
            <Siren size={14} />
            Trigger Emergency Alert — {selectedBG}
          </>
        )}
      </button>

      {alertResult && triggered && (
        <div className="mt-3 p-3 rounded-xl slide-in bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <p className="text-xs font-bold text-emerald-300">Alert Dispatched Successfully</p>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Donors Notified</span>
              <span className="font-mono font-bold text-white">{alertResult.donors_notified}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Est. Response</span>
              <span className="font-mono font-bold text-emerald-300">
                {alertResult.estimated_response_time}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
