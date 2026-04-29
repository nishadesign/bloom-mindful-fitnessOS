"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calorieTarget,
  isValidInputs,
  type Sex,
  type WeightGoal,
} from "@/lib/calories";

type Props = {
  defaults: {
    name: string;
    ageYears: number | null;
    heightCm: number | null;
    weightKg: number | null;
    sex: Sex | null;
    weightGoal: WeightGoal | null;
    goal: string;
  };
  bioFromOura?: boolean;
};

export default function OnboardingForm({
  defaults,
  bioFromOura = false,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaults.name ?? "");
  const [age, setAge] = useState(
    defaults.ageYears ? String(defaults.ageYears) : "",
  );
  const [height, setHeight] = useState(
    defaults.heightCm ? String(defaults.heightCm) : "",
  );
  const [weight, setWeight] = useState(
    defaults.weightKg ? String(defaults.weightKg) : "",
  );
  const [sex, setSex] = useState<Sex | null>(defaults.sex);
  const [weightGoal, setWeightGoal] = useState<WeightGoal>(
    defaults.weightGoal ?? "maintain",
  );
  const [goal, setGoal] = useState("");

  const hasBio =
    Boolean(name.trim()) &&
    Boolean(age) &&
    Boolean(height) &&
    Boolean(weight) &&
    Boolean(sex);
  const [editingBio, setEditingBio] = useState(!hasBio);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calorieMath = useMemo(() => {
    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);
    const inputs = {
      sex: sex ?? undefined,
      ageYears: ageNum || undefined,
      heightCm: heightNum || undefined,
      weightKg: weightNum || undefined,
    };
    if (!isValidInputs(inputs)) return null;
    return calorieTarget(inputs, weightGoal);
  }, [age, height, weight, sex, weightGoal]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Tell us your name.");
    if (!sex) return setError("Pick your biological sex for BMR math.");
    if (!goal.trim()) return setError("What are you working toward?");
    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);
    if (!ageNum || ageNum < 13 || ageNum > 100)
      return setError("Age should be between 13 and 100.");
    if (!heightNum || heightNum < 100 || heightNum > 230)
      return setError("Height in cm, please (100–230).");
    if (!weightNum || weightNum < 30 || weightNum > 200)
      return setError("Weight in kg, please (30–200).");

    setBusy(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ageYears: ageNum,
          heightCm: heightNum,
          weightKg: weightNum,
          sex,
          weightGoal,
          goal: goal.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong");
        return;
      }
      router.push("/dashboard?welcome=1");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-lg">
      {editingBio ? (
        <BioEditor
          name={name}
          setName={setName}
          age={age}
          setAge={setAge}
          height={height}
          setHeight={setHeight}
          weight={weight}
          setWeight={setWeight}
          sex={sex}
          setSex={setSex}
          bioFromOura={bioFromOura}
          canClose={hasBio}
          onDone={() => setEditingBio(false)}
        />
      ) : (
        <BioSummary
          name={name}
          age={age}
          height={height}
          weight={weight}
          sex={sex}
          bioFromOura={bioFromOura}
          onEdit={() => setEditingBio(true)}
        />
      )}

      <Field label="Weight goal" htmlFor="weight-goal">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
          <GoalCard
            id="maintain"
            title="Maintain"
            body="Stay where I am, eat to train well."
            active={weightGoal === "maintain"}
            onClick={() => setWeightGoal("maintain")}
          />
          <GoalCard
            id="lose"
            title="Lose"
            body="Gentle deficit, keep the energy."
            active={weightGoal === "lose"}
            onClick={() => setWeightGoal("lose")}
          />
          <GoalCard
            id="gain"
            title="Gain"
            body="Gentle surplus, build strength."
            active={weightGoal === "gain"}
            onClick={() => setWeightGoal("gain")}
          />
        </div>
      </Field>

      <Field label="What are you working toward?" htmlFor="goal">
        <textarea
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Feel strong on long runs without burning out — train for a half in the fall, keep CrossFit twice a week."
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
      </Field>

      {calorieMath && (
        <aside className="card-soft p-md">
          <p className="numeral mb-xs">your starting point</p>
          <p className="stat-big text-[36px] sm:text-[44px] text-ink mb-xs">
            {calorieMath.target.toLocaleString()}
            <span className="text-[18px] sm:text-[20px] ml-xs text-graphite display-italic">
              kcal / day
            </span>
          </p>
          <p className="text-[13px] sm:text-[14px] text-graphite leading-[1.55]">
            BMR {calorieMath.bmr.toLocaleString()} · maintenance{" "}
            {calorieMath.tdee.toLocaleString()}
            {weightGoal !== "maintain" && (
              <>
                {" "}
                ·{" "}
                <span className="text-smoke">
                  {weightGoal === "lose" ? "−400" : "+400"} for{" "}
                  {weightGoal === "lose" ? "deficit" : "surplus"}
                </span>
              </>
            )}
          </p>
          <p className="text-[12px] text-smoke mt-xs">
            We&apos;ll refine this as we see your data.
          </p>
        </aside>
      )}

      {error && (
        <p className="text-[14px] text-graphite">
          <span className="display-italic text-ink">Hold on —</span> {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-sm mt-sm">
        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full sm:w-auto"
        >
          {busy ? "Saving…" : "See my dashboard →"}
        </button>
      </div>
    </form>
  );
}

function BioSummary({
  name,
  age,
  height,
  weight,
  sex,
  bioFromOura,
  onEdit,
}: {
  name: string;
  age: string;
  height: string;
  weight: string;
  sex: Sex | null;
  bioFromOura: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="card p-md sm:p-lg">
      <div className="flex items-start justify-between gap-sm mb-md">
        <div className="min-w-0">
          <p className="text-[13px] text-smoke mb-[2px]">You</p>
          <p className="display text-[24px] sm:text-[28px] tracking-[-0.015em] text-ink leading-[1.15] break-words">
            {name || "—"}
          </p>
          {bioFromOura && (
            <p className="text-[12px] text-smoke mt-xs">
              Pulled from Oura — edit any time.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-[13px] text-ink hover:text-graphite transition-colors underline underline-offset-2 shrink-0"
        >
          Edit
        </button>
      </div>

      <div className="flex flex-wrap gap-x-md gap-y-xs text-[15px] sm:text-[16px] text-ink">
        <BioValue value={sex ? sex.charAt(0).toUpperCase() + sex.slice(1) : "—"} />
        <BioValue value={age ? `${age} yrs` : "—"} />
        <BioValue value={height ? `${height} cm` : "—"} />
        <BioValue value={weight ? `${weight} kg` : "—"} />
      </div>
    </div>
  );
}

function BioValue({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center after:content-['·'] after:ml-md after:text-smoke last:after:content-none">
      {value}
    </span>
  );
}

function BioEditor({
  name,
  setName,
  age,
  setAge,
  height,
  setHeight,
  weight,
  setWeight,
  sex,
  setSex,
  bioFromOura,
  canClose,
  onDone,
}: {
  name: string;
  setName: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
  sex: Sex | null;
  setSex: (v: Sex) => void;
  bioFromOura: boolean;
  canClose: boolean;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-lg">
      {bioFromOura && (
        <div className="card-soft p-sm flex items-start gap-xs">
          <span className="numeral" aria-hidden>
            ✓
          </span>
          <p className="text-[13px] sm:text-[14px] text-graphite leading-[1.55]">
            <span className="text-ink font-medium">Pulled from Oura</span> —
            age, sex, height, weight. Edit if anything&apos;s off.
          </p>
        </div>
      )}

      <Field label="Your name" htmlFor="name">
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nisha"
          autoComplete="given-name"
          className="field"
        />
      </Field>

      <Field label="Biological sex" htmlFor="sex">
        <div
          role="tablist"
          aria-label="Sex"
          className="inline-flex rounded-full border border-linen p-[3px] gap-[3px] bg-paper self-start"
        >
          {(["female", "male"] as const).map((opt) => {
            const active = sex === opt;
            return (
              <button
                key={opt}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSex(opt)}
                className={
                  "px-md min-h-[40px] text-[14px] rounded-full transition-colors capitalize " +
                  (active ? "bg-ink text-paper" : "text-graphite hover:text-ink")
                }
              >
                {opt}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Age" htmlFor="age">
        <input
          id="age"
          type="number"
          inputMode="numeric"
          min={13}
          max={100}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="28"
          className="field"
        />
      </Field>

      <Field label="Height (cm)" htmlFor="height">
        <input
          id="height"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="165"
          className="field"
        />
      </Field>

      <Field label="Weight (kg)" htmlFor="weight">
        <input
          id="weight"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="56"
          className="field"
        />
      </Field>

      {canClose && (
        <div className="flex">
          <button
            type="button"
            onClick={onDone}
            className="btn-ghost"
          >
            Done editing
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  trailing,
  children,
}: {
  label: string;
  htmlFor: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-baseline justify-between gap-sm">
        <label
          htmlFor={htmlFor}
          className="text-[14px] sm:text-[15px] text-ink font-medium"
        >
          {label}
        </label>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function GoalCard({
  id,
  title,
  body,
  active,
  onClick,
}: {
  id: string;
  title: string;
  body: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={title}
      id={`weight-goal-${id}`}
      onClick={onClick}
      className="text-left rounded-[18px] p-md transition-shadow bg-paper border border-linen"
      style={{
        boxShadow: active ? "inset 0 0 0 2px var(--color-ink)" : "none",
      }}
    >
      <p className="display text-[20px] tracking-[-0.015em] mb-xs text-ink">
        {title}
      </p>
      <p className="text-[13px] leading-[1.5] text-graphite">{body}</p>
    </button>
  );
}
