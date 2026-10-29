import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DatabaseService } from '../database/database.service.js';

export interface HealthStatus {
  status: 'ok';
  /** The deployed commit (set by Render), so a deployment can wait for it. */
  commit?: string;
}

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async check(): Promise<HealthStatus> {
    if (!(await this.database.isHealthy())) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'unreachable',
      });
    }
    const commit = process.env['RENDER_GIT_COMMIT'];
    return commit ? { status: 'ok', commit } : { status: 'ok' };
  }
}
