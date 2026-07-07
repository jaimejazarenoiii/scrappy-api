import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { LoginUseCase } from '../application/use-cases/login.use-case.js';
import type { LogoutUseCase } from '../application/use-cases/logout.use-case.js';
import type { RefreshSessionUseCase } from '../application/use-cases/refresh-session.use-case.js';
import type { ForgotPasswordPlaceholderUseCase } from '../application/use-cases/forgot-password-placeholder.use-case.js';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly forgotPasswordPlaceholderUseCase: ForgotPasswordPlaceholderUseCase,
  ) {}

  login: RequestHandler = async (req, res, next) => {
    try {
      res.json(success(await this.loginUseCase.execute(req.body.identifier, req.body.password)));
    } catch (error) {
      next(error);
    }
  };
  logout: RequestHandler = async (req, res, next) => {
    try {
      res.json(success(await this.logoutUseCase.execute(req.auth?.sessionId)));
    } catch (error) {
      next(error);
    }
  };
  refresh: RequestHandler = async (req, res, next) => {
    try {
      res.json(success(await this.refreshSessionUseCase.execute(req.body.refreshToken)));
    } catch (error) {
      next(error);
    }
  };
  forgotPassword: RequestHandler = async (_req, res, next) => {
    try {
      res.status(202).json(success(await this.forgotPasswordPlaceholderUseCase.execute()));
    } catch (error) {
      next(error);
    }
  };
}
