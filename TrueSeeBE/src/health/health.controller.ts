import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthService, type HealthStatus } from './health.service.js';

class HealthStatusDto implements HealthStatus {
  @ApiProperty({ enum: ['ok', 'degraded'] })
  status: 'ok' | 'degraded';

  @ApiProperty({ enum: ['up', 'down'] })
  database: 'up' | 'down';
}

/** Public liveness endpoint (Constitution V v1.0.1): no auth, no writes, no extra data. */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({
    operationId: 'getHealth',
    summary: 'Liveness and database reachability',
  })
  @ApiOkResponse({
    type: HealthStatusDto,
    description: 'Service and database are healthy.',
  })
  @ApiServiceUnavailableResponse({
    type: HealthStatusDto,
    description: 'Service is running but the database is unavailable.',
  })
  async getHealth(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthStatus> {
    const result = await this.health.check();
    res.status(
      result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );
    return result;
  }
}
