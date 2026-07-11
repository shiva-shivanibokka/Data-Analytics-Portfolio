import KpiCards from "@/components/KpiCards";
import Explorer from "@/components/Explorer";
import {
  CategoryChart,
  FunnelChart,
  MonthlyChart,
  OnTimeChart,
  StateChart,
} from "@/components/Charts";
import kpis from "@/public/data/kpis.json";
import monthly from "@/public/data/monthly.json";
import funnel from "@/public/data/funnel.json";
import categories from "@/public/data/categories.json";
import states from "@/public/data/states.json";

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {subtitle && <p className="mb-3 mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-widest text-brand">
          Olist Brazilian E-Commerce · ~100k real orders · 2016–2018
        </div>
        <h1 className="mt-1 text-3xl font-bold text-ink md:text-4xl">Marketplace Analytics</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          An interactive dashboard on the real{" "}
          <a
            className="text-brand underline"
            href="https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce"
            target="_blank"
            rel="noreferrer"
          >
            Olist
          </a>{" "}
          dataset. Headline charts are precomputed by a validated Python pipeline; the explorer at the
          bottom queries a Parquet file <strong>live in your browser</strong> with DuckDB-WASM — no
          server, no database.
        </p>
      </header>

      <KpiCards k={kpis} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          title="Growth: orders & GMV"
          subtitle="Monthly volume and revenue. Note the Nov 2017 Black Friday spike."
          className="lg:col-span-2"
        >
          <MonthlyChart data={monthly} />
        </Panel>
        <Panel title="Order lifecycle funnel" subtitle="~98% of orders reach delivered.">
          <FunnelChart data={funnel} />
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Top categories by GMV" subtitle="Revenue is spread across many verticals.">
          <CategoryChart data={categories} />
        </Panel>
        <Panel title="Orders by state" subtitle="Demand concentrates in São Paulo (SP).">
          <StateChart data={states} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="On-time delivery rate over time"
          subtitle="The Feb–Mar 2018 collapse drove the review-score drop investigated in notebook 06."
        >
          <OnTimeChart data={monthly} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Explore the data live · DuckDB-WASM"
          subtitle="Filter ~99k orders by state and category. Every change runs a real SQL query against a Parquet file in your browser — the query is shown below the results."
        >
          <Explorer />
        </Panel>
      </div>

      <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
        <p>
          Built by <strong>Shivani Bokka</strong>. Python pipeline (pandas · DuckDB · pandera) →
          precomputed JSON + Parquet → Next.js on Vercel. Seven analysis notebooks cover EDA, cohort
          retention, funnel, A/B testing, metric design, root-cause investigation, and statistical
          inference. Source on GitHub.
        </p>
      </footer>
    </main>
  );
}
