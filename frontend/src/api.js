import {
  buildLocalHospitals,
  getLocalColdChain,
  getLocalDonors,
  getLocalForecast,
  getLocalKPI,
  getLocalNearbyDonors,
  getLocalTransfers,
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

const BASE = '/api';
const REQUEST_TIMEOUT_MS = 2500;

async function requestWithFallback(url, options = {}, fallbackFn, validateFn = null) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;

  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller?.signal,
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Request failed: ${res.status}`);
    }
    const data = await res.json();
    if (validateFn && !validateFn(data)) {
      throw new Error('Invalid or empty API payload');
    }
    return data;
  } catch {
    return fallbackFn();
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function fetchKPI(
  scenario = 'normal',
  { criticalThreshold = 15, expiryWindowHours = 48 } = {}
) {
  const params = new URLSearchParams({
    scenario,
    critical_threshold: String(criticalThreshold),
    expiry_window_hours: String(expiryWindowHours),
  });
  return requestWithFallback(
    `${BASE}/kpi?${params.toString()}`,
    {},
    () => getLocalKPI({ scenario, criticalThreshold, expiryWindowHours }),
    data => data && typeof data.total_units === 'number'
  );
}

export function fetchHospitals(
  scenario = 'normal',
  { criticalThreshold = 15, expiryWindowHours = 48 } = {}
) {
  const params = new URLSearchParams({
    scenario,
    critical_threshold: String(criticalThreshold),
    expiry_window_hours: String(expiryWindowHours),
  });
  return requestWithFallback(
    `${BASE}/hospitals?${params.toString()}`,
    {},
    () => buildLocalHospitals({ scenario, criticalThreshold, expiryWindowHours }),
    data => Array.isArray(data) && data.length > 0
  );
}

export function fetchForecast(
  bloodGroup = 'O-',
  scenario = 'normal',
  { component = 'packed_rbc', surgicalLoadPct = 0, seasonalSpikePct = 0 } = {}
) {
  const params = new URLSearchParams({
    blood_group: bloodGroup,
    scenario,
    component,
    surgical_load_pct: String(surgicalLoadPct),
    seasonal_spike_pct: String(seasonalSpikePct),
  });
  return requestWithFallback(
    `${BASE}/forecast?${params.toString()}`,
    {},
    () =>
      getLocalForecast({
        bloodGroup,
        scenario,
        component,
        surgicalLoadPct,
        seasonalSpikePct,
      }),
    data => data && Array.isArray(data.days) && data.days.length > 0
  );
}

export function fetchTransfers(scenario = 'normal', { criticalThreshold = 15 } = {}) {
  const params = new URLSearchParams({
    scenario,
    critical_threshold: String(criticalThreshold),
  });
  return requestWithFallback(
    `${BASE}/transfers?${params.toString()}`,
    {},
    () => getLocalTransfers({ scenario, criticalThreshold }),
    data => Array.isArray(data)
  );
}

export function approveTransfer(transferId, payload = null) {
  return requestWithFallback(
    `${BASE}/transfers/${encodeURIComponent(transferId)}/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
    },
    () => localApproveTransfer(transferId, payload)
  );
}

export function requestTransfer(payload, scenario = 'normal', { criticalThreshold = 15 } = {}) {
  const params = new URLSearchParams({
    scenario,
    critical_threshold: String(criticalThreshold),
  });
  return requestWithFallback(
    `${BASE}/transfers/request?${params.toString()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => localRequestTransfer(payload, { scenario, criticalThreshold })
  );
}

export function simulateTraumaEmergency(
  payload = {},
  scenario = 'normal',
  { criticalThreshold = 15 } = {}
) {
  const params = new URLSearchParams({
    scenario,
    critical_threshold: String(criticalThreshold),
  });
  return requestWithFallback(
    `${BASE}/simulate-trauma?${params.toString()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => localSimulateTrauma(payload, { scenario, criticalThreshold }),
    data => data && data.hospital && Array.isArray(data.reroute_options)
  );
}

export function uploadInventoryCsv(rows, scenario = 'normal') {
  return requestWithFallback(
    `${BASE}/inventory/csv?scenario=${encodeURIComponent(scenario)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    },
    () => localUploadInventoryCsv(rows, { scenario }),
    data => data && data.success
  );
}

export function resetDemoState() {
  return requestWithFallback(
    `${BASE}/demo/reset`,
    { method: 'POST' },
    () => localResetDemoState()
  );
}

export function resolveEmergency() {
  return requestWithFallback(
    `${BASE}/resolve-emergency`,
    { method: 'POST' },
    () => localResolveEmergency()
  );
}

export function fetchColdChain(
  scenario = 'normal',
  { criticalThreshold = 15, expiryWindowHours = 48 } = {}
) {
  const params = new URLSearchParams({
    scenario,
    critical_threshold: String(criticalThreshold),
    expiry_window_hours: String(expiryWindowHours),
  });
  return requestWithFallback(
    `${BASE}/cold-chain?${params.toString()}`,
    {},
    () => getLocalColdChain({ scenario, criticalThreshold, expiryWindowHours }),
    data => data && Array.isArray(data.batches)
  );
}

export function fetchDonors() {
  return requestWithFallback(
    `${BASE}/donors`,
    {},
    () => getLocalDonors(),
    data => data && Array.isArray(data.donors) && data.donors.length > 0
  );
}

export function fetchNearbyDonors(hospitalId = 'h2', bloodGroup = 'O-', maxKm = 3.0) {
  const params = new URLSearchParams({
    hospital_id: hospitalId,
    blood_group: bloodGroup,
    max_km: String(maxKm),
  });
  return requestWithFallback(
    `${BASE}/donors/nearby?${params.toString()}`,
    {},
    () => getLocalNearbyDonors({ hospitalId, bloodGroup, maxKm }),
    data => data && Array.isArray(data.donors) && data.donors.length > 0
  );
}

export function confirmDonorEnRoute(payload) {
  return requestWithFallback(
    `${BASE}/donors/confirm-en-route`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => localConfirmDonorEnRoute(payload)
  );
}

export function registerVoluntaryDonor(payload) {
  return requestWithFallback(
    `${BASE}/donors/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => localRegisterDonor(payload),
    data => data && data.donor
  );
}

export function triggerDonorAlert(bloodGroup, options = null) {
  const params = new URLSearchParams({ blood_group: bloodGroup });
  return requestWithFallback(
    `${BASE}/donor-alert?${params.toString()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: options ? JSON.stringify({ blood_group: bloodGroup, ...options }) : undefined,
    },
    () => localTriggerDonorAlert(bloodGroup, options)
  );
}
