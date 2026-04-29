import { prisma } from "./db";

const STRAVA_API = "https://www.strava.com/api/v3";
const STRAVA_OAUTH = "https://www.strava.com/oauth/token";

export type StravaTokens = {
  athleteId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_speed?: number;
  calories?: number;
  description?: string;
};

export function buildAuthUrl(requestOrigin?: string) {
  const fallback = requestOrigin
    ? `${requestOrigin}/api/strava/callback`
    : "";
  const redirectUri = process.env.STRAVA_REDIRECT_URI || fallback;
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string) {
  const res = await fetch(STRAVA_OAUTH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: { id: number; firstname?: string; lastname?: string };
  }>;
}

export async function saveStravaTokens(
  userId: number,
  tokens: StravaTokens,
) {
  const metaJson = JSON.stringify(tokens);
  await prisma.integration.upsert({
    where: { userId_provider: { userId, provider: "strava" } },
    update: {
      status: "connected",
      connectedAt: new Date(),
      disconnectedAt: null,
      metaJson,
    },
    create: {
      userId,
      provider: "strava",
      status: "connected",
      metaJson,
    },
  });
}

export async function loadStravaTokens(
  userId: number,
): Promise<StravaTokens | null> {
  const row = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "strava" } },
  });
  if (!row || row.status !== "connected" || !row.metaJson) return null;
  try {
    return JSON.parse(row.metaJson) as StravaTokens;
  } catch {
    return null;
  }
}

export async function refreshIfNeeded(userId: number): Promise<string> {
  const tokens = await loadStravaTokens(userId);
  if (!tokens) throw new Error("Strava not connected");

  const now = Math.floor(Date.now() / 1000);
  if (tokens.expiresAt - 60 > now) return tokens.accessToken;

  const res = await fetch(STRAVA_OAUTH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: tokens.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Strava refresh failed: ${res.status}`);
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  await saveStravaTokens(userId, {
    athleteId: tokens.athleteId,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  });
  return data.access_token;
}

export async function fetchActivities(
  accessToken: string,
  afterEpoch: number,
): Promise<StravaActivity[]> {
  const url = `${STRAVA_API}/athlete/activities?after=${afterEpoch}&per_page=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status}`);
  return res.json() as Promise<StravaActivity[]>;
}
