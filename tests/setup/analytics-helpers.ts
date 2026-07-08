import type { Express } from 'express';
import { createDraftTransaction } from './transaction-helpers.js';

export const ANALYTICS_ROUTES = [
  '/api/v1/analytics/company',
  '/api/v1/analytics/transactions',
  '/api/v1/analytics/trips',
  '/api/v1/analytics/expenses',
  '/api/v1/analytics/workforce',
  '/api/v1/analytics/organization',
] as const;

export async function seedDraftTransactionForAnalytics(
  app: Express,
  auth: Record<string, string>,
  employeeId: string,
) {
  return createDraftTransaction(app, auth, [employeeId]);
}
