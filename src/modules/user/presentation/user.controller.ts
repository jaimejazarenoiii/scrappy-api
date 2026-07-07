import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { GetCurrentUserUseCase } from '../application/use-cases/get-current-user.use-case.js';

export class UserController {
  constructor(private readonly getCurrentUserUseCase: GetCurrentUserUseCase) {}
  me: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(await this.getCurrentUserUseCase.execute(req.auth!.userId, req.auth!.companyId)),
      );
    } catch (error) {
      next(error);
    }
  };
}
