import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  UserCog,
  X,
  Lock,
  Mail,
  User,
  Zap,
  ArrowRight,
  Check,
} from 'lucide-react';

const ROLE_CARDS = [
  {
    id: 'citizen',
    label: 'Public Citizen / Donor',
    desc: 'Read-only blood finder & voluntary donor registration',
    icon: Users,
    accent: '#34d399',
    demoName: 'Rohan Sinha (Citizen)',
    demoContact: 'rohan.sinha@ranchi.in',
    demoPass: 'Citizen@2026',
  },
  {
    id: 'hospital',
    label: 'Hospital Blood Bank Admin',
    desc: 'Manage a specific Ranchi hospital reserve & dispatch requests',
    icon: Building2,
    accent: '#38bdf8',
    demoName: 'Dr. Meera Krishnan',
    demoContact: 'meera.krishnan@sadar.jh.gov.in',
    demoPass: 'SadarAdmin#2026',
    defaultHospitalId: 'h2',
  },
  {
    id: 'regional',
    label: 'Regional Coordinator',
    desc: 'Full 12-node Ranchi grid oversight, transfers & trauma alerts',
    icon: UserCog,
    accent: '#f43f5e',
    demoName: 'Dr. A. Sharma',
    demoContact: 'dr.sharma@hemosync.jh.gov.in',
    demoPass: 'CommandLead@2026',
  },
];

export default function AuthModal({
  open,
  onClose,
  hospitals = [],
  currentRole = 'regional',
  onAuthSuccess,
}) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [selectedRole, setSelectedRole] = useState(currentRole || 'regional');
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalId, setHospitalId] = useState('h2');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const activeCard = ROLE_CARDS.find(r => r.id === selectedRole) || ROLE_CARDS[2];

  const handleDemoFill = roleCard => {
    setError('');
    setSelectedRole(roleCard.id);
    setFullName(roleCard.demoName);
    setContact(roleCard.demoContact);
    setPassword(roleCard.demoPass);
    if (roleCard.defaultHospitalId) {
      setHospitalId(roleCard.defaultHospitalId);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!contact.trim() || !password.trim() || (tab === 'signup' && !fullName.trim())) {
      setError('Please enter your credentials (or tap any 1-Click Demo Fill button below).');
      return;
    }

    const resolvedName =
      fullName.trim() ||
      (contact.includes('@')
        ? contact
            .split('@')[0]
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
        : activeCard.demoName);

    onAuthSuccess({
      mode: tab,
      name: resolvedName,
      role: selectedRole,
      hospitalId: selectedRole === 'hospital' ? hospitalId : undefined,
      contact: contact.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1450] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="fixed inset-0 bg-[#040814]/88" onClick={onClose} />

      <div className="relative z-10 w-[95vw] sm:w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-3xl bg-[#0a1328] border border-slate-700/80 shadow-[0_0_70px_rgba(225,29,72,0.22),0_0_45px_rgba(56,189,248,0.14)] fade-up my-auto">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-sky-400 to-rose-500" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-center text-rose-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-extrabold text-white">
                HemoSync AI Access Portal
              </h2>
              <p className="text-xs text-slate-400">
                Role-based authentication for Ranchi coordinators, hospital admins &amp; citizens
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Sign In / Create Account Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950/85 border border-slate-800">
            {[
              { id: 'signin', label: 'Sign In' },
              { id: 'signup', label: 'Create Account' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setError('');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tab === t.id
                    ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Role Selector Cards */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Account Role
            </p>
            <div className="grid grid-cols-1 gap-2">
              {ROLE_CARDS.map(rc => {
                const Icon = rc.icon;
                const active = selectedRole === rc.id;
                return (
                  <button
                    key={rc.id}
                    type="button"
                    onClick={() => setSelectedRole(rc.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      active
                        ? 'bg-slate-900/95 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    style={{
                      borderColor: active ? rc.accent : undefined,
                      boxShadow: active ? `0 0 18px ${rc.accent}24` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${rc.accent}1c`,
                          border: `1px solid ${rc.accent}42`,
                        }}
                      >
                        <Icon size={15} style={{ color: rc.accent }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{rc.label}</p>
                        <p className="text-[11px] text-slate-400 truncate">{rc.desc}</p>
                      </div>
                    </div>
                    {active && <Check size={15} style={{ color: rc.accent }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1-Click Demo Credential Fill Buttons */}
          <div className="p-3.5 rounded-xl bg-sky-950/25 border border-sky-500/30 space-y-2">
            <p className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
              <Zap size={12} className="text-amber-400" />
              1-Click Demo Credential Fill (Instant Judge Testing)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ROLE_CARDS.map(rc => (
                <button
                  key={`demo-${rc.id}`}
                  type="button"
                  onClick={() => handleDemoFill(rc)}
                  className="px-2.5 py-2 rounded-lg text-[11px] font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-sky-400/50 transition-all cursor-pointer truncate"
                >
                  Fill: {rc.id === 'citizen' ? 'Citizen' : rc.id === 'hospital' ? 'Hospital Admin' : 'Coordinator'}
                </button>
              ))}
            </div>
          </div>

          {/* Hospital Picker when Hospital Admin is selected */}
          {selectedRole === 'hospital' && hospitals.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Assigned Ranchi Hospital / Blood Bank
              </label>
              <select
                value={hospitalId}
                onChange={e => setHospitalId(e.target.value)}
                className="select-dark w-full text-xs"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-3">
            {tab === 'signup' && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Priya Sengupta"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-rose-500/60"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Email or Phone Number
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="name@hospital.in or +91 98350 12345"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-rose-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-rose-500/60"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 px-5 py-2.5"
            >
              <span>
                {tab === 'signin'
                  ? `Sign In as ${activeCard.label.split(' ')[0]}`
                  : 'Create Account & Enter'}
              </span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
