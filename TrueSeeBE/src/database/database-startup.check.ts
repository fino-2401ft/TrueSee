import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AppConfigService } from '../config/config.module.js';
import {
  connectWithTimeout,
  describeDatabaseTarget,
} from './connect-with-timeout.js';
import { PrismaService } from './prisma.service.js';

/** Refuses to start the application until the database answers (FR-007). */
@Injectable()
export class DatabaseStartupCheck implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    @InjectPinoLogger(DatabaseStartupCheck.name)
    private readonly logger: PinoLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    const target = describeDatabaseTarget(this.config.get('DATABASE_URL'));
    await connectWithTimeout(() => this.prisma.ping(), {
      timeoutMs: this.config.get('DB_CONNECT_TIMEOUT_MS'),
      onRetry: (attempt) =>
        this.logger.warn(
          { attempt, target },
          'Database not reachable yet, retrying',
        ),
    });
    this.logger.info({ target }, 'Database connected');
  }
}
