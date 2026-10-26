import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatINR, formatRating } from '@/utils/format';

const NAVY = '#789181';
const TEAL = '#54d991';
const NAVY_700 = '#9aafa0';
const NAVY_300 = '#71877a';
const AMBER = '#f2bd62';
const RED = '#f27676';

export const CHART_COLORS = [TEAL, NAVY, AMBER, '#89a6d8', '#d38bd0', '#6ec9c2'];

interface TooltipEntry {
  name: string;
  value: number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatter?: (v: number) => string;
}

function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip rounded-xl px-3 py-2.5 shadow-lg text-xs">
      {label != null && label !== '' && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-white/70">
          {p.name}: <span className="font-semibold text-white">{formatter ? formatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

interface BarProps {
  data: { label: string; value: number }[];
  xLabel?: string;
  formatter?: (v: number) => string;
  color?: string;
  height?: number;
}

export function BarChartCard({ data, xLabel, formatter = (v) => String(v), color = TEAL, height = 280 }: BarProps) {
  if (!data.length) return <div className="text-sm text-navy-400 py-8 text-center">No data available.</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 5" stroke="rgba(177, 203, 185, .11)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9aaa9f' }}
          angle={data.length > 5 ? -20 : 0}
          textAnchor={data.length > 5 ? 'end' : 'middle'}
          height={data.length > 5 ? 60 : 30}
          interval={0}
          axisLine={{ stroke: 'rgba(177, 203, 185, .16)' }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: '#9aaa9f' }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: 'rgba(117, 237, 170, .06)' }} />
        <Bar dataKey="value" name={xLabel} fill={color} radius={[6, 6, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface LineProps {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  formatter?: (v: number) => string;
  height?: number;
  lines?: { key: string; name: string; color: string }[];
}

export function LineChartCard({ data, xKey, yKey, formatter = (v) => String(v), height = 280, lines }: LineProps) {
  if (!data.length) return <div className="text-sm text-navy-400 py-8 text-center">No data available.</div>;
  const lineData = lines ?? [{ key: yKey, name: yKey, color: TEAL }];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 5" stroke="rgba(177, 203, 185, .11)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#9aaa9f' }} axisLine={{ stroke: 'rgba(177, 203, 185, .16)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9aaa9f' }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        {lineData.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#a8b8ad', paddingTop: 8 }} />}
        {lineData.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface ScatterProps {
  data: { x: number; y: number; name: string }[];
  xLabel: string;
  yLabel: string;
  height?: number;
}

export function ScatterChartCard({ data, xLabel, yLabel, height = 280 }: ScatterProps) {
  if (!data.length) return <div className="text-sm text-navy-400 py-8 text-center">No data available.</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 5" stroke="rgba(177, 203, 185, .11)" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          tick={{ fontSize: 11, fill: '#9aaa9f' }}
          tickFormatter={(v) => formatINR(v, { compact: true })}
          axisLine={{ stroke: 'rgba(177, 203, 185, .16)' }}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          domain={[0, 5]}
          tick={{ fontSize: 11, fill: '#9aaa9f' }}
          tickFormatter={(v) => v.toFixed(1)}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload;
            return (
              <div className="chart-tooltip rounded-xl px-3 py-2.5 shadow-lg text-xs">
                <p className="font-semibold mb-0.5">{p.name}</p>
                <p className="text-white/70">Price: {formatINR(p.x)}</p>
                <p className="text-white/70">Rating: {formatRating(p.y)}</p>
              </div>
            );
          }}
        />
        <Scatter data={data} fill={TEAL} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

interface PieProps {
  data: { name: string; value: number }[];
  formatter?: (v: number) => string;
  height?: number;
}

export function PieChartCard({ data, formatter = (v) => String(v), height = 280 }: PieProps) {
  if (!data.length) return <div className="text-sm text-navy-400 py-8 text-center">No data available.</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={45}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface MultiBarProps {
  data: Record<string, string | number>[];
  xKey: string;
  bars: { key: string; name: string; color: string }[];
  formatter?: (v: number) => string;
  height?: number;
}

export function MultiBarChartCard({ data, xKey, bars, formatter = (v) => String(v), height = 280 }: MultiBarProps) {
  if (!data.length) return <div className="text-sm text-navy-400 py-8 text-center">No data available.</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 5" stroke="rgba(177, 203, 185, .11)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#9aaa9f' }} angle={data.length > 5 ? -20 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 60 : 30} interval={0} axisLine={{ stroke: 'rgba(177, 203, 185, .16)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9aaa9f' }} tickFormatter={(v) => formatINR(v, { compact: true })} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: 'rgba(117, 237, 170, .06)' }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#a8b8ad', paddingTop: 8 }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[4, 4, 0, 0]} maxBarSize={48} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export { NAVY, TEAL, NAVY_700, NAVY_300, AMBER, RED };
