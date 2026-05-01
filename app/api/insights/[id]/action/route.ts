import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["accepted", "dismissed"]),
});

type ToolCallRecord = {
  name: string;
  input: unknown;
  output: unknown;
  ok: boolean;
};

type AdjustmentOutput = {
  planned?: string;
  adjusted?: string;
  reasons?: string[];
  recommendation?: string;
};

function findAdjustment(
  sourceRefs: string,
): {
  adjusted: string;
  reason: string;
  planned: string | null;
  date: Date;
} | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(sourceRefs);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const records = parsed as ToolCallRecord[];
  const call = records.find(
    (r) => r.name === "proposeAdjustment" && r.ok && r.output,
  );
  if (!call) return null;
  const out = call.output as AdjustmentOutput;
  if (!out.adjusted || !out.reasons || out.reasons.length === 0) return null;
  if (out.recommendation === "keep") return null;

  const input = (call.input as { date?: string } | null) ?? {};
  const date = input.date ? new Date(input.date) : new Date();
  date.setHours(0, 0, 0, 0);

  return {
    adjusted: out.adjusted,
    reason: out.reasons[0],
    planned: out.planned ?? null,
    date,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idRaw } = await params;
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid insight id" }, { status: 400 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accepted' or 'dismissed'." },
        { status: 400 },
      );
    }

    const existing = await prisma.insight.findFirst({
      where: { id, userId: DEMO_USER_ID },
    });
    if (!existing) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    const updated = await prisma.insight.update({
      where: { id },
      data: {
        action: parsed.data.action,
        actedAt: new Date(),
      },
    });

    let planDay = null;
    if (parsed.data.action === "accepted") {
      const adjustment = findAdjustment(existing.sourceRefs);
      if (adjustment) {
        const DAY_MS = 24 * 60 * 60 * 1000;
        const existingPlan = await prisma.planDay.findFirst({
          where: {
            userId: DEMO_USER_ID,
            date: {
              gte: new Date(adjustment.date.getTime() - DAY_MS),
              lte: new Date(adjustment.date.getTime() + DAY_MS),
            },
          },
          orderBy: { date: "desc" },
        });

        if (existingPlan) {
          planDay = await prisma.planDay.update({
            where: { id: existingPlan.id },
            data: {
              adjustedWorkout: adjustment.adjusted,
              adjustmentReason: adjustment.reason,
              insightId: id,
            },
          });
        } else {
          planDay = await prisma.planDay.create({
            data: {
              userId: DEMO_USER_ID,
              date: adjustment.date,
              plannedWorkout: adjustment.planned ?? "rest",
              adjustedWorkout: adjustment.adjusted,
              adjustmentReason: adjustment.reason,
              insightId: id,
            },
          });
        }
      }
    }

    return NextResponse.json({ insight: updated, planDay });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("/api/insights/[id]/action failed:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
