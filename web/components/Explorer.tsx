"use client";

import { useEffect, useState } from "react";
import { query } from "@/lib/duckdb";
import { brl, compact, pct } from "@/lib/format";

type Agg = { orders: number; gmv: number; avg_review: number; late_rate: number };
type CatRow = { category: string; orders: number };

const ALL = "All";

export default function Explorer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [state, setState] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [agg, setAgg] = useState<Agg | null>(null);
  const [breakdown, setBreakdown] = useState<CatRow[]>([]);
  const [sql, setSql] = useState("");

  // One-time init: warm the DB and load filter option lists.
  useEffect(() => {
    (async () => {
      try {
        const s = await query<{ customer_state: string }>(
          "SELECT DISTINCT customer_state FROM orders WHERE customer_state IS NOT NULL ORDER BY 1",
        );
        const c = await query<{ category: string }>(
          "SELECT category, count(*)::DOUBLE n FROM orders GROUP BY 1 ORDER BY n DESC LIMIT 25",
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

  // Re-query whenever a filter changes.
  useEffect(() => {
    if (loading || error) return;
    const where = [
      state !== ALL ? `customer_state = '${state}'` : null,
      category !== ALL ? `category = '${category}'` : null,
    ].filter(Boolean);
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const aggSql = `SELECT count(*)::DOUBLE orders, sum(payment_value)::DOUBLE gmv,
       avg(review_score)::DOUBLE avg_review,
       avg(CASE WHEN is_late THEN 1 ELSE 0 END)::DOUBLE late_rate
       FROM orders ${clause}`;
    setSql(aggSql.replace(/\s+/g, " ").trim());
    (async () => {
      const [a] = await query<Agg>(aggSql);
      setAgg(a);
      const b = await query<CatRow>(
        `SELECT category, count(*)::DOUBLE orders FROM orders ${clause}
         GROUP BY 1 ORDER BY orders DESC LIMIT 8`,
      );
      setBreakdown(b);
    })();
  }, [state, category, loading, error]);

  if (error)
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Could not load the in-browser database: {error}
      </div>
    );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Select label="State" value={state} options={[ALL, ...states]} onChange={setState} />
        <Select label="Category" value={category} options={[ALL, ...categories]} onChange={setCategory} />
        {loading && <span className="text-sm text-slate-500">Loading DuckDB in your browser…</span>}
      </div>

      {agg && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile label="Orders" value={compact(agg.orders)} />
          <Tile label="GMV" value={brl(agg.gmv)} />
          <Tile label="Avg review" value={`${(agg.avg_review ?? 0).toFixed(2)} ★`} />
          <Tile label="Late rate" value={pct(agg.late_rate ?? 0)} />
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Top categories for this selection
          </div>
          <div className="space-y-1">
            {breakdown.map((r) => {
              const max = breakdown[0].orders || 1;
              return (
                <div key={r.category} className="flex items-center gap-2 text-sm">
                  <div className="w-40 shrink-0 truncate text-slate-600">{r.category}</div>
                  <div className="h-4 rounded bg-brandlt" style={{ width: `${(r.orders / max) * 60}%` }} />
                  <div className="text-xs text-slate-400">{compact(r.orders)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sql && (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
          {sql}
        </pre>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <select
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
