import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { CreateSubscriptionUseCase } from '../application/use-cases/create-subscription.use-case.js';
import type { RenewSubscriptionUseCase } from '../application/use-cases/renew-subscription.use-case.js';
import type { UpdateSubscriptionUseCase } from '../application/use-cases/update-subscription.use-case.js';
import type { ExpireSubscriptionUseCase } from '../application/use-cases/expire-subscription.use-case.js';
import type { SuspendCompanySubscriptionUseCase } from '../application/use-cases/suspend-company-subscription.use-case.js';
import type { ListSubscriptionHistoryUseCase } from '../application/use-cases/list-subscription-history.use-case.js';
import type { GetSubscriptionUseCase } from '../application/use-cases/get-subscription.use-case.js';
import type { GetCompanySubscriptionStatusUseCase } from '../application/use-cases/get-company-subscription-status.use-case.js';
import type { GetMySubscriptionStatusUseCase } from '../application/use-cases/get-my-subscription-status.use-case.js';
import type { ReactivateCompanySubscriptionUseCase } from '../application/use-cases/reactivate-company-subscription.use-case.js';
import type { GetCurrentSubscriptionUseCase } from '../application/use-cases/get-current-subscription.use-case.js';
import type {
  CreateSubscriptionRequestDto,
  ExpireSubscriptionRequestDto,
  ReactivateCompanyRequestDto,
  RenewSubscriptionRequestDto,
  SuspendCompanyRequestDto,
  UpdateSubscriptionRequestDto,
} from '../application/dto/subscription.dto.js';
import type { SubscriptionHistoryQuery } from './subscription.schemas.js';

function authContext(req: {
  auth?: { companyId: string; userId: string; role: AuthorizationContext['role'] };
}): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

export class SubscriptionController {
  constructor(
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly renewSubscriptionUseCase: RenewSubscriptionUseCase,
    private readonly updateSubscriptionUseCase: UpdateSubscriptionUseCase,
    private readonly expireSubscriptionUseCase: ExpireSubscriptionUseCase,
    private readonly suspendCompanySubscriptionUseCase: SuspendCompanySubscriptionUseCase,
    private readonly listSubscriptionHistoryUseCase: ListSubscriptionHistoryUseCase,
    private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
    private readonly getCompanySubscriptionStatusUseCase: GetCompanySubscriptionStatusUseCase,
    private readonly getMySubscriptionStatusUseCase: GetMySubscriptionStatusUseCase,
    private readonly reactivateCompanySubscriptionUseCase: ReactivateCompanySubscriptionUseCase,
    private readonly getCurrentSubscriptionUseCase: GetCurrentSubscriptionUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res
        .status(201)
        .json(
          success(
            await this.createSubscriptionUseCase.execute(
              authContext(req),
              companyId,
              req.body as CreateSubscriptionRequestDto,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  renew: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res
        .status(201)
        .json(
          success(
            await this.renewSubscriptionUseCase.execute(
              authContext(req),
              companyId,
              req.body as RenewSubscriptionRequestDto,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      const { companyId, subscriptionId } = req.params as {
        companyId: string;
        subscriptionId: string;
      };
      res.json(
        success(
          await this.updateSubscriptionUseCase.execute(
            authContext(req),
            companyId,
            subscriptionId,
            req.body as UpdateSubscriptionRequestDto,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  expire: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(
          await this.expireSubscriptionUseCase.execute(
            authContext(req),
            companyId,
            req.body as ExpireSubscriptionRequestDto,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  suspend: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(
          await this.suspendCompanySubscriptionUseCase.execute(
            authContext(req),
            companyId,
            req.body as SuspendCompanyRequestDto,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  reactivate: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(
          await this.reactivateCompanySubscriptionUseCase.execute(
            authContext(req),
            companyId,
            req.body as ReactivateCompanyRequestDto,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getCurrent: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(await this.getCurrentSubscriptionUseCase.execute(authContext(req), companyId)),
      );
    } catch (error) {
      next(error);
    }
  };

  listHistory: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      const result = await this.listSubscriptionHistoryUseCase.execute(
        authContext(req),
        companyId,
        req.validatedQuery as SubscriptionHistoryQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      const { companyId, subscriptionId } = req.params as {
        companyId: string;
        subscriptionId: string;
      };
      res.json(
        success(
          await this.getSubscriptionUseCase.execute(authContext(req), companyId, subscriptionId),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getAdminStatus: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(
          await this.getCompanySubscriptionStatusUseCase.execute(authContext(req), companyId),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getMyStatus: RequestHandler = async (req, res, next) => {
    try {
      res.json(success(await this.getMySubscriptionStatusUseCase.execute(authContext(req))));
    } catch (error) {
      next(error);
    }
  };
}
