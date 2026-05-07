# AI Spend Audit

Find hidden savings on your AI tools. A free, instant audit that checks your Cursor, GitHub Copilot, ChatGPT, Claude, Gemini, and Windsurf subscriptions against current pricing data and recommends optimizations.

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

- [Bun](https://bun.sh/) v1.3+ (or Node.js 20+)
- Git

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd my-project

# Install dependencies
bun install

# Set up the database
bun run db:push
bun run db:generate

# Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env` file in the project root (or set these in your deployment environment):

| Variable                  | Required | Default          | Description                                          |
| ------------------------- | -------- | ---------------- | ---------------------------------------------------- |
| `DATABASE_URL`            | Yes      | `file:./db/custom.db` | SQLite database connection string               |
| `RESEND_API_KEY`          | No       | —                | Resend API key for sending emails. If not set, emails are logged to console instead. |
| `NEXT_PUBLIC_BASE_URL`    | No       | `""`             | Base URL for generating shareable links (e.g., `https://yourdomain.com`) |

### Example `.env`

```env
DATABASE_URL="file:./db/custom.db"
RESEND_API_KEY="re_xxxxxxxxxxxx"
NEXT_PUBLIC_BASE_URL="https://aispendaudit.com"
```

---

## Running Locally

```bash
# Development server with hot reload
bun run dev

# Run tests
bun test

# Lint code
bun run lint

# Build for production
bun run build

# Start production server
bun run start
```

### Database Commands

```bash
# Push schema changes to the database (development)
bun run db:push

# Generate Prisma client
bun run db:generate

# Create a migration (if switching to Postgres)
bun run db:migrate

# Reset the database
bun run db:reset
```

---

## Deploying

### Production Build

The project uses Next.js standalone output mode for minimal deployment footprint:

```bash
# Build the application
bun run build

# This creates:
# .next/standalone/  - Minimal server bundle
# .next/static/      - Static assets (copied automatically by build script)
# public/            - Public assets (copied automatically by build script)
```

### Running in Production

```bash
NODE_ENV=production bun .next/standalone/server.js
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
2. Run `bun run db:push` to create/migrate the database
3. Run `bun run build` to create the production bundle
4. Start the server with `bun run start` or the standalone command
5. Verify the health check at `/api/route.ts`
6. Test the full flow: form → audit → results → email → share

---

## Project Structure

```
my-project/
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
│   │   ├── llm.ts                  # LLM summary + fallback template
│   │   ├── email.ts                # Email sending + lead capture
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

| Tool            | Plans Covered                              |
| --------------- | ------------------------------------------ |
| Cursor          | Hobby ($0), Pro ($20), Business ($40)      |
| GitHub Copilot  | Individual ($10), Business ($19), Enterprise ($39) |
| Claude          | Free ($0), Pro ($20), Max ($30), Team ($25), Enterprise ($50) |
| ChatGPT         | Plus ($20), Team ($25), Enterprise ($30)   |
| Gemini          | Pro ($10), Ultra ($20)                     |
| Windsurf        | Pro ($15), Team ($30)                      |

All prices are per user/month. See [PRICING_DATA.md](./PRICING_DATA.md) for source URLs and verification dates.

---

## License

Private project. All rights reserved.
