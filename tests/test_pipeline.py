"""Fast contracts on the pipeline logic.

Unit tests build from tiny hand-crafted frames (no download needed). The one
integration test runs only if `python -m analytics.build` has produced the
processed parquet, so a fresh checkout still passes `pytest`.
"""

from __future__ import annotations

import pandas as pd
import pytest

from analytics import config, metrics, transform, validate


def test_customers_use_unique_id_not_per_order_id():
    """The core Olist trap: repeat buyers share customer_unique_id but have
    a fresh customer_id per order. Repeat logic must key on the unique id."""
    orders = pd.DataFrame(
        {
            "order_id": ["o1", "o2", "o3"],
            "customer_unique_id": ["alice", "alice", "bob"],  # alice ordered twice
            "customer_state": ["SP", "SP", "RJ"],
            "customer_city": ["sp", "sp", "rj"],
            "order_purchase_timestamp": pd.to_datetime(
                ["2017-01-05", "2017-03-05", "2017-02-01"]
            ),
            "order_id_dup": [1, 2, 3],
            "payment_value": [100.0, 50.0, 80.0],
            "review_score": [5.0, 4.0, 3.0],
        }
    )
    cust = transform.build_customers(orders)
    alice = cust.set_index("customer_unique_id").loc["alice"]
    assert alice["n_orders"] == 2
    assert bool(alice["is_repeat"]) is True
    assert cust.set_index("customer_unique_id").loc["bob"]["is_repeat"] == False  # noqa: E712
    # Alice's cohort is her FIRST order month, not her second.
    assert alice["cohort_month"] == pd.Timestamp("2017-01-01")


def test_cookie_cats_drops_extreme_outlier_and_casts_bools():
    df = pd.DataFrame(
        {
            "userid": [1, 2, 3],
            "version": ["gate_30", "gate_40", "gate_30"],
            "sum_gamerounds": [10, 49854, 200],  # middle row is the logging artifact
            "retention_1": [True, False, True],
            "retention_7": [False, False, True],
        }
    )
    out = transform.clean_cookie_cats(df)
    assert len(out) == 2  # outlier removed
    assert out["retention_1"].dtype.kind == "i"  # bools -> int
    assert out["sum_gamerounds"].max() < 10_000


def test_status_funnel_is_monotonic():
    orders = pd.DataFrame(
        {"order_status": ["delivered"] * 5 + ["shipped"] * 2 + ["canceled"] * 3}
    )
    f = metrics.status_funnel(orders)
    counts = f["orders"].tolist()
    assert counts == sorted(counts, reverse=True)  # each stage >= the next
    # 7 orders reached 'shipped' (5 delivered + 2 shipped); all 5 delivered reached 'delivered'.
    assert f.set_index("stage").loc["shipped", "orders"] == 7
    assert f.set_index("stage").loc["delivered", "orders"] == 5


def test_late_flag_is_null_when_not_delivered():
    raw_orders = pd.DataFrame(
        {
            "order_id": ["a"],
            "customer_id": ["c"],
            "order_status": ["shipped"],
            "order_purchase_timestamp": pd.to_datetime(["2017-01-01"]),
            "order_approved_at": pd.to_datetime(["2017-01-01"]),
            "order_delivered_carrier_date": pd.to_datetime(["2017-01-02"]),
            "order_delivered_customer_date": pd.to_datetime([None]),
            "order_estimated_delivery_date": pd.to_datetime(["2017-01-10"]),
        }
    )
    raw = {
        "orders": raw_orders,
        "payments": pd.DataFrame(
            {"order_id": ["a"], "payment_sequential": [1], "payment_type": ["boleto"],
             "payment_installments": [1], "payment_value": [50.0]}
        ),
        "reviews": pd.DataFrame(
            {"order_id": ["a"], "review_id": ["r"], "review_score": [4]}
        ),
        "customers": pd.DataFrame(
            {"customer_id": ["c"], "customer_unique_id": ["u"],
             "customer_state": ["SP"], "customer_city": ["sp"]}
        ),
    }
    items = pd.DataFrame(
        {"order_id": ["a"], "order_item_id": [1], "product_id": ["p"],
         "seller_id": ["s"], "category": ["toys"], "price": [50.0],
         "freight_value": [5.0], "shipping_limit_date": pd.to_datetime(["2017-01-05"])}
    )
    orders = transform.build_orders(raw, items)
    assert pd.isna(orders["is_late"].iloc[0])  # not delivered -> no on-time truth


@pytest.mark.skipif(not config.ORDERS.exists(), reason="run `python -m analytics.build` first")
def test_built_tables_pass_schema_and_look_real():
    orders = pd.read_parquet(config.ORDERS)
    customers = pd.read_parquet(config.CUSTOMERS)
    cookie = pd.read_parquet(config.COOKIE_CATS)
    validate.validate_all({"orders": orders, "customers": customers, "cookie_cats": cookie})
    # Sanity anchors on the real data (guards against a botched refresh).
    assert 95_000 < len(orders) < 105_000
    assert orders["review_score"].dropna().between(1, 5).all()  # NaN = order had no review
    assert 0.02 < customers["is_repeat"].mean() < 0.05  # Olist's real ~3% repeat rate
