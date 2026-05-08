# AI Spend Audit

Find hidden savings on your AI tools. A free, instant audit that checks your Cursor, GitHub Copilot, ChatGPT, Claude, Anthropic API, OpenAI API, Gemini, and Windsurf subscriptions against current pricing data and recommends optimizations.

**No login required. Takes 3 minutes.**

---

## What It Does

AI Spend Audit analyzes your team's AI tool stack in three ways:

1. **Plan optimization** — Checks if you're on the right tier for your team size (e.g., Cursor Business for a 2-person team should be Pro)
2. **Alternative tool matching** — Suggests cheaper alternatives based on your use case (e.g., Copilot Individual at $10/mo for pure coding vs. Cursor Pro at $20/mo)
3. **Seat right-sizing** — Flags potential over-provisioning for teams with 5+ paid seats

Every recommendation traces back to official vendor pricing. No guesses, no affiliate bias.

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm (comes with Node.js)
- Git

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd ai-audit

# Install dependencies
npm install

# Set up the database
npm run db:push
npm run db:generate

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env` file in the project root (or set these in your deployment environment):

| Variable                  | Required | Default          | Description                                          |
| ------------------------- | -------- | ---------------- | ---------------------------------------------------- |
| `DATABASE_URL`            | Yes      | `file:./db/custom.db` | SQLite database connection string               |
| `GROQ_API_KEY`            | No       | —                | Groq API key for AI-generated summaries. If not set, a template summary is used instead. Get one free at [console.groq.com](https://console.groq.com). |
| `RESEND_API_KEY`          | No       | —                | Resend API key for sending emails. If not set, emails are logged to console instead. Get one free at [resend.com](https://resend.com). |
| `RESEND_FROM`             | No       | `onboarding@resend.dev` | The sender address shown in outgoing emails. |
| `NEXT_PUBLIC_BASE_URL`    | No       | `""`             | Base URL for generating shareable links (e.g., `https://yourdomain.com`) |

### Example `.env`

```env
DATABASE_URL="file:./db/custom.db"
GROQ_API_KEY="gsk_xxxxxxxxxxxx"
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM="AI Spend Audit <onboarding@resend.dev>"
NEXT_PUBLIC_BASE_URL="https://aispendaudit.com"
```

---

## Running Locally

```bash
# Development server with hot reload
npm run dev

# Lint code
npm run lint

# Build for production
npm run build
```

### Database Commands

```bash
# Push schema changes to the database (development)
npm run db:push

# Generate Prisma client
npm run db:generate

# Create a migration (if switching to Postgres)
npm run db:migrate

# Reset the database
npm run db:reset
```

---

## Deploying

### Production Build

The project uses Next.js standalone output mode for minimal deployment footprint:

```bash
# Build the application
npm run build

# This creates:
# .next/standalone/  - Minimal server bundle
# .next/static/      - Static assets (copied automatically by build script)
# public/            - Public assets (copied automatically by build script)
```

### Running in Production

```bash
NODE_ENV=production node .next/standalone/server.js
```

### Reverse Proxy (Caddy)

The included `Caddyfile` configures HTTPS and reverse proxy:

