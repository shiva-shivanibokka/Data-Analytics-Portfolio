"""
generate_data.py
================
Generates synthetic data for a B2B SaaS company called "FlowDesk"
(a project management / workflow tool — think Asana/Monday/Notion).

All 7 notebooks in this project use this same dataset, giving the
analyses continuity — every notebook answers a different question
about the same business.

Company context
---------------
FlowDesk launched January 2022. It sells seats to companies
(workspaces). Users sign up, onboard, use features, and either
churn or expand. The company runs A/B experiments on their
onboarding flow and pricing page.

Data planted for analytical discovery
--------------------------------------
- Cohort retention: Q1 2022 cohort retains better than Q3 2022 cohort
  (product improvements in mid-2022 didn't help)
- Q3 2023 cohort is the best (major onboarding overhaul shipped June 2023)
- Funnel: mobile users convert at ~30% lower rate than desktop
- A/B test "onboarding_checklist": treatment lifts D7 retention significantly
- A/B test "annual_pricing_nudge": treatment increases revenue but slightly
  reduces activation rate (the conflicting metrics scenario)
- Metric drop: in November 2023, DAU dropped 18% — root cause is a bug
  in the mobile app that was deployed on Nov 3rd (planted in events data)

Files generated
---------------
data/users.parquet          — 40,000 users
data/events.parquet         — ~3,000,000 events
data/feature_usage.parquet  — weekly feature usage per user
data/experiments.parquet    — two A/B tests
data/subscriptions.parquet  — monthly subscription state per workspace
data/support_tickets.parquet

Run
---
    python data/generate_data.py
"""

import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from faker import Faker

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
fake = Faker()
Faker.seed(SEED)

OUT = Path(__file__).parent

START = datetime(2022, 1, 1)
END = datetime(2024, 3, 31)

N_USERS = 15_000
N_WORKSPACES = 3_000


# ── Helpers ────────────────────────────────────────────────────────────────────


def rdate(start: datetime, end: datetime) -> datetime:
    delta = (end - start).total_seconds()
    return start + timedelta(seconds=random.uniform(0, delta))


