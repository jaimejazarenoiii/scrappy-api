import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { buildBranchTransaction } from '../../factories/transaction.factory.js';
import { createTestContext } from '../../setup/test-app.js';
import { setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction analytics api', () => {
  it('returns transaction metrics and rankings', async () => {
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

    const response = await request(app).get('/api/v1/analytics/transactions').set(owner.auth);
    expect(response.status).toBe(200);
    expect(response.body.data.transactionCount).toBeGreaterThanOrEqual(1);
    expect(response.body.data.totalTransactionAmount).toBeGreaterThan(0);
    expect(response.body.data.topMaterials.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.mostActiveEmployees.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.mostActiveBranches.length).toBeGreaterThanOrEqual(1);
  });
});
