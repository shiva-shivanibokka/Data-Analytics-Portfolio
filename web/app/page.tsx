import KpiCards from "@/components/KpiCards";
import Explorer from "@/components/Explorer";
import { CategoryChart, FunnelChart, MonthlyChart, OnTimeChart, StateChart } from "@/components/Charts";
import kpis from "@/public/data/kpis.json";
import monthly from "@/public/data/monthly.json";
import funnel from "@/public/data/funnel.json";
import categories from "@/public/data/categories.json";
import states from "@/public/data/states.json";

const REPO = "https://github.com/shiva-shivanibokka/Data-Analytics-Portfolio/blob/main/notebooks";

const NOTEBOOKS = [
  { no: "01", file: "01_eda_and_business_framing.ipynb", t: "EDA & Business Framing", d: "Sizing the marketplace: GMV, categories, geography, the Black Friday spike." },
  { no: "02", file: "02_cohort_and_retention_analysis.ipynb", t: "Cohort & Retention", d: "Why only 3.1% of customers ever come back — the core problem, quantified." },
  { no: "03", file: "03_funnel_analysis.ipynb", t: "Funnel Analysis", d: "98% of orders deliver; the real leak is 8% late, worst in distant states." },
  { no: "04", file: "04_ab_testing_complete.ipynb", t: "A/B Testing", d: "A real experiment: moving the gate to level 40 hurt D7 retention (p=0.002)." },
  { no: "05", file: "05_metric_definition_and_product_sense.ipynb", t: "Metric Definition", d: "5-layer metric trees for three features, on real baselines." },
  { no: "06", file: "06_metric_drop_investigation.ipynb", t: "Metric-Drop Investigation", d: "Reviews fell 10% in early 2018 — traced to a delivery backlog (corr 0.94)." },
  { no: "07", file: "07_statistical_inference.ipynb", t: "Statistical Inference", d: "CIs, Bayes, a real Simpson's paradox, regression to the mean." },
];

function Panel({ title, tag, children }: { title: string; tag: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      <p className="tag">{tag}</p>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <main className="wrap">
      <header>
        <p className="eyebrow">Olist Brazilian E-Commerce · ~100k real orders · 2016–2018</p>
        <h1>Marketplace Analytics</h1>
        <p>
          An interactive dashboard on the real{" "}
          <a href="https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce" target="_blank" rel="noreferrer">
            Olist
          </a>{" "}
          dataset. Every chart is precomputed by a validated Python pipeline; the console at the bottom runs real SQL
          against a Parquet file <b style={{ color: "var(--text)" }}>live in your browser</b> — no server, no database.
        </p>
        <span className="live">
          <b>●</b> live · in-browser DuckDB · nothing leaves your machine
        </span>
      </header>

      <div className="findings">
        <Finding tone="pink" v="3.1%" k="<b>repeat rate</b> — Olist is a one-purchase marketplace; retention is the constraint." />
        <Finding tone="cyan" v="R$16.0M" k="<b>GMV</b> across ~99k orders at a R$161 average order value." />
        <Finding tone="lime" v="4.09★" k="<b>avg review</b>, but the 1-star tail is driven by late delivery, not product." />
        <Finding tone="amber" v="78.6%" k="on-time rate in the <b>Mar-2018 backlog</b> — the cause of that year's review drop." />
      </div>

      <h2 className="sec-title">Business snapshot</h2>
      <KpiCards k={kpis} />

      <h2 className="sec-title">Growth & fulfillment</h2>
      <div className="grid-2 wide">
        <Panel title="Orders & GMV" tag="Monthly volume and revenue. The Nov 2017 Black Friday spike is real, not planted.">
          <MonthlyChart data={monthly} />
        </Panel>
        <Panel title="Order lifecycle funnel" tag="~98% of orders reach delivered — the leak is lateness, not cancellation.">
          <FunnelChart data={funnel} />
        </Panel>
      </div>

      <div className="grid-2 even" style={{ marginTop: "1.1rem" }}>
        <Panel title="Top categories by GMV" tag="Revenue spreads across many verticals — no single category dominates.">
          <CategoryChart data={categories} />
        </Panel>
        <Panel title="Orders by state" tag="Demand concentrates in São Paulo (SP) — ~42% of all orders.">
          <StateChart data={states} />
        </Panel>
      </div>

      <div style={{ marginTop: "1.1rem" }}>
        <Panel title="On-time delivery over time" tag="The Feb–Mar 2018 collapse drove the review-score drop investigated in notebook 06.">
          <OnTimeChart data={monthly} />
        </Panel>
      </div>

      <h2 className="sec-title">Query the data live · DuckDB-WASM</h2>
      <section className="panel">
        <p className="tag" style={{ marginTop: 0 }}>
          Filter ~99k orders by state and category. Every change runs a real SQL query against a Parquet file in your
          browser — the executed query is echoed below the results.
        </p>
        <Explorer />
      </section>

      <h2 className="sec-title">The seven notebooks</h2>
      <div className="nb-grid">
        {NOTEBOOKS.map((n) => (
          <a key={n.no} className="nb-card" href={`${REPO}/${n.file}`} target="_blank" rel="noreferrer">
            <div className="no">Notebook {n.no}</div>
            <div className="t">{n.t}</div>
            <div className="d">{n.d}</div>
          </a>
        ))}
      </div>

      <footer className="footer">
        Built by <b style={{ color: "var(--text)" }}>Shivani Bokka</b>. Python pipeline (pandas · DuckDB · pandera) →
        precomputed JSON + Parquet → Next.js on Vercel. <br />
        Real Olist Brazilian e-commerce data · seven analysis notebooks ·{" "}
        <a href="https://github.com/shiva-shivanibokka/Data-Analytics-Portfolio" target="_blank" rel="noreferrer">
          source on GitHub
        </a>
        .
      </footer>
    </main>
  );
}

function Finding({ tone, v, k }: { tone: string; v: string; k: string }) {
  return (
    <div className={`finding ${tone}`}>
      <div className="fv">{v}</div>
      <div className="fk" dangerouslySetInnerHTML={{ __html: k }} />
    </div>
  );
}
