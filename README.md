# Dhanveer — Sales Intelligence OS

Internal Sales Intelligence Operating System for **The Tea Planet**.  
Built with Next.js 15 App Router, TypeScript, Tailwind CSS, PostgreSQL, and Prisma.

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Framework    | Next.js 15 (App Router)             |
| Language     | TypeScript                          |
| Styling      | Tailwind CSS 3                      |
| Database     | PostgreSQL                          |
| ORM          | Prisma 6                            |
| Hosting      | Vercel                              |
| Future APIs  | Google Places, WhatsApp, Claude AI, Google Sheets |

---

## Local Development

### 1. Clone and install

```bash
git clone <repo-url>
cd Dhanveer
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and fill in your DATABASE_URL and other values
```

### 3. Set up the database

```bash
# Push schema to your Postgres DB (first-time setup)
npm run db:push

# Or run migrations (for production-style workflow)
npm run db:migrate

# Generate Prisma client (always run after schema changes)
npm run db:generate
```

### 4. Start the dev server

```bash
npm run dev
# App runs at http://localhost:3000
```

### 5. Key routes

| Route         | Description                         |
|---------------|-------------------------------------|
| `/`           | Landing page                        |
| `/dashboard`  | Sales dashboard shell               |
| `/admin`      | Admin configuration panel           |
| `/api/health` | Health check — returns `{ status: "ok" }` |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── dashboard/          # Sales dashboard
│   ├── admin/              # Admin panel
│   └── api/
│       └── health/         # Health check API route
├── components/
│   ├── layout/             # AppShell, Sidebar, Header
│   ├── dashboard/          # StatsCard and future widgets
│   ├── leads/              # Lead-related components (TBD)
│   └── ui/                 # Shared UI primitives (TBD)
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── auth.ts             # Auth utilities (stub)
│   └── env.ts              # Type-safe env variable access
├── types/
│   └── index.ts            # Shared TypeScript types
├── services/               # Business logic / API service layer (TBD)
└── jobs/                   # Background jobs / cron tasks (TBD)
prisma/
└── schema.prisma           # Database schema
```

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development.  
In Vercel, add these under **Project → Settings → Environment Variables**:

| Variable                     | Required | Description                                    |
|------------------------------|----------|------------------------------------------------|
| `DATABASE_URL`               | ✅       | PostgreSQL connection string                   |
| `NEXT_PUBLIC_APP_URL`        | ✅       | Full app URL (e.g. `https://dhanveer-izqx-git-claude-setup-ve-745a7f-founder-9869s-projects.vercel.app`) |
| `NEXTAUTH_SECRET`            | ✅       | Random secret — `openssl rand -base64 32`      |
| `NEXTAUTH_URL`               | ✅       | Same as `NEXT_PUBLIC_APP_URL`                  |
| `GOOGLE_PLACES_API_KEY`      | —        | Server-side only. For lead scraping.           |
| `WHATSAPP_API_TOKEN`         | —        | Meta WhatsApp Business API token               |
| `WHATSAPP_PHONE_NUMBER_ID`   | —        | Meta WhatsApp phone number ID                  |
| `ANTHROPIC_API_KEY`          | —        | Claude API key for AI features                 |
| `OPENAI_API_KEY`             | —        | OpenAI API key (alternative)                   |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | —      | For Google Sheets integration                  |
| `GOOGLE_SERVICE_ACCOUNT_KEY`  | —       | Base64 private key for Google Sheets           |

---

## Vercel Deployment

1. Push to GitHub and import the repo in Vercel.
2. Set all required environment variables (see table above).
3. Set **Build Command** to: `npm run db:generate && npm run build`
4. Set **Output Directory** to `.next` (Vercel detects this automatically).
5. Connect a **Postgres** database (Vercel Postgres / Neon / Supabase).
6. After first deploy, run: `npx prisma migrate deploy` via Vercel CLI or a one-off job.

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations (dev)
npm run db:push      # Push schema to DB (prototyping)
npm run db:studio    # Open Prisma Studio GUI
```

---

## Next Recommended Build Steps

1. **Authentication** — Add NextAuth v5 or Clerk with role-based access.
2. **Lead CRUD** — Build `/dashboard/leads` with list, create, and detail views.
3. **Google Places scraper** — Service in `src/services/googlePlaces.ts`.
4. **WhatsApp integration** — Webhook handler in `src/app/api/whatsapp/`.
5. **AI lead scoring** — Claude API integration in `src/services/leadScoring.ts`.
6. **Google Sheets sync** — Export job in `src/jobs/sheetsSync.ts`.
