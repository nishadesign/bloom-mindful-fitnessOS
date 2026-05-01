import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idRaw } = await params;
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid insight id" }, { status: 400 });
    }

    const insight = await prisma.insight.findFirst({
      where: { id, userId: DEMO_USER_ID },
    });
    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    const traces = await prisma.agentTrace.findMany({
      where: { insightId: id },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ insight, traces });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("/api/insights/[id] GET failed:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
