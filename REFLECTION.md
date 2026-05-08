# Reflection — AI Spend Audit

Five questions answered honestly at the end of the build week.

---

## 1. Hardest Bug and How I Solved It

The hardest bug was a silent data corruption issue in the audit engine's seat over-provisioning logic. Here's what happened:

**The bug:** When `seats` was a number like 7 and the current plan was "hobby" or "free," the over-provisioning check was still firing because I had the condition ordered wrong. The check `seats > 5 && plan !== 'hobby' && plan !== 'free'` would correctly skip free plans, but earlier in the function, the plan suitability check had already modified `optimizedSpend` by setting it to the recommended plan's price. This meant the over-provisioning check was calculating savings against the *already-optimized* spend rather than the original spend, causing the savings to be double-counted in some cases.

**How I caught it:** I wrote a test case for a 7-person team on Cursor Hobby plan. The expected monthly savings should have been $140 (switch to Pro at $20 × 7 = $140, since Hobby is $0). But the test showed $168 in savings — the seat over-provisioning was also triggering and suggesting reducing seats from 7 to 6, then calculating savings on top of the plan change.

**The fix:** I restructured the logic so that the seat over-provisioning check only fires when `savings === 0` (meaning no plan change was recommended). This prevents double-counting entirely. If a plan change already saves the user money, that's the primary recommendation. Seat optimization is a secondary recommendation that only appears when the current plan is already appropriate.

**The lesson:** Financial calculation bugs are insidious because they produce *plausible-looking* wrong answers. Every monetary calculation needs a test case with a hand-computed expected value.

---

## 2. A Decision I Reversed and Why

**Original decision:** I initially built the audit engine to always recommend the absolute cheapest option for every tool. If someone was on Cursor Pro, the engine would suggest switching to Copilot Individual at $10, even if the user was a power user who relied on Cursor's codebase-wide context features.

**Why I reversed it:** After the first user interview with AJ (CTO of a 3-dev startup), he said: "If you told me to switch from Cursor to Copilot, I'd close the tab. Cursor's context awareness is the whole reason I pay for it. I'd trust a tool that respects my tool choices more." This was a gut-punch moment. The cheapest option isn't always the right option, and recommending it undermines credibility.

**The new approach:** I implemented the three-tier recommendation system:
1. **Plan suitability** — Is the user on the right *tier* for their team size? (Respects their tool choice.)
2. **Alternative tools** — Only suggested when plan changes alone save < $50 and the user's use case maps to a genuinely comparable alternative.
3. **Seat optimization** — Only when the first two checks find no savings, and the team has >5 seats on a paid plan.

This produces recommendations that users actually trust and act on. The "keep current plan" outcome (when the stack is already optimal) is now a feature, not a failure — it builds trust for when the engine does find real savings.

---

## 3. What I'd Build in Week 2

If I had a second week, here's what I'd prioritize, in order:

1. **Team-level audit via SSO integration** — Let users connect their GitHub org or Google Workspace to auto-detect which AI tools their team is actually using and how many seats are active. This eliminates the manual form entirely and makes the audit 10x faster. It also solves the ghost-seat problem with real data instead of heuristics.

2. **Pricing change alerts** — A "monitor my stack" feature where users opt in to email notifications when an AI tool in their stack changes pricing. This transforms a one-time utility into a recurring touchpoint and gives us a reason to email leads again (with their permission).

3. **Competitive benchmarking** — Show users how their AI spend compares to similar companies. "Teams of your size typically spend $X on AI tools" is a powerful framing that drives upgrades for under-spending teams and validates cost-cutting for over-spending teams.

4. **Enterprise discount brokerage** — For teams spending > $2,000/month, offer a concierge service that negotiates enterprise discounts directly with vendors. This is the monetization path: we take a percentage of the first-year savings as a finder's fee.

5. **More tools** — Add Replit, v0, Devin, Bolt, Lovable, and other emerging AI dev tools. The pricing landscape is changing monthly; being the most comprehensive audit tool is a defensible moat.

---

## 4. How I Used AI Tools and Where I Caught Mistakes

I used AI tools (Cursor, ChatGPT, and the z-ai-web-dev-sdk) extensively throughout the build. Here's the honest breakdown:

**Where AI helped most:**
- **Boilerplate generation** — The shadcn/ui component scaffolding, the Prisma schema, and the API route structure were all drafted with AI assistance. This saved probably 4-5 hours across the week.
- **Debugging error messages** — When Next.js 16's `params` as Promise caused TypeScript errors, I pasted the error into ChatGPT and got the correct `await params` pattern immediately.
- **Email template HTML** — AI generated the inline-styled email template in one shot. Writing cross-client-compatible HTML by hand is miserable; AI made it a 2-minute task.

**Where AI made mistakes I caught:**
- **The audit engine logic** — AI initially suggested I use a simple "sort by price" approach for recommendations. This ignored use-case context entirely. I caught this because I'd already done user interviews and knew that tool-switching recommendations need to respect the user's primary use case.
- **Zod vs. manual validation** — ChatGPT suggested using Zod for API route validation. I started down that path but realized it added a dependency and complexity for what amounts to 4 simple type checks. I reverted to manual TypeScript type guards. Simpler, faster, no extra import.
- **The LLM prompt** — The first version of the summary prompt produced markdown-formatted output (`**bold**`, `# headers`) that looked terrible in both the UI card and the email. I had to add "Do not use markdown formatting" explicitly to the prompt. AI didn't anticipate this rendering context.

**The meta-lesson:** AI is great at generating *structure* and *syntax*, but it lacks *context* about your specific users and business model. Every AI-generated recommendation needs to pass through the filter of "does this make sense for my specific user?" before it goes into the codebase.

---

## 5. Self-Rating

| Dimension        | Score (1-10) | Reasoning                                                                                                                                              |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discipline       | 7            | I shipped in 7 days, which is good. But I spent too long on Day 2 perfecting the audit engine rules instead of getting a v1 out and iterating. I also procrastinated on writing tests until Day 3 instead of TDD-ing from the start. |
| Code quality     | 8            | The type system is solid, the API routes have proper error handling, and the fallback pattern for LLM calls is robust. The main weakness is the `require()` call in SpendForm.tsx — it works but it's not clean. I'd refactor that to use a proper React context or state management in Week 2. |
| Design sense     | 7            | The emerald accent color, the progress bar animation, and the three-card savings layout work well. But I'm not a designer — the hero section could be more compelling, and I should have added an illustration or screenshot. The "Free · No Login Required" badge is good trust-building. |
| Problem-solving  | 9            | The three-tier recommendation system, the double-counting bug fix, the fallback summary pattern, and the honeypot anti-bot approach were all creative solutions to real problems. The biggest win was reversing the "always cheapest" decision after user feedback — that's good product thinking, not just coding. |
| Entrepreneurial  | 8            | The lead-gen model (free audit → email capture → high-savings consultation CTA) is a proven pattern that I adapted well. The unit economics work at $600 lead value with ~$5 CAC. The gap is in distribution — I have a plan for the first 100 users but haven't validated it yet. Week 2 is about testing whether X DMs actually convert. |

**Overall average: 7.8/10**

The honest assessment: I'm a better problem-solver and builder than I am a disciplined executor or designer. The things I'd improve most are (1) shipping faster by accepting "good enough" earlier, and (2) investing more in visual design and copywriting, which are force multipliers for a consumer-facing product.
