import { prisma } from "./db";

type Night = {
  totalMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  lightMinutes: number;
  awakeMinutes: number;
  hrvMs: number;
  restingHr: number;
  readinessScore: number;
  sleepScore: number;
  bodyTempDelta: number;
};

// 14 nights, most-recent last. Tuned for a narrative: two bad nights mid-week
// (readiness dip + HRV suppressed), recovery by the weekend, a poor Thursday
// that would explain a rough Friday tempo run. Plausible values for a 28yo
// ~56kg female runner.
const NIGHTS: Night[] = [
  n(7 * 60 + 12, 74, 92, 298, 18, 52.3, 58, 82, 84, -0.1),
  n(6 * 60 + 48, 62, 88, 272, 26, 48.7, 60, 76, 79, 0.1),
  n(5 * 60 + 58, 44, 72, 228, 34, 41.2, 64, 62, 68, 0.3),
  n(7 * 60 + 5, 69, 95, 284, 17, 51.8, 57, 80, 83, -0.1),
  n(8 * 60 + 2, 82, 106, 310, 14, 55.4, 55, 88, 91, -0.2),
  n(6 * 60 + 30, 55, 80, 270, 25, 46.1, 61, 71, 75, 0.2),
  n(7 * 60 + 18, 71, 92, 298, 17, 53.0, 56, 83, 85, 0.0),
  n(6 * 60 + 52, 64, 85, 274, 29, 49.3, 59, 78, 80, 0.1),
  n(5 * 60 + 12, 38, 64, 208, 42, 38.5, 66, 54, 60, 0.5),
  n(4 * 60 + 48, 32, 58, 198, 50, 35.2, 68, 48, 55, 0.7),
  n(6 * 60 + 20, 52, 78, 264, 26, 45.8, 62, 68, 72, 0.3),
  n(7 * 60 + 40, 76, 98, 302, 16, 53.6, 56, 84, 86, 0.0),
  n(7 * 60 + 25, 72, 94, 294, 19, 52.1, 57, 82, 84, -0.1),
  n(6 * 60 + 15, 50, 78, 258, 29, 45.4, 60, 69, 73, 0.2),
];

function n(
  totalMinutes: number,
  deepMinutes: number,
  remMinutes: number,
  lightMinutes: number,
  awakeMinutes: number,
  hrvMs: number,
  restingHr: number,
  readinessScore: number,
  sleepScore: number,
  bodyTempDelta: number,
): Night {
  return {
    totalMinutes,
    deepMinutes,
    remMinutes,
    lightMinutes,
    awakeMinutes,
    hrvMs,
    restingHr,
    readinessScore,
    sleepScore,
    bodyTempDelta,
  };
}

function dateNDaysAgoAtNoonUTC(daysAgo: number) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

export async function seedMockOura(userId: number) {
  const days = NIGHTS.length;
  let written = 0;
  for (let i = 0; i < days; i++) {
    const night = NIGHTS[i];
    const date = dateNDaysAgoAtNoonUTC(days - 1 - i);
    await prisma.sleepLog.upsert({
      where: {
        userId_source_date: { userId, source: "oura", date },
      },
      update: {
        totalMinutes: night.totalMinutes,
        deepMinutes: night.deepMinutes,
        remMinutes: night.remMinutes,
        lightMinutes: night.lightMinutes,
        awakeMinutes: night.awakeMinutes,
        hrvMs: night.hrvMs,
        restingHr: night.restingHr,
        readinessScore: night.readinessScore,
        sleepScore: night.sleepScore,
        bodyTempDelta: night.bodyTempDelta,
      },
      create: {
        userId,
        source: "oura",
        date,
        totalMinutes: night.totalMinutes,
        deepMinutes: night.deepMinutes,
        remMinutes: night.remMinutes,
        lightMinutes: night.lightMinutes,
        awakeMinutes: night.awakeMinutes,
        hrvMs: night.hrvMs,
        restingHr: night.restingHr,
        readinessScore: night.readinessScore,
        sleepScore: night.sleepScore,
        bodyTempDelta: night.bodyTempDelta,
      },
    });
    written++;
  }
  return written;
}

export async function clearMockOura(userId: number) {
  const { count } = await prisma.sleepLog.deleteMany({
    where: { userId, source: "oura" },
  });
  return count;
}
