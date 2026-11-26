import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchKPI,
  fetchHospitals,
  fetchForecast,
  fetchTransfers,
  approveTransfer,
  requestTransfer,
  simulateTraumaEmergency,
  resolveEmergency,
  uploadInventoryCsv,
  resetDemoState,
  fetchColdChain,
  fetchDonors,
  triggerDonorAlert,
  confirmDonorEnRoute,
  registerVoluntaryDonor,
} from './api';
import {
  SCENARIOS,
  VIEW_META,
  COORDINATOR_PROFILE,
  DEFAULT_SETTINGS,
} from './constants/blood';
import {
  buildLocalHospitals,
  getLocalColdChain,
  getLocalDonors,
  getLocalForecast,
  getLocalKPI,
  getLocalTransfers,
  getStandaloneSnapshot,
  localApproveTransfer,
  localConfirmDonorEnRoute,
  localRegisterDonor,
  localRequestTransfer,
  localResetDemoState,
  localResolveEmergency,
  localSimulateTrauma,
  localTriggerDonorAlert,
  localUploadInventoryCsv,
} from './utils/standaloneEngine.js';
import {
  playAlertSound,
  playEmergencyAlertChime,
  playResolveChime,
} from './utils/sound';
import BackgroundMesh from './components/BackgroundMesh';
import Sidebar from './components/Sidebar';
import TopCommandBar from './components/TopCommandBar';
import CommandCenterView from './components/CommandCenterView';
import CitizenPortalView from './components/CitizenPortalView';
import DirectoryView from './components/DirectoryView';
import AnalyticsView from './components/AnalyticsView';
import ColdChainLogisticsView from './components/ColdChainLogisticsView';
import DonorHubView from './components/DonorHubView';
import HospitalDrawer from './components/HospitalDrawer';
import CsvUploadModal from './components/CsvUploadModal';
import TraumaRerouteModal from './components/TraumaRerouteModal';
import WelcomeModal from './components/WelcomeModal';
import GuidedTourCard from './components/GuidedTourCard';
import SettingsModal from './components/SettingsModal';
import DonorCallModal from './components/DonorCallModal';
import CopilotDrawer from './components/CopilotDrawer';
import AuthModal from './components/AuthModal';
import VoluntaryDonorModal from './components/VoluntaryDonorModal';
import ToastContainer from './components/ToastContainer';

