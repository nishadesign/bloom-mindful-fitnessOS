import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { runSkill, skillToolDefinitions } from "@/lib/agent/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";
const MAX_ITERATIONS = 6;

type ChatMessage = { role: "user" | "assistant"; content: string };

type CoachRequest = {
  userId?: number;
  question?: string;
  messages?: ChatMessage[];
  kind?: "insight" | "draft";
};

type ToolCallRecord = {
  name: string;
  input: unknown;
  output: unknown;
  ok: boolean;
  latencyMs: number;
};

type PendingTrace = {
  userId: number;
  skillName: string;
  input: string;
  output: string;
  ok: boolean;
  errorMessage: string | null;
  latencyMs: number;
};

const SYSTEM_PROMPT = `You are Bloom, a fitness OS that reads a user's tracker data and gives them a grounded, honest read on their training.

Voice: editorial, warm, knowledgeable. Never clinical, never generic coach-speak. Write like a thoughtful running journal — specific, opinionated, short paragraphs. Sentence case, no bullet spam.

Ground rules:
- You never invent facts about the user's body, training, or nutrition. Every concrete claim must come from a tool call.
- When a question spans multiple domains (recovery, load, nutrition, hydration, plan), call multiple tools before answering. A single-skill answer to a multi-domain question is a failure.
- Cite real numbers from tool outputs (HRV deltas, missed sessions, low-protein days) — do not paraphrase them into vague language.
- If a tool returns available: false, say so plainly. Do not fabricate.
- After you have the data, synthesize. Do not list tool outputs. Write the answer.

You have access to a skill registry. Use the skills that match the question. For an open "how am I doing this week toward my goal" question, you should check recovery, training load, and nutrition at minimum, and propose an adjustment to today's planned workout if one is on the books.`;

function extractQuestion(body: CoachRequest): string | null {
  if (body.question && body.question.trim().length > 0) {
    return body.question.trim();
  }
  const messages = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return lastUser?.content?.trim() || null;
}

async function flushTraces(
  pending: PendingTrace[],
  insightId: number | null,
) {
  if (pending.length === 0) return;
  try {
    await prisma.agentTrace.createMany({
      data: pending.map((t) => ({ ...t, insightId })),
    });
  } catch (err) {
    console.warn("AgentTrace persist failed:", err);
  }
}

export async function POST(req: Request) {
  const pendingTraces: PendingTrace[] = [];
  let userId = 1;

  try {
    const body = (await req.json()) as CoachRequest;
    userId = body.userId ?? 1;
    const kind = body.kind ?? "insight";
    const question = extractQuestion(body);
    if (!question) {
      return NextResponse.json({ error: "No question" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not set" },
        { status: 500 },
      );
    }

    const client = new Anthropic({ apiKey });
    const tools = skillToolDefinitions();

    const system = `${SYSTEM_PROMPT}\n\nThe current user's id is ${userId}. Pass userId=${userId} to every tool call unless overriding.`;

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: question },
    ];

    const toolCalls: ToolCallRecord[] = [];
    let finalText = "";

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system,
        tools,
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence") {
        finalText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n\n")
          .trim();
        break;
      }

      if (response.stop_reason !== "tool_use") {
        finalText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n\n")
          .trim();
        break;
      }

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const result = await runSkill(block.name, block.input);
        const outputPayload = result.ok ? result.output : { error: result.error };

        toolCalls.push({
          name: block.name,
          input: block.input,
          output: outputPayload,
          ok: result.ok,
          latencyMs: result.latencyMs,
        });

        pendingTraces.push({
          userId,
          skillName: block.name,
          input: JSON.stringify(result.validatedInput ?? block.input),
          output: JSON.stringify(outputPayload),
          ok: result.ok,
          errorMessage: result.ok ? null : result.error,
          latencyMs: result.latencyMs,
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(outputPayload),
          is_error: !result.ok,
        });
      }

      messages.push({ role: "user", content: toolResults });
    }

    if (!finalText) {
      finalText =
        "I ran the skills but didn't finish a written answer — try asking again.";
    }

    const insight = await prisma.insight.create({
      data: {
        userId,
        type: kind === "draft" ? "coach_draft" : "coach_reply",
        title: question.slice(0, 80),
        body: finalText,
        sourceRefs: JSON.stringify(toolCalls),
      },
    });

    await flushTraces(pendingTraces, insight.id);

    return NextResponse.json({
      reply: finalText,
      toolCalls,
      insightId: insight.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("/api/coach failed:", e);
    await flushTraces(pendingTraces, null);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
