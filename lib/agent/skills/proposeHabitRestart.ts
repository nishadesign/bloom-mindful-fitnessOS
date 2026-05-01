import { z } from "zod";
import { prisma } from "@/lib/db";
import { DAY_MS, userIdSchema } from "./shared";

export const proposeHabitRestart = {
  name: "proposeHabitRestart",
  description:
    "Detect lapsed-habit patterns (e.g. missed planned sessions, skipped logging) and propose a small restart habit. Returns null if no lapse is detected. Use when load data shows a recent gap.",
  inputSchema: userIdSchema,
  async handler(input: z.infer<typeof userIdSchema>) {
    const now = new Date();
    const last7 = await prisma.activity.findMany({
      where: {
        userId: input.userId,
        startDate: { gte: new Date(now.getTime() - 7 * DAY_MS) },
      },
    });
    const prior21 = await prisma.activity.findMany({
      where: {
        userId: input.userId,
        startDate: {
          lt: new Date(now.getTime() - 7 * DAY_MS),
          gte: new Date(now.getTime() - 28 * DAY_MS),
        },
      },
    });

    const acuteKm = last7.reduce((s, a) => s + a.distanceMeters / 1000, 0);
    const chronicKmPerWeek = prior21.length
      ? prior21.reduce((s, a) => s + a.distanceMeters / 1000, 0) / 3
      : acuteKm;
    const drop = chronicKmPerWeek > 0
      ? 1 - acuteKm / chronicKmPerWeek
      : 0;

    if (drop < 0.25) {
      return {
        lapseDetected: false,
        note: "No significant drop in training load.",
      };
    }

    const restart = {
      type: "restart_run",
      body:
        "Two 20-minute easy runs this week — no pace, no pressure. Just rebuild the rhythm before the next hard session.",
    };

    return {
      lapseDetected: true,
      dropPercent: Math.round(drop * 100),
      acuteKm: Math.round(acuteKm * 10) / 10,
      chronicKmPerWeek: Math.round(chronicKmPerWeek * 10) / 10,
      restart,
    };
  },
};