function loadSavedSettings() {
  try {
    const raw = localStorage.getItem('hemosync_settings_v1');
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function buildInitialNotifications(hospitalsList, coldChainData) {
  const alerts = [];
  hospitalsList.forEach(h => {
    Object.entries(h.inventory || {}).forEach(([bg, inv]) => {
      if (inv.status === 'critical') {
        alerts.push({
          id: `crit-${h.id}-${bg}`,
          severity: 'critical',
          title: `Critical ${bg} at ${h.name}`,
          message: `Only ${inv.units} units remaining (${h.city}). AI recommends urgent rebalance.`,
          time: 'Live telemetry',
          hospitalId: h.id,
          read: false,
        });
      }
    });
  });

  if (coldChainData?.summary?.under_24h > 0) {
    alerts.unshift({
      id: 'fifo-24h',
      severity: 'warning',
      title: 'FIFO Expiry Watch (<24h)',
      message: `${coldChainData.summary.under_24h} blood units crossing 24h shelf-life threshold.`,
      time: 'Cold-chain scan',
      view: 'logistics',
      read: false,
    });
  }
  return alerts.slice(0, 8);
}

export default function App() {
  const [activeView, setActiveView] = useState('command');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [scenario, setScenario] = useState('normal');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [analyticsComponent, setAnalyticsComponent] = useState('packed_rbc');
  const [donorBloodFilter, setDonorBloodFilter] = useState('ALL');
  const [highlightedHospitalId, setHighlightedHospitalId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [settings, setSettings] = useState(loadSavedSettings);
  const [initialSnapshot] = useState(() =>
    getStandaloneSnapshot({
      scenario: 'normal',
      bloodGroup: 'O-',
      criticalThreshold: settings.criticalThreshold,
      expiryWindowHours: settings.expiryWindowHours,
    })
  );

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [coordinatorName, setCoordinatorName] = useState(COORDINATOR_PROFILE.name);
  const [coordinatorRole, setCoordinatorRole] = useState('regional'); // 'regional' | 'hospital' | 'citizen'
  const [assignedHospitalId, setAssignedHospitalId] = useState('h1');

  const [kpi, setKpi] = useState(() => initialSnapshot.kpi);
  const [hospitals, setHospitals] = useState(() => initialSnapshot.hospitals);
  const [forecast, setForecast] = useState(() => initialSnapshot.forecast);
  const [transfers, setTransfers] = useState(() => initialSnapshot.transfers);
  const [coldChain, setColdChain] = useState(() => initialSnapshot.coldChain);
  const [donorsData, setDonorsData] = useState(() => initialSnapshot.donorsData);

  const [loading, setLoading] = useState(false);
  const [approvedIds, setApprovedIds] = useState(() => new Set());
  const [alertLoading, setAlertLoading] = useState(false);
  const [lastCampaign, setLastCampaign] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [tourStep, setTourStep] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [donorRegModalOpen, setDonorRegModalOpen] = useState(false);
  const [donorRegDefaultBG, setDonorRegDefaultBG] = useState('O-');
  const [lastRegisteredDonor, setLastRegisteredDonor] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const [drawerHospital, setDrawerHospital] = useState(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [traumaIncident, setTraumaIncident] = useState(null);
  const [traumaLoading, setTraumaLoading] = useState(false);
  const [traumaActive, setTraumaActive] = useState(false);

  const [notifications, setNotifications] = useState(() =>
    buildInitialNotifications(initialSnapshot.hospitals, initialSnapshot.coldChain)
  );
  const [toasts, setToasts] = useState([]);
  const seededNotifRef = useRef(true);

  const isCitizen = coordinatorRole === 'citizen';

  const updateSettings = useCallback(next => {
    setSettings(next);
    try {
      localStorage.setItem('hemosync_settings_v1', JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const addToast = useCallback((title, description, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev.slice(-3), { id, title, description, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushNotification = useCallback(notif => {
    setNotifications(prev => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        read: false,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        ...notif,
      },
      ...prev.slice(0, 14),
    ]);
  }, []);

  const loadAll = useCallback(async () => {
    const thresholdOpts = {
      criticalThreshold: settings.criticalThreshold,
      expiryWindowHours: settings.expiryWindowHours,
    };
    const localOpts = {
      scenario,
      criticalThreshold: settings.criticalThreshold,
      expiryWindowHours: settings.expiryWindowHours,
    };

    try {
      const [k, h, t, cc, d] = await Promise.all([
        fetchKPI(scenario, thresholdOpts),
        fetchHospitals(scenario, thresholdOpts),
        fetchTransfers(scenario, thresholdOpts),
        fetchColdChain(scenario, thresholdOpts),
        fetchDonors(),
      ]);

      const safeHospitals =
        Array.isArray(h) && h.length > 0 ? h : buildLocalHospitals(localOpts);
      const safeColdChain = cc || getLocalColdChain(localOpts);

      setKpi(k || getLocalKPI(localOpts));
      setHospitals(prev => (safeHospitals.length > 0 ? safeHospitals : prev));
      setTransfers(Array.isArray(t) ? t : getLocalTransfers(localOpts));
      setColdChain(safeColdChain);
      setDonorsData(d || getLocalDonors());
      setLastUpdated(new Date());

      setDrawerHospital(prev =>
        prev ? safeHospitals.find(item => item.id === prev.id) || prev : null
      );
      setTraumaIncident(prev =>
        prev?.hospital
          ? {
              ...prev,
              hospital: safeHospitals.find(item => item.id === prev.hospital.id) || prev.hospital,
            }
          : prev
      );

      if (!seededNotifRef.current) {
        seededNotifRef.current = true;
        setNotifications(buildInitialNotifications(safeHospitals, safeColdChain));
      }
    } catch (e) {
      console.warn('API unavailable, falling back to standalone local dataset:', e);
      const localHospitals = buildLocalHospitals(localOpts);
      const localColdChain = getLocalColdChain(localOpts);
      setKpi(getLocalKPI(localOpts));
      setHospitals(prev => (localHospitals.length > 0 ? localHospitals : prev));
      setTransfers(getLocalTransfers(localOpts));
      setColdChain(localColdChain);
      setDonorsData(getLocalDonors());
      setLastUpdated(new Date());

      setDrawerHospital(prev =>
        prev ? localHospitals.find(item => item.id === prev.id) || prev : null
      );
      if (!seededNotifRef.current) {
        seededNotifRef.current = true;
        setNotifications(buildInitialNotifications(localHospitals, localColdChain));
      }
    } finally {
      setLoading(false);
    }
  }, [scenario, settings.criticalThreshold, settings.expiryWindowHours]);

  const loadForecast = useCallback(async () => {
    try {
      const f = await fetchForecast(bloodGroup, scenario);
      setForecast(f || getLocalForecast({ bloodGroup, scenario }));
    } catch (e) {
      console.warn('Forecast API unavailable, using standalone model:', e);
      setForecast(getLocalForecast({ bloodGroup, scenario }));
    }
  }, [bloodGroup, scenario]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (active) await loadAll();
    };
    void run();
    return () => {
      active = false;
    };
  }, [loadAll]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (active) await loadForecast();
    };
    void run();
    return () => {
      active = false;
    };
  }, [loadForecast]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadAll();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadAll]);

  const handleSelectView = useCallback(viewId => {
    setActiveView(viewId);
    setSearchQuery('');
  }, []);

  const handleRoleChange = newRole => {
    setCoordinatorRole(newRole);
    setSearchQuery('');
    if (newRole === 'citizen' && !['command', 'directory'].includes(activeView)) {
      setActiveView('command');
    }
    if (newRole === 'citizen') {
      setTourStep(null);
      setSettingsOpen(false);
      setCsvModalOpen(false);
      setTraumaIncident(null);
    }
  };

  const handleAuthSuccess = ({ mode, name, role, hospitalId }) => {
    if (name) setCoordinatorName(name);
    if (hospitalId) setAssignedHospitalId(hospitalId);
    handleRoleChange(role);
    setActiveView('command');
    setWelcomeOpen(false);
    playResolveChime(soundEnabled, settings.masterVolume);
    const roleLabel =
      role === 'citizen'
        ? 'Public Citizen / Donor'
        : role === 'hospital'
        ? 'Hospital Blood Bank Admin'
        : 'Regional Coordinator';
    addToast(
      mode === 'signup' ? `Account Created — ${name}` : `Signed In as ${name}`,
      `Active Portal Role: ${roleLabel}`,
      'success'
    );
  };

  const handleScenarioChange = newScenario => {
    setScenario(newScenario);
    const snapshot = getStandaloneSnapshot({
      scenario: newScenario,
      bloodGroup,
      criticalThreshold: settings.criticalThreshold,
      expiryWindowHours: settings.expiryWindowHours,
    });
    setKpi(snapshot.kpi);
    setHospitals(prev => (snapshot.hospitals.length > 0 ? snapshot.hospitals : prev));
    setTransfers(snapshot.transfers);
    setColdChain(snapshot.coldChain);
    setForecast(snapshot.forecast);
    if (newScenario === 'dengue') {
      playAlertSound({
        enabled: soundEnabled,
        theme: settings.soundTheme,
        volume: settings.masterVolume,
      });
    }
  };

  const handleSearchNavigate = ({
    view,
    bloodGroup: targetBg,
    component: targetComponent,
    donorBloodFilter: targetDonorBg,
    highlightId,
  }) => {
    if (view) {
      if (isCitizen && !['command', 'directory'].includes(view)) {
        setActiveView('directory');
      } else {
        setActiveView(view);
      }
    }
    setSearchQuery('');
    if (targetBg) setBloodGroup(targetBg);
    if (targetComponent) setAnalyticsComponent(targetComponent);
    if (targetDonorBg) setDonorBloodFilter(targetDonorBg);
    if (highlightId) {
      setHighlightedHospitalId(highlightId);
      setTimeout(() => setHighlightedHospitalId(null), 5000);
    }
  };

  const handleApproveTransfer = async transfer => {
    const payload = {
      from_id: transfer.from_id,
      to_id: transfer.to_id,
      blood_group: transfer.blood_group,
      units: transfer.units,
      priority: transfer.priority,
    };
    let res;
    try {
      res = await approveTransfer(transfer.id, payload);
    } catch {
      res = localApproveTransfer(transfer.id, payload);
    }
    setApprovedIds(prev => new Set([...prev, transfer.id]));
    playResolveChime(soundEnabled, settings.masterVolume);
    addToast(
      `Courier Dispatched (${transfer.units}u ${transfer.blood_group})`,
      `${transfer.from_hospital} → ${transfer.to_hospital}`,
      'success'
    );
    pushNotification({
      severity: 'info',
      title: `Dispatch ${res?.dispatch?.vehicle_id || 'AMB-JH01'} Active`,
      message: `En route: ${transfer.units}u ${transfer.blood_group} from ${transfer.from_hospital} to ${transfer.to_hospital}.`,
      view: 'logistics',
    });
    await loadAll();
  };

  const handleRequestTransfer = async payload => {
    let res;
    try {
      res = await requestTransfer(payload, scenario, {
        criticalThreshold: settings.criticalThreshold,
      });
    } catch {
      res = localRequestTransfer(payload, {
        scenario,
        criticalThreshold: settings.criticalThreshold,
      });
    }
    const d = res?.dispatch;
    playResolveChime(soundEnabled, settings.masterVolume);
    addToast(
      `Transfer Dispatched (${payload.units}u ${payload.blood_group})`,
      d ? `${d.from_hospital} → ${d.to_hospital} (${d.distance_km} km)` : res?.message,
      'success'
    );
    pushNotification({
      severity: 'info',
      title: 'Priority Transfer Active',
      message: res?.message || `Dispatched ${payload.units}u ${payload.blood_group}.`,
      hospitalId: payload.to_id,
    });
    await loadAll();
  };

  const handleDonorAlert = async (bg, options = null) => {
    setAlertLoading(true);
    try {
      let res;
      try {
        res = await triggerDonorAlert(bg, options);
      } catch {
        res = localTriggerDonorAlert(bg, options);
      }
      if (res?.campaign) {
        setLastCampaign(res.campaign);
      }
      playResolveChime(soundEnabled, settings.masterVolume);
      addToast(
        `Emergency ${bg} Donor Blast Sent`,
        `${res.donors_notified} Ranchi donors alerted via ${res.channels?.join(', ')}`,
        'blast'
      );
      pushNotification({
        severity: 'info',
        title: `Donor Blast Dispatched (${bg})`,
        message: `${res.donors_notified} donors notified across Ranchi.`,
        view: 'donors',
      });
      await loadAll();
    } finally {
      setAlertLoading(false);
    }
  };

  const handleConfirmDonorEnRoute = async payload => {
    let res;
    try {
      res = await confirmDonorEnRoute(payload);
    } catch {
      res = localConfirmDonorEnRoute(payload);
    }
    playResolveChime(soundEnabled, settings.masterVolume);
    addToast(
      `Donor En Route (+${payload.units}u ${payload.blood_group})`,
      res?.message,
      'success'
    );
    pushNotification({
      severity: 'info',
      title: `Direct-Call Donor En Route (${payload.blood_group})`,
      message: `${payload.donor_name} confirmed for ${res?.record?.hospital_name || 'Ranchi facility'} (+${payload.units}u incoming).`,
      hospitalId: payload.hospital_id,
    });
    await loadAll();
  };

  const handleRegisterVoluntaryDonor = async payload => {
    let res;
    try {
      res = await registerVoluntaryDonor(payload);
    } catch {
      res = localRegisterDonor(payload);
    }
    if (res?.donor) {
      setLastRegisteredDonor(res.donor);
    }
    playResolveChime(soundEnabled, settings.masterVolume);
    addToast('Voluntary Donor Registered', res?.message, 'success');
    pushNotification({
      severity: 'info',
      title: `New Voluntary Donor (${payload.blood_group})`,
      message: `${payload.name} (${payload.neighborhood}) synced to Regional Registry & Nearby Call queue.`,
      view: 'donors',
    });
    await loadAll();
  };

  const openDonorRegistration = (defaultBg = 'O-') => {
    setDonorRegDefaultBG(defaultBg);
    setDonorRegModalOpen(true);
  };

  const handleSimulateTrauma = async () => {
    setTraumaLoading(true);
    playEmergencyAlertChime(soundEnabled, settings.masterVolume, settings.soundTheme);
    try {
      let res;
      try {
        res = await simulateTraumaEmergency(
          { blood_group: 'O-' },
          scenario,
          { criticalThreshold: settings.criticalThreshold }
        );
      } catch {
        res = localSimulateTrauma(
          { blood_group: 'O-' },
          { scenario, criticalThreshold: settings.criticalThreshold }
        );
      }
      setTraumaActive(true);
      setTraumaIncident(res);
      addToast(
        `CODE RED: ${res.hospital.name}`,
        'O- inventory dropped to 2 units. AI reroute options & nearby donors ready.',
        'critical'
      );
      pushNotification({
        severity: 'critical',
        title: `Trauma Emergency — ${res.hospital.name}`,
        message: 'O- critical drop to 2 units. Immediate reroute recommended.',
        hospitalId: res.hospital.id,
      });
      await Promise.all([loadAll(), loadForecast()]);
    } finally {
      setTraumaLoading(false);
    }
  };

  const handleResolveEmergency = async () => {
    try {
      await resolveEmergency();
    } catch {
      localResolveEmergency();
    }
    setTraumaActive(false);
    setTraumaIncident(null);
    playResolveChime(soundEnabled, settings.masterVolume);
    addToast(
      'Emergency Resolved',
      'Ranchi trauma reserve stabilized and alert status cleared.',
      'success'
    );
    pushNotification({
      severity: 'info',
      title: 'Emergency Protocol Resolved',
      message: 'Hospital O- emergency reserve restored to normal operational status.',
      view: 'command',
    });
    await Promise.all([loadAll(), loadForecast()]);
  };

  const handleCsvImport = async rows => {
    let res;
    try {
      res = await uploadInventoryCsv(rows, scenario);
    } catch {
      res = localUploadInventoryCsv(rows, { scenario });
    }
    const hasCriticalStockout = rows.some(r => r.units < settings.criticalThreshold);
    if (hasCriticalStockout) {
      playEmergencyAlertChime(soundEnabled, settings.masterVolume, settings.soundTheme);
    } else {
      playResolveChime(soundEnabled, settings.masterVolume);
    }
    addToast(
      `CSV Inventory Synced (${res.updated_records} records)`,
      `Updated ${res.facilities_updated?.join(', ')}`,
      hasCriticalStockout ? 'critical' : 'info'
    );
    pushNotification({
      severity: hasCriticalStockout ? 'critical' : 'info',
      title: 'CSV Import Applied',
      message: `${res.updated_records} blood-group records updated live across ${res.facilities_updated?.length || 0} Ranchi facilities.`,
      view: 'directory',
    });
    await Promise.all([loadAll(), loadForecast()]);
  };

  const handlePrioritizeBatch = async batch => {
    const targetHospital =
      hospitals.find(h => h.id !== batch.hospital_id && h.status === 'critical') ||
      hospitals.find(h => h.id !== batch.hospital_id && h.id === 'h2') ||
      hospitals.find(h => h.id !== batch.hospital_id);

    if (!targetHospital) return;
    await handleRequestTransfer({
      from_id: batch.hospital_id,
      to_id: targetHospital.id,
      blood_group: batch.blood_group,
      units: Math.max(1, batch.units),
      priority: batch.bucket === '<24h' ? 'HIGH' : 'MEDIUM',
    });
  };

  const handleResetDemo = async () => {
    try {
      await resetDemoState();
    } catch {
      localResetDemoState();
    }
    setTraumaActive(false);
    setTraumaIncident(null);
    setApprovedIds(new Set());
    setLastCampaign(null);
    setLastRegisteredDonor(null);
    seededNotifRef.current = false;
    playResolveChime(soundEnabled, settings.masterVolume);
    addToast('Baseline Restored', 'Ranchi regional inventory and active transfers reset.', 'info');
    await Promise.all([loadAll(), loadForecast()]);
  };

  const activeRoutes = coldChain?.dispatches || [];
  const activeViewLabel = VIEW_META[activeView] || VIEW_META.command;
  const sidebarBadges = {
    command: kpi?.critical_alerts || 0,
    logistics: coldChain?.batches?.filter(b => b.bucket === '<24h').length || 0,
    donors: donorsData?.campaigns?.length || 0,
  };

  const focusedFacility =
    drawerHospital ||
    (coordinatorRole === 'hospital'
      ? hospitals.find(h => h.id === assignedHospitalId) || null
      : null);

  const isCompact = settings.layoutDensity === 'compact';

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#060B19] network-grid flex text-slate-100">
      {/* Subtle Dark-Mode Medical-Tech Mesh + Animated ECG/Network Background */}
      <BackgroundMesh />

      {/* Foreground App Shell */}
      <div className="relative z-10 flex min-h-screen w-full min-w-0">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeView={activeView}
          onSelectView={handleSelectView}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          badges={sidebarBadges}
          traumaActive={traumaActive}
          onResetDemo={handleResetDemo}
          onOpenOverview={() => setWelcomeOpen(true)}
          onStartTour={() => setTourStep(0)}
          onOpenCsvModal={() => setCsvModalOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          nodeCount={hospitals.length || 12}
          isCitizen={isCitizen}
        />

        {/* Main Content Shell */}
        <div className="flex-1 min-w-0 flex flex-col">
          <TopCommandBar
            activeViewLabel={activeViewLabel}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            hospitals={hospitals}
            onSelectHospital={h => setDrawerHospital(h)}
            onSearchNavigate={handleSearchNavigate}
            scenario={scenario}
            setScenario={handleScenarioChange}
            scenarios={SCENARIOS}
            lastUpdated={lastUpdated}
            loading={loading}
            notifications={notifications}
            onMarkAllRead={() =>
              setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            }
            onOpenCsvModal={() => setCsvModalOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onTriggerTrauma={handleSimulateTrauma}
            onResolveEmergency={handleResolveEmergency}
            traumaActive={traumaActive}
            traumaLoading={traumaLoading}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(v => !v)}
            coordinatorName={coordinatorName}
            setCoordinatorName={setCoordinatorName}
            coordinatorRole={coordinatorRole}
            setCoordinatorRole={handleRoleChange}
            assignedHospitalId={assignedHospitalId}
            setAssignedHospitalId={setAssignedHospitalId}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onOpenAuth={() => setAuthModalOpen(true)}
          />

          <main
            className={`flex-1 w-full max-w-[1640px] mx-auto pb-24 ${
              isCompact ? 'p-3 sm:p-4' : 'p-3 sm:p-5 lg:p-6'
            }`}
          >
            {activeView === 'command' && isCitizen && (
              <CitizenPortalView
                hospitals={hospitals}
                loading={loading}
                selectedHospital={drawerHospital}
                onSelectHospital={h => setDrawerHospital(h)}
                activeRoutes={activeRoutes}
                sidebarCollapsed={sidebarCollapsed}
                onOpenRegisterDonor={openDonorRegistration}
                lastRegisteredDonor={lastRegisteredDonor}
                compact={isCompact}
              />
            )}

            {activeView === 'command' && !isCitizen && (
              <CommandCenterView
                kpi={kpi}
                loading={loading}
                hospitals={hospitals}
                selectedHospital={focusedFacility}
                onSelectHospital={h => setDrawerHospital(h)}
                activeRoutes={activeRoutes}
                sidebarCollapsed={sidebarCollapsed}
                transfers={transfers}
                approvedIds={approvedIds}
                onApproveTransfer={handleApproveTransfer}
                forecast={forecast}
                bloodGroup={bloodGroup}
                setBloodGroup={setBloodGroup}
                scenario={scenario}
                setScenario={handleScenarioChange}
                scenarios={SCENARIOS}
                traumaActive={traumaActive}
                traumaIncident={traumaIncident}
                onCallDonor={ctx => setActiveCall(ctx)}
                criticalThreshold={settings.criticalThreshold}
                expiryWindowHours={settings.expiryWindowHours}
                compact={isCompact}
                donorsCount={donorsData?.donors?.length || 0}
              />
            )}

            {activeView === 'directory' && (
              <DirectoryView
                hospitals={hospitals}
                globalSearch={searchQuery}
                onClearGlobalSearch={() => setSearchQuery('')}
                onSelectHospital={h => setDrawerHospital(h)}
                highlightedHospitalId={highlightedHospitalId}
                compact={isCompact}
                readOnly={isCitizen}
              />
            )}

            {activeView === 'analytics' && !isCitizen && (
              <AnalyticsView
                hospitals={hospitals}
                bloodGroup={bloodGroup}
                setBloodGroup={setBloodGroup}
                scenario={scenario}
                setScenario={handleScenarioChange}
                scenarios={SCENARIOS}
                component={analyticsComponent}
                setComponent={setAnalyticsComponent}
                compact={isCompact}
              />
            )}

            {activeView === 'logistics' && !isCitizen && (
              <ColdChainLogisticsView
                coldChain={coldChain}
                activeRoutes={activeRoutes}
                onPrioritizeBatch={handlePrioritizeBatch}
                compact={isCompact}
              />
            )}

            {activeView === 'donors' && !isCitizen && (
              <DonorHubView
                donorsData={donorsData}
                hospitals={hospitals}
                onSendBlast={handleDonorAlert}
                blastLoading={alertLoading}
                lastCampaign={lastCampaign}
                bloodFilter={donorBloodFilter}
                setBloodFilter={setDonorBloodFilter}
                onCallDonor={ctx => setActiveCall(ctx)}
                onOpenRegisterDonor={openDonorRegistration}
                lastRegisteredDonor={lastRegisteredDonor}
                compact={isCompact}
              />
            )}
          </main>
        </div>
      </div>

      {/* Rich Hospital Slide-Over Drawer */}
      <HospitalDrawer
        key={drawerHospital?.id ? `drawer-${drawerHospital.id}` : 'drawer-closed'}
        hospital={drawerHospital}
        onClose={() => setDrawerHospital(null)}
        onRequestTransfer={handleRequestTransfer}
        onCallDonor={ctx => setActiveCall(ctx)}
        criticalThreshold={settings.criticalThreshold}
        readOnly={isCitizen}
        traumaActive={traumaActive}
        donorsCount={donorsData?.donors?.length || 0}
      />

      {/* Upload Hospital CSV Modal */}
      {!isCitizen && (
        <CsvUploadModal
          open={csvModalOpen}
          onClose={() => setCsvModalOpen(false)}
          onImportRows={handleCsvImport}
        />
      )}

      {/* Instant AI Trauma Reroute Modal */}
      {!isCitizen && (
        <TraumaRerouteModal
          incident={traumaIncident}
          onClose={() => setTraumaIncident(null)}
          onExecuteReroute={handleRequestTransfer}
          onCallDonor={ctx => setActiveCall(ctx)}
        />
      )}

      {/* Dr. Aria Illustrated Welcome Screen */}
      <WelcomeModal
        open={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        onEnterCoordinator={() => {
          handleRoleChange('regional');
          setActiveView('command');
          setWelcomeOpen(false);
        }}
        onEnterCitizen={() => {
          handleRoleChange('citizen');
          setActiveView('command');
          setWelcomeOpen(false);
          setTourStep(0);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onStartTour={() => {
          setActiveView('command');
          setWelcomeOpen(false);
          setTourStep(0);
        }}
        kpi={kpi}
        hospitals={hospitals}
      />

      {/* Role-Based Authentication Portal Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        hospitals={hospitals}
        currentRole={coordinatorRole}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Voluntary Donor Registration Modal (Shared by Citizen Portal & Donor Hub) */}
      <VoluntaryDonorModal
        key={donorRegModalOpen ? `donor-reg-${donorRegDefaultBG}` : 'donor-reg-closed'}
        open={donorRegModalOpen}
        onClose={() => setDonorRegModalOpen(false)}
        defaultBloodGroup={donorRegDefaultBG}
        onRegisterDonor={handleRegisterVoluntaryDonor}
      />

      {/* Dr. Aria Role-Adaptive Multi-Tab Guided Tour Card */}
      <GuidedTourCard
        stepIndex={tourStep}
        onStepChange={setTourStep}
        onFinish={() => setTourStep(null)}
        isCitizen={isCitizen}
        activeView={activeView}
        onSelectView={handleSelectView}
      />

      {/* Command Center Settings & Audio Sound Engine Modal */}
      {!isCitizen && (
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(v => !v)}
        />
      )}

      {/* Live Emergency Dispatch Call Modal */}
      {!isCitizen && (
        <DonorCallModal
          key={activeCall?.donor?.id ? `call-${activeCall.donor.id}` : 'call-idle'}
          callContext={activeCall}
          onClose={() => setActiveCall(null)}
          onConfirmEnRoute={handleConfirmDonorEnRoute}
          soundEnabled={soundEnabled}
          masterVolume={settings.masterVolume}
        />
      )}

      {/* Floating HemoSync AI Copilot Button & Slide-Over Chat Drawer */}
      <CopilotDrawer
        liveContext={{
          hospitals,
          kpi,
          transfers,
          approvedIds,
          coldChain,
          donorsData,
          scenario,
          traumaActive,
          criticalThreshold: settings.criticalThreshold,
          expiryWindowHours: settings.expiryWindowHours,
        }}
        geminiApiKey={settings.geminiApiKey}
        onExecuteTransfer={handleRequestTransfer}
        onBroadcastDonorAlert={handleDonorAlert}
        onInspectHospital={h => setDrawerHospital(h)}
        onNavigateView={(view, bg) =>
          handleSearchNavigate({
            view,
            donorBloodFilter: bg,
            bloodGroup: bg,
          })
        }
        readOnly={isCitizen}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
