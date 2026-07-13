import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('activity log search/filter api', () => {
  it('filters and searches activity logs', async () => {
    const { app, activityLogRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    activityLogRepository.seed({
      companyId: owner.companyId,
      userId: owner.userId,
      module: 'transaction',
      action: 'transaction.settled',
      eventType: 'TRANSACTION',
      resourceNumber: 'TRX-777',
      description: 'Transaction paid',
    });
    activityLogRepository.seed({
      companyId: owner.companyId,
      userId: owner.userId,
      module: 'expense',
      action: 'expense.created',
      eventType: 'EXPENSE',
      resourceNumber: 'EXP-001',
    });

    const filtered = await request(app)
      .get('/api/v1/activity-logs?module=transaction&action=transaction.settled')
      .set(owner.auth);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].resourceNumber).toBe('TRX-777');

    const searched = await request(app)
      .get('/api/v1/activity-logs?q=TRX-777&searchBy=transactionNumber')
      .set(owner.auth);
    expect(searched.status).toBe(200);
    expect(searched.body.data).toHaveLength(1);

    const invalid = await request(app).get('/api/v1/activity-logs?q=TRX-777').set(owner.auth);
    expect(invalid.status).toBe(400);
  });
});
