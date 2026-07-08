import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { seedDraftTransactionForAnalytics } from '../../setup/analytics-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('analytics archived api', () => {
  it('excludes archived transactions by default and includes them when requested', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const create = await seedDraftTransactionForAnalytics(app, employee.auth, employee.employeeId);
    const transactionId = create.body.data.id as string;

    const beforeArchive = await request(app).get('/api/v1/analytics/transactions').set(owner.auth);
    expect(beforeArchive.body.data.transactionCount).toBeGreaterThanOrEqual(1);

    const archive = await request(app)
      .post(`/api/v1/transactions/${transactionId}/archive`)
      .set(owner.auth);
    expect(archive.status).toBe(200);

    const defaultView = await request(app).get('/api/v1/analytics/transactions').set(owner.auth);
    expect(defaultView.body.data.transactionCount).toBe(
      beforeArchive.body.data.transactionCount - 1,
    );

    const includeArchived = await request(app)
      .get('/api/v1/analytics/transactions')
      .query({ includeArchived: true })
      .set(owner.auth);
    expect(includeArchived.body.data.transactionCount).toBeGreaterThanOrEqual(
      beforeArchive.body.data.transactionCount,
    );
    expect(includeArchived.body.data.appliedFilters.includeArchived).toBe(true);
  });
});
