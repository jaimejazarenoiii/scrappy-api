import { loadConfig } from '../../config/index.js';

export function getLocationHistorySampleMs(): number {
  return loadConfig().LOCATION_HISTORY_SAMPLE_MS;
}

export function getLocationHistoryRetentionDays(): number {
  return loadConfig().LOCATION_HISTORY_RETENTION_DAYS;
}

export function getLocationHistoryRetentionSweepMs(): number {
  return loadConfig().LOCATION_HISTORY_RETENTION_SWEEP_MS;
}
