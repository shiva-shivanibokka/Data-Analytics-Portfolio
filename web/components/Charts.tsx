"use client";

import {
  Area,
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

const BLUE = "#2563eb";
const LT = "#93c5fd";

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
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis dataKey="order_month" tick={{ fontSize: 11 }} interval={2} />
        <YAxis yAxisId="l" tick={{ fontSize: 11 }} tickFormatter={compact} />
        <YAxis
          yAxisId="r"
          orientation="right"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => compact(v as number)}
        />
        <Tooltip
          formatter={(v, n) => (n === "gmv" ? brl(v as number) : compact(v as number))}
        />
        <Bar yAxisId="l" dataKey="orders" fill={LT} radius={[3, 3, 0, 0]} name="orders" />
        <Line yAxisId="r" dataKey="gmv" stroke={BLUE} strokeWidth={2.5} dot={false} name="gmv" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function OnTimeChart({ data }: { data: Monthly[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis dataKey="order_month" tick={{ fontSize: 11 }} interval={2} />
        <YAxis domain={[0.6, 1]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round((v as number) * 100)}%`} />
        <Tooltip formatter={(v) => `${((v as number) * 100).toFixed(1)}%`} />
        <Area dataKey="on_time_rate" stroke={BLUE} fill={LT} fillOpacity={0.4} name="on-time rate" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data }: { data: { category: string; gmv: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={compact} />
        <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={140} />
        <Tooltip formatter={(v) => brl(v as number)} />
        <Bar dataKey="gmv" fill={BLUE} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FunnelChart({ data }: { data: { stage: string; orders: number; pct_of_top: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={compact} />
        <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={90} />
        <Tooltip formatter={(v) => compact(v as number)} />
        <Bar dataKey="orders" radius={[0, 3, 3, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? BLUE : LT} />
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
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={compact} />
        <YAxis type="category" dataKey="customer_state" tick={{ fontSize: 11 }} width={40} />
        <Tooltip formatter={(v) => compact(v as number)} />
        <Bar dataKey="orders" fill={BLUE} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
