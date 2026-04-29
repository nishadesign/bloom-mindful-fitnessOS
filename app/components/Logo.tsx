export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bloom"
    >
      <circle cx="16" cy="16" r="4" fill="var(--color-sand-deep)" />
      <path
        d="M16 4 C 20 10, 20 14, 16 16 C 12 14, 12 10, 16 4 Z"
        fill="var(--color-ink)"
        opacity="0.85"
      />
      <path
        d="M28 16 C 22 20, 18 20, 16 16 C 18 12, 22 12, 28 16 Z"
        fill="var(--color-ink)"
        opacity="0.7"
      />
      <path
        d="M16 28 C 12 22, 12 18, 16 16 C 20 18, 20 22, 16 28 Z"
        fill="var(--color-ink)"
        opacity="0.85"
      />
      <path
        d="M4 16 C 10 12, 14 12, 16 16 C 14 20, 10 20, 4 16 Z"
        fill="var(--color-ink)"
        opacity="0.7"
      />
    </svg>
  );
}
