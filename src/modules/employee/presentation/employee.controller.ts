import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { CreateEmployeeUseCase } from '../application/use-cases/create-employee.use-case.js';
import type { GetEmployeeUseCase } from '../application/use-cases/get-employee.use-case.js';
import type { UpdateEmployeeUseCase } from '../application/use-cases/update-employee.use-case.js';
import type { ArchiveEmployeeUseCase } from '../application/use-cases/archive-employee.use-case.js';
import type { LinkEmployeeToUserUseCase } from '../application/use-cases/link-employee-to-user.use-case.js';

export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly getEmployeeUseCase: GetEmployeeUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly archiveEmployeeUseCase: ArchiveEmployeeUseCase,
    private readonly linkEmployeeToUserUseCase: LinkEmployeeToUserUseCase,
  ) {}
  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(success(await this.createEmployeeUseCase.execute(req.auth!.companyId, req.body)));
    } catch (error) {
      next(error);
    }
  };
  getById: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getEmployeeUseCase.execute(String(req.params.employeeId), req.auth!.companyId),
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
          await this.updateEmployeeUseCase.execute(
            String(req.params.employeeId),
            req.auth!.companyId,
            req.body,
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
          await this.archiveEmployeeUseCase.execute(
            String(req.params.employeeId),
            req.auth!.companyId,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
  linkUser: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.linkEmployeeToUserUseCase.execute(
            String(req.params.employeeId),
            req.auth!.companyId,
            req.body.userId,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
