import type { Server } from 'node:http';
import request from 'supertest';
import { createTestApp, type TestApp } from './create-test-app.js';

describe('GET /api/v1/health (database down)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({
      env: {
        DATABASE_URL: 'postgresql://truesee:unused@127.0.0.1:1/truesee_test',
      },
      skipStartupCheck: true,
    });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('returns 503 degraded/down within 2 seconds', async () => {
    const started = Date.now();

    const response = await request(testApp.app.getHttpServer() as Server).get(
      '/api/v1/health',
    );

    expect(Date.now() - started).toBeLessThan(2000);
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'degraded', database: 'down' });
  });
});
