import Dashboard from "@/components/Dashboard";
import kpis from "@/public/data/kpis.json";
import monthly from "@/public/data/monthly.json";
import funnel from "@/public/data/funnel.json";
import categories from "@/public/data/categories.json";
import states from "@/public/data/states.json";
import outcomes from "@/public/data/outcomes.json";

export default function Home() {
  return (
    <main className="wrap">
      <header className="hero">
        <p className="eyebrow">Olist Brazilian E-Commerce · ~100k real orders · 2016–2018</p>
        <h1>Marketplace Analytics</h1>
        <p>
          An interactive dashboard on the real{" "}
          <a href="https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce" target="_blank" rel="noreferrer">
            Olist
          </a>{" "}
          dataset. Charts are precomputed by a validated Python pipeline; the Live Explorer runs real SQL against a
          Parquet file <b style={{ color: "var(--text)" }}>in your browser</b> — no server, no database.
        </p>
        <span className="live">
          <b>●</b> live · in-browser DuckDB · nothing leaves your machine
        </span>
      </header>

      <Dashboard
        kpis={kpis}
        monthly={monthly}
        funnel={funnel}
        categories={categories}
        states={states}
        outcomes={outcomes}
      />

      <footer className="footer">
        Built by <b style={{ color: "var(--text)" }}>Shivani Bokka</b>. Python pipeline (pandas · DuckDB · pandera) →
        precomputed JSON + Parquet → Next.js on Vercel. <br />
        Real Olist Brazilian e-commerce data ·{" "}
        <a href="https://github.com/shiva-shivanibokka/Data-Analytics-Portfolio" target="_blank" rel="noreferrer">
          source on GitHub
        </a>
        .
      </footer>
    </main>
  );
}
