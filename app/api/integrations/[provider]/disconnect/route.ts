import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/user";
import { providerById } from "@/lib/providers";
import { clearMockOura } from "@/lib/mockOura";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!providerById(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const existing = await prisma.integration.findUnique({
    where: { userId_provider: { userId: DEMO_USER_ID, provider } },
  });

  if (!existing) {
    return NextResponse.json({ ok: true, integration: null });
  }

  const row = await prisma.integration.update({
    where: { userId_provider: { userId: DEMO_USER_ID, provider } },
    data: {
      status: "disconnected",
      disconnectedAt: new Date(),
    },
  });

  if (provider === "oura") {
    await clearMockOura(DEMO_USER_ID);
  }

  if (provider === "strava") {
    await prisma.activity.deleteMany({
      where: { userId: DEMO_USER_ID, source: "strava" },
    });
    await prisma.integration.update({
      where: { userId_provider: { userId: DEMO_USER_ID, provider } },
      data: { metaJson: null },
    });
  }

  return NextResponse.json({ ok: true, integration: row });
}
