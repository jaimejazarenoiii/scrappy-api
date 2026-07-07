import type { RequestHandler } from 'express';
import { UnauthenticatedError } from '../shared/errors/http-exceptions.js';

export const companyResolutionMiddleware: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    next(new UnauthenticatedError());
    return;
  }
  req.companyContext = { companyId: req.auth.companyId };
  next();
};
