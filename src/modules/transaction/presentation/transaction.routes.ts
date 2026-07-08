import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { TransactionController } from './transaction.controller.js';
import { uploadTransactionPhoto } from './upload.middleware.js';
import {
  cancelTransactionSchema,
  createTransactionItemSchema,
  createTransactionSchema,
  listTransactionsQuerySchema,
  materialSuggestionQuerySchema,
  priceSuggestionQuerySchema,
  reopenTransactionSchema,
  returnToDraftSchema,
  settleTransactionSchema,
  transactionAttachmentParamsSchema,
  transactionIdParamsSchema,
  transactionItemParamsSchema,
  transactionNumberParamsSchema,
  updateTransactionItemSchema,
  updateTransactionSchema,
} from './transaction.schemas.js';

const ALL_ROLES = ['OWNER', 'MANAGER', 'EMPLOYEE'] as const;
const MANAGER_ROLES = ['OWNER', 'MANAGER'] as const;

export function createTransactionRoutes(controller: TransactionController): Router {
  const router = Router();

  router.post(
    '/transactions',
    authorize([...ALL_ROLES]),
    validate(createTransactionSchema),
    controller.create,
  );

  router.get(
    '/transactions',
    authorize([...MANAGER_ROLES]),
    validate(listTransactionsQuerySchema, 'query'),
    controller.list,
  );

  router.get(
    '/transactions/assigned',
    authorize([...ALL_ROLES]),
    validate(listTransactionsQuerySchema, 'query'),
    controller.listAssigned,
  );

  router.get(
    '/transactions/suggestions/materials',
    authorize([...ALL_ROLES]),
    validate(materialSuggestionQuerySchema, 'query'),
    controller.materialSuggestions,
  );

  router.get(
    '/transactions/suggestions/prices',
    authorize([...ALL_ROLES]),
    validate(priceSuggestionQuerySchema, 'query'),
    controller.priceSuggestions,
  );

  router.get(
    '/transactions/by-number/:transactionNumber',
    authorize([...ALL_ROLES]),
    validate(transactionNumberParamsSchema, 'params'),
    controller.getByNumber,
  );

  router.get(
    '/transactions/:transactionId',
    authorize([...ALL_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    controller.getById,
  );

  router.patch(
    '/transactions/:transactionId',
    authorize([...ALL_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    validate(updateTransactionSchema),
    controller.update,
  );

  router.post(
    '/transactions/:transactionId/finish',
    authorize([...ALL_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    controller.finish,
  );

  router.post(
    '/transactions/:transactionId/return-to-draft',
    authorize([...MANAGER_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    validate(returnToDraftSchema),
    controller.returnToDraft,
  );

  router.post(
    '/transactions/:transactionId/settle',
    authorize([...MANAGER_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    validate(settleTransactionSchema),
    controller.settle,
  );

  router.post(
    '/transactions/:transactionId/cancel',
    authorize([...ALL_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    validate(cancelTransactionSchema),
    controller.cancel,
  );

  router.post(
    '/transactions/:transactionId/reopen',
    authorize(['OWNER']),
    validate(transactionIdParamsSchema, 'params'),
    validate(reopenTransactionSchema),
    controller.reopen,
  );

  router.post(
    '/transactions/:transactionId/archive',
    authorize([...MANAGER_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    controller.archive,
  );

  router.get(
    '/transactions/:transactionId/receipt',
    authorize([...ALL_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    controller.getReceipt,
  );

  router.get(
    '/transactions/:transactionId/items',
    authorize([...ALL_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    controller.listItems,
  );

  router.post(
    '/transactions/:transactionId/items',
    authorize([...ALL_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    validate(createTransactionItemSchema),
    controller.addItem,
  );

  router.patch(
    '/transactions/:transactionId/items/:itemId',
    authorize([...ALL_ROLES]),
    validate(transactionItemParamsSchema, 'params'),
    validate(updateTransactionItemSchema),
    controller.updateItem,
  );

  router.delete(
    '/transactions/:transactionId/items/:itemId',
    authorize([...ALL_ROLES]),
    validate(transactionItemParamsSchema, 'params'),
    controller.removeItem,
  );

  router.get(
    '/transactions/:transactionId/attachments',
    authorize([...ALL_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    controller.listAttachments,
  );

  router.post(
    '/transactions/:transactionId/attachments',
    authorize([...ALL_ROLES]),
    validate(transactionIdParamsSchema, 'params'),
    uploadTransactionPhoto,
    controller.addAttachment,
  );

  router.delete(
    '/transactions/:transactionId/attachments/:attachmentId',
    authorize([...ALL_ROLES]),
    validate(transactionAttachmentParamsSchema, 'params'),
    controller.removeAttachment,
  );

  return router;
}
