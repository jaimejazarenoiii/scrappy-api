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
});
