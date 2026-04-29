import type { ProviderId } from "@/lib/providers";

type Props = {
  id: ProviderId;
  size?: number;
};

export default function ProviderIcon({ id, size = 28 }: Props) {
  switch (id) {
    case "strava":
      return <Strava size={size} />;
    case "oura":
      return <Oura size={size} />;
    case "garmin":
      return <Garmin size={size} />;
    case "apple":
      return <Apple size={size} />;
  }
}

function Strava({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M10.2 2 4 13.6h3.9L10.2 9l2.3 4.6h3.9L10.2 2Z"
        fill="#FC4C02"
      />
      <path
        d="m13.4 15.3-1.95 3.9L9.5 15.3H7l4.45 6.7L16 15.3h-2.6Z"
        fill="#FC4C02"
        opacity="0.7"
      />
    </svg>
  );
}

function Oura({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="#1F3A2E"
        strokeWidth="3"
        fill="none"
      />
      <circle cx="12" cy="12" r="4" fill="#0F1F17" />
    </svg>
  );
}

function Garmin({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="6.5"
        y="5.5"
        width="11"
        height="13"
        rx="2.5"
        fill="#0F1F17"
      />
      <circle
        cx="12"
        cy="12"
        r="3.6"
        fill="none"
        stroke="#007CC3"
        strokeWidth="1.3"
      />
      <path
        d="M10.3 12h3.4M12 10.3v3.4"
        stroke="#007CC3"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <rect x="10" y="3.5" width="4" height="2.5" rx="0.6" fill="#0F1F17" />
      <rect x="10" y="18" width="4" height="2.5" rx="0.6" fill="#0F1F17" />
    </svg>
  );
}

function Apple({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="6.5"
        y="5.5"
        width="11"
        height="13"
        rx="2.8"
        fill="#1F1F1F"
      />
      <rect x="10" y="3.5" width="4" height="2.5" rx="0.6" fill="#1F1F1F" />
      <rect x="10" y="18" width="4" height="2.5" rx="0.6" fill="#1F1F1F" />
      <path
        d="M9 12.5s1-1.6 2.3-1.6c.8 0 1.1.4 1.7.4.5 0 .9-.4 1.7-.4 1.1 0 2 1 2 1s-.8.4-.8 1.4.9 1.5.9 1.5-.5 1.3-1.3 1.3c-.6 0-.9-.3-1.5-.3-.6 0-.9.3-1.4.3-.9 0-1.8-1.7-2.2-3.2a3 3 0 0 1 .6-.4Z"
        fill="#F5F5F7"
      />
      <path
        d="M13.5 10.3c0-.6.5-1.2 1-1.2.1.6-.5 1.2-1 1.2Z"
        fill="#F5F5F7"
      />
    </svg>
  );
}
