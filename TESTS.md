# Testing Documentation — AI Spend Audit

---

## Test Strategy

AI Spend Audit uses a **layered testing approach** focused on the audit engine (the core business logic) and the API routes (the integration points). The UI components are tested manually because they are thin presentation layers with minimal logic.

### Testing Pyramid

```
        ┌─────────┐
        │  E2E    │  ← Manual testing of full user flow
        │  (few)  │
        ├─────────┤
        │Integration│ ← API route tests with real database
        │  (some)  │
        ├─────────┤
        │  Unit    │ ← Audit engine logic tests (most coverage)
        │  (many)  │
        └─────────┘
```

### What We Test

| Layer           | What                                          | How                        |
| --------------- | --------------------------------------------- | -------------------------- |
| Unit            | Audit engine calculations, recommendation rules | Vitest/Bun test runner     |
| Integration     | API routes with database, LLM fallback        | Supertest-style HTTP tests |
| E2E (manual)    | Full form → audit → results → email → share   | Browser testing            |

### What We Don't Test

- **shadcn/ui components** — These are well-tested by the shadcn team
- **CSS/styling** — Visual regression testing is overkill for this project
- **Third-party APIs** — Resend and z-ai-web-dev-sdk are tested via their own suites; we test our fallback behavior instead

---

## Test Environment Setup

### Prerequisites

- Bun runtime (v1.3+)
- Node.js 20+ (for compatibility)

### Running Tests

```bash
# Run all unit tests
bun test

# Run tests in watch mode during development
bun test --watch

# Run a specific test file
bun test src/lib/__tests__/auditEngine.test.ts

# Run with verbose output
bun test --verbose
```

### Test Database

Tests use the same SQLite database as development. The `SharedAudit` and `Lead` tables are created via `prisma db push`. For integration tests, we use a separate test database file to avoid polluting development data:

```bash
DATABASE_URL="file:./test.db" bun test
```

---

## Test Cases

### Test 1: Single Tool — Plan Downgrade Saves Money

**Description:** A team of 2 developers on Cursor Business ($40/user) should be recommended to switch to Cursor Pro ($20/user), saving $40/month.

**Input:**
```json
{
  "tools": [
    {
      "name": "cursor",
      "plan": "business",
      "monthlySpend": 80,
      "seats": 2,
      "useCase": "coding"
    }
  ],
  "primaryUseCase": "coding"
}
```

**Expected Output:**
- `totalMonthlySavings`: 40
- `totalAnnualSavings`: 480
- `recommendations[0].recommendedAction`: "Switch to pro plan"
- `recommendations[0].monthlySavings`: 40
- `isHighSavings`: false
- `isOptimal`: false

**Why this test matters:** This is the most common savings scenario — small teams on overpowered plans. It validates the `getRecommendedPlan()` function for the Cursor-specific rule.

---

### Test 2: Multi-Tool Stack — Multiple Savings Found

**Description:** A team using multiple AI tools with at least two optimization opportunities should have aggregated savings across all tools.

**Input:**
```json
{
  "tools": [
    {
      "name": "copilot",
      "plan": "enterprise",
      "monthlySpend": 390,
      "seats": 10,
      "useCase": "coding"
    },
    {
      "name": "chatgpt",
      "plan": "team",
      "monthlySpend": 25,
      "seats": 1,
      "useCase": "writing"
    }
  ],
  "primaryUseCase": "mixed"
}
```

**Expected Output:**
- `totalMonthlyCurrent`: 415
- `totalMonthlySavings`: 200 (Copilot: $190 savings from Enterprise→Business at 10 seats, ChatGPT: $10 savings from Team→Plus for 1 seat)
- `totalAnnualSavings`: 2400
- `isHighSavings`: false (200 < 500)
- `isOptimal`: false (200 > 100)
- `recommendations` should have 2 entries, one for each tool

**Why this test matters:** Multi-tool stacks are the primary use case. This test validates that savings are correctly aggregated and each tool gets its own recommendation.

---

### Test 3: Already Optimized Stack — Zero Savings

**Description:** A solo developer on GitHub Copilot Individual ($10/month) with a coding use case should have zero savings — they're already on the cheapest appropriate plan.

**Input:**
```json
{
  "tools": [
    {
      "name": "copilot",
      "plan": "individual",
      "monthlySpend": 10,
      "seats": 1,
      "useCase": "coding"
    }
  ],
  "primaryUseCase": "coding"
}
```

**Expected Output:**
- `totalMonthlySavings`: 0
- `totalAnnualSavings`: 0
- `totalMonthlyCurrent`: 10
- `totalMonthlyOptimized`: 10
- `isOptimal`: true
- `isHighSavings`: false
- `recommendations[0].recommendedAction`: "Keep current plan"
- `recommendations[0].monthlySavings`: 0

**Why this test matters:** The "already optimized" outcome is critical for building trust. If the engine always finds fake savings, users will stop believing it. This test ensures we can correctly identify an optimal stack.

---

