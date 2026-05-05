"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark, PageNav, PageShell } from "../components/PageShell";
import InsightDrawer from "../components/InsightDrawer";
import MarkdownText from "../components/MarkdownText";

type ToolCall = {
  name: string;
  input?: unknown;
  output?: unknown;
  ok?: boolean;
  latencyMs?: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  insightId?: number | null;
};

const SUGGESTIONS = [
  "How am I doing this week toward my goal?",
  "Am I ready for a tempo run tomorrow?",
  "What should my diet look like post run?",
];

const TOPIC_PROMPTS: Record<string, string> = {
  insight: "Tell me more about today's insight.",
};

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
  const [error, setError] = useState<string | null>(null);
  const [openDrawerFor, setOpenDrawerFor] = useState<{
    id: number;
    question: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topicFiredRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

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

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "(no reply)",
          toolCalls: data.toolCalls ?? [],
          insightId: data.insightId ?? null,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    send(input);
  }

  const empty = messages.length === 0;

  function precedingUserQuestion(index: number): string {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].content;
    }
    return "Coach reply";
  }

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
                  <Bubble
                    message={m}
                    onOpenInsight={() => {
                      if (!m.insightId) return;
                      setOpenDrawerFor({
                        id: m.insightId,
                        question: precedingUserQuestion(i),
                      });
                    }}
                  />
                </li>
              ))}
              {sending && (
                <li>
                  <Thinking />
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
              empty ? SUGGESTIONS[0] : "Ask a follow-up…"
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

      {openDrawerFor && (
        <InsightDrawer
          insightId={openDrawerFor.id}
          question={openDrawerFor.question}
          onClose={() => setOpenDrawerFor(null)}
        />
      )}
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

function Bubble({
  message,
  onOpenInsight,
}: {
  message: ChatMessage;
  onOpenInsight: () => void;
}) {
  const isUser = message.role === "user";
  const skills = isUser
    ? []
    : Array.from(
        new Set((message.toolCalls ?? []).map((c) => c.name).filter(Boolean)),
      );

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[88%] rounded-[18px] rounded-br-[6px] bg-ink text-paper px-sm py-xs text-[14px] sm:text-[15px] leading-[1.55]"
            : "max-w-[92%] text-[14px] sm:text-[15px] leading-[1.65] text-ink"
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownText text={message.content} />
        )}
        {!isUser && skills.length > 0 && (
          <div className="mt-sm flex flex-wrap gap-xs items-center">
            {skills.map((name) => (
              <SkillPill key={name} name={name} />
            ))}
            {message.insightId && (
              <button
                type="button"
                onClick={onOpenInsight}
                className="text-[12px] text-ink hover:text-graphite underline underline-offset-2 ml-xs"
              >
                See reasoning →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillPill({ name }: { name: string }) {
  const label = SKILL_LABELS[name] ?? name;
  return (
    <span
      className="text-[11px] text-ink"
      style={{
        padding: "3px 10px",
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

function Thinking() {
  return (
    <p className="display-italic text-[14px] text-smoke">
      thinking<span className="inline-block animate-pulse">…</span>
    </p>
  );
}

function romanize(n: number): string {
  return ["i.", "ii.", "iii.", "iv.", "v.", "vi."][n - 1] ?? `${n}.`;
}