def cohort_month(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


def retention_p(cohort: str, weeks_since: int) -> float:
    """
    Retention probability at N weeks since signup, varying by cohort.
    Planted signal: Q1-2022 is mediocre, Q3-2023 is excellent.
    """
    base = {
        "2022-01": 0.55,
        "2022-02": 0.53,
        "2022-03": 0.52,
        "2022-04": 0.50,
        "2022-05": 0.49,
        "2022-06": 0.48,
        "2022-07": 0.46,
        "2022-08": 0.47,
        "2022-09": 0.48,
        "2022-10": 0.50,
        "2022-11": 0.51,
        "2022-12": 0.53,
        "2023-01": 0.56,
        "2023-02": 0.57,
        "2023-03": 0.58,
        "2023-04": 0.59,
        "2023-05": 0.60,
        "2023-06": 0.63,
        "2023-07": 0.65,
        "2023-08": 0.66,
        "2023-09": 0.67,
        "2023-10": 0.67,
        "2023-11": 0.66,
        "2023-12": 0.65,
        "2024-01": 0.66,
        "2024-02": 0.67,
        "2024-03": 0.67,
    }.get(cohort, 0.55)
    decay = 0.88**weeks_since  # exponential decay
    return min(base * decay, 1.0)


# ── Workspaces ─────────────────────────────────────────────────────────────────


def gen_workspaces() -> pd.DataFrame:
    sizes = ["solo", "small", "medium", "large"]
    size_w = [0.30, 0.40, 0.20, 0.10]
    plans = ["free", "pro", "business", "enterprise"]
    plan_map = {
        "solo": ["free", "pro"],
        "small": ["free", "pro", "business"],
        "medium": ["pro", "business", "enterprise"],
        "large": ["business", "enterprise"],
    }
    industries = [
        "Technology",
        "Marketing",
        "Finance",
        "Healthcare",
        "Education",
        "Retail",
        "Consulting",
        "Other",
    ]
    rows = []
    for wid in range(1, N_WORKSPACES + 1):
        sz = random.choices(sizes, weights=size_w)[0]
        plan = random.choice(plan_map[sz])
        created = rdate(START, datetime(2024, 1, 1))
        rows.append(
            {
                "workspace_id": wid,
                "name": fake.company(),
                "size_tier": sz,
                "plan": plan,
                "industry": random.choice(industries),
                "country": random.choices(
                    ["US", "CA", "GB", "DE", "AU", "FR", "IN", "Other"],
                    weights=[50, 8, 8, 6, 5, 5, 5, 13],
                )[0],
                "created_at": created,
                "mrr": {"free": 0, "pro": 49, "business": 199, "enterprise": 999}[plan],
            }
        )
    df = pd.DataFrame(rows)
    print(f"  [OK] {len(df):,} workspaces")
    return df


# ── Users ──────────────────────────────────────────────────────────────────────


def gen_users(workspaces: pd.DataFrame) -> pd.DataFrame:
    roles = ["admin", "member", "viewer"]
    role_w = [0.25, 0.60, 0.15]
    channels = [
        "organic",
        "paid_search",
        "content",
        "referral",
        "product_hunt",
        "direct",
    ]
    chan_w = [0.30, 0.20, 0.18, 0.15, 0.07, 0.10]
    devices = ["desktop", "mobile", "tablet"]
    dev_w = [0.55, 0.38, 0.07]
    rows = []
    wids = workspaces["workspace_id"].tolist()

    for uid in range(1, N_USERS + 1):
        wid = random.choice(wids)
        ws_row = workspaces[workspaces.workspace_id == wid].iloc[0]
        ws_cre = ws_row["created_at"]
        signup = rdate(ws_cre, min(ws_cre + timedelta(days=180), END))
        cohort = cohort_month(signup)
        role = random.choices(roles, weights=role_w)[0]
        channel = random.choices(channels, weights=chan_w)[0]
        device = random.choices(devices, weights=dev_w)[0]

        # Mobile users have lower activation rate (planted signal for funnel NB)
        activation_p = (
            0.72 if device == "desktop" else 0.50 if device == "mobile" else 0.63
        )
        activated = random.random() < activation_p

        rows.append(
            {
                "user_id": uid,
                "workspace_id": wid,
                "email": fake.unique.email(),
                "role": role,
                "signup_date": signup,
                "cohort_month": cohort,
                "acquisition_channel": channel,
                "primary_device": device,
                "country": ws_row["country"],
                "plan": ws_row["plan"],
                "is_activated": int(activated),
                "is_churned": 0,  # will fill below
                "churn_date": None,
            }
        )

    df = pd.DataFrame(rows)

    # Assign churn: sample an overall churn probability per user,
    # not a per-week loop (which compounds to near 100%)
    rng2 = np.random.default_rng(SEED + 1)
    for idx, row in df.iterrows():
        signup = row["signup_date"]
        if signup > END - timedelta(days=60):
            continue
        cohort = row["cohort_month"]
        max_weeks = (END - signup).days // 7
        # Base churn probability over entire tenure (not per week)
        base_churn_p = {
            "2022-01": 0.42,
            "2022-02": 0.43,
            "2022-03": 0.44,
            "2022-04": 0.46,
            "2022-05": 0.47,
            "2022-06": 0.48,
            "2022-07": 0.50,
            "2022-08": 0.49,
            "2022-09": 0.48,
            "2022-10": 0.46,
            "2022-11": 0.44,
            "2022-12": 0.42,
            "2023-01": 0.40,
            "2023-02": 0.39,
            "2023-03": 0.38,
            "2023-04": 0.37,
            "2023-05": 0.36,
            "2023-06": 0.33,
            "2023-07": 0.31,
            "2023-08": 0.30,
            "2023-09": 0.29,
            "2023-10": 0.30,
            "2023-11": 0.31,
            "2023-12": 0.32,
            "2024-01": 0.25,
            "2024-02": 0.20,
            "2024-03": 0.15,
        }.get(cohort, 0.40)
        if rng2.random() < base_churn_p:
            churn_week = int(rng2.integers(4, max(max_weeks, 5)))
            churn_dt = signup + timedelta(weeks=churn_week)
            if churn_dt < END:
                df.at[idx, "is_churned"] = 1
                df.at[idx, "churn_date"] = churn_dt

    print(
        f"  [OK] {len(df):,} users | "
        f"churned={df.is_churned.sum():,} ({df.is_churned.mean() * 100:.1f}%)"
    )
    return df


# ── Events ─────────────────────────────────────────────────────────────────────


def gen_events(users: pd.DataFrame) -> pd.DataFrame:
    """
    Generate clickstream events — vectorized.
    Planted signals:
    - Nov 2023: mobile DAU drops 18% starting Nov 3rd (app bug)
    - Funnel: mobile checkout conversion lower than desktop
    """
    event_types = [
        "page_view",
        "feature_used",
        "project_created",
        "task_created",
        "task_completed",
        "comment_added",
        "file_uploaded",
        "dashboard_viewed",
        "export_triggered",
        "invite_sent",
        "upgrade_page_viewed",
        "checkout_started",
        "checkout_completed",
    ]
    mobile_bug_start = pd.Timestamp("2023-11-03")
    mobile_bug_end = pd.Timestamp("2023-11-21")
    buggy_types = {"page_view", "feature_used", "dashboard_viewed"}

    rng = np.random.default_rng(SEED)
    users_cp = users.copy()
    users_cp["signup_date"] = pd.to_datetime(users_cp["signup_date"])
    users_cp["churn_date"] = pd.to_datetime(users_cp["churn_date"], errors="coerce")
    users_cp["end_dt"] = users_cp["churn_date"].where(
        users_cp["is_churned"] == 1, pd.Timestamp(END)
    )
    users_cp = users_cp[users_cp["end_dt"] > users_cp["signup_date"]]

    # Assign per-user event count
    n_events_per_user = rng.integers(10, 120, size=len(users_cp))
    total_events = int(n_events_per_user.sum())

    # Repeat user rows for vectorized event generation
    user_rep = users_cp.loc[users_cp.index.repeat(n_events_per_user)].reset_index(
        drop=True
    )

    start_ns = user_rep["signup_date"].astype(np.int64).values
    end_ns = user_rep["end_dt"].astype(np.int64).values
    rand_ns = (rng.random(total_events) * (end_ns - start_ns)).astype(
        np.int64
    ) + start_ns
    event_ts = pd.to_datetime(rand_ns, unit="ns")

    etypes = rng.choice(event_types, size=total_events)
    is_mob = (user_rep["primary_device"] == "mobile").values
    in_bug = (event_ts >= mobile_bug_start) & (event_ts <= mobile_bug_end)
    is_buggy = np.array([e in buggy_types for e in etypes])
    suppress = is_mob & in_bug & is_buggy & (rng.random(total_events) < 0.55)

    events_df = pd.DataFrame(
        {
            "event_id": np.arange(1, total_events + 1),
            "user_id": user_rep["user_id"].values,
            "workspace_id": user_rep["workspace_id"].values,
            "event_type": etypes,
            "event_ts": event_ts,
            "device": user_rep["primary_device"].values,
            "platform": np.where(
                user_rep["primary_device"].values == "mobile", "mobile_app", "web"
            ),
        }
    )
    events_df = events_df[~suppress].reset_index(drop=True)
    events_df["event_id"] = np.arange(1, len(events_df) + 1)

    print(f"  [OK] {len(events_df):,} events")
    return events_df


# ── Feature Usage ──────────────────────────────────────────────────────────────


def gen_feature_usage(users: pd.DataFrame) -> pd.DataFrame:
    """
    Weekly feature adoption — vectorized for speed.
    Sample 5,000 active users and generate up to 26 weeks each.
    """
    features = [
        "tasks",
        "projects",
        "comments",
        "files",
        "dashboards",
        "automations",
        "integrations",
        "time_tracking",
    ]
    active = (
        users[users["is_activated"] == 1]
        .sample(n=min(5000, len(users[users["is_activated"] == 1])), random_state=SEED)
        .copy()
    )
    active["signup_date"] = pd.to_datetime(active["signup_date"])

    rows = []
    rng = np.random.default_rng(SEED)
    for _, u in active.iterrows():
        signup = u["signup_date"]
        end_dt = (
            pd.Timestamp(u["churn_date"])
            if u["is_churned"] and u["churn_date"]
            else pd.Timestamp(END)
        )
        n_weeks = min(max(1, (end_dt - signup).days // 7), 26)
        for w in range(n_weeks):
            week_start = (signup + timedelta(weeks=w)).date()
            base_p = min(0.1 + w * 0.025, 0.85)
            for feat in features:
                if rng.random() < base_p:
                    rows.append(
                        {
                            "user_id": int(u["user_id"]),
                            "week_start": week_start,
                            "feature": feat,
                            "usage_count": int(rng.integers(1, 51)),
                        }
                    )
    df = pd.DataFrame(rows)
    print(f"  [OK] {len(df):,} feature usage records")
    return df


# ── Experiments ────────────────────────────────────────────────────────────────


def gen_experiments(users: pd.DataFrame) -> pd.DataFrame:
    """
    Two A/B experiments with planted signals:

    1. onboarding_checklist (started 2023-02-01):
       Treatment: interactive onboarding checklist on signup
       Signal: +12% D7 retention in treatment
       No guardrail issues.

    2. annual_pricing_nudge (started 2023-07-01):
       Treatment: show "Save 30% with annual plan" on upgrade page
       Signal: +22% annual plan upgrade rate (revenue up)
       Guardrail: activation rate slightly lower in treatment
       (conflicting metrics scenario for Notebook 04)
    """
    experiments_config = {
        "onboarding_checklist": {
            "start": datetime(2023, 2, 1),
            "end": datetime(2023, 5, 1),
            "n_users": 6000,
            "metrics": {
                "control": {
                    "d7_retained": 0.38,
                    "activated": 0.68,
                    "revenue_per_user": 0.0,
                },
                "treatment": {
                    "d7_retained": 0.43,
                    "activated": 0.69,
                    "revenue_per_user": 0.0,
                },
            },
        },
        "annual_pricing_nudge": {
            "start": datetime(2023, 7, 1),
            "end": datetime(2023, 10, 1),
            "n_users": 5000,
            "metrics": {
                "control": {
                    "d7_retained": 0.42,
                    "activated": 0.70,
                    "revenue_per_user": 12.4,
                },
                "treatment": {
                    "d7_retained": 0.42,
                    "activated": 0.67,
                    "revenue_per_user": 15.1,
                },
                # activation slightly lower (-3pp) but revenue higher (+22%) — the conflict
            },
        },
    }

    eligible = users[users.signup_date >= datetime(2023, 1, 1)].copy()
    rows = []
    aid = 1

    for exp_name, cfg in experiments_config.items():
        sample = eligible.sample(
            n=min(cfg["n_users"], len(eligible)), random_state=SEED
        )
        for _, u in sample.iterrows():
            variant = random.choice(["control", "treatment"])
            m = cfg["metrics"][variant]
            assigned_at = rdate(cfg["start"], cfg["end"])
            d7_retained = int(random.random() < m["d7_retained"])
            activated = int(random.random() < m["activated"])
            revenue = (
                round(m["revenue_per_user"] * random.uniform(0.5, 2.0), 2)
                if m["revenue_per_user"] > 0 and random.random() < 0.30
                else 0.0
            )
            rows.append(
                {
                    "assignment_id": aid,
                    "experiment_name": exp_name,
                    "user_id": int(u["user_id"]),
                    "variant": variant,
                    "assigned_at": assigned_at,
                    "d7_retained": d7_retained,
                    "is_activated": activated,
                    "revenue": revenue,
                }
            )
            aid += 1

    df = pd.DataFrame(rows)
    print(f"  [OK] {len(df):,} experiment assignments")
    return df


# ── Support Tickets ────────────────────────────────────────────────────────────


def gen_support_tickets(users: pd.DataFrame) -> pd.DataFrame:
    cats = ["billing", "feature_request", "bug", "onboarding", "other"]
    cat_w = [0.25, 0.30, 0.20, 0.15, 0.10]
    rows = []
    active = users[users.is_churned == 0]
    for tid in range(1, 12_001):
        u = active.sample(1).iloc[0]
        signup = u["signup_date"]
        if isinstance(signup, str):
            signup = datetime.fromisoformat(signup)
        created = rdate(signup, END)
        resolved = int(random.random() < 0.84)
        res_time = random.randint(1, 72) if resolved else None
        res_ts = (created + timedelta(hours=res_time)) if res_time else None
        csat = random.randint(1, 5) if resolved and random.random() < 0.55 else None
        rows.append(
            {
                "ticket_id": tid,
                "user_id": int(u["user_id"]),
                "workspace_id": int(u["workspace_id"]),
                "created_at": created,
                "resolved_at": res_ts,
                "category": random.choices(cats, weights=cat_w)[0],
                "priority": random.choices(
                    ["low", "medium", "high"], weights=[0.50, 0.35, 0.15]
                )[0],
                "resolved": resolved,
                "csat_score": csat,
            }
        )
    df = pd.DataFrame(rows)
    print(f"  [OK] {len(df):,} support tickets")
    return df


# ── Main ───────────────────────────────────────────────────────────────────────


def main() -> None:
    print("Generating FlowDesk synthetic dataset...")

    print("Workspaces...")
    workspaces = gen_workspaces()

    print("Users...")
    users = gen_users(workspaces)

    print("Events (this takes ~2 minutes)...")
    events = gen_events(users)

    print("Feature usage...")
    feature_usage = gen_feature_usage(users)

    print("Experiments...")
    experiments = gen_experiments(users)

    print("Support tickets...")
    tickets = gen_support_tickets(users)

    print("Saving parquet files...")
    workspaces.to_parquet(OUT / "workspaces.parquet", index=False)
    users.to_parquet(OUT / "users.parquet", index=False)
    events.to_parquet(OUT / "events.parquet", index=False)
    feature_usage.to_parquet(OUT / "feature_usage.parquet", index=False)
    experiments.to_parquet(OUT / "experiments.parquet", index=False)
    tickets.to_parquet(OUT / "support_tickets.parquet", index=False)

    print("\nDataset summary:")
    for name, df in [
        ("workspaces", workspaces),
        ("users", users),
        ("events", events),
        ("feature_usage", feature_usage),
        ("experiments", experiments),
        ("support_tickets", tickets),
    ]:
        sz = (OUT / f"{name}.parquet").stat().st_size / 1024 / 1024
        print(f"  {name:<20} {len(df):>10,} rows  ({sz:.1f} MB)")
    print("\nDone! Run notebooks in order: 01 -> 07")


if __name__ == "__main__":
    main()
