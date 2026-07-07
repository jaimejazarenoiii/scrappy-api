/**
 * Contract for infrastructure health probes (e.g. database connectivity).
 */
export interface HealthIndicator {
  /**
   * Performs a health check against a dependency.
   * @returns True when the dependency is reachable
   */
  check(): Promise<boolean>;
}
