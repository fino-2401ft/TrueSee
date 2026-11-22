export const RETRY_INTERVAL_MS = 2000;

export class DatabaseUnreachableError extends Error {
  readonly code = 'DATABASE_UNREACHABLE';

  constructor(timeoutMs: number) {
    super(`Database unreachable after ${timeoutMs} ms`);
    this.name = 'DatabaseUnreachableError';
  }
}

export interface ConnectOptions {
  timeoutMs: number;
  onRetry?: (attempt: number) => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptWithin(
  ping: () => Promise<void>,
  ms: number,
): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), ms);
  });
  const attempt = ping().then(
    () => true,
    () => false,
  );
  try {
    return await Promise.race([attempt, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Calls `ping` until it succeeds, retrying every 2 s; throws once `timeoutMs` has elapsed. */
export async function connectWithTimeout(
  ping: () => Promise<void>,
  options: ConnectOptions,
): Promise<void> {
  const deadline = Date.now() + options.timeoutMs;
  for (let attempt = 1; ; attempt++) {
    if (await attemptWithin(ping, deadline - Date.now())) return;

    if (Date.now() + RETRY_INTERVAL_MS >= deadline) {
      if (deadline > Date.now()) await delay(deadline - Date.now());
      throw new DatabaseUnreachableError(options.timeoutMs);
    }
    options.onRetry?.(attempt);
    await delay(RETRY_INTERVAL_MS);
  }
}

/** `host:port/database` only — never credentials or query parameters. */
export function describeDatabaseTarget(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
}
