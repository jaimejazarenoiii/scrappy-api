import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { createManagerUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

/**
 * Quickstart validation for specs/006-transaction-settlement/quickstart.md
 * Covers all 10 scenarios as automated API checks.
 */
describe('transaction settlement quickstart scenarios', () => {
  it('validates all 10 settlement quickstart scenarios', async () => {
    const { app, userRepository, employeeRepository, transactionNumberSequenceRepository } =
      createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const manager = await createManagerUser(app, userRepository, owner.companyId);

    // Scenario 1: Transaction Number at Creation
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'BUY',
    });
    expect(create.status).toBe(201);
    expect(create.body.data.transactionNumber).toMatch(/^IN-\d{8}-\d{6}$/);
    const transactionId = create.body.data.id as string;
    const transactionNumber = create.body.data.transactionNumber as string;

    const get = await request(app).get(`/api/v1/transactions/${transactionId}`).set(employee.auth);
    expect(get.status).toBe(200);
    expect(get.body.data.transactionNumber).toBe(transactionNumber);

    // Scenario 2: Employee Submit (Finish)
    const finish = await request(app)
      .post(`/api/v1/transactions/${transactionId}/finish`)
      .set(employee.auth);
    expect(finish.status).toBe(200);
    expect(finish.body.data.status).toBe('READY_FOR_PAYMENT');
    expect(finish.body.data.submittedAt).toBeTruthy();
    expect(finish.body.data.transactionNumber).toBe(transactionNumber);

    const employeePatch = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(employee.auth)
      .send({ partyName: 'Locked out' });
    expect(employeePatch.status).toBe(403);

    // Scenario 3: Manager Review and Return to Draft
    const managerEdit = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(manager.auth)
      .send({ partyName: 'Reviewed Party' });
    expect(managerEdit.status).toBe(200);
    expect(managerEdit.body.data.status).toBe('READY_FOR_PAYMENT');

    const returned = await request(app)
      .post(`/api/v1/transactions/${transactionId}/return-to-draft`)
      .set(manager.auth)
      .send({ reason: 'Fix notes' });
    expect(returned.status).toBe(200);
    expect(returned.body.data.status).toBe('DRAFT');

    const employeeEditAgain = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(employee.auth)
      .send({ notes: 'Fixed' });
    expect(employeeEditAgain.status).toBe(200);

    // Scenario 4: Settlement (Mark Paid)
    await request(app).post(`/api/v1/transactions/${transactionId}/finish`).set(employee.auth);
    const settle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({});
    expect(settle.status).toBe(200);
    expect(settle.body.data.status).toBe('PAID');
    expect(settle.body.data.paidAt).toBeTruthy();
    expect(settle.body.data.paidByUserId).toBe(manager.userId);

    const duplicateSettle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({});
    expect(duplicateSettle.status).toBe(409);

    // Scenario 5: Receipt
    const receipt = await request(app)
      .get(`/api/v1/transactions/${transactionId}/receipt`)
      .set(owner.auth);
    expect(receipt.status).toBe(200);
    expect(receipt.body.data.transactionNumber).toBe(transactionNumber);
    expect(receipt.body.data.company).toBeTruthy();
    expect(receipt.body.data.directionLabel).toBeTruthy();
    expect(receipt.body.data.partyName).toBeTruthy();
    expect(receipt.body.data.items).toBeTruthy();
    expect(receipt.body.data.grandTotal).toBeTruthy();
    expect(receipt.body.data.paidByDisplayName).toBeTruthy();
    expect(receipt.body.data.paidAt).toBeTruthy();

    const secondDraft = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const secondId = secondDraft.body.data.id as string;
    await request(app).post(`/api/v1/transactions/${secondId}/finish`).set(employee.auth);
    const receiptBeforePaid = await request(app)
      .get(`/api/v1/transactions/${secondId}/receipt`)
      .set(owner.auth);
    expect(receiptBeforePaid.status).toBe(409);

    // Scenario 6: Owner Reopen
    const managerReopen = await request(app)
      .post(`/api/v1/transactions/${transactionId}/reopen`)
      .set(manager.auth)
      .send({ reason: 'Managers cannot' });
    expect(managerReopen.status).toBe(403);

    const reopen = await request(app)
      .post(`/api/v1/transactions/${transactionId}/reopen`)
      .set(owner.auth)
      .send({ reason: 'Incorrect amount' });
    expect(reopen.status).toBe(200);
    expect(reopen.body.data.status).toBe('READY_FOR_PAYMENT');
    expect(reopen.body.data.paidAt).toBeNull();

    const resettle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({});
    expect(resettle.status).toBe(200);
    expect(resettle.body.data.paidAt).toBeTruthy();

    // Scenario 7: Search by Transaction Number
    const byNumber = await request(app)
      .get(`/api/v1/transactions/by-number/${transactionNumber}`)
      .set(owner.auth);
    expect(byNumber.status).toBe(200);
    expect(byNumber.body.data.id).toBe(transactionId);

    const prefix = await request(app)
      .get(`/api/v1/transactions?transactionNumber=${transactionNumber.slice(0, 7)}`)
      .set(manager.auth);
    expect(prefix.status).toBe(200);
    expect(prefix.body.data.some((row: { id: string }) => row.id === transactionId)).toBe(true);

    await request(app)
      .post('/api/v1/companies')
      .send(
        makeCompanyPayload({
          name: 'other-quickstart-co',
          email: 'other-quickstart@scrappy.test',
          ownerEmail: 'owner-quickstart-2@scrappy.test',
        }),
      );
    const otherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner-quickstart-2@scrappy.test', password: 'password123' });
    const otherAuth = { Authorization: `Bearer ${otherLogin.body.data.accessToken}` };
    const crossTenant = await request(app)
      .get(`/api/v1/transactions/by-number/${transactionNumber}`)
      .set(otherAuth);
    expect(crossTenant.status).toBe(404);

    // Scenario 8: Cancel Extensions
    const cancelTarget = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const cancelId = cancelTarget.body.data.id as string;
    await request(app).post(`/api/v1/transactions/${cancelId}/finish`).set(employee.auth);
    const cancelSubmitted = await request(app)
      .post(`/api/v1/transactions/${cancelId}/cancel`)
      .set(manager.auth)
      .send({});
    expect(cancelSubmitted.status).toBe(200);
    expect(cancelSubmitted.body.data.status).toBe('CANCELLED');

    const finishCancelled = await request(app)
      .post(`/api/v1/transactions/${cancelId}/finish`)
      .set(employee.auth);
    expect(finishCancelled.status).toBe(409);
    const settleCancelled = await request(app)
      .post(`/api/v1/transactions/${cancelId}/settle`)
      .set(manager.auth)
      .send({});
    expect(settleCancelled.status).toBe(409);
    const receiptCancelled = await request(app)
      .get(`/api/v1/transactions/${cancelId}/receipt`)
      .set(owner.auth);
    expect(receiptCancelled.status).toBe(409);

    const cancelPaid = await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(manager.auth)
      .send({});
    expect(cancelPaid.status).toBe(409);

    // Scenario 9: Authorization Matrix Smoke Test
    const matrixDraft = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const matrixId = matrixDraft.body.data.id as string;
    expect(
      (await request(app).post(`/api/v1/transactions/${matrixId}/finish`).set(manager.auth)).status,
    ).toBe(403);
    await request(app).post(`/api/v1/transactions/${matrixId}/finish`).set(employee.auth);
    expect(
      (
        await request(app)
          .post(`/api/v1/transactions/${matrixId}/settle`)
          .set(employee.auth)
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(`/api/v1/transactions/${matrixId}/return-to-draft`)
          .set(employee.auth)
          .send({})
      ).status,
    ).toBe(403);
    await request(app).post(`/api/v1/transactions/${matrixId}/settle`).set(manager.auth).send({});
    expect(
      (
        await request(app)
          .post(`/api/v1/transactions/${matrixId}/reopen`)
          .set(manager.auth)
          .send({ reason: 'Nope' })
      ).status,
    ).toBe(403);
    expect(
      (await request(app).get(`/api/v1/transactions/${matrixId}/receipt`).set(employee.auth))
        .status,
    ).toBe(200);

    // Scenario 10: Concurrency (Transaction Number)
    const { TransactionNumberService } =
      await import('../../../src/modules/transaction/application/services/transaction-number.service.js');
    const service = new TransactionNumberService(transactionNumberSequenceRepository);
    const date = new Date('2026-07-08T12:00:00.000Z');
    const concurrent = await Promise.all(
      Array.from({ length: 12 }, () => service.allocate(owner.companyId, 'OUTBOUND', date)),
    );
    expect(new Set(concurrent).size).toBe(12);
  });
});
