import {
  connectionText,
  mapHealthOutcome,
} from '../../src/domain/connectionState';

describe('mapHealthOutcome', () => {
  it('maps HTTP 200 with status ok to reachable', () => {
    expect(
      mapHealthOutcome({
        kind: 'response',
        status: 200,
        body: { status: 'ok', database: 'up' },
      }),
    ).toBe('reachable');
  });

  it('maps HTTP 503 to databaseUnavailable', () => {
    expect(
      mapHealthOutcome({
        kind: 'response',
        status: 503,
        body: { status: 'degraded', database: 'down' },
      }),
    ).toBe('databaseUnavailable');
  });

  it.each([
    ['timeout', { kind: 'timeout' } as const],
    ['network error', { kind: 'networkError' } as const],
    ['HTTP 500', { kind: 'response', status: 500, body: undefined } as const],
    [
      'HTTP 404',
      {
        kind: 'response',
        status: 404,
        body: { error: { code: 'NOT_FOUND' } },
      } as const,
    ],
    [
      'HTTP 200 with non-JSON body',
      { kind: 'response', status: 200, body: undefined } as const,
    ],
    [
      'HTTP 200 with wrong status',
      { kind: 'response', status: 200, body: { status: 'degraded' } } as const,
    ],
    [
      'HTTP 200 with a string body',
      { kind: 'response', status: 200, body: 'ok' } as const,
    ],
    [
      'HTTP 200 with null body',
      { kind: 'response', status: 200, body: null } as const,
    ],
  ])('maps %s to unreachable', (_label, outcome) => {
    expect(mapHealthOutcome(outcome)).toBe('unreachable');
  });
});

describe('connectionText', () => {
  it.each([
    ['checking', 'Checking backend…'],
    ['reachable', 'Backend: reachable'],
    ['databaseUnavailable', 'Backend: reachable, database unavailable'],
    ['unreachable', 'Backend: unreachable'],
  ] as const)('shows the exact text for %s', (state, text) => {
    expect(connectionText({ state })).toBe(text);
  });

  it('names the variable when misconfigured', () => {
    expect(
      connectionText({
        state: 'misconfigured',
        variable: 'EXPO_PUBLIC_API_BASE_URL',
      }),
    ).toBe(
      'Configuration error: EXPO_PUBLIC_API_BASE_URL is missing or invalid',
    );
  });
});
