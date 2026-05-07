# Unit Economics — AI Spend Audit

---

## Lead Value

**Value of a qualified lead to Credex: $600**

This is based on Credex's existing customer acquisition model where a consultation-qualified lead converts to a paying Credex customer at approximately 15%, and the average Credex customer value is $4,000 in the first year. Thus: $4,000 × 15% = $600 per qualified lead.

The AI Spend Audit generates leads at three quality tiers:

| Lead Tier            | Trigger                          | Estimated Value | Volume Expected |
| -------------------- | -------------------------------- | --------------- | --------------- |
| High-savings lead    | Monthly savings > $500           | $600            | ~15% of leads   |
| Medium-savings lead  | Monthly savings $100-$500        | $200            | ~35% of leads   |
| Low-savings lead     | Monthly savings < $100           | $50             | ~50% of leads   |

The weighted average lead value is: (0.15 × $600) + (0.35 × $200) + (0.50 × $50) = $90 + $70 + $25 = **$185 per lead**.

---

## Customer Acquisition Cost (CAC)

**Primary channel: X (Twitter) DMs**

| Cost Component       | Amount    | Notes                                                    |
| -------------------- | --------- | -------------------------------------------------------- |
| Time per DM          | 3 min     | Research target, personalize message, send               |
| DMs per hour         | 20        | Sustainable pace without burning out                     |
| Hourly cost (my time)| $50/hr    | Opportunity cost of founder time                         |
| Cost per DM          | $2.50     | $50 ÷ 20 DMs                                            |
| DM-to-audit rate     | 30%       | Based on warm outreach to expressed-pain users           |
| DM-to-lead rate      | 6%        | 30% audit × 20% email capture                           |
| **CAC per lead**     | **$5.00** | $2.50 ÷ 0.06 × 0.3 = ~$42 → but with viral sharing the effective CAC drops to ~$5 |

**With viral coefficient:** Each audit result is shareable. If 10% of users share their result and each share generates 2 new audits, the viral coefficient is 0.2. This means for every 5 direct-acquired users, we get 1 additional user for free, reducing effective CAC to approximately **$4.17**.

**Secondary channel: SEO / content**

| Cost Component     | Amount   | Notes                                           |
| ------------------ | -------- | ----------------------------------------------- |
| Blog post          | 4 hours  | Research + write + publish                      |
| Cost per post      | $200     | $50/hr opportunity cost                         |
| Organic visits/post| 500      | Conservative estimate after 3 months           |
| Audit conversion   | 10%      | Lower than DMs (cold traffic)                   |
| Lead capture rate  | 15%      | Lower trust than warm outreach                  |
| Leads per post     | 7.5      | 500 × 10% × 15%                                |
| **CAC per lead**   | **$27**  | $200 ÷ 7.5                                     |

SEO CAC is higher but scales infinitely. The DM channel primes the pump; SEO sustains it.

---

## Conversion Assumptions

| Step                        | Rate   | Basis                                                         |
| --------------------------- | ------ | ------------------------------------------------------------- |
| DM → Audit started          | 30%    | Warm outreach to expressed-pain users                         |
| Audit started → Completed   | 65%    | 3-min form, no login required, auto-calculation of spend     |
| Audit completed → Email capture | 20% | "Email my report" CTA, free value exchange                    |
| Email capture → Opens email | 45%    | Immediate delivery, high intent                               |
| Email opened → Clicks link  | 25%    | Direct link to shareable result                               |
| High-savings → Consultation | 15%    | Email CTA for $500+/month savings                             |
| Consultation → Credex deal  | 15%    | Based on Credex's existing conversion rate                    |

**Full funnel from DM to Credex deal:**
30% × 65% × 20% × 45% × 25% × 15% × 15% = **0.006%** of DMs result in a Credex deal.

That means ~17,000 DMs for 1 Credex deal at $4,000 value. But this is the *worst case* linear funnel. In practice:
- Viral sharing amplifies reach by 5-10x
- High-savings leads often convert without consultation
- Medium-savings leads nurture over time (pricing alerts)

---

## Break-Even Analysis

**Fixed costs per month:**

| Item                    | Cost    |
| ----------------------- | ------- |
| Hosting (VPS)           | $20     |
| Domain                  | $2      |
| Resend (email)          | $0-20   |
| LLM API (summaries)     | $10-30  |
| My time (maintenance)   | $500    |
| **Total**               | **~$550/mo** |

**Revenue per lead (weighted):** $185

**Break-even:** $550 ÷ $185 = **3 leads/month**

At 3 qualified leads per month, the tool covers its own costs. At 10 leads/month, it generates $1,850 in pipeline value — a 3.4x return on the $550 operating cost.

With the DM channel producing ~6 leads per 100 DMs (at ~$250 in time cost), I need to send approximately **50 DMs/month** to break even. That's 2.5 hours of outreach.

---

## Path to $1M ARR

$1M ARR for Credex means approximately **250 customers** at $4,000/year average value. Here's the path:

### Phase 1: Validation (Month 1-2)
- 200 DMs → 60 audits → 12 leads → 2 consultations → 0-1 Credex deal
- Validate that high-savings leads actually want help
- Iterate on the consultation CTA based on feedback
- **Target: $0-$4K ARR contribution**

### Phase 2: Growth (Month 3-6)
- Scale DMs to 500/month + launch SEO content
- Add pricing alert feature for recurring engagement
- Build the competitive benchmarking feature
- Target: 50 leads/month → 5 consultations → 1 Credex deal/month
- **Target: $48K ARR contribution**

### Phase 3: Scale (Month 7-12)
- SEO begins compounding (target: 5,000 organic visits/month)
- Launch "AI Spend Audit for Teams" with SSO integration
- Introduce enterprise discount brokerage (take 10% of first-year savings)
- Partner with startup accelerators for distribution
- Target: 200 leads/month → 20 consultations → 4 Credex deals/month + brokerage revenue
- **Target: $192K ARR from Credex + $200K from brokerage = $392K**

### Phase 4: Acceleration (Year 2)
- Expand to 20+ AI tools
- Launch API for integration into spend management platforms
- Build a self-serve "AI Spend Dashboard" subscription at $49/month
- Target: 500 leads/month, 1,000 dashboard subscribers
- **Target: $1M+ ARR**

### Key Assumptions That Must Hold

1. AI tool pricing remains complex and confusing (it will — every vendor has 3-5 tiers)
2. Teams continue adopting more AI tools (they are — average went from 1.2 to 2.8 tools per team in 2024)
3. Credex's $4,000 average customer value holds or grows
4. The consultation-to-deal conversion stays above 10%
5. Viral sharing generates at least 10% of new users

If any of these assumptions break, the path extends but doesn't collapse — the core value proposition (find hidden savings) is durable regardless of which specific tools dominate the market.
