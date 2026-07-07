import type { HealthResponseDto } from '../dtos/health-response.dto.js';
import type { HealthIndicator } from '../interfaces/health-check.interface.js';
import {
  CHECK_STATUS_DOWN,
  CHECK_STATUS_UP,
  HEALTH_STATUS_HEALTHY,
  HEALTH_STATUS_UNHEALTHY,
} from '../../shared/constants/app.constants.js';

/**
 * Application service that aggregates health checks from infrastructure indicators.
 */
export class HealthCheckService {
  private readonly databaseIndicator: HealthIndicator;

  /**
   * @param databaseIndicator - Database connectivity probe
   */
  constructor(databaseIndicator: HealthIndicator) {
    this.databaseIndicator = databaseIndicator;
  }

  /**
   * Runs all registered health checks and returns aggregate status.
   * @returns Health response DTO
   */
  async check(): Promise<HealthResponseDto> {
    const databaseUp = await this.databaseIndicator.check();

    const checks = {
      database: databaseUp ? CHECK_STATUS_UP : CHECK_STATUS_DOWN,
    } as Record<string, 'up' | 'down'>;

    const status = databaseUp ? HEALTH_STATUS_HEALTHY : HEALTH_STATUS_UNHEALTHY;

    return {
      status: status as 'healthy' | 'unhealthy',
      checks,
    };
  }
}
