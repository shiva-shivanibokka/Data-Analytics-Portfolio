"""Central paths and constants for the analytics pipeline."""

from __future__ import annotations

from pathlib import Path

# repo_root/src/analytics/config.py -> repo_root
ROOT = Path(__file__).resolve().parents[2]

DATA = ROOT / "data"
RAW = DATA / "raw"
OLIST_RAW = RAW / "olist"
PROCESSED = DATA / "processed"

# Curated parquet the notebooks and the web dashboard both read.
ORDERS = PROCESSED / "orders.parquet"
ORDER_ITEMS = PROCESSED / "order_items.parquet"
CUSTOMERS = PROCESSED / "customers.parquet"
MONTHLY = PROCESSED / "monthly_metrics.parquet"
COOKIE_CATS = PROCESSED / "cookie_cats.parquet"

# Web app artifacts (committed so the Vercel build needs no Python).
WEB_PUBLIC = ROOT / "web" / "public" / "data"

# Olist is a marketplace that operated ~2016-09 to 2018-10. Data before/after
# this window is sparse tails that distort monthly trends, so notebooks and
# metrics clip to it. Kept here as the single source of truth.
ANALYSIS_START = "2016-09-01"
ANALYSIS_END = "2018-08-31"
