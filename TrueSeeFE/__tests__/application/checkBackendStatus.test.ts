import { createCheckBackendStatus } from '../../src/application/checkBackendStatus';
import type { HealthOutcome } from '../../src/domain/connectionState';

describe('createCheckBackendStatus', () => {
  it('returns the state mapped from the client outcome', async () => {
    const check = createCheckBackendStatus(() =>
      Promise.resolve<HealthOutcome>({
        kind: 'response',
        status: 503,
        body: undefined,
      }),
    );

    await expect(check()).resolves.toBe('databaseUnavailable');
  });

  it('does not start a second request while one is in flight', async () => {
    let resolveFetch: (outcome: HealthOutcome) => void = () => undefined;
    const fetchHealth = jest.fn(
      () =>
        new Promise<HealthOutcome>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const check = createCheckBackendStatus(fetchHealth);

    const first = check();
    const second = check();
    resolveFetch({ kind: 'response', status: 200, body: { status: 'ok' } });

    await expect(Promise.all([first, second])).resolves.toEqual([
      'reachable',
      'reachable',
    ]);
    expect(fetchHealth).toHaveBeenCalledTimes(1);
  });

  it('starts a new request once the previous one has finished', async () => {
    const fetchHealth = jest
      .fn<Promise<HealthOutcome>, []>()
      .mockResolvedValueOnce({ kind: 'networkError' })
      .mockResolvedValueOnce({
        kind: 'response',
        status: 200,
        body: { status: 'ok' },
      });
    const check = createCheckBackendStatus(fetchHealth);

    await expect(check()).resolves.toBe('unreachable');
    await expect(check()).resolves.toBe('reachable');
    expect(fetchHealth).toHaveBeenCalledTimes(2);
  });

  it('maps an unexpected client failure to unreachable instead of throwing', async () => {
    const check = createCheckBackendStatus(() =>
      Promise.reject(new Error('boom')),
    );

    await expect(check()).resolves.toBe('unreachable');
  });
});
