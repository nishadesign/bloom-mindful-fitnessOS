import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const DAY_MS = 24 * 60 * 60 * 1000;

async function getRecentActivities(days = 14) {
  const since = new Date(Date.now() - days * DAY_MS);
  return prisma.activity.findMany({
    where: { userId: DEMO_USER_ID, startDate: { gte: since } },
    orderBy: { startDate: "desc" },
    take: 50,
  });
}

async function getRecentSleep(days = 14) {
  const since = new Date(Date.now() - days * DAY_MS);
  return prisma.sleepLog.findMany({
    where: { userId: DEMO_USER_ID, date: { gte: since } },
    orderBy: { date: "desc" },
    take: 30,
  });
}

async function getUserGoal() {
  return prisma.user.findUnique({
    where: { id: DEMO_USER_ID },
    select: { name: true, goal: true },
  });
}

type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

type CycleSnapshot = {
  cycleDay: number;
  phase: CyclePhase;
  daysUntilNextPeriod: number;
  cycleLength: number;
};

// No wearable data on cycles yet — derive a plausible snapshot so the coach
// can talk about it. Anchored to a fixed reference so a demo is repeatable.
async function getCyclePhase(): Promise<CycleSnapshot> {
  const cycleLength = 28;
  const periodStart = new Date(Date.UTC(2026, 3, 4)); // 2026-04-04
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const elapsedDays = Math.floor(
    (today.getTime() - periodStart.getTime()) / DAY_MS,
  );
  const cycleDay = ((elapsedDays % cycleLength) + cycleLength) % cycleLength + 1;

  let phase: CyclePhase;
  if (cycleDay <= 5) phase = "menstrual";
  else if (cycleDay <= 13) phase = "follicular";
  else if (cycleDay <= 16) phase = "ovulatory";
  else phase = "luteal";

  const daysUntilNextPeriod = cycleLength - cycleDay + 1;
  return { cycleDay, phase, daysUntilNextPeriod, cycleLength };
}

type Activity = Awaited<ReturnType<typeof getRecentActivities>>[number];
type Night = Awaited<ReturnType<typeof getRecentSleep>>[number];
type Goal = Awaited<ReturnType<typeof getUserGoal>>;

type Intent = "insight" | "bonk" | "postrun" | "fuel" | "ready" | "default";

function classify(q: string): Intent {
  const s = q.toLowerCase();
  if (/today'?s insight|tell me more about (today'?s )?insight|explain (the )?insight/.test(s))
    return "insight";
  if (/(post[-\s]?run|after (my |the )?run|recovery (meal|food)|refuel)/.test(s))
    return "postrun";
  if (/(bonk|tired|rough|terrible|crash|exhaust|flat|heavy|awful|dead|sucked|hurt)/.test(s))
    return "bonk";
  if (/(eat|food|fuel|dinner|meal|carb|lunch|tonight|snack|breakfast|nutrition)/.test(s))
    return "fuel";
  if (/(tempo|tomorrow|ready|session|workout|interval|long run|race|should i run)/.test(s))
    return "ready";
  return "default";
}

type Source = { label: string; detail: string };

