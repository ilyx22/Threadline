/**
 * Provider abstraction.
 *
 * Nothing outside `src/lib/ai` imports a model SDK. UI and server actions call
 * generators, generators call `runGeneration`, and `runGeneration` calls whichever
 * provider is configured. Swapping or adding a provider touches this directory only.
 */

export type AiMessage = { role: "user" | "assistant"; content: string };

export type AiRequest = {
  /** Stable identifier for the prompt template, recorded for accountability. */
  promptKey: string;
  system: string;
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
  /** When set, the provider is asked to return JSON matching this shape description. */
  expectsJson?: boolean;
  /** AI-08/AI-09: cancels the request; a cancelled generation is recorded and never retried. */
  signal?: AbortSignal;
  /**
   * Structured inputs for the deterministic demo provider. The live provider
   * ignores this entirely; it exists so the demo provider can produce coherent,
   * workspace-specific output without regex-parsing the prose prompt.
   */
  demoContext?: Record<string, unknown>;
};

export type AiResult = {
  text: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** True when the output came from the deterministic demo provider. */
  isDemo: boolean;
};

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  readonly isDemo: boolean;
  complete(request: AiRequest): Promise<AiResult>;
}

export class AiError extends Error {
  cause?: unknown;
  retryable: boolean;
  constructor(message: string, options: { cause?: unknown; retryable?: boolean } = {}) {
    super(message);
    this.name = "AiError";
    this.cause = options.cause;
    this.retryable = options.retryable ?? false;
  }
}

/**
 * Extract a JSON value from a model response.
 *
 * Models occasionally wrap JSON in prose or a fenced block. This recovers the
 * payload rather than failing the whole generation, but it never invents data:
 * if nothing parses, the caller surfaces a real error state.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  const direct = tryParse(trimmed);
  if (direct !== undefined) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed !== undefined) return parsed;
  }

  const firstBrace = trimmed.search(/[[{]/);
  if (firstBrace >= 0) {
    const lastBrace = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (lastBrace > firstBrace) {
      const parsed = tryParse(trimmed.slice(firstBrace, lastBrace + 1));
      if (parsed !== undefined) return parsed;
    }
  }

  throw new AiError("The model did not return usable JSON.", { retryable: true });
}

function tryParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
