import type { RequestHandler } from 'express';
import { failure } from '../shared/http/api-response.js';
import { ERROR_CODES } from '../shared/errors/error-codes.js';

export const notFoundMiddleware: RequestHandler = (_req, res) => {
  res
    .status(404)
    .json(
      failure({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Resource not found', details: [] }),
    );
};
