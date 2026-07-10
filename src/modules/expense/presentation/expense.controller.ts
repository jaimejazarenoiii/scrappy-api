import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { CreateExpenseUseCase } from '../application/use-cases/create-expense.use-case.js';
import type { UpdateExpenseUseCase } from '../application/use-cases/update-expense.use-case.js';
import type { GetExpenseUseCase } from '../application/use-cases/get-expense.use-case.js';
import type { GetExpenseByNumberUseCase } from '../application/use-cases/get-expense-by-number.use-case.js';
import type { ListExpensesUseCase } from '../application/use-cases/list-expenses.use-case.js';
import type { ListMyExpensesUseCase } from '../application/use-cases/list-my-expenses.use-case.js';
import type { RecordExpenseUseCase } from '../application/use-cases/record-expense.use-case.js';
import type { CancelExpenseUseCase } from '../application/use-cases/cancel-expense.use-case.js';
import type { ArchiveExpenseUseCase } from '../application/use-cases/archive-expense.use-case.js';
import type { AddExpenseAttachmentUseCase } from '../application/use-cases/add-expense-attachment.use-case.js';
import type { ListExpenseAttachmentsUseCase } from '../application/use-cases/list-expense-attachments.use-case.js';
import type { RemoveExpenseAttachmentUseCase } from '../application/use-cases/remove-expense-attachment.use-case.js';
import type { GetExpenseAttachmentContentUseCase } from '../application/use-cases/get-expense-attachment-content.use-case.js';
import type { ListExpenseCategoriesUseCase } from '../application/use-cases/list-expense-categories.use-case.js';
import type { CreateExpenseRequestDto } from '../application/dto/create-expense.request.js';
import type { UpdateExpenseRequestDto } from '../application/dto/update-expense.request.js';
import type { CancelExpenseRequestDto } from '../application/use-cases/cancel-expense.use-case.js';
import type { ExpenseListQuery } from './expense.schemas.js';

function authContext(req: {
  auth?: { companyId: string; userId: string; role: AuthorizationContext['role'] };
}): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

export class ExpenseController {
  constructor(
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    private readonly getExpenseUseCase: GetExpenseUseCase,
    private readonly getExpenseByNumberUseCase: GetExpenseByNumberUseCase,
    private readonly listExpensesUseCase: ListExpensesUseCase,
    private readonly listMyExpensesUseCase: ListMyExpensesUseCase,
    private readonly recordExpenseUseCase: RecordExpenseUseCase,
    private readonly cancelExpenseUseCase: CancelExpenseUseCase,
    private readonly archiveExpenseUseCase: ArchiveExpenseUseCase,
    private readonly addExpenseAttachmentUseCase: AddExpenseAttachmentUseCase,
    private readonly listExpenseAttachmentsUseCase: ListExpenseAttachmentsUseCase,
    private readonly removeExpenseAttachmentUseCase: RemoveExpenseAttachmentUseCase,
    private readonly getExpenseAttachmentContentUseCase: GetExpenseAttachmentContentUseCase,
    private readonly listExpenseCategoriesUseCase: ListExpenseCategoriesUseCase,
  ) {}

  listCategories: RequestHandler = async (req, res, next) => {
    try {
      const categories = await this.listExpenseCategoriesUseCase.execute(
        authContext(req).companyId,
      );
      res.json(success(categories));
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.createExpenseUseCase.execute(
              authContext(req),
              req.body as CreateExpenseRequestDto,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  list: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listExpensesUseCase.execute(
        authContext(req),
        req.validatedQuery as ExpenseListQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  listMine: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listMyExpensesUseCase.execute(
        authContext(req),
        req.validatedQuery as ExpenseListQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  getByNumber: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getExpenseByNumberUseCase.execute(
            req.params.expenseNumber as string,
            authContext(req),
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
          await this.getExpenseUseCase.execute(req.params.expenseId as string, authContext(req)),
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
          await this.updateExpenseUseCase.execute(
            req.params.expenseId as string,
            authContext(req),
            req.body as UpdateExpenseRequestDto,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  record: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.recordExpenseUseCase.execute(req.params.expenseId as string, authContext(req)),
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
          await this.cancelExpenseUseCase.execute(
            req.params.expenseId as string,
            authContext(req),
            req.body as CancelExpenseRequestDto,
          ),
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
          await this.archiveExpenseUseCase.execute(
            req.params.expenseId as string,
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
      const file = req.file;
      res.status(201).json(
        success(
          await this.addExpenseAttachmentUseCase.execute(
            req.params.expenseId as string,
            authContext(req),
            file
              ? {
                  originalName: file.originalname,
                  mimeType: file.mimetype,
                  size: file.size,
                  buffer: file.buffer,
                }
              : undefined,
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
          await this.listExpenseAttachmentsUseCase.execute(
            req.params.expenseId as string,
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
      await this.removeExpenseAttachmentUseCase.execute(
        req.params.expenseId as string,
        req.params.attachmentId as string,
        authContext(req),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getAttachmentContent: RequestHandler = async (req, res, next) => {
    try {
      const content = await this.getExpenseAttachmentContentUseCase.execute(
        req.params.expenseId as string,
        req.params.attachmentId as string,
        authContext(req),
      );
      res
        .type(content.mimeType)
        .set('Content-Disposition', `inline; filename="${encodeURIComponent(content.fileName)}"`)
        .send(content.buffer);
    } catch (error) {
      next(error);
    }
  };
}
