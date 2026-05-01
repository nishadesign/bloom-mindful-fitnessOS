import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseDate, userIdAndDateSchema } from "./shared";

export const getCyclePhase = {
  name: "getCyclePhase",
  description:
    "Return the user's menstrual cycle phase on a given date if cycle data exists, otherwise null. Not all users have cycle data — a null response is expected and the agent should not invent one.",
  inputSchema: userIdAndDateSchema,
  async handler(input: z.infer<typeof userIdAndDateSchema>) {
    const ref = parseDate(input.date);
    const evt = await prisma.cycleEvent.findFirst({
      where: {
        userId: input.userId,
        startDate: { lte: ref },
        OR: [{ endDate: null }, { endDate: { gte: ref } }],
      },
      orderBy: { startDate: "desc" },
    });

    if (!evt) {
      return {
        available: false,
        phase: null,
        note: "No cycle data for this user.",
      };
    }
    return {
      available: true,
      phase: evt.phase,
      startDate: evt.startDate.toISOString().slice(0, 10),
      endDate: evt.endDate?.toISOString().slice(0, 10) ?? null,
    };
  },
};
