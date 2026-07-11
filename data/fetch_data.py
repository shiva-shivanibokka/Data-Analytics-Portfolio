"""
fetch_data.py
=============
Download the REAL public datasets this portfolio is built on. No Kaggle
account or API token required -- everything is pulled from public mirrors
over HTTPS with the standard library only.

Datasets
--------
Olist Brazilian E-Commerce (the anchor dataset for notebooks 01-03, 05-07)
    ~100k real orders from a Brazilian marketplace: orders, items, payments,
    reviews, customers, sellers, products, geolocation.
    Source: Hugging Face mirror of the canonical Kaggle dataset.

Cookie Cats (notebook 04 -- A/B testing)
    A real mobile-game A/B test: ~90k players split between a level gate at
    30 (gate_30) vs 40 (gate_40), with day-1 and day-7 retention outcomes.
    Source: public GitHub mirror.

Run
---
    python data/fetch_data.py

Idempotent: files that already exist are skipped. Re-download with --force.
"""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

RAW = Path(__file__).parent / "raw"
OLIST_DIR = RAW / "olist"

_HF = "https://huggingface.co/datasets/aviahYadler/Olist_Ecommerce_Dataset/resolve/main"
_GH = "https://raw.githubusercontent.com/ryanschaub/Mobile-Games-A-B-Testing-with-Cookie-Cats/master"

OLIST_FILES = [
    "olist_customers_dataset.csv",
    "olist_geolocation_dataset.csv",
    "olist_order_items_dataset.csv",
    "olist_order_payments_dataset.csv",
    "olist_order_reviews_dataset.csv",
    "olist_orders_dataset.csv",
    "olist_products_dataset.csv",
    "olist_sellers_dataset.csv",
    "product_category_name_translation.csv",
]

# (url, destination) pairs
DOWNLOADS: list[tuple[str, Path]] = [
    (f"{_HF}/{name}", OLIST_DIR / name) for name in OLIST_FILES
] + [
    (f"{_GH}/cookie_cats.csv", RAW / "cookie_cats.csv"),
]


def download(url: str, dest: Path, force: bool = False) -> None:
    if dest.exists() and not force:
        print(f"  [skip] {dest.name} ({dest.stat().st_size / 1e6:.1f} MB)")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
    tmp = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as f:
        while chunk := r.read(1 << 16):
            f.write(chunk)
    # Guard against a mirror silently serving an HTML error page instead of CSV.
    if tmp.stat().st_size < 1024:
        head = tmp.read_bytes()[:64].lstrip().lower()
        if head.startswith(b"<") or b"not found" in head:
            tmp.unlink()
            raise RuntimeError(f"{url} did not return CSV data (got a {tmp.stat().st_size}B response)")
    tmp.replace(dest)
    print(f"  [ok]   {dest.name} ({dest.stat().st_size / 1e6:.1f} MB)")


def main() -> None:
    force = "--force" in sys.argv
    print("Fetching real datasets (Olist + Cookie Cats)...")
    for url, dest in DOWNLOADS:
        download(url, dest, force=force)
    # Sanity: the anchor orders file must be present and non-trivial.
    orders = OLIST_DIR / "olist_orders_dataset.csv"
    assert orders.exists() and orders.stat().st_size > 1_000_000, "Olist orders download looks wrong"
    print(f"\nDone. Raw data in {RAW}")


if __name__ == "__main__":
    main()
