import { z } from "zod";
import { prisma } from "@/lib/db";
import { DAY_MS, round } from "./shared";

const inputSchema = z.object({
  userId: z.number().int(),
  weeks: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(4)
    .describe("How many weeks back to look at weekly mileage."),
});

export const getTrainingLoad = {
  name: "getTrainingLoad",
  description:
    "Read the user's recent training load — weekly mileage, acute vs chronic load, and whether any planned sessions were missed. Use for questions about volume, fitness, or whether the user is on track.",
  inputSchema,
  async handler(input: z.infer<typeof inputSchema>) {
    const now = new Date();
    const weeks = input.weeks ?? 4;
    const since = new Date(now.getTime() - weeks * 7 * DAY_MS);

    const activities = await prisma.activity.findMany({
      where: { userId: input.userId, startDate: { gte: since } },
      orderBy: { startDate: "desc" },
    });

    const weeklyKm: number[] = [];
    for (let w = 0; w < weeks; w++) {
      const start = new Date(now.getTime() - (w + 1) * 7 * DAY_MS);
      const end = new Date(now.getTime() - w * 7 * DAY_MS);
      const wk = activities.filter(
        (a) => a.startDate >= start && a.startDate < end,
      );
      weeklyKm.push(
        round(wk.reduce((s, a) => s + a.distanceMeters / 1000, 0), 1),
      );
    }

    const acuteKm = weeklyKm[0] ?? 0;
    const chronicKm = weeklyKm.length > 1
      ? round(weeklyKm.slice(1).reduce((a, b) => a + b, 0) / (weeklyKm.length - 1), 1)
      : acuteKm;
    const acuteChronicRatio = chronicKm > 0 ? round(acuteKm / chronicKm, 2) : 1;

    // Detect missed key sessions in the last 7 days: prior pattern usually
    // had one tempo + one long run per week. If neither exists this week, flag.
    const last7 = activities.filter(
      (a) => a.startDate >= new Date(now.getTime() - 7 * DAY_MS),
    );
    const last7Has = (kw: string) =>
      last7.some((a) => a.name.toLowerCase().includes(kw));
    const prior21 = activities.filter(
      (a) =>
        a.startDate < new Date(now.getTime() - 7 * DAY_MS) &&
        a.startDate >= new Date(now.getTime() - 28 * DAY_MS),
    );
    const prior21Has = (kw: string) =>
      prior21.some((a) => a.name.toLowerCase().includes(kw));

    const missed: string[] = [];
    if (!last7Has("tempo") && prior21Has("tempo")) missed.push("tempo");
    if (!last7Has("long") && prior21Has("long")) missed.push("long run");

    return {
      weeklyKm,
      acuteKm,
      chronicKm,
      acuteChronicRatio,
      sessionsLast7: last7.length,
      missedKeySessionsLast7: missed,
      last7Summary: last7.map((a) => ({
        date: a.startDate.toISOString().slice(0, 10),
        name: a.name,
        km: round(a.distanceMeters / 1000, 1),
      })),
    };
  },
};
