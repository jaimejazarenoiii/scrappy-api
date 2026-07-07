import cors from 'cors';
import type { RequestHandler } from 'express';
import { loadConfig } from '../config/index.js';

export function createCorsMiddleware(): RequestHandler {
  const config = loadConfig();
  const origin =
    config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map((value) => value.trim());
  return cors({ origin, credentials: true });
}
