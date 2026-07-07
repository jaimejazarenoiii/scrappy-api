import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction edit authorization api', () => {
  it('allows assigned employee, blocks unassigned employee, allows owner', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const unassigned = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'unassigned@scrappy.test',
    );

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const assignedEdit = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(employee.auth)
      .send({ partyName: 'Assigned edit' });
    expect(assignedEdit.status).toBe(200);

    const unassignedEdit = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(unassigned.auth)
      .send({ partyName: 'Should fail' });
    expect(unassignedEdit.status).toBe(403);

    const ownerEdit = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(owner.auth)
      .send({ partyName: 'Owner edit' });
    expect(ownerEdit.status).toBe(200);
    expect(ownerEdit.body.data.partyName).toBe('Owner edit');
  });

  it('blocks an unassigned employee from viewing a transaction', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const unassigned = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'viewer@scrappy.test',
    );

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const view = await request(app)
      .get(`/api/v1/transactions/${transactionId}`)
      .set(unassigned.auth);
    expect(view.status).toBe(403);
  });
});
