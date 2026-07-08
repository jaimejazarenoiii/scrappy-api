import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction company list api', () => {
  it('lists company transactions with filters for a manager', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'INBOUND',
    });
    await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'SELL',
    });

    const list = await request(app).get('/api/v1/transactions').set(owner.auth);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(2);
    expect(list.body.meta.total).toBe(2);

    const filtered = await request(app)
      .get('/api/v1/transactions?direction=OUTBOUND')
      .set(owner.auth);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].direction).toBe('OUTBOUND');
  });

  it('forbids an employee from listing all company transactions', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);

    const list = await request(app).get('/api/v1/transactions').set(employee.auth);
    expect(list.status).toBe(403);
  });

  it('filters by settlement status and transaction number prefix', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );

    const first = await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'INBOUND',
    });
    const second = await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'SELL',
    });

    const firstId = first.body.data.id as string;
    const secondId = second.body.data.id as string;
    const firstNumber = first.body.data.transactionNumber as string;

    await request(app).post(`/api/v1/transactions/${firstId}/finish`).set(employee.auth);
    await request(app).post(`/api/v1/transactions/${secondId}/finish`).set(employee.auth);
    await request(app).post(`/api/v1/transactions/${secondId}/settle`).set(owner.auth).send({});

    const ready = await request(app)
      .get('/api/v1/transactions?status=READY_FOR_PAYMENT')
      .set(owner.auth);
    expect(ready.status).toBe(200);
    expect(ready.body.data).toHaveLength(1);
    expect(ready.body.data[0].id).toBe(firstId);

    const paid = await request(app).get('/api/v1/transactions?status=PAID').set(owner.auth);
    expect(paid.status).toBe(200);
    expect(paid.body.data).toHaveLength(1);
    expect(paid.body.data[0].id).toBe(secondId);

    const byNumber = await request(app)
      .get(`/api/v1/transactions?transactionNumber=${firstNumber.slice(0, 10)}`)
      .set(owner.auth);
    expect(byNumber.status).toBe(200);
    expect(byNumber.body.data.some((row: { id: string }) => row.id === firstId)).toBe(true);
  });
});
