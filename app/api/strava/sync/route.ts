import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/user";
import { refreshIfNeeded, fetchActivities } from "@/lib/strava";

export async function POST() {
  try {
    const accessToken = await refreshIfNeeded(DEMO_USER_ID);
    const fourteenDaysAgo =
      Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 14;
    const activities = await fetchActivities(accessToken, fourteenDaysAgo);

    let upserted = 0;
    for (const a of activities) {
      await prisma.activity.upsert({
        where: {
          source_externalId: { source: "strava", externalId: String(a.id) },
        },
        update: {},
        create: {
          source: "strava",
          externalId: String(a.id),
          userId: DEMO_USER_ID,
          type: a.type,
          sportType: a.sport_type,
          name: a.name,
          startDate: new Date(a.start_date),
          distanceMeters: a.distance,
          movingSeconds: a.moving_time,
          elapsedSeconds: a.elapsed_time,
          elevationGain: a.total_elevation_gain,
          avgHeartrate: a.average_heartrate ?? null,
          maxHeartrate: a.max_heartrate ?? null,
          avgSpeed: a.average_speed ?? null,
          calories: a.calories ?? null,
          description: a.description ?? null,
        },
      });
      upserted++;
    }

    return NextResponse.json({ synced: upserted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
