"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MarkdownText from "./MarkdownText";

type Trace = {
  id: number;
  skillName: string;
  input: string;
  output: string;
  ok: boolean;
  errorMessage: string | null;
  latencyMs: number;
  createdAt: string;
};

type InsightRecord = {
  id: number;
  title: string;
  body: string;
  sourceRefs: string;
  action: string;
  createdAt: string;
};

type Payload = {
  insight: InsightRecord;
  traces: Trace[];
};

type Props = {
  insightId: number;
  question: string;
  onClose: () => void;
};

export default function InsightDrawer({ insightId, question, onClose }: Props) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/insights/${insightId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Failed to load insight");
          return;
        }
        setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [insightId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  const body = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Insight reasoning"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 31, 23, 0.35)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          border: 0,
          cursor: "pointer",
        }}
      />
      <aside
        className="card"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          height: "100%",
          overflowY: "auto",
          borderRadius: 0,
          borderLeft: "1px solid var(--color-linen)",
          borderTop: 0,
          borderRight: 0,
          borderBottom: 0,
          background: "var(--color-paper)",
          padding: "var(--spacing-lg) var(--spacing-md)",
        }}
      >
        <div className="flex items-start justify-between gap-sm mb-md">
          <p className="eyebrow">Bloom · reasoning</p>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-smoke hover:text-ink transition-colors"
            aria-label="Close drawer"
          >
            Close
          </button>
        </div>

        <h2 className="display text-[24px] sm:text-[28px] leading-[1.2] tracking-[-0.015em] text-ink mb-md max-w-[40ch]">
          {question}
        </h2>

        {error && (
          <p className="text-[14px] text-sand-deep">Couldn&apos;t load: {error}</p>
        )}

        {!error && !data && (
          <p className="text-[13px] text-smoke">Loading…</p>
        )}

        {data && (
          <>
            <div className="card-soft p-md mb-lg">
              <p className="eyebrow mb-xs">Bloom&apos;s read</p>
              <MarkdownText
                text={data.insight.body}
                className="text-[14px] sm:text-[15px] leading-[1.65] text-ink"
              />
            </div>

            <p className="eyebrow mb-sm">What Bloom read</p>
            <div className="flex flex-col gap-sm">
              {data.traces.map((t) => (
                <SourceCard key={t.id} trace={t} />
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );

  return createPortal(body, document.body);
}

type ParsedTrace = {
  name: string;
  output: unknown;
  ok: boolean;
  errorMessage: string | null;
};

function parseTrace(trace: Trace): ParsedTrace {
  let output: unknown = null;
  try {
    output = JSON.parse(trace.output);
  } catch {
    output = trace.output;
  }
  return {
    name: trace.skillName,
    output,
    ok: trace.ok,
    errorMessage: trace.errorMessage,
  };
}

function SourceCard({ trace }: { trace: Trace }) {
  const parsed = parseTrace(trace);

  if (!parsed.ok) {
    return (
      <Card title={skillTitle(parsed.name)}>
        <p className="text-[13px] text-smoke">
          Couldn&apos;t read this source.
        </p>
      </Card>
    );
  }

  switch (parsed.name) {
    case "getRecoveryState":
      return <RecoverySource output={parsed.output} />;
    case "getTrainingLoad":
      return <TrainingLoadSource output={parsed.output} />;
    case "getNutritionGaps":
      return <NutritionSource output={parsed.output} />;
    case "getHydrationStatus":
      return <HydrationSource output={parsed.output} />;
    case "getCyclePhase":
      return <CycleSource output={parsed.output} />;
    case "proposeAdjustment":
      return <AdjustmentSource output={parsed.output} />;
    case "proposeHabitRestart":
      return <HabitRestartSource output={parsed.output} />;
    case "draftCrewNudge":
      return <CrewNudgeSource output={parsed.output} />;
    default:
      return (
        <Card title={skillTitle(parsed.name)}>
          <p className="text-[13px] text-smoke">Read.</p>
        </Card>
      );
  }
}

function skillTitle(name: string): string {
  switch (name) {
    case "getRecoveryState":
      return "Recovery signals";
    case "getTrainingLoad":
      return "Training load";
    case "getNutritionGaps":
      return "Nutrition";
    case "getHydrationStatus":
      return "Hydration";
    case "getCyclePhase":
      return "Cycle phase";
    case "proposeAdjustment":
      return "Workout adjustment";
    case "proposeHabitRestart":
      return "Habit check";
    case "draftCrewNudge":
      return "Crew draft";
    default:
      return name;
  }
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-md">
      <div className="mb-sm">
        <p className="eyebrow">{title}</p>
        {subtitle && (
          <p className="text-[12px] text-smoke mt-[2px]">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] text-smoke uppercase tracking-[0.06em]">
        {label}
      </dt>
      <dd className="stat-med text-[20px] text-ink mt-[2px] tabular-nums">
        {value}
      </dd>
      {hint && <p className="text-[11px] text-smoke mt-[2px]">{hint}</p>}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------- recovery ---------- */

type RecoveryOutput = {
  available: boolean;
  note?: string;
  window?: string;
  hrvAvg7Ms?: number;
  hrvBaselineAvgMs?: number;
  hrvDeltaMs?: number;
  hrvTrend?: string;
  sleepAvg7Hours?: number;
  shortNightsLast7?: number;
  readinessAvg7?: number;
  lastNight?: {
    date: string;
    sleepHours: number;
    hrvMs: number | null;
    readinessScore: number | null;
  };
};

function RecoverySource({ output }: { output: unknown }) {
  const o = output as RecoveryOutput;
  if (!o?.available) {
    return (
      <Card title="Recovery signals">
        <p className="text-[13px] text-smoke">
          {o?.note ?? "No sleep or HRV data connected yet."}
        </p>
      </Card>
    );
  }

  const delta = o.hrvDeltaMs ?? 0;
  const deltaLabel =
    delta > 0 ? `+${delta}ms vs baseline` : `${delta}ms vs baseline`;

  return (
    <Card title="Recovery signals" subtitle={o.window}>
      <dl className="grid grid-cols-2 gap-sm mb-sm">
        <Stat
          label="HRV · 7d avg"
          value={`${o.hrvAvg7Ms}ms`}
          hint={`${deltaLabel} · ${o.hrvTrend}`}
        />
        <Stat
          label="Readiness · 7d"
          value={o.readinessAvg7 ?? "—"}
          hint="Oura score"
        />
        <Stat
          label="Sleep · 7d avg"
          value={`${o.sleepAvg7Hours}h`}
          hint={
            o.shortNightsLast7
              ? `${o.shortNightsLast7} short night${o.shortNightsLast7 === 1 ? "" : "s"}`
              : "no short nights"
          }
        />
        <Stat
          label="Baseline · 21d"
          value={`${o.hrvBaselineAvgMs}ms`}
          hint="HRV reference"
        />
      </dl>
      {o.lastNight && (
        <div className="pt-sm" style={{ borderTop: "1px solid var(--color-linen)" }}>
          <p className="text-[11px] text-smoke uppercase tracking-[0.06em] mb-xs">
            Last night · {formatDate(o.lastNight.date)}
          </p>
          <p className="text-[13px] text-ink">
            {o.lastNight.sleepHours}h sleep
            {o.lastNight.hrvMs != null && ` · ${o.lastNight.hrvMs}ms HRV`}
            {o.lastNight.readinessScore != null &&
              ` · readiness ${o.lastNight.readinessScore}`}
          </p>
        </div>
      )}
    </Card>
  );
}

/* ---------- training load ---------- */

type TrainingLoadOutput = {
  weeklyKm: number[];
  acuteKm: number;
  chronicKm: number;
  acuteChronicRatio: number;
  sessionsLast7: number;
  missedKeySessionsLast7: string[];
  last7Summary: Array<{ date: string; name: string; km: number }>;
};

function TrainingLoadSource({ output }: { output: unknown }) {
  const o = output as TrainingLoadOutput;
  const max = Math.max(...(o.weeklyKm ?? [0]), 1);
  return (
    <Card
      title="Training load"
      subtitle={`last ${o.weeklyKm?.length ?? 0} weeks`}
    >
      <dl className="grid grid-cols-3 gap-sm mb-sm">
        <Stat label="This week" value={`${o.acuteKm}km`} />
        <Stat label="Chronic" value={`${o.chronicKm}km`} hint="per week" />
        <Stat
          label="Acute : chronic"
          value={o.acuteChronicRatio.toFixed(2)}
          hint={o.acuteChronicRatio < 0.8 ? "undercooked" : "on track"}
        />
      </dl>

      <div className="flex items-end gap-xs mb-sm" style={{ height: 60 }}>
        {o.weeklyKm.map((km, i) => {
          const h = Math.max(4, Math.round((km / max) * 56));
          const current = i === 0;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-[4px]"
            >
              <div
                style={{
                  width: "100%",
                  height: h,
                  background: current
                    ? "var(--color-sand-deep)"
                    : "var(--color-sand)",
                  borderRadius: 4,
                  opacity: current ? 1 : 0.7,
                }}
              />
              <span className="text-[10px] text-smoke tabular-nums">{km}</span>
            </div>
          );
        })}
      </div>

      {o.missedKeySessionsLast7?.length > 0 && (
        <p className="text-[12px] text-smoke mb-sm">
          Missed this week:{" "}
          <span className="text-ink">
            {o.missedKeySessionsLast7.join(", ")}
          </span>
        </p>
      )}

      {o.last7Summary?.length > 0 ? (
        <ul className="flex flex-col gap-[6px]">
          {o.last7Summary.map((s, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between text-[13px]"
            >
              <span className="text-ink">{s.name}</span>
              <span className="text-smoke tabular-nums">
                {formatDate(s.date)} · {s.km}km
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-smoke">No sessions in the last 7 days.</p>
      )}
    </Card>
  );
}

/* ---------- nutrition ---------- */

type NutritionOutput = {
  available: boolean;
  note?: string;
  windowDays?: number;
  proteinTargetG?: number;
  kcalTarget?: number;
  avgProteinG?: number;
  avgKcal?: number;
  lowProteinDays?: Array<{ date: string; proteinG: number; kcal: number }>;
  lowKcalDays?: Array<{ date: string; kcal: number }>;
};

function NutritionSource({ output }: { output: unknown }) {
  const o = output as NutritionOutput;
  if (!o?.available) {
    return (
      <Card title="Nutrition">
        <p className="text-[13px] text-smoke">
          {o?.note ?? "No meals logged yet."}
        </p>
      </Card>
    );
  }
  return (
    <Card title="Nutrition" subtitle={`last ${o.windowDays} days`}>
      <dl className="grid grid-cols-2 gap-sm mb-sm">
        <Stat
          label="Protein · avg"
          value={`${o.avgProteinG}g`}
          hint={`target ${o.proteinTargetG}g`}
        />
        <Stat
          label="Calories · avg"
          value={o.avgKcal?.toLocaleString() ?? "—"}
          hint={`target ${o.kcalTarget?.toLocaleString()}`}
        />
      </dl>
      {(o.lowProteinDays?.length ?? 0) > 0 && (
        <div className="mb-sm">
          <p className="text-[11px] text-smoke uppercase tracking-[0.06em] mb-xs">
            Low-protein days
          </p>
          <ul className="flex flex-col gap-[4px]">
            {o.lowProteinDays!.map((d, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between text-[13px]"
              >
                <span className="text-ink">{formatDate(d.date)}</span>
                <span className="text-smoke tabular-nums">
                  {d.proteinG}g · {d.kcal.toLocaleString()} kcal
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(o.lowKcalDays?.length ?? 0) > 0 &&
        (o.lowProteinDays?.length ?? 0) === 0 && (
          <div>
            <p className="text-[11px] text-smoke uppercase tracking-[0.06em] mb-xs">
              Low-calorie days
            </p>
            <ul className="flex flex-col gap-[4px]">
              {o.lowKcalDays!.map((d, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between text-[13px]"
                >
                  <span className="text-ink">{formatDate(d.date)}</span>
                  <span className="text-smoke tabular-nums">
                    {d.kcal.toLocaleString()} kcal
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      {(o.lowProteinDays?.length ?? 0) === 0 &&
        (o.lowKcalDays?.length ?? 0) === 0 && (
          <p className="text-[12px] text-smoke">No under-target days flagged.</p>
        )}
    </Card>
  );
}

/* ---------- hydration ---------- */

type HydrationOutput = {
  available: boolean;
  note?: string;
  targetMl?: number;
  avgMlLast7?: number;
  lowHydrationDays?: Array<{ date: string; ml: number }>;
};

function HydrationSource({ output }: { output: unknown }) {
  const o = output as HydrationOutput;
  if (!o?.available) {
    return (
      <Card title="Hydration">
        <p className="text-[13px] text-smoke">
          {o?.note ?? "No hydration data logged."}
        </p>
      </Card>
    );
  }
  return (
    <Card title="Hydration" subtitle="last 7 days">
      <dl className="grid grid-cols-2 gap-sm mb-sm">
        <Stat
          label="Daily · avg"
          value={`${o.avgMlLast7?.toLocaleString()}ml`}
          hint={`target ${o.targetMl?.toLocaleString()}ml`}
        />
        <Stat
          label="Short days"
          value={o.lowHydrationDays?.length ?? 0}
          hint="under 75% target"
        />
      </dl>
      {(o.lowHydrationDays?.length ?? 0) > 0 && (
        <ul className="flex flex-col gap-[4px]">
          {o.lowHydrationDays!.map((d, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between text-[13px]"
            >
              <span className="text-ink">{formatDate(d.date)}</span>
              <span className="text-smoke tabular-nums">
                {d.ml.toLocaleString()}ml
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- cycle ---------- */

type CycleOutput = {
  available: boolean;
  note?: string;
  phase?: string;
  startDate?: string;
  endDate?: string | null;
};

function CycleSource({ output }: { output: unknown }) {
  const o = output as CycleOutput;
  if (!o?.available) {
    return (
      <Card title="Cycle phase">
        <p className="text-[13px] text-smoke">
          {o?.note ?? "No cycle data for this user."}
        </p>
      </Card>
    );
  }
  const range = o.endDate
    ? `${formatDate(o.startDate!)} – ${formatDate(o.endDate)}`
    : `since ${formatDate(o.startDate!)}`;
  return (
    <Card title="Cycle phase">
      <p className="display text-[22px] tracking-[-0.015em] text-ink leading-[1.2] capitalize">
        {o.phase}
      </p>
      <p className="text-[12px] text-smoke mt-xs">{range}</p>
    </Card>
  );
}

/* ---------- adjustment ---------- */

type AdjustmentOutput = {
  planned: string;
  recommendation: "keep" | "scale" | "swap_easy";
  adjusted: string;
  reasons: string[];
  signals?: {
    readinessAvg7: number;
    sleepAvg7Hours: number;
    acuteKm: number;
    chronicKmPerWeek: number;
  };
};

function AdjustmentSource({ output }: { output: unknown }) {
  const o = output as AdjustmentOutput;
  const recLabel =
    o.recommendation === "keep"
      ? "Keep as planned"
      : o.recommendation === "scale"
        ? "Scale back"
        : "Swap to easy";
  return (
    <Card title="Workout adjustment">
      <div className="mb-sm">
        <p className="text-[11px] text-smoke uppercase tracking-[0.06em]">
          Planned
        </p>
        <p className="text-[14px] text-ink mt-[2px]">{o.planned}</p>
      </div>
      <div className="mb-sm">
        <p className="text-[11px] text-smoke uppercase tracking-[0.06em]">
          Recommendation
        </p>
        <p className="text-[14px] text-ink mt-[2px]">{recLabel}</p>
        {o.adjusted !== o.planned && (
          <p
            className="display-italic text-[14px] mt-xs"
            style={{ color: "var(--color-sand-deep)" }}
          >
            {o.adjusted}
          </p>
        )}
      </div>
      {o.reasons?.length > 0 && (
        <ul className="flex flex-col gap-xs">
          {o.reasons.map((r, i) => (
            <li
              key={i}
              className="text-[13px] text-ink leading-[1.5] flex gap-xs"
            >
              <span aria-hidden className="text-smoke">
                ·
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- habit restart ---------- */

type HabitRestartOutput = {
  lapseDetected: boolean;
  note?: string;
  dropPercent?: number;
  acuteKm?: number;
  chronicKmPerWeek?: number;
  restart?: { type: string; body: string };
};

function HabitRestartSource({ output }: { output: unknown }) {
  const o = output as HabitRestartOutput;
  if (!o.lapseDetected) {
    return (
      <Card title="Habit check">
        <p className="text-[13px] text-smoke">
          {o.note ?? "No significant drop in training."}
        </p>
      </Card>
    );
  }
  return (
    <Card title="Habit check" subtitle={`${o.dropPercent}% drop vs usual`}>
      <dl className="grid grid-cols-2 gap-sm mb-sm">
        <Stat label="This week" value={`${o.acuteKm}km`} />
        <Stat
          label="Chronic"
          value={`${o.chronicKmPerWeek}km`}
          hint="per week"
        />
      </dl>
      {o.restart && (
        <div
          className="pt-sm"
          style={{ borderTop: "1px solid var(--color-linen)" }}
        >
          <p className="text-[11px] text-smoke uppercase tracking-[0.06em] mb-xs">
            Restart suggestion
          </p>
          <p className="text-[13px] text-ink leading-[1.5]">{o.restart.body}</p>
        </div>
      )}
    </Card>
  );
}

/* ---------- crew nudge ---------- */

type CrewNudgeOutput = {
  shareable: string;
  suggestedChannels: string[];
};

function CrewNudgeSource({ output }: { output: unknown }) {
  const o = output as CrewNudgeOutput;
  return (
    <Card title="Crew draft">
      <p className="text-[14px] text-ink leading-[1.5] italic">
        “{o.shareable}”
      </p>
      {o.suggestedChannels?.length > 0 && (
        <p className="text-[11px] text-smoke mt-sm uppercase tracking-[0.06em]">
          Good for: {o.suggestedChannels.join(" · ")}
        </p>
      )}
    </Card>
  );
}
