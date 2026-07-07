import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { ListWarehousesQuery } from '../domain/warehouse.repository.js';
import type { ArchiveWarehouseUseCase } from '../application/use-cases/archive-warehouse.use-case.js';
import type { CreateWarehouseUseCase } from '../application/use-cases/create-warehouse.use-case.js';
import type { GetWarehouseUseCase } from '../application/use-cases/get-warehouse.use-case.js';
import type { ListWarehousesUseCase } from '../application/use-cases/list-warehouses.use-case.js';
import type { UpdateWarehouseUseCase } from '../application/use-cases/update-warehouse.use-case.js';

export class WarehouseController {
  constructor(
    private readonly createWarehouseUseCase: CreateWarehouseUseCase,
    private readonly getWarehouseUseCase: GetWarehouseUseCase,
    private readonly updateWarehouseUseCase: UpdateWarehouseUseCase,
    private readonly archiveWarehouseUseCase: ArchiveWarehouseUseCase,
    private readonly listWarehousesUseCase: ListWarehousesUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.createWarehouseUseCase.execute(
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

  getById: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getWarehouseUseCase.execute(
            String(req.params.warehouseId),
            req.auth!.companyId,
          ),
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
          await this.updateWarehouseUseCase.execute(
            String(req.params.warehouseId),
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
          await this.archiveWarehouseUseCase.execute(
            String(req.params.warehouseId),
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
      const result = await this.listWarehousesUseCase.execute(
        req.auth!.companyId,
        req.validatedQuery as ListWarehousesQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };
}
