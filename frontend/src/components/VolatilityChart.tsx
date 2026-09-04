/* VolatilityChart — Recharts visualization with price, mean, and ±1σ bands. */

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { InstrumentHistory } from '../types';

interface VolatilityChartProps {
  history: InstrumentHistory;
}

const formatRupee = (val: number) =>
  `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const p = payload[0]?.payload;
    if (!p) return null;
    const absZ = Math.abs(p.zScore);
    const isPos = p.zScore >= 0;
    const stateColor = absZ >= 2.5 ? '#E5453D' : absZ >= 1.5 ? '#F5A623' : '#00D09C';

    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #ECEFF2',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        fontSize: '0.775rem',
        minWidth: 190,
      }}>
        <div style={{ fontWeight: 700, color: '#1B1F2A', marginBottom: 6, borderBottom: '1px solid #F0F2F5', paddingBottom: 4 }}>
          {p.timeLabel}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#71788E' }}>Price:</span>
          <strong style={{ color: '#1B1F2A' }}>{formatRupee(p.price)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#71788E' }}>Z-Score:</span>
          <strong style={{ color: stateColor }}>
            {isPos ? '+' : ''}{p.zScore.toFixed(2)}σ
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#71788E' }}>Signal State:</span>
          <span style={{ fontWeight: 600, color: stateColor }}>{p.signalState}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F0F2F5', paddingTop: 4, marginTop: 4 }}>
          <span style={{ color: '#8C919D', fontSize: '0.725rem' }}>Rolling Mean (μ):</span>
          <span style={{ color: '#8C919D', fontSize: '0.725rem' }}>{formatRupee(p.mean)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8C919D', fontSize: '0.725rem' }}>±1σ Envelope:</span>
          <span style={{ color: '#8C919D', fontSize: '0.725rem' }}>
            {formatRupee(p.lower)} – {formatRupee(p.upper)}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function VolatilityChart({ history }: VolatilityChartProps) {
  // Reverse prices to display chronologically (oldest tick #1 → newest tick #20)
  const prices = [...history.prices].reverse();
  const mean = history.mean;
  const upper = mean + history.stddev;
  const lower = Math.max(mean - history.stddev, 0);

  const stddev = history.stddev > 0 ? history.stddev : 1;

  const data = prices.map((price, i) => {
    const z = (price - mean) / stddev;
    const absZ = Math.abs(z);
    const signalState = absZ >= 2.5 ? 'Meaningful Anomaly' : absZ >= 1.5 ? 'Notable Drift' : 'Normal Movement';
    const tickNumber = i + 1;
    const timeLabel = `Tick #${tickNumber} (T-${prices.length - tickNumber})`;

    return {
      tick: `T-${prices.length - 1 - i}`,
      timeLabel,
      price,
      zScore: z,
      signalState,
      mean: Number(mean.toFixed(2)),
      upper: Number(upper.toFixed(2)),
      lower: Number(lower.toFixed(2)),
      band: [Number(lower.toFixed(2)), Number(upper.toFixed(2))],
    };
  });

  const allValues = [...prices, upper, lower];
  const minY = Math.floor(Math.min(...allValues) * 0.995);
  const maxY = Math.ceil(Math.max(...allValues) * 1.005);

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 16, bottom: 8, left: 16 }}
        >
          <defs>
            <linearGradient id="amberBandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5A623" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#F5A623" stopOpacity={0.08} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="tick"
            tick={{ fontSize: 11, fill: '#8C919D' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            domain={[minY, maxY]}
            tick={{ fontSize: 11, fill: '#8C919D' }}
            tickFormatter={(val) => `₹${Math.round(val)}`}
            axisLine={false}
            tickLine={false}
            width={55}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Light amber filled area between ±1σ bands */}
          <Area
            type="monotone"
            dataKey="band"
            stroke="none"
            fill="url(#amberBandFill)"
            isAnimationActive={false}
          />

          {/* Upper +1σ band: dashed amber line */}
          <Line
            type="monotone"
            dataKey="upper"
            stroke="#F5A623"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />

          {/* Lower -1σ band: dashed amber line */}
          <Line
            type="monotone"
            dataKey="lower"
            stroke="#F5A623"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />

          {/* Mean (μ): solid line */}
          <Line
            type="monotone"
            dataKey="mean"
            stroke="#8C919D"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />

          {/* Price: dark solid line with dots */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#1B1F2A"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#1B1F2A' }}
            activeDot={{ r: 5, fill: '#F5A623', stroke: '#1B1F2A', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
