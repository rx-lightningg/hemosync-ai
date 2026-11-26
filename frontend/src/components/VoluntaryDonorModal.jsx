import { useState, useEffect } from 'react';
import { HeartHandshake, X, CheckCircle2 } from 'lucide-react';
import { BLOOD_GROUPS } from '../constants/blood';

const LOCALITIES = [
  'Bariatu',
  'Lalpur',
  'Morabadi',
  'Main Road',
  'Dhurwa',
  'Kanke',
  'Purulia Road',
  'Ratu Road',
  'Station Road',
  'Gandhinagar',
];

export default function VoluntaryDonorModal({
  open,
  onClose,
  defaultBloodGroup = 'O-',
  onRegisterDonor,
}) {
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorBG, setDonorBG] = useState(defaultBloodGroup);
  const [donorArea, setDonorArea] = useState('Bariatu');
  const [eligible90Days, setEligible90Days] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [regError, setRegError] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!donorName.trim() || !donorPhone.trim()) {
      setRegError('Please enter your full name and phone number.');
      return;
    }
    setRegError('');
    setSubmitting(true);
    try {
      await onRegisterDonor({
        name: donorName.trim(),
        phone: donorPhone.trim(),
        blood_group: donorBG,
        neighborhood: donorArea,
        eligible_90_days: eligible90Days,
      });
      setDonorName('');
      setDonorPhone('');
      setEligible90Days(true);
      onClose();
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1420] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voluntary-donor-reg-title"
    >
      <div className="fixed inset-0 bg-slate-950/85" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[95vw] sm:w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl bg-[#0b1326] border border-emerald-500/45 shadow-[0_0_50px_rgba(16,185,129,0.2)] fade-up"
      >
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
              <HeartHandshake size={18} />
            </div>
            <div>
              <h3 id="voluntary-donor-reg-title" className="text-sm font-extrabold text-white">
                Register as Voluntary Donor
              </h3>
              <p className="text-xs text-slate-400">
                Join Ranchi&apos;s verified emergency donor network
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close voluntary donor registration modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label
              htmlFor="donor-full-name"
              className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >
              Full Name
            </label>
            <input
              id="donor-full-name"
              type="text"
              value={donorName}
              onChange={e => setDonorName(e.target.value)}
              placeholder="e.g. Priya Kumari"
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div>
            <label
              htmlFor="donor-phone"
              className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >
              Phone Number
            </label>
            <input
              id="donor-phone"
              type="tel"
              value={donorPhone}
              onChange={e => setDonorPhone(e.target.value)}
              placeholder="+91 98350 12345"
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="donor-blood-group"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
              >
                Blood Group
              </label>
              <select
                id="donor-blood-group"
                value={donorBG}
                onChange={e => setDonorBG(e.target.value)}
                className="select-dark w-full text-xs"
              >
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="donor-locality"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
              >
                Ranchi Locality
              </label>
              <select
                id="donor-locality"
                value={donorArea}
                onChange={e => setDonorArea(e.target.value)}
                className="select-dark w-full text-xs"
              >
                {LOCALITIES.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/75 border border-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={eligible90Days}
              onChange={e => setEligible90Days(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-200">
              Last Donated &gt; 90 Days Ago (Eligible)
            </span>
          </label>

          {regError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {regError}
            </p>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {submitting ? 'Registering...' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
}
