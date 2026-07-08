import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { seedDraftTransactionForAnalytics } from '../../setup/analytics-helpers.js';
import { setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('company analytics api', () => {
  it('returns company dashboard fields for owner', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    await seedDraftTransactionForAnalytics(app, employee.auth, employee.employeeId);

    const response = await request(app).get('/api/v1/analytics/company').set(owner.auth);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      totalInboundTransactions: expect.any(Number),
      totalOutboundTransactions: expect.any(Number),
      totalTransactionAmount: expect.any(Number),
      totalExpenses: 0,
      totalPayroll: expect.any(Number),
      netOperationalAmount: expect.any(Number),
      activeEmployees: expect.any(Number),
      activeTrips: expect.any(Number),
      activeVehicles: expect.any(Number),
      appliedFilters: {
        period: 'THIS_MONTH',
        includeArchived: false,
      },
      generatedAt: expect.any(String),
    });
    expect(response.body.data.totalInboundTransactions).toBeGreaterThanOrEqual(1);
  });
});
