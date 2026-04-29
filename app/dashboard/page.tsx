import { BrandMark, PageNav, PageShell } from "../components/PageShell";
import DashboardReveal from "../components/DashboardReveal";
import { prisma } from "@/lib/db";
import { getDemoUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getDemoUser();
  const welcome = (await searchParams).welcome === "1";

  const weekStart = startOfDayUTC(new Date());
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  const weekActivities = await prisma.activity.findMany({
    where: {
      userId: user.id,
      startDate: { gte: weekStart },
    },
    orderBy: { startDate: "asc" },
  });

  const weekDays = buildWeek(weekActivities);

  const insight = buildInsight();

  const calorieBudgetToday = user.calorieTargetKcal ?? null;

  return (
    <PageShell
      width="default"
      nav={<PageNav leading={<BrandMark />} />}
    >
      <header className="mb-lg sm:mb-xl rise stagger-2">
        <p className="eyebrow mb-xs">{formatToday()}</p>
        <h1 className="display text-[32px] sm:text-[52px] leading-[1.08] tracking-[-0.02em] text-ink">
          {greeting()},{" "}
          <span className="display-italic">
            {user.name.split(" ")[0] || "there"}
          </span>
          .
        </h1>
      </header>

      <section className="mb-lg rise stagger-3">
        <WeekStreak days={weekDays} />
      </section>

      <DashboardReveal
        welcome={welcome}
        insightHeadline={insight.headline}
        insightSupport={insight.support}
        calorieTotal={calorieBudgetToday}
      />
    </PageShell>
  );
}

type WeekDay = {
  date: Date;
  dayLetter: string;
  dayNumber: number;
  count: number;
  totalMinutes: number;
  isToday: boolean;
};

function buildWeek(
  activities: Array<{ startDate: Date; movingSeconds: number }>,
): WeekDay[] {
  const today = startOfDayUTC(new Date());
  const DAY_MS = 24 * 60 * 60 * 1000;
  const days: WeekDay[] = [];
  const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const next = new Date(d.getTime() + DAY_MS);
    const dayAct = activities.filter(
      (a) =>
        a.startDate.getTime() >= d.getTime() &&
        a.startDate.getTime() < next.getTime(),
    );
    days.push({
      date: d,
      dayLetter: DAY_LETTERS[d.getUTCDay()],
      dayNumber: d.getUTCDate(),
      count: dayAct.length,
      totalMinutes: Math.round(
        dayAct.reduce((s, a) => s + a.movingSeconds, 0) / 60,
      ),
      isToday: i === 0,
    });
  }
  return days;
}

function WeekStreak({ days }: { days: WeekDay[] }) {
  return (
    <div className="flex items-center gap-[6px]" role="list">
      {days.map((d) => (
        <StreakCell key={d.date.toISOString()} day={d} />
      ))}
    </div>
  );
}

function StreakCell({ day }: { day: WeekDay }) {
  const filled = day.count > 0;
  const label = filled
    ? `${day.totalMinutes} minutes on ${day.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`
    : `No activity on ${day.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`;
  return (
    <span
      role="listitem"
      aria-label={label}
      className="block"
      style={{
        width: 22,
        height: 22,
        borderRadius: 5,
        background: filled ? "var(--color-sand)" : "transparent",
        border: `1px solid ${
          filled
            ? "var(--color-sand)"
            : day.isToday
              ? "var(--color-sand-deep)"
              : "var(--color-linen)"
        }`,
      }}
    />
  );
}

type Insight = { headline: string; support?: string };

function buildInsight(): Insight {
  return {
    headline: "Get in an interval session.",
    support:
      "Based on your last 3 sessions, try doing an interval session today. You're in the luteal phase, so keep the efforts honest — push only as much as it feels right.",
  };
}

function startOfDayUTC(d: Date) {
  const c = new Date(d);
  c.setUTCHours(0, 0, 0, 0);
  return c;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Afternoon";
  if (h < 21) return "Evening";
  return "Tonight";
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
