# Repo Bug Audit — Data-Analytics-Portfolio

Whole-repo audit across the Python pipeline (`src/analytics`), `data/fetch_data.py`,
the 7 notebooks, `tests/`, and the Next.js `web/` dashboard. All findings below were
**resolved** (the user asked to fix everything, big or small). Verification at the end.

## Findings & fixes

| # | Severity | Area | Finding | Fix |
|---|----------|------|---------|-----|
| 1 | **Critical** | web + pipeline | Orders with no line items had a **null `category`**; the Live Explorer called `prettyCategory(null).replace(...)` and crashed the whole tab with a client-side exception. | Fill `category="unknown"` in the pipeline (`transform.build_orders`); guard `prettyCategory`/`stateName` against null; `WHERE category IS NOT NULL` in the options query. |
| 2 | **Major** | web (CSS) | Live Explorer content **overflowed its panel** — a long SQL line is a grid item with `min-width:auto`, expanding the whole console past the panel edge. | `.console { grid-template-columns: minmax(0,1fr) }` + `min-width:0` on children so the SQL scrolls inside its own box. |
| 3 | **Major** | web (SQL) | Explorer **late-rate was understated**: `avg(CASE WHEN is_late THEN 1 ELSE 0 END)` counts the 2,945 non-delivered orders (`is_late` NULL) as on-time → 7.87% shown vs the correct **8.11%** among delivered (what the tooltip and notebooks state). | `avg(is_late::DOUBLE)` — skips NULLs, so the rate is over delivered orders only. |
| 4 | **Major** | CI / deps | Unpinned deps let CI install bleeding-edge **scipy 1.18 / pandas 3.0 / numpy 2.5**; scipy 1.18 broke `stats.kstest(...,'norm',args=...)` in notebook 07 (CI red). | Pin ceilings (`pandas<3, numpy<2, scipy<1.18, statsmodels<1, pandera<1`) so CI reproduces the tested majors. |
| 5 | **Major** | notebooks | Committed notebook outputs were **stale** vs the pipeline after the category-fillna change (would show `NaN`/mismatched category groupings). | Re-executed all 7 notebooks against the fixed data (0 errors, charts intact). |
| 6 | Minor | web | Explorer **stale-result race**: rapid filter changes fire overlapping async queries that can resolve out of order and paint a stale result. | `reqId` ref — only the latest in-flight query is allowed to `setState`. |
| 7 | Minor | web | `lib/duckdb.ts` cached a **rejected** init promise forever; one transient fetch failure made every later query fail until a full reload. | Reset `ready`/`dbPromise` on failure; add `res.ok` check on the parquet fetch. |
| 8 | Minor | web | Explorer tiles could render `NaN`/`R$NaN` on an **empty result set** (state+category combo with no orders). | `?? 0` guards on the numeric tiles. |

## Notes (reviewed, not bugs — kept as-is)

- **String-interpolated SQL in the Explorer** (`customer_state = '${state}'`). Not an
  injection/quote-break risk here: the values come *only* from data-derived dropdown
  options — 2-letter state codes and snake_case category names with no quote characters.
  Left as-is; would only need parameterization if free-text input were ever added.
- **`status_funnel` excludes `canceled`/`unavailable`** orders. Intentional: they aren't
  part of the linear order lifecycle and are analyzed separately in notebook 03.
- **Notebook 07 `stats.kstest(...,'norm',args=...)`** regressed in scipy 1.18; the dep
  pin keeps it on 1.17.x. Correct behavior, but pin-dependent — noted for future upgrades.
- **Frontend has no automated tests.** Acceptable for a static portfolio dashboard; the
  Python pipeline carries the test suite. Not added.

## Verification (all green)

- `ruff check src tests data` → clean
- `pytest -q` → 5 passed
- All 7 notebooks execute end-to-end → **0 errors**, 41 charts embedded
- `web` → `npm run build` compiles; Live Explorer no longer crashes and fits its panel
- No bare `except`, hardcoded secrets, or `TODO/FIXME` in source
