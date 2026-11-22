import type { Server } from 'node:http';
import request from 'supertest';
import { createTestApp, type TestApp } from './create-test-app.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mirrors contracts/health.openapi.yaml#/components/schemas/HealthStatus.
function expectHealthStatusSchema(body: unknown): void {
  expect(body).toEqual(expect.any(Object));
  const record = body as Record<string, unknown>;
  expect(Object.keys(record).sort()).toEqual(['database', 'status']);
  expect(['ok', 'degraded']).toContain(record.status);
  expect(['up', 'down']).toContain(record.database);
}

describe('GET /api/v1/health (database up)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('returns 200 ok/up within 2 seconds with a request ID header', async () => {
    const started = Date.now();

    const response = await request(testApp.app.getHttpServer() as Server).get(
      '/api/v1/health',
    );

    expect(Date.now() - started).toBeLessThan(2000);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'up' });
    expectHealthStatusSchema(response.body);
    expect(response.headers['x-request-id']).toMatch(UUID);
  });

  it('requires no authentication and returns no extra data', async () => {
    const response = await request(testApp.app.getHttpServer() as Server)
      .get('/api/v1/health')
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toMatch(
      /version|host|port|password|url/i,
    );
  });
});
