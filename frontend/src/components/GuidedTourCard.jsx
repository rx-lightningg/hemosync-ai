import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Siren,
  Truck,
  Building2,
  BrainCircuit,
  ThermometerSnowflake,
  Radio,
  Bot,
  Droplets,
  Filter,
  PhoneCall,
  HeartHandshake,
  Play,
  Pause,
} from 'lucide-react';
import DrAriaIllustration from './DrAriaIllustration';

const ADMIN_TOUR_STEPS = [
  {
    id: 'admin-map',
    view: 'command',
    targetIds: ['tour-map-section'],
    dock: 'bottom-right',
    icon: MapPin,
    color: '#38bdf8',
    title: 'Command Center — Live Ranchi Map',
    body: 'All 12 Ranchi hospitals and blood banks are monitored live. Green pins indicate safe reserves, yellow is low, and pulsing red nodes are critical—click any node to inspect its facility drawer.',
  },
  {
    id: 'admin-controls',
    view: 'command',
    targetIds: ['tour-top-controls'],
    dock: 'bottom-left',
    icon: Siren,
    color: '#f43f5e',
    title: 'Top Controls & Trauma Simulator',
    body: "Switch scenarios (Normal Week, Holiday Dip, Dengue Outbreak Spike), upload fresh hospital CSV stock, or click the red 'Simulate Trauma Emergency' button to stress-test the grid with live alerts.",
  },
  {
    id: 'admin-transfers',
    view: 'command',
    targetIds: ['tour-transfers-section'],
    dock: 'bottom-left',
    icon: Truck,
    color: '#34d399',
    title: 'Smart Transfer Matcher',
    body: "Our AI automatically pairs critical shortages with the nearest surplus Ranchi blood bank. Click 'Approve & Dispatch' to route cold-chain couriers in one click.",
  },
  {
    id: 'admin-directory',
    view: 'directory',
    targetIds: ['tour-directory-overview'],
    dock: 'bottom-right',
    icon: Building2,
    color: '#38bdf8',
    title: 'Hospital Directory Tab',
    body: 'Inspect all 12 Ranchi facilities in one place—including cold-storage utilization, transfusion directors, phone numbers, and exact live unit counts across all 8 blood groups (O- to AB+).',
  },
  {
    id: 'admin-analytics',
    view: 'analytics',
    targetIds: ['tour-analytics-section'],
    dock: 'bottom-right',
    icon: BrainCircuit,
    color: '#a78bfa',
    title: 'AI Predictive Analytics Tab',
    body: 'Explore the 14-day supply-vs-demand forecasting curve across Packed Red Cells (PRBC), Platelets, and Plasma—and drag the What-If Scenario Sliders to stress-test surgical or monsoon surges.',
  },
  {
    id: 'admin-logistics',
    view: 'logistics',
    targetIds: ['tour-coldchain-section'],
    dock: 'bottom-right',
    icon: ThermometerSnowflake,
    color: '#22d3ee',
    title: 'Expiry & Cold-Chain Logistics Tab',
    body: 'Prevent platelet and RBC wastage with First-In-First-Out (<24h / <48h) batch prioritization alongside live 4.2°C GPS ambulance courier tracking.',
  },
  {
    id: 'admin-donors',
    view: 'donors',
    targetIds: ['tour-donors-section'],
    dock: 'bottom-right',
    icon: Radio,
    color: '#34d399',
    title: 'Donor Mobilization & Last-Resort Call',
    body: 'Launch geo-fenced SMS & WhatsApp donor blasts, or use the Last-Resort Direct Call bridge to phone verified matching donors within 3 km and log incoming units live.',
  },
  {
    id: 'admin-copilot',
    view: 'command',
    targetIds: ['tour-copilot-btn', 'tour-role-switcher'],
    dock: 'bottom-left',
    icon: Bot,
    color: '#f43f5e',
    title: 'HemoSync AI Copilot & Role Switcher',
    body: "Tap 'Ask HemoSync AI' in the bottom-right to chat or speak voice commands with live execution cards—and use the top-right Role Switcher anytime to preview the Public Citizen View.",
  },
];

const CITIZEN_TOUR_STEPS = [
  {
    id: 'citizen-bg',
    view: 'command',
    targetIds: ['tour-citizen-bloodgroup'],
    dock: 'bottom-right',
    icon: Droplets,
    color: '#f43f5e',
    title: 'Blood Group Selector',
    body: 'Patients and families can tap any blood type (O-, B+, AB-, etc.) right here to check real-time blood availability across all 12 Ranchi medical centers.',
  },
  {
    id: 'citizen-filter',
    view: 'command',
    targetIds: ['tour-citizen-filters'],
    dock: 'bottom-left',
    icon: Filter,
    color: '#38bdf8',
    title: 'Area & Hospital Filter',
    body: 'Choose your Ranchi locality (Bariatu, Lalpur, Main Road, Dhurwa) or search a hospital name to sort centers by exact distance in kilometers.',
  },
  {
    id: 'citizen-cards',
    view: 'command',
    targetIds: ['tour-citizen-cards'],
    dock: 'bottom-right',
    icon: PhoneCall,
    color: '#34d399',
    title: 'Direct Hospital Contact & Details',
    body: 'Check clear In Stock, Limited, or Out of Stock badges, tap any hospital phone number to call immediately, or click Details to view full stock.',
  },
  {
    id: 'citizen-register',
    view: 'command',
    targetIds: ['tour-citizen-register'],
    dock: 'bottom-left',
    icon: HeartHandshake,
    color: '#10b981',
    title: 'Register as Voluntary Donor',
    body: "Click the green 'Register as Voluntary Donor' button to join Ranchi's verified donor network and help save lives in future emergencies.",
  },
];

