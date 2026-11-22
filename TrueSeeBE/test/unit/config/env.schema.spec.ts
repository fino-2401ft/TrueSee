import { parseEnv } from '../../../src/config/env.schema.js';

const valid = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://user:pw@localhost:5432/truesee',
};

function errorVariables(raw: Record<string, string | undefined>): string[] {
  const result = parseEnv(raw);
  if (result.ok) {
    throw new Error('expected parseEnv to fail');
  }
  return result.errors.map((e) => e.variable);
}

describe('parseEnv', () => {
  it('parses a minimal valid config and applies defaults', () => {
    const result = parseEnv(valid);

    expect(result).toEqual({
      ok: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0',
        DATABASE_URL: valid.DATABASE_URL,
        DB_CONNECT_TIMEOUT_MS: 30000,
        HEALTH_DB_TIMEOUT_MS: 1500,
        LOG_FORMAT: 'pretty',
        LOG_LEVEL: 'info',
      },
    });
  });

  it('parses explicit values', () => {
    const result = parseEnv({
      ...valid,
      NODE_ENV: 'test',
      PORT: '8080',
      HOST: 'localhost',
      DB_CONNECT_TIMEOUT_MS: '1000',
      HEALTH_DB_TIMEOUT_MS: '1900',
      LOG_FORMAT: 'pretty',
      LOG_LEVEL: 'debug',
    });

    expect(result.ok && result.env).toMatchObject({
      NODE_ENV: 'test',
      PORT: 8080,
      HOST: 'localhost',
      DB_CONNECT_TIMEOUT_MS: 1000,
      HEALTH_DB_TIMEOUT_MS: 1900,
      LOG_FORMAT: 'pretty',
      LOG_LEVEL: 'debug',
    });
  });

  it('defaults LOG_FORMAT to json outside development', () => {
    const result = parseEnv({ ...valid, NODE_ENV: 'test' });

    expect(result.ok && result.env.LOG_FORMAT).toBe('json');
  });

  it.each(['NODE_ENV', 'DATABASE_URL'])(
    'names the missing required variable %s',
    (name) => {
      const raw: Record<string, string | undefined> = { ...valid };
      delete raw[name];

      expect(errorVariables(raw)).toEqual([name]);
    },
  );

  it.each([
    ['NODE_ENV', 'production'],
    ['PORT', '0'],
    ['PORT', '65536'],
    ['PORT', 'abc'],
    ['HOST', ''],
    ['DATABASE_URL', 'mysql://localhost/db'],
    ['DATABASE_URL', 'not a url'],
    ['DB_CONNECT_TIMEOUT_MS', '999'],
    ['DB_CONNECT_TIMEOUT_MS', '120001'],
    ['HEALTH_DB_TIMEOUT_MS', '99'],
    ['HEALTH_DB_TIMEOUT_MS', '1901'],
    ['LOG_FORMAT', 'xml'],
    ['LOG_LEVEL', 'verbose'],
  ])('rejects %s=%p and names the variable', (name, value) => {
    expect(errorVariables({ ...valid, [name]: value })).toEqual([name]);
  });

  it('accepts any non-empty HOST', () => {
    const result = parseEnv({ ...valid, HOST: '192.168.1.20' });

    expect(result.ok && result.env.HOST).toBe('192.168.1.20');
  });

  it('reports every invalid variable at once', () => {
    expect(errorVariables({ PORT: '-1' }).sort()).toEqual([
      'DATABASE_URL',
      'NODE_ENV',
      'PORT',
    ]);
  });

  it('never echoes the DATABASE_URL value in error messages', () => {
    const result = parseEnv({
      ...valid,
      DATABASE_URL: 'mysql://user:s3cret@host/db',
    });

    expect(JSON.stringify(result)).not.toContain('s3cret');
  });
});
