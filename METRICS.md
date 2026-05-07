# Key Metrics — AI Spend Audit

These are the metrics that determine whether AI Spend Audit is working as both a useful tool and a viable lead generation engine for Credex. Each metric has a target, a measurement method, and an action threshold (the value at which we need to investigate or change something).

---

## Primary Metrics

### 1. Audit Completion Rate

**Definition:** The percentage of users who start the audit form and complete it to see results.

**Target:** ≥ 40%

**Measurement:** `completed_audits / page_views_with_form_interaction` tracked via the `/api/audit` endpoint. A page view with form interaction is defined as any session where the user changes at least one form field.

**Why it matters:** This is the top of the entire funnel. If people don't complete the audit, nothing else matters — no email captures, no shares, no leads. A low completion rate means the form is too long, too confusing, or the value proposition isn't compelling enough.

**Action threshold:** Below 25% — redesign the form. Below 35% — A/B test reducing form fields or adding progress indicators. Above 50% — focus optimization efforts elsewhere.

**Current baseline:** Unknown (to be measured in first 100 audits)

---

### 2. Email Capture Rate

**Definition:** The percentage of users who complete an audit and then submit their email via the "Email My Report" modal.

**Target:** ≥ 20%

**Measurement:** `email_captures / completed_audits` tracked via the `/api/capture` endpoint and the `Lead` database table.

**Why it matters:** Email capture is the bridge between a free tool and a qualified lead. Without the email, we have no way to re-engage the user or pass them to Credex's sales pipeline. The email is the most valuable piece of data we collect.

**Action threshold:** Below 10% — the CTA isn't compelling enough or the modal is too intrusive. Below 15% — test different CTA copy or add more value to the email (e.g., "Get your report + pricing change alerts"). Above 30% — the funnel is healthy; focus on lead quality instead.

**Current baseline:** Unknown (to be measured in first 100 audits)

---

### 3. Share Rate

**Definition:** The percentage of users who share their audit result via the copy-link, Twitter, or LinkedIn buttons.

**Target:** ≥ 10%

**Measurement:** `share_events / completed_audits` tracked via client-side click events on share buttons. (Note: we can track button clicks but not whether the share actually completes on the social platform.)

**Why it matters:** Sharing is our primary viral acquisition channel. Each share generates free impressions and potentially new users at zero CAC. The OG meta tags on shared results (showing the savings amount) are designed to maximize click-through from social platforms.

**Action threshold:** Below 5% — the share buttons aren't prominent enough or the share copy isn't compelling. Below 8% — test different share text or add an incentive ("Share and get pricing alerts"). Above 15% — the viral loop is working; optimize the shared result landing page.

**Current baseline:** Unknown (to be measured in first 100 audits)

---

### 4. Average Savings Found

**Definition:** The mean monthly savings amount across all completed audits.

**Target:** ≥ $150/month per audit

**Measurement:** `SUM(totalMonthlySavings) / COUNT(audits)` calculated from the `auditData` JSON in the `SharedAudit` table.

**Why it matters:** The average savings amount is the core value proposition. If the tool consistently finds $150+/month in savings, users will trust it and share it. If it typically finds $10/month, the value prop is weak and the consultation CTA won't trigger.

**Action threshold:** Below $50 — the audit engine rules are too conservative or the pricing data is stale. Below $100 — add more recommendation strategies or expand tool coverage. Above $300 — the tool is delivering strong value; highlight this in marketing.

**Current baseline:** ~$200/month (based on test cases with typical 3-tool stacks)

---

### 5. Time to First Value

**Definition:** The time from when a user first interacts with the form to when they see their audit results.

**Target:** ≤ 3 minutes

**Measurement:** Client-side timestamp diff between first form interaction and results rendering. Can be approximated server-side by measuring the time between page load and `/api/audit` POST.

**Why it matters:** The "3 minutes" promise is central to the landing page copy. If the actual time is significantly longer, we're breaking trust. If it's significantly shorter, we can update the copy to be even more compelling ("60 seconds").

**Action threshold:** Above 5 minutes — the form is too complex or the API is too slow. Above 4 minutes — simplify the form or add auto-fill. Below 2 minutes — consider updating the "3 minutes" promise to "under 2 minutes."

**Current baseline:** ~90 seconds (based on the form + API response time; the API itself responds in <500ms)

---

## Secondary Metrics

### 6. High-Savings Lead Rate

**Definition:** Percentage of email captures where `monthlySavings > $500`

**Target:** ≥ 15%

**Why it matters:** High-savings leads are the most valuable ($600 each to Credex). If this rate is too low, the consultation CTA fires infrequently and the monetization path weakens.

---

### 7. Shared Result Bounce Rate

**Definition:** Percentage of visitors to `/result/[id]` who leave without running their own audit

**Target:** ≤ 70%

**Why it matters:** Shared result pages should drive new users, not just inform existing ones. The "Run your own free audit →" link on shared results is the key conversion element.

---

### 8. Pricing Data Freshness

**Definition:** Days since each tool's pricing was last verified against official sources

**Target:** ≤ 30 days for all tools

**Why it matters:** Stale pricing data produces wrong recommendations, which destroys trust. This is a maintenance metric, not a user-facing one.

---

### 9. LLM Summary Success Rate

**Definition:** Percentage of audit results where the AI-generated summary is successfully returned (vs. falling back to the template)

**Target:** ≥ 95%

**Why it matters:** The AI summary is a premium feature that differentiates the tool from a simple calculator. Frequent fallbacks mean the LLM integration is unreliable.

---

### 10. Cost per Audit

**Definition:** Total operating cost divided by number of audits completed in a given period

**Target:** ≤ $0.10 per audit

**Why it matters:** This is the unit cost of the free product. It includes LLM API costs (~$0.01 per summary), database operations (~$0.001), and hosting (~$0.01). At $0.10/audit, 1,000 audits cost $100 — well within the budget.

---

## Metrics Dashboard (Planned)

All metrics will be tracked in a simple dashboard accessible at `/admin` (protected by auth). The dashboard will show:

- Funnel visualization: Views → Audits → Emails → Shares → Consultations
- Time-series charts for each primary metric
- Alerts when any metric falls below its action threshold
- Pricing data freshness status for each tool

Until the dashboard is built, metrics will be calculated manually from the database using SQL queries run weekly.

---

## Weekly Review Template

Every Monday, review the following:

1. **Audit completion rate** — Is the form working?
2. **Email capture rate** — Is the CTA compelling?
3. **Share rate** — Is the viral loop turning?
4. **Average savings** — Is the engine delivering value?
5. **High-savings lead count** — Is the monetization path working?

If any metric is below its action threshold for two consecutive weeks, that becomes the top priority for the next sprint.
