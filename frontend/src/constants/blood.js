export const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const RANCHI_CENTER = [23.363, 85.324];

export const BG_COLORS = {
  'O-': '#e11d48',
  'O+': '#f97316',
  'A-': '#8b5cf6',
  'A+': '#a78bfa',
  'B-': '#0ea5e9',
  'B+': '#38bdf8',
  'AB-': '#10b981',
  'AB+': '#34d399',
};

export const STATUS_CONFIG = {
  safe: {
    label: 'ADEQUATE',
    shortLabel: 'Safe',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.14)',
    border: 'rgba(52, 211, 153, 0.35)',
    glow: 'rgba(52, 211, 153, 0.55)',
  },
  low: {
    label: 'LOW STOCK',
    shortLabel: 'Low',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.14)',
    border: 'rgba(251, 191, 36, 0.35)',
    glow: 'rgba(251, 191, 36, 0.55)',
  },
  critical: {
    label: 'CRITICAL',
    shortLabel: 'Critical',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.16)',
    border: 'rgba(244, 63, 94, 0.4)',
    glow: 'rgba(244, 63, 94, 0.7)',
  },
};

export const SCENARIOS = [
  { value: 'normal', label: 'Normal Week' },
  { value: 'holiday', label: 'Holiday Dip' },
  { value: 'dengue', label: 'Dengue Outbreak Spike' },
];

export const SOUND_THEMES = [
  { id: 'sonar', label: 'Medical Sonar Ping', desc: 'Clean ultrasonic clinical pulse' },
  { id: 'trauma', label: 'Hospital Trauma Dispatch', desc: 'Urgent 3-pulse ER dispatch chime' },
  { id: 'tactical', label: 'Tactical Command Chime', desc: 'Crisp multi-harmonic command triad' },
];

export const DEFAULT_SETTINGS = {
  criticalThreshold: 15,
  expiryWindowHours: 48,
  soundTheme: 'sonar',
  masterVolume: 0.75,
  layoutDensity: 'spacious',
  geminiApiKey: '',
};

export const COORDINATOR_PROFILE = {
  name: 'Dr. A. Sharma',
  role: 'Regional Coordinator',
  region: 'Ranchi, Jharkhand Grid',
  badge: 'MD, Transfusion Medicine',
  avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=240&q=80',
};

export const VIEW_META = {
  command: 'Command Center',
  directory: 'Hospital & Blood Bank Directory',
  analytics: 'AI Predictive Analytics',
  logistics: 'Expiry & Cold-Chain Logistics',
  donors: 'Donor Mobilization Hub',
};

export const SAMPLE_CSV_CONTENT = `hospital,blood_group,units,expiring_48h
Sadar Hospital Ranchi,O-,4,1
Sadar Hospital Ranchi,O+,18,2
Bhagwan Mahavir Medica Superspecialty,A-,9,1
Orchid Medical Centre,O-,11,0
RIMS Blood Bank (Bariatu),O-,68,4
Red Cross Blood Center Ranchi,B+,74,3
Devkamal Hospital (Ratu Road),AB-,7,1
Alam Hospital (Bariatu),A+,46,2
Paras HEC Hospital (Dhurwa),O-,6,1`;

export function parseCsvInventoryText(text) {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const firstLower = lines[0].toLowerCase();
  const hasHeader = firstLower.includes('hospital') || firstLower.includes('blood');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows = [];
  for (const line of dataLines) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 3) continue;
    const hospital = cols[0];
    const bloodGroup = cols[1].toUpperCase();
    const units = Number.parseInt(cols[2], 10);
    const expiring = cols[3] !== undefined && cols[3] !== '' ? Number.parseInt(cols[3], 10) : undefined;
    if (!hospital || !BLOOD_GROUPS.includes(bloodGroup) || Number.isNaN(units)) continue;
    rows.push({
      hospital,
      blood_group: bloodGroup,
      units: Math.max(0, units),
      expiring_48h: expiring !== undefined && !Number.isNaN(expiring) ? Math.max(0, expiring) : undefined,
    });
  }
  return rows;
}
