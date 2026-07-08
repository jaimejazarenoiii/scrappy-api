import type { Request, RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { ListTransactionsQuery } from '../domain/transaction.repository.js';
import type { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case.js';
import type { GetTransactionUseCase } from '../application/use-cases/get-transaction.use-case.js';
import type { GetTransactionByNumberUseCase } from '../application/use-cases/get-transaction-by-number.use-case.js';
import type { UpdateTransactionUseCase } from '../application/use-cases/update-transaction.use-case.js';
import type { ListTransactionsUseCase } from '../application/use-cases/list-transactions.use-case.js';
import type { ListAssignedTransactionsUseCase } from '../application/use-cases/list-assigned-transactions.use-case.js';
import type { AddTransactionItemUseCase } from '../application/use-cases/add-transaction-item.use-case.js';
import type { UpdateTransactionItemUseCase } from '../application/use-cases/update-transaction-item.use-case.js';
import type { RemoveTransactionItemUseCase } from '../application/use-cases/remove-transaction-item.use-case.js';
import type { ListTransactionItemsUseCase } from '../application/use-cases/list-transaction-items.use-case.js';
import type { AddTransactionAttachmentUseCase } from '../application/use-cases/add-transaction-attachment.use-case.js';
import type { ListTransactionAttachmentsUseCase } from '../application/use-cases/list-transaction-attachments.use-case.js';
import type { RemoveTransactionAttachmentUseCase } from '../application/use-cases/remove-transaction-attachment.use-case.js';
import type { GetMaterialSuggestionsUseCase } from '../application/use-cases/get-material-suggestions.use-case.js';
import type { GetPriceSuggestionsUseCase } from '../application/use-cases/get-price-suggestions.use-case.js';
import type { FinishTransactionUseCase } from '../application/use-cases/finish-transaction.use-case.js';
import type { ReturnToDraftUseCase } from '../application/use-cases/return-to-draft.use-case.js';
import type { SettleTransactionUseCase } from '../application/use-cases/settle-transaction.use-case.js';
import type { CancelTransactionUseCase } from '../application/use-cases/cancel-transaction.use-case.js';
import type { ReopenTransactionUseCase } from '../application/use-cases/reopen-transaction.use-case.js';
import type { GetReceiptUseCase } from '../application/use-cases/get-receipt.use-case.js';
import type { ArchiveTransactionUseCase } from '../application/use-cases/archive-transaction.use-case.js';

function authContext(req: Request): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    private readonly getTransactionByNumberUseCase: GetTransactionByNumberUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly listAssignedTransactionsUseCase: ListAssignedTransactionsUseCase,
    private readonly addTransactionItemUseCase: AddTransactionItemUseCase,
    private readonly updateTransactionItemUseCase: UpdateTransactionItemUseCase,
    private readonly removeTransactionItemUseCase: RemoveTransactionItemUseCase,
    private readonly listTransactionItemsUseCase: ListTransactionItemsUseCase,
    private readonly addTransactionAttachmentUseCase: AddTransactionAttachmentUseCase,
    private readonly listTransactionAttachmentsUseCase: ListTransactionAttachmentsUseCase,
    private readonly removeTransactionAttachmentUseCase: RemoveTransactionAttachmentUseCase,
    private readonly getMaterialSuggestionsUseCase: GetMaterialSuggestionsUseCase,
    private readonly getPriceSuggestionsUseCase: GetPriceSuggestionsUseCase,
    private readonly finishTransactionUseCase: FinishTransactionUseCase,
    private readonly returnToDraftUseCase: ReturnToDraftUseCase,
    private readonly settleTransactionUseCase: SettleTransactionUseCase,
    private readonly cancelTransactionUseCase: CancelTransactionUseCase,
    private readonly reopenTransactionUseCase: ReopenTransactionUseCase,
    private readonly getReceiptUseCase: GetReceiptUseCase,
    private readonly archiveTransactionUseCase: ArchiveTransactionUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.createTransactionUseCase.execute(
              req.auth!.companyId,
              req.auth!.userId,
              req.body,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getTransactionUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getByNumber: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getTransactionByNumberUseCase.execute(
            String(req.params.transactionNumber),
            authContext(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.updateTransactionUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
            req.body,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  list: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listTransactionsUseCase.execute(
        authContext(req),
        req.validatedQuery as ListTransactionsQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  listAssigned: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listAssignedTransactionsUseCase.execute(
        authContext(req),
        req.validatedQuery as ListTransactionsQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  addItem: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.addTransactionItemUseCase.execute(
              String(req.params.transactionId),
              authContext(req),
              req.body,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  updateItem: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.updateTransactionItemUseCase.execute(
            String(req.params.transactionId),
            String(req.params.itemId),
            authContext(req),
            req.body,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  removeItem: RequestHandler = async (req, res, next) => {
    try {
      await this.removeTransactionItemUseCase.execute(
        String(req.params.transactionId),
        String(req.params.itemId),
        authContext(req),
      );
      res.json(success({ deleted: true }));
    } catch (error) {
      next(error);
    }
  };

  listItems: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.listTransactionItemsUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  addAttachment: RequestHandler = async (req, res, next) => {
    try {
      const file = req.file
        ? {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer,
          }
        : undefined;
      res
        .status(201)
        .json(
          success(
            await this.addTransactionAttachmentUseCase.execute(
              String(req.params.transactionId),
              authContext(req),
              file,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  listAttachments: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.listTransactionAttachmentsUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  removeAttachment: RequestHandler = async (req, res, next) => {
    try {
      await this.removeTransactionAttachmentUseCase.execute(
        String(req.params.transactionId),
        String(req.params.attachmentId),
        authContext(req),
      );
      res.json(success({ deleted: true }));
    } catch (error) {
      next(error);
    }
  };

  materialSuggestions: RequestHandler = async (req, res, next) => {
    try {
      const query = req.validatedQuery as { q?: string; limit: number };
      res.json(
        success(await this.getMaterialSuggestionsUseCase.execute(req.auth!.companyId, query)),
      );
    } catch (error) {
      next(error);
    }
  };

  priceSuggestions: RequestHandler = async (req, res, next) => {
    try {
      const query = req.validatedQuery as { materialName: string; limit: number };
      res.json(success(await this.getPriceSuggestionsUseCase.execute(req.auth!.companyId, query)));
    } catch (error) {
      next(error);
    }
  };

  finish: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.finishTransactionUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  returnToDraft: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.returnToDraftUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
            req.body,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  settle: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.settleTransactionUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
            req.body,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  cancel: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.cancelTransactionUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
            req.body,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  reopen: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.reopenTransactionUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
            req.body,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getReceipt: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getReceiptUseCase.execute(String(req.params.transactionId), authContext(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  archive: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.archiveTransactionUseCase.execute(
            String(req.params.transactionId),
            authContext(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
