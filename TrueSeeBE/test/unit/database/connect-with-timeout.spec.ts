import { jest } from '@jest/globals';
import {
  connectWithTimeout,
  DatabaseUnreachableError,
  describeDatabaseTarget,
  RETRY_INTERVAL_MS,
} from '../../../src/database/connect-with-timeout.js';

describe('connectWithTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retries every 2 seconds', () => {
    expect(RETRY_INTERVAL_MS).toBe(2000);
  });

  it('resolves immediately when the first attempt succeeds', async () => {
    const ping = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

    await connectWithTimeout(ping, { timeoutMs: 30000 });

    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('retries until the database becomes available', async () => {
    const ping = jest
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue(undefined);
    const onRetry = jest.fn();

    const done = connectWithTimeout(ping, { timeoutMs: 30000, onRetry });
    await jest.advanceTimersByTimeAsync(RETRY_INTERVAL_MS * 2);
    await done;

    expect(ping).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('throws DATABASE_UNREACHABLE once the timeout has elapsed', async () => {
    const ping = jest
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error('ECONNREFUSED'));

    const done = connectWithTimeout(ping, { timeoutMs: 5000 });
    const assertion = expect(done).rejects.toMatchObject({
      code: 'DATABASE_UNREACHABLE',
    });
    await jest.advanceTimersByTimeAsync(5000);
    await assertion;

    await expect(done).rejects.toBeInstanceOf(DatabaseUnreachableError);
    expect(ping.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(ping.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it('gives up on an attempt that hangs past the deadline', async () => {
    const ping = jest.fn<() => Promise<void>>(
      () => new Promise<void>(() => undefined),
    );

    const done = connectWithTimeout(ping, { timeoutMs: 3000 });
    const assertion = expect(done).rejects.toMatchObject({
      code: 'DATABASE_UNREACHABLE',
    });
    await jest.advanceTimersByTimeAsync(3000);
    await assertion;
  });
});

describe('describeDatabaseTarget', () => {
  it('returns only host:port/database, without credentials', () => {
    expect(
      describeDatabaseTarget(
        'postgresql://truesee:s3cret@localhost:5433/truesee?schema=public',
      ),
    ).toBe('localhost:5433/truesee');
  });

  it('uses the default PostgreSQL port when none is given', () => {
    expect(describeDatabaseTarget('postgresql://u:p@db.local/app')).toBe(
      'db.local:5432/app',
    );
  });
});
