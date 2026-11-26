import { BLOOD_GROUPS } from '../constants/blood';

export const COPILOT_QUICK_CHIPS = [
  'Which Ranchi hospital needs blood most urgently right now?',
  'Recommend & execute best transfer for O-',
  'Show batches expiring in under 24 hours',
  'Draft an emergency donor alert for RIMS',
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

export function extractBloodGroup(text) {
  const normalized = ` ${String(text || '').toLowerCase()} `
    .replace(/\boh\b/g, 'o')
    .replace(/\bminus\b/g, 'negative')
    .replace(/\bplus\b/g, 'positive');

  const explicitPatterns = [
    ['AB-', /\bab\s*[-]\b|\bab\s+negative\b/i],
    ['AB+', /\bab\s*[+]\b|\bab\s+positive\b/i],
    ['O-', /\bo\s*[-]\b|\bo\s+negative\b|\bo\s*neg\b/i],
    ['O+', /\bo\s*[+]\b|\bo\s+positive\b|\bo\s*pos\b/i],
    ['A-', /\ba\s*[-]\b|\ba\s+negative\b|\ba\s*neg\b/i],
    ['A+', /\ba\s*[+]\b|\ba\s+positive\b|\ba\s*pos\b/i],
    ['B-', /\bb\s*[-]\b|\bb\s+negative\b|\bb\s*neg\b/i],
    ['B+', /\bb\s*[+]\b|\bb\s+positive\b|\bb\s*pos\b/i],
  ];

  for (const [bg, regex] of explicitPatterns) {
    if (regex.test(normalized)) return bg;
  }

  for (const bg of ['AB-', 'AB+', 'O-', 'O+', 'A-', 'A+', 'B-', 'B+']) {
    const escaped = bg.replace('+', '\\+').replace('-', '\\-');
    if (new RegExp(`(^|\\s)${escaped}(\\s|$|[.,?!])`, 'i').test(text)) {
      return bg;
    }
  }
  return null;
}

const HOSPITAL_ALIASES = [
  { id: 'h1', keys: ['rims', 'rajendra'] },
  { id: 'h2', keys: ['sadar', 'purulia'] },
  { id: 'h3', keys: ['medica', 'bhagwan', 'mahavir', 'booty'] },
  { id: 'h4', keys: ['orchid', 'lalpur', 'circular'] },
  { id: 'h5', keys: ['raj hospital', 'raj ', 'main road'] },
  { id: 'h6', keys: ['devkamal', 'ratu'] },
  { id: 'h7', keys: ['red cross', 'morabadi'] },
  { id: 'h8', keys: ['alam'] },
  { id: 'h9', keys: ['paras', 'hec', 'dhurwa'] },
  { id: 'h10', keys: ['guru nanak', 'nanak', 'station road'] },
  { id: 'h11', keys: ['pulse'] },
  { id: 'h12', keys: ['ccl', 'gandhinagar', 'kanke'] },
];

export function extractHospital(text, hospitals = []) {
  const lower = String(text || '').toLowerCase();
  for (const alias of HOSPITAL_ALIASES) {
    if (alias.keys.some(k => lower.includes(k))) {
      const found = hospitals.find(h => h.id === alias.id);
      if (found) return found;
    }
  }
  return (
    hospitals.find(
      h =>
        lower.includes(h.name.toLowerCase()) ||
        lower.includes(h.city.split(',')[0].trim().toLowerCase())
    ) || null
  );
}

function getUrgentHospitals(hospitals = [], criticalThreshold = 15) {
  return hospitals
    .map(h => {
      const criticalGroups = BLOOD_GROUPS.filter(
        bg => (h.inventory?.[bg]?.units ?? 0) < criticalThreshold
      ).map(bg => ({ bg, units: h.inventory?.[bg]?.units ?? 0 }));
      criticalGroups.sort((a, b) => a.units - b.units);
      const lowest = criticalGroups[0] || { bg: 'O-', units: h.inventory?.['O-']?.units ?? 0 };
      const totalUnits = Object.values(h.inventory || {}).reduce((s, v) => s + v.units, 0);
      return {
        hospital: h,
        criticalGroups,
        lowest,
        totalUnits,
      };
    })
    .sort((a, b) => {
      if (b.criticalGroups.length !== a.criticalGroups.length) {
        return b.criticalGroups.length - a.criticalGroups.length;
      }
      return a.lowest.units - b.lowest.units;
    });
}

function findBestTransferForGroup(bg, hospitals = [], targetHospital = null) {
  if (!hospitals.length) return null;

  const sortedByNeed = [...hospitals].sort(
    (a, b) => (a.inventory?.[bg]?.units ?? 999) - (b.inventory?.[bg]?.units ?? 999)
  );
  const recipient = targetHospital || sortedByNeed[0];

  const surplusCandidates = hospitals
    .filter(h => h.id !== recipient.id)
    .map(h => {
      const avail = h.inventory?.[bg]?.units ?? 0;
      const dist = haversineKm(h.lat, h.lng, recipient.lat, recipient.lng);
      const score = avail * 1.3 - dist * 2.8 + (h.type === 'blood_bank' ? 18 : 0);
      return { hospital: h, avail, dist, score };
    })
    .filter(c => c.avail >= 12)
    .sort((a, b) => b.score - a.score);

  const donor = surplusCandidates[0];
  if (!donor) return null;

  const units = Math.min(15, Math.max(6, Math.floor(donor.avail / 4)));
  const etaMinutes = Math.max(6, Math.round(donor.dist * 2.2 + 4));
  const recipientUnits = recipient.inventory?.[bg]?.units ?? 0;

  return {
    from_id: donor.hospital.id,
    from_hospital: donor.hospital.name,
    donor_units_avail: donor.avail,
    to_id: recipient.id,
    to_hospital: recipient.name,
    recipient_units: recipientUnits,
    blood_group: bg,
    units,
    distance_km: donor.dist,
    eta_minutes: etaMinutes,
    priority: recipientUnits < 15 ? 'HIGH' : 'MEDIUM',
  };
}

/**
 * Deterministic live-state Copilot Engine: reads all 12 Ranchi facilities,
 * KPIs, expiring batches, and transfers, returning clinical guidance + executable actions.
 */
export function generateSmartCopilotResponse(query, liveContext) {
  const {
    hospitals = [],
    kpi = {},
    coldChain = {},
    scenario = 'normal',
    traumaActive = false,
    criticalThreshold = 15,
    expiryWindowHours = 48,
  } = liveContext || {};

  const lower = String(query || '').toLowerCase();
  const urgentList = getUrgentHospitals(hospitals, criticalThreshold);
  const detectedBG = extractBloodGroup(query);
  const detectedHospital = extractHospital(query, hospitals);

  // 1. Draft Emergency Donor Alert Intent
  if (
    lower.includes('draft') ||
    lower.includes('alert') ||
    lower.includes('blast') ||
    lower.includes('sms') ||
    lower.includes('whatsapp') ||
    lower.includes('mobilize')
  ) {
    const targetH = detectedHospital || urgentList[0]?.hospital || hospitals[0];
    const targetLowestBG =
      detectedBG ||
      urgentList.find(u => u.hospital.id === targetH?.id)?.lowest?.bg ||
      'O-';
    const currentUnits = targetH?.inventory?.[targetLowestBG]?.units ?? 0;
    const area = targetH?.city || 'Ranchi';
    const draftMessage = `URGENT HemoSync Ranchi Alert: ${targetH?.name || 'RIMS Blood Bank (Bariatu)'} requires immediate ${targetLowestBG} blood donors (${currentUnits}u remaining). Walk-in fast-track donor bay open now at ${area}. Reply YES to reserve a priority slot.`;

    return {
      mode: 'smart',
      text: `Ready-to-broadcast **${targetLowestBG} Emergency Donor Alert** prepared for **${targetH?.name || 'Ranchi Hub'}** (currently at **${currentUnits}u**). Review the multi-channel dispatch preview below and click **Broadcast Now** to trigger live SMS, WhatsApp, and Push alerts across Ranchi:`,
      actions: [
        {
          id: `broadcast-${targetH?.id || 'h1'}-${targetLowestBG}-${Date.now()}`,
          type: 'broadcast_donor_alert',
          label: 'Broadcast Now',
          draftMessage,
          payload: {
            bloodGroup: targetLowestBG,
            options: {
              radius_km: 12,
              channels: ['SMS', 'WhatsApp', 'App Push'],
              hospital_id: targetH?.id || 'h1',
              message: draftMessage,
            },
          },
          meta: {
            hospital_name: targetH?.name || 'RIMS Blood Bank (Bariatu)',
            blood_group: targetLowestBG,
            radius_km: 12,
          },
        },
        ...(targetH
          ? [
              {
                id: `inspect-draft-${targetH.id}`,
                type: 'inspect_hospital',
                label: `Inspect ${targetH.name.split('(')[0].trim()}`,
                hospital: targetH,
              },
            ]
          : []),
      ],
    };
  }

  // 2. Expiring Batches (<24h / FIFO) Intent
  if (
    lower.includes('expir') ||
    lower.includes('24 hour') ||
    lower.includes('24h') ||
    lower.includes('fifo') ||
    lower.includes('platelet') ||
    lower.includes('wastage')
  ) {
    const batches = coldChain?.batches || [];
    const under24 = batches.filter(b => b.bucket === '<24h');
    const under48 = batches.filter(b => b.bucket === '<48h');
    const focusBatches = under24.length > 0 ? under24 : under48;

    if (focusBatches.length === 0) {
      return {
        mode: 'smart',
        text: `All cold-chain units are currently well within safe shelf-life tolerances across the ${hospitals.length} Ranchi facilities (${coldChain?.summary?.under_7d ?? 0} units in the <7d FIFO watch queue).`,
        actions: [
          {
            id: 'nav-logistics-clean',
            type: 'navigate_view',
            label: 'Open Cold-Chain Tracker',
            view: 'logistics',
          },
        ],
      };
    }

    const lines = focusBatches.slice(0, 4).map(b => {
      const targetNeed = hospitals
        .filter(h => h.id !== b.hospital_id)
        .sort(
          (x, y) =>
            (x.inventory?.[b.blood_group]?.units ?? 999) -
            (y.inventory?.[b.blood_group]?.units ?? 999)
        )[0];
      return `• **${b.batch_id}** — **${b.units}u ${b.blood_group}** (${b.component}) at ${b.hospital_name} (**${b.hours_remaining}h left**) → Route to **${targetNeed?.name || 'Sadar Hospital Ranchi'}**`;
    });

    const topBatch = focusBatches[0];
    const topTarget = hospitals
      .filter(h => h.id !== topBatch.hospital_id)
      .sort(
        (x, y) =>
          (x.inventory?.[topBatch.blood_group]?.units ?? 999) -
          (y.inventory?.[topBatch.blood_group]?.units ?? 999)
      )[0];

    const fromH = hospitals.find(h => h.id === topBatch.hospital_id);
    const dist =
      fromH && topTarget
        ? haversineKm(fromH.lat, fromH.lng, topTarget.lat, topTarget.lng)
        : 4.2;

    return {
      mode: 'smart',
      text: `Found **${under24.length} high-priority batches (${coldChain?.summary?.under_24h ?? 0} units)** expiring in **under 24 hours** across Ranchi:\n\n${lines.join('\n')}\n\nDispatch the most urgent batch immediately to prevent cold-chain wastage:`,
      actions: [
        ...(topTarget
          ? [
              {
                id: `fifo-route-${topBatch.batch_id}-${Date.now()}`,
                type: 'execute_transfer',
                label: 'Execute FIFO Transfer Now',
                payload: {
                  from_id: topBatch.hospital_id,
                  to_id: topTarget.id,
                  blood_group: topBatch.blood_group,
                  units: Math.max(1, topBatch.units),
                  priority: 'HIGH',
                },
                meta: {
                  from_hospital: topBatch.hospital_name,
                  to_hospital: topTarget.name,
                  blood_group: topBatch.blood_group,
                  units: Math.max(1, topBatch.units),
                  distance_km: dist,
                  eta_minutes: Math.max(6, Math.round(dist * 2.2 + 4)),
                  note: `${topBatch.batch_id} · ${topBatch.hours_remaining}h left`,
                },
              },
            ]
          : []),
        {
          id: 'nav-logistics',
          type: 'navigate_view',
          label: 'Open Expiry & Cold-Chain View',
          view: 'logistics',
        },
      ],
    };
  }

  // 3. Recommend / Find / Execute Transfer for a Blood Group (e.g. O-, A+, etc.)
  if (
    detectedBG ||
    lower.includes('transfer') ||
    lower.includes('route') ||
    lower.includes('recommend') ||
    lower.includes('find')
  ) {
    const targetBG = detectedBG || urgentList[0]?.lowest?.bg || 'O-';
    const match = findBestTransferForGroup(targetBG, hospitals, detectedHospital);
    const totalRegional = hospitals.reduce(
      (sum, h) => sum + (h.inventory?.[targetBG]?.units ?? 0),
      0
    );
    const criticalCount = hospitals.filter(
      h => (h.inventory?.[targetBG]?.units ?? 0) < criticalThreshold
    ).length;

    if (!match) {
      return {
        mode: 'smart',
        text: `Regional **${targetBG}** inventory stands at **${totalRegional} units** across ${hospitals.length} Ranchi facilities (${criticalCount} below ${criticalThreshold}u). No single facility has ≥12u surplus to transfer safely — trigger a local Ranchi donor mobilization immediately.`,
        actions: [
          {
            id: `nav-donors-${targetBG}`,
            type: 'navigate_view',
            label: `Open Donor Hub (${targetBG})`,
            view: 'donors',
            bloodGroup: targetBG,
          },
        ],
      };
    }

    return {
      mode: 'smart',
      text: `Live **${targetBG}** scan across ${hospitals.length} Ranchi nodes (**${totalRegional}u regional**, **${criticalCount} critical**):\n\n• **Surplus Source**: ${match.from_hospital} (**${match.donor_units_avail}u** available)\n• **Urgent Destination**: ${match.to_hospital} (only **${match.recipient_units}u** left)\n• **Optimal Cold-Chain Dispatch**: **${match.units}u ${targetBG}** across **${match.distance_km} km** (ETA **~${match.eta_minutes} mins**)`,
      actions: [
        {
          id: `exec-${match.from_id}-${match.to_id}-${targetBG}-${Date.now()}`,
          type: 'execute_transfer',
          label: 'Execute Transfer Now',
          payload: {
            from_id: match.from_id,
            to_id: match.to_id,
            blood_group: targetBG,
            units: match.units,
            priority: match.priority,
          },
          meta: match,
        },
        {
          id: `inspect-rec-${match.to_id}`,
          type: 'inspect_hospital',
          label: `Inspect ${match.to_hospital.split('(')[0].trim()}`,
          hospital: hospitals.find(h => h.id === match.to_id),
        },
      ],
    };
  }

  // 4. Most Urgent Hospital / Critical Shortages Intent
  if (
    lower.includes('urgent') ||
    lower.includes('most') ||
    lower.includes('critical') ||
    lower.includes('shortage') ||
    lower.includes('need') ||
    lower.includes('emergency')
  ) {
    const criticalHospitals = urgentList.filter(u => u.criticalGroups.length > 0);
    if (criticalHospitals.length === 0) {
      return {
        mode: 'smart',
        text: `Good news: **0 Ranchi hospitals** currently have blood groups below your **${criticalThreshold}-unit** critical threshold under the **${scenario}** scenario. Regional stock totals **${kpi?.total_units ?? '--'} units**.`,
        actions: [],
      };
    }

    const top = criticalHospitals[0];
    const summaryLines = criticalHospitals.slice(0, 4).map((item, idx) => {
      const missingText = item.criticalGroups
        .map(g => `${g.bg} (${g.units}u)`)
        .join(', ');
      return `${idx + 1}. **${item.hospital.name}** (${item.hospital.city}) — Critical: **${missingText}**`;
    });

    const recommendedTransfer = findBestTransferForGroup(
      top.lowest.bg,
      hospitals,
      top.hospital
    );

    return {
      mode: 'smart',
      text: `${
        traumaActive ? '**CODE RED TRAUMA ACTIVE** — ' : ''
      }**${top.hospital.name}** needs blood most urgently right now (${top.criticalGroups.length} groups below ${criticalThreshold}u):\n\n${summaryLines.join('\n')}`,
      actions: [
        ...(recommendedTransfer
          ? [
              {
                id: `urgent-exec-${recommendedTransfer.from_id}-${recommendedTransfer.to_id}-${Date.now()}`,
                type: 'execute_transfer',
                label: 'Execute Transfer Now',
                payload: {
                  from_id: recommendedTransfer.from_id,
                  to_id: recommendedTransfer.to_id,
                  blood_group: recommendedTransfer.blood_group,
                  units: recommendedTransfer.units,
                  priority: 'HIGH',
                },
                meta: recommendedTransfer,
              },
            ]
          : []),
        {
          id: `urgent-inspect-${top.hospital.id}`,
          type: 'inspect_hospital',
          label: `Inspect ${top.hospital.name.split('(')[0].trim()}`,
          hospital: top.hospital,
        },
      ],
    };
  }

  // 5. Specific Hospital Inquiry
  if (detectedHospital) {
    const crit = BLOOD_GROUPS.filter(
      bg => (detectedHospital.inventory?.[bg]?.units ?? 0) < criticalThreshold
    ).map(bg => `${bg}: ${detectedHospital.inventory[bg].units}u`);
    const total = Object.values(detectedHospital.inventory || {}).reduce(
      (s, v) => s + v.units,
      0
    );
    const invSummary = BLOOD_GROUPS.map(
      bg => `${bg} (${detectedHospital.inventory?.[bg]?.units ?? 0}u)`
    ).join(' · ');

    return {
      mode: 'smart',
      text: `**${detectedHospital.name}** (${detectedHospital.city}) currently holds **${total} total units** at **${detectedHospital.cold_storage_temp ?? 4.2}°C**.\n\n• **Critical Groups (<${criticalThreshold}u)**: ${crit.length ? crit.join(', ') : 'None — all adequate/low'}\n• **Live 8-Group Split**: ${invSummary}`,
      actions: [
        {
          id: `hosp-inspect-${detectedHospital.id}`,
          type: 'inspect_hospital',
          label: 'Open Facility Drawer',
          hospital: detectedHospital,
        },
      ],
    };
  }

  // 6. Default Live Network Brief
  const topCritical = urgentList[0];
  return {
    mode: 'smart',
    text: `**Ranchi Network Live Brief** (${hospitals.length} facilities · **${scenario}** mode):\n\n• **Total Stock**: **${kpi?.total_units?.toLocaleString() ?? '--'} units**\n• **Critical Shortages**: **${kpi?.critical_alerts ?? 0}** below ${criticalThreshold}u\n• **Expiring (<${expiryWindowHours}h)**: **${kpi?.expiring_soon_units ?? 0} units**\n• **Active Couriers**: **${kpi?.active_transfers ?? 0}** en route at 4.2°C\n\nHighest-priority node: **${topCritical?.hospital?.name || 'RIMS Blood Bank'}** (${topCritical?.lowest?.bg || 'O-'}: ${topCritical?.lowest?.units ?? 0}u). Tap any Quick Action Chip below or ask me to route blood or alert donors.`,
    actions: topCritical
      ? [
          {
            id: `brief-inspect-${topCritical.hospital.id}`,
            type: 'inspect_hospital',
            label: `Inspect ${topCritical.hospital.name.split('(')[0].trim()}`,
            hospital: topCritical.hospital,
          },
        ]
      : [],
  };
}

function buildCompactContextSnapshot(liveContext) {
  const {
    hospitals = [],
    kpi = {},
    coldChain = {},
    scenario = 'normal',
    traumaActive = false,
    criticalThreshold = 15,
    expiryWindowHours = 48,
  } = liveContext || {};

  const hospitalLines = hospitals.map(h => {
    const groups = BLOOD_GROUPS.map(
      bg => `${bg}:${h.inventory?.[bg]?.units ?? 0}`
    ).join(' ');
    return `- ${h.name} (${h.id}, ${h.type}, ${h.city}, status=${h.status}): ${groups}`;
  });

  const expiring24 = (coldChain?.batches || [])
    .filter(b => b.bucket === '<24h')
    .slice(0, 6)
    .map(
      b =>
        `- ${b.batch_id}: ${b.units}u ${b.blood_group} ${b.component} at ${b.hospital_name} (${b.hours_remaining}h left)`
    );

  return `LIVE RANCHI DASHBOARD STATE:
Scenario: ${scenario} | TraumaActive: ${traumaActive} | CriticalThreshold: <${criticalThreshold}u | ExpiryWindow: ${expiryWindowHours}h
KPIs: TotalUnits=${kpi?.total_units ?? 0}, CriticalAlerts=${kpi?.critical_alerts ?? 0}, ExpiringUnits=${kpi?.expiring_soon_units ?? 0}, ActiveTransfers=${kpi?.active_transfers ?? 0}
Hospitals (12 Ranchi nodes):
${hospitalLines.join('\n')}
Expiring <24h batches:
${expiring24.length ? expiring24.join('\n') : 'None'}`;
}

/**
 * Runs Copilot either with live Gemini 3 Flash Preview (when user provides an API key)
 * or instantly via the offline Smart Live-State Engine. Always preserves live interactive action cards.
 */
export async function runCopilotQuery(query, liveContext, { geminiApiKey = '' } = {}) {
  const smartFallback = generateSmartCopilotResponse(query, liveContext);
  const trimmedKey = String(geminiApiKey || '').trim();

  if (!trimmedKey) {
    return smartFallback;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: trimmedKey });
    const snapshot = buildCompactContextSnapshot(liveContext);
    const systemInstruction =
      'You are HemoSync Copilot, an expert medical blood-bank command assistant for Ranchi, Jharkhand. Answer concisely using ONLY the live telemetry provided below. Cite exact hospital names, unit counts, blood groups, and hours remaining. Keep responses crisp (under 140 words) with bullet points where helpful.';
    const inputPrompt = `${snapshot}\n\nCoordinator Question: ${query}`;

    let llmText = '';
    try {
      const interaction = await ai.interactions.create({
        model: 'gemini-3-flash-preview',
        input: inputPrompt,
        system_instruction: systemInstruction,
        store: false,
      });
      llmText = interaction?.output_text || '';
    } catch {
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: inputPrompt,
        config: { systemInstruction },
      });
      llmText = res?.text || '';
    }

    if (llmText && llmText.trim()) {
      return {
        mode: 'gemini',
        text: llmText.trim(),
        actions: smartFallback.actions,
      };
    }
    return smartFallback;
  } catch {
    return {
      ...smartFallback,
      mode: 'smart-fallback',
    };
  }
}
