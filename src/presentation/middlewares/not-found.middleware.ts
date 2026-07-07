import type { RequestHandler } from 'express';
import { NotFoundError } from '../../domain/errors/not-found.error.js';
import { failure } from '../../shared/utils/api-response.js';

/**
 * Handles requests to undefined routes with a 404 envelope response.
 */
export const notFoundMiddleware: RequestHandler = (_req, res) => {
  const error = new NotFoundError();
  res.status(404).json(
    failure({
      code: error.code,
      message: error.message,
    }),
  );
};
