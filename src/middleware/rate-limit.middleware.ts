import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { loadConfig } from '../config/index.js';

export function createRateLimitMiddleware(): RequestHandler {
  const config = loadConfig();
  return rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/** Tighter limit for high-frequency GPS location upserts (1 req/s per IP). */
export function createTrackingLocationRateLimitMiddleware(): RequestHandler {
  if (loadConfig().NODE_ENV === 'test') {
    return (_req, _res, next) => next();
  }
  return rateLimit({
    windowMs: 1000,
    max: 1,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many location updates' },
    },
  });
}
