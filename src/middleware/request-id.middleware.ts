import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const existing = req.headers['x-request-id'];
  const requestId = typeof existing === 'string' ? existing : randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
