# Bloom — your mindful FitnessOS

Bloom is a fitness OS with an agent on top. It reads your training, sleep, nutrition, hydration, and cycle data through a skill registry, synthesizes an honest read on how you're doing, and writes a specific recommendation back into today's plan — with every number traceable to a source.

Built with Next.js 16, Prisma 7, and Claude Sonnet 4.6 (tool use).

## How it works

1. **You ask** (or Bloom surfaces an insight on load) — e.g. "Should I do today's tempo given my recovery?"
2. **The agent picks skills.** A Claude tool-use loop inspects the question and calls the skills it needs from the registry below. Multi-domain questions (goal progress, readiness) trigger multiple skills in one pass.
3. **Each skill reads the DB**, shapes a structured output, and logs an `AgentTrace`.
4. **Claude synthesizes** the tool outputs into a short editorial answer — no generic coach-speak, every concrete claim tied back to data.
5. **You see an insight card** on the dashboard with skill pills. Tapping it opens a reasoning drawer that shows exactly what Bloom read (HRV trend, weekly km bar chart, low-protein days, etc.) — not raw tool JSON.
6. **Accept** writes Bloom's adjusted workout into today's `PlanDay` in place, with the reason. **Regenerate** re-asks the coach off your latest data.
7. **Share with your crew** drafts a one-liner via the `draftCrewNudge` skill — persisted as a `coach_draft`, not a new insight.

## Skill registry (`lib/agent/skills/`)

Each skill is a Zod-validated handler that runs against the user's Prisma rows.

| Skill | Reads | Returns |
| --- | --- | --- |
| `getRecoveryState` | 30d `SleepLog` | 7d HRV avg, delta vs 21d baseline, trend, sleep hours, readiness, short-night count, last night |
| `getTrainingLoad` | 4w `Activity` | Weekly km array, acute/chronic load, acute:chronic ratio, missed key sessions, last 7 runs |
| `getNutritionGaps` | 7d `NutritionLog` | Protein + kcal vs target, low-protein days, low-kcal days |
| `getHydrationStatus` | 7d `HydrationLog` | Avg ml vs 2500ml baseline, short days |
| `getCyclePhase` | `CycleEvent` | Current phase + date range, or `null` if no cycle data |
| `proposeAdjustment` | `PlanDay` + recovery + load | `keep` / `scale` / `swap_easy` recommendation, reasons, adjusted workout text |
| `proposeHabitRestart` | 4w `Activity` | Lapse detection (≥25% drop vs chronic), restart suggestion |
| `draftCrewNudge` | topic + detail | One-line shareable nudge, suggested channels |

Every invocation is persisted as an `AgentTrace` (latency, ok/error, input, output, linked `insightId`). The drawer reads these back to render human-friendly source cards.

## Routes

### Surfaces
- `/` — landing (mindful-first positioning, grain + sun atmosphere, Forest Runner palette)
- `/onboarding` — bio summary card, weight-goal picker, calorie baseline preview (Mifflin–St Jeor BMR)
- `/integrations` — Strava (real OAuth), Oura / Garmin / Apple Watch (demo toggles)
- `/dashboard` — week streak, `InsightCard` (latest `coach_reply`), `TodayPlan` (planned vs adjusted workout), last session + calorie budget
- `/coach` — chat UI backed by `/api/coach`, skill pills under each assistant reply, "See reasoning →" opens the same drawer
- `/meals` — natural-language meal logging stub

### API
- `POST /api/coach` — runs the tool-use loop, persists an `Insight` (+ `AgentTrace` rows), returns `{reply, toolCalls, insightId}`. Accepts `kind: "insight" | "draft"` to separate real insights from helper drafts (e.g. crew nudges).
- `GET /api/insights/[id]` — returns `{insight, traces}` for the reasoning drawer. Traces ordered by id asc.
- `POST /api/insights/[id]/action` — accepts `{action: "accepted" | "dismissed"}`. On `accepted`, parses `sourceRefs` for the `proposeAdjustment` output and writes `adjustedWorkout` + `adjustmentReason` + `insightId` into today's `PlanDay` (±1 day tolerance for UTC drift).
- `GET/POST /api/strava/*` — real OAuth + activity sync
- `GET/POST /api/integrations/*` — provider toggles

