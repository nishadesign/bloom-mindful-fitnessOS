import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  fetchActivities,
  saveStravaTokens,
} from "@/lib/strava";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/user";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const token = await exchangeCode(code);
    await saveStravaTokens(DEMO_USER_ID, {
      athleteId: String(token.athlete.id),
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at,
    });

    // Sync the last 14 days right away so the coach has data before the user
    // navigates anywhere. Failures here shouldn't block the redirect.
    try {
      const fourteenDaysAgo =
        Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 14;
      const activities = await fetchActivities(token.access_token, fourteenDaysAgo);
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
      }
    } catch (syncErr) {
      console.error("Strava initial sync failed:", syncErr);
    }

    const dest = new URL("/integrations?strava=connected", req.url);
    return NextResponse.redirect(dest);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
