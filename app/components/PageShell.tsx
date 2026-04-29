import Link from "next/link";
import Logo from "./Logo";

type Width = "narrow" | "default" | "wide";

type PageShellProps = {
  width?: Width;
  nav?: React.ReactNode;
  children: React.ReactNode;
};

export function PageShell({
  width = "default",
  nav,
  children,
}: PageShellProps) {
  const widthClass =
    width === "narrow"
      ? "page-narrow"
      : width === "wide"
        ? "page-wide"
        : "page-default";
  return (
    <main className="page-shell">
      <div className={`page-container ${widthClass}`}>
        {nav}
        {children}
        <AppFooter />
      </div>
    </main>
  );
}

export function BrandMark({
  href = "/",
  size = 26,
}: {
  href?: string;
  size?: number;
}) {
  return (
    <Link href={href} className="flex items-center gap-sm min-w-0 rise stagger-1">
      <Logo size={size} />
      <span className="display text-[20px] sm:text-[22px] tracking-[-0.015em] text-ink">
        Bloom
      </span>
    </Link>
  );
}

export function PageNav({
  leading,
  trailing,
}: {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <nav className="page-nav rise stagger-1">
      {leading ?? <BrandMark />}
      {trailing}
    </nav>
  );
}

export function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <span className="eyebrow shrink-0">
      Step {current} of {total}
    </span>
  );
}

export function BackLink({
  href,
  children = "Back",
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-[14px] text-graphite hover:text-ink transition-colors"
    >
      ← {children}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  align = "left",
  className = "",
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const alignClass =
    align === "center" ? "text-center items-center" : "text-left items-start";
  const autoClass = align === "center" ? "mx-auto" : "";
  return (
    <header
      className={`mb-lg sm:mb-xl rise stagger-2 flex flex-col ${alignClass} ${className}`}
    >
      {eyebrow && <p className="eyebrow mb-sm">{eyebrow}</p>}
      <h1
        className={`display text-[32px] sm:text-[48px] leading-[1.08] tracking-[-0.02em] sm:tracking-[-0.025em] text-ink max-w-[20ch] ${autoClass}`}
      >
        {title}
      </h1>
      {lede && (
        <p
          className={`mt-sm text-[15px] sm:text-[17px] leading-[1.6] text-graphite max-w-[56ch] ${autoClass}`}
        >
          {lede}
        </p>
      )}
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="page-footer">
      <div className="rule mb-md" />
      <p className="eyebrow text-center">
        Less noise · More signal · Actually bloom
      </p>
    </footer>
  );
}