## Prisma schema highlights

```
User, Goal, Integration, Activity, SleepLog              — core tracker data
NutritionLog, HydrationLog, CycleEvent, HabitNudge       — phase-2 signals
PlanDay (plannedWorkout, adjustedWorkout, adjustmentReason, insightId)
Insight (type, title, body, sourceRefs JSON, action, actedAt)
AgentTrace (skillName, input, output, ok, errorMessage, latencyMs, insightId)
```

- `Insight.type` is `"coach_reply"` for real insights and `"coach_draft"` for helper drafts (crew nudges). The dashboard reads `coach_reply` only.
- `Insight.action` is `"pending" | "accepted" | "dismissed"` (the UI surfaces Accept + Regenerate; `dismissed` is retained in the schema for history).
- `AgentTrace` has composite indexes on `[userId, createdAt]` and `[skillName, createdAt]`.

## Tech

- Next.js 16.2.4 — app router, async `searchParams`, dynamic route `params: Promise<{id}>`
- React 19.2
- Tailwind v4 (`@import "tailwindcss"` + `@theme` tokens, no config file)
- Prisma 7.8 + `@prisma/adapter-better-sqlite3`
- `@anthropic-ai/sdk` — tool-use loop against `claude-sonnet-4-6`
- Zod 4 — skill input schemas, converted to JSON Schema via `z.toJSONSchema`

## Getting started

```bash
npm install

cp .env.example .env
# fill in ANTHROPIC_API_KEY, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET

npx prisma migrate dev
npm run seed          # seeds Jordan (id=1): 60d sleep + runs, 14d nutrition + hydration, goal, today's plan

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The seed creates a demo user with a deliberately rough week (recovery debt, missed tempo + long run, low-protein days, under-hydrated) so the coach has something honest to say.

## Environment variables

```bash
# Prisma (SQLite for local, swap for Postgres in prod)
DATABASE_URL="file:./dev.db"

# Anthropic
ANTHROPIC_API_KEY=

# Strava OAuth (callback must match your redirect URI)
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

## Project layout

```
app/
  api/
    coach/                  # tool-use loop + insight persistence
    insights/[id]/          # GET traces, POST action (accept/dismiss)
    strava/, integrations/  # OAuth + provider toggles
  coach/                    # chat UI + drawer
  components/
    InsightCard.tsx         # dashboard card: accept, regenerate, share with crew
    InsightDrawer.tsx       # portal drawer with per-skill source renderers
    TodayPlan.tsx           # planned vs adjusted workout card
    MarkdownText.tsx        # lightweight **bold** / _italic_ / --- renderer
    DashboardReveal.tsx, PageShell.tsx, ...
  dashboard/                # server component, reads latest coach_reply + today's plan
  globals.css               # Forest Runner theme, typography, card/btn/field primitives
lib/
  agent/skills/             # skill registry + runSkill() + skillToolDefinitions()
  calories.ts, strava.ts, providers.ts, db.ts, user.ts
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Design system

All styling is driven by `app/globals.css` — no Tailwind config file, no external UI library. Use the provided primitives:

- Colors: `sand` / `sand-deep` / `ink` / `graphite` / `smoke` / `linen` / `paper` / `parchment`
- Typography: `.display` (Fraunces), `.display-italic`, `.eyebrow`, `.numeral`, `.stat-big`, `.stat-med`
- Components: `.card`, `.card-soft`, `.card-hover`, `.btn-primary`, `.btn-ghost`, `.field`
- Layout: `.page-container`, `.page-narrow / -default / -wide`, spacing tokens `xs / sm / md / lg / xl / 2xl`
- Motion: `.rise`, `.fade`, `.stagger-1..6`, `.tile-in`, `.insight-glow`; all gated behind `prefers-reduced-motion`

Mobile-first — target 375px width as the baseline.

## Deploy

Deploys to Vercel out of the box. Set the env vars above, swap `DATABASE_URL` to a hosted Postgres connection string, and update `prisma/schema.prisma`'s datasource provider before shipping — SQLite is local-dev only.
