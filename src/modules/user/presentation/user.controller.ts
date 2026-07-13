import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case.js';
import type { GetCurrentUserUseCase } from '../application/use-cases/get-current-user.use-case.js';
import type { GetPasswordStatusUseCase } from '../application/use-cases/get-password-status.use-case.js';

export class UserController {
  constructor(
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly getPasswordStatusUseCase: GetPasswordStatusUseCase,
  ) {}

  me: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(await this.getCurrentUserUseCase.execute(req.auth!.userId, req.auth!.companyId)),
      );
    } catch (error) {
      next(error);
    }
  };

  changePassword: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.changePasswordUseCase.execute(req.auth!.userId, req.auth!.companyId, req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  passwordStatus: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(await this.getPasswordStatusUseCase.execute(req.auth!.userId, req.auth!.companyId)),
      );
    } catch (error) {
      next(error);
    }
  };
}
