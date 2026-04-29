import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/user";
import {
  calorieTarget,
  isValidInputs,
  type Sex,
  type WeightGoal,
} from "@/lib/calories";

type Body = {
  name?: string;
  ageYears?: number;
  heightCm?: number;
  weightKg?: number;
  sex?: Sex;
  weightGoal?: WeightGoal;
  goal?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim())
    data.name = body.name.trim();
  if (typeof body.goal === "string" && body.goal.trim())
    data.goal = body.goal.trim();
  if (typeof body.ageYears === "number" && body.ageYears > 0)
    data.ageYears = Math.floor(body.ageYears);
  if (typeof body.heightCm === "number" && body.heightCm > 0)
    data.heightCm = body.heightCm;
  if (typeof body.weightKg === "number" && body.weightKg > 0)
    data.weightKg = body.weightKg;
  if (body.sex === "male" || body.sex === "female") data.sex = body.sex;
  if (
    body.weightGoal === "maintain" ||
    body.weightGoal === "lose" ||
    body.weightGoal === "gain"
  )
    data.weightGoal = body.weightGoal;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Load current user so we can compute target from the merged state.
  const current = await prisma.user.findUniqueOrThrow({
    where: { id: DEMO_USER_ID },
  });

  const merged = { ...current, ...data } as typeof current;
  if (
    isValidInputs({
      sex: merged.sex as Sex | undefined,
      ageYears: merged.ageYears ?? undefined,
      heightCm: merged.heightCm ?? undefined,
      weightKg: merged.weightKg ?? undefined,
    }) &&
    (merged.weightGoal === "maintain" ||
      merged.weightGoal === "lose" ||
      merged.weightGoal === "gain")
  ) {
    const { target } = calorieTarget(
      {
        sex: merged.sex as Sex,
        ageYears: merged.ageYears!,
        heightCm: merged.heightCm!,
        weightKg: merged.weightKg!,
      },
      merged.weightGoal,
    );
    data.calorieTargetKcal = target;
  }

  const user = await prisma.user.update({
    where: { id: DEMO_USER_ID },
    data,
  });

  return NextResponse.json({ ok: true, user });
}
