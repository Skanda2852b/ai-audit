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
│  │  save result) │  │(LLM summary   │  │  send email)     │     │
│  └───────┬───────┘  │with fallback) │  └────────┬─────────┘     │
│          │          └───────┬───────┘           │                │
└──────────┼──────────────────┼───────────────────┼────────────────┘
           │                  │                   │
           ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                       LIBRARY LAYER                              │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐     │
│  │ auditEngine   │  │ llm.ts        │  │ email.ts         │     │
│  │ (pricing +    │  │(z-ai-web-dev- │  │(Resend API +     │     │
│  │  rules +      │  │ sdk + fallback│  │ lead capture +   │     │
│  │  calculate)   │  │ template)     │  │ DB write)        │     │
│  └───────────────┘  └───────────────┘  └──────────────────┘     │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐                           │
│  │ db.ts         │  │ utils.ts      │                           │
│  │(Prisma client │  │(cn + helpers) │                           │
│  │ singleton)    │  │               │                           │
│  └───────┬───────┘  └───────────────┘                           │
└──────────┼───────────────────────────────────────────────────────┘
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
| POST   | `/api/capture`     | Capture lead email, send report                   | `{ email, company?, role?, teamSize?, auditId?, monthlySavings?, shareableUrl?, website? }` | `{ success: boolean }` |
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
