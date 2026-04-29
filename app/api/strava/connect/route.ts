import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/strava";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(buildAuthUrl(origin));
}
