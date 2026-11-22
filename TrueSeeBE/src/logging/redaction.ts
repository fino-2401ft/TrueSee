import { randomUUID } from 'node:crypto';

export const REDACT_CENSOR = '[REDACTED]';

export const REDACT_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'set-cookie',
  'secret',
  'databaseUrl',
  'DATABASE_URL',
] as const;

const REDACT_PARENTS = ['', 'req.headers', 'req.body', 'res.headers'];

export const redactPaths: string[] = REDACT_PARENTS.flatMap((parent) =>
  REDACT_KEYS.map((key) => (parent ? `${parent}["${key}"]` : `["${key}"]`)),
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveRequestId(
  incoming: string | string[] | undefined,
): string {
  return typeof incoming === 'string' && UUID.test(incoming)
    ? incoming
    : randomUUID();
}
