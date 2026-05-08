# Architecture — AI Spend Audit

---

## Tech Stack

| Layer           | Technology                  | Why                                               |
| --------------- | --------------------------- | ------------------------------------------------- |
| Framework       | Next.js 16 (App Router)     | SSG/SSR, API routes, React Server Components      |
| Language        | TypeScript 5                | Type safety across the full stack                  |
| Styling         | Tailwind CSS 4 + shadcn/ui  | Utility-first CSS with pre-built accessible components |
| Database        | SQLite via Prisma ORM       | Zero-config, file-based, perfect for solo projects |
| Email           | Resend API                  | Simple REST API, good deliverability               |
| LLM             | z-ai-web-dev-sdk            | Chat completions for audit summaries               |
| State           | React useState + localStorage| Minimal client state, no global state library needed|
| Forms           | react-hook-form + Radix UI  | Accessible form primitives                         |
| Runtime         | Bun                         | Fast install, fast test, fast start                |
| Deployment      | Standalone Next.js + Caddy  | Minimal footprint, HTTPS via Caddy reverse proxy   |

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                          │
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │SpendForm │───▶│ page.tsx     │───▶│ AuditResults         │   │
│  │(input)   │    │ (orchestrator)│    │ (display + actions)  │   │
│  └──────────┘    └──────┬───────┘    └──────┬───────────────┘   │
│                         │                    │                    │
│                   POST /api/audit     POST /api/llm-summary      │
│                         │                    │                    │
│                         │            ┌───────▼────────┐         │
│                         │            │EmailCaptureModal│         │
│                         │            │ShareButtons     │         │
│                         │            └───────┬────────┘         │
│                         │                    │                    │
│                         │            POST /api/capture           │
└─────────────────────────┼────────────────────┼───────────────────┘
                          │                    │
                          ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                          │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐     │
│  │ /api/audit    │  │/api/llm-      │  │ /api/capture     │     │
│  │ (runAudit +   │  │ summary       │  │ (lead capture +  │     │
│  │  save result) │  │(LLM summary   │  │  send email +    │     │
│  │               │  │with fallback) │  │  honeypot check) │     │
│  └───────┬───────┘  └───────┬───────┘  └────────┬─────────┘     │
│          │                  │                    │                │
└──────────┼──────────────────┼────────────────────┼───────────────┘
           │                  │                    │
           ▼                  ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                       LIBRARY LAYER                              │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐     │
│  │ auditEngine   │  │ llm.ts        │  │ email.ts         │     │
│  │ (pricing +    │  │(z-ai-web-dev- │  │(Resend API +     │     │
│  │  rules +      │  │ sdk + fallback│  │ lead capture +   │     │
│  │  calculate +  │  │ template)     │  │ DB write)        │     │
│  │  Credex)      │  │               │  │                  │     │
│  └───────────────┘  └───────────────┘  └──────────────────┘     │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐                           │
│  │ db.ts         │  │ utils.ts      │                           │
│  │(Prisma client │  │(cn + helpers) │                           │
│  │ singleton)    │  │               │                           │
│  └───────┬───────┘  └───────────────┘                           │
└──────────┼──────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│                                                                  │
│  ┌────────────────────────┐  ┌──────────────────────────────┐   │
│  │ shared_audits          │  │ leads                        │   │
│  │ ├─ id (PK, cuid)       │  │ ├─ id (PK, cuid)             │   │
│  │ ├─ auditData (JSON)    │  │ ├─ email                     │   │
│  │ ├─ toolsSummary (JSON) │  │ ├─ company?                  │   │
│  │ ├─ use_case            │  │ ├─ role?                     │   │
│  │ └─ created_at          │  │ ├─ team_size?                │   │
│  └────────────────────────┘  │ ├─ audit_id? (FK)            │   │
│                               │ ├─ monthly_savings?          │   │
│                               │ └─ created_at                │   │
│                               └──────────────────────────────┘   │
│                                                                  │
│              SQLite (file: db/custom.db)                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Anti-Abuse: Honeypot Approach

