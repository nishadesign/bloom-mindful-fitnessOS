type Props = {
  plannedWorkout: string | null;
  adjustedWorkout: string | null;
  adjustmentReason: string | null;
};

export default function TodayPlan({
  plannedWorkout,
  adjustedWorkout,
  adjustmentReason,
}: Props) {
  const adjusted = Boolean(adjustedWorkout);

  return (
    <article className="card p-md sm:p-lg">
      <p className="eyebrow mb-xs">Today&apos;s workout</p>

      {!plannedWorkout && !adjusted && (
        <p className="text-[15px] text-graphite">Rest day.</p>
      )}

      {plannedWorkout && !adjusted && (
        <p className="display text-[22px] sm:text-[24px] tracking-[-0.015em] text-ink leading-[1.2]">
          {plannedWorkout}
        </p>
      )}

      {adjusted && (
        <>
          {plannedWorkout && (
            <p
              className="text-[14px] sm:text-[15px] text-smoke mb-xs"
              style={{ textDecoration: "line-through" }}
            >
              {plannedWorkout}
            </p>
          )}
          <p className="display text-[22px] sm:text-[24px] tracking-[-0.015em] text-ink leading-[1.25]">
            {adjustedWorkout}
          </p>
          <p
            className="display-italic text-[14px] sm:text-[15px] mt-sm leading-[1.5]"
            style={{ color: "var(--color-sand-deep)" }}
          >
            Adjusted by Bloom{adjustmentReason ? ` — ${adjustmentReason}` : ""}.
          </p>
        </>
      )}
    </article>
  );
}
