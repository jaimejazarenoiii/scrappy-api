import type { RequestHandler } from 'express';
import type { GetRootUseCase } from '../../application/use-cases/get-root.use-case.js';
import { success } from '../../shared/utils/api-response.js';

/**
 * HTTP controller for the root endpoint — delegates to GetRootUseCase.
 */
export class RootController {
  private readonly getRootUseCase: GetRootUseCase;

  /**
   * @param getRootUseCase - Root information use case
   */
  constructor(getRootUseCase: GetRootUseCase) {
    this.getRootUseCase = getRootUseCase;
  }

  /**
   * Handles GET / — returns API identity in standard envelope.
   */
  handle: RequestHandler = (_req, res) => {
    const data = this.getRootUseCase.execute();
    res.status(200).json(success(data));
  };
}
