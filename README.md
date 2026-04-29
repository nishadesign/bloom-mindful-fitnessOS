# Bloom — your mindful FitnessOS

Bloom is an AI-first fitness companion that reads your existing training, sleep, meals, and cycle — then tells you what to do next, with sources. It connects to the apps you already use (Strava, Oura, etc.) instead of asking you to re-track anything.

Built as a hackathon demo with Next.js 16, Prisma 7, and Claude / OpenAI.

## What's inside

- **Landing (`/`)** — mindful-first positioning, grain + sun ambient atmosphere, Forest Runner palette.
- **Integrations (`/integrations`)** — toggle Strava, Oura, Garmin, Apple Watch (Strava is real OAuth; others are demo toggles).
- **Onboarding (`/onboarding`)** — bio summary card, weight-goal picker, calorie baseline preview (Mifflin–St Jeor BMR math).
- **Dashboard (`/dashboard`)** — week streak, a typewriter-reveal insight card, synced last session, and today's calorie budget. When you arrive with `?welcome=1`, the cards stage-reveal in sequence.
- **Coach (`/coach`)** — chat UI with progressive "thinking…" steps (reading training, checking cycle phase, etc.) before the answer lands. Shows tools used and sources.
- **Meals (`/meals`)** — natural-language meal logging stub.

## Tech

- Next.js 16.2.4 (app router, async `searchParams`)
- React 19.2
- Tailwind v4 (`@import "tailwindcss"` + `@theme` tokens)
- Prisma 7.8 + `@prisma/adapter-better-sqlite3` (SQLite for local dev)
- `@anthropic-ai/sdk` + `openai` (via TokenRouter proxy)
- Zod for request validation

## Getting started

```bash
# 1. install
npm install

# 2. set env — see `.env.example` below
cp .env.example .env
# fill in TOKENROUTER_API_KEY, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET

# 3. init the local SQLite db
npx prisma migrate dev
npm run seed

# 4. run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

```bash
# Prisma (SQLite for local, swap for Postgres in prod)
DATABASE_URL="file:./dev.db"

# LLM — using TokenRouter (Anthropic-compatible proxy)
TOKENROUTER_API_KEY=
TOKENROUTER_BASE_URL=

# Fallback / alt provider
OPENAI_API_KEY=
OPENAI_MODEL=

# Strava OAuth (callback must match your redirect URI)
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

## Project layout

```
app/
  api/              # coach, integrations, strava, user route handlers
  coach/            # chat UI + thinking-step orchestration
  components/       # DashboardReveal, OnboardingForm, ProviderCard, TypewriterInsight, PageShell…
  dashboard/        # server-rendered dashboard with client reveal
  integrations/     # provider toggle grid
  meals/            # meal logging stub
  onboarding/       # bio + goal form
  globals.css       # Forest Runner theme, typography, keyframes
lib/
  calories.ts       # Mifflin–St Jeor BMR + TDEE
  db.ts             # Prisma client
  mockOura.ts       # demo-only Oura synthesis
  providers.ts      # provider registry
  strava.ts         # OAuth + activity sync
  user.ts           # demo user bootstrap
prisma/
  schema.prisma     # User, Activity, SleepLog, Integration models
  migrations/
  seed.ts           # demo seed data
```

## Deploy

Deploys to Vercel out of the box. Set the env vars above in the Vercel dashboard; swap `DATABASE_URL` to a hosted Postgres connection string (and update `prisma/schema.prisma` datasource provider) before shipping — SQLite is local-dev only.
