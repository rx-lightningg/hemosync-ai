import { useState, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Circle, Marker, Tooltip } from 'react-leaflet';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Radio,
  Users,
  Search,
  Send,
  Smartphone,
  MessageSquare,
  Bell,
  CheckCircle2,
  MapPin,
  Sparkles,
  PhoneCall,
  HeartHandshake,
} from 'lucide-react';
import { BG_COLORS, BLOOD_GROUPS, RANCHI_CENTER } from '../constants/blood';
import NearbyDonorsPanel from './NearbyDonorsPanel';

function createDonorDot(bg, eligible) {
  const color = BG_COLORS[bg] || '#38bdf8';
  return L.divIcon({
    className: 'hemo-marker-wrap',
    html: `<div style="width:14px;height:14px;border-radius:999px;background:${color};border:2px solid #fff;opacity:${
      eligible ? 1 : 0.45
    };box-shadow:0 0 10px ${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function DonorHubView({
  donorsData,
  hospitals,
  onSendBlast,
  blastLoading,
  lastCampaign,
  bloodFilter: controlledBloodFilter,
  setBloodFilter: setControlledBloodFilter,
  onCallDonor,
  onOpenRegisterDonor,
  lastRegisteredDonor = null,
  compact = false,
}) {
  const [localBloodFilter, setLocalBloodFilter] = useState('ALL');
  const bloodFilter = setControlledBloodFilter ? controlledBloodFilter : localBloodFilter;
  const setBloodFilter = setControlledBloodFilter || setLocalBloodFilter;
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [search, setSearch] = useState('');

  // Campaign simulator state
  const [targetBG, setTargetBG] = useState('O-');
  const [targetHospitalId, setTargetHospitalId] = useState('h2');
  const [radiusKm, setRadiusKm] = useState(12);
  const [channels, setChannels] = useState({
    SMS: true,
    WhatsApp: true,
    'App Push': true,
  });
  const [customMsg, setCustomMsg] = useState(
    'URGENT HemoSync Alert: Trauma emergency requires O- units at Sadar Hospital Ranchi. Reply YES to reserve a priority donor slot.'
  );

  const donors = useMemo(() => donorsData?.donors || [], [donorsData]);
  const campaigns = donorsData?.campaigns || [];
  const activeHub = hospitals.find(h => h.id === targetHospitalId) || hospitals[0];

  const filteredDonors = useMemo(() => {
    return donors.filter(d => {
      if (bloodFilter !== 'ALL' && d.blood_group !== bloodFilter) return false;
      if (eligibleOnly && !d.eligible) return false;
      if (d.distance_km > radiusKm + 5) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.neighborhood.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [donors, bloodFilter, eligibleOnly, radiusKm, search]);

  const toggleChannel = ch => {
    setChannels(prev => ({ ...prev, [ch]: !prev[ch] }));
  };

  const handleLaunchBlast = async () => {
    const activeChannels = Object.entries(channels)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
    await onSendBlast(targetBG, {
      radius_km: radiusKm,
      channels: activeChannels.length ? activeChannels : ['SMS', 'WhatsApp'],
      hospital_id: targetHospitalId,
      message: customMsg,
    });
  };

  const displayCampaign = lastCampaign || campaigns[0] || null;
  const analyticsBars = displayCampaign
    ? [
        { stage: 'Sent', count: displayCampaign.donors_notified },
        { stage: 'Delivered', count: displayCampaign.delivered },
        { stage: 'Read', count: displayCampaign.opened },
        { stage: 'Confirmed', count: displayCampaign.confirmed_appointments },
      ]
    : [];

  return (
    <div id="tour-donors-section" className={`${compact ? 'space-y-4' : 'space-y-5 sm:space-y-6'} fade-up rounded-2xl`}>
      {/* Quick Register Voluntary Donor Bar + Confirmation */}
      <div className="bg-[#0c1428]/95 border border-emerald-500/30 rounded-2xl px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-white flex items-center gap-2">
            <HeartHandshake size={15} className="text-emerald-400" />
            Voluntary Donor Onboarding &amp; Rapid Call Sync
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Register walk-in or community Ranchi donors directly into the live Regional Registry &amp; &lt;3 km Emergency Call queue.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {lastRegisteredDonor && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
              <CheckCircle2 size={12} />
              Added: {lastRegisteredDonor.name} ({lastRegisteredDonor.blood_group})
            </span>
          )}
          {onOpenRegisterDonor && (
            <button
              type="button"
              onClick={() => onOpenRegisterDonor(targetBG)}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/45 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <HeartHandshake size={14} />
              Register as Voluntary Donor
            </button>
          )}
        </div>
      </div>

      {/* Last-Resort Direct Call Nearby Donors (<3 km) */}
      <NearbyDonorsPanel
        hospital={activeHub}
        bloodGroup={targetBG}
        onCallDonor={onCallDonor}
        refreshKey={donors.length}
        compact
      />

      {/* Top Row: Blast Campaign Simulator + Live Radius Map */}
      <div className={`grid grid-cols-1 xl:grid-cols-12 ${compact ? 'gap-4' : 'gap-4 sm:gap-6'}`}>
        {/* Campaign Simulator */}
        <div className="xl:col-span-5 bg-[#0c1428]/95 border border-slate-800/95 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio size={16} className="text-rose-500" />
                Emergency SMS &amp; WhatsApp Blast
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Geo-fenced donor mobilization with real-time delivery analytics
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {donors.filter(d => d.eligible).length} eligible
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Blood Group
              </label>
              <select
                value={targetBG}
                onChange={e => {
                  const bg = e.target.value;
                  setTargetBG(bg);
                  setBloodFilter(bg);
                  setCustomMsg(
                    `URGENT HemoSync Alert: Emergency trauma need for ${bg} units at ${
                      activeHub?.name || 'Ranchi Regional Hub'
                    }. Reply YES to confirm fast-track donation.`
                  );
                }}
                className="select-dark w-full text-xs"
              >
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Receiving Facility
              </label>
              <select
                value={targetHospitalId}
                onChange={e => setTargetHospitalId(e.target.value)}
                className="select-dark w-full text-xs"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Radius Slider */}
          <div className="p-3 rounded-xl bg-slate-950/65 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Geo-Fence Dispatch Radius</span>
              <span className="font-mono font-bold text-rose-400">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min={5}
              max={25}
              step={1}
              value={radiusKm}
              onChange={e => setRadiusKm(Number(e.target.value))}
              className="w-full hemo-slider"
              aria-label="Donor dispatch radius in km"
            />
          </div>

          {/* Channels */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'SMS', icon: Smartphone },
              { key: 'WhatsApp', icon: MessageSquare },
              { key: 'App Push', icon: Bell },
            ].map(({ key, icon: Icon }) => {
              const active = channels[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleChannel(key)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    active
                      ? 'bg-rose-500/15 border-rose-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <Icon size={13} className={active ? 'text-rose-400' : 'text-slate-500'} />
                  {key}
                </button>
              );
            })}
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              Campaign Message Template
            </label>
            <textarea
              rows={2}
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
              className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500/60"
            />
          </div>

          <button
            type="button"
            onClick={handleLaunchBlast}
            disabled={blastLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {blastLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending Multi-Channel Blast...
              </>
            ) : (
              <>
                <Send size={14} />
                Send Emergency SMS/WhatsApp Blast
              </>
            )}
          </button>

          {/* Delivery Analytics */}
          {displayCampaign && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 slide-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Campaign {displayCampaign.campaign_id} Analytics
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {displayCampaign.sent_at}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Delivered</p>
                  <p className="text-sm font-mono font-bold text-white">
                    {displayCampaign.delivery_rate_pct}%
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Read Rate</p>
                  <p className="text-sm font-mono font-bold text-sky-400">
                    {displayCampaign.read_rate_pct}%
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Confirmed</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">
                    {displayCampaign.confirmed_appointments} donors
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={115}>
                <BarChart data={analyticsBars} margin={{ top: 4, right: 6, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <ChartTooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.96)',
                      border: '1px solid rgba(51,65,85,0.9)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Geo-Radius Donor Map */}
        <div className="xl:col-span-7 bg-[#0c1428]/95 border border-slate-800/95 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin size={15} className="text-sky-400" />
                Donor Geo-Fence Radius Map ({radiusKm} km)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Centered on {activeHub?.name || 'Ranchi Central'} · {filteredDonors.length} donors plotted
              </p>
            </div>
            <span className="text-[11px] font-mono text-rose-300 flex items-center gap-1 bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 rounded-full">
              <Sparkles size={11} />
              Target: {targetBG}
            </span>
          </div>

          <div className="h-[320px] lg:h-[380px] rounded-xl overflow-hidden border border-slate-800">
            <MapContainer
              center={[activeHub?.lat || RANCHI_CENTER[0], activeHub?.lng || RANCHI_CENTER[1]]}
              zoom={12}
              scrollWheelZoom
              className="w-full h-full"
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                subdomains={['a', 'b', 'c']}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {activeHub && (
                <Circle
                  center={[activeHub.lat, activeHub.lng]}
                  radius={radiusKm * 1000}
                  pathOptions={{
                    color: '#f43f5e',
                    fillColor: '#f43f5e',
                    fillOpacity: 0.08,
                    weight: 1.5,
                    dashArray: '6 4',
                  }}
                />
              )}
              {filteredDonors.map(d => (
                <Marker
                  key={d.id}
                  position={[d.lat, d.lng]}
                  icon={createDonorDot(d.blood_group, d.eligible)}
                >
                  <Tooltip direction="top" className="hemo-leaflet-tooltip">
                    <div className="text-xs">
                      <p className="font-bold text-white">
                        {d.name} ({d.blood_group})
                      </p>
                      <p className="text-slate-400">
                        {d.neighborhood} · {d.distance_km} km away
                      </p>
                    </div>
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Live Regional Donor Registry Table */}
      <div className="bg-[#0c1428]/95 border border-slate-800/95 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users size={16} className="text-sky-400" />
              Live Regional Donor Registry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Filter by blood type, eligibility (≥90 days since last donation), or neighborhood
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search donor or zone..."
                className="w-full sm:w-auto pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-950/90 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {['ALL', ...BLOOD_GROUPS].map(bg => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBloodFilter(bg)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    bloodFilter === bg
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-950/75 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setEligibleOnly(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                eligibleOnly
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  : 'bg-slate-950/75 border-slate-800 text-slate-400'
              }`}
            >
              {eligibleOnly ? 'Eligible Only (≥90d)' : 'Showing All Donors'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="py-2.5 px-3 text-left">Donor ID</th>
                <th className="py-2.5 px-3 text-left">Name</th>
                <th className="py-2.5 px-3 text-center">Blood Type</th>
                <th className="py-2.5 px-3 text-left">Neighborhood</th>
                <th className="py-2.5 px-3 text-right">Distance</th>
                <th className="py-2.5 px-3 text-right">Last Donated</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDonors.map(d => (
                <tr key={d.id} className="hover:bg-slate-800/35 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-400">{d.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">
                    <span className="inline-flex items-center gap-1.5">
                      {d.name}
                      {d.newly_registered && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40">
                          NEW
                        </span>
                      )}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-500">
                      {d.phone_masked}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className="inline-block font-mono font-bold px-2 py-0.5 rounded"
                      style={{
                        background: `${BG_COLORS[d.blood_group]}22`,
                        color: BG_COLORS[d.blood_group],
                        border: `1px solid ${BG_COLORS[d.blood_group]}40`,
                      }}
                    >
                      {d.blood_group}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{d.neighborhood}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-sky-300">
                    {d.distance_km} km
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {d.last_donated_days}d ago
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {d.en_route ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        EN ROUTE (+1u)
                      </span>
                    ) : d.eligible ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        ELIGIBLE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                        COOLING OFF
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {d.eligible && !d.en_route && onCallDonor ? (
                      <button
                        type="button"
                        onClick={() =>
                          onCallDonor({
                            donor: d,
                            hospital: activeHub,
                            bloodGroup: d.blood_group,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-all"
                      >
                        <PhoneCall size={11} />
                        Call Donor Now
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
