import { z } from "zod";

export const DAY_MS = 24 * 60 * 60 * 1000;

export const userIdSchema = z.object({
  userId: z.number().int().describe("Bloom user id"),
});

export const userIdAndDateSchema = z.object({
  userId: z.number().int().describe("Bloom user id"),
  date: z
    .string()
    .optional()
    .describe("ISO date (YYYY-MM-DD). Defaults to today."),
});

export function parseDate(date: string | undefined): Date {
  if (!date) {
    const d = new Date();
    d.setUTCHours(12, 0, 0, 0);
    return d;
  }
  const d = new Date(date);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

export function daysAgo(d: Date, ref: Date = new Date()): number {
  return Math.floor((ref.getTime() - d.getTime()) / DAY_MS);
}

export function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function round(n: number, dp = 1): number {
  const m = Math.pow(10, dp);
  return Math.round(n * m) / m;
}
