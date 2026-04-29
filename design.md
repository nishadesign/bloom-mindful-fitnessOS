# Bloom — Design System

Source of truth for how Bloom looks and behaves. Reflects what's actually in `app/globals.css` and the shipped pages (`/`, `/plan`). Mobile-first, editorial, warm.

## 1. Design voice

**Editorial running journal, not a dashboard.** Bloom is a single-user training companion that should feel like a handwritten weekly spread: tabular numerals for stats, serif display for headlines, Roman numerals as section markers, ambient grain and a soft sunlight wash behind everything. Restrained color, generous space, a little italic where a human would emphasize.

Matches the brand promise: *Know what works · Track together · Perform better.* Warm, knowledgeable, never clinical.

## 2. Color tokens

Defined in `app/globals.css` under `@theme`. Palette is deep-green + warm paper, **not** black/tan.

| Token | Hex | Role |
|---|---|---|
| `obsidian` | `#0F1F17` | Deepest ink, rarely used directly |
| `ink` | `#1F3A2E` | Primary text, default `--foreground` |
| `graphite` | `#3D5948` | Secondary text |
| `smoke` | `#6B7F70` | Tertiary / metadata / helper text |
| `sand` | `#D4A657` | Warm accent (rules, highlights) |
| `sand-deep` | `#C4892F` | Accent text (italic eyebrows, links), focus ring |
| `linen` | `#D4D9CC` | Borders, dividers |
| `linen-soft` | `#E2E5D9` | Hover surfaces |
| `parchment` | `#E8EBE3` | Page background (`--background`) |
| `paper` | `#F9F7F1` | Card surface, input background |

**Rules:**
- `sand-deep` is the only accent that appears in running copy — reserve it for italic eyebrows ("tempo run", "view the full week →") and the focus ring.
- Never put `parchment` text on `paper` cards (or vice versa). Cards always use `ink`/`graphite`/`smoke` on `paper`.
- No pure black, no pure white. The whole palette is warmed.

## 3. Typography

Two families, loaded in `app/layout.tsx`:
- **Geist Sans** (`--font-sans`) — body, buttons, inputs, labels
- **Fraunces** (`--font-display`, variable with `opsz` + `SOFT` axes) — display, italic accents, numerals

Body defaults (on `<body>`): `15px / 1.6`, `letter-spacing: -0.005em`.

### Utility classes (preferred over bracket sizes)

| Class | Purpose | Notes |
|---|---|---|
| `.display` | Display headings | Fraunces, `opsz 144`, `SOFT 50`, `tracking -0.02em`, `line-height 1` |
| `.display-italic` | Italic display | Fraunces italic, softer `SOFT 100`, for eyebrows and voice accents |
| `.eyebrow` | Small serif label | Fraunces 18px, `opsz 80`, sentence case — **not uppercase** |
| `.numeral` | Roman numeral markers | Fraunces italic, `sand-deep`, 13px, `tracking 0.08em` |
| `.stat-big` | Large metric | Fraunces, tabular lining nums, `tracking -0.035em` |
| `.stat-med` | Medium metric | Fraunces, tabular lining nums, `tracking -0.025em` |
| `.rule` | Gradient hairline | `linen → sand → linen`, 1px, for section dividers inside cards |

### Size guidance

