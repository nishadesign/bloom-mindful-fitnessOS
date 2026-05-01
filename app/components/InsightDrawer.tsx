"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
              <p className="text-[13px] text-smoke mb-xs">Answer</p>
              <p className="text-[14px] sm:text-[15px] leading-[1.65] text-ink whitespace-pre-wrap">
                {data.insight.body}
              </p>
            </div>

            <p className="eyebrow mb-sm">Tool calls ({data.traces.length})</p>
            <ol className="flex flex-col gap-sm">
              {data.traces.map((t, i) => (
                <TraceItem key={t.id} index={i + 1} trace={t} />
              ))}
            </ol>
          </>
        )}
      </aside>
    </div>
  );

  return createPortal(body, document.body);
}

function TraceItem({ trace, index }: { trace: Trace; index: number }) {
  const [open, setOpen] = useState(false);
  const ok = trace.ok;
  return (
    <li className="card p-md">
      <div className="flex items-center justify-between gap-sm">
        <div className="flex items-center gap-sm min-w-0">
          <span className="numeral shrink-0">{String(index).padStart(2, "0")}</span>
          <p className="text-[14px] sm:text-[15px] text-ink truncate">
            {trace.skillName}
          </p>
          <span
            aria-hidden
            className="shrink-0 inline-block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: ok ? "var(--color-sand)" : "var(--color-sand-deep)",
            }}
          />
          <span className="text-[12px] text-smoke shrink-0">
            {ok ? "ok" : "error"}
          </span>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <span className="text-[12px] text-smoke tabular-nums">
            {trace.latencyMs}ms
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[12px] text-ink hover:text-graphite transition-colors"
            aria-expanded={open}
          >
            {open ? "Hide" : "Show"} I/O
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-sm flex flex-col gap-xs">
          <IOBlock label="Input" value={trace.input} />
          <IOBlock label="Output" value={trace.output} />
          {trace.errorMessage && (
            <IOBlock label="Error" value={trace.errorMessage} />
          )}
        </div>
      )}
    </li>
  );
}

function IOBlock({ label, value }: { label: string; value: string }) {
  let pretty = value;
  try {
    pretty = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // leave as-is
  }
  return (
    <div>
      <p className="text-[11px] text-smoke uppercase tracking-[0.06em] mb-[4px]">
        {label}
      </p>
      <pre
        className="text-[12px] leading-[1.5] text-ink overflow-x-auto"
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
          background: "var(--color-linen-soft)",
          border: "1px solid var(--color-linen)",
          borderRadius: 12,
          padding: 12,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {pretty}
      </pre>
    </div>
  );
}
