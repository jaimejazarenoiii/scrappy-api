import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftExpense, setupExpenseActors } from '../../setup/expense-helpers.js';

describe('expense attachment api', () => {
  it('uploads, lists, downloads, and removes a photo', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    const create = await createDraftExpense(app, employee.auth);
    const expenseId = create.body.data.id as string;

    const upload = await request(app)
      .post(`/api/v1/expenses/${expenseId}/attachments`)
      .set(employee.auth)
      .attach('file', Buffer.from('fake-image'), {
        filename: 'receipt.jpg',
        contentType: 'image/jpeg',
      });
    expect(upload.status).toBe(201);
    expect(upload.body.data.fileName).toBe('receipt.jpg');
    expect(upload.body.data.downloadUrl).toBe(
      `/api/v1/expenses/${expenseId}/attachments/${upload.body.data.id}/content`,
    );
    const attachmentId = upload.body.data.id as string;

    const content = await request(app)
      .get(`/api/v1/expenses/${expenseId}/attachments/${attachmentId}/content`)
      .set(employee.auth);
    expect(content.status).toBe(200);
    expect(content.headers['content-type']).toMatch(/image\/jpeg/);
    expect(content.body).toEqual(Buffer.from('fake-image'));

    const list = await request(app)
      .get(`/api/v1/expenses/${expenseId}/attachments`)
      .set(employee.auth);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].downloadUrl).toBe(
      `/api/v1/expenses/${expenseId}/attachments/${attachmentId}/content`,
    );

    const remove = await request(app)
      .delete(`/api/v1/expenses/${expenseId}/attachments/${attachmentId}`)
      .set(employee.auth);
    expect(remove.status).toBe(204);
  });

  it('rejects unauthenticated attachment download', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    const create = await createDraftExpense(app, employee.auth);
    const expenseId = create.body.data.id as string;

    const upload = await request(app)
      .post(`/api/v1/expenses/${expenseId}/attachments`)
      .set(employee.auth)
      .attach('file', Buffer.from('fake-image'), {
        filename: 'receipt.jpg',
        contentType: 'image/jpeg',
      });
    const attachmentId = upload.body.data.id as string;

    const content = await request(app).get(
      `/api/v1/expenses/${expenseId}/attachments/${attachmentId}/content`,
    );
    expect(content.status).toBe(401);
  });

  it('downloads attachment content via access_token query param', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    const create = await createDraftExpense(app, employee.auth);
    const expenseId = create.body.data.id as string;
    const accessToken = employee.auth.Authorization.replace('Bearer ', '');

    const upload = await request(app)
      .post(`/api/v1/expenses/${expenseId}/attachments`)
      .set(employee.auth)
      .attach('file', Buffer.from('fake-image'), {
        filename: 'receipt.jpg',
        contentType: 'image/jpeg',
      });
    const attachmentId = upload.body.data.id as string;

    const content = await request(app).get(
      `/api/v1/expenses/${expenseId}/attachments/${attachmentId}/content?access_token=${encodeURIComponent(accessToken)}`,
    );
    expect(content.status).toBe(200);
    expect(content.headers['content-type']).toMatch(/image\/jpeg/);
    expect(content.body).toEqual(Buffer.from('fake-image'));
  });
});
