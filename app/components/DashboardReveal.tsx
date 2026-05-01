"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  welcome: boolean;
  calorieTotal: number | null;
};

const SYNC_MS = 1800;

export default function DashboardReveal({ welcome, calorieTotal }: Props) {
  const [sessionLoaded, setSessionLoaded] = useState(!welcome);

  useEffect(() => {
    if (!welcome) return;
    const t = setTimeout(() => setSessionLoaded(true), SYNC_MS);
    return () => clearTimeout(t);
  }, [welcome]);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-lg rise stagger-6">
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
