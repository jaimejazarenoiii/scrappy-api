/**
 * DTO for the health endpoint response payload.
 */
export interface HealthResponseDto {
  status: 'healthy' | 'unhealthy';
  checks?: Record<string, 'up' | 'down'>;
}
