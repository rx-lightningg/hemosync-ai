import { useState } from 'react';
import {
  X,
  Building2,
  Phone,
  MapPin,
  Thermometer,
  Send,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  UserCheck,
  Radio,
  PhoneCall,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BG_COLORS, BLOOD_GROUPS, STATUS_CONFIG } from '../constants/blood';
import NearbyDonorsPanel from './NearbyDonorsPanel';

function getDefaultBloodGroup(hospital) {
  if (!hospital?.inventory) return 'O-';
  const sorted = Object.entries(hospital.inventory).sort(
    (a, b) => a[1].units - b[1].units
  );
  return sorted[0]?.[0] || 'O-';
}

export default function HospitalDrawer({
  hospital,
  onClose,
  onRequestTransfer,
  onCallDonor,
  criticalThreshold = 15,
  readOnly = false,
  traumaActive = false,
  donorsCount = 0,
}) {
  const [reqBloodGroup, setReqBloodGroup] = useState(() => getDefaultBloodGroup(hospital));
  const [reqUnits, setReqUnits] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [photoErr, setPhotoErr] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(() => Boolean(traumaActive));

  if (!hospital) return null;

  const sc = STATUS_CONFIG[hospital.status] || STATUS_CONFIG.safe;
  const totalUnits = Object.values(hospital.inventory || {}).reduce(
    (sum, item) => sum + item.units,
    0
  );
  const capacity = hospital.cold_storage_capacity || 500;
  const capacityPct = Math.min(100, Math.round((totalUnits / capacity) * 100));
  const criticalGroups = BLOOD_GROUPS.filter(
    bg => (hospital.inventory?.[bg]?.units ?? 0) < criticalThreshold
  );
  const incomingDonors = hospital.incoming_donors || [];

  const handleDispatchRequest = async () => {
    setSubmitting(true);
    try {
      await onRequestTransfer({
        to_id: hospital.id,
        blood_group: reqBloodGroup,
        units: reqUnits,
        priority: (hospital.inventory?.[reqBloodGroup]?.units ?? 0) < criticalThreshold ? 'HIGH' : 'MEDIUM',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center sm:items-stretch sm:justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside className="relative z-10 w-[95vw] sm:w-full max-w-lg max-h-[88vh] sm:max-h-none sm:h-full rounded-2xl sm:rounded-none bg-[#070d1d] border border-slate-800 sm:border-y-0 sm:border-r-0 shadow-2xl flex flex-col overflow-y-auto sm:overflow-hidden fade-up">
        {/* Facility Hero Cover */}
        <div className="relative h-36 sm:h-44 flex-shrink-0 bg-slate-900 overflow-hidden">
          {!photoErr && hospital.photo ? (
            <img
              src={hospital.photo}
              alt={hospital.name}
              onError={() => setPhotoErr(true)}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-rose-950 flex items-center justify-center">
              <Building2 size={44} className="text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070d1d] via-slate-950/45 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
            aria-label="Close hospital drawer"
          >
            <X size={16} />
          </button>

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
            >
              {sc.label}
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-slate-950/80 text-slate-200 border border-slate-700/70">
              {hospital.type === 'blood_bank' ? 'Blood Bank Hub' : 'Hospital Trauma Unit'}
            </span>
          </div>

          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-lg font-extrabold text-white leading-tight">{hospital.name}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <MapPin size={12} className="text-rose-400 flex-shrink-0" />
              <span className="truncate">{hospital.address || hospital.city}</span>
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="sm:flex-1 sm:overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Director & Contact Card */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              {!avatarErr && hospital.director?.avatar ? (
                <img
                  src={hospital.director.avatar}
                  alt={hospital.director.name}
                  onError={() => setAvatarErr(true)}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                  <UserCheck size={16} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {hospital.director?.name || 'Regional Duty Officer'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {hospital.director?.title || 'Blood Bank Supervisor'}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] font-mono text-sky-400 flex items-center justify-end gap-1">
                <Phone size={11} />
                {hospital.phone || '+91 651 221 1800'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {hospital.lat.toFixed(4)}, {hospital.lng.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Incoming Direct-Call Donors Banner */}
          {incomingDonors.length > 0 && (
            <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/40 p-3 space-y-1.5">
              <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Radio size={13} />
                {incomingDonors.length} Direct-Call {incomingDonors.length === 1 ? 'Donor' : 'Donors'} En Route
              </p>
              {incomingDonors.map(d => (
                <p key={d.dispatch_id} className="text-[11px] text-slate-300 font-mono">
                  • {d.donor_name} ({d.blood_group} +{d.units}u) · ETA ~{d.eta_minutes}m · Confirmed {d.confirmed_at}
                </p>
              ))}
            </div>
          )}

          {/* Cold Storage Telemetry Bar */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs mb-2 gap-2 flex-wrap">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Thermometer size={14} className="text-sky-400" />
                Cold-Storage Utilization
              </span>
              <span className="font-mono text-sky-300 font-bold">
                {hospital.cold_storage_temp ?? 4.2}°C · {totalUnits}/{capacity} u ({capacityPct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>

          {/* 8 Blood Group Stock Bars */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Droplets size={13} className="text-rose-500" />
                Live 8-Group Inventory
              </h3>
              <span className="text-[11px] font-mono text-slate-400">{totalUnits} units total</span>
            </div>

            <div className="space-y-2.5">
              {BLOOD_GROUPS.map(bg => {
                const data = hospital.inventory?.[bg] || { units: 0, status: 'critical', expiring_48h: 0 };
                const pct = Math.min(100, (data.units / 120) * 100);
                const barColor =
                  data.status === 'critical'
                    ? '#f43f5e'
                    : data.status === 'low'
                    ? '#fbbf24'
                    : '#34d399';
                return (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setReqBloodGroup(bg)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors cursor-pointer ${
                      reqBloodGroup === bg ? 'bg-slate-800/75' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <span
                      className="w-9 text-center py-0.5 rounded text-[11px] font-mono font-bold flex-shrink-0"
                      style={{
                        color: BG_COLORS[bg],
                        background: `${BG_COLORS[bg]}1a`,
                        border: `1px solid ${BG_COLORS[bg]}40`,
                      }}
                    >
                      {bg}
                    </span>
                    <div className="flex-1 inventory-bar-bg">
                      <div
                        className="inventory-bar-fill"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                    <span className={`w-10 text-right font-mono text-xs font-bold status-${data.status}`}>
                      {data.units}u
                    </span>
                    {data.expiring_48h > 0 ? (
                      <span
                        title={`${data.expiring_48h} units expiring soon`}
                        className="w-12 text-right text-[10px] font-mono text-amber-400 flex items-center justify-end gap-0.5"
                      >
                        <AlertTriangle size={10} />
                        {data.expiring_48h}
                      </span>
                    ) : (
                      <span className="w-12 text-right text-[10px] text-emerald-500/70 flex items-center justify-end">
                        <CheckCircle2 size={11} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Request Transfer + Last-Resort Emergency Donor Toggle (Hidden in Read-Only Citizen Mode) */}
          {!readOnly && (
            <>
              <div className="bg-rose-950/25 border border-rose-500/30 rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send size={13} className="text-rose-400" />
                    Quick Transfer Dispatch
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    AI automatically selects the closest surplus blood bank and draws the live courier route.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={reqBloodGroup}
                      onChange={e => setReqBloodGroup(e.target.value)}
                      className="select-dark w-full text-xs"
                    >
                      {BLOOD_GROUPS.map(bg => (
                        <option key={bg} value={bg}>
                          {bg} ({hospital.inventory?.[bg]?.units ?? 0}u left)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      Units Requested
                    </label>
                    <select
                      value={reqUnits}
                      onChange={e => setReqUnits(Number(e.target.value))}
                      className="select-dark w-full text-xs"
                    >
                      {[5, 10, 12, 15, 20].map(u => (
                        <option key={u} value={u}>
                          {u} units
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDispatchRequest}
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Routing Cold-Chain Courier...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Request Transfer ({reqUnits}u {reqBloodGroup})
                    </>
                  )}
                </button>
              </div>

              {/* Emergency Last-Resort Nearby Donors Button & Slide-Open Drawer */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setNearbyOpen(v => !v)}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    nearbyOpen
                      ? 'bg-emerald-950/35 border-emerald-500/45 text-emerald-200'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <PhoneCall size={14} className="text-emerald-400" />
                    Emergency: Last-Resort Nearby Donors (&lt;3 km)
                  </span>
                  {nearbyOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {nearbyOpen && (
                  <div className="fade-up">
                    <NearbyDonorsPanel
                      hospital={hospital}
                      bloodGroup={reqBloodGroup}
                      onCallDonor={onCallDonor}
                      refreshKey={donorsCount}
                      subtitle={
                        criticalGroups.length > 0
                          ? `Critical shortage active (${criticalGroups.join(', ')}) — direct call verified local donors <3 km`
                          : `Verified rapid-response ${reqBloodGroup} donors within 3 km of ${hospital.name}`
                      }
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
