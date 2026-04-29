"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Provider } from "@/lib/providers";
import ProviderIcon from "./ProviderIcon";

type Props = {
  provider: Provider;
  connected: boolean;
};

export default function ProviderCard({ provider, connected }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !!provider.disabled;
  const working = busy || isPending;

  async function toggle() {
    if (working || disabled) return;
    setError(null);

    // Strava uses real OAuth on connect — redirect to its authorize URL.
    if (provider.id === "strava" && !connected) {
      window.location.href = "/api/strava/connect";
      return;
    }

    setBusy(true);
    try {
      const path = connected ? "disconnect" : "connect";
      const res = await fetch(`/api/integrations/${provider.id}/${path}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  const label = disabled
    ? "coming soon"
    : connected
      ? "connected"
      : "not connected";

  return (
    <article
      className="card p-md sm:p-lg flex items-center justify-between gap-md"
      style={disabled ? { opacity: 0.55 } : undefined}
    >
      <div className="flex items-center gap-sm min-w-0">
        <ProviderIcon id={provider.id} size={32} />
        <div className="min-w-0">
          <h3 className="display text-[20px] sm:text-[22px] tracking-[-0.015em] text-ink leading-[1.1]">
            {provider.name}
          </h3>
          <p className="text-[13px] text-smoke mt-[2px]">{label}</p>
          {error && (
            <p className="mt-xs text-[12px] text-graphite">{error}</p>
          )}
        </div>
      </div>
      <Toggle
        checked={connected}
        onChange={toggle}
        disabled={working || disabled}
        label={`Toggle ${provider.name}`}
      />
    </article>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className="relative shrink-0 inline-flex items-center rounded-full transition-colors"
      style={{
        width: 52,
        height: 30,
        background: checked ? "var(--color-ink)" : "var(--color-linen)",
        border: `1px solid ${checked ? "var(--color-ink)" : "var(--color-linen)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        aria-hidden
        className="absolute rounded-full transition-all"
        style={{
          top: 2,
          left: checked ? 24 : 2,
          width: 24,
          height: 24,
          background: "var(--color-paper)",
          boxShadow: "0 1px 2px rgba(15, 31, 23, 0.25)",
        }}
      />
    </button>
  );
}
