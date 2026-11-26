import {
  LayoutDashboard,
  Building2,
  BrainCircuit,
  ThermometerSnowflake,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Sparkles,
  Droplets,
  Compass,
  Upload,
  Settings,
  X,
} from 'lucide-react';

function MedicalPulseLogo({ collapsed }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="relative flex-shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-rose-500/40"
          style={{
            background: 'linear-gradient(145deg, rgba(225,29,72,0.28), rgba(15,23,42,0.95))',
          }}
        >
          <svg width="19" height="19" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M16 3C16 3 7 13.4 7 20a9 9 0 0 0 18 0c0-6.6-9-17-9-17Z"
              fill="url(#hemoDropGrad)"
              stroke="#fb7185"
              strokeWidth="1.4"
            />
            <path
              d="M9.5 20h3.6l2-4.8 2.8 8.4 2-3.6h2.8"
              stroke="#ffffff"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="hemoDropGrad" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f43f5e" />
                <stop offset="1" stopColor="#9f1239" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-[0_0_8px_#34d399]" />
      </div>

      {!collapsed && (
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-extrabold tracking-tight text-white">
              Hemo<span className="text-rose-500">Sync</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25">
              AI
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">Ranchi Blood Grid</p>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  activeView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  badges = {},
  traumaActive,
  onResetDemo,
  onOpenOverview,
  onStartTour,
  onOpenCsvModal,
  onOpenSettings,
  nodeCount = 12,
  isCitizen = false,
}) {
  const adminNavViews = [
    { id: 'command', label: 'Command Center', icon: LayoutDashboard },
    { id: 'directory', label: 'Hospital Directory', icon: Building2 },
    { id: 'analytics', label: 'AI Analytics', icon: BrainCircuit },
    { id: 'logistics', label: 'Cold-Chain & Expiry', icon: ThermometerSnowflake },
    { id: 'donors', label: 'Donor Hub', icon: Radio },
  ];

  const citizenNavViews = [
    { id: 'command', label: 'Blood Finder', icon: Droplets },
    { id: 'directory', label: 'Hospital Directory', icon: Building2 },
  ];

  const navViews = isCitizen ? citizenNavViews : adminNavViews;

  const sidebarContent = (isMobile = false) => {
    const isSlim = collapsed && !isMobile;

    return (
      <div className="flex flex-col h-full bg-[#060b19] border-r border-slate-800/90 select-none">
        {/* Top Logo + Collapse */}
        <div
          className={`px-3.5 py-4 border-b border-slate-800/75 flex items-center ${
            isSlim ? 'justify-center flex-col gap-2.5' : 'justify-between'
          }`}
        >
          <MedicalPulseLogo collapsed={isSlim} />
          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/80 transition-all cursor-pointer"
              title={isSlim ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSlim ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSlim ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>

        {/* Clean Live Status Pill */}
        <div className="px-3 pt-4 pb-2">
          <div
            className={`rounded-xl border transition-all ${
              isCitizen
                ? 'bg-emerald-950/35 border-emerald-500/30'
                : traumaActive
                ? 'bg-rose-950/50 border-rose-500/40'
                : 'bg-emerald-950/30 border-emerald-500/25'
            } ${isSlim ? 'p-2 flex justify-center' : 'px-3 py-2'}`}
            title={
              isCitizen
                ? `Public Read-Only Portal · ${nodeCount} Nodes`
                : traumaActive
                ? 'Trauma Surge Protocol Active'
                : `System Online · ${nodeCount}/${nodeCount} Nodes`
            }
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  !isCitizen && traumaActive
                    ? 'bg-rose-500 animate-ping'
                    : 'bg-emerald-400'
                }`}
              />
              {!isSlim && (
                <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase truncate ${
                      !isCitizen && traumaActive ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isCitizen ? 'Public Portal' : traumaActive ? 'Trauma Alert' : 'System Live'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{nodeCount} Nodes</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean Minimalist Navigation Links */}
        <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto" aria-label="Primary Navigation">
          {navViews.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const badgeVal = isCitizen ? 0 : badges[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id);
                  if (isMobile) onCloseMobile();
                }}
                title={isSlim ? item.label : undefined}
                className={`w-full group flex items-center gap-3 rounded-xl transition-all duration-200 text-left relative cursor-pointer ${
                  isSlim ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-600/20 via-rose-600/10 to-transparent text-white border border-rose-500/35'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-rose-500" />
                )}
                <Icon
                  size={17}
                  className={`flex-shrink-0 ${
                    isActive ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!isSlim && (
                  <span
                    className={`text-xs font-semibold truncate flex-1 ${
                      isActive ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {item.label}
                  </span>
                )}

                {badgeVal > 0 && (
                  <span
                    className={`${
                      isSlim ? 'absolute top-1 right-1' : ''
                    } text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      item.id === 'command' || item.id === 'logistics'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                    }`}
                  >
                    {badgeVal}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Clean Actions */}
        <div className="p-3 border-t border-slate-800/75 space-y-2">
          {onStartTour && (
            <button
              type="button"
              onClick={() => {
                onStartTour();
                if (isMobile) onCloseMobile();
              }}
              title="Start Dr. Aria Guided Tour"
              className={`w-full flex items-center gap-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all cursor-pointer ${
                isSlim ? 'justify-center p-2.5' : 'px-3 py-2.5'
              }`}
            >
              <Compass size={14} className="text-emerald-400 flex-shrink-0" />
              {!isSlim && <span>Tour Guide</span>}
            </button>
          )}

          {onOpenOverview && (
            <button
              type="button"
              onClick={() => {
                onOpenOverview();
                if (isMobile) onCloseMobile();
              }}
              title="Project Overview & Welcome Screen"
              className={`w-full flex items-center gap-2 rounded-xl text-xs font-semibold text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 transition-all cursor-pointer ${
                isSlim ? 'justify-center p-2.5' : 'px-3 py-2.5'
              }`}
            >
              <Sparkles size={14} className="text-sky-400 flex-shrink-0" />
              {!isSlim && <span>Project Overview</span>}
            </button>
          )}

          {isMobile && !isCitizen && onOpenCsvModal && (
            <button
              type="button"
              onClick={() => {
                onOpenCsvModal();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2 rounded-xl text-xs font-semibold text-sky-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors px-3 py-2.5 cursor-pointer"
            >
              <Upload size={14} className="text-sky-400 flex-shrink-0" />
              <span>Upload Hospital CSV</span>
            </button>
          )}

          {isMobile && !isCitizen && onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                onOpenSettings();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors px-3 py-2.5 cursor-pointer"
            >
              <Settings size={14} className="text-slate-400 flex-shrink-0" />
              <span>Command Settings</span>
            </button>
          )}

          {!isCitizen && (
            <button
              type="button"
              onClick={() => {
                onResetDemo();
                if (isMobile) onCloseMobile();
              }}
              title="Reset Simulation Overrides"
              className={`w-full flex items-center gap-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800/80 transition-all cursor-pointer ${
                isSlim ? 'justify-center p-2.5' : 'px-3 py-2.5'
              }`}
            >
              <RotateCcw size={13} />
              {!isSlim && <span>Reset Baseline Data</span>}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <aside
        className={`hidden lg:block sticky top-0 h-screen flex-shrink-0 z-40 transition-all duration-300 ease-out ${
          collapsed ? 'w-[68px]' : 'w-56'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[1200] lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 slide-in">
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
