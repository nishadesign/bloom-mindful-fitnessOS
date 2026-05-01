import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const DAY_MS = 24 * 60 * 60 * 1000;
const USER_ID = 1;

function dayAt(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  return new Date(d.getTime() - daysAgo * DAY_MS);
}

function rand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

async function wipe() {
  await prisma.habitNudge.deleteMany({ where: { userId: USER_ID } });
  await prisma.planDay.deleteMany({ where: { userId: USER_ID } });
  await prisma.insight.deleteMany({ where: { userId: USER_ID } });
  await prisma.nutritionLog.deleteMany({ where: { userId: USER_ID } });
  await prisma.hydrationLog.deleteMany({ where: { userId: USER_ID } });
  await prisma.cycleEvent.deleteMany({ where: { userId: USER_ID } });
  await prisma.goal.deleteMany({ where: { userId: USER_ID } });
  await prisma.activity.deleteMany({ where: { userId: USER_ID } });
  await prisma.sleepLog.deleteMany({ where: { userId: USER_ID } });
  await prisma.integration.deleteMany({ where: { userId: USER_ID } });
}

async function main() {
  await wipe();

  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {
      name: "Jordan",
      goal: "Run a sub-25 5K",
      ageYears: 34,
      sex: "M",
      heightCm: 178,
      weightKg: 72,
      calorieTargetKcal: 2500,
    },
    create: {
      id: USER_ID,
      name: "Jordan",
      goal: "Run a sub-25 5K",
      ageYears: 34,
      sex: "M",
      heightCm: 178,
      weightKg: 72,
      calorieTargetKcal: 2500,
    },
  });

  await prisma.goal.create({
    data: {
      userId: USER_ID,
      type: "race_time",
      target: "sub-25 5K",
      targetDate: new Date(Date.now() + 42 * DAY_MS),
    },
  });

  await prisma.integration.create({
    data: { userId: USER_ID, provider: "oura", status: "connected" },
  });
  await prisma.integration.create({
    data: { userId: USER_ID, provider: "strava", status: "connected" },
  });

  // 60 days of Oura sleep. HRV baseline ~55, drops to 40–45 past 10 days.
  // Two short nights this week. Readiness trending down.
  const r = rand(42);
  for (let i = 0; i < 60; i++) {
    const daysAgo = i;
    const date = dayAt(daysAgo);
    const recent = daysAgo <= 10;
    const veryRecent = daysAgo <= 6;

    const baseHrv = recent ? 43 : 55;
    const hrv = baseHrv + (r() - 0.5) * 6;

    let totalMin = 7.5 * 60 + (r() - 0.5) * 40;
    if (veryRecent && (daysAgo === 1 || daysAgo === 4)) {
      totalMin = 5.5 * 60 + r() * 15;
    }
    if (recent) totalMin -= 20;

    const deep = Math.round(totalMin * 0.17);
    const rem = Math.round(totalMin * 0.22);
    const awake = Math.round(12 + r() * 10);
    const light = Math.round(totalMin - deep - rem - awake);

    const readiness = Math.round(
      recent ? 58 + (r() - 0.5) * 10 : 78 + (r() - 0.5) * 10,
    );
    const sleepScore = Math.round(
      recent ? 68 + (r() - 0.5) * 12 : 82 + (r() - 0.5) * 10,
    );
    const restingHr = recent ? 56 + (r() - 0.5) * 3 : 52 + (r() - 0.5) * 3;

    await prisma.sleepLog.create({
      data: {
        userId: USER_ID,
        source: "oura",
        date,
        totalMinutes: Math.round(totalMin),
        deepMinutes: deep,
        remMinutes: rem,
        lightMinutes: light,
        awakeMinutes: awake,
        hrvMs: Math.round(hrv * 10) / 10,
        restingHr: Math.round(restingHr * 10) / 10,
        readinessScore: readiness,
        sleepScore,
      },
    });
  }

  // 60 days of Strava runs. Pattern: 4 runs/week. Days 0/1/3/5 of each week.
  // 5K base progression goal, weekly long run ~10-14km, one tempo session.
  // Last 7 days: missed tempo (day 4) and missed long run (day 2).
  const r2 = rand(99);
  const skipDaysAgo = new Set([3, 5]); // missed tempo and long this past week
  for (let i = 0; i < 60; i++) {
    const daysAgo = i;
    if (skipDaysAgo.has(daysAgo)) continue;
    const dow = daysAgo % 7;
    // Run days: 0 (today, if not skipped), 1 easy, 3 tempo, 5 long
    const isRunDay = dow === 0 || dow === 1 || dow === 3 || dow === 5;
    if (!isRunDay) continue;
    if (daysAgo === 0) continue; // today — no run logged yet

    let distanceMeters: number;
    let sportType = "Run";
    let name: string;
    let movingSeconds: number;
    let avgHr: number;

    if (dow === 5) {
      // long run
      distanceMeters = 11000 + r2() * 3000;
      movingSeconds = Math.round((distanceMeters / 1000) * 320);
      name = "Long run";
      avgHr = 148 + r2() * 6;
    } else if (dow === 3) {
      // tempo
      distanceMeters = 7500 + r2() * 1500;
      movingSeconds = Math.round((distanceMeters / 1000) * 260);
      name = "Tempo";
      avgHr = 162 + r2() * 4;
    } else {
      // easy
      distanceMeters = 5000 + r2() * 2000;
      movingSeconds = Math.round((distanceMeters / 1000) * 340);
      name = "Easy run";
      avgHr = 140 + r2() * 6;
    }

    await prisma.activity.create({
      data: {
        userId: USER_ID,
        source: "strava",
        externalId: `seed-${daysAgo}`,
        type: "Run",
        sportType,
        name,
        startDate: dayAt(daysAgo),
        distanceMeters: Math.round(distanceMeters),
        movingSeconds,
        elapsedSeconds: movingSeconds + Math.round(r2() * 60),
        elevationGain: Math.round(r2() * 80),
        avgHeartrate: Math.round(avgHr),
        maxHeartrate: Math.round(avgHr + 12),
        avgSpeed: distanceMeters / movingSeconds,
        calories: Math.round((distanceMeters / 1000) * 70),
      },
    });
  }

  // 14 days of nutrition. Target ~2500 kcal / 130g protein.
  // Three recent low-protein days (<70g) clustered in last 6 days.
  const lowProteinDays = new Set([1, 3, 5]);
  const r3 = rand(7);
  for (let i = 0; i < 14; i++) {
    const low = lowProteinDays.has(i);
    const kcal = low ? 1750 + Math.round(r3() * 200) : 2400 + Math.round(r3() * 250);
    const proteinG = low ? 55 + Math.round(r3() * 10) : 120 + Math.round(r3() * 20);
    await prisma.nutritionLog.create({
      data: {
        userId: USER_ID,
        date: dayAt(i),
        kcal,
        proteinG,
        notes: low ? "light day, skipped dinner protein" : null,
      },
    });
  }

  // 14 days of hydration. Baseline ~2600ml, last 3 days ~1600ml.
  const r4 = rand(13);
  for (let i = 0; i < 14; i++) {
    const low = i <= 2;
    const ml = low ? 1500 + Math.round(r4() * 300) : 2500 + Math.round(r4() * 400);
    await prisma.hydrationLog.create({
      data: { userId: USER_ID, date: dayAt(i), ml },
    });
  }

  // Today's planned workout: 6×800m tempo.
  await prisma.planDay.create({
    data: {
      userId: USER_ID,
      date: dayAt(0),
      plannedWorkout: "Tempo — 6×800m @ 5K pace w/ 2min jog recovery",
    },
  });

  console.log("Seeded Jordan (id=1) with 60d sleep/runs, 14d nutrition/hydration, goal, plan.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
