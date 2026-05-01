import { z } from "zod";
import { prisma } from "@/lib/db";
import { DAY_MS, avg, parseDate, round, userIdAndDateSchema } from "./shared";

export const getRecoveryState = {
  name: "getRecoveryState",
  description:
    "Read the user's recent recovery signals (HRV trend, sleep, readiness) and return a structured snapshot. Use when the question touches how rested or recovered the user is.",
  inputSchema: userIdAndDateSchema,
  async handler(input: z.infer<typeof userIdAndDateSchema>) {
    const ref = parseDate(input.date);
    const since = new Date(ref.getTime() - 30 * DAY_MS);

    const nights = await prisma.sleepLog.findMany({
      where: { userId: input.userId, date: { gte: since, lte: ref } },
      orderBy: { date: "desc" },
    });

    if (nights.length === 0) {
      return {
        available: false,
        note: "No sleep/HRV data yet. Suggest user connect Oura.",
      };
    }

    const last7 = nights.slice(0, 7);
    const prior21 = nights.slice(7, 28);

    const hrvRecent = last7.map((n) => n.hrvMs).filter((x): x is number => x != null);
    const hrvBaseline = prior21.map((n) => n.hrvMs).filter((x): x is number => x != null);

    const hrvAvg7 = round(avg(hrvRecent));
    const hrvBaselineAvg = round(avg(hrvBaseline));
    const hrvDelta = round(hrvAvg7 - hrvBaselineAvg);

    const sleepAvg7h = round(avg(last7.map((n) => n.totalMinutes)) / 60, 1);
    const readinessAvg7 = round(
      avg(last7.map((n) => n.readinessScore ?? 0)),
      0,
    );

    const lastNight = nights[0];
    const shortNights = last7.filter((n) => n.totalMinutes < 6 * 60).length;

    let trend: "declining" | "stable" | "improving";
    if (hrvDelta <= -3) trend = "declining";
    else if (hrvDelta >= 3) trend = "improving";
    else trend = "stable";

    return {
      available: true,
      window: "last 7 days vs 21-day baseline",
      hrvAvg7Ms: hrvAvg7,
      hrvBaselineAvgMs: hrvBaselineAvg,
      hrvDeltaMs: hrvDelta,
      hrvTrend: trend,
      sleepAvg7Hours: sleepAvg7h,
      shortNightsLast7: shortNights,
      readinessAvg7,
      lastNight: {
        date: lastNight.date.toISOString().slice(0, 10),
        sleepHours: round(lastNight.totalMinutes / 60, 1),
        hrvMs: lastNight.hrvMs,
        readinessScore: lastNight.readinessScore,
      },
    };
  },
};
