"""Turn raw Olist tables into curated analytics tables.

Three outputs, each one row per grain, that every notebook and the dashboard
consume instead of touching raw CSVs:

- orders     : one row per order, enriched with value, delivery, review, category
- order_items: one row per line item, with English category + freight
- customers  : one row per real person (customer_unique_id) with cohort + repeat flag

Design notes
------------
Olist splits identity across two keys: `customer_id` is per-order, while
`customer_unique_id` is the actual person across orders. Repeat-purchase and
cohort logic MUST use `customer_unique_id` -- using `customer_id` would make
every customer look brand new. This is the single most common Olist mistake.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from . import config


def _english_category(products: pd.DataFrame, translation: pd.DataFrame) -> pd.DataFrame:
    """Map Portuguese product categories to English; keep originals as fallback."""
    p = products.merge(translation, on="product_category_name", how="left")
    p["category"] = p["product_category_name_english"].fillna(
        p["product_category_name"]
    ).fillna("unknown")
    return p[["product_id", "category"]]


def build_order_items(raw: dict[str, pd.DataFrame]) -> pd.DataFrame:
    cats = _english_category(raw["products"], raw["category_translation"])
    items = raw["items"].merge(cats, on="product_id", how="left")
    items["category"] = items["category"].fillna("unknown")
    return items[
        [
            "order_id",
            "order_item_id",
            "product_id",
            "seller_id",
            "category",
            "price",
            "freight_value",
            "shipping_limit_date",
        ]
    ]


def _order_value(items: pd.DataFrame) -> pd.DataFrame:
    """Aggregate line items to one row per order."""
    g = items.groupby("order_id")
    out = g.agg(
        order_value=("price", "sum"),
        freight_value=("freight_value", "sum"),
        n_items=("order_item_id", "count"),
    ).reset_index()
    # Dominant category = the category with the most items in the order.
    top_cat = (
        items.groupby(["order_id", "category"]).size().reset_index(name="_n")
        .sort_values(["order_id", "_n"], ascending=[True, False])
        .drop_duplicates("order_id")[["order_id", "category"]]
    )
    return out.merge(top_cat, on="order_id", how="left")


def _order_payments(payments: pd.DataFrame) -> pd.DataFrame:
    g = payments.groupby("order_id")
    out = g.agg(
        payment_value=("payment_value", "sum"),
        payment_installments=("payment_installments", "max"),
    ).reset_index()
    # Primary payment type = the one with the largest value share in the order.
    primary = (
        payments.sort_values(["order_id", "payment_value"], ascending=[True, False])
        .drop_duplicates("order_id")[["order_id", "payment_type"]]
    )
    return out.merge(primary, on="order_id", how="left")


def _order_reviews(reviews: pd.DataFrame) -> pd.DataFrame:
    # A handful of orders carry multiple reviews; use the mean score.
    return (
        reviews.groupby("order_id")
        .agg(review_score=("review_score", "mean"), n_reviews=("review_id", "count"))
        .reset_index()
    )


def build_orders(raw: dict[str, pd.DataFrame], items: pd.DataFrame) -> pd.DataFrame:
    orders = raw["orders"].copy()

    orders = orders.merge(_order_value(items), on="order_id", how="left")
    orders = orders.merge(_order_payments(raw["payments"]), on="order_id", how="left")
    orders = orders.merge(_order_reviews(raw["reviews"]), on="order_id", how="left")
    orders = orders.merge(
        raw["customers"][
            ["customer_id", "customer_unique_id", "customer_state", "customer_city"]
        ],
        on="customer_id",
        how="left",
    )

    ts = "order_purchase_timestamp"
    delivered = "order_delivered_customer_date"
    est = "order_estimated_delivery_date"

    # Orders with no line items (many cancelled/unavailable ones) have no
    # category; label them so downstream never sees a null category.
    orders["category"] = orders["category"].fillna("unknown")

    orders["order_month"] = orders[ts].dt.to_period("M").dt.to_timestamp()
    orders["is_delivered"] = orders["order_status"].eq("delivered")

    # Delivery timing (only meaningful for delivered orders -> NaN otherwise).
    day = np.timedelta64(1, "D")
    orders["delivery_days"] = (orders[delivered] - orders[ts]) / day
    orders["estimated_days"] = (orders[est] - orders[ts]) / day
    orders["delay_days"] = (orders[delivered] - orders[est]) / day
    # Nullable boolean: NA for orders that never delivered (no late/on-time truth).
    orders["is_late"] = (orders["delay_days"] > 0).astype("boolean")
    orders.loc[orders[delivered].isna(), "is_late"] = pd.NA

    keep = [
        "order_id",
        "customer_unique_id",
        "customer_state",
        "customer_city",
        "order_status",
        "is_delivered",
        "order_purchase_timestamp",
        "order_delivered_customer_date",
        "order_estimated_delivery_date",
        "order_month",
        "order_value",
        "freight_value",
        "payment_value",
        "payment_type",
        "payment_installments",
        "n_items",
        "category",
        "review_score",
        "delivery_days",
        "estimated_days",
        "delay_days",
        "is_late",
    ]
    return orders[keep]


def build_customers(orders: pd.DataFrame) -> pd.DataFrame:
    """One row per real person: cohort month, order count, spend, repeat flag."""
    o = orders.dropna(subset=["customer_unique_id"])
    g = o.groupby("customer_unique_id")
    cust = g.agg(
        first_order=("order_purchase_timestamp", "min"),
        last_order=("order_purchase_timestamp", "max"),
        n_orders=("order_id", "count"),
        total_spend=("payment_value", "sum"),
        avg_review=("review_score", "mean"),
        state=("customer_state", "first"),
    ).reset_index()
    cust["cohort_month"] = cust["first_order"].dt.to_period("M").dt.to_timestamp()
    cust["is_repeat"] = cust["n_orders"] > 1
    return cust


def build_all(raw: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
    items = build_order_items(raw)
    orders = build_orders(raw, items)
    customers = build_customers(orders)
    return {"order_items": items, "orders": orders, "customers": customers}


def clean_cookie_cats(df: pd.DataFrame) -> pd.DataFrame:
    """Standardize the A/B table: booleans as int, one extreme outlier dropped.

    One player has sum_gamerounds ~49,854 (vs a p99 of a few hundred) -- a
    near-certain logging artifact that would swamp the mean. Dropped, and the
    drop is asserted in tests so it can't silently change.
    """
    out = df.copy()
    out["retention_1"] = out["retention_1"].astype(int)
    out["retention_7"] = out["retention_7"].astype(int)
    out = out[out["sum_gamerounds"] < 10_000].reset_index(drop=True)
    return out


def clip_to_window(orders: pd.DataFrame) -> pd.DataFrame:
    """Drop the sparse ramp-up / cut-off tail months for clean trend charts."""
    ts = orders["order_purchase_timestamp"]
    mask = (ts >= config.ANALYSIS_START) & (ts <= config.ANALYSIS_END + " 23:59:59")
    return orders[mask]
