import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Express } from 'express';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { seedDraftTransactionForAnalytics } from '../../setup/analytics-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { setupTransactionActors } from '../../setup/transaction-helpers.js';

async function createSecondCompanyOwner(app: Express) {
  await request(app)
    .post('/api/v1/companies')
    .send(
      makeCompanyPayload({
        name: 'analytics-other-co',
        email: 'analytics-other-co@scrappy.test',
        ownerEmail: 'analytics-owner2@scrappy.test',
      }),
    );
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'analytics-owner2@scrappy.test', password: 'password123' });
  return { Authorization: `Bearer ${login.body.data.accessToken}` };
}

describe('analytics tenant isolation api', () => {
  it('rejects foreign branch filters', async () => {
    const { app } = createTestContext();
    const authB = await createSecondCompanyOwner(app);
    const foreignBranchId = randomUUID();

    const response = await request(app)
      .get('/api/v1/analytics/company')
      .query({ branchId: foreignBranchId })
      .set(authB);
    expect(response.status).toBe(404);
  });

  it('does not leak company A metrics to company B owner', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    await seedDraftTransactionForAnalytics(app, employee.auth, employee.employeeId);

    const authB = await createSecondCompanyOwner(app);

    const companyA = await request(app).get('/api/v1/analytics/company').set(owner.auth);
    const companyB = await request(app).get('/api/v1/analytics/company').set(authB);

    expect(companyA.body.data.totalInboundTransactions).toBeGreaterThanOrEqual(1);
    expect(companyB.body.data.totalInboundTransactions).toBe(0);
  });
});
