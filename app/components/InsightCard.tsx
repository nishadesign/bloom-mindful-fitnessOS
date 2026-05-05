"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InsightDrawer from "./InsightDrawer";
import MarkdownText from "./MarkdownText";

type ToolCall = {
  name: string;
  ok?: boolean;
};

type Action = "pending" | "accepted" | "dismissed";

type Props = {
  id: number;
  title: string;
  body: string;
  sourceRefs: string;
  action: Action;
};

const REGEN_PROMPT =
  "Given my latest data, what's your honest read on how I'm doing and what should I do about today's workout?";

const SKILL_LABELS: Record<string, string> = {
  getRecoveryState: "recovery",
  getTrainingLoad: "training load",
  getNutritionGaps: "nutrition",
  getHydrationStatus: "hydration",
  getCyclePhase: "cycle",
  proposeAdjustment: "plan adjustment",
  proposeHabitRestart: "habit restart",
  draftCrewNudge: "crew nudge",
};

function parseSkills(sourceRefs: string): string[] {
  try {
    const parsed = JSON.parse(sourceRefs);
    if (!Array.isArray(parsed)) return [];
    const names = (parsed as ToolCall[]).map((c) => c.name).filter(Boolean);
    return Array.from(new Set(names));
  } catch {
    return [];
  }
}

export default function InsightCard({
  id,
  title,
  body,
  sourceRefs,
  action: initialAction,
}: Props) {
  const router = useRouter();
  const [action, setAction] = useState<Action>(initialAction);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState<
    null | "accept" | "regenerate"
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [crewNudge, setCrewNudge] = useState<string | null>(null);
  const [crewLoading, setCrewLoading] = useState(false);

  const skills = useMemo(() => parseSkills(sourceRefs), [sourceRefs]);

  async function acceptInsight() {
    setSubmitting("accept");
    setError(null);
    const prev = action;
    setAction("accepted");
    try {
      const res = await fetch(`/api/insights/${id}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "accepted" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Action failed");
      }
      router.refresh();
    } catch (e) {
      setAction(prev);
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setSubmitting(null);
    }
  }

  async function regenerateInsight() {
    setSubmitting("regenerate");
    setError(null);
    try {
      const question = title?.trim() || REGEN_PROMPT;
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: 1, question }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Couldn't regenerate");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setSubmitting(null);
    }
  }

  async function shareWithCrew() {
    setCrewLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          kind: "draft",
          question: "draft a one-liner for my crew about today's adjustment",
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Couldn't draft");
      setCrewNudge(j.reply ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setCrewLoading(false);
    }
  }

  function openDrawer(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("button, a")) return;
    setDrawerOpen(true);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setDrawerOpen(true);
    }
  }

  const cardClass =
    "card-soft card-hover block p-md sm:p-lg w-full cursor-pointer " +
    (action === "dismissed" ? "opacity-60" : "") +
    (submitting === "regenerate" ? " opacity-70" : "");

  return (
    <>
      <div className="mb-lg">
        <div
          role="button"
          tabIndex={0}
          onClick={openDrawer}
          onKeyDown={onKeyDown}
          className={cardClass}
          aria-label="Open reasoning"
        >
          <div className="flex items-start justify-between gap-sm mb-xs">
            <p className="display text-[24px] sm:text-[30px] leading-[1.2] tracking-[-0.015em] text-ink max-w-[40ch]">
              {title}
            </p>
            <span className="text-[13px] text-ink whitespace-nowrap shrink-0">
              See reasoning →
            </span>
          </div>

          <MarkdownText
            text={body}
            className="text-[14px] sm:text-[15px] leading-[1.6] text-graphite mt-sm max-w-[56ch]"
          />

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-xs mt-md">
              {skills.map((name) => (
                <SkillPill key={name} name={name} />
              ))}
            </div>
          )}

          <div className="mt-md flex flex-wrap items-center gap-sm">
            {action === "pending" && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={submitting !== null}
                  onClick={acceptInsight}
                >
                  {submitting === "accept" ? "Accepting…" : "Accept"}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={submitting !== null}
                  onClick={regenerateInsight}
                  title="Re-read your latest data and draft a new insight"
                >
                  {submitting === "regenerate"
                    ? "Regenerating…"
                    : "Regenerate"}
                </button>
              </>
            )}

            {action === "accepted" && (
              <>
                <span className="text-[13px] text-ink">Plan updated.</span>
                <button
                  type="button"
                  className="text-[13px] text-ink hover:text-graphite underline underline-offset-2"
                  onClick={shareWithCrew}
                  disabled={crewLoading}
                >
                  {crewLoading ? "Drafting…" : "Share with your crew →"}
                </button>
              </>
            )}

            {action === "dismissed" && (
              <span className="text-[13px] text-smoke">Dismissed.</span>
            )}
          </div>

          {crewNudge && (
            <div className="mt-md card p-md">
              <p className="eyebrow mb-xs">Draft</p>
              <MarkdownText
                text={crewNudge}
                className="text-[14px] leading-[1.6] text-ink"
              />
            </div>
          )}

          {error && (
            <p
              className="text-[12px] mt-sm"
              style={{ color: "var(--color-sand-deep)" }}
            >
              {error}
            </p>
          )}
        </div>
      </div>

      {drawerOpen && (
        <InsightDrawer
          insightId={id}
          question={title}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}

function SkillPill({ name }: { name: string }) {
  const label = SKILL_LABELS[name] ?? name;
  return (
    <span
      className="text-[11px] text-ink"
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: "var(--color-paper)",
        border: "1px solid var(--color-linen)",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}
