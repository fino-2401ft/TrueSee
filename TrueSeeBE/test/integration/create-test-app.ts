import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { Writable } from 'node:stream';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { DatabaseStartupCheck } from '../../src/database/database-startup.check.js';
import { LOG_DESTINATION } from '../../src/logging/logging.module.js';

export interface TestApp {
  app: INestApplication;
  logs: () => Record<string, unknown>[];
}

export async function createTestApp(
  options: { env?: Record<string, string>; skipStartupCheck?: boolean } = {},
): Promise<TestApp> {
  Object.assign(process.env, options.env);

  const chunks: string[] = [];
  const logStream = new Writable({
    write(chunk: Buffer, _encoding, callback): void {
      chunks.push(chunk.toString());
      callback();
    },
  });

  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(LOG_DESTINATION)
    .useValue(logStream);
  if (options.skipStartupCheck) {
    builder = builder.overrideProvider(DatabaseStartupCheck).useValue({});
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication({ bufferLogs: true });
  app.useLogger(app.get(Logger));
  configureApp(app);
  await app.init();

  return {
    app,
    logs: () =>
      chunks
        .join('')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}

export function flushLogs(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
