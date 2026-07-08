import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { ListAttendanceQuery } from '../domain/attendance-session.repository.js';
import type { TimeInUseCase } from '../application/use-cases/time-in.use-case.js';
import type { TimeOutUseCase } from '../application/use-cases/time-out.use-case.js';
import type { GetAttendanceStatusUseCase } from '../application/use-cases/get-attendance-status.use-case.js';
import type { ListMyAttendanceUseCase } from '../application/use-cases/list-my-attendance.use-case.js';
import type { ListCompanyAttendanceUseCase } from '../application/use-cases/list-company-attendance.use-case.js';
import type { GetAttendanceDashboardUseCase } from '../application/use-cases/get-attendance-dashboard.use-case.js';
import type { ManageAttendanceUseCase } from '../application/use-cases/manage-attendance.use-case.js';

export class AttendanceController {
  constructor(
    private readonly timeInUseCase: TimeInUseCase,
    private readonly timeOutUseCase: TimeOutUseCase,
    private readonly getAttendanceStatusUseCase: GetAttendanceStatusUseCase,
    private readonly listMyAttendanceUseCase: ListMyAttendanceUseCase,
    private readonly listCompanyAttendanceUseCase: ListCompanyAttendanceUseCase,
    private readonly getAttendanceDashboardUseCase: GetAttendanceDashboardUseCase,
    private readonly manageAttendanceUseCase: ManageAttendanceUseCase,
  ) {}

  timeIn: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(await this.timeInUseCase.execute(req.auth!.companyId, req.auth!.userId, req.body)),
      );
    } catch (error) {
      next(error);
    }
  };

  timeOut: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(await this.timeOutUseCase.execute(req.auth!.companyId, req.auth!.userId, req.body)),
      );
    } catch (error) {
      next(error);
    }
  };

  status: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getAttendanceStatusUseCase.execute(req.auth!.companyId, req.auth!.userId),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listMine: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listMyAttendanceUseCase.execute(
        req.auth!.companyId,
        req.auth!.userId,
        req.validatedQuery as ListAttendanceQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  listCompany: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listCompanyAttendanceUseCase.execute(
        req.auth!.companyId,
        req.validatedQuery as ListAttendanceQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  dashboard: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getAttendanceDashboardUseCase.execute(
            req.auth!.companyId,
            (req.validatedQuery as { date?: string } | undefined)?.date,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  manage: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.manageAttendanceUseCase.execute(
            String(req.params.attendanceId),
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
}
