import type { RequestHandler } from 'express';
import type { GetHealthUseCase } from '../../application/use-cases/get-health.use-case.js';
import { HEALTH_STATUS_HEALTHY } from '../../shared/constants/app.constants.js';
import { success } from '../../shared/utils/api-response.js';

/**
 * HTTP controller for the health endpoint — delegates to GetHealthUseCase.
 */
export class HealthController {
  private readonly getHealthUseCase: GetHealthUseCase;

  /**
   * @param getHealthUseCase - Health check use case
   */
  constructor(getHealthUseCase: GetHealthUseCase) {
    this.getHealthUseCase = getHealthUseCase;
  }

  /**
   * Handles GET /health — returns health status; 503 when unhealthy.
   */
  handle: RequestHandler = async (_req, res) => {
    const data = await this.getHealthUseCase.execute();
    const statusCode = data.status === HEALTH_STATUS_HEALTHY ? 200 : 503;
    res.status(statusCode).json(success(data));
  };
}
