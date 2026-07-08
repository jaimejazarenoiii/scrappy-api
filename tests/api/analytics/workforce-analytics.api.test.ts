import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('workforce analytics api', () => {
  it('returns workforce summaries for owner', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );

    await request(app).post('/api/v1/workforce/attendance/time-in').set(employee.auth);

    const response = await request(app).get('/api/v1/analytics/workforce').set(owner.auth);
    expect(response.status).toBe(200);
    expect(response.body.data.attendanceSummary.sessionsCount).toBeGreaterThanOrEqual(1);
    expect(response.body.data.payrollSummary).toMatchObject({
      recordsCount: expect.any(Number),
      totalGross: expect.any(Number),
      totalNetPay: expect.any(Number),
    });
    expect(response.body.data.leaveSummary).toMatchObject({
      approvedDays: expect.any(Number),
      pendingCount: expect.any(Number),
      rejectedCount: expect.any(Number),
    });
    expect(response.body.data.cashAdvanceSummary).toMatchObject({
      outstandingTotal: expect.any(Number),
      advancesCount: expect.any(Number),
      deductedTotal: expect.any(Number),
    });
  });
});
