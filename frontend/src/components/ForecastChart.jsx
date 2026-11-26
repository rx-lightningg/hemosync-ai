import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingDown, Brain, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { BLOOD_GROUPS } from '../constants/blood';

const CustomTooltip = ({ active, payload, label, shortageDay }) => {
  if (!active || !payload?.length) return null;
  const isShortage = label === shortageDay;
  return (
    <div className="tooltip-custom p-3 min-w-[175px]">
      <p className="font-bold text-white mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>
            {p.value} units
          </span>
        </div>
      ))}
      {isShortage && (
        <div className="mt-2 pt-2 border-t border-rose-500/30 text-xs text-rose-400 font-semibold flex items-center gap-1.5">
          <AlertTriangle size={12} />
          AI predicts shortage threshold
        </div>
      )}
    </div>
  );
};

export default function ForecastChart({
  forecast,
  bloodGroup,
  setBloodGroup,
  scenario,
  setScenario,
  scenarios,
  height = 250,
}) {
  if (!forecast) {
    return (
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5 min-h-[320px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-slate-400 text-xs">Loading AI predictive model...</p>
        </div>
      </div>
    );
  }

  const data = forecast.days.map((day, i) => ({
    day,
    inventory: forecast.current_inventory[i],
    demand: forecast.predicted_demand[i],
  }));

  const shortageLabel = forecast.shortage_day_label;
  const shortageIdx = forecast.shortage_day_index;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Brain size={16} className="text-violet-400" />
            AI Shortage Forecast
            <span className="text-xs font-normal text-slate-400">· Next 14 Days</span>
          </h2>
          {shortageLabel ? (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-400 font-semibold">
              <TrendingDown size={13} />
              <span>
                Predicted shortage: <strong>{shortageLabel}</strong> (Day {shortageIdx + 1})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-medium">
              <CheckCircle2 size={13} />
              <span>No regional shortage predicted in next 14 days</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            aria-label="Forecast blood group"
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
            aria-label="Forecast scenario"
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

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="demGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip shortageDay={shortageLabel} />} />
          <Legend
            formatter={val => <span style={{ color: '#cbd5e1', fontSize: 11 }}>{val}</span>}
          />
          {shortageLabel && (
            <ReferenceLine
              x={shortageLabel}
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="5 3"
              label={{
                value: 'Shortage',
                position: 'insideTopRight',
                fill: '#fb7185',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            />
          )}
          <ReferenceLine
            y={20}
            stroke="#fbbf24"
            strokeWidth={1}
            strokeDasharray="4 4"
            label={{ value: 'Critical (20u)', position: 'insideTopLeft', fill: '#fbbf24', fontSize: 9 }}
          />
          <Area
            type="monotone"
            dataKey="inventory"
            name="Projected Inventory"
            stroke="#38bdf8"
            strokeWidth={2.5}
            fill="url(#invGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#38bdf8' }}
          />
          <Area
            type="monotone"
            dataKey="demand"
            name="AI Predicted Demand"
            stroke="#f43f5e"
            strokeWidth={2.5}
            fill="url(#demGrad)"
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 5, fill: '#f43f5e' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 p-3 rounded-xl text-xs bg-violet-500/10 border border-violet-500/25 flex items-start gap-2">
        <Sparkles size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
        <p className="text-slate-300 leading-relaxed">
          <strong className="text-violet-300">AI Insight: </strong>
          {scenario === 'dengue'
            ? `Dengue outbreak spike lifts ${bloodGroup} utilization by ~80%. Proactive donor mobilization advised.`
            : scenario === 'holiday'
            ? `Holiday period suppresses voluntary collections by ~45%. Pre-position surplus buffers at trauma hubs.`
            : `Baseline trajectory for ${bloodGroup} monitored. ${
                shortageLabel
                  ? `Critical threshold crossed by ${shortageLabel}.`
                  : 'Regional supply remains sustainable over 14 days.'
              }`}
        </p>
      </div>
    </div>
  );
}
