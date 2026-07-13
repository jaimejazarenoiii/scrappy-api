import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { CreateEmployeeUseCase } from '../application/use-cases/create-employee.use-case.js';
import type { GetEmployeeUseCase } from '../application/use-cases/get-employee.use-case.js';
import type { UpdateEmployeeUseCase } from '../application/use-cases/update-employee.use-case.js';
import type { ArchiveEmployeeUseCase } from '../application/use-cases/archive-employee.use-case.js';
import type { LinkEmployeeToUserUseCase } from '../application/use-cases/link-employee-to-user.use-case.js';
import type { ListEmployeesUseCase } from '../application/use-cases/list-employees.use-case.js';
import type { GetMyEmployeeUseCase } from '../application/use-cases/get-my-employee.use-case.js';
import type { GrantSystemAccessUseCase } from '../application/use-cases/grant-system-access.use-case.js';
import type { DisableSystemAccessUseCase } from '../application/use-cases/disable-system-access.use-case.js';
import type { EnableSystemAccessUseCase } from '../application/use-cases/enable-system-access.use-case.js';
import type { ResetEmployeePasswordUseCase } from '../application/use-cases/reset-employee-password.use-case.js';

export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly getEmployeeUseCase: GetEmployeeUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly archiveEmployeeUseCase: ArchiveEmployeeUseCase,
    private readonly linkEmployeeToUserUseCase: LinkEmployeeToUserUseCase,
    private readonly listEmployeesUseCase: ListEmployeesUseCase,
    private readonly getMyEmployeeUseCase: GetMyEmployeeUseCase,
    private readonly grantSystemAccessUseCase: GrantSystemAccessUseCase,
    private readonly disableSystemAccessUseCase: DisableSystemAccessUseCase,
    private readonly enableSystemAccessUseCase: EnableSystemAccessUseCase,
    private readonly resetEmployeePasswordUseCase: ResetEmployeePasswordUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.createEmployeeUseCase.execute(
              req.auth!.companyId,
              req.body,
              req.auth!.role,
              req.auth!.userId,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  list: RequestHandler = async (req, res, next) => {
    try {
      res.json(success(await this.listEmployeesUseCase.execute(req.auth!.companyId)));
    } catch (error) {
      next(error);
    }
  };

  me: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(await this.getMyEmployeeUseCase.execute(req.auth!.userId, req.auth!.companyId)),
      );
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
            req.auth!.userId,
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
            req.auth!.userId,
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

  grantSystemAccess: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.grantSystemAccessUseCase.execute(
              String(req.params.employeeId),
              req.auth!.companyId,
              req.auth!.role,
              req.body,
              req.auth!.userId,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  disableSystemAccess: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.disableSystemAccessUseCase.execute(
            String(req.params.employeeId),
            req.auth!.companyId,
            req.auth!.userId,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  enableSystemAccess: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.enableSystemAccessUseCase.execute(
            String(req.params.employeeId),
            req.auth!.companyId,
            req.auth!.userId,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  resetPassword: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.resetEmployeePasswordUseCase.execute(
            String(req.params.employeeId),
            req.auth!.companyId,
            req.auth!.role,
            req.auth!.userId,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
