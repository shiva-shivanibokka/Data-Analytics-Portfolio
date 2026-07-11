"use client";

import { useState } from "react";
import KpiCards from "./KpiCards";
import Explorer from "./Explorer";
import Tip from "./Tip";
import { CategoryChart, FunnelChart, MonthlyChart, OnTimeChart, StateChart } from "./Charts";

const REPO = "https://github.com/shiva-shivanibokka/Data-Analytics-Portfolio/blob/main/notebooks";

type Monthly = { order_month: string; orders: number; gmv: number; on_time_rate: number | null; avg_review: number | null };
type Outcomes = { delivered_pct: number; in_progress_pct: number; failed_pct: number };
type Props = {
  kpis: Parameters<typeof KpiCards>[0]["k"];
  monthly: Monthly[];
  funnel: { stage: string; orders: number; pct_of_top: number }[];
  categories: { category: string; gmv: number }[];
  states: { customer_state: string; orders: number }[];
  outcomes: Outcomes;
};

const NB_TONES = ["cyan", "violet", "pink", "lime", "amber", "blue", "cyan"];

const TABS = [
  { id: "overview", label: "Overview", desc: "The headline KPIs — the whole business at a glance. Hover the ? on any card for what the metric means and why it matters." },
  { id: "growth", label: "Growth & Fulfillment", desc: "How the marketplace grew, how orders flow through to delivered, and where delivery reliability broke down in early 2018." },
  { id: "segments", label: "Segments", desc: "What sells and where — revenue by product category and order volume by customer state." },
  { id: "explorer", label: "Live Explorer", desc: "Query ~99k real orders yourself. Every filter runs a SQL statement against a Parquet file in your browser via DuckDB-WASM — no server involved." },
  { id: "about", label: "About", desc: "How this was built, and what each of the seven analysis notebooks actually investigates." },
];

const NOTEBOOKS = [
  {
    no: "01", file: "01_eda_and_business_framing.ipynb", t: "EDA & Business Framing",
    d: "The day-one orientation pass. Audits data quality (row counts, date range, nulls), then sizes the business: GMV and AOV, monthly growth with the real Nov-2017 Black Friday spike, category mix, the heavy São Paulo concentration, credit-card + installment payment behaviour, and the bimodal review distribution. Establishes the four facts every later notebook builds on.",
  },
  {
    no: "02", file: "02_cohort_and_retention_analysis.ipynb", t: "Cohort & Retention",
    d: "Builds acquisition cohorts keyed on customer_unique_id — not the per-order customer_id, the classic Olist trap — and a month-by-month retention triangle. The headline: only ~3.1% of customers ever order again, so the triangle collapses after month 0. Also profiles time-to-second-purchase, repeat rate by state and category (home_appliances is ~3× stickier), and realized LTV for the small repeat segment.",
  },
  {
    no: "03", file: "03_funnel_analysis.ipynb", t: "Funnel Analysis",
    d: "Two funnels, since Olist has no web clickstream. The order-lifecycle funnel (created → approved → … → delivered) shows ~98% completion, so cancellation isn't the leak. The delivery funnel exposes the real one: ~8% of delivered orders arrive late, concentrated in distant states (Maranhão ~20% vs ~5% in the SP core) and on heavier freight — teeing up notebook 06.",
  },
  {
    no: "04", file: "04_ab_testing_complete.ipynb", t: "A/B Testing",
    d: "A genuine controlled experiment — the real Cookie Cats mobile-game A/B test, since Olist contains none — on moving a level gate from 30 to 40. Full rigor: SRM sanity check, two-proportion z-test on D7 retention, Wilson confidence intervals, a 10k-resample bootstrap, power/MDE, and an engagement guardrail. Result: gate_30 retains better (19.0% vs 18.2% D7, p=0.002), so the call is not to ship gate_40.",
  },
  {
    no: "05", file: "05_metric_definition_and_product_sense.ipynb", t: "Metric Definition & Product Sense",
    d: "A Meta-style analytical-reasoning exercise. For three proposed features — a Buy-Again button, a delivery-date guarantee, and a seller-quality badge — it builds a 5-layer metric tree (primary, guardrail, counter-metric, leading indicator, ecosystem) and computes each metric's real baseline from the data, so every proposed metric starts from a known number rather than a guess.",
  },
  {
    no: "06", file: "06_metric_drop_investigation.ipynb", t: "Metric-Drop Investigation",
    d: "A LinkedIn/Meta-style root-cause walkthrough of a real dip: average review score fell ~10% in Feb–Mar 2018. The five steps confirm the drop is real, segment it, and correlate it with a delivery backlog — monthly on-time rate vs review correlates +0.94, and late orders average 2.57★ vs 4.29★ on-time. Ends in a post-mortem with impact quantified and a recommendation to monitor the leading indicator.",
  },
  {
    no: "07", file: "07_statistical_inference.ipynb", t: "Statistical Inference",
    d: "The DS-interview toolkit on real data: confidence intervals (analytic and bootstrap), a decisive test that late delivery lowers reviews (Cohen's d ≈ 1.45), Bayes' theorem (a 1-star review makes lateness ~4.7× more likely), distribution fitting (lognormal vs normal on delivery times, Poisson overdispersion), Type I/II error trade-offs, a genuine Simpson's paradox (Goiás vs Espírito Santo), and regression to the mean.",
  },
];

