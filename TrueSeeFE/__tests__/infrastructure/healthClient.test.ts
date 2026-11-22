import {
  createHealthClient,
  HEALTH_TIMEOUT_MS,
} from '../../src/infrastructure/healthClient';

const BASE_URL = 'http://10.0.2.2:3000/api/v1';

function jsonResponse(status: number, body: unknown): Response {
  return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

describe('createHealthClient', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses a 10 second timeout', () => {
    expect(HEALTH_TIMEOUT_MS).toBe(10_000);
  });

  it('calls {base}/health and returns status and parsed body', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(200, { status: 'ok', database: 'up' }));
    const fetchHealth = createHealthClient(BASE_URL, fetchImpl);

    await expect(fetchHealth()).resolves.toEqual({
      kind: 'response',
      status: 200,
      body: { status: 'ok', database: 'up' },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://10.0.2.2:3000/api/v1/health',
      expect.objectContaining({
        method: 'GET',
        signal: expect.any(Object) as AbortSignal,
      }),
    );
  });

  it('returns an undefined body when the response is not JSON', async () => {
    const response = {
      status: 200,
      json: () => Promise.reject(new SyntaxError('bad json')),
    };
    const fetchHealth = createHealthClient(
      BASE_URL,
      jest.fn().mockResolvedValue(response),
    );

    await expect(fetchHealth()).resolves.toEqual({
      kind: 'response',
      status: 200,
      body: undefined,
    });
  });

  it('reports a network error', async () => {
    const fetchHealth = createHealthClient(
      BASE_URL,
      jest.fn().mockRejectedValue(new TypeError('Network request failed')),
    );

    await expect(fetchHealth()).resolves.toEqual({ kind: 'networkError' });
  });

  it('aborts after 10 seconds and reports a timeout', async () => {
    jest.useFakeTimers();
    let signal: AbortSignal | undefined;
    const fetchImpl = jest.fn((_url: string, init: RequestInit) => {
      signal = init.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () =>
          reject(new Error('Aborted')),
        );
      });
    });
    const fetchHealth = createHealthClient(BASE_URL, fetchImpl);

    const pending = fetchHealth();
    jest.advanceTimersByTime(HEALTH_TIMEOUT_MS - 1);
    expect(signal?.aborted).toBe(false);
    jest.advanceTimersByTime(1);

    await expect(pending).resolves.toEqual({ kind: 'timeout' });
    expect(signal?.aborted).toBe(true);
  });
});
