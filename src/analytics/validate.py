"""Schema + data-quality contracts for the curated tables (pandera).

These run inside the pipeline build and in CI. If an upstream refresh of the
data ever breaks an assumption a notebook relies on (a review score outside
1-5, a negative order value, a broken repeat flag), the build fails here
instead of a chart silently going wrong three notebooks later.
"""

from __future__ import annotations

from pandera.pandas import Check, Column, DataFrameSchema

orders_schema = DataFrameSchema(
    {
        "order_id": Column(str, unique=True),
        "order_status": Column(str, Check.isin(
            ["delivered", "shipped", "canceled", "unavailable",
             "invoiced", "processing", "created", "approved"]
        )),
        "order_value": Column(float, Check.ge(0), nullable=True),
        "payment_value": Column(float, Check.ge(0), nullable=True),
        "n_items": Column(float, Check.ge(1), nullable=True),
        "review_score": Column(float, Check.in_range(1, 5), nullable=True),
        "delivery_days": Column(float, Check.ge(0), nullable=True),
    },
    coerce=True,
    strict=False,
)

customers_schema = DataFrameSchema(
    {
        "customer_unique_id": Column(str, unique=True),
        "n_orders": Column(int, Check.ge(1)),
        "total_spend": Column(float, Check.ge(0), nullable=True),
        "is_repeat": Column(bool),
    },
    coerce=True,
    strict=False,
)

cookie_cats_schema = DataFrameSchema(
    {
        "userid": Column(int, unique=True),
        "version": Column(str, Check.isin(["gate_30", "gate_40"])),
        "sum_gamerounds": Column(int, Check.in_range(0, 10_000)),
        "retention_1": Column(int, Check.isin([0, 1])),
        "retention_7": Column(int, Check.isin([0, 1])),
    },
    coerce=True,
    strict=False,
)


def validate_all(tables: dict) -> None:
    orders_schema.validate(tables["orders"], lazy=True)
    customers_schema.validate(tables["customers"], lazy=True)
    if "cookie_cats" in tables:
        cookie_cats_schema.validate(tables["cookie_cats"], lazy=True)
