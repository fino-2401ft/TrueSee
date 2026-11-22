import { z } from 'zod';

const intInRange = (
  min: number,
  max: number,
  fallback: number,
): z.ZodDefault<z.ZodCoercedNumber> =>
  z.coerce.number().int().min(min).max(max).default(fallback);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test']),
    PORT: intInRange(1, 65535, 3000),
    HOST: z.string().min(1).default('0.0.0.0'),
    DATABASE_URL: z
      .string({ error: 'is required' })
      .refine(
        (value) => /^postgres(ql)?:\/\/[^\s]+$/.test(value),
        'must be a postgresql:// URL',
      ),
    DB_CONNECT_TIMEOUT_MS: intInRange(1000, 120000, 30000),
    HEALTH_DB_TIMEOUT_MS: intInRange(100, 1900, 1500),
    LOG_FORMAT: z.enum(['pretty', 'json']).optional(),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
  })
  .transform((env) => ({
    ...env,
    LOG_FORMAT:
      env.LOG_FORMAT ?? (env.NODE_ENV === 'development' ? 'pretty' : 'json'),
  }));

export type Env = z.output<typeof envSchema>;

export interface EnvError {
  variable: string;
  message: string;
}

export type ParseEnvResult =
  { ok: true; env: Env } | { ok: false; errors: EnvError[] };

export function parseEnv(
  raw: Record<string, string | undefined>,
): ParseEnvResult {
  const result = envSchema.safeParse(raw);
  if (result.success) {
    return { ok: true, env: result.data };
  }
  const errors = result.error.issues.map((issue) => ({
    variable: String(issue.path[0] ?? 'unknown'),
    // Zod messages describe the rule only; input values (which may be secrets) are never included.
    message: issue.message,
  }));
  return { ok: false, errors };
}
