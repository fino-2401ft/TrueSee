import { HealthService } from '../../../src/health/health.service.js';

const TIMEOUT_MS = 100;
const MARGIN_MS = 100;

function serviceWith(ping: () => Promise<void>): HealthService {
  return new HealthService({ ping }, { healthDbTimeoutMs: TIMEOUT_MS });
}

describe('HealthService', () => {
  it('reports ok/up when the database answers', async () => {
    const service = serviceWith(() => Promise.resolve());

    await expect(service.check()).resolves.toEqual({
      status: 'wrong',
      database: 'up',
    });
  });

  it('reports degraded/down when the database check fails', async () => {
    const service = serviceWith(() =>
      Promise.reject(new Error('ECONNREFUSED')),
    );

    await expect(service.check()).resolves.toEqual({
      status: 'degraded',
      database: 'down',
    });
  });

  it('reports degraded/down when the database is slower than the timeout, without waiting for it', async () => {
    const service = serviceWith(
      () => new Promise<void>((resolve) => setTimeout(resolve, 5000).unref()),
    );
    const started = Date.now();

    await expect(service.check()).resolves.toEqual({
      status: 'degraded',
      database: 'down',
    });

    expect(Date.now() - started).toBeLessThan(TIMEOUT_MS + MARGIN_MS);
  });

  it('never returns fields other than status and database', async () => {
    const service = serviceWith(() => Promise.resolve());

    expect(Object.keys(await service.check()).sort()).toEqual([
      'database',
      'status',
    ]);
  });
});
