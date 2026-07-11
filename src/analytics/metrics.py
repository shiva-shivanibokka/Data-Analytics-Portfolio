"""Reusable business-metric aggregations.

Every function takes curated tables and returns a small tidy DataFrame. The
notebooks import these so a metric is defined exactly once, and the same
functions produce the JSON the Vercel dashboard reads -- the dashboard and the
notebooks can never disagree on a number.
"""

from __future__ import annotations

import json

import pandas as pd

from . import config, transform

# Olist's order-status lifecycle, in the order a healthy order flows through.
FUNNEL_STAGES = ["created", "approved", "invoiced", "processing", "shipped", "delivered"]


def monthly_metrics(orders: pd.DataFrame) -> pd.DataFrame:
    o = transform.clip_to_window(orders)
    g = o.groupby("order_month")
    m = g.agg(
        orders=("order_id", "count"),
        gmv=("payment_value", "sum"),
        unique_customers=("customer_unique_id", "nunique"),
        avg_review=("review_score", "mean"),
        avg_delivery_days=("delivery_days", "mean"),
    ).reset_index()
    m["aov"] = m["gmv"] / m["orders"]
    # On-time rate among delivered orders only.
    delivered = o[o["is_delivered"]]
    ontime = (
        delivered.groupby("order_month")["is_late"]
        .apply(lambda s: 1 - s.mean())
        .reset_index(name="on_time_rate")
    )
    return m.merge(ontime, on="order_month", how="left")


def status_funnel(orders: pd.DataFrame) -> pd.DataFrame:
    """Cumulative reach of each lifecycle stage.

    A delivered order necessarily passed approval/shipping, so each stage count
    is 'orders that reached at least this far' -- a true monotonic funnel.
    """
    reached = {s: 0 for s in FUNNEL_STAGES}
    idx = {s: i for i, s in enumerate(FUNNEL_STAGES)}
    counts = orders["order_status"].value_counts().to_dict()
    for status, n in counts.items():
        if status in idx:
            for s in FUNNEL_STAGES[: idx[status] + 1]:
                reached[s] += n
    rows = [{"stage": s, "orders": reached[s]} for s in FUNNEL_STAGES]
    df = pd.DataFrame(rows)
    top = df["orders"].iloc[0] or 1
    df["pct_of_top"] = (df["orders"] / top * 100).round(1)
    return df


def cohort_retention(customers: pd.DataFrame, orders: pd.DataFrame) -> pd.DataFrame:
    """Repeat-purchase retention: of each signup cohort, what share ordered
    again in month 0,1,2,... after their first order. Olist's overall repeat
    rate is famously low (~3%), so this surfaces a real product problem."""
    o = orders.dropna(subset=["customer_unique_id"]).merge(
        customers[["customer_unique_id", "cohort_month"]],
        on="customer_unique_id",
        how="left",
    )
    o["month_index"] = (
        (o["order_month"].dt.year - o["cohort_month"].dt.year) * 12
        + (o["order_month"].dt.month - o["cohort_month"].dt.month)
    )
    o = o[o["month_index"] >= 0]
    size = customers.groupby("cohort_month")["customer_unique_id"].nunique()
    active = o.groupby(["cohort_month", "month_index"])["customer_unique_id"].nunique()
    mat = active.unstack("month_index")
    return mat.div(size, axis=0).round(4)


def kpi_summary(orders: pd.DataFrame, customers: pd.DataFrame) -> dict:
    o = transform.clip_to_window(orders)
    delivered = o[o["is_delivered"]]
    return {
        "orders": int(len(o)),
        "customers": int(o["customer_unique_id"].nunique()),
        "gmv": round(float(o["payment_value"].sum()), 2),
        "aov": round(float(o["payment_value"].mean()), 2),
        "repeat_rate": round(float(customers["is_repeat"].mean()), 4),
        "avg_review": round(float(o["review_score"].mean()), 3),
        "on_time_rate": round(float(1 - delivered["is_late"].mean()), 4),
        "avg_delivery_days": round(float(o["delivery_days"].mean()), 1),
    }


def category_breakdown(orders: pd.DataFrame, top: int = 12) -> pd.DataFrame:
    o = transform.clip_to_window(orders)
    c = (
        o.groupby("category")
        .agg(orders=("order_id", "count"), gmv=("payment_value", "sum"),
             avg_review=("review_score", "mean"))
        .reset_index()
        .sort_values("gmv", ascending=False)
        .head(top)
    )
    return c


def export_web(tables: dict[str, pd.DataFrame]) -> list[str]:
    """Write the small JSON aggregates the Next.js dashboard reads at build."""
    orders, customers = tables["orders"], tables["customers"]
    config.WEB_PUBLIC.mkdir(parents=True, exist_ok=True)

    artifacts = {
        "kpis": kpi_summary(orders, customers),
        "monthly": monthly_metrics(orders).assign(
            order_month=lambda d: d["order_month"].dt.strftime("%Y-%m")
        ).to_dict(orient="records"),
        "funnel": status_funnel(orders).to_dict(orient="records"),
        "categories": category_breakdown(orders).round(2).to_dict(orient="records"),
        "states": (
            transform.clip_to_window(orders)
            .groupby("customer_state")["order_id"].count()
            .sort_values(ascending=False).head(15)
            .rename("orders").reset_index().to_dict(orient="records")
        ),
    }
    written = []
    for name, data in artifacts.items():
        path = config.WEB_PUBLIC / f"{name}.json"
        path.write_text(json.dumps(data, indent=2, default=str))
        written.append(path.name)

    # Committed parquet for in-browser DuckDB-WASM slicing. Slim columns only.
    slim = transform.clip_to_window(orders)[
        ["order_id", "order_month", "customer_state", "category", "payment_value",
         "review_score", "delivery_days", "is_late", "order_status"]
    ]
    slim.to_parquet(config.WEB_PUBLIC / "orders.parquet", index=False)
    written.append("orders.parquet")
    return written