### Test 4: Seat Over-Provisioning — Large Team on Paid Plan

**Description:** A team of 10 on Claude Pro ($20/user, $200/month total) should be flagged for potential seat over-provisioning, since the heuristic suggests 8 seats might suffice.

**Input:**
```json
{
  "tools": [
    {
      "name": "claude",
      "plan": "pro",
      "monthlySpend": 200,
      "seats": 10,
      "useCase": "mixed"
    }
  ],
  "primaryUseCase": "mixed"
}
```

**Expected Output:**
- `totalMonthlySavings`: 40 (2 seats × $20 each)
- `recommendations[0].recommendedAction`: "Reduce seats from 10 to ~8"
- `recommendations[0].monthlySavings`: 40
- `isOptimal`: false (savings > 0 but < 100)

**Why this test matters:** Ghost seats are a real problem identified in user interviews. This test validates the seat over-provisioning heuristic (80% of current seats for teams >5).

---

### Test 5: High Savings Flag — Large Team with Enterprise Plan

**Description:** A 20-person team on Copilot Enterprise ($39/user = $780/month) where the plan suitability check recommends Business ($19/user = $380/month), saving $400/month. Combined with another tool savings, total exceeds $500/month.

**Input:**
```json
{
  "tools": [
    {
      "name": "copilot",
      "plan": "enterprise",
      "monthlySpend": 780,
      "seats": 20,
      "useCase": "coding"
    },
    {
      "name": "chatgpt",
      "plan": "team",
      "monthlySpend": 50,
      "seats": 2,
      "useCase": "writing"
    }
  ],
  "primaryUseCase": "coding"
}
```

**Expected Output:**
- `totalMonthlySavings`: 430 (Copilot: $400 from Enterprise→Business, ChatGPT: $10 from Team→Plus for 2 seats → only 1 seat would benefit, saving $10)
- Wait — let me recalculate. ChatGPT Team is $25/user, Plus is $20/user. For 2 seats: current = $50, optimized = $40. Savings = $10. Total = $400 + $10 = $410.
- Actually, ChatGPT Team→Plus recommendation only triggers for 1 seat. For 2 seats, the `getRecommendedPlan` function checks `seats === 1`. So ChatGPT Team stays at $50 for 2 seats. Total savings = $400.
- `isHighSavings`: false ($400 < $500)
- `isOptimal`: false

Hmm, to trigger `isHighSavings`, I need a case where total savings > $500. Let me adjust:

**Revised Input:**
```json
{
  "tools": [
    {
      "name": "copilot",
      "plan": "enterprise",
      "monthlySpend": 780,
      "seats": 20,
      "useCase": "coding"
    },
    {
      "name": "cursor",
      "plan": "business",
      "monthlySpend": 200,
      "seats": 5,
      "useCase": "coding"
    }
  ],
  "primaryUseCase": "coding"
}
```

**Expected Output:**
- `totalMonthlyCurrent`: 980
- Copilot savings: 20 × ($39 - $19) = $400/month
- Cursor savings: 5 × ($40 - $20) = $100/month (Business→Pro for teams ≤2... wait, 5 seats won't trigger that rule. Cursor Business→Pro only triggers for seats ≤2.)
- Actually, for 5 seats on Cursor Business, `getRecommendedPlan` returns null (5 > 2). But the alternative tool check might fire. Coding use case → cheaper alternative is Copilot at $10/user. 5 × $10 = $50 vs 5 × $40 = $200. Savings = $150. But the condition is `savings < 50 && monthlySpend > 30`. Current savings from plan check = 0, which is < 50, and monthlySpend = 200 > 30, so alternative check fires. Copilot at $10 × 5 = $50. Savings = 200 - 50 = $150.
- Total savings: $400 + $150 = $550/month
- `isHighSavings`: true ($550 > $500)
- `totalAnnualSavings`: 6600

**Why this test matters:** The `isHighSavings` flag triggers the consultation CTA in the email and the "High Impact" badge in the UI. It's the primary monetization trigger, so it must be accurate.

---

## API Route Tests

### Test 6: Audit API — Invalid Input

**Request:**
```json
POST /api/audit
{ "tools": [] }
```

**Expected Response:**
- Status: 400
- Body: `{ "error": "Please provide at least one tool." }`

### Test 7: Capture API — Honeypot Triggered

**Request:**
```json
POST /api/capture
{ "email": "test@test.com", "website": "http://spam.com" }
```

**Expected Response:**
- Status: 400
- Body: `{ "error": "Bot detected" }`

### Test 8: LLM Summary API — Missing Data

**Request:**
```json
POST /api/llm-summary
{}
```

**Expected Response:**
- Status: 400
- Body: `{ "error": "Audit data is required." }`

---

## Continuous Testing

Tests are run automatically:
- Before every commit (via `pre-commit` hook, if configured)
- On every push (if CI is set up)
- Before every deployment (`bun test && bun run build`)

The test suite should complete in under 10 seconds. If it takes longer, investigate slow database queries or network-dependent tests that should be mocked.
