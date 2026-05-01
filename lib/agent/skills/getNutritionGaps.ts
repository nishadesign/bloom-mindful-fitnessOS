import { z } from "zod";
import { prisma } from "@/lib/db";
import { DAY_MS, avg, round } from "./shared";

const inputSchema = z.object({
  userId: z.number().int(),
  days: z
    .number()
    .int()
    .min(1)
    .max(30)
    .default(7)
    .describe("Number of recent days to evaluate."),
});

export const getNutritionGaps = {
  name: "getNutritionGaps",
  description:
    "Identify gaps between the user's recent nutrition intake and targets (kcal, protein). Flags days where protein or calories fell short. Use for fueling / recovery / performance questions.",
  inputSchema,
  async handler(input: z.infer<typeof inputSchema>) {
    const days = input.days ?? 7;
    const since = new Date(Date.now() - days * DAY_MS);

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    const kcalTarget = user?.calorieTargetKcal ?? 2500;
    // Protein target: ~1.6g/kg for an endurance athlete.
    const proteinTargetG = user?.weightKg
      ? Math.round(user.weightKg * 1.6)
      : 115;

    const logs = await prisma.nutritionLog.findMany({
      where: { userId: input.userId, date: { gte: since } },
      orderBy: { date: "desc" },
    });

    if (logs.length === 0) {
      return {
        available: false,
        note: "No nutrition logs yet. User hasn't been logging meals.",
      };
    }

    const lowProteinDays = logs
      .filter((l) => l.proteinG < proteinTargetG * 0.6)
      .map((l) => ({
        date: l.date.toISOString().slice(0, 10),
        proteinG: l.proteinG,
        kcal: l.kcal,
      }));

    const lowKcalDays = logs
      .filter((l) => l.kcal < kcalTarget * 0.8)
      .map((l) => ({
        date: l.date.toISOString().slice(0, 10),
        kcal: l.kcal,
      }));

    return {
      available: true,
      windowDays: days,
      proteinTargetG,
      kcalTarget,
      avgProteinG: round(avg(logs.map((l) => l.proteinG)), 0),
      avgKcal: round(avg(logs.map((l) => l.kcal)), 0),
      lowProteinDays,
      lowKcalDays,
    };
  },
};
