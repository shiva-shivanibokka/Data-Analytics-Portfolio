import { brl, compact, pct } from "@/lib/format";

type Kpis = {
  orders: number;
  customers: number;
  gmv: number;
  aov: number;
  repeat_rate: number;
  avg_review: number;
  on_time_rate: number;
  avg_delivery_days: number;
};

export default function KpiCards({ k }: { k: Kpis }) {
  const cards = [
    { label: "GMV", value: brl(k.gmv), sub: "gross merchandise value" },
    { label: "Orders", value: compact(k.orders), sub: `${compact(k.customers)} customers` },
    { label: "Avg order value", value: brl(k.aov), sub: "per order" },
    { label: "Repeat rate", value: pct(k.repeat_rate), sub: "the core Olist problem", warn: true },
    { label: "Avg review", value: `${k.avg_review.toFixed(2)} ★`, sub: "out of 5" },
    { label: "On-time delivery", value: pct(k.on_time_rate), sub: `${k.avg_delivery_days}d avg` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</div>
          <div className={`mt-1 text-2xl font-bold ${c.warn ? "text-red-600" : "text-ink"}`}>
            {c.value}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
