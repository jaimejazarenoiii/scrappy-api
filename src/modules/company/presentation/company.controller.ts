import type { RequestHandler } from 'express';
import { CompanyScopeViolationError } from '../../../shared/errors/http-exceptions.js';
import { success } from '../../../shared/http/api-response.js';
import type { CreateCompanyWithOwnerUseCase } from '../application/use-cases/create-company-with-owner.use-case.js';
import type { GetCompanyUseCase } from '../application/use-cases/get-company.use-case.js';
import type { UpdateCompanyUseCase } from '../application/use-cases/update-company.use-case.js';
import type { ArchiveCompanyUseCase } from '../application/use-cases/archive-company.use-case.js';

export class CompanyController {
  constructor(
    private readonly createCompanyWithOwnerUseCase: CreateCompanyWithOwnerUseCase,
    private readonly getCompanyUseCase: GetCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly archiveCompanyUseCase: ArchiveCompanyUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      res.status(201).json(success(await this.createCompanyWithOwnerUseCase.execute(req.body)));
    } catch (error) {
      next(error);
    }
  };
  getMine: RequestHandler = async (req, res, next) => {
    try {
      res.json(success(await this.getCompanyUseCase.execute(req.auth!.companyId)));
    } catch (error) {
      next(error);
    }
  };
  getById: RequestHandler = async (req, res, next) => {
    try {
      if (req.auth && req.auth.companyId !== String(req.params.companyId))
        throw new CompanyScopeViolationError();
      res.json(success(await this.getCompanyUseCase.execute(String(req.params.companyId))));
    } catch (error) {
      next(error);
    }
  };
  update: RequestHandler = async (req, res, next) => {
    try {
      if (req.auth && req.auth.companyId !== String(req.params.companyId))
        throw new CompanyScopeViolationError();
      res.json(
        success(
          await this.updateCompanyUseCase.execute(
            String(req.params.companyId),
            req.body,
            req.auth?.userId,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
  archive: RequestHandler = async (req, res, next) => {
    try {
      if (req.auth && req.auth.companyId !== String(req.params.companyId))
        throw new CompanyScopeViolationError();
      res.json(success(await this.archiveCompanyUseCase.execute(String(req.params.companyId))));
    } catch (error) {
      next(error);
    }
  };
}
