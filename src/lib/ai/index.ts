import "server-only";
import { prisma } from "@/lib/db/client";
import { AnthropicProvider } from "./anthropic";
import { MockProvider } from "./mock";
import { AiError, extractJson, type AiProvider, type AiRequest, type AiResult } from "./provider";
import type { PromptTemplate } from "./prompts";

export { AiError } from "./provider";
export type { AiResult } from "./provider";

let cached: AiProvider | null = null;

/**
 * Resolve the active provider.
 *
 * With ANTHROPIC_API_KEY set, generation is live. Without it, the deterministic
 * demo provider runs and every result is flagged so the UI can label it. There is
 * no third state and no silent failure mode.
 */
export function getProvider(): AiProvider {
  if (cached) return cached;
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  cached = key ? new AnthropicProvider(key) : new MockProvider();
  return cached;
}

/** True when a real model will be called. Surfaced in the UI. */
export function isLiveAi() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** Reset the memoised provider. Used by tests. */
export function __resetProvider() {
  cached = null;
}

export type GenerationMeta = {
  provider: string;
  model: string;
  isDemo: boolean;
  latencyMs: number;
};

type RunOptions = {
  orgId: string | null;
  userId: string | null;
  kind: string;
  entityType?: string;
  entityId?: string;
  demoContext?: Record<string, unknown>;
};

/**
 * Execute a prompt template, record the attempt, and return the raw result.
 *
 * One retry on retryable failures (rate limit, transient upstream, unparseable
 * JSON). After that the error propagates so the UI can show a real error state
 * with a retry control — generation failures are never swallowed or faked.
 */
export async function runGeneration(
  template: PromptTemplate,
  options: RunOptions,
): Promise<{ result: AiResult; meta: GenerationMeta }> {
  const provider = getProvider();
  const request: AiRequest = {
    promptKey: template.key,
    system: template.system,
    messages: [{ role: "user", content: template.user }],
    maxTokens: template.maxTokens,
    temperature: template.temperature,
    expectsJson: true,
    demoContext: options.demoContext,
  };

  const started = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await provider.complete(request);
      const latencyMs = Date.now() - started;

      await recordGeneration(options, template.key, result, latencyMs, null);

      return {
        result,
        meta: {
          provider: result.provider,
          model: result.model,
          isDemo: result.isDemo,
          latencyMs,
        },
      };
    } catch (error) {
      lastError = error;
      const retryable = error instanceof AiError && error.retryable;
      if (!retryable || attempt === 1) break;
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  const latencyMs = Date.now() - started;
  const message = lastError instanceof Error ? lastError.message : "Generation failed.";
  await recordGeneration(options, template.key, null, latencyMs, message);

  throw lastError instanceof AiError
    ? lastError
    : new AiError(message, { cause: lastError, retryable: false });
}

/**
 * Execute a template and parse its JSON output through a validator.
 *
 * `parse` should be a Zod `safeParse`-style function. A validation failure is
 * treated as retryable once, because model output shape is the most common
 * transient problem.
 */
export async function runStructured<T>(
  template: PromptTemplate,
  options: RunOptions,
  parse: (value: unknown) => { success: true; data: T } | { success: false; error: string },
): Promise<{ data: T; meta: GenerationMeta }> {
  const attempt = async () => {
    const { result, meta } = await runGeneration(template, options);
    const json = extractJson(result.text);
    const parsed = parse(json);
    if (!parsed.success) {
      throw new AiError(`The model returned an unexpected shape: ${parsed.error}`, {
        retryable: true,
      });
    }
    return { data: parsed.data, meta };
  };

  try {
    return await attempt();
  } catch (error) {
    if (error instanceof AiError && error.retryable) {
      return attempt();
    }
    throw error;
  }
}

async function recordGeneration(
  options: RunOptions,
  promptKey: string,
  result: AiResult | null,
  latencyMs: number,
  error: string | null,
) {
  try {
    await prisma.aiGeneration.create({
      data: {
        orgId: options.orgId,
        userId: options.userId,
        kind: options.kind,
        promptKey,
        provider: result?.provider ?? getProvider().name,
        model: result?.model ?? getProvider().model,
        status: error ? "error" : "ok",
        latencyMs,
        inputTokens: result?.inputTokens ?? 0,
        outputTokens: result?.outputTokens ?? 0,
        error: error?.slice(0, 500) ?? null,
        entityType: options.entityType ?? null,
        entityId: options.entityId ?? null,
      },
    });
  } catch (e) {
    console.error("[ai] failed to record generation", e);
  }
}
