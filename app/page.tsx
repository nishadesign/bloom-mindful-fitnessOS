import Link from "next/link";
import {
  BrandMark,
  PageNav,
  PageShell,
} from "./components/PageShell";

export default function Home() {
  return (
    <PageShell
      width="wide"
      nav={
        <PageNav
          leading={
            <div className="flex items-center gap-sm min-w-0">
              <BrandMark />
              <span className="eyebrow hidden sm:inline">
                your mindful FitnessOS
              </span>
            </div>
          }
          trailing={
            <Link href="/integrations" className="btn-ghost shrink-0">
              Get started →
            </Link>
          }
        />
      }
    >
      <section className="mb-xl sm:mb-2xl rise stagger-2">
        <p className="eyebrow mb-md">I — Meet your Bloom</p>
        <h1 className="display text-[44px] sm:text-[68px] md:text-[80px] leading-[1.02] tracking-[-0.025em] text-ink">
          Bloom — <span className="display-italic">mindful</span> FitnessOS.
        </h1>
        <div className="rule my-lg" />
        <p className="text-[16px] sm:text-[18px] leading-[1.6] text-graphite mb-lg">
          Bloom connects with your existing fitness apps and devices to get
          context of your activities, helps you track meals, and generates
          personalized insights — so you can ACTUALLY get closer to your
          fitness goals.
        </p>
        <div className="flex flex-col sm:flex-row gap-sm">
          <Link href="/integrations" className="btn-primary w-full sm:w-auto">
            Get started
          </Link>
        </div>
      </section>

      <section className="mb-xl sm:mb-2xl rise stagger-4">
        <p className="eyebrow mb-md">II — Why Bloom?</p>
        <h2 className="display text-[28px] sm:text-[40px] leading-[1.1] tracking-[-0.02em] text-ink mb-md">
          Most apps see a slice.{" "}
          <span className="display-italic">Bloom sees the whole picture.</span>
        </h2>
        <p className="text-[15px] sm:text-[17px] leading-[1.6] text-graphite mb-lg">
          Your sleep app doesn&apos;t know you ran intervals yesterday. Your
          training app doesn&apos;t know you&apos;re in your luteal phase.
          Your food log doesn&apos;t know you&apos;re chasing a half
          marathon. Bloom reads all of it — together — before it says a
          single word.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm sm:gap-md">
          <WhyCard
            numeral="i."
            title="Every signal, in one place"
            body="Training, sleep, recovery, meals, cycle, and your stated goal — Bloom reads the full picture before it answers. No single app does this."
          />
          <WhyCard
            numeral="ii."
            title="Context that actually matters"
            body="Bloom knows the difference between a tough day because you slept 5 hours and a tough day because you're in late luteal. Most apps can't tell them apart."
          />
          <WhyCard
            numeral="iii."
            title="Advice that fits your body"
            body="Your goal, your training block, your week so far. Insights are personal — not generic score-based nudges everyone else gets."
          />
          <WhyCard
            numeral="iv."
            title="Sources, not black boxes"
            body="Every insight cites what it read — which nights, which sessions, which goal. You can trust it because you can check it."
          />
        </div>
      </section>
    </PageShell>
  );
}

function WhyCard({
  numeral,
  title,
  body,
}: {
  numeral: string;
  title: string;
  body: string;
}) {
  return (
    <article className="card p-md sm:p-lg">
      <span className="numeral block mb-sm">{numeral}</span>
      <h4 className="display text-[20px] sm:text-[22px] leading-[1.2] tracking-[-0.015em] text-ink mb-sm">
        {title}
      </h4>
      <p className="text-[14px] sm:text-[15px] leading-[1.6] text-graphite">
        {body}
      </p>
    </article>
  );
}
