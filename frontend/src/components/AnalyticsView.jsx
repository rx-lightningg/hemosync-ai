import { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  BrainCircuit,
  Sliders,
  TrendingDown,
  ShieldCheck,
  Sparkles,
  Activity,
  Droplets,
  CalendarClock,
} from 'lucide-react';
import { fetchForecast } from '../api';
import { BG_COLORS, BLOOD_GROUPS } from '../constants/blood';
import { getLocalForecast } from '../utils/standaloneEngine';
import HolographicReadinessWidget from './HolographicReadinessWidget';

const COMPONENTS = [
  {
    id: 'packed_rbc',
    label: 'Packed Red Cells',
    short: 'PRBC',
    shelfLife: '42 Days · 2–6°C',
    note: 'Primary trauma & surgical oxygen-carrying product',
    color: '#e11d48',
  },
  {
    id: 'platelets',
    label: 'Platelets',
    short: 'SDP/RDP',
    shelfLife: '5 Days · 20–24°C',
    note: 'Ultra-short shelf life; extreme dengue & oncology sensitivity',
    color: '#fbbf24',
  },
  {
    id: 'plasma',
    label: 'Plasma',
    short: 'FFP',
    shelfLife: '12 Months · -30°C',
    note: 'Coagulation factor reserve for massive transfusion protocols',
    color: '#38bdf8',
  },
];

