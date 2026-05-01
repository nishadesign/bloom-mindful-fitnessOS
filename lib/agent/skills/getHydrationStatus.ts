import { z } from "zod";
import { prisma } from "@/lib/db";
import { DAY_MS, avg, parseDate, round, userIdAndDateSchema } from "./shared";

export const getHydrationStatus = {
  name: "getHydrationStatus",
  description:
    "Read the user's hydration logs over the last week and flag shortfalls vs. a ~2500ml baseline. Use for performance / recovery questions where hydration matters.",
  inputSchema: userIdAndDateSchema,
  async handler(input: z.infer<typeof userIdAndDateSchema>) {
    const ref = parseDate(input.date);
    const since = new Date(ref.getTime() - 7 * DAY_MS);
    const logs = await prisma.hydrationLog.findMany({
      where: { userId: input.userId, date: { gte: since, lte: ref } },
      orderBy: { date: "desc" },
    });

    if (logs.length === 0) {
      return { available: false, note: "No hydration data logged." };
    }

    const targetMl = 2500;
    const avgMl = round(avg(logs.map((l) => l.ml)), 0);
    const lowDays = logs
      .filter((l) => l.ml < targetMl * 0.75)
      .map((l) => ({ date: l.date.toISOString().slice(0, 10), ml: l.ml }));

    return {
      available: true,
      targetMl,
      avgMlLast7: avgMl,
      lowHydrationDays: lowDays,
    };
  },
};
