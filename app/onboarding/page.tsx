import OnboardingForm from "../components/OnboardingForm";
import {
  BrandMark,
  PageNav,
  PageShell,
  StepIndicator,
} from "../components/PageShell";
import { getDemoUser } from "@/lib/user";
import { prisma } from "@/lib/db";
import type { Sex, WeightGoal } from "@/lib/calories";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getDemoUser();

  const ouraRow = await prisma.integration.findUnique({
    where: { userId_provider: { userId: user.id, provider: "oura" } },
  });
  const ouraConnected = ouraRow?.status === "connected";
  const bioFromOura =
    ouraConnected &&
    user.ageYears != null &&
    user.sex != null &&
    user.heightCm != null &&
    user.weightKg != null;

  return (
    <PageShell
      width="default"
      nav={
        <PageNav
          leading={<BrandMark />}
          trailing={<StepIndicator current={2} total={2} />}
        />
      }
    >
      <section className="rise stagger-2">
        <div className="card p-md sm:p-lg">
          <OnboardingForm
            defaults={{
              name: user.name,
              ageYears: user.ageYears,
              heightCm: user.heightCm,
              weightKg: user.weightKg,
              sex: user.sex as Sex | null,
              weightGoal: user.weightGoal as WeightGoal | null,
              goal: user.goal,
            }}
            bioFromOura={bioFromOura}
          />
        </div>
      </section>
    </PageShell>
  );
}
