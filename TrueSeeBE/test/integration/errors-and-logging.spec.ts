import type { Server } from 'node:http';
import request from 'supertest';
import { createTestApp, flushLogs, type TestApp } from './create-test-app.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECRET_TOKEN = 'Bearer integration-test-secret-token';

describe('error envelope and structured logging', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({
      env: { LOG_FORMAT: 'json', LOG_LEVEL: 'debug' },
    });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('returns the NOT_FOUND envelope whose requestId matches the X-Request-Id header', async () => {
    const response = await request(testApp.app.getHttpServer() as Server).get(
      '/api/v1/unknown',
    );

    expect(response.status).toBe(404);
    const requestId = response.headers['x-request-id'] as string;
    expect(requestId).toMatch(UUID);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route not found', requestId },
    });
  });

  it('writes JSON log lines with time, level, msg and a shared reqId, redacting Authorization', async () => {
    const response = await request(testApp.app.getHttpServer() as Server)
      .get('/api/v1/unknown')
      .set('Authorization', SECRET_TOKEN);
    await flushLogs();
    const requestId = response.headers['x-request-id'] as string;

    const lines = testApp.logs();
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(typeof line.time).toBe('string');
      expect(new Date(line.time as string).toISOString()).toBe(line.time);
      expect(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).toContain(
        line.level,
      );
      expect(typeof line.msg).toBe('string');
    }

    const requestLines = lines.filter((line) => line.reqId === requestId);
    expect(requestLines.length).toBeGreaterThan(0);
    const requestLog = requestLines.find((line) => line.req !== undefined) as {
      req: { method: string; url: string; headers: Record<string, unknown> };
      res: { statusCode: number };
    };
    expect(requestLog.req).toMatchObject({
      method: 'GET',
      url: '/api/v1/unknown',
    });
    expect(requestLog.req.headers.authorization).toBe('[REDACTED]');
    expect(requestLog.res.statusCode).toBe(404);
    expect(JSON.stringify(lines)).not.toContain(
      'integration-test-secret-token',
    );
  });

  it('replaces an invalid X-Request-Id with a new UUID used as the log reqId', async () => {
    const response = await request(testApp.app.getHttpServer() as Server)
      .get('/api/v1/health')
      .set('X-Request-Id', 'not-a-uuid');
    await flushLogs();

    const requestId = response.headers['x-request-id'] as string;
    expect(requestId).toMatch(UUID);
    expect(requestId).not.toBe('not-a-uuid');
    const healthLog = testApp
      .logs()
      .find((line) => line.reqId === requestId && line.req !== undefined);
    expect(healthLog).toMatchObject({ level: 'debug' });
  });

  it('keeps a valid incoming X-Request-Id', async () => {
    const incoming = '0b6f3c1e-8a4d-4f7e-9c2a-1d5e6f7a8b9c';

    const response = await request(testApp.app.getHttpServer() as Server)
      .get('/api/v1/health')
      .set('X-Request-Id', incoming);

    expect(response.headers['x-request-id']).toBe(incoming);
  });
});