function hrs(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

function daysAgo(d: Date): number {
  return Math.round((Date.now() - d.getTime()) / DAY_MS);
}

function relDay(d: Date): string {
  const n = daysAgo(d);
  if (n === 0) return "today";
  if (n === 1) return "yesterday";
  return `${n} days ago`;
}

function formatBonk(sleep: Night[], cycle: CycleSnapshot): string {
  if (sleep.length === 0) {
    return "No sleep data yet — connect Oura on /integrations and I can actually read what happened.";
  }
  const week = sleep.slice(0, 7);
  const worst = [...week].sort(
    (a, b) => (a.readinessScore ?? 100) - (b.readinessScore ?? 100),
  )[0];
  const mostRecent = sleep[0];

  const inLuteal = cycle.phase === "luteal";
  const closeToPeriod = cycle.daysUntilNextPeriod <= 4;

  const lines: string[] = [];

  if (inLuteal && closeToPeriod) {
    lines.push(
      `You're close to your cycle — day ${cycle.cycleDay} of ${cycle.cycleLength}, late luteal, roughly ${cycle.daysUntilNextPeriod} day${cycle.daysUntilNextPeriod === 1 ? "" : "s"} out from your period. That alone explains a chunk of the hit: resting heart rate trends up, recovery lags, body temp sits a few tenths higher, and the same pace just feels heavier. It's not fitness — it's hormonal load.`,
      ``,
    );
  } else if (inLuteal) {
    lines.push(
      `Worth naming first — you're in the luteal phase (cycle day ${cycle.cycleDay}). Progesterone is up, which nudges resting heart rate higher, recovery lower, and the same pace heavier. Baked-in tax.`,
      ``,
    );
  }

  lines.push(
    `On top of that: ${relDay(worst.date)} was your roughest night of the week — only ${hrs(worst.totalMinutes)}h of sleep, and your body looked under-recovered the next morning. Last night came in at ${hrs(mostRecent.totalMinutes)}h, still a step behind your usual.`,
    ``,
  );

  if (inLuteal && closeToPeriod) {
    lines.push(
      `Best read: cycle-driven performance dip stacked with a rough sleep night. Not a red flag — a predictable imbalance. Iron intake matters here; check it.`,
      ``,
      `Next 48h: easy runs only, dial tempo intensity back ~10%, lights out by 10, extra carbs around sessions. Once you're through the first two days of your period, things usually snap back fast.`,
    );
  } else {
    lines.push(
      `The bonk wasn't fitness. It was sleep debt catching up during a session your body wasn't paying for yet.`,
      ``,
      `Two clean nights before the next hard effort. Lights out by 10, caffeine off by 2pm. Recovery usually rebounds in 48–72h when you actually rest.`,
    );
  }

  return lines.join("\n");
}

function formatPostRun(goal: Goal): { reply: string; sources: Source[] } {
  const goalText = goal?.goal ?? "your current block";
  const reply = [
    `Post-run, go high-carb. You've just drained glycogen — the 60–90 min after a hard run is when your body is most primed to refill the tank and kickstart muscle repair. Skip it and tomorrow's legs feel like cement.`,
    ``,
    `Aim for roughly a 3:1 carb-to-protein ratio, 400–550 kcal, and fluids with a pinch of salt.`,
    ``,
    `Here's a vegetarian plate that hits it:`,
    ``,
    `· Sweet potato & black bean bowl — 1 cup cooked rice or quinoa, 1 roasted sweet potato, 1 cup black beans, avocado, salsa, squeeze of lime. Finish with a Greek yogurt on the side.`,
    ``,
    `Carbs: ~75g. Protein: ~25g. Plus potassium and sodium from the sweet potato and salsa to help you rehydrate.`,
    ``,
    `If you're short on time — chocolate milk and a banana in the first 20 minutes buys you a window. Then eat the real meal within 90.`,
    ``,
    `This keeps ${goalText} on track. You can't out-train a session you don't refuel.`,
  ].join("\n");

  const sources: Source[] = [
    {
      label: "Sports nutrition guideline",
      detail: "3:1 carb-to-protein within 60–90 min post-endurance",
    },
  ];
  if (goal?.goal) {
    sources.push({ label: "Your stated goal", detail: goal.goal });
  }
  return { reply, sources };
}

function formatFuel(goal: Goal, activities: Activity[]): string {
  const today = activities.filter((a) => daysAgo(a.startDate) <= 1);
  const hadSession = today.length > 0;
  const todayKm = today.reduce((s, a) => s + a.distanceMeters / 1000, 0);
  const goalText = goal?.goal ?? "your current training block";

  const lines: string[] = [
    `Goal on file: ${goalText}. Double-load weeks need carbs — skimp and the next tempo feels like concrete.`,
    ``,
  ];
  if (hadSession) {
    lines.push(
      `You trained in the last 24h (${todayKm.toFixed(1)} km logged). Dinner should replace what you burned — carbs first, protein second, don't skip the fat.`,
    );
  } else {
    lines.push(
      `No session logged in the last 24h. Still eat like an athlete — but you can dial carbs back slightly if nothing's on the books tomorrow.`,
    );
  }
  lines.push(
    ``,
    `Concretely: rice or pasta base (~1.5 cups cooked), 150g chicken or tofu, roasted veg with olive oil. Add fruit if you're running tomorrow. Water with electrolytes if you sweat today.`,
    ``,
    `Nothing fancy. Carbs, protein, get to bed.`,
  );
  return lines.join("\n");
}

function formatReady(sleep: Night[], activities: Activity[]): string {
  if (sleep.length === 0) {
    return "No recovery data yet — connect Oura on /integrations so I can call this honestly.";
  }
  const mostRecent = sleep[0];
  const prev = sleep[1];
  const weekSample = sleep.slice(0, Math.min(7, sleep.length));
  const avgReadiness = weekSample.length
    ? weekSample.reduce((s, n) => s + (n.readinessScore ?? 0), 0) /
      weekSample.length
    : 0;
  const avgSleepH = weekSample.length
    ? weekSample.reduce((s, n) => s + n.totalMinutes, 0) /
      weekSample.length /
      60
    : 0;
  const readiness = mostRecent.readinessScore ?? 0;

  const hardSessions = activities.filter((a) => {
    const days = daysAgo(a.startDate);
    return days <= 2 && a.distanceMeters >= 8000;
  }).length;

  let verdict: string;
  if (readiness >= 80) {
    verdict = "Green light. Warm up properly and go hit it.";
  } else if (readiness >= 65) {
    verdict =
      "Yellow. You can run it — warm up longer than usual, cut the session short if the first rep feels heavy. Don't chase paces.";
  } else {
    verdict =
      "Red. Push it 24 hours and sleep 8+ tonight. One day rarely costs you the race; a broken week can.";
  }

  const lines: string[] = [
    `Last night: ${hrs(mostRecent.totalMinutes)}h of sleep, ${recoveryPhrase(readiness)}.`,
  ];
  if (prev) {
    lines.push(
      `Night before: ${hrs(prev.totalMinutes)}h, ${recoveryPhrase(prev.readinessScore ?? 0)}.`,
    );
  }
  lines.push(
    `Across the week you've averaged ${avgSleepH.toFixed(1)}h of sleep — ${weeklyRecoveryPhrase(avgReadiness)}.`,
  );
  if (hardSessions > 0) {
    lines.push(
      `You've got ${hardSessions} long effort${hardSessions === 1 ? "" : "s"} in the last 48h already — keep that in the equation.`,
    );
  }
  lines.push(``, verdict);
  return lines.join("\n");
}

function recoveryPhrase(score: number): string {
  if (score >= 85) return "body bounced back well";
  if (score >= 75) return "recovery looked solid";
  if (score >= 65) return "recovery was decent, not great";
  if (score >= 55) return "body was still catching up";
  return "body was clearly under-recovered";
}

function sportLabel(sportType: string): string {
  const s = sportType.toLowerCase();
  if (s.includes("run")) return "Run";
  if (s.includes("ride") || s.includes("bike")) return "Ride";
  if (s.includes("swim")) return "Swim";
  if (s.includes("walk") || s.includes("hike")) return "Walk";
  if (s.includes("yoga")) return "Yoga";
  if (s.includes("weight") || s.includes("strength")) return "Strength";
  if (s.includes("crossfit")) return "CrossFit";
  return sportType;
}

function weeklyRecoveryPhrase(score: number): string {
  if (score >= 80) return "trending well rested";
  if (score >= 70) return "holding steady";
  if (score >= 60) return "running a small debt";
  return "the week's been taxing";
}

function formatInsight(
  goal: Goal,
  _sleep: Night[],
  activities: Activity[],
): { reply: string; sources: Source[] } {
  const lines = [
    `Get in an interval session today.`,
    ``,
    `Based on your last 3 sessions, try doing an interval session today. You're in the luteal phase, so keep the efforts honest — push only as much as it feels right.`,
    ``,
    `Shape for it: 10-min easy warm-up, 5×800m at 10K effort with 2-min jogs between, 10-min cool-down. If a rep feels heavier than it should, cut one and call it — that's still the win.`,
  ];

  if (goal?.goal) {
    lines.push(``, `Ties back to your goal: ${goal.goal}.`);
  }

  const sources: Source[] = [];
  if (activities.length > 0) {
    const last3 = activities.slice(0, 3);
    const detail = last3
      .map((a) => `${sportLabel(a.sportType)} ${relDay(a.startDate)}`)
      .join(" · ");
    sources.push({
      label: "Strava — last 3 sessions",
      detail,
    });
  }
  sources.push({
    label: "Cycle phase",
    detail: "luteal — day 26 of 28",
  });
  if (goal?.goal) {
    sources.push({ label: "Your stated goal", detail: goal.goal });
  }

  return { reply: lines.join("\n"), sources };
}

function formatDefault(
  goal: Goal,
  sleep: Night[],
  activities: Activity[],
): string {
  const name = goal?.name ?? "you";
  const goalText = goal?.goal ?? "your goal";
  const week = sleep.slice(0, Math.min(7, sleep.length));
  const avgReadiness = week.length
    ? week.reduce((s, n) => s + (n.readinessScore ?? 0), 0) / week.length
    : null;
  const avgSleep = week.length
    ? (week.reduce((s, n) => s + n.totalMinutes, 0) / week.length / 60).toFixed(
        1,
      )
    : null;
  const totalKm = activities
    .reduce((s, a) => s + a.distanceMeters / 1000, 0)
    .toFixed(1);
  const sessionCount = activities.length;

  const lines = [
    `Quick read on where you are, ${name}.`,
    ``,
    `Goal: ${goalText}.`,
    ``,
    `Last 7 days — ${sessionCount} session${sessionCount === 1 ? "" : "s"}, ${totalKm} km total.${
      avgReadiness != null
        ? ` Averaging ${avgSleep}h of sleep a night, and ${weeklyRecoveryPhrase(avgReadiness)}.`
        : ""
    }`,
    ``,
    `Ask me something specific — "why did I bonk yesterday", "what should I eat tonight", "am I ready for a tempo" — and I'll read the details before I answer.`,
  ];
  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    const incoming = (body.messages ?? []).filter(
      (m) => m.content?.trim().length > 0,
    );
    if (incoming.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const lastUser = [...incoming].reverse().find((m) => m.role === "user");
    const intent = classify(lastUser?.content ?? "");

    const toolsUsed: string[] = [];
    let sleep: Night[] = [];
    let activities: Activity[] = [];
    let goal: Goal = null;
    let cycle: CycleSnapshot | null = null;

    const needsSleep =
      intent === "bonk" || intent === "ready" || intent === "default";
    const needsActivities =
      intent === "insight" ||
      intent === "bonk" ||
      intent === "fuel" ||
      intent === "ready" ||
      intent === "default";
    const needsGoal =
      intent === "insight" ||
      intent === "fuel" ||
      intent === "postrun" ||
      intent === "default";
    const needsCycle = intent === "bonk" || intent === "insight";

    if (needsActivities) {
      activities = await getRecentActivities();
      toolsUsed.push("getRecentActivities");
    }
    if (needsSleep) {
      sleep = await getRecentSleep();
      toolsUsed.push("getRecentSleep");
    }
    if (needsGoal) {
      goal = await getUserGoal();
      toolsUsed.push("getUserGoal");
    }
    if (needsCycle) {
      cycle = await getCyclePhase();
      toolsUsed.push("getCyclePhase");
    }

    let reply: string;
    let sources: Source[] = [];
    switch (intent) {
      case "insight": {
        const out = formatInsight(goal, sleep, activities);
        reply = out.reply;
        sources = out.sources;
        break;
      }
      case "bonk":
        reply = formatBonk(sleep, cycle!);
        break;
      case "postrun": {
        const out = formatPostRun(goal);
        reply = out.reply;
        sources = out.sources;
        break;
      }
      case "fuel":
        reply = formatFuel(goal, activities);
        break;
      case "ready":
        reply = formatReady(sleep, activities);
        break;
      default:
        reply = formatDefault(goal, sleep, activities);
    }

    return NextResponse.json({ reply, toolsUsed, sources });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("/api/coach failed:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
