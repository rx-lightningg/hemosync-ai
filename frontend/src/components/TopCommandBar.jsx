import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Upload,
  Siren,
  Menu,
  RefreshCw,
  Building2,
  CheckCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  Volume2,
  VolumeX,
  ShieldCheck,
  BrainCircuit,
  ThermometerSnowflake,
  Radio,
  UserCog,
  ChevronDown,
  Check,
  Settings,
  Users,
  LogOut,
} from 'lucide-react';
import { BLOOD_GROUPS, COORDINATOR_PROFILE, STATUS_CONFIG } from '../constants/blood';

const MODULE_KEYWORDS = [
  {
    id: 'platelets',
    keywords: ['platelet', 'platelets', 'sdp', 'rdp', 'dengue'],
    title: 'Platelets (SDP / RDP) Forecast',
    subtitle: 'AI Predictive Analytics · Platelets tab',
    view: 'analytics',
    component: 'platelets',
    icon: BrainCircuit,
    color: '#fbbf24',
  },
  {
    id: 'plasma',
    keywords: ['plasma', 'ffp', 'fresh frozen'],
    title: 'Fresh Frozen Plasma (FFP) Forecast',
    subtitle: 'AI Predictive Analytics · Plasma tab',
    view: 'analytics',
    component: 'plasma',
    icon: BrainCircuit,
    color: '#38bdf8',
  },
  {
    id: 'prbc',
    keywords: ['prbc', 'packed red', 'rbc', 'red cells', 'forecast', 'what-if', 'analytics'],
    title: 'Packed Red Cells & What-If Simulator',
    subtitle: 'AI Predictive Analytics · 14-day model',
    view: 'analytics',
    component: 'packed_rbc',
    icon: BrainCircuit,
    color: '#a78bfa',
  },
  {
    id: 'coldchain',
    keywords: ['expiry', 'expiring', 'fifo', 'cold', 'courier', 'ambulance', 'telemetry', '4.2'],
    title: 'FIFO Expiry & 4.2°C Courier Tracker',
    subtitle: 'Expiry & Cold-Chain Logistics view',
    view: 'logistics',
    icon: ThermometerSnowflake,
    color: '#22d3ee',
  },
  {
    id: 'donors',
    keywords: ['donor', 'donors', 'sms', 'whatsapp', 'blast', 'mobilization', 'campaign', 'call'],
    title: 'Regional Donor Registry & Direct Call Hub',
    subtitle: 'Donor Mobilization Hub view',
    view: 'donors',
    icon: Radio,
    color: '#34d399',
  },
  {
    id: 'directory',
    keywords: ['directory', 'facilities', 'hospitals', 'blood bank', 'ranchi'],
    title: 'All 12 Ranchi Facilities Directory',
    subtitle: 'Hospital & Blood Bank Directory view',
    view: 'directory',
    icon: Building2,
    color: '#f43f5e',
  },
];

