import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { ListBranchesQuery } from '../domain/branch.repository.js';
import type { ArchiveBranchUseCase } from '../application/use-cases/archive-branch.use-case.js';
import type { CreateBranchUseCase } from '../application/use-cases/create-branch.use-case.js';
import type { GetBranchUseCase } from '../application/use-cases/get-branch.use-case.js';
import type { ListBranchesUseCase } from '../application/use-cases/list-branches.use-case.js';
import type { UpdateBranchUseCase } from '../application/use-cases/update-branch.use-case.js';

export class BranchController {
  constructor(
    private readonly createBranchUseCase: CreateBranchUseCase,
    private readonly getBranchUseCase: GetBranchUseCase,
    private readonly updateBranchUseCase: UpdateBranchUseCase,
    private readonly archiveBranchUseCase: ArchiveBranchUseCase,
    private readonly listBranchesUseCase: ListBranchesUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.createBranchUseCase.execute(req.auth!.companyId, req.body, req.auth!.userId),
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
          await this.getBranchUseCase.execute(String(req.params.branchId), req.auth!.companyId),
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
          await this.updateBranchUseCase.execute(
            String(req.params.branchId),
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
          await this.archiveBranchUseCase.execute(
            String(req.params.branchId),
            req.auth!.companyId,
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
      const result = await this.listBranchesUseCase.execute(
        req.auth!.companyId,
        req.validatedQuery as ListBranchesQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };
}
