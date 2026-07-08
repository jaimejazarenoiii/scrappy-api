import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_ROUTES,
  seedDraftTransactionForAnalytics,
} from '../../setup/analytics-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('analytics empty range api', () => {
  it('returns zero metrics for ranges with no matching data', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    await seedDraftTransactionForAnalytics(app, employee.auth, employee.employeeId);

    const query = {
      period: 'CUSTOM',
      from: '2099-01-01T00:00:00.000Z',
      to: '2099-01-31T23:59:59.999Z',
    };

    for (const route of ANALYTICS_ROUTES) {
      const response = await request(app).get(route).query(query).set(owner.auth);
      expect(response.status).toBe(200);
      if (route.includes('/company')) {
        expect(response.body.data.totalInboundTransactions).toBe(0);
      }
      if (route.includes('/transactions')) {
        expect(response.body.data.transactionCount).toBe(0);
      }
      if (route.includes('/trips')) {
        expect(response.body.data.totalTrips).toBe(0);
      }
      if (route.includes('/expenses')) {
        expect(response.body.data.totalExpenses).toBe(0);
      }
      if (route.includes('/workforce')) {
        expect(response.body.data.attendanceSummary.sessionsCount).toBe(0);
      }
    }
  });
});
