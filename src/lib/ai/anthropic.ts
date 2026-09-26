import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AiError, type AiProvider, type AiRequest, type AiResult } from "./provider";

const DEFAULT_MODEL = "claude-sonnet-5";

/**
 * Live provider. Only constructed when ANTHROPIC_API_KEY is present — see
 * `getProvider()` in ./index.ts, which falls back to the demo provider otherwise.
 */
export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  readonly model: string;
  readonly isDemo = false;
  private client: Anthropic;

  constructor(apiKey: string, model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey, maxRetries: 1, timeout: 120_000 });
    this.model = model;
  }

  async complete(request: AiRequest): Promise<AiResult> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
        system: request.system,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      }, { signal: request.signal });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      if (!text) {
        throw new AiError("The model returned an empty response.", { retryable: true });
      }

      return {
        text,
        provider: this.name,
        model: this.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        isDemo: false,
      };
    } catch (error) {
      if (error instanceof AiError) throw error;

      if (error instanceof Anthropic.APIError) {
        const retryable = error.status === 429 || (error.status ?? 0) >= 500;
        throw new AiError(
          retryable
            ? "The model provider is temporarily unavailable. Try again in a moment."
            : `The model provider rejected the request (${error.status}).`,
          { cause: error, retryable },
        );
      }

      throw new AiError("Could not reach the model provider.", { cause: error, retryable: true });
    }
  }
}
