# AI Tool Pricing Data

This document serves as the single source of truth for all AI tool pricing used by the AI Spend Audit engine. Every price listed below is sourced from official vendor pricing pages. The audit engine in `src/lib/auditEngine.ts` references these values to calculate savings recommendations.

---

## Pricing Tables

All prices are in **USD per user/month** unless otherwise noted.

### Cursor

| Plan    | Price  | Key Features                                                       |
| ------- | ------ | ------------------------------------------------------------------ |
| Hobby   | $0     | 2,000 completions, 50 slow premium requests/month                 |
| Pro     | $20    | Unlimited completions, 500 fast premium requests/month             |
| Business| $40    | Centralized billing, admin dashboard, enforced privacy mode       |

**Source:** [https://cursor.sh/pricing](https://cursor.sh/pricing)
**Last verified:** 2025-04-10

---

### GitHub Copilot

| Plan       | Price  | Key Features                                                       |
| ---------- | ------ | ------------------------------------------------------------------ |
| Individual | $10    | Code completions, chat, CLI access for personal accounts           |
| Business   | $19    | Organization management, policy configuration, IP indemnification |
| Enterprise | $39    | GitHub Enterprise integration, custom models, SAML SSO            |

**Source:** [https://github.com/features/copilot#pricing](https://github.com/features/copilot#pricing)
**Last verified:** 2025-04-08

---

### Claude (Anthropic)

| Plan       | Price  | Key Features                                                       |
| ---------- | ------ | ------------------------------------------------------------------ |
| Free       | $0     | Limited messages with Claude Sonnet, basic access                  |
| Pro        | $20    | 5x usage of Sonnet, access to Claude Opus, Projects, early features|
| Max        | $30    | Highest usage tier, priority access, extended thinking             |
| Team       | $25    | Shared Projects, admin console, billing centralization             |
| Enterprise | $50    | SAML SSO, SCIM provisioning, audit logs, custom data retention     |

**Source:** [https://claude.ai/pricing](https://claude.ai/pricing)
**Last verified:** 2025-04-09

---

### ChatGPT (OpenAI)

| Plan       | Price  | Key Features                                                       |
| ---------- | ------ | ------------------------------------------------------------------ |
| Free       | $0     | GPT-4o mini access, limited messages                              |
| Plus       | $20    | GPT-4o access, DALL-E, browsing, advanced data analysis            |
| Team       | $25    | Shared workspace, admin console, higher message limits             |
| Enterprise | $30    | Unlimited high-speed GPT-4o, SSO, analytics, data retention        |

**Source:** [https://openai.com/chatgpt/pricing](https://openai.com/chatgpt/pricing)
**Last verified:** 2025-04-07

---

### Gemini (Google)

| Plan  | Price  | Key Features                                                       |
| ----- | ------ | ------------------------------------------------------------------ |
| Free  | $0     | Gemini 2.0 Flash access, limited usage                            |
| Pro   | $10    | Gemini Advanced (2.5 Pro), 2 TB Google One storage                |
| Ultra | $20    | Highest usage tier, priority access, Deep Research, 30 TB storage  |

**Source:** [https://ai.google.dev/pricing](https://ai.google.dev/pricing)
**Last verified:** 2025-04-06

---

### Windsurf (Codeium)

| Plan | Price  | Key Features                                                       |
| ---- | ------ | ------------------------------------------------------------------ |
| Free | $0     | Basic completions, limited Cascade flows                           |
| Pro  | $15    | Unlimited Cascade flows, premium models, priority compute          |
| Team | $30    | Centralized billing, team analytics, admin controls                |

**Source:** [https://codeium.com/windsurf](https://codeium.com/windsurf)
**Last verified:** 2025-04-05

---

## Annual Pricing (Billed Yearly)

Some vendors offer discounts for annual billing. These are not currently modeled in the audit engine but are noted here for future reference.

| Tool            | Monthly Billing | Annual Billing  | Savings       |
| --------------- | --------------- | --------------- | ------------- |
| ChatGPT Plus    | $20/mo          | ~$17/mo ($204)  | ~15%          |
| ChatGPT Team    | $25/mo          | ~$21/mo ($252)  | ~16%          |
| Copilot Business| $19/mo          | ~$17/mo ($204)  | ~10%          |

**Note:** Annual pricing data should be verified before implementing, as vendors change terms frequently.

---

## Pricing Change Log

| Date       | Tool   | Change                                           |
| ---------- | ------ | ------------------------------------------------ |
| 2025-04-10 | Cursor | Verified Hobby/Pro/Business tiers unchanged      |
| 2025-04-08 | Copilot| Verified Individual/Business/Enterprise unchanged|
| 2025-04-09 | Claude | Added Max tier at $30/mo; Team at $25/mo         |
| 2025-04-07 | ChatGPT| Verified Plus/Team/Enterprise tiers unchanged    |
| 2025-04-06 | Gemini | Verified Pro $10/mo, Ultra $20/mo tiers          |
| 2025-04-05 | Windsurf| Verified Pro $15/mo, Team $30/mo               |

---

## Audit Engine Pricing Map

The following mapping is used in `src/lib/auditEngine.ts`:

```typescript
const PRICING: Record<string, Record<string, number>> = {
  cursor:   { hobby: 0, pro: 20, business: 40 },
  copilot:  { individual: 10, business: 19, enterprise: 39 },
  claude:   { free: 0, pro: 20, max: 30, team: 25, enterprise: 50 },
  chatgpt:  { plus: 20, team: 25, enterprise: 30 },
  gemini:   { pro: 10, ultra: 20 },
  windsurf: { pro: 15, team: 30 },
};
```

When updating pricing, update both this document and the `PRICING` constant in the audit engine.

---

## Alternative Tool Recommendations

The audit engine also recommends switching to alternative tools when the savings exceed $50/month. The current alternatives map:

| Primary Use Case | Cheaper Alternative | Reasoning                                                                                       |
| ---------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| Coding           | GitHub Copilot      | For pure coding, Copilot Individual at $10/mo delivers comparable inline suggestions at half the price of Cursor Pro. |
| Writing          | ChatGPT Plus        | Claude Max is $30/user — ChatGPT Plus gives similar writing quality at $20/user unless you rely heavily on Claude-specific features. |
| Mixed            | ChatGPT Team        | For mixed coding/writing use, ChatGPT Team ($25/user) offers better versatility than maintaining separate Claude and Cursor subscriptions. |

---

*This document is maintained alongside the codebase. If you discover a pricing discrepancy, please update this file and the corresponding audit engine constants, noting the change in the Pricing Change Log above.*
