"use client";

import { useEffect, useRef, useState } from "react";
import { query } from "@/lib/duckdb";
import { brlCompact, compact, pct, prettyCategory, stateName } from "@/lib/format";
import Tip from "./Tip";

type Agg = { orders: number; gmv: number; avg_review: number; late_rate: number };
type BreakRow = { name: string; orders: number };
type Dim = "category" | "customer_state";

const ALL = "All";

export default function Explorer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [state, setState] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [agg, setAgg] = useState<Agg | null>(null);
  const [breakdown, setBreakdown] = useState<BreakRow[]>([]);
  const [breakdownDim, setBreakdownDim] = useState<Dim>("category");
  const [sql, setSql] = useState("");
  const reqId = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const s = await query<{ customer_state: string }>(
          "SELECT DISTINCT customer_state FROM orders WHERE customer_state IS NOT NULL ORDER BY 1",
        );
        const c = await query<{ category: string }>(
          "SELECT category, count(*)::DOUBLE n FROM orders WHERE category IS NOT NULL GROUP BY 1 ORDER BY n DESC LIMIT 25",
        );
        setStates(s.map((r) => r.customer_state));
        setCategories(c.map((r) => (r as unknown as { category: string }).category));
        setLoading(false);
      } catch (e) {
        setError(String(e));
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading || error) return;
    const where = [
      state !== ALL ? `customer_state = '${state}'` : null,
      category !== ALL ? `category = '${category}'` : null,
    ].filter(Boolean);
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    // avg(is_late::DOUBLE) skips NULL (non-delivered orders) → late rate among
    // delivered only, matching the funnel/notebooks. CASE ... ELSE 0 would count
    // non-delivered as on-time and understate it.
    const aggSql = `SELECT count(*)::DOUBLE orders, sum(payment_value)::DOUBLE gmv,
       avg(review_score)::DOUBLE avg_review,
       avg(is_late::DOUBLE) late_rate
       FROM orders ${clause}`;

    // Break down by the OTHER dimension: pick a category → show its top states;
    // otherwise show top categories. (Grouping by a column you've filtered to a
    // single value just produces one full-width bar, which is useless.)
    const dim: Dim = category !== ALL ? "customer_state" : "category";
    const dimClause = clause ? `${clause} AND ${dim} IS NOT NULL` : `WHERE ${dim} IS NOT NULL`;
    const breakSql = `SELECT ${dim} AS name, count(*)::DOUBLE orders FROM orders ${dimClause} GROUP BY 1 ORDER BY orders DESC LIMIT 8`;

    setSql(
      `SELECT count(*) AS orders,\n` +
        `       sum(payment_value) AS gmv,\n` +
        `       avg(review_score) AS avg_review,\n` +
        `       avg(is_late::DOUBLE) AS late_rate\n` +
        `FROM orders` +
        (clause ? `\n${clause}` : ""),
    );
    const myId = ++reqId.current;
    (async () => {
      const [a] = await query<Agg>(aggSql);
      const b = await query<BreakRow>(breakSql);
      if (myId !== reqId.current) return; // a newer filter change superseded this one
      setAgg(a);
      setBreakdown(b);
      setBreakdownDim(dim);
    })();
  }, [state, category, loading, error]);

  const scope = `${state === ALL ? "all states" : `state ${state}`}, ${
    category === ALL ? "all product categories" : `the ${category} category`
  }`;

  if (error) return <div className="loading">Could not load the in-browser database: {error}</div>;

  return (
    <div className="console">
      <div className="controls">
        <Select
          label="State"
          value={state}
          options={[ALL, ...states]}
          onChange={setState}
          render={(o) => (o === ALL ? "All states" : `${stateName(o)} (${o})`)}
        />
        <Select
          label="Category"
          value={category}
          options={[ALL, ...categories]}
          onChange={setCategory}
          render={(o) => (o === ALL ? "All categories" : prettyCategory(o))}
        />
        {loading && <span className="loading">● booting DuckDB in your browser…</span>}
      </div>

      {agg && (
        <div className="readtiles">
          <Tile label="Orders" value={compact(agg.orders ?? 0)} grad tip="Number of orders matching the current filter." />
          <Tile label="GMV" value={brlCompact(agg.gmv ?? 0)} grad tip="Total R$ value of the matching orders." />
          <Tile label="Avg review" value={`${(agg.avg_review ?? 0).toFixed(2)}★`} tip="Mean 1–5 star rating for the matching orders." />
          <Tile label="Late rate" value={pct(agg.late_rate ?? 0)} tip="Share of the matching orders delivered after the estimated date." />
        </div>
      )}

      {breakdown.length > 0 && (
        <div>
          <div className="field" style={{ marginBottom: ".6rem" }}>
            <label>
              {breakdownDim === "customer_state" ? "Top states" : "Top categories"} · this selection
            </label>
          </div>
          <div className="bars">
            {breakdown.map((r) => {
              const max = breakdown[0].orders || 1;
              const name = breakdownDim === "customer_state" ? stateName(r.name) : prettyCategory(r.name);
              return (
                <div key={r.name} className="bar-row">
                  <div className="name">{name}</div>
                  <div className="bar-track">
                    <div className="fill" style={{ width: `${(r.orders / max) * 100}%` }} />
                  </div>
                  <div className="val">{compact(r.orders)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sql && (
        <div>
          <div className="sql-cap">
            <b>Live SQL</b>
            <Tip text="The exact query DuckDB-WASM just ran against orders.parquet — entirely in your browser. It re-runs every time you change a filter." />
            <span>
              Counts orders and computes revenue, average review and late-delivery rate for {scope}.
            </span>
          </div>
          <pre className="sql">{sql}</pre>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  render = (o) => o,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  render?: (o: string) => string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {render(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Tile({ label, value, grad, tip }: { label: string; value: string; grad?: boolean; tip: string }) {
  return (
    <div className="readtile">
      <div className="tile-head">
        <span className="k">{label}</span>
        <Tip text={tip} />
      </div>
      <div className={`v${grad ? " grad" : ""}`}>{value}</div>
    </div>
  );
}
