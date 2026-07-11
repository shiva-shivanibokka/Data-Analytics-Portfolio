import { brl, compact, pct } from "@/lib/format";
import Tip from "./Tip";

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
  // sub = only genuinely additional data; every explanation lives in the tooltip.
  const cards = [
    {
      label: "GMV",
      value: `R$${(k.gmv / 1e6).toFixed(1)}M`,
      tip: "Gross merchandise value — the total R$ value of every order in the analysis window (Sep 2016–Aug 2018).",
    },
    {
      label: "Orders",
      value: compact(k.orders),
      sub: `${compact(k.customers)} customers`,
      tip: "Total orders placed. 'Customers' counts unique buyers — fewer than orders because a small share buy more than once.",
    },
    {
      label: "Avg order value",
      value: brl(k.aov),
      tip: "Average order value — GMV divided by the number of orders.",
    },
    {
      label: "Repeat rate",
      value: pct(k.repeat_rate),
      warn: true,
      tip: "Share of customers who placed more than one order. Only ~3% do — Olist is largely a one-purchase marketplace, which makes this the core growth constraint.",
    },
    {
      label: "Avg review",
      value: `${k.avg_review.toFixed(2)}★`,
      tip: "Mean 1–5 star rating across all reviewed orders. The 1-star tail is driven mostly by late delivery, not the product.",
    },
    {
      label: "On-time delivery",
      value: pct(k.on_time_rate),
      sub: `${k.avg_delivery_days}d avg`,
      tip: "Share of delivered orders that arrived on or before the estimated date. 'Xd avg' is the mean delivery time from purchase to arrival.",
    },
  ];
  return (
    <div className="kpis">
      {cards.map((c) => (
        <div key={c.label} className="kpi">
          <div className="tile-head">
            <span className="k">{c.label}</span>
            <Tip text={c.tip} />
          </div>
          <div className={`v${c.warn ? " warn" : ""}`}>{c.value}</div>
          {c.sub && <div className="s">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
