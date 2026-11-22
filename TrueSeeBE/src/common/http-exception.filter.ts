import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ErrorCode, type ErrorEnvelope } from './error-codes.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(HttpExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { id?: string }>();
    const response = http.getResponse<Response>();
    const requestId = request.id ?? '';

    let status: number;
    let body: ErrorEnvelope;
    if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      body = {
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Route not found',
          requestId,
        },
      };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
          requestId,
        },
      };
      this.logger.error(
        { err: exception, code: ErrorCode.INTERNAL_ERROR },
        'Unhandled error',
      );
    }

    response.status(status).json(body);
  }
}
