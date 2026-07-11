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
  const cards = [
    {
      label: "GMV",
      value: `R$${(k.gmv / 1e6).toFixed(1)}M`,
      tone: "cyan",
      tip: "Gross merchandise value — the total R$ value of every order in the analysis window (Sep 2016–Aug 2018).",
    },
    {
      label: "Orders",
      value: compact(k.orders),
      tone: "violet",
      sub: `${compact(k.customers)} customers`,
      tip: "Total orders placed. 'Customers' counts unique buyers — fewer than orders because a small share buy more than once.",
    },
    {
      label: "Avg order value",
      value: brl(k.aov),
      tone: "blue",
      tip: "Average order value — GMV divided by the number of orders.",
    },
    {
      label: "Repeat rate",
      value: pct(k.repeat_rate),
      tone: "pink",
      tip: "Share of customers who placed more than one order. Only ~3% do — Olist is largely a one-purchase marketplace, which makes this the core growth constraint.",
    },
    {
      label: "Avg review",
      value: `${k.avg_review.toFixed(2)}★`,
      tone: "amber",
      tip: "Mean 1–5 star rating across all reviewed orders. The 1-star tail is driven mostly by late delivery, not the product.",
    },
    {
      label: "On-time delivery",
      value: pct(k.on_time_rate),
      tone: "lime",
      sub: `${k.avg_delivery_days}d avg`,
      tip: "Share of delivered orders that arrived on or before the estimated date. 'Xd avg' is the mean delivery time from purchase to arrival.",
    },
  ];
  return (
    <div className="kpis">
      {cards.map((c) => (
        <div key={c.label} className={`kpi ${c.tone}`}>
          <div className="tile-head">
            <span className="k">{c.label}</span>
            <Tip text={c.tip} />
          </div>
          <div className="v">{c.value}</div>
          {c.sub && <div className="s">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