The `/api/capture` endpoint uses a **honeypot field** to filter bot submissions rather than rate limiting or CAPTCHAs. A hidden input field (`website`) is included in the `EmailCaptureModal` form. Real users never see or fill this field, but automated bots typically populate all form fields. If the honeypot field contains any value, the submission is silently rejected (returning a 200 response so bots don't detect the trap).

**Why honeypot over alternatives:**

| Approach         | Pros                                    | Cons                                          |
| ---------------- | --------------------------------------- | --------------------------------------------- |
| Honeypot (chosen)| No external service, invisible to users, zero latency, blocks common bots | Doesn't stop targeted attacks, can be bypassed by sophisticated scrapers |
| Rate limiting    | Throttles all traffic fairly            | Requires Redis/Vercel KV, adds latency, can block legit users |
| CAPTCHA          | Strong bot protection                   | Hurts conversion, accessibility issues, requires third-party service |
| Turnstile        | Better UX than CAPTCHA                  | Still requires Cloudflare dependency           |

The honeypot approach is the right fit for this project: it needs no external infrastructure, adds zero friction to the user experience, and effectively blocks the most common automated submissions. If targeted abuse becomes a problem, we can layer on Turnstile without removing the honeypot.

---

## Database Schema

```prisma
model SharedAudit {
  id           String   @id @default(cuid())
  auditData    String   // JSON string of AuditResult
  toolsSummary String   // JSON string of tools summary
  useCase      String   @map("use_case")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("shared_audits")
}

model Lead {
  id             String   @id @default(cuid())
  email          String
  company        String?
  role           String?
  teamSize       Int?     @map("team_size")
  auditId        String?  @map("audit_id")
  monthlySavings Float?   @map("monthly_savings")
  createdAt      DateTime @default(now()) @map("created_at")

  @@map("leads")
}
```

### Design Decisions

- **`auditData` as JSON string** — The audit result structure (`AuditResult`) is complex and varies per audit. Rather than normalizing into multiple tables, we store the full result as JSON. This is a deliberate denormalization for simplicity. The trade-off: you can't easily query across audits (e.g., "average savings per tool"), but for a lead-gen tool, the primary query pattern is "load one audit by ID," which is fast.

- **`toolsSummary` as separate JSON** — This stores just the tool names, plans, and seats (no PII, no spending data). It's used for analytics without exposing sensitive data.

- **No foreign key from Lead to SharedAudit** — The `auditId` field is optional and not enforced as a FK constraint. This is intentional: leads can exist without audits (if they sign up from a shared result page), and audits can exist without leads (most users don't capture their email).

- **SQLite, not Postgres** — SQLite is file-based, zero-config, and handles the expected load (tens of audits per day, not thousands). If we ever need concurrent writes at scale, we can swap to Postgres by changing the `DATABASE_URL` and running `prisma migrate`.

---

## API Endpoints

| Method | Path               | Purpose                                           | Request Body                           | Response                                        |
| ------ | ------------------ | ------------------------------------------------- | -------------------------------------- | ----------------------------------------------- |
| POST   | `/api/audit`       | Run the audit engine, save result, return savings | `ToolInput` (tools + primaryUseCase)   | `AuditResult` + `shareableId` + `shareableUrl`  |
| POST   | `/api/llm-summary` | Generate AI summary for audit results             | `{ auditData: AuditResult }`           | `{ summary: string }`                           |
| POST   | `/api/capture`     | Capture lead email, send report (honeypot-gated)  | `{ email, company?, role?, teamSize?, auditId?, monthlySavings?, shareableUrl?, website? }` | `{ success: boolean }` |
| GET    | `/api/route.ts`    | Health check                                      | —                                      | —                                               |

### Error Handling Pattern

All API routes follow the same pattern:

```typescript
try {
  // Validate input
  // Execute business logic
  // Return success
} catch (error) {
  console.error('API error:', error);
  return NextResponse.json(
    { error: 'Internal server error.' },
    { status: 500 }
  );
}
```

Input validation errors return `400` with a descriptive message. Business logic failures (e.g., database write fails) return `500` with a generic message (no internal details leaked).

---

## Component Hierarchy

```
app/layout.tsx (root layout)
└── app/page.tsx (home page — form + results orchestrator)
    ├── SpendForm (dynamic tool rows)
    │   ├── Card (per tool)
    │   │   ├── Select (tool name)
    │   │   ├── Select (plan)
    │   │   ├── Select (use case)
    │   │   ├── Input (seats)
    │   │   └── Input (monthly spend)
    │   ├── Card (primary use case)
    │   └── Button (add tool + run audit)
    │
    ├── AuditResults (savings display)
    │   ├── Card (monthly savings)
    │   ├── Card (annual savings)
    │   ├── Card (optimized spend)
    │   ├── Card (current vs optimized bar)
    │   ├── Card (AI summary)
    │   ├── Card (detailed recommendations)
    │   ├── Card (Credex savings — shown for eligible users)
    │   ├── ShareButtons
    │   │   ├── Button (copy link)
    │   │   ├── Button (Twitter)
    │   │   └── Button (LinkedIn)
    │   └── EmailCaptureModal
    │       ├── Input (email)
    │       ├── Input (company)
    │       ├── Input (role)
    │       ├── Input (team size)
    │       ├── Input (honeypot - hidden)
    │       └── Button (submit)
    │
    └── app/result/[id]/page.tsx (shared result)
        └── AuditResults (same component, isShareable=true)

Shared UI Components (shadcn/ui):
  Button, Card, Input, Label, Select, Badge, Separator
```

### Component Communication

```
page.tsx (manages auditResult state)
  │
  ├── SpendForm ──onSubmit──▶ page.tsx ──POST /api/audit──▶ AuditResults
  │
  └── AuditResults ──POST /api/llm-summary──▶ (loads AI summary)
                  ──POST /api/capture──▶ (opens EmailCaptureModal)
                  ──ShareButtons──▶ (copy/share actions)
```

The `page.tsx` component is the single state container. It holds:
- `auditResult: AuditResult | null` — null before audit, populated after
- `loading: boolean` — true during API call

No global state library (Redux, Zustand) is needed. The state is simple and localized to one page.

---

## Current Component State

### Supported Tools (8)

The audit engine currently covers 8 AI tools with their full plan hierarchies:

| Tool            | Plans                                                        |
| --------------- | ------------------------------------------------------------ |
| Cursor          | Hobby, Pro, Business, Enterprise                             |
| GitHub Copilot  | Individual, Business, Enterprise                             |
| Claude          | Free, Pro, Max, Team, Enterprise, API Direct                 |
| ChatGPT         | Free, Plus, Team, Enterprise, API Direct                     |
| Anthropic API   | Pay-as-you-go                                                |
| OpenAI API      | Pay-as-you-go                                                |
| Gemini          | Free, Pro, Ultra, API                                        |
| Windsurf        | Free, Pro, Team                                              |

### Credex Integration

The audit engine surfaces Credex credits recommendations for eligible users:
- API Direct users spending >$100/month
- Enterprise plan users spending >$200/month
- Credex offers 10–20% below retail on AI credits

### Notify Mode

When `RESEND_API_KEY` is not set, the email system operates in **notify mode** — emails are logged to the server console instead of being sent. This ensures the full flow works in development without requiring email infrastructure.

---

## Trade-offs Made

### 1. SQLite over PostgreSQL

**Decision:** Use SQLite for the database.
**Pro:** Zero configuration, no separate database server, file-based backups, fast for read-heavy workloads.
**Con:** No concurrent write scaling, no advanced queries across JSON fields, no built-in replication.
**When to revisit:** If we exceed 100 concurrent writes/second or need cross-audit analytics, migrate to PostgreSQL.

### 2. Hardcoded Pricing over Admin Panel

**Decision:** AI tool pricing is hardcoded in `auditEngine.ts` rather than stored in the database with an admin UI.
**Pro:** Simpler code, no admin panel to build, pricing changes are version-controlled in Git.
**Con:** Every pricing update requires a code deployment.
**When to revisit:** If we add 20+ tools or need non-technical people to update pricing, build an admin panel with a `Pricing` database table.

### 3. JSON Storage over Normalized Tables

**Decision:** Store `AuditResult` as a JSON string in `SharedAudit.auditData`.
**Pro:** Simple schema, no migration needed when `AuditResult` shape changes, fast single-query loads.
**Con:** Can't easily query across audits (e.g., "average savings per tool per month"), JSON parsing overhead on every read.
**When to revisit:** If we need analytics dashboards, extract key metrics (totalMonthlySavings, tool names) into dedicated columns or a separate analytics table.

### 4. Client-Side Form State over Form Library

**Decision:** Use React `useState` for form state instead of `react-hook-form` (which is installed but not used in SpendForm).
**Pro:** Simpler mental model, direct control over auto-calculation logic, no library-specific patterns to learn.
**Con:** No built-in validation, no dirty state tracking, more boilerplate for the `updateTool` function.
**When to revisit:** If the form grows beyond 6 fields per tool or we need complex validation rules, switch to `react-hook-form`.

### 5. LLM Fallback Pattern over Guaranteed LLM

**Decision:** Every LLM call has a template-based fallback (`getFallbackSummary`).
**Pro:** The tool always works, even if the LLM API is down. Zero-downtime reliability.
**Con:** The fallback summary is less personalized than the LLM version.
**When to revisit:** If the LLM API becomes unreliable (>5% failure rate), investigate alternative providers or pre-generate summaries.

### 6. No Authentication

**Decision:** The tool requires no login or account creation.
**Pro:** Lowest possible friction — the "3 minutes, no login" promise. Higher conversion rates.
**Con:** No way to save audit history per user, no personalized dashboard, no way to re-engage users who don't capture their email.
**When to revisit:** If we build the "pricing alerts" or "AI Spend Dashboard" features, add lightweight auth (magic link or OAuth).

---

## How to Scale to 10k Audits/Day

The current architecture handles tens of audits per day comfortably. Here's the path to 10,000:

### 1. Database: SQLite → PostgreSQL

At ~7 audits/minute sustained, SQLite's single-writer lock becomes a bottleneck. Migrate to PostgreSQL:
- Change `DATABASE_URL` to a Postgres connection string
- Run `prisma migrate` to create the schema
- Use connection pooling (e.g., PgBouncer or Supabase pooler)
- Add indexes on `shared_audits.created_at` and `leads.email`

### 2. Caching: Add Redis

- Cache LLM summaries for identical audit inputs (TTL: 1 hour)
- Cache vendor pricing data (though it's currently hardcoded, a future pricing API would benefit)
- Use Redis for rate limiting if we move beyond honeypot protection

### 3. LLM Summary: Queue-Based Processing

At 10k audits/day, ~7 LLM API calls/minute could hit rate limits:
- Move LLM summary generation to a job queue (BullMQ + Redis)
- Return the audit result immediately; load the AI summary via polling or WebSocket
- Pre-warm summary cache for common tool combinations

### 4. Static Generation for Shared Results

Shared result pages (`/result/[id]`) currently hit the database on every request:
- Use Next.js ISR (Incremental Static Regeneration) with a revalidation period
- Or serve results from a CDN cache with stale-while-revalidate

### 5. Horizontal Scaling

The standalone Next.js server can scale horizontally behind a load balancer:
- Run 2–4 instances behind Caddy or an ALB
- Ensure SQLite is replaced with Postgres before horizontal scaling (multiple servers can't share a SQLite file)
- Use shared state in Redis for any session data

### 6. Monitoring

Add observability before scaling:
- Request logging with structured JSON (Pino)
- APM for API route latency (Sentry or DataDog)
- Alert on: >5% LLM failure rate, >500ms p95 API response time, >1% email send failures
