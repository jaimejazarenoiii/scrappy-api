import helmet from 'helmet';
import type { RequestHandler } from 'express';
import { loadConfig } from '../config/index.js';

export function createSecurityHeadersMiddleware(): RequestHandler {
  const config = loadConfig();
  const isProduction = config.NODE_ENV === 'production';

  const helmetMiddleware = helmet({
    hsts: isProduction,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isProduction
      ? undefined
      : {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            // Safari upgrades http://localhost to https:// and breaks local dev without TLS.
            'upgrade-insecure-requests': null,
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'", 'https:'],
          },
        },
  });

  return (req, res, next) => {
    // Swagger UI is dev-only documentation; skip Helmet so Safari does not force HTTPS assets.
    if (!isProduction && req.path.startsWith('/docs')) {
      next();
      return;
    }
    helmetMiddleware(req, res, next);
  };
}
