import { useState, useEffect } from 'react';
import { PhoneCall, MapPin, ShieldCheck, CheckCircle2, Siren } from 'lucide-react';
import { fetchNearbyDonors } from '../api';
import { BG_COLORS } from '../constants/blood';
import { getLocalNearbyDonors } from '../utils/standaloneEngine';

export default function NearbyDonorsPanel({
  hospital,
  bloodGroup = 'O-',
  onCallDonor,
  title = 'Last-Resort: Call Nearby Donors (<3 km)',
  subtitle,
  compact = false,
  refreshKey = 0,
}) {
  const hospitalId = hospital?.id || 'h2';
  const [donors, setDonors] = useState(
    () => getLocalNearbyDonors({ hospitalId, bloodGroup, maxKm: 3.0 }).donors
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchNearbyDonors(hospitalId, bloodGroup, 3.0);
        if (active) {
          setDonors(
            res?.donors?.length
              ? res.donors
              : getLocalNearbyDonors({ hospitalId, bloodGroup, maxKm: 3.0 }).donors
          );
        }
      } catch (err) {
        console.warn('Nearby donors fallback:', err);
        if (active) {
          setDonors(getLocalNearbyDonors({ hospitalId, bloodGroup, maxKm: 3.0 }).donors);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [hospitalId, bloodGroup, hospital?.incoming_donors?.length, refreshKey]);

  const bgColor = BG_COLORS[bloodGroup] || '#f43f5e';

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-rose-950/25 via-slate-900/90 to-slate-950/90 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
            <Siren size={14} className="text-rose-400" />
            {title}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {subtitle ||
              `When inter-facility transfers aren't enough — verified ${bloodGroup} donors near ${
                hospital?.name || 'Ranchi Trauma Center'
              }`}
          </p>
        </div>

        <span
          className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full"
          style={{
            background: `${bgColor}22`,
            color: bgColor,
            border: `1px solid ${bgColor}45`,
          }}
        >
          {bloodGroup} · &lt;3 km
        </span>
      </div>

      {loading && donors.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className={compact ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5' : 'space-y-2'}>
          {donors.slice(0, 5).map(d => {
            const isEnRoute = Boolean(d.en_route);
            return (
              <div
                key={d.id}
                className={`rounded-xl p-3 border transition-all flex items-center justify-between gap-3 ${
                  isEnRoute
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">{d.name}</span>
                    {d.newly_registered && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40">
                        NEW
                      </span>
                    )}
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: `${bgColor}22`,
                        color: bgColor,
                        border: `1px solid ${bgColor}40`,
                      }}
                    >
                      {d.blood_group}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck size={10} />
                      Eligible · {d.last_donated_days}d ago
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-sky-300 font-mono flex items-center gap-1">
                      <MapPin size={10} />
                      {d.distance_km} km away • {d.neighborhood}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-slate-500">ETA {d.eta_minutes}m</span>
                  </p>
                </div>

                {isEnRoute ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex-shrink-0">
                    <CheckCircle2 size={13} />
                    En Route (+1u)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onCallDonor({
                        donor: d,
                        hospital,
                        bloodGroup: d.blood_group || bloodGroup,
                      })
                    }
                    className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 shadow-[0_0_16px_rgba(16,185,129,0.28)] hover:shadow-[0_0_22px_rgba(16,185,129,0.5)] transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <PhoneCall size={13} />
                    Call Donor Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
