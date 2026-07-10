import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { ExpenseController } from './expense.controller.js';
import { uploadExpensePhoto } from './upload.middleware.js';
import {
  archiveExpenseSchema,
  cancelExpenseSchema,
  createExpenseSchema,
  expenseAttachmentParamsSchema,
  expenseIdParamsSchema,
  expenseListQuerySchema,
  expenseNumberParamsSchema,
  recordExpenseSchema,
  updateExpenseSchema,
} from './expense.schemas.js';

const ALL_ROLES = ['OWNER', 'MANAGER', 'EMPLOYEE'] as const;
const MANAGER_ROLES = ['OWNER', 'MANAGER'] as const;

export function createExpenseRoutes(controller: ExpenseController): Router {
  const router = Router();

  router.post(
    '/expenses',
    authorize([...ALL_ROLES]),
    validate(createExpenseSchema),
    controller.create,
  );

  router.get(
    '/expenses',
    authorize([...MANAGER_ROLES]),
    validate(expenseListQuerySchema, 'query'),
    controller.list,
  );

  router.get(
    '/expenses/mine',
    authorize([...ALL_ROLES]),
    validate(expenseListQuerySchema, 'query'),
    controller.listMine,
  );

  router.get(
    '/expenses/by-number/:expenseNumber',
    authorize([...ALL_ROLES]),
    validate(expenseNumberParamsSchema, 'params'),
    controller.getByNumber,
  );

  router.get('/expenses/categories', authorize([...ALL_ROLES]), controller.listCategories);

  router.get(
    '/expenses/:expenseId/attachments/:attachmentId/content',
    authorize([...ALL_ROLES]),
    validate(expenseAttachmentParamsSchema, 'params'),
    controller.getAttachmentContent,
  );

  router.post(
    '/expenses/:expenseId/attachments',
    authorize([...ALL_ROLES]),
    validate(expenseIdParamsSchema, 'params'),
    uploadExpensePhoto,
    controller.addAttachment,
  );

  router.get(
    '/expenses/:expenseId/attachments',
    authorize([...ALL_ROLES]),
    validate(expenseIdParamsSchema, 'params'),
    controller.listAttachments,
  );

  router.delete(
    '/expenses/:expenseId/attachments/:attachmentId',
    authorize([...ALL_ROLES]),
    validate(expenseAttachmentParamsSchema, 'params'),
    controller.removeAttachment,
  );

  router.post(
    '/expenses/:expenseId/record',
    authorize([...ALL_ROLES]),
    validate(expenseIdParamsSchema, 'params'),
    validate(recordExpenseSchema),
    controller.record,
  );

  router.post(
    '/expenses/:expenseId/cancel',
    authorize([...ALL_ROLES]),
    validate(expenseIdParamsSchema, 'params'),
    validate(cancelExpenseSchema),
    controller.cancel,
  );

  router.post(
    '/expenses/:expenseId/archive',
    authorize([...MANAGER_ROLES]),
    validate(expenseIdParamsSchema, 'params'),
    validate(archiveExpenseSchema),
    controller.archive,
  );

  router.get(
    '/expenses/:expenseId',
    authorize([...ALL_ROLES]),
    validate(expenseIdParamsSchema, 'params'),
    controller.getById,
  );

  router.patch(
    '/expenses/:expenseId',
    authorize([...ALL_ROLES]),
    validate(expenseIdParamsSchema, 'params'),
    validate(updateExpenseSchema),
    controller.update,
  );

  return router;
}
