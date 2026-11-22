import { jest } from '@jest/globals';
import { type ArgumentsHost, NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { ErrorCode } from '../../../src/common/error-codes.js';
import { HttpExceptionFilter } from '../../../src/common/http-exception.filter.js';

const REQUEST_ID = '0b6f3c1e-8a4d-4f7e-9c2a-1d5e6f7a8b9c';

type Mock = ReturnType<typeof jest.fn>;

function setup(): {
  filter: HttpExceptionFilter;
  host: ArgumentsHost;
  response: { status: Mock; json: Mock };
  logger: { error: Mock };
} {
  const response = { status: jest.fn(), json: jest.fn() };
  response.status.mockReturnValue(response);
  const request = { id: REQUEST_ID, method: 'GET', url: '/api/v1/unknown' };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  const logger = { error: jest.fn() };
  const filter = new HttpExceptionFilter(logger as unknown as PinoLogger);
  return { filter, host, response, logger };
}

describe('HttpExceptionFilter', () => {
  it('maps a not-found exception to 404 NOT_FOUND with the request ID', () => {
    const { filter, host, response } = setup();

    filter.catch(new NotFoundException('Cannot GET /api/v1/unknown'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'Route not found',
        requestId: REQUEST_ID,
      },
    });
  });

  it('maps an unexpected error to 500 INTERNAL_ERROR without leaking details', () => {
    const { filter, host, response, logger } = setup();
    const error = new Error('db password is hunter2');

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(500);
    const body = (response.json.mock.calls[0] as unknown[])[0];
    expect(body).toEqual({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
        requestId: REQUEST_ID,
      },
    });
    expect(JSON.stringify(body)).not.toContain('hunter2');
    expect(JSON.stringify(body)).not.toContain('at ');
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error, code: 'INTERNAL_ERROR' }),
      expect.any(String),
    );
  });

  it('exposes exactly the Phase 1 error codes', () => {
    expect(Object.values(ErrorCode).sort()).toEqual([
      'INTERNAL_ERROR',
      'NOT_FOUND',
    ]);
  });
});
