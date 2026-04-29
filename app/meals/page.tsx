import Link from "next/link";
import {
  BrandMark,
  PageHeader,
  PageNav,
  PageShell,
} from "../components/PageShell";

export const dynamic = "force-dynamic";

export default function MealsPage() {
  return (
    <PageShell
      width="default"
      nav={
        <PageNav
          leading={<BrandMark />}
          trailing={
            <Link href="/dashboard" className="btn-ghost shrink-0">
              ← Dashboard
            </Link>
          }
        />
      }
    >
      <PageHeader
        align="left"
        eyebrow="I — Log a meal"
        title={
          <>
            Type what you ate,{" "}
            <span className="display-italic">the way you&apos;d say it.</span>
          </>
        }
        lede="Bloom turns a sentence into fuel, protein, and carbs — no scanning barcodes, no weighing rice."
      />

      <section className="rise stagger-3">
        <div className="card p-md sm:p-lg">
          <form className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="meal"
                className="text-[14px] text-ink font-medium"
              >
                What did you eat?
              </label>
              <textarea
                id="meal"
                name="meal"
                placeholder="Bowl of oats with banana, almond butter, and a scoop of whey."
                rows={4}
                className="field"
                style={{
                  minHeight: 120,
                  padding: "12px 16px",
                  borderRadius: 20,
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-sm">
              <button
                type="button"
                disabled
                className="btn-primary w-full sm:w-auto"
              >
                Log meal
              </button>
              <Link href="/dashboard" className="btn-ghost w-full sm:w-auto">
                Cancel
              </Link>
            </div>

            <p className="text-[13px] text-smoke leading-[1.55]">
              Logging hooks up next — the form is here so you can see where it
              lives.
            </p>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
