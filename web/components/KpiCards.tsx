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
    { label: "GMV", value: `R$${(k.gmv / 1e6).toFixed(1)}M`, sub: "gross merchandise value" },
    { label: "Orders", value: compact(k.orders), sub: `${compact(k.customers)} customers` },
    { label: "Avg order value", value: brl(k.aov), sub: "per order" },
    { label: "Repeat rate", value: pct(k.repeat_rate), sub: "the core Olist problem", warn: true },
    { label: "Avg review", value: `${k.avg_review.toFixed(2)}★`, sub: "out of 5" },
    { label: "On-time delivery", value: pct(k.on_time_rate), sub: `${k.avg_delivery_days}d avg` },
  ];
  return (
    <div className="kpis">
      {cards.map((c) => (
        <div key={c.label} className="kpi">
          <div className="k">{c.label}</div>
          <div className={`v${c.warn ? " warn" : ""}`}>{c.value}</div>
          <div className="s">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
