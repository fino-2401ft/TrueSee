import type { HealthOutcome } from '../domain/connectionState';

export const HEALTH_TIMEOUT_MS = 10_000;

type FetchLike = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'status' | 'json'>>;

export function createHealthClient(
  apiBaseUrl: string,
  fetchImpl: FetchLike = fetch,
): () => Promise<HealthOutcome> {
  return async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      const response = await fetchImpl(`${apiBaseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }
      return { kind: 'response', status: response.status, body };
    } catch {
      return controller.signal.aborted
        ? { kind: 'timeout' }
        : { kind: 'networkError' };
    } finally {
      clearTimeout(timer);
    }
  };
}