function Panel({ title, tag, tip, children }: { title: string; tag: string; tip: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="phead"><h3>{title}</h3><Tip text={tip} /></div>
      <p className="tag">{tag}</p>
      {children}
    </section>
  );
}

export default function Dashboard({ kpis, monthly, funnel, categories, states, outcomes }: Props) {
  const [active, setActive] = useState("overview");
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <>
      <nav className="tabs" role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.id} className="tab" role="tab" aria-selected={t.id === active} onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <p className="tab-desc">{tab.desc}</p>

      {active === "overview" && <KpiCards k={kpis} />}

      {active === "growth" && (
        <>
          <div className="grid-2 wide">
            <Panel
              title="Orders & GMV"
              tag="Monthly volume and revenue. The Nov 2017 Black Friday spike is real, not planted."
              tip="Bars are the number of orders each month (left axis); the line is GMV in R$ (right axis). Hover any point for exact values."
            >
              <MonthlyChart data={monthly} />
            </Panel>
            <Panel
              title="Order lifecycle funnel"
              tag="Where every order ends up. The leak isn't cancellation — it's late delivery."
              tip="Each stage counts orders that reached at least that far through the order lifecycle. The final delivered stage is highlighted in lime."
            >
              <FunnelChart data={funnel} />
              <div className="outcomes">
                <span><b className="lime">{outcomes.delivered_pct}%</b> delivered</span>
                <span><b className="cyan">{outcomes.in_progress_pct}%</b> still in transit / processing</span>
                <span><b className="pink">{outcomes.failed_pct}%</b> cancelled / unavailable</span>
              </div>
            </Panel>
          </div>
          <div style={{ marginTop: "1.1rem" }}>
            <Panel
              title="On-time delivery over time"
              tag="The Feb–Mar 2018 collapse drove the review-score drop investigated in notebook 06."
              tip="Share of delivered orders that arrived on or before the estimated date, by month. The trough is the Feb–Mar 2018 delivery backlog."
            >
              <OnTimeChart data={monthly} />
            </Panel>
          </div>
        </>
      )}

      {active === "segments" && (
        <div className="grid-2 even">
          <Panel
            title="Top categories by GMV"
            tag="Revenue spreads across many verticals — no single category dominates."
            tip="Total revenue (R$) for the top 12 product categories. Hover a bar for the exact GMV."
          >
            <CategoryChart data={categories} />
          </Panel>
          <Panel
            title="Orders by state"
            tag="Demand concentrates in São Paulo (SP) — ~42% of all orders."
            tip="Order count by the customer's Brazilian state (top 15). Hover a bar to see the full state name and order count."
          >
            <StateChart data={states} />
          </Panel>
        </div>
      )}

      {active === "explorer" && (
        <section className="panel">
          <Explorer />
        </section>
      )}

      {active === "about" && (
        <>
          <div className="about-intro">
            Built on the real <b>Olist Brazilian e-commerce</b> dataset — ~100k orders from 2016–2018, no synthetic data.
            A validated Python pipeline (<b>pandas · DuckDB · pandera</b>) turns nine raw CSVs into curated tables, then
            emits the small JSON and Parquet artifacts this page reads. The seven notebooks below carry the analysis;
            each one answers a question a data analyst at a marketplace would face.
            <div className="flow">raw CSV → clean → validate → metrics → JSON + Parquet → Next.js on Vercel + DuckDB-WASM</div>
          </div>
          <div className="nb-list">
            {NOTEBOOKS.map((n, i) => (
              <a key={n.no} className={`nb-card ${NB_TONES[i]}`} href={`${REPO}/${n.file}`} target="_blank" rel="noreferrer">
                <div className="no">Notebook {n.no}</div>
                <div className="t">{n.t}</div>
                <div className="d">{n.d}</div>
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}