export default function TopCommandBar({
  activeViewLabel,
  searchQuery,
  setSearchQuery,
  hospitals,
  onSelectHospital,
  onSearchNavigate,
  scenario,
  setScenario,
  scenarios,
  loading,
  notifications,
  onMarkAllRead,
  onOpenCsvModal,
  onOpenSettings,
  onTriggerTrauma,
  onResolveEmergency,
  traumaActive,
  traumaLoading,
  soundEnabled,
  onToggleSound,
  coordinatorName,
  setCoordinatorName,
  coordinatorRole,
  setCoordinatorRole,
  assignedHospitalId,
  setAssignedHospitalId,
  onOpenMobileNav,
  onOpenAuth,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSubBarOpen, setMobileSubBarOpen] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const nodeCount = hospitals.length || 12;
  const isCitizen = coordinatorRole === 'citizen';

  useEffect(() => {
    const handleOutside = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = e => {
      const tag = e.target?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMobileSubBarOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
        setSearchFocused(true);
        return;
      }

      if (e.key === '/' && !isEditable) {
        e.preventDefault();
        setMobileSubBarOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
        setSearchFocused(true);
        return;
      }

      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const trimmed = searchQuery.trim().toLowerCase();
  const matchingHospitals = trimmed
    ? hospitals.filter(
        h =>
          h.name.toLowerCase().includes(trimmed) ||
          h.city.toLowerCase().includes(trimmed) ||
          h.address?.toLowerCase().includes(trimmed) ||
          h.director?.name?.toLowerCase().includes(trimmed)
      )
    : [];

  const matchingBloodGroups = trimmed
    ? BLOOD_GROUPS.filter(
        bg =>
          bg.toLowerCase() === trimmed ||
          bg.toLowerCase().includes(trimmed) ||
          (trimmed.includes('negative') && bg.endsWith('-')) ||
          (trimmed.includes('positive') && bg.endsWith('+'))
      ).slice(0, 4)
    : [];

  const matchingModules =
    trimmed && !isCitizen
      ? MODULE_KEYWORDS.filter(m =>
          m.keywords.some(kw => kw.includes(trimmed) || trimmed.includes(kw))
        )
      : [];

  const totalMatches =
    matchingHospitals.length + matchingBloodGroups.length + matchingModules.length;

  const assignedHospital = hospitals.find(h => h.id === assignedHospitalId) || hospitals[0];

  const roleSubtitle = isCitizen
    ? 'Public Read-Only'
    : coordinatorRole === 'regional'
    ? 'Regional Coordinator'
    : `Admin · ${assignedHospital?.name?.split('(')[0]?.trim() || 'Blood Bank'}`;

  const displayName = isCitizen ? 'Citizen / Patient' : coordinatorName;

  const activeScenarioLabel =
    scenarios.find(s => s.value === scenario)?.label || 'Normal Week';

  return (
    <header className="sticky top-0 z-[100] bg-[#060b19]/95 border-b border-slate-800/90">
      <div className="px-3 md:px-4 lg:px-5 py-2.5 md:py-3 flex flex-wrap xl:flex-nowrap items-center justify-between gap-x-2.5 md:gap-x-3 gap-y-2.5">
        {/* Container 1: Left Navigation Toggle + Mobile Logo / Desktop View Title */}
        <div className="order-1 flex items-center gap-2 md:gap-3 min-w-0 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white cursor-pointer flex-shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>

          {/* Compact Mobile Logo (<768px) */}
          <div className="flex items-center gap-1.5 md:hidden min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border border-rose-500/40 flex-shrink-0"
              style={{
                background: 'linear-gradient(145deg, rgba(225,29,72,0.28), rgba(15,23,42,0.95))',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M16 3C16 3 7 13.4 7 20a9 9 0 0 0 18 0c0-6.6-9-17-9-17Z"
                  fill="#f43f5e"
                />
                <path
                  d="M9.5 20h3.6l2-4.8 2.8 8.4 2-3.6h2.8"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-extrabold tracking-tight text-white truncate">
                Hemo<span className="text-rose-500">Sync</span>
              </span>
              <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25">
                AI
              </span>
            </div>
          </div>

          {/* Desktop View Title (>=768px) */}
          <div className="hidden md:block">
            <h1 className="text-sm font-bold text-white tracking-tight whitespace-nowrap flex items-center gap-2">
              {isCitizen ? 'Public Blood Finder' : activeViewLabel}
              {loading && <RefreshCw size={12} className="text-sky-400 animate-spin" />}
            </h1>
            <p className="text-[11px] text-slate-400 whitespace-nowrap">Ranchi, Jharkhand</p>
          </div>
        </div>

        {/* Collapsible Second Sub-Bar Toggle on Mobile (<768px) */}
        <div className="order-3 w-full md:hidden pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setMobileSubBarOpen(v => !v)}
            aria-expanded={mobileSubBarOpen}
            aria-controls="mobile-search-scenario-subbar"
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-800 text-xs flex items-center justify-between gap-2 text-slate-300 hover:text-white cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0 truncate">
              <Search size={13} className="text-sky-400 flex-shrink-0" />
              <span className="font-semibold text-white truncate">Search &amp; Scenario</span>
              {!isCitizen && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 truncate">
                  {activeScenarioLabel}
                </span>
              )}
            </span>
            <ChevronDown
              size={14}
              className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                mobileSubBarOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Container 2: Search Bar (+ Mobile Scenario Selector inside Collapsible Sub-Bar) */}
        <div
          id="mobile-search-scenario-subbar"
          className={`order-4 w-full md:order-2 md:w-auto md:flex-1 md:max-w-sm 2xl:max-w-md ${
            mobileSubBarOpen ? 'flex flex-col gap-2' : 'hidden'
          } md:block`}
        >
          <div
            ref={searchRef}
            onClick={() => {
              searchInputRef.current?.focus();
              setSearchFocused(true);
            }}
            className="relative w-full cursor-text"
          >
            <div className="relative flex items-center w-full">
              <Search
                size={15}
                className="absolute left-3.5 text-slate-400 pointer-events-none select-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Search RIMS, Bariatu, Dhurwa, O-..."
                aria-label="Global Ranchi hospital, area, and blood group search"
                className="w-full pl-10 pr-16 md:pr-20 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/70 focus:ring-2 focus:ring-rose-500/20 transition-colors"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 w-6 h-6 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-600 flex items-center justify-center cursor-pointer z-10 transition-colors text-xs font-bold"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  ×
                </button>
              ) : (
                <kbd className="hidden md:inline-flex pointer-events-none select-none absolute right-3 items-center px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                  Ctrl+K
                </kbd>
              )}
            </div>

            {searchFocused && trimmed.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl overflow-hidden z-50">
              <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Ranchi Network Instant Search</span>
                <span className="font-mono text-sky-400">{totalMatches} matches</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/70">
                {totalMatches === 0 ? (
                  <div className="px-4 py-5 text-center text-xs text-slate-400">
                    No matching Ranchi facilities, areas, or blood groups for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <>
                    {matchingBloodGroups.map(bg => {
                      const totalBg = hospitals.reduce(
                        (s, h) => s + (h.inventory?.[bg]?.units ?? 0),
                        0
                      );
                      const critHosp = hospitals.filter(
                        h => h.inventory?.[bg]?.status === 'critical'
                      ).length;

                      return (
                        <div
                          key={`bg-${bg}`}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-2 bg-slate-900/70 hover:bg-slate-800/70 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/35 flex items-center justify-center text-rose-400 font-mono text-xs font-bold flex-shrink-0">
                              {bg}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                Blood Group {bg} · {totalBg}u across Ranchi
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {critHosp > 0
                                  ? `${critHosp} critical facilities need ${bg}`
                                  : 'Regional supply adequate'}
                              </p>
                            </div>
                          </div>
                          {!isCitizen && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  onSearchNavigate({ view: 'analytics', bloodGroup: bg });
                                  setSearchFocused(false);
                                }}
                                className="px-2 py-1 rounded-md text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 cursor-pointer"
                              >
                                Forecast
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  onSearchNavigate({ view: 'donors', donorBloodFilter: bg });
                                  setSearchFocused(false);
                                }}
                                className="px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer"
                              >
                                Donors
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {matchingModules.map(mod => {
                      const ModIcon = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onSearchNavigate({
                              view: mod.view,
                              component: mod.component,
                            });
                            setSearchFocused(false);
                          }}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/75 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background: `${mod.color}1c`,
                                border: `1px solid ${mod.color}40`,
                              }}
                            >
                              <ModIcon size={14} style={{ color: mod.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {mod.id === 'directory'
                                  ? `All ${nodeCount} Ranchi Facilities Directory`
                                  : mod.title}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{mod.subtitle}</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
                        </button>
                      );
                    })}

                    {matchingHospitals.map(h => {
                      const sc = STATUS_CONFIG[h.status] || STATUS_CONFIG.safe;
                      return (
                        <div
                          key={h.id}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-800/75 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onSelectHospital(h);
                              setSearchFocused(false);
                            }}
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
                            >
                              <Building2 size={14} style={{ color: sc.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{h.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {h.city} · O-: {h.inventory?.['O-']?.units ?? 0}u
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: sc.bg,
                                color: sc.color,
                                border: `1px solid ${sc.border}`,
                              }}
                            >
                              {sc.shortLabel}
                            </span>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                onSearchNavigate({ view: 'directory', highlightId: h.id });
                                setSearchFocused(false);
                              }}
                              className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                            >
                              Directory
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              </div>
            )}
          </div>

          {/* Mobile Scenario Dropdown & Active Trauma Resolve inside Collapsible Sub-Bar */}
          {!isCitizen && (
            <div className="md:hidden flex items-center gap-2">
              <select
                aria-label="Mobile Forecasting Scenario"
                className="select-dark text-xs py-2 flex-1 min-w-0"
                value={scenario}
                onChange={e => setScenario(e.target.value)}
              >
                {scenarios.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {traumaActive && (
                <button
                  type="button"
                  onClick={onResolveEmergency}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-emerald-200 bg-emerald-600/25 border border-emerald-400/45 cursor-pointer whitespace-nowrap flex-shrink-0"
                >
                  <ShieldCheck size={13} className="text-emerald-300" />
                  <span>Resolve</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Container 3: Action Controls (Compact Mobile Top Row + Full Desktop Controls) */}
        <div className="order-2 md:order-3 flex items-center gap-1.5 md:gap-2.5 flex-nowrap md:flex-wrap xl:flex-nowrap shrink-0">
          {/* Mobile Compact Trauma Alert Icon Button (<768px) */}
          {!isCitizen && (
            <button
              type="button"
              onClick={onTriggerTrauma}
              disabled={traumaLoading}
              aria-label={traumaLoading ? 'Simulating Trauma Emergency' : 'Simulate Trauma Emergency'}
              title="Simulate Trauma Emergency"
              className={`md:hidden p-2 rounded-xl border text-white transition-colors cursor-pointer disabled:opacity-60 flex-shrink-0 ${
                traumaActive
                  ? 'bg-rose-600 border-rose-400 shadow-[0_0_14px_rgba(225,29,72,0.55)]'
                  : 'bg-rose-700/90 hover:bg-rose-600 border-rose-400/40'
              }`}
            >
              <Siren
                size={16}
                className={traumaLoading ? 'animate-spin' : traumaActive ? 'animate-pulse' : ''}
              />
            </button>
          )}

          {isCitizen ? (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
              <ShieldCheck size={14} className="text-emerald-400" />
              Public Read-Only Portal
            </span>
          ) : (
            <div id="tour-top-controls" className="hidden md:flex items-center gap-2.5 flex-wrap xl:flex-nowrap rounded-xl">
              <div className="flex items-center shrink-0">
                <select
                  aria-label="Forecasting Scenario"
                  className="select-dark text-xs py-2 pr-7"
                  value={scenario}
                  onChange={e => setScenario(e.target.value)}
                >
                  {scenarios.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={onOpenCsvModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Upload size={14} className="text-sky-400" />
                <span className="hidden 2xl:inline">Upload Hospital CSV</span>
                <span className="2xl:hidden">CSV Upload</span>
              </button>

              {traumaActive && (
                <button
                  type="button"
                  onClick={onResolveEmergency}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-200 bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/45 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShieldCheck size={14} className="text-emerald-300" />
                  <span>Resolve</span>
                </button>
              )}

              <button
                type="button"
                onClick={onTriggerTrauma}
                disabled={traumaLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border border-rose-400/40 shadow-[0_0_16px_rgba(225,29,72,0.4)] hover:shadow-[0_0_24px_rgba(225,29,72,0.65)] transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <Siren
                  size={14}
                  className={traumaLoading ? 'animate-spin' : traumaActive ? 'animate-pulse' : ''}
                />
                <span>{traumaLoading ? 'Simulating...' : 'Simulate Trauma Emergency'}</span>
              </button>
            </div>
          )}

          {!isCitizen && (
            <>
              <button
                type="button"
                onClick={onOpenSettings}
                title="Command Center & Audio Settings"
                aria-label="Open Settings"
                className="hidden md:inline-flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <Settings size={16} />
              </button>

              <button
                type="button"
                onClick={onToggleSound}
                title={
                  soundEnabled ? 'Alert Chime: On (click to mute)' : 'Alert Chime: Muted (click to unmute)'
                }
                aria-label={soundEnabled ? 'Mute alert sounds' : 'Unmute alert sounds'}
                className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  soundEnabled
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-sky-400 hover:text-sky-300'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <div ref={notifRef} className="hidden md:block relative shrink-0">
                <button
                  type="button"
                  onClick={() => setNotifOpen(v => !v)}
                  className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Open notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 rounded-2xl bg-slate-900 border border-slate-700/85 shadow-2xl overflow-hidden z-50 toast-in">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Ranchi Command Alerts</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {unreadCount} unread
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/70">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No alerts logged yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              if (n.hospitalId) {
                                const found = hospitals.find(h => h.id === n.hospitalId);
                                if (found) onSelectHospital(found);
                              } else if (n.view) {
                                onSearchNavigate({ view: n.view });
                              }
                              setNotifOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-slate-800/60 transition-colors cursor-pointer ${
                              n.read ? 'opacity-65' : 'bg-slate-800/25'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                n.severity === 'critical'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : n.severity === 'warning'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {n.severity === 'critical' ? (
                                <AlertTriangle size={13} />
                              ) : (
                                <Clock size={13} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                {n.message}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500 mt-1">{n.time}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Role Switcher Dropdown (Coordinator / Hospital Admin / Public Citizen) */}
          <div id="tour-role-switcher" ref={profileRef} className="relative pl-1 md:pl-2 md:border-l border-slate-800 shrink-0 rounded-xl">
            <button
              type="button"
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-1.5 md:gap-2 rounded-xl px-1 md:px-2 py-1 hover:bg-slate-900 transition-colors cursor-pointer text-left"
              aria-label="Open role switcher"
            >
              <div className="relative flex-shrink-0">
                {isCitizen ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                    <Users size={15} />
                  </div>
                ) : avatarErr ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-sky-600 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                    AS
                  </div>
                ) : (
                  <img
                    src={COORDINATOR_PROFILE.avatar}
                    alt={displayName}
                    onError={() => setAvatarErr(true)}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700 ring-2 ring-rose-500/25"
                  />
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
              </div>
              <div className="hidden 2xl:block leading-tight">
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  {displayName}
                  <ChevronDown size={12} className="text-slate-400" />
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-[135px]">{roleSubtitle}</p>
              </div>
              <ChevronDown size={12} className="hidden sm:block 2xl:hidden text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 rounded-2xl bg-slate-900 border border-slate-700/85 shadow-2xl overflow-hidden z-50 toast-in p-4 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isCitizen
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                        : 'bg-rose-500/15 border-rose-500/35 text-rose-400'
                    }`}
                  >
                    {isCitizen ? <Users size={18} /> : <UserCog size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-white truncate">{displayName}</p>
                    <p className="text-[11px] text-sky-400">{roleSubtitle}</p>
                    <p className="text-[10px] text-slate-400">
                      Ranchi District Blood Network · Jharkhand
                    </p>
                  </div>
                </div>

                {!isCitizen && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      Coordinator Display Name
                    </label>
                    <input
                      type="text"
                      value={coordinatorName}
                      onChange={e => setCoordinatorName(e.target.value)}
                      placeholder="Enter coordinator name"
                      className="w-full px-3 py-2 rounded-lg text-xs bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-rose-500/60"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Switch Active Portal Role
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCoordinatorRole('regional');
                        setProfileOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        coordinatorRole === 'regional'
                          ? 'bg-rose-500/15 border-rose-500/45 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">Regional Coordinator</p>
                        <p className="text-[10px] text-slate-400">
                          Full Ranchi {nodeCount}-Node Command Center
                        </p>
                      </div>
                      {coordinatorRole === 'regional' && (
                        <Check size={14} className="text-rose-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCoordinatorRole('hospital');
                        setProfileOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        coordinatorRole === 'hospital'
                          ? 'bg-sky-500/15 border-sky-500/45 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">Hospital Blood Bank Admin</p>
                        <p className="text-[10px] text-slate-400">
                          Focused single-facility perspective
                        </p>
                      </div>
                      {coordinatorRole === 'hospital' && (
                        <Check size={14} className="text-sky-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCoordinatorRole('citizen');
                        onSearchNavigate({ view: 'command' });
                        setProfileOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        coordinatorRole === 'citizen'
                          ? 'bg-emerald-500/15 border-emerald-500/45 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">Public Citizen / Patient (Read-Only)</p>
                        <p className="text-[10px] text-slate-400">
                          Find nearby blood stock &amp; register as a donor
                        </p>
                      </div>
                      {coordinatorRole === 'citizen' && (
                        <Check size={14} className="text-emerald-400" />
                      )}
                    </button>
                  </div>

                  {coordinatorRole === 'hospital' && (
                    <div className="pt-1">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                        Assigned Facility
                      </label>
                      <select
                        value={assignedHospitalId}
                        onChange={e => {
                          setAssignedHospitalId(e.target.value);
                          const h = hospitals.find(item => item.id === e.target.value);
                          if (h) onSelectHospital(h);
                        }}
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
                </div>

                {onOpenAuth && (
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut size={14} className="text-rose-400" />
                      <span>Switch Account / Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
