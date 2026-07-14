import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { AdminCreateCompanyUseCase } from '../application/use-cases/admin-create-company.use-case.js';
import type { AdminListCompaniesUseCase } from '../application/use-cases/admin-list-companies.use-case.js';
import type { AdminGetCompanyUseCase } from '../application/use-cases/admin-get-company.use-case.js';
import type { AdminCreateCompanyAccountUseCase } from '../application/use-cases/admin-create-company-account.use-case.js';
import type { AdminListCompanyAccountsUseCase } from '../application/use-cases/admin-list-company-accounts.use-case.js';
import type { AdminResetCompanyAccountPasswordUseCase } from '../application/use-cases/admin-reset-company-account-password.use-case.js';
import type { AdminCompanyListQuery } from './admin-company.schemas.js';

function authContext(req: {
  auth?: { companyId: string; userId: string; role: AuthorizationContext['role'] };
}): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

export class AdminCompanyController {
  constructor(
    private readonly adminCreateCompanyUseCase: AdminCreateCompanyUseCase,
    private readonly adminListCompaniesUseCase: AdminListCompaniesUseCase,
    private readonly adminGetCompanyUseCase: AdminGetCompanyUseCase,
    private readonly adminCreateCompanyAccountUseCase: AdminCreateCompanyAccountUseCase,
    private readonly adminListCompanyAccountsUseCase: AdminListCompanyAccountsUseCase,
    private readonly adminResetCompanyAccountPasswordUseCase: AdminResetCompanyAccountPasswordUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(success(await this.adminCreateCompanyUseCase.execute(authContext(req), req.body)));
    } catch (error) {
      next(error);
    }
  };

  list: RequestHandler = async (req, res, next) => {
    try {
      const query = req.validatedQuery as AdminCompanyListQuery;
      const result = await this.adminListCompaniesUseCase.execute(authContext(req), {
        page: query.page,
        limit: query.limit,
        sortOrder: query.sortOrder,
        search: query.search,
      });
      res.json(
        success(result.items, {
          page: query.page,
          limit: query.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / query.limit) || 1,
        }),
      );
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(success(await this.adminGetCompanyUseCase.execute(authContext(req), companyId)));
    } catch (error) {
      next(error);
    }
  };

  createAccount: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res
        .status(201)
        .json(
          success(
            await this.adminCreateCompanyAccountUseCase.execute(
              authContext(req),
              companyId,
              req.body,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  listAccounts: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(await this.adminListCompanyAccountsUseCase.execute(authContext(req), companyId)),
      );
    } catch (error) {
      next(error);
    }
  };

  resetAccountPassword: RequestHandler = async (req, res, next) => {
    try {
      const { companyId, userId } = req.params as { companyId: string; userId: string };
      const { temporaryPassword } = req.body as { temporaryPassword: string };
      res.json(
        success(
          await this.adminResetCompanyAccountPasswordUseCase.execute(
            authContext(req),
            companyId,
            userId,
            temporaryPassword,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
