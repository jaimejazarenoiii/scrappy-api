import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { buildBranchTransaction } from '../../factories/transaction.factory.js';
import { createTestContext } from '../../setup/test-app.js';
import { reportDateRangeQuery } from '../../setup/reports-helpers.js';
import { setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction report api', () => {
  it('lists seeded transactions within the date range', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );

    const branch = await request(app)
      .post('/api/v1/branches')
      .set(owner.auth)
      .send(makeBranchPayload());
    const branchId = branch.body.data.id as string;

    await request(app)
      .post('/api/v1/transactions')
      .set(employee.auth)
      .send(buildBranchTransaction([employee.employeeId], branchId));

    const response = await request(app)
      .get(`/api/v1/reports/transactions?${reportDateRangeQuery()}`)
      .set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.items[0]).toMatchObject({
      partyName: 'Acme Recycling',
      direction: 'INBOUND',
    });
    expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(response.body.data.appliedCriteria.sortBy).toBe('transactionDate');
  });
});
