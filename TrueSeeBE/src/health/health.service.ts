import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/config.module.js';
import { PrismaService } from '../database/prisma.service.js';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
}

export interface DatabasePing {
  ping(): Promise<void>;
}

export interface HealthOptions {
  healthDbTimeoutMs: number;
}

export const HEALTH_OPTIONS = Symbol('HEALTH_OPTIONS');

export const healthOptionsProvider = {
  provide: HEALTH_OPTIONS,
  inject: [AppConfigService],
  useFactory: (config: AppConfigService): HealthOptions => ({
    healthDbTimeoutMs: config.get('HEALTH_DB_TIMEOUT_MS'),
  }),
};

@Injectable()
export class HealthService {
  constructor(
    @Inject(PrismaService) private readonly database: DatabasePing,
    @Inject(HEALTH_OPTIONS) private readonly options: HealthOptions,
  ) {}

  async check(): Promise<HealthStatus> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), this.options.healthDbTimeoutMs);
    });
    const ping = this.database.ping().then(
      () => true,
      () => false,
    );

    const up = await Promise.race([ping, timeout]);
    clearTimeout(timer);

    return up
      ? { status: 'ok', database: 'up' }
      : { status: 'degraded', database: 'down' };
  }
}

// CI negative check — intentional lint error
const __ciLintErrorUnused = 42;

