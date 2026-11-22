import { Writable } from 'node:stream';
import pino from 'pino';
import {
  REDACT_CENSOR,
  REDACT_KEYS,
  redactPaths,
  resolveRequestId,
} from '../../../src/logging/redaction.js';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function captureLogger(): {
  logger: pino.Logger;
  lines: () => Record<string, unknown>[];
} {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback): void {
      chunks.push(chunk.toString());
      callback();
    },
  });
  const logger = pino(
    { redact: { paths: redactPaths, censor: REDACT_CENSOR } },
    stream,
  );
  return {
    logger,
    lines: () =>
      chunks
        .join('')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l) as Record<string, unknown>),
  };
}

function valuesFor(keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, `value-of-${k}`]));
}

describe('redaction', () => {
  it('covers every key from contracts/logging.md', () => {
    expect([...REDACT_KEYS].sort()).toEqual(
      [
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
      ].sort(),
    );
  });

  it('redacts every key at the top level', () => {
    const { logger, lines } = captureLogger();

    logger.info(valuesFor(REDACT_KEYS), 'top-level');

    const [line] = lines();
    for (const key of REDACT_KEYS) {
      expect(line?.[key]).toBe(REDACT_CENSOR);
    }
  });

  it('redacts every key in request headers, request body, and response headers', () => {
    const { logger, lines } = captureLogger();

    logger.info(
      {
        req: { headers: valuesFor(REDACT_KEYS), body: valuesFor(REDACT_KEYS) },
        res: { headers: valuesFor(REDACT_KEYS) },
      },
      'nested',
    );

    const line = lines()[0] as {
      req: { headers: Record<string, unknown>; body: Record<string, unknown> };
      res: { headers: Record<string, unknown> };
    };
    for (const key of REDACT_KEYS) {
      expect(line.req.headers[key]).toBe(REDACT_CENSOR);
      expect(line.req.body[key]).toBe(REDACT_CENSOR);
      expect(line.res.headers[key]).toBe(REDACT_CENSOR);
    }
  });

  it('leaves unrelated fields untouched', () => {
    const { logger, lines } = captureLogger();

    logger.info(
      { req: { headers: { accept: 'application/json' } }, user: 'visible' },
      'plain',
    );

    expect(lines()[0]).toMatchObject({
      req: { headers: { accept: 'application/json' } },
      user: 'visible',
    });
  });

  it('never contains any original secret value in the output', () => {
    const { logger, lines } = captureLogger();

    logger.info(
      { ...valuesFor(REDACT_KEYS), req: { headers: valuesFor(REDACT_KEYS) } },
      'all',
    );

    expect(JSON.stringify(lines())).not.toContain('value-of-');
  });
});

describe('resolveRequestId', () => {
  it('keeps a valid incoming UUID', () => {
    const id = '0b6f3c1e-8a4d-4f7e-9c2a-1d5e6f7a8b9c';

    expect(resolveRequestId(id)).toBe(id);
  });

  it.each([undefined, '', 'not-a-uuid', '0b6f3c1e-8a4d-4f7e-9c2a', ['a', 'b']])(
    'replaces %p with a new UUID v4',
    (incoming) => {
      expect(resolveRequestId(incoming)).toMatch(UUID_V4);
    },
  );

  it('generates a different ID for each request', () => {
    expect(resolveRequestId(undefined)).not.toBe(resolveRequestId(undefined));
  });
});
