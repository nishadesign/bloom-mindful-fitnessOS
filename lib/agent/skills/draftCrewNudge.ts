import { z } from "zod";

const inputSchema = z.object({
  userId: z.number().int(),
  topic: z
    .string()
    .describe(
      "Short topic string: e.g. 'missed long run', 'tempo win', 'nutrition streak'.",
    ),
  detail: z
    .string()
    .optional()
    .describe("Optional extra detail the nudge should mention."),
});

export const draftCrewNudge = {
  name: "draftCrewNudge",
  description:
    "Draft a one-line shareable nudge the user could post to their crew/pod. Keep it warm and specific, not generic hype. Use when social accountability is relevant.",
  inputSchema,
  async handler(input: z.infer<typeof inputSchema>) {
    const topic = input.topic.trim();
    const detail = input.detail?.trim();

    const line = detail
      ? `${topic} — ${detail}. Who's in this week?`
      : `${topic}. Accountability check — who's running with me this week?`;

    return {
      shareable: line,
      suggestedChannels: ["pod_chat", "strava_club"],
    };
  },
};
