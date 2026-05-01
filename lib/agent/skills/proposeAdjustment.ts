import { z } from "zod";
import { prisma } from "@/lib/db";
import { DAY_MS, avg, parseDate, round } from "./shared";

const inputSchema = z.object({
  userId: z.number().int(),
  date: z
    .string()
    .optional()
    .describe("ISO date of the planned workout. Defaults to today."),
  plannedWorkout: z
    .string()
    .optional()
    .describe(
      "Override the workout text; otherwise reads from the user's PlanDay row.",
    ),
});

export const proposeAdjustment = {
  name: "proposeAdjustment",
  description:
    "Given a planned workout and the user's recovery + load state, suggest whether to keep, scale, or move it. Returns a structured recommendation with reasons — not prose. Use when the user is asking what to do today/this week.",
  inputSchema,
  async handler(input: z.infer<typeof inputSchema>) {
    const ref = parseDate(input.date);

    let planned = input.plannedWorkout;
    if (!planned) {
      const planDay = await prisma.planDay.findFirst({
        where: {
          userId: input.userId,
          date: {
            gte: new Date(ref.getTime() - DAY_MS),
            lte: new Date(ref.getTime() + DAY_MS),
          },
        },
      });
      planned = planDay?.plannedWorkout ?? "rest";
    }

    const since = new Date(ref.getTime() - 7 * DAY_MS);
    const nights = await prisma.sleepLog.findMany({
      where: { userId: input.userId, date: { gte: since, lte: ref } },
      orderBy: { date: "desc" },
    });
    const readinessAvg = round(
      avg(nights.map((n) => n.readinessScore ?? 0)),
      0,
    );
    const sleepAvgH = round(avg(nights.map((n) => n.totalMinutes)) / 60, 1);

    const activities = await prisma.activity.findMany({
      where: {
        userId: input.userId,
        startDate: { gte: new Date(ref.getTime() - 28 * DAY_MS) },
      },
      orderBy: { startDate: "desc" },
    });
    const last7 = activities.filter(
      (a) => a.startDate >= new Date(ref.getTime() - 7 * DAY_MS),
    );
    const prior21 = activities.filter(
      (a) => a.startDate < new Date(ref.getTime() - 7 * DAY_MS),
    );
    const acuteKm = last7.reduce((s, a) => s + a.distanceMeters / 1000, 0);
    const chronicKm = prior21.length
      ? prior21.reduce((s, a) => s + a.distanceMeters / 1000, 0) / 3
      : acuteKm;

    const isHard = /tempo|interval|long|threshold|race/i.test(planned);

    const reasons: string[] = [];
    let recommendation: "keep" | "scale" | "swap_easy" = "keep";
    let adjusted = planned;

    if (isHard && readinessAvg > 0 && readinessAvg < 65) {
      recommendation = "scale";
      reasons.push(
        `7-day readiness average is ${readinessAvg} — body is under-recovered`,
      );
    }
    if (isHard && sleepAvgH > 0 && sleepAvgH < 6.5) {
      recommendation = "scale";
      reasons.push(
        `7-day sleep average is ${sleepAvgH}h — below the 7h threshold for quality sessions`,
      );
    }
    if (acuteKm < chronicKm * 0.6 && isHard) {
      recommendation = "scale";
      reasons.push(
        `acute mileage (${round(acuteKm, 1)}km) is well below chronic average (${round(chronicKm, 1)}km) — jumping straight back into a hard session risks injury`,
      );
    }
    if (isHard && readinessAvg > 0 && readinessAvg < 55) {
      recommendation = "swap_easy";
    }

    if (recommendation === "scale" && /6×800m/.test(planned)) {
      adjusted = "Tempo — 4×800m @ 5K pace w/ 2min jog recovery (cut volume 33%)";
    } else if (recommendation === "scale") {
      adjusted = `${planned} — cut volume ~30%, stop if any rep feels harder than it should`;
    } else if (recommendation === "swap_easy") {
      adjusted =
        "Easy 30-min shakeout at conversational pace — swap the quality session, pick it up when readiness rebounds";
    }

    return {
      planned,
      recommendation,
      adjusted,
      reasons,
      signals: {
        readinessAvg7: readinessAvg,
        sleepAvg7Hours: sleepAvgH,
        acuteKm: round(acuteKm, 1),
        chronicKmPerWeek: round(chronicKm, 1),
      },
    };
  },
};