export default function GuidedTourCard({
  stepIndex,
  onStepChange,
  onFinish,
  isCitizen = false,
  activeView = 'command',
  onSelectView,
}) {
  const [autoPlay, setAutoPlay] = useState(false);

  const steps = isCitizen ? CITIZEN_TOUR_STEPS : ADMIN_TOUR_STEPS;
  const isActive = stepIndex !== null && stepIndex >= 0 && stepIndex < steps.length;
  const activeStep = isActive ? steps[stepIndex] : null;

  // Automatically switch active sidebar tab when the tour step changes
  useEffect(() => {
    if (!activeStep?.view || !onSelectView) return;
    onSelectView(activeStep.view);
  }, [activeStep, onSelectView]);

  // Apply glowing spotlight ring to the target UI elements and scroll smoothly into view
  useEffect(() => {
    if (!activeStep) return undefined;

    const highlightedEls = [];
    const timer = setTimeout(() => {
      (activeStep.targetIds || []).forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add('tour-spotlight');
          highlightedEls.push(el);
          if (idx === 0) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    }, 90);

    return () => {
      clearTimeout(timer);
      highlightedEls.forEach(el => el.classList.remove('tour-spotlight'));
      // Safety cleanup by IDs in case DOM re-rendered
      (activeStep.targetIds || []).forEach(id => {
        document.getElementById(id)?.classList.remove('tour-spotlight');
      });
    };
  }, [activeStep, activeView]);

  // Auto-Play Presentation Mode (6s per step)
  useEffect(() => {
    if (!activeStep || !autoPlay) return undefined;

    const timer = setTimeout(() => {
      if (stepIndex < steps.length - 1) {
        onStepChange(stepIndex + 1);
      } else {
        setAutoPlay(false);
        onFinish();
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [activeStep, autoPlay, stepIndex, steps.length, onStepChange, onFinish]);

  if (!activeStep) return null;

  const Icon = activeStep.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const dockClass =
    activeStep.dock === 'bottom-right'
      ? 'bottom-3 left-[2.5vw] sm:left-auto sm:bottom-20 sm:right-6'
      : 'bottom-3 left-[2.5vw] sm:bottom-6 sm:left-6 lg:left-60';

  const handleClose = () => {
    setAutoPlay(false);
    onFinish();
  };

  return (
    <div
      role="dialog"
      aria-label={`Dr. Aria Guided Tour Step ${stepIndex + 1} of ${steps.length}`}
      className={`fixed ${dockClass} z-[1160] w-[95vw] sm:w-[370px] max-h-[88vh] overflow-y-auto rounded-2xl bg-[#081229] border border-sky-400/50 shadow-[0_22px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.22)] transition-all duration-300 fade-up`}
    >
      {/* Animated 6s Auto-Play Progress Bar */}
      {autoPlay && (
        <div className="h-1 w-full bg-slate-800 overflow-hidden">
          <div
            key={`progress-${activeStep.id}-${stepIndex}`}
            className="h-full bg-gradient-to-r from-sky-400 via-rose-400 to-emerald-400 tour-autoprogress"
          />
        </div>
      )}

      <div className="p-4 space-y-3.5">
        {/* Header with Mini Dr. Aria + Step Counter + Auto-Play Toggle */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 rounded-full bg-slate-900/90 border border-sky-400/35 p-0.5">
              <DrAriaIllustration size="sm" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/35">
                  Step {stepIndex + 1} of {steps.length}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  {isCitizen ? 'Citizen Guide' : 'Dr. Aria Tour'}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white mt-1 flex items-center gap-1.5 leading-snug">
                <Icon size={14} style={{ color: activeStep.color }} className="flex-shrink-0" />
                <span className="truncate">{activeStep.title}</span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Skip Tour"
            title="Skip Tour"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Speech Bubble Copy */}
        <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/75 border border-slate-800/90 rounded-xl p-3">
          {activeStep.body}
        </p>

        {/* Auto-Play Toggle + Step Progress Dots */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setAutoPlay(v => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
              autoPlay
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {autoPlay ? <Pause size={11} /> : <Play size={11} />}
            <span>{autoPlay ? 'Auto-Play On (6s/step)' : 'Auto-Play (6s/step)'}</span>
          </button>

          <div className="flex items-center gap-1">
            {steps.map((st, idx) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onStepChange(idx)}
                aria-label={`Jump to tour step ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === stepIndex ? 'w-4 bg-sky-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Controls: Skip Tour, Previous, Next / Finish */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleClose}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800/70 cursor-pointer transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft size={13} />
              Previous
            </button>

            <button
              type="button"
              onClick={() => (isLast ? handleClose() : onStepChange(stepIndex + 1))}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>{isLast ? 'Finish Tour' : 'Next'}</span>
              {!isLast && <ChevronRight size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
