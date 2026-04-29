"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TypewriterInsight from "./TypewriterInsight";

type Props = {
  welcome: boolean;
  insightHeadline: string;
  insightSupport?: string;
  calorieTotal: number | null;
};

const SYNC_MS = 1800;
const INSIGHT_DELAY_MS = 900;

export default function DashboardReveal({
  welcome,
  insightHeadline,
  insightSupport,
  calorieTotal,
}: Props) {
  const [sessionLoaded, setSessionLoaded] = useState(!welcome);
  const [insightVisible, setInsightVisible] = useState(!welcome);

  useEffect(() => {
    if (!welcome) return;
    const t1 = setTimeout(() => setSessionLoaded(true), SYNC_MS);
    const t2 = setTimeout(
      () => setInsightVisible(true),
      SYNC_MS + INSIGHT_DELAY_MS,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [welcome]);

  return (
    <>
      <section
        className="mb-lg"
        style={{
          minHeight: welcome ? 180 : undefined,
          opacity: insightVisible ? 1 : 0,
          transform: insightVisible ? "translateY(0)" : "translateY(8px)",
          transition:
            "opacity 520ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 520ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        aria-hidden={!insightVisible}
      >
        {insightVisible && (
          <Link
            href="/coach?topic=insight"
            className={
              "card-soft card-hover block p-md sm:p-lg group" +
              (welcome ? " insight-glow" : "")
            }
          >
            {welcome ? (
              <TypewriterInsight
                headline={insightHeadline}
                support={insightSupport}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-sm mb-xs">
                  <p className="display text-[24px] sm:text-[30px] leading-[1.2] tracking-[-0.015em] text-ink max-w-[40ch]">
                    {insightHeadline}
                  </p>
                  <span className="text-[13px] text-ink group-hover:text-graphite transition-colors whitespace-nowrap shrink-0">
                    Ask Bloom AI →
                  </span>
                </div>
                {insightSupport && (
                  <p className="text-[14px] sm:text-[15px] leading-[1.6] text-graphite mt-sm max-w-[56ch]">
                    {insightSupport}
                  </p>
                )}
              </>
            )}
          </Link>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-lg rise stagger-5">
        <article className="card p-md sm:p-lg">
          {sessionLoaded ? <LastSession /> : <SyncingSession />}
        </article>

        <article className="card p-md sm:p-lg flex flex-col">
          {calorieTotal != null ? (
            <CalorieBudget total={calorieTotal} addHref="/meals" />
          ) : (
            <EmptyCalories />
          )}
        </article>
      </section>
    </>
  );
}

function SyncingSession() {
  return (
    <div className="flex items-center gap-sm">
      <span
        aria-hidden
        className="inline-block rounded-full animate-pulse"
        style={{
          width: 10,
          height: 10,
          background: "var(--color-sand-deep)",
        }}
      />
      <div>
        <p className="text-[15px] sm:text-[16px] text-ink">
          Syncing last workout session…
        </p>
        <p className="text-[12px] text-smoke mt-[2px]">
          Pulling from Strava.
        </p>
      </div>
    </div>
  );
}

function LastSession() {
  return (
    <div className="fade">
      <p className="text-[13px] text-smoke mb-xs">Last session</p>
      <p className="display text-[22px] sm:text-[24px] tracking-[-0.015em] text-ink mb-xs leading-[1.2]">
        Easy shakeout run
      </p>
      <p className="text-[13px] text-smoke mb-md">Run · yesterday</p>
      <dl className="flex flex-wrap gap-md">
        <Stat label="Distance" value="6.20 km" />
        <Stat label="Time" value="38 min" />
        <Stat label="Pace" value="6:08/km" />
        <Stat label="Avg HR" value="142" />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dd className="stat-med text-[22px] sm:text-[24px] text-ink">{value}</dd>
      <dt className="text-[12px] text-smoke mt-[2px]">{label}</dt>
    </div>
  );
}

function CalorieBudget({
  total,
  addHref,
}: {
  total: number;
  addHref: string;
}) {
  return (
    <>
      <div className="flex items-start justify-end gap-sm mb-xs">
        <Link
          href={addHref}
          className="text-[13px] text-ink hover:text-graphite transition-colors whitespace-nowrap shrink-0"
        >
          + Add
        </Link>
      </div>
      <p className="stat-big text-[44px] sm:text-[56px] text-ink leading-[0.95]">
        0
        <span className="text-[20px] sm:text-[24px] text-graphite">
          {" "}/{" "}{total.toLocaleString()}
        </span>
        <span className="text-[16px] sm:text-[18px] ml-xs text-graphite">
          kcal
        </span>
      </p>
      <p className="text-[12px] text-smoke mt-sm">
        Nothing logged yet today.
      </p>
    </>
  );
}

function EmptyCalories() {
  return (
    <>
      <p className="text-[13px] text-smoke mb-xs">Today&apos;s meals</p>
      <p className="text-[15px] text-graphite">Tell Bloom a bit more.</p>
      <p className="text-[13px] text-smoke mt-xs leading-[1.55]">
        <Link href="/onboarding" className="underline underline-offset-2">
          Finish onboarding
        </Link>{" "}
        to set your baseline.
      </p>
    </>
  );
}
