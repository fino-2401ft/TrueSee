/** Outcome of one liveness request, independent of how it was made. */
export type HealthOutcome =
  | { kind: 'response'; status: number; body: unknown }
  | { kind: 'timeout' }
  | { kind: 'networkError' };

export type ReachabilityState =
  'reachable' | 'databaseUnavailable' | 'unreachable';

export type ConnectionState = 'checking' | ReachabilityState | 'misconfigured';

export type ConnectionView =
  | { state: 'checking' | ReachabilityState }
  | { state: 'misconfigured'; variable: string };

function isOkBody(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { status?: unknown }).status === 'ok'
  );
}

export function mapHealthOutcome(outcome: HealthOutcome): ReachabilityState {
  if (outcome.kind !== 'response') return 'unreachable';
  if (outcome.status === 200 && isOkBody(outcome.body)) return 'reachable';
  if (outcome.status === 503) return 'databaseUnavailable';
  return 'unreachable';
}

export function connectionText(view: ConnectionView): string {
  switch (view.state) {
    case 'checking':
      return 'Checking backend…';
    case 'reachable':
      return 'Backend: reachable';
    case 'databaseUnavailable':
      return 'Backend: reachable, database unavailable';
    case 'unreachable':
      return 'Backend: unreachable';
    case 'misconfigured':
      return `Configuration error: ${view.variable} is missing or invalid`;
  }
}
