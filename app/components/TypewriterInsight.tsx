"use client";

import { useEffect, useState } from "react";

type Props = {
  headline: string;
  support?: string;
  headlineSpeedMs?: number;
  supportSpeedMs?: number;
  gapMs?: number;
};

export default function TypewriterInsight({
  headline,
  support,
  headlineSpeedMs = 28,
  supportSpeedMs = 12,
  gapMs = 260,
}: Props) {
  const [headlineText, setHeadlineText] = useState("");
  const [supportText, setSupportText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setHeadlineText(headline);
      setSupportText(support ?? "");
      setDone(true);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function typeString(
      full: string,
      speed: number,
      onChar: (next: string) => void,
    ): Promise<void> {
      return new Promise((resolve) => {
        let i = 0;
        const tick = () => {
          if (cancelled) return resolve();
          i++;
          onChar(full.slice(0, i));
          if (i >= full.length) return resolve();
          timers.push(setTimeout(tick, speed));
        };
        timers.push(setTimeout(tick, speed));
      });
    }

    (async () => {
      await typeString(headline, headlineSpeedMs, setHeadlineText);
      if (support) {
        await new Promise<void>((r) => {
          timers.push(setTimeout(r, gapMs));
        });
        await typeString(support, supportSpeedMs, setSupportText);
      }
      if (!cancelled) setDone(true);
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [headline, support, headlineSpeedMs, supportSpeedMs, gapMs]);

  const headlineTyping = headlineText.length < headline.length;
  const supportTyping =
    !!support && !headlineTyping && supportText.length < support.length;

  return (
    <>
      <div className="flex items-start justify-between gap-sm mb-xs">
        <p className="display text-[24px] sm:text-[30px] leading-[1.2] tracking-[-0.015em] text-ink max-w-[40ch]">
          {headlineText}
          {headlineTyping && <Caret />}
        </p>
        <span
          className="text-[13px] text-ink whitespace-nowrap shrink-0 transition-opacity"
          style={{ opacity: done ? 1 : 0 }}
        >
          Ask Bloom AI →
        </span>
      </div>
      {support && (
        <p className="text-[14px] sm:text-[15px] leading-[1.6] text-graphite mt-sm max-w-[56ch]">
          {supportText}
          {supportTyping && <Caret />}
        </p>
      )}
    </>
  );
}

function Caret() {
  return (
    <span
      aria-hidden
      className="inline-block align-baseline animate-pulse"
      style={{
        width: "0.08em",
        height: "1em",
        background: "currentColor",
        marginLeft: "2px",
        transform: "translateY(0.12em)",
      }}
    />
  );
}
