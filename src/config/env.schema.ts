import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    JWT_ACCESS_SECRET: z.string().min(16).default('local-access-secret-1234'),
    JWT_REFRESH_SECRET: z.string().min(16).default('local-refresh-secret-1234'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
    CORS_ORIGIN: z.string().default('*'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    UPLOAD_DIR: z.string().min(1).default('uploads'),
    /** Override storage backend. Default: local in development/test, s3 in production. */
    FILE_STORAGE_DRIVER: z.preprocess(emptyToUndefined, z.enum(['local', 's3']).optional()),
    S3_BUCKET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    S3_REGION: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    S3_ACCESS_KEY_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    S3_SECRET_ACCESS_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    /** Optional custom endpoint (Cloudflare R2, MinIO, etc.). */
    S3_ENDPOINT: z.preprocess(emptyToUndefined, z.string().url().optional()),
    S3_FORCE_PATH_STYLE: z
      .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
      .optional()
      .transform((value) => {
        if (value === undefined) return false;
        if (typeof value === 'boolean') return value;
        return value === 'true' || value === '1';
      }),
    TRACKING_STALENESS_MS: z.coerce.number().int().positive().default(300_000),
    TRACKING_SWEEP_MS: z.coerce.number().int().positive().default(60_000),
    WS_PATH: z.string().min(1).default('/ws/v1/tracking'),
  })
  .superRefine((env, ctx) => {
    const driver = env.FILE_STORAGE_DRIVER ?? (env.NODE_ENV === 'production' ? 's3' : 'local');
    if (driver !== 's3') return;

    for (const key of [
      'S3_BUCKET',
      'S3_REGION',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
    ] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required when FILE_STORAGE_DRIVER is s3 (default in production)`,
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function resolveFileStorageDriver(env: Env): 'local' | 's3' {
  return env.FILE_STORAGE_DRIVER ?? (env.NODE_ENV === 'production' ? 's3' : 'local');
}
