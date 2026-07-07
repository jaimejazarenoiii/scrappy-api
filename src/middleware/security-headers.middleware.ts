import helmet from 'helmet';
import type { RequestHandler } from 'express';
import { loadConfig } from '../config/index.js';

export function createSecurityHeadersMiddleware(): RequestHandler {
  const config = loadConfig();

  return helmet({
    hsts: config.NODE_ENV === 'production',
  });
}
