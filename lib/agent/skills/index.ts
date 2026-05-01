import { z } from "zod";
import { getRecoveryState } from "./getRecoveryState";
import { getTrainingLoad } from "./getTrainingLoad";
import { getNutritionGaps } from "./getNutritionGaps";
import { getHydrationStatus } from "./getHydrationStatus";
import { getCyclePhase } from "./getCyclePhase";
import { proposeAdjustment } from "./proposeAdjustment";
import { proposeHabitRestart } from "./proposeHabitRestart";
import { draftCrewNudge } from "./draftCrewNudge";

export type Skill = {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (input: any) => Promise<unknown>;
};

const skillList: Skill[] = [
  getRecoveryState,
  getTrainingLoad,
  getNutritionGaps,
  getHydrationStatus,
  getCyclePhase,
  proposeAdjustment,
  proposeHabitRestart,
  draftCrewNudge,
];

export const skills: Record<string, Skill> = Object.fromEntries(
  skillList.map((s) => [s.name, s]),
);

export type SkillToolDefinition = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
};

export function skillToolDefinitions(): SkillToolDefinition[] {
  return skillList.map((s) => {
    const json = z.toJSONSchema(s.inputSchema, { target: "draft-7" }) as {
      properties?: Record<string, unknown>;
      required?: string[];
    };
    return {
      name: s.name,
      description: s.description,
      input_schema: {
        type: "object" as const,
        properties: json.properties ?? {},
        required: json.required ?? [],
        additionalProperties: false as const,
      },
    };
  });
}

export type SkillRunResult =
  | {
      ok: true;
      output: unknown;
      latencyMs: number;
      validatedInput: unknown;
    }
  | {
      ok: false;
      error: string;
      latencyMs: number;
      validatedInput: unknown; // raw input when validation failed
    };

export async function runSkill(
  name: string,
  rawInput: unknown,
): Promise<SkillRunResult> {
  const start = performance.now();
  const skill = skills[name];
  if (!skill) {
    return {
      ok: false,
      error: `Unknown skill: ${name}`,
      latencyMs: Math.round(performance.now() - start),
      validatedInput: rawInput,
    };
  }
  const parsed = skill.inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Invalid input: ${parsed.error.message}`,
      latencyMs: Math.round(performance.now() - start),
      validatedInput: rawInput,
    };
  }
  try {
    const output = await skill.handler(parsed.data);
    return {
      ok: true,
      output,
      latencyMs: Math.round(performance.now() - start),
      validatedInput: parsed.data,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Skill failed",
      latencyMs: Math.round(performance.now() - start),
      validatedInput: parsed.data,
    };
  }
}
