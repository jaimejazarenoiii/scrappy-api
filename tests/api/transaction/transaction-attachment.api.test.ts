import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

async function createDraft(
  app: import('express').Express,
  auth: Record<string, string>,
  employeeId: string,
) {
  const create = await createDraftTransaction(app, auth, [employeeId]);
  return create.body.data.id as string;
}

describe('transaction attachment api', () => {
  it('uploads, lists, and removes a photo', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const transactionId = await createDraft(app, employee.auth, employee.employeeId);

    const upload = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments`)
      .set(employee.auth)
      .attach('file', Buffer.from('fake-image'), {
        filename: 'receipt.jpg',
        contentType: 'image/jpeg',
      });
    expect(upload.status).toBe(201);
    expect(upload.body.data.fileName).toBe('receipt.jpg');
    expect(upload.body.data.downloadUrl).toBe(
      `/api/v1/transactions/${transactionId}/attachments/${upload.body.data.id}/content`,
    );
    const attachmentId = upload.body.data.id as string;

    const content = await request(app)
      .get(`/api/v1/transactions/${transactionId}/attachments/${attachmentId}/content`)
      .set(employee.auth);
    expect(content.status).toBe(200);
    expect(content.headers['content-type']).toMatch(/image\/jpeg/);
    expect(content.body).toEqual(Buffer.from('fake-image'));

    const list = await request(app)
      .get(`/api/v1/transactions/${transactionId}/attachments`)
      .set(employee.auth);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const remove = await request(app)
      .delete(`/api/v1/transactions/${transactionId}/attachments/${attachmentId}`)
      .set(employee.auth);
    expect(remove.status).toBe(200);
    expect(remove.body.data.deleted).toBe(true);
  });

  it('rejects an unsupported mime type', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const transactionId = await createDraft(app, employee.auth, employee.employeeId);

    const upload = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments`)
      .set(employee.auth)
      .attach('file', Buffer.from('not-an-image'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });
    expect(upload.status).toBe(400);
  });

  it('rejects a request with no file', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const transactionId = await createDraft(app, employee.auth, employee.employeeId);

    const upload = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments`)
      .set(employee.auth);
    expect(upload.status).toBe(400);
  });

  it('rejects unauthenticated attachment download', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const transactionId = await createDraft(app, employee.auth, employee.employeeId);

    const upload = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments`)
      .set(employee.auth)
      .attach('file', Buffer.from('fake-image'), {
        filename: 'receipt.jpg',
        contentType: 'image/jpeg',
      });
    const attachmentId = upload.body.data.id as string;

    const content = await request(app).get(
      `/api/v1/transactions/${transactionId}/attachments/${attachmentId}/content`,
    );
    expect(content.status).toBe(401);
  });

  it('downloads attachment content via access_token query param', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const transactionId = await createDraft(app, employee.auth, employee.employeeId);
    const accessToken = employee.auth.Authorization.replace('Bearer ', '');

    const upload = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments`)
      .set(employee.auth)
      .attach('file', Buffer.from('fake-image'), {
        filename: 'receipt.jpg',
        contentType: 'image/jpeg',
      });
    const attachmentId = upload.body.data.id as string;

    const content = await request(app).get(
      `/api/v1/transactions/${transactionId}/attachments/${attachmentId}/content?access_token=${encodeURIComponent(accessToken)}`,
    );
    expect(content.status).toBe(200);
    expect(content.headers['content-type']).toMatch(/image\/jpeg/);
    expect(content.body).toEqual(Buffer.from('fake-image'));
  });

  it('rejects uploads to a cancelled transaction', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const transactionId = await createDraft(app, employee.auth, employee.employeeId);
    await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(employee.auth)
      .send({});

    const upload = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments`)
      .set(employee.auth)
      .attach('file', Buffer.from('fake-image'), {
        filename: 'receipt.jpg',
        contentType: 'image/jpeg',
      });
    expect(upload.status).toBe(409);
  });
});