Use these concrete sizes (matches what's shipped in `app/page.tsx` and `app/plan/page.tsx`):

| Role | base | `sm:` |
|---|---|---|
| Page H1 (`.display`) | `text-[32px]` | `text-[44px]` |
| Section H2 (`.display`) | `text-[22px]` | `text-[26px]` |
| Card title (`.display`) | `text-[19–24px]` | `text-[22–30px]` |
| Italic accent (`.display-italic`) | `text-[14px]` | `text-[15–17px]` |
| Body | `text-[13–15px]` | `text-[14–15px]` |
| Stat | `text-[17–28px]` | — |
| Micro label | `text-[11–14px]` | — |

**Rules:**
- Sentence case everywhere. No title case, no all-caps (except micro labels with `tracking-[0.1em]`).
- Display text always pairs `tracking-[-0.01em]` to `-0.02em` with `leading-[1.1]` to `1.3`.
- Use `.display-italic` — not `<em>` — when voice matters.

## 4. Spacing & layout

Custom scale (in `@theme`, used as `p-sm`, `gap-md`, etc.):

`xs 8px · sm 16px · md 24px · lg 32px · xl 48px · 2xl 64px`

**Page shell** (both `/` and `/plan` use this exact wrapper):

```tsx
<main className="min-h-screen text-obsidian">
  <div className="mx-auto max-w-[1120px] px-sm sm:px-md md:px-xl py-xl sm:py-2xl">
    ...
  </div>
</main>
```

- Max content width: **1120px**. Never wider.
- Section rhythm: `mb-lg` between sections. Footer gets `mt-2xl pt-lg`.
- Grid inside cards: `grid grid-cols-12 gap-md`, stack on base, split from `sm:` up.

## 5. Cards

The primary surface. Defined as `.card` + optional `.card-hover`:

- `background: #F9F7F1` (paper), `border-radius: 20px` base, `24px` from `sm:`
- Padding: `p-md sm:p-lg`
- Hover: `transform: translateY(-2px)` over 260ms
- No visible border; the paper-on-parchment contrast carries the edge
- Internal dividers use `.rule` (not `border-t`)

## 6. Buttons

Two shapes, both `rounded-full`, both `min-height: 44px`:

- **`.btn-primary`** — ink gradient (`#2A4A3A → #1F3A2E`), paper text, soft inset highlight + outer shadow. Lifts `-1px` on hover. Use for exactly one action per screen.
- **`.btn-ghost`** — transparent, `linen` border, `ink` text. Hover swaps to `linen-soft` background + `sand` border. Use for back links, secondary actions.

Disabled state: `opacity 0.35`, `cursor: not-allowed`. Never grey out with a different color.

## 7. Forms

`.field` class covers inputs and selects:
- `min-height: 44px`, fully rounded (`border-radius: 999px`)
- `paper` background, `linen` border
- Focus: `sand-deep` border + 3px `rgba(196, 137, 47, 0.22)` ring
- `select.field` ships its own chevron via layered linear-gradients — don't replace with an icon

On narrow screens, stack input + submit (`flex-col sm:flex-row`). Submit goes full-width on base.

## 8. Atmosphere

Two fixed, pointer-events-none overlays in `app/layout.tsx` — they are load-bearing for the brand feel:

- **`.grain`** — SVG fractal noise, `opacity 0.5`, `mix-blend-mode: multiply`. Covers viewport.
- **`.sun`** — radial `sand-deep` glow anchored top-right (`-30vh / -10vw`, 80vw wide, blurred).

Main content sits at `z-index: 2` to render above both. Don't add new full-viewport overlays; they'll fight the sun.

## 9. Motion

One orchestrated page load, not scattered animations:

- **`.rise`** — 620ms ease-out, `translateY(12px) → 0` + fade.
- **`.fade`** — 800ms fade.
- **`.stagger-1…6`** — paired delays (0, 90, 180, 280, 380, 500ms). Apply to each top-level section in reading order.
- **`.tile-in`** — 360ms scale-in for heatmap tiles.

All animations respect `prefers-reduced-motion: reduce` (disabled via CSS). Hover transitions are 180–260ms on a `cubic-bezier(0.2, 0.8, 0.2, 1)` curve.

## 10. Section pattern

Sections use a consistent header: Roman numeral + serif title + trailing hairline. See `SectionHeader` in `app/page.tsx:147`:

```tsx
<div className="flex items-baseline gap-sm mb-md">
  <span className="numeral">{numeral}</span>
  <h2 className="display text-[22px] sm:text-[26px] tracking-[-0.02em] leading-[1.1]">{title}</h2>
  <div className="flex-1 h-[1px] bg-linen ml-xs" />
</div>
```

Numerals run I, II, III… top-to-bottom on a page. Inside a card, reuse `.numeral` as a small marker (e.g. day index on `/plan`).

## 11. Breakpoints

Tailwind defaults. The codebase mostly targets base + `sm:`, occasionally `md:`:

| Name | Width |
|---|---|
| base | < 640px |
| `sm:` | ≥ 640px |
| `md:` | ≥ 768px |

Test at **375px, 414px, 768px, 1024px, 1440px**. No horizontal scroll at 375px.

## 12. Accessibility

- Contrast: `ink` on `parchment`/`paper` clears WCAG AA. `smoke` is for non-essential metadata only.
- Every interactive element has a visible focus ring (`sand-deep` for fields; rely on browser default for links/buttons unless you replace it with `focus-visible`).
- Viewport in `app/layout.tsx` allows `maximumScale: 5` — don't disable zoom.
- `<html lang="en">` is set; keep it.
- `sr-only` labels for inputs whose label is visually implicit.

## 13. Shipping checklist

- [ ] Uses `.card`, `.btn-primary`/`.btn-ghost`, `.field` — not one-off styles.
- [ ] Headings use `.display` or `.display-italic`, not raw Tailwind `font-*`.
- [ ] Stats use `.stat-big` / `.stat-med` with tabular nums.
- [ ] Section padding is `py-xl sm:py-2xl`, not raw `py-2xl`.
- [ ] No horizontal scroll at 375px. Max width capped at 1120px.
- [ ] First above-the-fold section has `rise stagger-1`; sections below increment stagger.
- [ ] Respects `prefers-reduced-motion`.
- [ ] No pure black, no pure white, no unmotivated `sand-deep`.
