import type { HealthResponseDto } from '../dtos/health-response.dto.js';
import { HealthCheckService } from '../services/health-check.service.js';

/**
 * Use case: returns application health status for GET /health.
 */
export class GetHealthUseCase {
  private readonly healthCheckService: HealthCheckService;

  /**
   * @param healthCheckService - Health aggregation service
   */
  constructor(healthCheckService: HealthCheckService) {
    this.healthCheckService = healthCheckService;
  }

  /**
   * @returns Health response DTO with dependency check results
   */
  async execute(): Promise<HealthResponseDto> {
    return this.healthCheckService.check();
  }
}
