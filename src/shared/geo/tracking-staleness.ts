import { loadConfig } from '../../config/index.js';

/**
 * Returns configured staleness window in milliseconds for tracking offline detection.
 */
export function getTrackingStalenessMs(): number {
  return loadConfig().TRACKING_STALENESS_MS;
}

/**
 * Returns configured sweep interval in milliseconds for offline event emission.
 */
export function getTrackingSweepMs(): number {
  return loadConfig().TRACKING_SWEEP_MS;
}

/**
 * Returns configured WebSocket mount path.
 */
export function getTrackingWsPath(): string {
  return loadConfig().WS_PATH;
}
