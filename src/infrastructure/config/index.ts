import { envSchema, type Env } from './env.schema.js';

let cachedConfig: Env | null = null;

/**
 * Parses and validates environment variables. Throws on invalid configuration.
 * @returns Validated environment configuration
 */
export function loadConfig(): Env {
  if (cachedConfig) {
    return cachedConfig;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${messages}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

/**
 * Returns the cached configuration or loads it if not yet initialized.
 * @returns Application configuration
 */
export function getConfig(): Env {
  return loadConfig();
}

/**
 * Resets cached config — for testing only.
 */
export function resetConfigForTests(): void {
  cachedConfig = null;
}
