import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction finish api', () => {
  it('submits an assigned employee draft for settlement and locks employee edits', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;
    const transactionNumber = create.body.data.transactionNumber as string;

    const finish = await request(app)
      .post(`/api/v1/transactions/${transactionId}/finish`)
      .set(employee.auth);
    expect(finish.status).toBe(200);
    expect(finish.body.data.status).toBe('READY_FOR_PAYMENT');
    expect(finish.body.data.submittedAt).toBeTruthy();
    expect(finish.body.data.transactionNumber).toBe(transactionNumber);

    const employeeEdit = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(employee.auth)
      .send({ partyName: 'Blocked' });
    expect(employeeEdit.status).toBe(403);
  });

  it('rejects finish by an unassigned employee', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const otherEmployee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'other-finish@scrappy.test',
    );

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const finish = await request(app)
      .post(`/api/v1/transactions/${transactionId}/finish`)
      .set(otherEmployee.auth);
    expect(finish.status).toBe(403);
  });
});
