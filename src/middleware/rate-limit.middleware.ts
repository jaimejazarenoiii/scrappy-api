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
