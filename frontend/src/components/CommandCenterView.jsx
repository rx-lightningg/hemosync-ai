import { Siren, PhoneCall } from 'lucide-react';
import KPIBar from './KPIBar';
import HospitalMap from './HospitalMap';
import TransferMatcher from './TransferMatcher';
import ForecastChart from './ForecastChart';
import NearbyDonorsPanel from './NearbyDonorsPanel';

export default function CommandCenterView({
  kpi,
  loading,
  hospitals,
  selectedHospital,
  onSelectHospital,
  activeRoutes,
  sidebarCollapsed,
  transfers,
  approvedIds,
  onApproveTransfer,
  forecast,
  bloodGroup,
  setBloodGroup,
  scenario,
  setScenario,
  scenarios,
  traumaActive,
  traumaIncident,
  onCallDonor,
  criticalThreshold = 15,
  expiryWindowHours = 48,
  compact = false,
  donorsCount = 0,
}) {
  const nodeCount = hospitals.length || 12;

  const urgentHospital =
    traumaIncident?.hospital ||
    hospitals.find(h => h.status === 'critical') ||
    hospitals.find(h => h.id === 'h2') ||
    hospitals[0];
  const urgentBG = traumaIncident?.blood_group || 'O-';

  return (
    <div className={`${compact ? 'space-y-4' : 'space-y-6'} fade-up`}>
      {/* Slide-Open Emergency Last-Resort Nearby Donors Drawer (Hidden by default; opens ONLY on Trauma Emergency) */}
      {traumaActive && urgentHospital && (
        <div className="rounded-2xl border border-rose-500/60 bg-gradient-to-r from-rose-950/75 via-[#170b1a]/95 to-slate-950/95 shadow-[0_0_32px_rgba(225,29,72,0.28)] overflow-hidden fade-up">
          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/25">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/45 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Siren size={17} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500 text-white">
                    CODE RED TRAUMA ACTIVE
                  </span>
                  <span className="text-xs font-bold text-white">
                    {urgentHospital.name} — {urgentBG} Reserve Critical
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Last-resort hyper-local donor call bridge automatically opened below.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectHospital(urgentHospital)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
            >
              <PhoneCall size={13} className="text-emerald-400" />
              Inspect Facility
            </button>
          </div>

          <div className="p-4">
            <NearbyDonorsPanel
              hospital={urgentHospital}
              bloodGroup={urgentBG}
              onCallDonor={onCallDonor}
              refreshKey={donorsCount}
              compact
            />
          </div>
        </div>
      )}

      {/* Layer 1: 4 Clean KPI Cards */}
      <KPIBar
        kpi={kpi}
        loading={loading}
        nodeCount={nodeCount}
        criticalThreshold={criticalThreshold}
        expiryWindowHours={expiryWindowHours}
        compact={compact}
      />

      {/* Layer 2: Live Ranchi Map + Top 3 AI Smart Transfers */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 ${compact ? 'gap-4' : 'gap-4 sm:gap-6'}`}>
        <div
          id="tour-map-section"
          className="lg:col-span-7 rounded-2xl min-w-0 transition-all duration-300"
        >
          <HospitalMap
            hospitals={hospitals}
            loading={loading}
            selectedHospital={selectedHospital}
            onSelectHospital={onSelectHospital}
            activeRoutes={activeRoutes}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>

        <div
          id="tour-transfers-section"
          className="lg:col-span-5 rounded-2xl min-w-0 transition-all duration-300"
        >
          <TransferMatcher
            transfers={transfers}
            approvedIds={approvedIds}
            onApprove={onApproveTransfer}
            loading={loading}
            maxVisible={3}
          />
        </div>
      </div>

      {/* Layer 3: Single Clean 14-Day AI Forecast Card */}
      <div
        id="tour-step-forecast"
        className="rounded-2xl transition-all duration-300"
      >
        <ForecastChart
          forecast={forecast}
          bloodGroup={bloodGroup}
          setBloodGroup={setBloodGroup}
          scenario={scenario}
          setScenario={setScenario}
          scenarios={scenarios}
          height={270}
        />
      </div>
    </div>
  );
}
