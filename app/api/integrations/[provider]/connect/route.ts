import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/user";
import { providerById } from "@/lib/providers";
import { seedMockOura } from "@/lib/mockOura";
import { calorieTarget, isValidInputs, type Sex, type WeightGoal } from "@/lib/calories";

// Bio "pulled" from Oura. Real Oura exposes age/sex/height/weight on its user
// endpoint; we mock it here so the demo shows the "Bloom already knows this"
// moment without actually hitting Oura's API.
const OURA_MOCK_BIO = {
  ageYears: 28,
  sex: "female" as const,
  heightCm: 165,
  weightKg: 56,
};

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!providerById(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const row = await prisma.integration.upsert({
    where: { userId_provider: { userId: DEMO_USER_ID, provider } },
    update: {
      status: "connected",
      connectedAt: new Date(),
      disconnectedAt: null,
    },
    create: {
      userId: DEMO_USER_ID,
      provider,
      status: "connected",
    },
  });

  let seeded = 0;
  let pulledBio: typeof OURA_MOCK_BIO | null = null;
  if (provider === "oura") {
    seeded = await seedMockOura(DEMO_USER_ID);

    // Write Oura-derived bio onto the user, but only overwrite fields the
    // user hasn't filled in themselves. Their manual entries always win.
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: DEMO_USER_ID },
    });
    const patch: Record<string, unknown> = {};
    if (user.ageYears == null) patch.ageYears = OURA_MOCK_BIO.ageYears;
    if (user.sex == null) patch.sex = OURA_MOCK_BIO.sex;
    if (user.heightCm == null) patch.heightCm = OURA_MOCK_BIO.heightCm;
    if (user.weightKg == null) patch.weightKg = OURA_MOCK_BIO.weightKg;

    if (Object.keys(patch).length > 0) {
      const merged = { ...user, ...patch } as typeof user;
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
          merged.weightGoal as WeightGoal,
        );
        patch.calorieTargetKcal = target;
      }
      await prisma.user.update({ where: { id: DEMO_USER_ID }, data: patch });
    }

    pulledBio = OURA_MOCK_BIO;
  }

  return NextResponse.json({ ok: true, integration: row, seeded, pulledBio });
}
