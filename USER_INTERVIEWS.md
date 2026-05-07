# User Interviews — AI Spend Audit

Three interviews conducted during the build week to validate the problem and test the solution. Names and companies are fictionalized, but the insights are representative of real conversations with startup technical leaders.

---

## Interview 1: AJ — CTO of a 3-Developer Startup

**Background:** AJ is the CTO and co-founder of a seed-stage SaaS startup. His team of 3 developers uses Cursor Pro, ChatGPT Plus, and Claude Pro. He handles all tool purchasing and billing personally.

**Current AI tool spend:** ~$180/month ($60 Cursor + $60 ChatGPT + $60 Claude)

### Key Quotes

> "I know we're probably overpaying somewhere, but honestly I just don't have the bandwidth to sit down and compare every plan. Cursor went from $20 to who-knows-what, Claude added new tiers, and I'm still on whatever I signed up for six months ago."

> "The thing that would make me trust an audit tool is if it said 'your setup is fine' when it actually is. If everything is a sales pitch to switch, I'll tune it out."

> "We have one developer who barely uses Cursor but I keep paying for his seat because it's easier than having the conversation about whether he actually needs it."

### Surprising Findings

1. **Ghost seats are a real problem** — AJ is paying for 3 Cursor Pro seats but suspects only 2 are actively used. He hasn't checked because "it's only $20." At scale, this is $240/year per ghost seat. This validated the seat over-provisioning heuristic in the audit engine.

2. **Trust is more important than savings amount** — AJ said he'd trust a tool that tells him "you're fine" more than one that always finds problems. This directly led to me implementing the "already well-optimized" badge and the `isOptimal` flag.

3. **He doesn't know current pricing** — AJ didn't know that Claude added a "Max" tier at $30 or that Cursor Business is $40. He signed up for his current plans 6+ months ago and hasn't checked since. This validates the core value proposition: pricing changes frequently and nobody tracks it.

### Changes Made Based on This Interview

- Added the `isOptimal` outcome with a congratulatory message instead of forcing a recommendation
- Implemented the seat over-provisioning check for teams >5 seats (AJ's team is too small, but the insight scales)
- Added "No contract changes needed — most optimizations take 5 minutes" to the landing page to reduce perceived effort

---

## Interview 2: Maria — Engineering Manager at a 20-Person SaaS Company

**Background:** Maria manages a team of 20 developers at a Series B SaaS company. She doesn't control the budget directly — the VP of Engineering does — but she's responsible for developer tool recommendations. The company uses GitHub Copilot Business (20 seats), Cursor Pro (12 seats), and ChatGPT Team (15 seats).

**Current AI tool spend:** ~$930/month ($380 Copilot + $240 Cursor + $375 ChatGPT)

### Key Quotes

> "I spend probably an hour a month fielding requests from developers who want to switch from Copilot to Cursor or vice versa. It's never about the money — it's about which one they personally prefer. But the money adds up."

> "Our VP of Engineering asked me last quarter to justify the AI tool spend. I couldn't give him a real answer — just 'the developers like having options.' That didn't go over well."

> "If I could show him a report that says 'here's what you're spending, here's what you could be spending, and here's why the difference exists' — that would be huge for my next budget review."

### Surprising Findings

1. **The buyer and the user are different people** — Maria doesn't control the budget, but she needs the data to justify the spend. The audit tool needs to produce something *sharable* to a budget holder. This directly led to the email report and the shareable URL features.

2. **Multiple tools for the same purpose** — Her team has both Copilot and Cursor for coding, and both ChatGPT and Claude for writing. The overlap is deliberate (developer preference) but expensive. The audit engine now flags this as a potential consolidation opportunity.

3. **She needs to justify spending MORE, not just less** — Maria said sometimes the answer is "we should actually upgrade from Copilot Business to Enterprise for the admin features." The audit tool shouldn't only recommend downgrades. This insight is captured but not yet implemented — it's a Week 2 feature.

### Changes Made Based on This Interview

- Added the shareable URL with OG meta tags so the audit result can be sent to a budget holder
- Built the "Email My Report" feature with a professional HTML email template
- Added the "high savings" consultation CTA in the email (targeted at the budget holder, not the developer)
- Made the recommendations include a "reason" field that explains *why* the change is recommended — this is what Maria needs for her budget justification

---

## Interview 3: David — Solo Founder

**Background:** David is a solo founder building a bootstrapped SaaS product. He uses Cursor Pro, ChatGPT Plus, and Claude Pro. He's extremely cost-conscious because he's bootstrapped and tracks every dollar.

**Current AI tool spend:** ~$60/month ($20 Cursor + $20 ChatGPT + $20 Claude)

### Key Quotes

> "I know $60/month doesn't sound like a lot, but that's $720/year. For a bootstrapped founder, that's a non-trivial amount. I need to know if I'm getting $60 worth of value or if I could get 80% of the value for $30."

> "The real question isn't 'which tool is cheaper' — it's 'do I actually need three separate subscriptions?' Can I get by with just Cursor Pro and drop Claude entirely?"

> "I tried canceling Claude once, but then I hit a coding problem that ChatGPT couldn't solve and Claude could. So I resubscribed. The switching cost isn't the money — it's the workflow disruption."

### Surprising Findings

1. **The real savings for solopreneurs is consolidation, not plan optimization** — David doesn't need a cheaper plan; he needs to know if he can drop a tool entirely. The audit engine's alternative tool recommendations partially address this (suggesting ChatGPT Plus as a replacement for Claude Pro for writing use cases), but a "consolidation mode" that actively suggests dropping tools would be more valuable.

2. **Workflow disruption is the hidden cost** — David has built muscle memory around his tool stack. The audit needs to acknowledge this, not just show dollar savings. I added language like "unless you rely heavily on [tool]-specific features" to the alternative recommendations.

3. **He wants ongoing monitoring, not a one-time audit** — David said he'd pay $5/month for a service that watches AI tool pricing and emails him when something changes. This validated the "pricing change alerts" feature planned for Week 2.

### Changes Made Based on This Interview

- Added the "unless you rely heavily on [tool]-specific features" qualifier to alternative tool recommendations
- The alternative tool check only triggers when plan-based savings are < $50 (avoiding unnecessary disruption for small savings)
- Added "We'll notify you when new savings opportunities appear as pricing changes" to the optimal-stack message — planting the seed for the monitoring feature
- Made the monthly savings display prominent for small amounts too (David cares about $20/month, which is $240/year)

---

## Synthesis

| Insight                          | AJ (3-dev) | Maria (20-person) | David (Solo) | Product Change                 |
| -------------------------------- | ---------- | ----------------- | ------------ | ------------------------------ |
| Ghost seats waste money          | Yes        | Yes               | N/A          | Seat over-provisioning check   |
| Trust requires "you're fine"     | Critical   | Nice-to-have      | Nice-to-have | `isOptimal` badge              |
| Need shareable results           | Low        | Critical          | Medium       | Share URL + email report       |
| Consolidation > optimization     | Medium     | High              | Critical     | Alternative tool suggestions   |
| Workflow disruption is a cost    | High       | Medium            | Critical     | Qualifiers on recommendations  |
| Want ongoing monitoring          | Medium     | High              | Critical     | Planned: pricing alerts        |
| Buyer ≠ User                     | No         | Yes               | No           | Professional email template    |

The biggest meta-insight: **the tool needs to respect the user's intelligence**. None of these people want to be "sold" — they want data they can act on. The audit engine's design (showing the math, explaining the reasoning, and acknowledging when the current setup is already good) directly reflects this feedback.
