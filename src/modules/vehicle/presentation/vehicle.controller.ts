import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { ListVehiclesQuery } from '../domain/vehicle.repository.js';
import type { ArchiveVehicleUseCase } from '../application/use-cases/archive-vehicle.use-case.js';
import type { CreateVehicleUseCase } from '../application/use-cases/create-vehicle.use-case.js';
import type { GetVehicleUseCase } from '../application/use-cases/get-vehicle.use-case.js';
import type { ListVehiclesUseCase } from '../application/use-cases/list-vehicles.use-case.js';
import type { UpdateVehicleUseCase } from '../application/use-cases/update-vehicle.use-case.js';

export class VehicleController {
  constructor(
    private readonly createVehicleUseCase: CreateVehicleUseCase,
    private readonly getVehicleUseCase: GetVehicleUseCase,
    private readonly updateVehicleUseCase: UpdateVehicleUseCase,
    private readonly archiveVehicleUseCase: ArchiveVehicleUseCase,
    private readonly listVehiclesUseCase: ListVehiclesUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.createVehicleUseCase.execute(
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
          await this.getVehicleUseCase.execute(String(req.params.vehicleId), req.auth!.companyId),
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
          await this.updateVehicleUseCase.execute(
            String(req.params.vehicleId),
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
          await this.archiveVehicleUseCase.execute(
            String(req.params.vehicleId),
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
      const result = await this.listVehiclesUseCase.execute(
        req.auth!.companyId,
        req.validatedQuery as ListVehiclesQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };
}