export default function AnalyticsView({
  hospitals,
  bloodGroup,
  setBloodGroup,
  scenario,
  setScenario,
  scenarios,
  component = 'packed_rbc',
  setComponent,
  compact = false,
}) {
  const [localComponent, setLocalComponent] = useState(component);
  const activeComponent = setComponent ? component : localComponent;
  const updateComponent = setComponent || setLocalComponent;

  const [surgicalLoadPct, setSurgicalLoadPct] = useState(0);
  const [seasonalSpikePct, setSeasonalSpikePct] = useState(0);
  const [simForecast, setSimForecast] = useState(() =>
    getLocalForecast({
      bloodGroup,
      scenario,
      component: activeComponent,
      surgicalLoadPct: 0,
      seasonalSpikePct: 0,
      hospitalsOverride: hospitals,
    })
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchForecast(bloodGroup, scenario, {
          component: activeComponent,
          surgicalLoadPct,
          seasonalSpikePct,
        });
        if (active) {
          setSimForecast(
            res?.days?.length
              ? res
              : getLocalForecast({
                  bloodGroup,
                  scenario,
                  component: activeComponent,
                  surgicalLoadPct,
                  seasonalSpikePct,
                  hospitalsOverride: hospitals,
                })
          );
        }
      } catch (err) {
        console.warn('Analytics forecast fallback:', err);
        if (active) {
          setSimForecast(
            getLocalForecast({
              bloodGroup,
              scenario,
              component: activeComponent,
              surgicalLoadPct,
              seasonalSpikePct,
              hospitalsOverride: hospitals,
            })
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [bloodGroup, scenario, activeComponent, surgicalLoadPct, seasonalSpikePct, hospitals]);

  const activeComp = COMPONENTS.find(c => c.id === activeComponent) || COMPONENTS[0];

  const chartData = useMemo(() => {
    if (!simForecast) return [];
    return simForecast.days.map((day, idx) => ({
      day,
      inventory: simForecast.current_inventory[idx],
      demand: simForecast.predicted_demand[idx],
      bandLow: simForecast.confidence_low?.[idx] ?? simForecast.current_inventory[idx],
      bandHigh: simForecast.confidence_high?.[idx] ?? simForecast.current_inventory[idx],
    }));
  }, [simForecast]);

  const groupSummary = useMemo(() => {
    const dailyUsage = {
      'O-': 18,
      'O+': 22,
      'A-': 10,
      'A+': 20,
      'B-': 8,
      'B+': 18,
      'AB-': 4,
      'AB+': 12,
    };
    const compFactor = activeComponent === 'platelets' ? 0.42 : activeComponent === 'plasma' ? 0.78 : 1.0;
    const demandFactor = activeComponent === 'platelets' ? 0.72 : activeComponent === 'plasma' ? 0.65 : 1.0;
    const loadMult = Math.max(0.5, 1 + surgicalLoadPct / 100) * (1 + seasonalSpikePct / 100);

    return BLOOD_GROUPS.map(bg => {
      const total = hospitals.reduce(
        (sum, h) => sum + (h.inventory?.[bg]?.units ?? 0),
        0
      );
      const effectiveStock = Math.round(total * compFactor);
      const daily = Math.max(1, dailyUsage[bg] * demandFactor * loadMult);
      const daysCover = Number((effectiveStock / daily).toFixed(1));
      return {
        bg,
        units: effectiveStock,
        daysCover,
        color: BG_COLORS[bg],
      };
    });
  }, [hospitals, activeComponent, surgicalLoadPct, seasonalSpikePct]);

  return (
    <div id="tour-analytics-section" className={`${compact ? 'space-y-4' : 'space-y-6'} fade-up rounded-2xl`}>
      {/* Header + Component Breakdown Tabs + 3D Holographic Readiness Widget */}
      <div className={`grid grid-cols-1 xl:grid-cols-12 ${compact ? 'gap-4' : 'gap-4 sm:gap-6'} items-stretch`}>
        <div className="xl:col-span-8 bg-[#0c1428]/95 border border-slate-800/95 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <BrainCircuit size={18} className="text-violet-400" />
              AI Predictive Analytics &amp; What-If Suite
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              14-day stochastic supply/demand simulation across blood components &amp; surge elasticity
            </p>
          </div>

          {/* Component Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl self-start">
            {COMPONENTS.map(c => {
              const isSel = activeComponent === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => updateComponent(c.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isSel
                      ? 'bg-slate-800 text-white border border-slate-600 shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: c.color, boxShadow: isSel ? `0 0 8px ${c.color}` : 'none' }}
                  />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-4">
          <HolographicReadinessWidget hospitals={hospitals} />
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Droplets size={13} style={{ color: activeComp.color }} />
            Starting Component Stock
          </p>
          <p className="text-2xl font-extrabold font-mono text-white mt-1.5">
            {simForecast?.starting_units ?? '--'} <span className="text-xs font-normal text-slate-400">units ({bloodGroup})</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{activeComp.shelfLife}</p>
        </div>

        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Activity size={13} className="text-rose-400" />
            Simulated Daily Burn Rate
          </p>
          <p className="text-2xl font-extrabold font-mono text-rose-400 mt-1.5">
            {simForecast?.avg_daily_demand ?? '--'} <span className="text-xs font-normal text-slate-400">units / day</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Load +{surgicalLoadPct}% · Spike +{seasonalSpikePct}%
          </p>
        </div>

        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <CalendarClock size={13} className="text-sky-400" />
            Projected Days of Cover
          </p>
          <p className="text-2xl font-extrabold font-mono text-sky-400 mt-1.5">
            {simForecast?.days_of_supply ?? '--'} <span className="text-xs font-normal text-slate-400">days</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{activeComp.note}</p>
        </div>

        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            {simForecast?.shortage_day_label ? (
              <TrendingDown size={13} className="text-rose-400" />
            ) : (
              <ShieldCheck size={13} className="text-emerald-400" />
            )}
            14-Day Stockout Risk
          </p>
          <p
            className={`text-2xl font-extrabold font-mono mt-1.5 ${
              simForecast?.shortage_day_label ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {simForecast?.shortage_day_label ? simForecast.shortage_day_label : 'NOMINAL'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {simForecast?.shortage_day_label
              ? `Breaches 20u floor on Day ${simForecast.shortage_day_index + 1}`
              : 'Above 20u regional safety buffer'}
          </p>
        </div>
      </div>

      {/* Main Chart + What-If Simulator Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
        {/* 14-Day Supply/Demand Chart */}
        <div className="xl:col-span-2 bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {activeComp.label} — 14-Day Supply &amp; Demand Curve
                {loading && (
                  <span className="text-[10px] font-mono text-sky-400">
                    Recalculating...
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Includes P10–P90 confidence envelope &amp; critical threshold reference
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Analytics blood group"
                className="select-dark text-xs"
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
              >
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
              <select
                aria-label="Analytics base scenario"
                className="select-dark text-xs"
                value={scenario}
                onChange={e => setScenario(e.target.value)}
              >
                {scenarios.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="anaInvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="anaBandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.96)',
                  border: '1px solid rgba(51,65,85,0.95)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Legend
                formatter={val => <span style={{ color: '#cbd5e1', fontSize: 11 }}>{val}</span>}
              />
              <ReferenceLine
                y={20}
                stroke="#fbbf24"
                strokeDasharray="4 4"
                label={{ value: 'Safety Floor (20u)', position: 'insideTopLeft', fill: '#fbbf24', fontSize: 10 }}
              />
              {simForecast?.shortage_day_label && (
                <ReferenceLine
                  x={simForecast.shortage_day_label}
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  label={{
                    value: 'Shortage Trigger',
                    position: 'insideTopRight',
                    fill: '#fb7185',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="bandHigh"
                name="Upper Confidence Bound"
                stroke="none"
                fill="url(#anaBandGrad)"
              />
              <Area
                type="monotone"
                dataKey="inventory"
                name="Projected Supply"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fill="url(#anaInvGrad)"
              />
              <Line
                type="monotone"
                dataKey="demand"
                name="Simulated Demand"
                stroke="#f43f5e"
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={{ r: 2.5, fill: '#f43f5e' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* What-If Scenario Simulator Panel */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders size={15} className="text-rose-500" />
                What-If Scenario Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Stress-test regional cold-chain resilience against elective surgery surges and seasonal outbreaks.
              </p>
            </div>

            {/* Surgical Load Slider */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Surgical Load Variance</span>
                <span className="font-mono font-bold text-sky-400">
                  {surgicalLoadPct >= 0 ? `+${surgicalLoadPct}%` : `${surgicalLoadPct}%`}
                </span>
              </div>
              <input
                type="range"
                min={-25}
                max={100}
                step={5}
                value={surgicalLoadPct}
                onChange={e => setSurgicalLoadPct(Number(e.target.value))}
                className="w-full hemo-slider"
                aria-label="Surgical Load Simulator Slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-25% Deferral</span>
                <span>0% Baseline</span>
                <span>+100% Mass OR</span>
              </div>
            </div>

            {/* Seasonal Spike Slider */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Seasonal / Vector Spike</span>
                <span className="font-mono font-bold text-amber-400">+{seasonalSpikePct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={seasonalSpikePct}
                onChange={e => setSeasonalSpikePct(Number(e.target.value))}
                className="w-full hemo-slider"
                aria-label="Seasonal Spike Simulator Slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0% Normal</span>
                <span>+50% Monsoon</span>
                <span>+100% Outbreak</span>
              </div>
            </div>

            {/* Preset Quick Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setSurgicalLoadPct(0);
                  setSeasonalSpikePct(0);
                }}
                className="py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                Reset 0%
              </button>
              <button
                onClick={() => {
                  setSurgicalLoadPct(35);
                  setSeasonalSpikePct(25);
                }}
                className="py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 cursor-pointer"
              >
                Festival Rush
              </button>
              <button
                onClick={() => {
                  setSurgicalLoadPct(60);
                  setSeasonalSpikePct(75);
                }}
                className="py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 cursor-pointer"
              >
                Crisis Peak
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-start gap-2.5">
            <Sparkles size={15} className="text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              {simForecast?.shortage_day_label
                ? `Under +${surgicalLoadPct}% surgical & +${seasonalSpikePct}% seasonal stress, ${activeComp.short} (${bloodGroup}) exhausts safety buffer by ${simForecast.shortage_day_label}. Trigger Donor Hub blast or pre-position +${Math.max(15, Math.round((simForecast?.avg_daily_demand ?? 12) * 2))} units.`
                : `Supply absorbs +${surgicalLoadPct}% surgical load & +${seasonalSpikePct}% seasonal pressure across the 14-day window.`}
            </p>
          </div>
        </div>
      </div>

      {/* 8-Blood-Group Cover Comparison */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">
              Regional Days-of-Supply by Blood Group ({activeComp.short})
            </h3>
            <p className="text-xs text-slate-400">
              Click any blood group bar to focus the 14-day projection curve
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Target SLA ≥ 7.0 days</span>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={groupSummary} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
            <XAxis dataKey="bg" tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 700 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.96)',
                border: '1px solid rgba(51,65,85,0.95)',
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(val, name) => [
                name === 'daysCover' ? `${val} days` : `${val} units`,
                name === 'daysCover' ? 'Days Cover' : 'Available Stock',
              ]}
            />
            <ReferenceLine y={7} stroke="#34d399" strokeDasharray="4 4" />
            <Bar
              dataKey="daysCover"
              name="daysCover"
              radius={[6, 6, 0, 0]}
              onClick={entry => {
                if (entry?.bg) setBloodGroup(entry.bg);
              }}
              className="cursor-pointer"
            >
              {groupSummary.map(item => (
                <Cell
                  key={item.bg}
                  fill={item.bg === bloodGroup ? '#ffffff' : item.color}
                  fillOpacity={item.bg === bloodGroup ? 0.95 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
