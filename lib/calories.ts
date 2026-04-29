export type Sex = "female" | "male";
export type WeightGoal = "maintain" | "lose" | "gain";

export const ACTIVITY_FACTOR = 1.55;
export const DEFICIT_OR_SURPLUS_KCAL = 400;

type Inputs = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
};

export function mifflinStJeorBmr({
  sex,
  ageYears,
  heightCm,
  weightKg,
}: Inputs): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === "male" ? base + 5 : base - 161;
}

export function tdee(inputs: Inputs): number {
  return mifflinStJeorBmr(inputs) * ACTIVITY_FACTOR;
}

export function calorieTarget(
  inputs: Inputs,
  goal: WeightGoal,
): { bmr: number; tdee: number; target: number } {
  const bmr = mifflinStJeorBmr(inputs);
  const t = bmr * ACTIVITY_FACTOR;
  const adj =
    goal === "lose"
      ? -DEFICIT_OR_SURPLUS_KCAL
      : goal === "gain"
        ? DEFICIT_OR_SURPLUS_KCAL
        : 0;
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(t),
    target: Math.round(t + adj),
  };
}

export function isValidInputs(input: Partial<Inputs>): input is Inputs {
  return (
    (input.sex === "female" || input.sex === "male") &&
    typeof input.ageYears === "number" &&
    input.ageYears >= 13 &&
    input.ageYears <= 100 &&
    typeof input.heightCm === "number" &&
    input.heightCm >= 100 &&
    input.heightCm <= 230 &&
    typeof input.weightKg === "number" &&
    input.weightKg >= 30 &&
    input.weightKg <= 200
  );
}
