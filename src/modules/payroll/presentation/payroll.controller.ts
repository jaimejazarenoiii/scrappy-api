import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { ListPayrollQuery } from '../domain/payroll-record.repository.js';
import type { GenerateWeeklyPayrollUseCase } from '../application/use-cases/generate-weekly-payroll.use-case.js';
import type { ListPayrollHistoryUseCase } from '../application/use-cases/list-payroll-history.use-case.js';
import type { GetPayrollRecordUseCase } from '../application/use-cases/get-payroll-record.use-case.js';
import type { MarkPayrollPaidUseCase } from '../application/use-cases/mark-payroll-paid.use-case.js';

export class PayrollController {
  constructor(
    private readonly generateWeeklyPayrollUseCase: GenerateWeeklyPayrollUseCase,
    private readonly listPayrollHistoryUseCase: ListPayrollHistoryUseCase,
    private readonly getPayrollRecordUseCase: GetPayrollRecordUseCase,
    private readonly markPayrollPaidUseCase: MarkPayrollPaidUseCase,
  ) {}

  generate: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.generateWeeklyPayrollUseCase.execute(
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

  listHistory: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listPayrollHistoryUseCase.execute(
        req.auth!.companyId,
        req.auth!.userId,
        req.auth!.role,
        req.validatedQuery as ListPayrollQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getPayrollRecordUseCase.execute(
            String(req.params.payrollId),
            req.auth!.companyId,
            req.auth!.userId,
            req.auth!.role,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  markPaid: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.markPayrollPaidUseCase.execute(
            String(req.params.payrollId),
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
}
