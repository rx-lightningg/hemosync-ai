import { BLOOD_GROUPS } from '../constants/blood.js';
import {
  DONOR_ZONE_COORDS,
  INITIAL_BASE_INVENTORY,
  INITIAL_COLD_CHAIN_7D_UNITS,
  INITIAL_DONOR_POOL,
  INITIAL_HOSPITALS,
  LOCAL_DONOR_FIRST_NAMES,
  LOCAL_DONOR_LAST_NAMES,
} from '../data/ranchiDataset.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const HOSPITAL_MAP = Object.fromEntries(INITIAL_HOSPITALS.map(h => [h.id, h]));

const COMPONENT_PROFILES = {
  packed_rbc: {
    label: 'Packed Red Blood Cells (PRBC)',
    inv_factor: 1.0,
    demand_factor: 1.0,
    shelf_life: '42 days (2–6°C)',
    dengue_boost: 1.0,
    daily_expiry_loss: 0.015,
  },
  platelets: {
    label: 'Platelets (SDP / RDP)',
    inv_factor: 0.42,
    demand_factor: 0.72,
    shelf_life: '5 days (20–24°C agitated)',
    dengue_boost: 1.65,
    daily_expiry_loss: 0.14,
  },
  plasma: {
    label: 'Fresh Frozen Plasma (FFP)',
    inv_factor: 0.78,
    demand_factor: 0.65,
    shelf_life: '12 months (-30°C)',
    dengue_boost: 1.15,
    daily_expiry_loss: 0.005,
  },
};

const DAILY_USAGE = {
  'O-': 18,
  'O+': 22,
  'A-': 10,
  'A+': 20,
  'B-': 8,
  'B+': 18,
  'AB-': 4,
  'AB+': 12,
};

