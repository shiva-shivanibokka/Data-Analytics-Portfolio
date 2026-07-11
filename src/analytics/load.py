"""Load raw Olist + Cookie Cats CSVs into typed DataFrames.

This layer only reads and parses -- no business logic. If the raw files are
missing it fails loudly with the exact command to fix it, so a fresh clone
never silently produces empty analyses.
"""

from __future__ import annotations

import pandas as pd

from . import config

_OLIST_DATES = {
    "orders": [
        "order_purchase_timestamp",
        "order_approved_at",
        "order_delivered_carrier_date",
        "order_delivered_customer_date",
        "order_estimated_delivery_date",
    ],
    "reviews": ["review_creation_date", "review_answer_timestamp"],
    "items": ["shipping_limit_date"],
}

_OLIST_FILES = {
    "orders": "olist_orders_dataset.csv",
    "items": "olist_order_items_dataset.csv",
    "payments": "olist_order_payments_dataset.csv",
    "reviews": "olist_order_reviews_dataset.csv",
    "customers": "olist_customers_dataset.csv",
    "products": "olist_products_dataset.csv",
    "sellers": "olist_sellers_dataset.csv",
    "geolocation": "olist_geolocation_dataset.csv",
    "category_translation": "product_category_name_translation.csv",
}


def _require_raw() -> None:
    if not (config.OLIST_RAW / _OLIST_FILES["orders"]).exists():
        raise FileNotFoundError(
            "Raw data not found. Run:  python data/fetch_data.py"
        )


def load_olist() -> dict[str, pd.DataFrame]:
    """Return every raw Olist table keyed by short name, with dates parsed."""
    _require_raw()
    out: dict[str, pd.DataFrame] = {}
    for name, fname in _OLIST_FILES.items():
        out[name] = pd.read_csv(
            config.OLIST_RAW / fname,
            parse_dates=_OLIST_DATES.get(name, None),
        )
    return out


def load_cookie_cats() -> pd.DataFrame:
    path = config.RAW / "cookie_cats.csv"
    if not path.exists():
        raise FileNotFoundError("Run:  python data/fetch_data.py")
    return pd.read_csv(path)
