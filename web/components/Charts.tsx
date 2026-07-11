"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl, compact } from "@/lib/format";

const CYAN = "#22d3ee";
const VIOLET = "#a78bfa";
const LIME = "#a3e635";
const GRID = "rgba(38, 48, 92, 0.55)";
const TICK = { fontSize: 11, fill: "#94a3c7", fontFamily: "var(--font-mono)" };

const tooltipStyle = {
  contentStyle: {
    background: "#0d1330",
    border: "1px solid #26305c",
    borderRadius: 10,
    color: "#eef2ff",
    fontSize: 12,
  },
  labelStyle: { color: "#94a3c7" },
  cursor: { fill: "rgba(167,139,250,0.08)" },
};

type Monthly = {
  order_month: string;
  orders: number;
  gmv: number;
  on_time_rate: number | null;
  avg_review: number | null;
};

export function MonthlyChart({ data }: { data: Monthly[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="barGrowth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CYAN} stopOpacity={0.95} />
            <stop offset="100%" stopColor={VIOLET} stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="order_month" tick={TICK} interval={2} stroke={GRID} />
        <YAxis yAxisId="l" tick={TICK} tickFormatter={compact} stroke={GRID} />
        <YAxis yAxisId="r" orientation="right" tick={TICK} tickFormatter={(v) => compact(v as number)} stroke={GRID} />
        <Tooltip {...tooltipStyle} formatter={(v, n) => (n === "gmv" ? brl(v as number) : compact(v as number))} />
        <Bar yAxisId="l" dataKey="orders" fill="url(#barGrowth)" radius={[3, 3, 0, 0]} name="orders" />
        <Line yAxisId="r" dataKey="gmv" stroke={CYAN} strokeWidth={2.5} dot={false} name="gmv" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function OnTimeChart({ data }: { data: Monthly[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="ontimeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LIME} stopOpacity={0.5} />
            <stop offset="100%" stopColor={LIME} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="order_month" tick={TICK} interval={2} stroke={GRID} />
        <YAxis domain={[0.6, 1]} tick={TICK} tickFormatter={(v) => `${Math.round((v as number) * 100)}%`} stroke={GRID} />
        <Tooltip {...tooltipStyle} formatter={(v) => `${((v as number) * 100).toFixed(1)}%`} />
        <Area dataKey="on_time_rate" stroke={LIME} strokeWidth={2} fill="url(#ontimeFill)" name="on-time rate" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data }: { data: { category: string; gmv: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
        <defs>
          <linearGradient id="barHoriz" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={VIOLET} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CYAN} stopOpacity={0.95} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={TICK} tickFormatter={compact} stroke={GRID} />
        <YAxis type="category" dataKey="category" tick={TICK} width={140} stroke={GRID} />
        <Tooltip {...tooltipStyle} formatter={(v) => brl(v as number)} />
        <Bar dataKey="gmv" fill="url(#barHoriz)" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FunnelChart({ data }: { data: { stage: string; orders: number; pct_of_top: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={TICK} tickFormatter={compact} stroke={GRID} />
        <YAxis type="category" dataKey="stage" tick={TICK} width={90} stroke={GRID} />
        <Tooltip {...tooltipStyle} formatter={(v) => compact(v as number)} />
        <Bar dataKey="orders" radius={[0, 3, 3, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? LIME : "rgba(34,211,238,0.55)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StateChart({ data }: { data: { customer_state: string; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <defs>
          <linearGradient id="barState" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={CYAN} stopOpacity={0.9} />
            <stop offset="100%" stopColor={VIOLET} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={TICK} tickFormatter={compact} stroke={GRID} />
        <YAxis type="category" dataKey="customer_state" tick={TICK} width={40} stroke={GRID} />
        <Tooltip {...tooltipStyle} formatter={(v) => compact(v as number)} />
        <Bar dataKey="orders" fill="url(#barState)" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
