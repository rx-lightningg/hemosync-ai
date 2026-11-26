import { useState, useMemo } from 'react';
import {
  Search,
  Phone,
  MapPin,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Droplets,
  Building2,
} from 'lucide-react';
import { BG_COLORS, BLOOD_GROUPS } from '../constants/blood';
import HospitalMap from './HospitalMap';

const RANCHI_AREAS = [
  { label: 'Central Ranchi (All Areas)', lat: 23.363, lng: 85.324 },
  { label: 'Bariatu', lat: 23.3897, lng: 85.349 },
  { label: 'Lalpur', lat: 23.3712, lng: 85.3358 },
  { label: 'Main Road', lat: 23.3549, lng: 85.3248 },
  { label: 'Purulia Road', lat: 23.3687, lng: 85.3292 },
  { label: 'Ratu Road', lat: 23.3772, lng: 85.2918 },
  { label: 'Morabadi', lat: 23.3776, lng: 85.3204 },
  { label: 'Dhurwa', lat: 23.3106, lng: 85.2804 },
  { label: 'Station Road', lat: 23.3519, lng: 85.3347 },
  { label: 'Gandhinagar / Kanke', lat: 23.4002, lng: 85.3175 },
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

function getAvailabilityBadge(units) {
  if (units <= 0) {
    return {
      label: 'Out of Stock',
      color: '#f43f5e',
      bg: 'rgba(244,63,94,0.14)',
      border: 'rgba(244,63,94,0.38)',
      icon: XCircle,
      rank: 2,
    };
  }
  if (units < 15) {
    return {
      label: 'Limited',
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.14)',
      border: 'rgba(251,191,36,0.38)',
      icon: AlertTriangle,
      rank: 1,
    };
  }
  return {
    label: 'In Stock',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.14)',
    border: 'rgba(52,211,153,0.38)',
    icon: CheckCircle2,
    rank: 0,
  };
}

