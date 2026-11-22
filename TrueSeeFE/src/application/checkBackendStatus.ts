import {
  type HealthOutcome,
  mapHealthOutcome,
  type ReachabilityState,
} from '../domain/connectionState';

/** Returns a check that never runs two requests at once: concurrent calls share the in-flight one. */
export function createCheckBackendStatus(
  fetchHealth: () => Promise<HealthOutcome>,
): () => Promise<ReachabilityState> {
  let inFlight: Promise<ReachabilityState> | null = null;

  return () => {
    inFlight ??= fetchHealth()
      .then(mapHealthOutcome, (): ReachabilityState => 'unreachable')
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  };
}
