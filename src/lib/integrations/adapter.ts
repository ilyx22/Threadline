import "server-only";
import { integrationByProvider, type IntegrationDefinition } from "./registry";

/**
 * Integration configuration adapter.
 *
 * Validates and stores the non-secret configuration an integration collects
 * (a booking URL, a profile address). Publishing and metrics go through the
 * platform connectors (src/lib/integrations/connectors) since INT-09; the old
 * always-unavailable publish and metrics paths here were removed.
 *
 * Real interface, real registry, honest states. Adapters that cannot connect
 * without credentials we do not have return an explicit `unavailable` result —
 * they never simulate success. This is what keeps the integrations surface
 * truthful while leaving a genuine extension point.
 */

export type ConnectionResult =
  | { ok: true; connectedAt: Date; detail: string }
  | { ok: false; reason: "unavailable" | "invalid_config" | "error"; message: string };

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

export interface IntegrationAdapter {
  readonly provider: string;
  describe(): IntegrationDefinition;
  validateConfig(config: Record<string, unknown>): ValidationResult;
  connect(config: Record<string, unknown>): Promise<ConnectionResult>;
}

/**
 * Base adapter for every provider whose connection requires credentials we
 * cannot obtain in v1. It validates and stores the non-secret configuration
 * (which is genuinely useful — it labels destinations and drives the manual
 * workflow) and refuses to claim a connection.
 */
class ConfigOnlyAdapter implements IntegrationAdapter {
  constructor(readonly provider: string) {}

  describe(): IntegrationDefinition {
    const def = integrationByProvider(this.provider);
    if (!def) throw new Error(`Unknown integration provider: ${this.provider}`);
    return def;
  }

  validateConfig(config: Record<string, unknown>): ValidationResult {
    const def = this.describe();
    const errors: string[] = [];

    for (const field of def.configFields ?? []) {
      const value = config[field.key];
      if (value == null || value === "") continue;
      if (typeof value !== "string") {
        errors.push(`${field.label} must be text.`);
        continue;
      }
      if (field.type === "url" && !isHttpUrl(value)) {
        errors.push(`${field.label} must be a valid http(s) URL.`);
      }
      if (value.length > 500) errors.push(`${field.label} is too long.`);
    }

    return errors.length > 0 ? { ok: false, errors } : { ok: true };
  }

  async connect(config: Record<string, unknown>): Promise<ConnectionResult> {
    const def = this.describe();
    const validation = this.validateConfig(config);
    if (!validation.ok) {
      return { ok: false, reason: "invalid_config", message: validation.errors.join(" ") };
    }

    if (def.implementation === "available") {
      return {
        ok: true,
        connectedAt: new Date(),
        detail: "Configuration saved and in use.",
      };
    }

    return {
      ok: false,
      reason: "unavailable",
      message:
        def.blockedReason ??
        "This integration cannot complete a connection in this version. The manual workflow is available.",
    };
  }
}

/**
 * The booking link is the one integration that genuinely functions in v1,
 * because it needs no credentials: Threadline stores a URL and links to it.
 */
class BookingAdapter extends ConfigOnlyAdapter {
  constructor() {
    super("booking");
  }

  override validateConfig(config: Record<string, unknown>): ValidationResult {
    const url = config.url;
    if (typeof url !== "string" || url.trim() === "") {
      return { ok: false, errors: ["A booking URL is required."] };
    }
    if (!isHttpUrl(url)) {
      return { ok: false, errors: ["The booking URL must start with http:// or https://."] };
    }
    return { ok: true };
  }
}

const ADAPTERS = new Map<string, IntegrationAdapter>();

export function getAdapter(provider: string): IntegrationAdapter {
  const existing = ADAPTERS.get(provider);
  if (existing) return existing;

  const adapter = provider === "booking" ? new BookingAdapter() : new ConfigOnlyAdapter(provider);
  ADAPTERS.set(provider, adapter);
  return adapter;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
