"""Pipeline orchestrator: raw CSV -> validated curated parquet -> web JSON.

    python -m analytics.build        # or the `build-analytics` console script

Idempotent and safe to re-run. This is the one command CI runs before
executing the notebooks, so notebooks always read fresh, validated data.
"""

from __future__ import annotations

from . import config, load, metrics, transform, validate


def run() -> dict:
    print("1/5  Loading raw Olist + Cookie Cats ...")
    raw = load.load_olist()
    cookie = transform.clean_cookie_cats(load.load_cookie_cats())

    print("2/5  Building curated tables ...")
    tables = transform.build_all(raw)
    tables["cookie_cats"] = cookie

    print("3/5  Validating (pandera contracts) ...")
    validate.validate_all(tables)

    print("4/5  Writing processed parquet ...")
    config.PROCESSED.mkdir(parents=True, exist_ok=True)
    tables["orders"].to_parquet(config.ORDERS, index=False)
    tables["order_items"].to_parquet(config.ORDER_ITEMS, index=False)
    tables["customers"].to_parquet(config.CUSTOMERS, index=False)
    tables["cookie_cats"].to_parquet(config.COOKIE_CATS, index=False)
    metrics.monthly_metrics(tables["orders"]).to_parquet(config.MONTHLY, index=False)

    print("5/5  Exporting web artifacts ...")
    written = metrics.export_web(tables)

    kpis = metrics.kpi_summary(tables["orders"], tables["customers"])
    print("\nCurated:", {k: len(v) for k, v in tables.items()})
    print("KPIs:   ", kpis)
    print("Web:    ", ", ".join(written))
    return kpis


def main() -> None:
    run()


if __name__ == "__main__":
    main()
