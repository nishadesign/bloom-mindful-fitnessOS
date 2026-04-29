"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark, PageNav, PageShell } from "../components/PageShell";

type Source = { label: string; detail: string };

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  sources?: Source[];
};

const SUGGESTIONS = [
  "What should my diet look like post run?",
  "Why did I bonk yesterday?",
  "Am I ready for a tempo run tomorrow?",
];

const TOPIC_PROMPTS: Record<string, string> = {
  insight: "Tell me more about today's insight.",
};

const STEP_MS = 750;

function pickSteps(question: string): string[] {
  const q = question.toLowerCase();
  if (/(post[-\s]?run|after (my |the )?run|recovery (meal|food)|refuel)/.test(q)) {
    return [
      "Pulling your last run from Strava",
      "Syncing your recovery window through Oura",
      "Checking your goal and training block",
      "Finding a high-carb vegetarian meal",
      "Writing it up",
    ];
  }
  if (/insight/.test(q)) {
    return [
      "Scanning your last 3 sessions on Strava",
      "Checking your cycle phase",
      "Tying it back to your goal",
      "Writing it up",
    ];
  }
  if (/(bonk|tired|rough|crash|exhaust|flat|heavy|dead)/.test(q)) {
    return [
      "Pulling yesterday's session from Strava",
      "Reading last night's sleep from Oura",
      "Checking your cycle phase",
      "Writing it up",
    ];
  }
  if (/(tempo|tomorrow|ready|interval|long run|should i run)/.test(q)) {
    return [
      "Reading your recovery from Oura",
      "Checking the last 48 hours on Strava",
      "Weighing it against your goal",
      "Writing it up",
    ];
  }
  if (/(eat|food|fuel|dinner|meal|carb|lunch|tonight|snack|breakfast|nutrition)/.test(q)) {
    return [
      "Pulling today's training from Strava",
      "Checking your calorie budget",
      "Reading your goal on file",
      "Writing it up",
    ];
  }
  return [
    "Reading your training from Strava",
    "Reading your sleep from Oura",
    "Pulling your goal",
    "Writing it up",
  ];
}

export default function CoachPage() {
  return (
    <Suspense fallback={null}>
      <CoachChat />
    </Suspense>
  );
}

function CoachChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topicFiredRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending, stepIndex]);

  useEffect(() => {
    if (topicFiredRef.current) return;
    const topic = searchParams.get("topic");
    if (!topic) return;
    const prompt = TOPIC_PROMPTS[topic];
    if (!prompt) return;
    topicFiredRef.current = true;
    send(prompt);
    router.replace("/coach");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const steps = pickSteps(trimmed);
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);
    setThinkingSteps(steps);
    setStepIndex(0);

    const stepsDone = new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        setStepIndex((i) => {
          const nextI = i + 1;
          if (nextI >= steps.length) {
            clearInterval(timer);
            resolve();
            return steps.length;
          }
          return nextI;
        });
      }, STEP_MS);
    });

    try {
      const [res] = await Promise.all([
        fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.map(({ role, content }) => ({ role, content })),
          }),
        }),
        stepsDone,
      ]);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "(no reply)",
          toolsUsed: data.toolsUsed ?? [],
          sources: data.sources ?? [],
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSending(false);
      setThinkingSteps([]);
      setStepIndex(0);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    send(input);
  }

  const empty = messages.length === 0;

  return (
    <PageShell
      width="default"
      nav={
        <PageNav
          leading={<BrandMark />}
          trailing={
            <Link href="/integrations" className="btn-ghost shrink-0">
              Integrations
            </Link>
          }
        />
      }
    >
      <section className="rise stagger-2 flex flex-col min-h-[70vh]">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto pr-1"
          aria-live="polite"
        >
          {empty ? (
            <EmptyState onPick={(q) => send(q)} />
          ) : (
            <ol className="flex flex-col gap-md">
              {messages.map((m, i) => (
                <li key={i}>
                  <Bubble message={m} />
                </li>
              ))}
              {sending && (
                <li>
                  <ThinkingSteps
                    steps={thinkingSteps}
                    activeIndex={stepIndex}
                  />
                </li>
              )}
            </ol>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-sm mt-lg"
        >
          <label htmlFor="coach-input" className="sr-only">
            Ask your coach
          </label>
          <input
            id="coach-input"
            className="field flex-1"
            placeholder={
              empty
                ? "What should my diet look like post run?"
                : "Ask a follow-up…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={sending || input.trim().length === 0}
          >
            {sending ? "Thinking…" : "Ask"}
          </button>
        </form>

        {error && (
          <p className="mt-sm text-[13px] text-graphite">
            <span className="display-italic text-ink">
              Something snagged —
            </span>{" "}
            {error}
          </p>
        )}
      </section>
    </PageShell>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-md">
      <p className="text-[15px] sm:text-[16px] text-graphite max-w-[48ch]">
        Nothing asked yet. Try one of these, or write your own.
      </p>
      <ul className="flex flex-col gap-xs">
        {SUGGESTIONS.map((q, i) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPick(q)}
              className="w-full text-left flex items-baseline gap-sm py-xs group"
            >
              <span className="numeral">{romanize(i + 1)}</span>
              <span className="text-[15px] sm:text-[16px] text-ink group-hover:text-graphite transition-colors">
                {q}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);
  const hasSources = !isUser && !!message.sources && message.sources.length > 0;
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[88%] rounded-[18px] rounded-br-[6px] bg-ink text-paper px-sm py-xs text-[14px] sm:text-[15px] leading-[1.55]"
            : "max-w-[92%] text-[14px] sm:text-[15px] leading-[1.65] text-ink"
        }
      >
        {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
          <p className="numeral mb-xs">
            read · {uniq(message.toolsUsed).map(labelTool).join(" · ")}
          </p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        {hasSources && (
          <div className="mt-sm">
            <button
              type="button"
              onClick={() => setShowSources((v) => !v)}
              aria-expanded={showSources}
              className="text-[13px] text-ink underline underline-offset-2 hover:text-graphite transition-colors"
            >
              {showSources
                ? "Hide sources"
                : `Show sources (${message.sources!.length})`}
            </button>
            {showSources && (
              <div className="mt-sm pt-sm border-t border-linen">
                <p className="numeral mb-xs">sources</p>
                <ul className="flex flex-col gap-xs">
                  {message.sources!.map((s, i) => (
                    <li
                      key={i}
                      className="text-[13px] leading-[1.45] text-graphite"
                    >
                      <span className="text-ink font-medium">{s.label}</span>
                      <span className="text-smoke"> — {s.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingSteps({
  steps,
  activeIndex,
}: {
  steps: string[];
  activeIndex: number;
}) {
  if (steps.length === 0) {
    return (
      <p className="display-italic text-[14px] text-smoke">
        thinking<span className="inline-block animate-pulse">…</span>
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-xs">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        const isPending = i > activeIndex;
        return (
          <li
            key={step}
            className="flex items-center gap-sm text-[13px] sm:text-[14px] leading-[1.55]"
            style={{ opacity: isPending ? 0.4 : 1 }}
          >
            <span
              aria-hidden
              className="inline-flex items-center justify-center shrink-0"
              style={{ width: 14, height: 14 }}
            >
              {isDone ? (
                <span
                  className="numeral"
                  style={{ color: "var(--color-sand-deep)" }}
                >
                  ✓
                </span>
              ) : isActive ? (
                <span
                  className="inline-block animate-pulse rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: "var(--color-sand-deep)",
                  }}
                />
              ) : (
                <span
                  className="inline-block rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: "var(--color-linen)",
                  }}
                />
              )}
            </span>
            <span
              className={
                isDone
                  ? "text-smoke"
                  : isActive
                    ? "display-italic text-ink"
                    : "text-smoke"
              }
            >
              {step}
              {isActive && (
                <span className="inline-block animate-pulse">…</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function uniq(xs: string[]): string[] {
  return Array.from(new Set(xs));
}

function labelTool(name: string): string {
  switch (name) {
    case "getRecentActivities":
      return "training";
    case "getRecentSleep":
      return "sleep";
    case "getUserGoal":
      return "goal";
    case "getCyclePhase":
      return "cycle";
    default:
      return name;
  }
}

function romanize(n: number): string {
  return ["i.", "ii.", "iii.", "iv.", "v.", "vi."][n - 1] ?? `${n}.`;
}
