import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction by-number api', () => {
  it('looks up a transaction by number and supports prefix filtering', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;
    const transactionNumber = create.body.data.transactionNumber as string;

    const byNumber = await request(app)
      .get(`/api/v1/transactions/by-number/${transactionNumber}`)
      .set(owner.auth);
    expect(byNumber.status).toBe(200);
    expect(byNumber.body.data.id).toBe(transactionId);

    const prefix = transactionNumber.slice(0, -2);
    const list = await request(app)
      .get('/api/v1/transactions')
      .query({ transactionNumber: prefix })
      .set(owner.auth);
    expect(list.status).toBe(200);
    expect(list.body.data.some((row: { id: string }) => row.id === transactionId)).toBe(true);
  });

  it('applies assignment-based access control for employee lookup', async () => {
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
      'lookup-viewer@scrappy.test',
    );

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionNumber = create.body.data.transactionNumber as string;

    const lookup = await request(app)
      .get(`/api/v1/transactions/by-number/${transactionNumber}`)
      .set(unassigned.auth);
    expect(lookup.status).toBe(403);
  });
});