export default function CitizenPortalView({
  hospitals = [],
  loading,
  selectedHospital,
  onSelectHospital,
  activeRoutes = [],
  sidebarCollapsed = false,
  onOpenRegisterDonor,
  lastRegisteredDonor = null,
  compact = false,
}) {
  const [selectedBG, setSelectedBG] = useState('O-');
  const [selectedAreaIdx, setSelectedAreaIdx] = useState(0);
  const [textFilter, setTextFilter] = useState('');

  const userOrigin = RANCHI_AREAS[selectedAreaIdx] || RANCHI_AREAS[0];

  const rankedFacilities = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    return hospitals
      .filter(h => {
        if (!q) return true;
        return (
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.address?.toLowerCase().includes(q)
        );
      })
      .map(h => {
        const units = h.inventory?.[selectedBG]?.units ?? 0;
        const badge = getAvailabilityBadge(units);
        const distanceKm = haversineKm(userOrigin.lat, userOrigin.lng, h.lat, h.lng);
        return { hospital: h, units, badge, distanceKm };
      })
      .sort((a, b) => {
        if (a.badge.rank !== b.badge.rank) return a.badge.rank - b.badge.rank;
        return a.distanceKm - b.distanceKm;
      });
  }, [hospitals, selectedBG, userOrigin, textFilter]);

  const inStockCount = rankedFacilities.filter(r => r.badge.label === 'In Stock').length;
  const limitedCount = rankedFacilities.filter(r => r.badge.label === 'Limited').length;
  const outCount = rankedFacilities.filter(r => r.badge.label === 'Out of Stock').length;

  return (
    <div className={`${compact ? 'space-y-4' : 'space-y-6'} fade-up`}>
      {/* Patient-Friendly 'Find Available Blood Near You (Ranchi)' Bar */}
      <div className="bg-[#0c1428]/95 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 space-y-5 shadow-[0_12px_36px_rgba(16,185,129,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-semibold text-emerald-300 mb-2">
              <ShieldCheck size={13} />
              Public Read-Only Portal · Live Ranchi Inventory
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Droplets size={20} className="text-rose-500" />
              Find Available Blood Near You (Ranchi)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select the blood group you need to instantly check availability, distance, and direct hospital phone numbers.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <button
              id="tour-citizen-register"
              type="button"
              onClick={() => onOpenRegisterDonor(selectedBG)}
              className="px-4 py-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/45 shadow-[0_0_22px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 transition-all"
            >
              <HeartHandshake size={16} />
              Register as Voluntary Donor
            </button>

            {lastRegisteredDonor && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                <CheckCircle2 size={12} />
                Registered: {lastRegisteredDonor.name} ({lastRegisteredDonor.blood_group} · {lastRegisteredDonor.neighborhood})
              </span>
            )}
          </div>
        </div>

        {/* Blood Group Pills + Location Area + Quick Filter */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-end">
          <div id="tour-citizen-bloodgroup" className="xl:col-span-6 p-1.5 -m-1.5 rounded-xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              1. Choose Blood Group Needed
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BLOOD_GROUPS.map(bg => {
                const active = selectedBG === bg;
                const color = BG_COLORS[bg] || '#f43f5e';
                return (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedBG(bg)}
                    className="py-2.5 rounded-xl font-mono text-xs font-extrabold transition-all cursor-pointer"
                    style={{
                      background: active ? `${color}2b` : 'rgba(15,23,42,0.85)',
                      color: active ? '#ffffff' : '#94a3b8',
                      border: active ? `2px solid ${color}` : '1px solid rgba(51,65,85,0.8)',
                      boxShadow: active ? `0 0 16px ${color}40` : 'none',
                    }}
                  >
                    {bg}
                  </button>
                );
              })}
            </div>
          </div>

          <div id="tour-citizen-filters" className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-1.5 -m-1.5 rounded-xl">
            <div>
              <label
                htmlFor="citizen-area-select"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2"
              >
                2. Your Ranchi Area
              </label>
              <select
                id="citizen-area-select"
                value={selectedAreaIdx}
                onChange={e => setSelectedAreaIdx(Number(e.target.value))}
                className="select-dark w-full text-xs py-2.5"
              >
                {RANCHI_AREAS.map((area, idx) => (
                  <option key={area.label} value={idx}>
                    {area.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="citizen-hospital-filter"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2"
              >
                3. Filter Hospital
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="citizen-hospital-filter"
                  type="text"
                  value={textFilter}
                  onChange={e => setTextFilter(e.target.value)}
                  placeholder="e.g. RIMS, Sadar, Medica..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-950/85 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Availability Summary Strip */}
        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium">
            Showing <strong className="text-white">{selectedBG}</strong> availability across {rankedFacilities.length} Ranchi centers:
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
            {inStockCount} In Stock
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold">
            {limitedCount} Limited
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono font-bold">
            {outCount} Out of Stock
          </span>
        </div>
      </div>

      {/* Citizen Hospital Availability Cards */}
      <div id="tour-citizen-cards" className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 ${compact ? 'gap-4' : 'gap-6'} rounded-2xl`}>
        {rankedFacilities.map(({ hospital, units, badge, distanceKm }) => {
          const BadgeIcon = badge.icon;
          return (
            <div
              key={hospital.id}
              className="bg-[#0c1428]/95 border border-slate-800/95 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Building2 size={11} className="text-sky-400" />
                      {hospital.type === 'blood_bank' ? 'Blood Bank' : 'Hospital'}
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-0.5 leading-snug">
                      {hospital.name}
                    </h3>
                  </div>

                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    <BadgeIcon size={12} />
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs text-slate-400 flex items-start gap-1.5 leading-snug">
                  <MapPin size={13} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{hospital.address || hospital.city}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-mono font-extrabold" style={{ color: badge.color }}>
                    {units > 0 ? `${units} units (${selectedBG})` : `0 units (${selectedBG})`}
                  </p>
                  <p className="text-[11px] font-mono text-sky-300 mt-0.5">
                    {distanceKm} km away
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`tel:${(hospital.phone || '').replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/35 transition-colors"
                  >
                    <Phone size={12} />
                    {hospital.phone}
                  </a>
                  <button
                    type="button"
                    onClick={() => onSelectHospital(hospital)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Read-Only Ranchi Map */}
      <HospitalMap
        hospitals={hospitals}
        loading={loading}
        selectedHospital={selectedHospital}
        onSelectHospital={onSelectHospital}
        activeRoutes={activeRoutes}
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  );
}
