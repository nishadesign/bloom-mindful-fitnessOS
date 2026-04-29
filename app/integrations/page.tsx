import ProviderCard from "../components/ProviderCard";
import {
  BackLink,
  PageHeader,
  PageNav,
  PageShell,
  StepIndicator,
} from "../components/PageShell";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDemoUser } from "@/lib/user";
import { PROVIDERS } from "@/lib/providers";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const user = await getDemoUser();

  const integrations = await prisma.integration.findMany({
    where: { userId: user.id },
  });
  const byProvider = new Map(integrations.map((r) => [r.provider, r]));
  const connectedCount = integrations.filter(
    (r) => r.status === "connected",
  ).length;

  return (
    <PageShell
      width="default"
      nav={
        <PageNav
          leading={<BackLink href="/" />}
          trailing={<StepIndicator current={1} total={2} />}
        />
      }
    >
      <PageHeader
        align="center"
        eyebrow="I — Connect your apps"
        title={
          <>
            Connect your apps,{" "}
            <span className="display-italic">once.</span>
          </>
        }
        lede={
          connectedCount === 0
            ? "Flip one on to start. Bloom pulls the rest."
            : "Add the others when you're ready."
        }
      />

      <section className="mb-lg rise stagger-3">
        <div className="flex flex-col gap-sm">
          {PROVIDERS.map((p) => {
            const row = byProvider.get(p.id);
            const connected = row?.status === "connected";
            return (
              <ProviderCard
                key={p.id}
                provider={p}
                connected={!!connected}
              />
            );
          })}
        </div>
      </section>

      <section className="rise stagger-5 flex justify-center">
        <Link href="/onboarding" className="btn-primary w-full sm:w-auto">
          Next →
        </Link>
      </section>
    </PageShell>
  );
}
