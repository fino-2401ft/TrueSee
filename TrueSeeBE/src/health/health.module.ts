import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { HealthService, healthOptionsProvider } from './health.service.js';

@Module({
  controllers: [HealthController],
  providers: [HealthService, healthOptionsProvider],
})
export class HealthModule {}
