import { Global, Module } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { LoggerModule, type Params } from 'nestjs-pino';
import pino, { type DestinationStream, type LoggerOptions } from 'pino';
import { AppConfigService } from '../config/config.module.js';
import type { Env } from '../config/env.schema.js';
import { REDACT_CENSOR, redactPaths, resolveRequestId } from './redaction.js';

export const LOG_DESTINATION = Symbol('LOG_DESTINATION');

const HEALTH_PATH = '/api/v1/health';

export function baseLoggerOptions(level: Env['LOG_LEVEL']): LoggerOptions {
  return {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
    redact: { paths: redactPaths, censor: REDACT_CENSOR },
  };
}

export function createLoggerParams(
  env: Env,
  destination: DestinationStream,
): Params {
  const options = {
    ...baseLoggerOptions(env.LOG_LEVEL),
    // Bind only `reqId` to request-scoped loggers (contracts/logging.md).
    quietReqLogger: true,
    genReqId: (req: IncomingMessage, res: ServerResponse): string => {
      const id = resolveRequestId(req.headers['x-request-id']);
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customLogLevel: (
      req: IncomingMessage,
      res: ServerResponse,
      err?: Error,
    ) => {
      if (req.url?.startsWith(HEALTH_PATH)) return 'debug' as const;
      if (err || res.statusCode >= 500) return 'error' as const;
      if (res.statusCode >= 400) return 'warn' as const;
      return 'info' as const;
    },
    serializers: {
      req: (req: {
        method: string;
        url: string;
        headers: Record<string, unknown>;
      }) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
  };

  if (env.LOG_FORMAT === 'pretty') {
    return {
      pinoHttp: {
        ...options,
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            translateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss.l'Z'",
          },
        },
      },
    };
  }
  return { pinoHttp: [options, destination] };
}

/** Logger for failures that happen before the Nest application (and its logger) exists. */
export function createBootstrapLogger(): pino.Logger {
  return pino(baseLoggerOptions('info'));
}

@Global()
@Module({
  providers: [{ provide: LOG_DESTINATION, useValue: process.stdout }],
  exports: [LOG_DESTINATION],
})
class LogDestinationModule {}

@Module({
  imports: [
    LogDestinationModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService, LOG_DESTINATION],
      useFactory: (config: AppConfigService, destination: DestinationStream) =>
        createLoggerParams(config.values, destination),
    }),
  ],
})
export class LoggingModule {}
