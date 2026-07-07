import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { ListCashAdvanceQuery } from '../domain/cash-advance.repository.js';
import type { CreateCashAdvanceUseCase } from '../application/use-cases/create-cash-advance.use-case.js';
import type { ListMyCashAdvancesUseCase } from '../application/use-cases/list-my-cash-advances.use-case.js';
import type { ListCompanyCashAdvancesUseCase } from '../application/use-cases/list-company-cash-advances.use-case.js';

export class CashAdvanceController {
  constructor(
    private readonly createCashAdvanceUseCase: CreateCashAdvanceUseCase,
    private readonly listMyCashAdvancesUseCase: ListMyCashAdvancesUseCase,
    private readonly listCompanyCashAdvancesUseCase: ListCompanyCashAdvancesUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.createCashAdvanceUseCase.execute(
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

  listMine: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listMyCashAdvancesUseCase.execute(
        req.auth!.companyId,
        req.auth!.userId,
        req.validatedQuery as ListCashAdvanceQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  listCompany: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listCompanyCashAdvancesUseCase.execute(
        req.auth!.companyId,
        req.validatedQuery as ListCashAdvanceQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };
}
