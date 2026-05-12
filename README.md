# Data Analytics Portfolio

A complete data analytics case study built around **FlowDesk** — a fictional B2B SaaS project management company (think Asana / Monday.com). Seven notebooks cover every analytical skill tested in DA and DS interviews at Meta, Airbnb, LinkedIn, Stripe, and Amazon.

Every notebook answers a real business question using a consistent synthetic dataset with planted signals — including a DAU drop with a discoverable root cause, A/B experiments where one has conflicting metrics, and cohort retention trends that reflect a real product improvement arc.

---

## Company Context: FlowDesk

FlowDesk launched in January 2022. It sells team workspaces to companies and charges per seat on a free/pro/business/enterprise tier model. The analytical questions across these notebooks are the same questions a DA or DS at FlowDesk's real-world equivalent would be answering every week.

---

## Dataset

Generated with Faker — run once with `python data/generate_data.py`.

| File | Rows | Description |
|---|---|---|
| `users.parquet` | 15,000 | Users with signup cohort, device, plan, churn date |
| `events.parquet` | ~960,000 | Clickstream: page views, feature usage, checkout events |
| `workspaces.parquet` | 3,000 | Company workspaces with plan, MRR, industry |
| `experiments.parquet` | 11,000 | Two A/B test assignments with outcome metrics |
| `feature_usage.parquet` | 327,000 | Weekly feature adoption per user |
| `support_tickets.parquet` | 12,000 | Support tickets with resolution time and CSAT |

**Planted signals** (for genuine discovery in notebooks):
- Cohort retention improved significantly from Q1-2022 → Q3-2023 (onboarding overhaul)
- Mobile activation rate is 22pp lower than desktop (funnel investigation)
- A/B test "onboarding_checklist": treatment D7 retention +12.5% (clear ship signal)
- A/B test "annual_pricing_nudge": revenue up +22% BUT activation slightly down (conflicting metrics)
- Nov 3-21 2023: mobile app bug suppressed 48% of page_view/feature_used/dashboard events

---

## Notebooks

| # | Notebook | Business Question | Key Skills |
|---|---|---|---|
| 01 | [EDA and Business Framing](notebooks/01_eda_and_business_framing.ipynb) | "What does our business look like right now?" | EDA, business storytelling, stakeholder-ready summaries |
| 02 | [Cohort and Retention Analysis](notebooks/02_cohort_and_retention_analysis.ipynb) | "Are we getting better at keeping users?" | Cohort retention triangle, LTV estimation, churn trends |
| 03 | [Funnel Analysis](notebooks/03_funnel_analysis.ipynb) | "Where are we losing users?" | Multi-stage funnel, device segmentation, channel analysis |
| 04 | [A/B Testing — Complete](notebooks/04_ab_testing_complete.ipynb) | "Did our experiments work? Should we ship?" | Power analysis, z-test, t-test, novelty effect, guardrail metrics, conflicting metrics, ship/no-ship recommendation |
| 05 | [Metric Definition and Product Sense](notebooks/05_metric_definition_and_product_sense.ipynb) | "How would you measure success for this new feature?" | Meta Analytical Reasoning round format, primary/guardrail/counter-metric framework |
| 06 | [Metric Drop Investigation](notebooks/06_metric_drop_investigation.ipynb) | "DAU dropped 18%. Why?" | 5-step investigation framework, data validation, segmentation, root cause analysis, post-mortem |
| 07 | [Statistical Inference](notebooks/07_statistical_inference.ipynb) | "What's the probability our model is right?" | Bayes' theorem, distributions, Type I/II errors, Simpson's paradox, regression to the mean |

---

## Skills Covered

### Exploratory Data Analysis
- Systematic data quality audit (null %, row counts, date ranges, schema review)
- Distribution analysis: users by plan, channel, device, country
- Revenue analysis: MRR by plan tier, LTV by cohort
- Engagement: DAU trends, hourly patterns, feature adoption heatmap

### Cohort and Retention Analysis
- Acquisition cohort construction from signup dates
- Retention triangle: % of cohort active at month 0, 1, 2, ...12
- Seaborn annotated retention heatmap — the chart every PM knows
- Early/mid/recent cohort comparison with confidence bands
- Monthly churn rate trend with inflection point identification

### Funnel Analysis
- 7-stage user journey from signup → checkout → 30-day retention
- Waterfall chart with absolute counts + % drop-off at each stage
- Full funnel segmented by device, channel, and plan
- Time-to-convert distribution and activation window analysis
- Upgrader vs non-upgrader feature usage profiling

### A/B Testing (Production-Grade)
- Sanity checks: balance, temporal distribution, covariate comparability
- Two-proportion z-test with Wilson score confidence intervals
- Welch's t-test for continuous metrics (revenue)
- Power analysis and minimum detectable effect calculation
- Novelty effect detection (weekly effect stability chart)
- Heterogeneous treatment effects by device and plan tier
- Guardrail metric analysis
- **Conflicting metrics scenario**: revenue up, activation down — explicit tradeoff framing
- Structured ship/no-ship recommendation for both experiments

### Metric Definition and Product Sense (Meta-Style)
- The 5-layer metric framework: primary, guardrail, counter-metric, leading indicator, ecosystem
- Applied to three new product features with full framework walkthrough
- Baseline computation from real data for each metric
- DAU/MAU stickiness ratio analysis by plan tier

### Metric Drop Investigation (LinkedIn/Meta-Style)
- Step 1: Data validation — is the drop real or a pipeline artifact?
- Step 2: Segmentation — by device, cohort, country, event type, platform
- Step 3: Correlation with known events — deployment timeline
- Step 4: Impact quantification — DAU-days lost, affected users, MRR at risk
- Step 5: Post-mortem document — root cause, impact, resolution, recommendations

### Statistical Inference (DS Interviews)
- Bayes' theorem applied to ML model evaluation (churn model posterior)
- Binomial distribution: retention campaign success probability
- Poisson distribution: support ticket volume forecasting
- Confidence intervals from real revenue data
- Type I/II errors applied to activation intervention timing
- Simpson's paradox: device × plan stratification
- Regression to the mean: why pre/post campaign comparisons are unreliable

---

## Getting Started

```bash
# Install dependencies
pip install -r requirements.txt

# Generate the dataset (one-time, ~60 seconds)
python data/generate_data.py

# Open any notebook
jupyter notebook notebooks/01_eda_and_business_framing.ipynb
```

---

## Stack

| Tool | Purpose |
|---|---|
| `pandas` | Data manipulation and analysis |
| `numpy` | Numerical computation |
| `matplotlib` / `seaborn` | Visualization |
| `scipy.stats` | Statistical tests (z-test, t-test, Poisson, Binomial) |
| `faker` | Synthetic data generation |
| `pyarrow` | Parquet file I/O |

---

## Author

**Siddharth Bokka**
