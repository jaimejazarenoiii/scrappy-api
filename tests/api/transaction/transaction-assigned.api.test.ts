import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import {
  createDraftTransaction,
  setupTransactionActors,
  timeInEmployee,
} from '../../setup/transaction-helpers.js';

describe('transaction assigned list api', () => {
  it('returns only transactions assigned to the acting employee', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const other = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'other-worker@scrappy.test',
    );
    await timeInEmployee(app, other.auth);

    await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    await createDraftTransaction(app, other.auth, [other.employeeId]);

    const assigned = await request(app).get('/api/v1/transactions/assigned').set(employee.auth);
    expect(assigned.status).toBe(200);
    expect(assigned.body.data).toHaveLength(1);
    expect(assigned.body.data[0].assignedEmployeeIds).toContain(employee.employeeId);
  });
});
