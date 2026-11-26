import { useState } from 'react';
import {
  Search,
  Building2,
  Phone,
  MapPin,
  Thermometer,
  Send,
  Filter,
  Droplets,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { BG_COLORS, BLOOD_GROUPS, STATUS_CONFIG } from '../constants/blood';

function FacilityCard({ hospital, onInspect, isHighlighted, readOnly = false }) {
  const [coverErr, setCoverErr] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const sc = STATUS_CONFIG[hospital.status] || STATUS_CONFIG.safe;
  const totalUnits = Object.values(hospital.inventory || {}).reduce(
    (sum, item) => sum + item.units,
    0
  );
  const capacity = hospital.cold_storage_capacity || 500;
  const capacityPct = Math.min(100, Math.round((totalUnits / capacity) * 100));

  return (
    <div
      className={`bg-slate-900/95 border rounded-2xl overflow-hidden flex flex-col glass-card-hover ${
        isHighlighted
          ? 'border-rose-500 ring-2 ring-rose-500/35 shadow-[0_0_28px_rgba(225,29,72,0.28)]'
          : 'border-slate-800'
      }`}
    >
      {/* Facility Cover Photo */}
      <div className="relative h-40 bg-slate-900 overflow-hidden">
        {!coverErr && hospital.photo ? (
          <img
            src={hospital.photo}
            alt={hospital.name}
            onError={() => setCoverErr(true)}
            className="w-full h-full object-cover opacity-85"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-rose-950 flex items-center justify-center">
            <Building2 size={36} className="text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
          >
            {sc.label}
          </span>
          <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-slate-950/80 text-slate-200 border border-slate-700/80">
            {hospital.type === 'blood_bank' ? 'Blood Bank' : 'Hospital'}
          </span>
        </div>

        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-slate-950/85 border border-slate-700/80 text-[11px] font-mono text-sky-300 flex items-center gap-1">
          <Thermometer size={11} />
          {hospital.cold_storage_temp ?? 4.2}°C
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-base font-extrabold text-white leading-tight truncate">
            {hospital.name}
          </h3>
          <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5 truncate">
            <MapPin size={11} className="text-rose-400 flex-shrink-0" />
            {hospital.city} · {hospital.address}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* Director + Contact */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            {!avatarErr && hospital.director?.avatar ? (
              <img
                src={hospital.director.avatar}
                alt={hospital.director.name}
                onError={() => setAvatarErr(true)}
                className="w-9 h-9 rounded-full object-cover border border-slate-700 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                <UserCheck size={15} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {hospital.director?.name || 'Duty Medical Officer'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {hospital.director?.title || 'Transfusion Lead'}
              </p>
            </div>
          </div>

          <a
            href={`tel:${(hospital.phone || '').replace(/\s+/g, '')}`}
            className="flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/25 px-2.5 py-1.5 rounded-lg flex-shrink-0"
          >
            <Phone size={11} />
            {hospital.phone}
          </a>
        </div>

        {/* Cold-Storage Capacity Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Cold-Storage Capacity</span>
            <span className="font-mono font-bold text-slate-200">
              {totalUnits} / {capacity} units ({capacityPct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${capacityPct}%`,
                background:
                  capacityPct > 85
                    ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                    : 'linear-gradient(90deg, #0ea5e9, #34d399)',
              }}
            />
          </div>
        </div>

        {/* Full 8-Blood-Group Inventory Table */}
        <div className="rounded-xl bg-slate-950/65 border border-slate-800 overflow-hidden">
          <div className="px-3 py-2 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Droplets size={12} className="text-rose-500" />
              8-Blood-Group Inventory
            </span>
            <span className="text-[10px] font-mono text-slate-400">Units / &lt;48h Exp</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
                <th className="py-1.5 px-3 text-left font-semibold">Group</th>
                <th className="py-1.5 px-2 text-right font-semibold">Stock</th>
                <th className="py-1.5 px-2 text-center font-semibold">Expiring</th>
                <th className="py-1.5 px-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {BLOOD_GROUPS.map(bg => {
                const inv = hospital.inventory?.[bg] || { units: 0, status: 'critical', expiring_48h: 0 };
                const rowSc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.safe;
                return (
                  <tr key={bg} className="hover:bg-slate-800/35 transition-colors">
                    <td className="py-1.5 px-3">
                      <span
                        className="inline-block w-9 text-center font-mono font-bold text-[11px] py-0.5 rounded"
                        style={{
                          background: `${BG_COLORS[bg]}1c`,
                          color: BG_COLORS[bg],
                          border: `1px solid ${BG_COLORS[bg]}38`,
                        }}
                      >
                        {bg}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-white">
                      {inv.units} u
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono">
                      {inv.expiring_48h > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-400">
                          <AlertTriangle size={10} />
                          {inv.expiring_48h}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: rowSc.bg, color: rowSc.color }}
                      >
                        {rowSc.shortLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onInspect(hospital)}
          className="mt-auto w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800/90 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send size={13} />
          {readOnly ? 'View Blood Availability' : 'Inspect Facility & Request Transfer'}
        </button>
      </div>
    </div>
  );
}

export default function DirectoryView({
  hospitals,
  globalSearch,
  onClearGlobalSearch,
  onSelectHospital,
  highlightedHospitalId,
  compact = false,
  readOnly = false,
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const query = (localSearch || globalSearch || '').trim().toLowerCase();

  const filtered = hospitals.filter(h => {
    if (typeFilter !== 'all' && h.type !== typeFilter) return false;
    if (statusFilter !== 'all' && h.status !== statusFilter) return false;
    if (!query) return true;
    return (
      h.name.toLowerCase().includes(query) ||
      h.city.toLowerCase().includes(query) ||
      h.address?.toLowerCase().includes(query) ||
      h.director?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div id="tour-directory-overview" className={`${compact ? 'space-y-4' : 'space-y-5 sm:space-y-6'} fade-up rounded-2xl`}>
      {/* Filter Header */}
      <div className="bg-[#0c1428]/95 border border-slate-800/95 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Building2 size={18} className="text-rose-500" />
            Ranchi Hospital &amp; Blood Bank Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filtered.length} of {hospitals.length} Ranchi facilities · Full cold-storage &amp; 8-blood-group telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {globalSearch && !localSearch && onClearGlobalSearch && (
            <button
              type="button"
              onClick={onClearGlobalSearch}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-rose-500/15 text-rose-200 border border-rose-500/35 hover:bg-rose-500/25 cursor-pointer"
            >
              Filter: &ldquo;{globalSearch}&rdquo; ×
            </button>
          )}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Filter facility, zone, director..."
              className="pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-950/90 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60 w-full"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-xl p-1 flex-wrap">
            <Filter size={12} className="text-slate-500 ml-2 mr-1" />
            {[
              { id: 'all', label: 'All' },
              { id: 'blood_bank', label: 'Blood Banks' },
              { id: 'hospital', label: 'Hospitals' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by facility status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="select-dark text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="critical">Critical Only</option>
            <option value="low">Low Stock</option>
            <option value="safe">Safe Stock</option>
          </select>
        </div>
      </div>

      {/* Grid of Facilities */}
      {filtered.length === 0 ? (
        <div className="bg-[#0c1428]/95 border border-slate-800/95 rounded-2xl p-12 text-center">
          <Building2 size={32} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No facilities match your filter</p>
          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              setTypeFilter('all');
              setStatusFilter('all');
            }}
            className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 ${compact ? 'gap-4' : 'gap-6'}`}>
          {filtered.map(h => (
            <FacilityCard
              key={h.id}
              hospital={h}
              onInspect={onSelectHospital}
              isHighlighted={highlightedHospitalId === h.id}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}