function createSeededRng(seedInput) {
  let seed = 0;
  const text = String(seedInput);
  for (let i = 0; i < text.length; i += 1) {
    seed = (Math.imul(31, seed) + text.charCodeAt(i)) | 0;
  }
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function facilitySeed(hospitalId) {
  let sum = 0;
  for (let i = 0; i < hospitalId.length; i += 1) {
    sum += (i + 1) * hospitalId.charCodeAt(i);
  }
  return sum;
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

export function classifyStatus(units, criticalThreshold = 15) {
  const lowCeiling = Math.max(criticalThreshold + 18, 35);
  if (units < criticalThreshold) return 'critical';
  if (units < lowCeiling) return 'low';
  return 'safe';
}

export function getHospitalStatus(inventory) {
  let criticalCount = 0;
  let lowCount = 0;
  for (const item of Object.values(inventory || {})) {
    if (item.status === 'critical') criticalCount += 1;
    else if (item.status === 'low') lowCount += 1;
  }
  if (criticalCount >= 2) return 'critical';
  if (criticalCount >= 1 || lowCount >= 3) return 'low';
  return 'safe';
}

function formatMonthDay(date) {
  return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}`;
}

function formatMonthDayTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${formatMonthDay(date)}, ${hh}:${mm}`;
}

function formatTimeHMS(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatCompactHMS(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}${mm}${ss}`;
}

function createSeedDispatch() {
  const fromH = HOSPITAL_MAP.h1;
  const toH = HOSPITAL_MAP.h6;
  const dist = haversineKm(fromH.lat, fromH.lng, toH.lat, toH.lng);
  return {
    dispatch_id: 'DSP-9041',
    transfer_id: 'seed-h1-h6-O+',
    vehicle_id: 'AMB-JH01-04',
    courier_name: 'Ranchi Cold-Chain Rapid Unit 04',
    driver: 'Rajesh Mahato',
    blood_group: 'O+',
    units: 12,
    from_id: fromH.id,
    from_hospital: fromH.name,
    from_lat: fromH.lat,
    from_lng: fromH.lng,
    to_id: toH.id,
    to_hospital: toH.name,
    to_lat: toH.lat,
    to_lng: toH.lng,
    distance_km: dist,
    temp_c: 4.2,
    eta_seconds: 16 * 60 + 25,
    total_seconds: 24 * 60,
    status: 'in_transit',
    priority: 'MEDIUM',
    dispatched_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  };
}

// Live standalone in-memory operational state (mirrors FastAPI operational state)
const standaloneState = {
  transferLog: [],
  inventoryOverrides: {},
  absoluteOverrides: {},
  traumaOverrides: {},
  activeDispatches: [createSeedDispatch()],
  donorCampaigns: [],
  enRouteDonors: [],
  registeredDonors: [],
};

function generateBaseInventory(
  hospitalId,
  scenario = 'normal',
  criticalThreshold = 15,
  expiryWindowHours = 48
) {
  const baseMap = INITIAL_BASE_INVENTORY[hospitalId] || {};
  const windowMult = expiryWindowHours <= 24 ? 0.55 : expiryWindowHours >= 72 ? 1.45 : 1.0;

  const inventory = {};
  for (const bg of BLOOD_GROUPS) {
    const [rawUnits = 0, rawExpiring = 0] = baseMap[bg] || [0, 0];
    let units = rawUnits;

    if (units > 0 && scenario === 'holiday') {
      units = Math.max(2, Math.floor(units * 0.55));
    } else if (units > 0 && scenario === 'dengue') {
      if (bg === 'O+' || bg === 'O-' || bg === 'A+') {
        units = Math.max(2, Math.floor(units * 0.3));
      } else {
        units = Math.floor(units * 1.1);
      }
    }

    const status = classifyStatus(units, criticalThreshold);
    const expiringSoon = Math.min(units, Math.max(0, Math.round(rawExpiring * windowMult)));
    inventory[bg] = {
      units,
      status,
      expiring_48h: expiringSoon,
    };
  }
  return inventory;
}

export function buildLocalHospitals({
  scenario = 'normal',
  criticalThreshold = 15,
  expiryWindowHours = 48,
} = {}) {
  return INITIAL_HOSPITALS.map(h => {
    const inv = generateBaseInventory(h.id, scenario, criticalThreshold, expiryWindowHours);

    const absMap = standaloneState.absoluteOverrides[h.id];
    if (absMap) {
      for (const [bg, override] of Object.entries(absMap)) {
        if (inv[bg]) {
          inv[bg].units = Math.max(0, Number.parseInt(override.units, 10) || 0);
          if (override.expiring_48h !== undefined && override.expiring_48h !== null) {
            inv[bg].expiring_48h = Math.max(
              0,
              Math.min(inv[bg].units, Number.parseInt(override.expiring_48h, 10) || 0)
            );
          } else {
            inv[bg].expiring_48h = Math.min(inv[bg].expiring_48h, inv[bg].units);
          }
          inv[bg].status = classifyStatus(inv[bg].units, criticalThreshold);
        }
      }
    }

    const traumaMap = standaloneState.traumaOverrides[h.id];
    if (traumaMap) {
      for (const [bg, override] of Object.entries(traumaMap)) {
        if (inv[bg]) {
          inv[bg].units = Math.max(0, Number.parseInt(override.units, 10) || 0);
          inv[bg].expiring_48h = 0;
          inv[bg].status = classifyStatus(inv[bg].units, criticalThreshold);
        }
      }
    }

    const deltaMap = standaloneState.inventoryOverrides[h.id];
    if (deltaMap) {
      for (const [bg, delta] of Object.entries(deltaMap)) {
        if (inv[bg]) {
          inv[bg].units = Math.max(0, inv[bg].units + delta);
          inv[bg].expiring_48h = Math.min(inv[bg].expiring_48h, inv[bg].units);
          inv[bg].status = classifyStatus(inv[bg].units, criticalThreshold);
        }
      }
    }

    const status = getHospitalStatus(inv);
    const totalUsed = Object.values(inv).reduce((sum, item) => sum + item.units, 0);
    const incomingDonors = standaloneState.enRouteDonors.filter(d => d.hospital_id === h.id);

    return {
      ...h,
      director: { ...h.director },
      status,
      inventory: inv,
      cold_storage_used: totalUsed,
      incoming_donors: incomingDonors.map(d => ({ ...d })),
    };
  });
}

export function getLocalKPI({
  scenario = 'normal',
  criticalThreshold = 15,
  expiryWindowHours = 48,
} = {}) {
  const hospitalsData = buildLocalHospitals({ scenario, criticalThreshold, expiryWindowHours });
  let totalUnits = 0;
  let criticalAlerts = 0;
  let expiringSoon = 0;

  for (const h of hospitalsData) {
    for (const data of Object.values(h.inventory)) {
      totalUnits += data.units;
      if (data.status === 'critical') criticalAlerts += 1;
      expiringSoon += data.expiring_48h;
    }
  }

  const activeTransfers = standaloneState.activeDispatches.filter(
    d => d.status === 'in_transit'
  ).length;

  return {
    total_units: totalUnits,
    critical_alerts: criticalAlerts,
    expiring_soon_units: expiringSoon,
    active_transfers: activeTransfers,
    dispatched_session: standaloneState.transferLog.length,
    nodes: hospitalsData.length,
    en_route_donors: standaloneState.enRouteDonors.length,
  };
}

export function getLocalForecast({
  bloodGroup = 'O-',
  scenario = 'normal',
  component = 'packed_rbc',
  surgicalLoadPct = 0,
  seasonalSpikePct = 0,
  hospitalsOverride = null,
} = {}) {
  const today = new Date();
  const days = [];
  const current = [];
  const predictedDemand = [];
  const confidenceLow = [];
  const confidenceHigh = [];
  let shortageDay = null;

  const hospitalsData =
    Array.isArray(hospitalsOverride) && hospitalsOverride.length > 0
      ? hospitalsOverride
      : buildLocalHospitals({ scenario });

  const totalInv = hospitalsData.reduce(
    (sum, h) => sum + (h.inventory?.[bloodGroup]?.units ?? 0),
    0
  );

  const comp = COMPONENT_PROFILES[component] || COMPONENT_PROFILES.packed_rbc;
  const baseUsage = (DAILY_USAGE[bloodGroup] || 15) * comp.demand_factor;

  const scenarioProfiles = {
    normal: { usage_mult: 1.0, replenish_rate: 0.7 },
    holiday: { usage_mult: 0.7, replenish_rate: 0.4 },
    dengue: {
      usage_mult:
        (['O+', 'O-', 'A+'].includes(bloodGroup) ? 1.8 : 1.0) * comp.dengue_boost,
      replenish_rate: 0.5,
    },
  };
  const s = scenarioProfiles[scenario] || scenarioProfiles.normal;

  const surgicalMult = Math.max(0.5, 1.0 + surgicalLoadPct / 100.0);
  const seasonalMult = Math.max(0.8, 1.0 + seasonalSpikePct / 100.0);
  const effectiveUsageMult = s.usage_mult * surgicalMult * seasonalMult;

  let runningInv = totalInv * comp.inv_factor;
  const rng = createSeededRng(
    `${bloodGroup}|${scenario}|${component}|${surgicalLoadPct}|${seasonalSpikePct}`
  );

  for (let i = 0; i < 14; i += 1) {
    const day = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    days.push(formatMonthDay(day));

    const usage = baseUsage * effectiveUsageMult;
    const weekday = day.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = weekday === 0 || weekday === 6;
    const replenish = baseUsage * s.replenish_rate * (isWeekend ? 0.5 : 1.0);

    const expiryWastage = runningInv * comp.daily_expiry_loss;
    const noise = rng() * 3.0 - 1.5;
    runningInv = Math.max(0, runningInv - usage - expiryWastage + replenish + noise);

    const demandVal = Math.round(usage * (1 + 0.03 * i));
    const invVal = Math.round(runningInv);
    const spread = Math.max(3, Math.round(invVal * (0.04 + 0.012 * i)));

    current.push(invVal);
    predictedDemand.push(demandVal);
    confidenceLow.push(Math.max(0, invVal - spread));
    confidenceHigh.push(invVal + spread);

    if (runningInv < 20 && shortageDay === null) {
      shortageDay = i;
    }
  }

  const avgDailyDemand = Math.max(
    1,
    Math.round(predictedDemand.reduce((a, b) => a + b, 0) / predictedDemand.length)
  );
  const startingUnits = Math.round(totalInv * comp.inv_factor);
  const daysOfSupply = Number((startingUnits / avgDailyDemand).toFixed(1));

  return {
    days,
    current_inventory: current,
    predicted_demand: predictedDemand,
    confidence_low: confidenceLow,
    confidence_high: confidenceHigh,
    shortage_day_index: shortageDay,
    shortage_day_label: shortageDay !== null ? days[shortageDay] : null,
    blood_group: bloodGroup,
    scenario,
    component,
    component_label: comp.label,
    shelf_life: comp.shelf_life,
    starting_units: startingUnits,
    avg_daily_demand: avgDailyDemand,
    days_of_supply: daysOfSupply,
    surgical_load_pct: surgicalLoadPct,
    seasonal_spike_pct: seasonalSpikePct,
  };
}

export function getLocalTransfers({ scenario = 'normal', criticalThreshold = 15 } = {}) {
  const recommendations = [];
  const hospitalsData = buildLocalHospitals({ scenario, criticalThreshold });

  for (const h of hospitalsData) {
    for (const [bg, invData] of Object.entries(h.inventory)) {
      if (invData.status !== 'critical') continue;

      let bestDonor = null;
      let bestScore = -1;
      for (const dh of hospitalsData) {
        if (dh.id === h.id) continue;
        const donorInv = dh.inventory?.[bg] || {};
        const unitsAvail = donorInv.units || 0;
        if (donorInv.status === 'safe' && unitsAvail > bestScore) {
          bestScore = unitsAvail;
          bestDonor = dh;
        }
      }

      if (bestDonor) {
        const transferUnits = Math.min(15, Math.max(5, Math.floor(bestScore / 4)));
        const expiring = bestDonor.inventory[bg].expiring_48h;
        const priority =
          invData.units < Math.max(8, Math.floor(criticalThreshold / 2)) ? 'HIGH' : 'MEDIUM';
        const dist = haversineKm(bestDonor.lat, bestDonor.lng, h.lat, h.lng);

        recommendations.push({
          id: `${bestDonor.id}-${h.id}-${bg}`,
          blood_group: bg,
          from_hospital: bestDonor.name,
          from_id: bestDonor.id,
          from_lat: bestDonor.lat,
          from_lng: bestDonor.lng,
          to_hospital: h.name,
          to_id: h.id,
          to_lat: h.lat,
          to_lng: h.lng,
          distance_km: dist,
          eta_minutes: Math.max(7, Math.round(dist * 2.3 + 4)),
          units: transferUnits,
          expiring_units: expiring,
          priority,
          reason:
            `${invData.units} units remaining — critically low` +
            (expiring > 0 ? `, ${expiring} expiring in <48h` : ''),
          status: 'pending',
        });
      }
    }
  }

  recommendations.sort((a, b) => {
    const pDiff = (a.priority === 'HIGH' ? 0 : 1) - (b.priority === 'HIGH' ? 0 : 1);
    if (pDiff !== 0) return pDiff;
    return b.expiring_units - a.expiring_units;
  });
  return recommendations.slice(0, 10);
}

function createLocalDispatch(fromId, toId, bg, units, transferId, priority = 'HIGH') {
  const fromH = HOSPITAL_MAP[fromId];
  const toH = HOSPITAL_MAP[toId];
  if (!fromH || !toH) return null;

  standaloneState.inventoryOverrides[fromId] ||= {};
  standaloneState.inventoryOverrides[toId] ||= {};
  standaloneState.inventoryOverrides[fromId][bg] =
    (standaloneState.inventoryOverrides[fromId][bg] || 0) - units;
  standaloneState.inventoryOverrides[toId][bg] =
    (standaloneState.inventoryOverrides[toId][bg] || 0) + units;

  const dist = Math.max(1.6, haversineKm(fromH.lat, fromH.lng, toH.lat, toH.lng));
  const etaMins = Math.max(7, Math.round(dist * 2.3 + 4));
  const totalSecs = etaMins * 60;
  const count = standaloneState.activeDispatches.length;
  const vehNum = 10 + (count % 85);
  const drivers = ['Vikram Oraon', 'Arjun Munda', 'Deepak Verma', 'Sandeep Tirkey'];

  const dispatch = {
    dispatch_id: `DSP-${9041 + count + 1}`,
    transfer_id: transferId,
    vehicle_id: `AMB-JH01-${vehNum}`,
    courier_name: `Ranchi Cold-Chain Unit ${vehNum}`,
    driver: drivers[count % 4],
    blood_group: bg,
    units,
    from_id: fromH.id,
    from_hospital: fromH.name,
    from_lat: fromH.lat,
    from_lng: fromH.lng,
    to_id: toH.id,
    to_hospital: toH.name,
    to_lat: toH.lat,
    to_lng: toH.lng,
    distance_km: dist,
    temp_c: Number((4.0 + (count % 4) * 0.1).toFixed(1)),
    eta_seconds: totalSecs,
    total_seconds: totalSecs,
    status: 'in_transit',
    priority,
    dispatched_at: new Date().toISOString(),
  };

  standaloneState.activeDispatches.unshift(dispatch);
  standaloneState.transferLog.push({
    id: transferId,
    status: 'approved',
    units,
    blood_group: bg,
    from_id: fromId,
    to_id: toId,
    timestamp: new Date().toISOString(),
  });
  return dispatch;
}

export function localApproveTransfer(transferId, payload = null) {
  let fromId = payload?.from_id || null;
  let toId = payload?.to_id || null;
  let bg = payload?.blood_group || null;
  const units = payload?.units || 10;
  const priority = payload?.priority || 'HIGH';

  if (!(fromId && toId && bg) && typeof transferId === 'string') {
    const firstDash = transferId.indexOf('-');
    const secondDash = firstDash >= 0 ? transferId.indexOf('-', firstDash + 1) : -1;
    if (firstDash >= 0 && secondDash > firstDash) {
      fromId = fromId || transferId.slice(0, firstDash);
      toId = toId || transferId.slice(firstDash + 1, secondDash);
      bg = bg || transferId.slice(secondDash + 1);
    }
  }

  let dispatch = null;
  if (fromId && toId && bg) {
    dispatch = createLocalDispatch(fromId, toId, bg, units, transferId, priority);
  } else {
    standaloneState.transferLog.push({
      id: transferId,
      status: 'approved',
      timestamp: new Date().toISOString(),
    });
  }

  return {
    success: true,
    message: 'Transfer approved and cold-chain courier dispatched!',
    transfer_id: transferId,
    dispatch,
  };
}

export function localRequestTransfer(
  payload,
  { scenario = 'normal', criticalThreshold = 15 } = {}
) {
  const hospitalsData = buildLocalHospitals({ scenario, criticalThreshold });
  const hById = Object.fromEntries(hospitalsData.map(h => [h.id, h]));
  const target = hById[payload.to_id];
  if (!target) {
    return { success: false, error: 'Target hospital not found' };
  }

  const unitsRequested = payload.units ?? 10;
  const priority = payload.priority || 'HIGH';
  let donor = null;

  if (payload.from_id && payload.from_id !== payload.to_id && hById[payload.from_id]) {
    donor = hById[payload.from_id];
  } else {
    let candidates = hospitalsData.filter(
      dh =>
        dh.id !== payload.to_id &&
        (dh.inventory?.[payload.blood_group]?.units ?? 0) >= unitsRequested
    );
    if (candidates.length === 0) {
      candidates = hospitalsData.filter(dh => dh.id !== payload.to_id);
    }
    candidates.sort((a, b) => {
      const hubDiff = (a.type === 'blood_bank' ? 0 : 1) - (b.type === 'blood_bank' ? 0 : 1);
      if (hubDiff !== 0) return hubDiff;
      return (
        (b.inventory?.[payload.blood_group]?.units ?? 0) -
        (a.inventory?.[payload.blood_group]?.units ?? 0)
      );
    });
    donor = candidates[0];
  }

  const transferId = `req-${donor.id}-${target.id}-${payload.blood_group}-${
    standaloneState.activeDispatches.length + 1
  }`;
  const dispatch = createLocalDispatch(
    donor.id,
    target.id,
    payload.blood_group,
    unitsRequested,
    transferId,
    priority
  );

  return {
    success: true,
    message: `Dispatched ${unitsRequested}u ${payload.blood_group} from ${donor.name} to ${target.name}`,
    dispatch,
  };
}

export function localSimulateTrauma(
  payload = {},
  { scenario = 'normal', criticalThreshold = 15 } = {}
) {
  const targetBg = payload?.blood_group || 'O-';
  const hospitalsData = buildLocalHospitals({ scenario, criticalThreshold });

  let target = null;
  if (payload?.hospital_id) {
    target = hospitalsData.find(h => h.id === payload.hospital_id) || null;
  }
  if (!target) {
    target =
      hospitalsData.find(
        h => h.id === 'h2' && (h.inventory?.[targetBg]?.units ?? 0) > 2
      ) ||
      hospitalsData.find(
        h => h.type === 'hospital' && (h.inventory?.[targetBg]?.units ?? 0) > 2
      ) ||
      hospitalsData[1];
  }

  const previousUnits = target.inventory[targetBg].units;
  standaloneState.traumaOverrides[target.id] ||= {};
  standaloneState.traumaOverrides[target.id][targetBg] = { units: 2 };
  if (standaloneState.inventoryOverrides[target.id]?.[targetBg] !== undefined) {
    standaloneState.inventoryOverrides[target.id][targetBg] = 0;
  }

  const updatedHospitals = buildLocalHospitals({ scenario, criticalThreshold });
  const updatedTarget = updatedHospitals.find(h => h.id === target.id);

  const rerouteOptions = [];
  for (const dh of updatedHospitals) {
    if (dh.id === target.id) continue;
    const avail = dh.inventory[targetBg].units;
    if (avail >= 12) {
      const dist = haversineKm(dh.lat, dh.lng, target.lat, target.lng);
      const eta = Math.max(6, Math.round(dist * 2.1 + 3));
      const suggestedUnits = Math.min(16, Math.max(8, Math.floor(avail / 3)));
      const score = Number(
        (avail * 1.4 - dist * 3.5 + (dh.type === 'blood_bank' ? 15 : 0)).toFixed(1)
      );
      rerouteOptions.push({
        from_id: dh.id,
        from_hospital: dh.name,
        from_type: dh.type,
        available_units: avail,
        suggested_units: suggestedUnits,
        expiring_48h: dh.inventory[targetBg].expiring_48h,
        distance_km: dist,
        eta_minutes: eta,
        ai_confidence: Math.min(99, Math.max(82, Math.trunc(86 + score / 10))),
        score,
      });
    }
  }

  rerouteOptions.sort((a, b) => b.score - a.score);
  return {
    success: true,
    incident_id: `TRM-${formatCompactHMS()}`,
    blood_group: targetBg,
    previous_units: previousUnits,
    current_units: 2,
    hospital: updatedTarget,
    reroute_options: rerouteOptions.slice(0, 4),
  };
}

export function localResolveEmergency() {
  standaloneState.traumaOverrides = {};
  return {
    success: true,
    message: 'Trauma emergency cleared and hospital emergency reserve stabilized.',
  };
}

export function localUploadInventoryCsv(rows = [], { scenario = 'normal' } = {}) {
  let updatedCount = 0;
  const matchedFacilities = new Set();

  const nameLookup = new Map(INITIAL_HOSPITALS.map(h => [h.name.toLowerCase(), h.id]));
  const idLookup = new Map(INITIAL_HOSPITALS.map(h => [h.id.toLowerCase(), h.id]));

  for (const row of rows) {
    const key = String(row.hospital || '').trim().toLowerCase();
    if (!key) continue;
    let hid = idLookup.get(key) || nameLookup.get(key);
    if (!hid) {
      hid = INITIAL_HOSPITALS.find(h => h.name.toLowerCase().includes(key))?.id;
    }
    const bg = String(row.blood_group || '').trim().toUpperCase();
    if (hid && BLOOD_GROUPS.includes(bg)) {
      standaloneState.absoluteOverrides[hid] ||= {};
      standaloneState.absoluteOverrides[hid][bg] = {
        units: Math.max(0, Number.parseInt(row.units, 10) || 0),
        expiring_48h: row.expiring_48h ?? null,
      };
      if (standaloneState.inventoryOverrides[hid]?.[bg] !== undefined) {
        standaloneState.inventoryOverrides[hid][bg] = 0;
      }
      updatedCount += 1;
      matchedFacilities.add(HOSPITAL_MAP[hid].name);
    }
  }

  return {
    success: true,
    updated_records: updatedCount,
    facilities_updated: [...matchedFacilities].sort(),
    hospitals: buildLocalHospitals({ scenario }),
  };
}

export function localResetDemoState() {
  standaloneState.inventoryOverrides = {};
  standaloneState.absoluteOverrides = {};
  standaloneState.traumaOverrides = {};
  standaloneState.transferLog = [];
  standaloneState.activeDispatches = [createSeedDispatch()];
  standaloneState.enRouteDonors = [];
  standaloneState.registeredDonors = [];
  standaloneState.donorCampaigns = [];
  return {
    success: true,
    message: 'Regional simulation state restored to baseline',
  };
}

export function getLocalColdChain({
  scenario = 'normal',
  criticalThreshold = 15,
  expiryWindowHours = 48,
} = {}) {
  const hospitalsData = buildLocalHospitals({ scenario, criticalThreshold, expiryWindowHours });
  const batches = [];
  const components = ['Packed Red Cells', 'Platelets (SDP)', 'Fresh Frozen Plasma'];
  const now = Date.now();

  hospitalsData.forEach((h, hIdx) => {
    const rng = createSeededRng(`cc-${h.id}`);
    BLOOD_GROUPS.forEach((bg, bgIdx) => {
      const inv = h.inventory[bg];
      if (!inv) return;

      const expUnits = inv.expiring_48h;
      const bgCode = bg.replace('+', 'P').replace('-', 'N');

      if (expUnits > 0) {
        const maxSpan = Math.max(24, expiryWindowHours - 8);
        const hoursLeft = 6 + ((hIdx * 5 + bgIdx * 7) % maxSpan);
        const bucket = hoursLeft < 24 ? '<24h' : hoursLeft < 48 ? '<48h' : '<7d';
        const comp =
          hoursLeft < 20 && bgIdx % 2 === 0 ? 'Platelets (SDP)' : components[(hIdx + bgIdx) % 2];
        const collectedOffsetDays = comp === 'Packed Red Cells' ? 39 : 4;

        batches.push({
          batch_id: `HS-JH-${bgCode}-${810 + hIdx * 13 + bgIdx}`,
          hospital_id: h.id,
          hospital_name: h.name,
          city: h.city,
          blood_group: bg,
          component: comp,
          units: expUnits,
          hours_remaining: hoursLeft,
          bucket,
          temp_c: h.cold_storage_temp,
          collected_at: formatMonthDayTime(
            new Date(now - collectedOffsetDays * 24 * 60 * 60 * 1000)
          ),
          expires_at: formatMonthDayTime(new Date(now + hoursLeft * 60 * 60 * 1000)),
        });
      }

      if (inv.units >= 18 && (hIdx + bgIdx) % 3 === 0) {
        const hours7d = 54 + ((hIdx * 17 + bgIdx * 11) % 108);
        const batchId7d = `HS-JH-${bgCode}-${410 + hIdx * 19 + bgIdx}`;
        const upperBound = Math.min(14, inv.units);
        const fallbackUnits = 4 + Math.floor(rng() * (upperBound - 4 + 1));
        const exactUnits = INITIAL_COLD_CHAIN_7D_UNITS[batchId7d];
        const batchUnits =
          exactUnits !== undefined ? Math.min(inv.units, exactUnits) : fallbackUnits;

        batches.push({
          batch_id: batchId7d,
          hospital_id: h.id,
          hospital_name: h.name,
          city: h.city,
          blood_group: bg,
          component: components[(hIdx + bgIdx) % 3],
          units: batchUnits,
          hours_remaining: hours7d,
          bucket: '<7d',
          temp_c: h.cold_storage_temp,
          collected_at: formatMonthDayTime(new Date(now - 35 * 24 * 60 * 60 * 1000)),
          expires_at: formatMonthDayTime(new Date(now + hours7d * 60 * 60 * 1000)),
        });
      }
    });
  });

  batches.sort((a, b) => a.hours_remaining - b.hours_remaining);

  return {
    batches,
    dispatches: standaloneState.activeDispatches.map(d => ({ ...d })),
    summary: {
      under_24h: batches.filter(b => b.bucket === '<24h').reduce((s, b) => s + b.units, 0),
      under_48h: batches.filter(b => b.bucket === '<48h').reduce((s, b) => s + b.units, 0),
      under_7d: batches.filter(b => b.bucket === '<7d').reduce((s, b) => s + b.units, 0),
      active_couriers: standaloneState.activeDispatches.length,
      avg_temp_c: 4.2,
    },
  };
}

function buildDonorPoolWithStatus() {
  const enRouteByDonor = new Map(standaloneState.enRouteDonors.map(d => [d.donor_id, d]));
  return INITIAL_DONOR_POOL.map(d => ({
    ...d,
    en_route: enRouteByDonor.get(d.id) || null,
  }));
}

export function getLocalDonors() {
  const enRouteByDonor = new Map(standaloneState.enRouteDonors.map(d => [d.donor_id, d]));
  const registeredWithStatus = standaloneState.registeredDonors.map(d => ({
    ...d,
    en_route: enRouteByDonor.get(d.id) || null,
  }));
  return {
    donors: [...registeredWithStatus, ...buildDonorPoolWithStatus()],
    campaigns: [...standaloneState.donorCampaigns],
    en_route_donors: [...standaloneState.enRouteDonors],
  };
}

export function localRegisterDonor(payload) {
  const neighborhood = String(payload.neighborhood || 'Bariatu').trim();
  const [lat, lng] = DONOR_ZONE_COORDS[neighborhood] || [23.363, 85.324];
  const dist = Math.max(0.5, haversineKm(23.363, 85.324, lat, lng));
  const cleanPhone = String(payload.phone || '+91 98350 00000').trim();
  const masked =
    cleanPhone.length >= 10
      ? `${cleanPhone.slice(0, 7)} ***${cleanPhone.slice(-3)}`
      : '+91 9835* ***01';
  const eligible = Boolean(payload.eligible_90_days ?? true);
  const bg = String(payload.blood_group || 'O-').trim().toUpperCase();
  const name = String(payload.name || 'Voluntary Donor').trim();

  const donor = {
    id: `VOL-${5001 + standaloneState.registeredDonors.length}`,
    name,
    blood_group: bg,
    neighborhood,
    lat,
    lng,
    distance_km: dist,
    last_donated_days: eligible ? 120 : 42,
    eligible,
    verified: true,
    newly_registered: true,
    donations_count: 1,
    channels: ['Direct Call', 'SMS', 'WhatsApp'],
    phone_masked: masked,
    response_score: 98,
    en_route: null,
  };

  standaloneState.registeredDonors.unshift(donor);
  return {
    success: true,
    message: `Thank you ${donor.name}! Registered as a voluntary ${donor.blood_group} donor in ${donor.neighborhood}.`,
    donor,
  };
}

export function getLocalNearbyDonors({
  hospitalId = 'h2',
  bloodGroup = 'O-',
  maxKm = 3.0,
  limit = 5,
} = {}) {
  const hospital = HOSPITAL_MAP[hospitalId] || HOSPITAL_MAP.h2;
  const zoneShort = hospital.city.split(',')[0].trim();
  const enRouteMap = new Map(
    standaloneState.enRouteDonors.map(d => [`${d.donor_id}|${d.hospital_id}|${d.blood_group}`, d])
  );

  const registeredMatches = [];
  for (const d of standaloneState.registeredDonors) {
    if (d.eligible && d.blood_group === bloodGroup) {
      const dist = Math.max(0.4, haversineKm(hospital.lat, hospital.lng, d.lat, d.lng));
      const sameZone =
        hospital.city.toLowerCase().includes(d.neighborhood.toLowerCase()) ||
        hospital.name.toLowerCase().includes(d.neighborhood.toLowerCase());
      if (dist <= Math.max(maxKm, 3.5) || sameZone) {
        const key = `${d.id}|${hospital.id}|${bloodGroup}`;
        registeredMatches.push({
          ...d,
          distance_km: dist,
          eta_minutes: Math.max(4, Math.round(dist * 3.5 + 4)),
          en_route: enRouteMap.get(key) || null,
        });
      }
    }
  }

  const pool = buildDonorPoolWithStatus();
  const localMatches = [];
  for (const d of pool) {
    if (d.eligible && d.blood_group === bloodGroup) {
      const dist = haversineKm(hospital.lat, hospital.lng, d.lat, d.lng);
      if (dist <= maxKm) {
        const key = `${d.id}|${hospital.id}|${bloodGroup}`;
        localMatches.push({
          ...d,
          distance_km: Math.max(0.4, dist),
          eta_minutes: Math.max(5, Math.round(dist * 3.5 + 4)),
          en_route: enRouteMap.get(key) || d.en_route,
        });
      }
    }
  }

  let bgCharSum = 0;
  for (let i = 0; i < bloodGroup.length; i += 1) bgCharSum += bloodGroup.charCodeAt(i);
  const seedBase = facilitySeed(hospital.id) + bgCharSum;
  const rng = createSeededRng(seedBase);
  const subzones = [zoneShort, 'Bariatu', 'Lalpur', 'Morabadi', 'Main Road', 'Kanke Road'];
  const bgCode = bloodGroup.replace('+', 'P').replace('-', 'N');

  let idxOffset = 0;
  while (registeredMatches.length + localMatches.length < limit) {
    const fName = LOCAL_DONOR_FIRST_NAMES[(seedBase + idxOffset) % LOCAL_DONOR_FIRST_NAMES.length];
    const lName =
      LOCAL_DONOR_LAST_NAMES[(seedBase + idxOffset * 3) % LOCAL_DONOR_LAST_NAMES.length];
    const donorId = `LOC-${hospital.id.toUpperCase()}-${bgCode}-${idxOffset + 1}`;
    const maxRandDist = Math.min(2.8, maxKm - 0.1);
    const dist = Number((0.6 + rng() * Math.max(0.5, maxRandDist - 0.6)).toFixed(1));
    const daysAgo = 96 + Math.floor(rng() * (215 - 96 + 1));
    const area = idxOffset < 3 ? zoneShort : subzones[(seedBase + idxOffset) % subzones.length];
    const key = `${donorId}|${hospital.id}|${bloodGroup}`;

    localMatches.push({
      id: donorId,
      name: `${fName} ${lName}`,
      blood_group: bloodGroup,
      neighborhood: area,
      lat: Number((hospital.lat + (rng() * 0.024 - 0.012)).toFixed(4)),
      lng: Number((hospital.lng + (rng() * 0.024 - 0.012)).toFixed(4)),
      distance_km: dist,
      eta_minutes: Math.max(5, Math.round(dist * 4 + 4)),
      last_donated_days: daysAgo,
      eligible: true,
      verified: true,
      donations_count: 4 + Math.floor(rng() * 12),
      channels: ['Direct Call', 'WhatsApp', 'SMS'],
      phone_masked: `+91 9431${Math.floor(rng() * 10)} **${100 + Math.floor(rng() * 900)}`,
      response_score: 89 + Math.floor(rng() * 11),
      en_route: enRouteMap.get(key) || null,
    });
    idxOffset += 1;
  }

  localMatches.sort((a, b) => a.distance_km - b.distance_km);
  const combined = [...registeredMatches, ...localMatches];

  return {
    hospital_id: hospital.id,
    hospital_name: hospital.name,
    blood_group: bloodGroup,
    max_km: maxKm,
    donors: combined.slice(0, limit),
  };
}

export function localConfirmDonorEnRoute(payload) {
  const hospital = HOSPITAL_MAP[payload.hospital_id];
  if (!hospital) {
    return { success: false, error: 'Hospital not found' };
  }

  const units = Math.max(1, payload.units || 1);
  standaloneState.inventoryOverrides[payload.hospital_id] ||= {};
  standaloneState.inventoryOverrides[payload.hospital_id][payload.blood_group] =
    (standaloneState.inventoryOverrides[payload.hospital_id][payload.blood_group] || 0) + units;

  const record = {
    dispatch_id: `DNR-CALL-${standaloneState.enRouteDonors.length + 101}`,
    donor_id: payload.donor_id,
    donor_name: payload.donor_name,
    hospital_id: payload.hospital_id,
    hospital_name: hospital.name,
    blood_group: payload.blood_group,
    units,
    eta_minutes: payload.eta_minutes || 14,
    distance_km: payload.distance_km || 1.2,
    neighborhood: payload.neighborhood || hospital.city.split(',')[0].trim(),
    confirmed_at: formatTimeHMS(),
    status: 'en_route',
  };

  standaloneState.enRouteDonors.unshift(record);
  return {
    success: true,
    message: `Donor ${payload.donor_name} (${payload.blood_group}) confirmed en route to ${hospital.name} (+${units}u logged)`,
    record,
  };
}

export function localTriggerDonorAlert(bloodGroup = 'O-', options = null) {
  const bg = options?.blood_group || bloodGroup;
  const radiusKm = options?.radius_km ?? 12;
  const channels = options?.channels?.length ? options.channels : ['SMS', 'App Push', 'WhatsApp'];
  const hospitalId = options?.hospital_id || 'h2';
  const hospital = HOSPITAL_MAP[hospitalId] || HOSPITAL_MAP.h1;

  const donorsNotified = 58 + Math.floor(Math.random() * (174 - 58 + 1));
  const delivered = Math.max(1, Math.floor(donorsNotified * (0.93 + Math.random() * 0.05)));
  const opened = Math.max(1, Math.floor(delivered * (0.68 + Math.random() * 0.16)));
  const confirmed = Math.max(2, Math.floor(opened * (0.18 + Math.random() * 0.13)));

  const campaign = {
    campaign_id: `CMP-${formatCompactHMS()}`,
    blood_group: bg,
    hospital_name: hospital.name,
    radius_km: radiusKm,
    channels,
    donors_notified: donorsNotified,
    delivered,
    opened,
    confirmed_appointments: confirmed,
    delivery_rate_pct: Number(((delivered / donorsNotified) * 100).toFixed(1)),
    read_rate_pct: Number(((opened / delivered) * 100).toFixed(1)),
    estimated_response_time: '1.5–3 hours',
    sent_at: formatTimeHMS(),
  };

  standaloneState.donorCampaigns.unshift(campaign);
  return {
    success: true,
    blood_group: bg,
    donors_notified: donorsNotified,
    message: `Emergency alert sent to ${donorsNotified} nearby Ranchi donors for ${bg} blood type!`,
    channels,
    estimated_response_time: campaign.estimated_response_time,
    campaign,
  };
}

export function getStandaloneSnapshot({
  scenario = 'normal',
  bloodGroup = 'O-',
  criticalThreshold = 15,
  expiryWindowHours = 48,
} = {}) {
  return {
    kpi: getLocalKPI({ scenario, criticalThreshold, expiryWindowHours }),
    hospitals: buildLocalHospitals({ scenario, criticalThreshold, expiryWindowHours }),
    transfers: getLocalTransfers({ scenario, criticalThreshold }),
    coldChain: getLocalColdChain({ scenario, criticalThreshold, expiryWindowHours }),
    donorsData: getLocalDonors(),
    forecast: getLocalForecast({ bloodGroup, scenario }),
  };
}
