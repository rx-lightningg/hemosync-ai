import { CheckCircle2, AlertTriangle, Radio, X, Info } from 'lucide-react';

const TONE = {
  success: {
    icon: CheckCircle2,
    border: 'border-emerald-500/40',
    bg: 'bg-slate-900/95',
    accent: 'text-emerald-400',
    pill: 'bg-emerald-500/15',
  },
  critical: {
    icon: AlertTriangle,
    border: 'border-rose-500/50',
    bg: 'bg-slate-950/95',
    accent: 'text-rose-400',
    pill: 'bg-rose-500/15',
  },
  info: {
    icon: Info,
    border: 'border-sky-500/40',
    bg: 'bg-slate-900/95',
    accent: 'text-sky-400',
    pill: 'bg-sky-500/15',
  },
  blast: {
    icon: Radio,
    border: 'border-amber-500/40',
    bg: 'bg-slate-900/95',
    accent: 'text-amber-400',
    pill: 'bg-amber-500/15',
  },
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-5 z-[1200] flex flex-col gap-2.5 sm:max-w-sm sm:w-full pointer-events-none">
      {toasts.map(toast => {
        const cfg = TONE[toast.type] || TONE.success;
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto toast-in ${cfg.bg} border ${cfg.border} rounded-xl p-3.5 shadow-2xl flex items-start gap-3`}
          >
            <div className={`w-8 h-8 rounded-lg ${cfg.pill} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <Icon size={16} className={cfg.accent} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
