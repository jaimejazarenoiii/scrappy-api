import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { buildBranchTransaction } from '../../factories/transaction.factory.js';
import { createTestContext } from '../../setup/test-app.js';
import { reportDateRangeQuery } from '../../setup/reports-helpers.js';
import { setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction report export api', () => {
  it('exports csv with expected headers', async () => {
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
      .get(`/api/v1/reports/transactions/export?${reportDateRangeQuery()}&format=csv`)
      .set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toMatch(/attachment; filename="transactions-/);
    const headerLine = response.text.split('\n')[0].replace(/^\uFEFF/, '');
    expect(headerLine).toContain('Transaction #');
    expect(headerLine).toContain('Party');
    expect(headerLine).toContain('Grand Total');
    expect(response.text).toContain('Acme Recycling');
  });
});