```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

### Deployment Checklist

1. Set all environment variables on the production server
2. Run `npm run db:push` to create/migrate the database
3. Run `npm run build` to create the production bundle
4. Start the server with `node .next/standalone/server.js`
5. Verify the health check at `/api/route.ts`
6. Test the full flow: form → audit → results → email → share

---

## Project Structure

```
ai-audit/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Home page (form + results)
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles
│   │   ├── api/
│   │   │   ├── route.ts            # Health check endpoint
│   │   │   ├── audit/route.ts      # POST: Run audit, save result
│   │   │   ├── capture/route.ts    # POST: Capture lead, send email
│   │   │   └── llm-summary/route.ts# POST: Generate AI summary
│   │   └── result/
│   │       └── [id]/page.tsx       # Shared audit result page
│   │
│   ├── components/
│   │   ├── SpendForm.tsx           # Dynamic tool input form
│   │   ├── AuditResults.tsx        # Savings display + recommendations
│   │   ├── EmailCaptureModal.tsx   # Lead capture modal
│   │   ├── ShareButtons.tsx        # Copy/Twitter/LinkedIn sharing
│   │   └── ui/                     # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── auditEngine.ts          # Core audit logic + pricing data
│   │   ├── llm.ts                  # Groq AI summary + fallback template
│   │   ├── email.ts                # Email sending via Resend + lead capture
│   │   ├── rateLimit.ts            # In-memory IP-based rate limiter
│   │   ├── db.ts                   # Prisma client singleton
│   │   └── utils.ts                # Utility functions (cn, etc.)
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   │
│   └── hooks/
│       ├── use-toast.ts            # Toast notification hook
│       └── use-mobile.ts           # Mobile detection hook
│
├── prisma/
│   └── schema.prisma               # Database schema
│
├── db/
│   └── custom.db                   # SQLite database file
│
├── public/                         # Static assets
├── ARCHITECTURE.md                 # System architecture documentation
├── PRICING_DATA.md                 # AI tool pricing reference
├── DEVLOG.md                       # Development log
├── REFLECTION.md                   # Post-build reflection
├── GTM.md                          # Go-to-market strategy
├── ECONOMICS.md                    # Unit economics analysis
├── USER_INTERVIEWS.md              # User interview notes
├── LANDING_COPY.md                 # Landing page copy
├── METRICS.md                      # Key metrics documentation
├── PROMPTS.md                      # LLM prompts documentation
├── TESTS.md                        # Testing documentation
└── README.md                       # This file
```

---

## Key Files

| File                            | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `src/lib/auditEngine.ts`        | Core business logic: pricing data, recommendation rules, savings calculations |
| `src/lib/llm.ts`                | LLM integration for audit summaries with fallback        |
| `src/lib/email.ts`              | Email sending (Resend) and lead capture (DB write)       |
| `src/types/index.ts`            | All TypeScript interfaces: ToolEntry, AuditResult, etc.  |
| `src/components/SpendForm.tsx`  | User input form with auto-calculated spend               |
| `src/components/AuditResults.tsx`| Results display with AI summary, sharing, email capture  |
| `prisma/schema.prisma`          | Database models: SharedAudit, Lead                       |

---

## Supported AI Tools

| Tool            | Plans Covered                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Cursor          | Hobby ($0), Pro ($20), Business ($40), Enterprise ($60)                                          |
| GitHub Copilot  | Individual ($10), Business ($19), Enterprise ($39)                                               |
| Claude          | Free ($0), Pro ($20), Max ($30), Team ($25), Enterprise ($50), API Direct ($0 base, pay-as-you-go) |
| ChatGPT         | Free ($0), Plus ($20), Team ($25), Enterprise ($30), API Direct ($0 base, pay-as-you-go)          |
| Anthropic API   | Pay-as-you-go ($0 base, usage-based pricing)                                                     |
| OpenAI API      | Pay-as-you-go ($0 base, usage-based pricing)                                                     |
| Gemini          | Free ($0), Pro ($10), Ultra ($20), API ($0 base, usage-based)                                    |
| Windsurf        | Free ($0), Pro ($15), Team ($30)                                                                 |

All prices are per user/month. See [PRICING_DATA.md](./PRICING_DATA.md) for source URLs and verification dates.

---

## Decisions

Key architectural and technology trade-offs made during development:

### 1. SQLite over Postgres

We chose SQLite for local development and initial deployment. It requires zero configuration, no separate database server, and handles the expected load easily. The migration path to Postgres is straightforward — change `DATABASE_URL` and run `prisma migrate`. We'll revisit when concurrent writes exceed 100/sec or we need cross-audit analytics.

### 2. Honeypot + In-Memory Rate Limiting over External Services

Two layers of anti-abuse protection are in place. First, a hidden honeypot field in the email capture form silently rejects bots that fill it in. Second, an in-memory IP-based rate limiter (`lib/rateLimit.ts`) caps requests at 10 audits/IP/15 min and 5 lead captures/IP/hour — returning a `429` with a `retryAfterSeconds` hint. No Redis or external KV store is needed for a single-instance deployment.

### 3. Hardcoded Pricing over Real-Time API

AI tool pricing is hardcoded in `auditEngine.ts` with sources traced to vendor URLs in `PRICING_DATA.md`. This is faster (no vendor API latency), has no dependency on third-party pricing APIs, and every price is auditable. Updates require a code deployment, which is acceptable given pricing changes happen monthly at most.

### 4. Groq (llama-3.3-70b) for AI Summaries

AI summaries are generated by calling the Groq API directly via `fetch` — no SDK dependency. Groq's inference is extremely fast (typically <1s for 300 tokens), free on the generous free tier, and the OpenAI-compatible endpoint makes the integration trivial. If `GROQ_API_KEY` is not set, the system falls back to a deterministic template summary so the feature degrades gracefully.

### 5. JSON Storage in SQLite over Normalized Tables

`AuditResult` is stored as a JSON string in `SharedAudit.auditData` rather than being broken into normalized tables. This makes reads for shareable URLs fast (single query, no joins) and keeps the schema simple. The trade-off is that cross-audit analytics require parsing JSON, but the primary access pattern is "load one audit by ID," not aggregate queries.

---

## License

Private project. All rights reserved.
