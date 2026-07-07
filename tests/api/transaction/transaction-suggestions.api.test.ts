import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction suggestions api', () => {
  it('returns material and price suggestions from company history', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);

    await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      items: [
        { materialName: 'Brass', weight: 2, unit: 'KG', price: 300 },
        { materialName: 'Brass', weight: 1, unit: 'KG', price: 320 },
      ],
    });

    const materials = await request(app)
      .get('/api/v1/transactions/suggestions/materials?q=bra')
      .set(employee.auth);
    expect(materials.status).toBe(200);
    expect(materials.body.data).toHaveLength(1);
    expect(materials.body.data[0].materialName).toBe('Brass');

    const prices = await request(app)
      .get('/api/v1/transactions/suggestions/prices?materialName=Brass')
      .set(employee.auth);
    expect(prices.status).toBe(200);
    expect(
      prices.body.data.map((p: { price: number }) => p.price).sort((a: number, b: number) => a - b),
    ).toEqual([300, 320]);
  });

  it('requires a materialName for price suggestions', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);

    const prices = await request(app)
      .get('/api/v1/transactions/suggestions/prices')
      .set(employee.auth);
    expect(prices.status).toBe(400);
  });
});
