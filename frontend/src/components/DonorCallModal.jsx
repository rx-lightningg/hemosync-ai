import { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Clock,
  X,
  Radio,
  UserCheck,
} from 'lucide-react';
import { BG_COLORS } from '../constants/blood';
import { playCallConnectedChime, startCallRingtone } from '../utils/sound';

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function DonorCallModal({
  callContext,
  onClose,
  onConfirmEnRoute,
  soundEnabled = true,
  masterVolume = 0.75,
}) {
  const [phase, setPhase] = useState('ringing'); // 'ringing' | 'connected' | 'confirmed'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const donor = callContext?.donor;
  const hospital = callContext?.hospital;
  const bloodGroup = callContext?.bloodGroup || donor?.blood_group || 'O-';

  // Ringing -> Connected audio & auto-pickup transition
  useEffect(() => {
    if (!donor) return undefined;

    if (phase === 'ringing') {
      const stopRingtone = startCallRingtone(soundEnabled, masterVolume);
      const connectTimer = setTimeout(() => {
        stopRingtone();
        playCallConnectedChime(soundEnabled, masterVolume);
        setPhase('connected');
      }, 2400);

      return () => {
        stopRingtone();
        clearTimeout(connectTimer);
      };
    }

    return undefined;
  }, [donor, phase, soundEnabled, masterVolume]);

  // Live call duration timer once connected
  useEffect(() => {
    if (!donor || phase === 'ringing') return undefined;
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [donor, phase]);

  if (!callContext || !donor) return null;

  const bgColor = BG_COLORS[bloodGroup] || '#e11d48';

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirmEnRoute({
        donor_id: donor.id,
        donor_name: donor.name,
        hospital_id: hospital?.id || 'h2',
        blood_group: bloodGroup,
        units: 1,
        eta_minutes: donor.eta_minutes || 14,
        distance_km: donor.distance_km || 1.2,
        neighborhood: donor.neighborhood,
      });
      setPhase('confirmed');
    } finally {
      setSubmitting(false);
    }
  };

  const waveBars = [0.35, 0.72, 1, 0.55, 0.88, 0.42, 0.95, 0.62, 0.8, 0.48, 0.9, 0.52];

  return (
    <div
      className="fixed inset-0 z-[1350] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donor-call-title"
    >
      <div className="fixed inset-0 bg-slate-950/85" onClick={onClose} />

      <div className="relative z-10 w-[95vw] sm:w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl border border-emerald-500/40 bg-[#070f20] shadow-[0_0_60px_rgba(16,185,129,0.25)] fade-up">
        {/* Top Status Header */}
        <div className="px-5 py-4 border-b border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                phase === 'ringing'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
              }`}
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              {phase === 'ringing'
                ? 'Dialing Ranchi Rapid Bridge...'
                : phase === 'confirmed'
                ? 'Donor En Route Confirmed'
                : 'Live Emergency Dispatch Call'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close emergency call modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Donor Identity + Blood Badge */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                  phase === 'ringing'
                    ? 'border-amber-400/70 bg-amber-500/10'
                    : 'border-emerald-400/80 bg-emerald-500/15'
                }`}
              >
                <PhoneCall
                  size={30}
                  className={
                    phase === 'ringing'
                      ? 'text-amber-300 animate-bounce'
                      : 'text-emerald-300'
                  }
                />
              </div>
              <span
                className="absolute -bottom-1 -right-2 px-2 py-0.5 rounded-full text-xs font-mono font-extrabold border shadow-lg"
                style={{
                  background: '#060b19',
                  color: bgColor,
                  borderColor: `${bgColor}75`,
                }}
              >
                {bloodGroup}
              </span>
            </div>

            <h2 id="donor-call-title" className="text-lg font-extrabold text-white">
              {donor.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-sky-300 font-mono">
                <MapPin size={12} />
                {donor.distance_km} km away • {donor.neighborhood}
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-slate-400">{donor.phone_masked}</span>
            </p>

            {/* Eligibility & Donations Pill */}
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[11px] text-emerald-300 font-semibold">
              <UserCheck size={12} />
              Verified Eligible ({donor.last_donated_days}d since last donation)
            </div>
          </div>

          {/* Animated Ringing / Voice Waveform + Call Timer */}
          <div className="p-4 rounded-2xl bg-slate-950/85 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Radio
                  size={13}
                  className={phase === 'ringing' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}
                />
                {phase === 'ringing' ? 'Ringing Donor Mobile...' : 'Voice Channel Encrypted'}
              </span>
              <span className="font-mono text-base font-extrabold text-white flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-400" />
                {formatTimer(elapsedSeconds)}
              </span>
            </div>

            {/* Waveform Bars */}
            <div
              className="h-12 flex items-center justify-center gap-1.5 px-4"
              aria-label="Live audio call waveform"
            >
              {waveBars.map((scale, idx) => (
                <span
                  key={idx}
                  className="call-wave-bar w-1.5 rounded-full"
                  style={{
                    height: `${Math.round(scale * 38)}px`,
                    animationDelay: `${idx * 0.08}s`,
                    background:
                      phase === 'ringing'
                        ? 'linear-gradient(180deg, #fbbf24, #f59e0b)'
                        : 'linear-gradient(180deg, #34d399, #10b981)',
                  }}
                />
              ))}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {phase === 'ringing'
                ? `Requesting immediate ${bloodGroup} walk-in donation for ${hospital?.name || 'Ranchi Trauma Center'}...`
                : phase === 'confirmed'
                ? `+1 incoming ${bloodGroup} unit logged for ${hospital?.name}. Fast-track bay alerted (ETA ~${donor.eta_minutes || 14} mins).`
                : `Donor connected on line. Confirm arrival ETA (~${donor.eta_minutes || 14} mins) to ${hospital?.name || 'target hospital'}.`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            {phase === 'confirmed' ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 size={15} />
                Done — Unit Logged to {hospital?.name?.split('(')[0]?.trim() || 'Hospital'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-bold text-rose-200 bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <PhoneOff size={14} />
                  End Call
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Logging Incoming Unit...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      Confirm Donor En Route
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
