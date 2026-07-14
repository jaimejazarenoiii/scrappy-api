import type { CompanyRepository } from '../company/domain/company.repository.js';
import type { CompanySubscriptionRepository } from './domain/company-subscription.repository.js';
import type { SessionRepository } from '../session/domain/session.repository.js';
import type { UserRepository } from '../user/domain/user.repository.js';
import { CreateSubscriptionUseCase } from './application/use-cases/create-subscription.use-case.js';
import { RenewSubscriptionUseCase } from './application/use-cases/renew-subscription.use-case.js';
import { UpdateSubscriptionUseCase } from './application/use-cases/update-subscription.use-case.js';
import { ExpireSubscriptionUseCase } from './application/use-cases/expire-subscription.use-case.js';
import { SuspendCompanySubscriptionUseCase } from './application/use-cases/suspend-company-subscription.use-case.js';
import { ListSubscriptionHistoryUseCase } from './application/use-cases/list-subscription-history.use-case.js';
import { GetSubscriptionUseCase } from './application/use-cases/get-subscription.use-case.js';
import { GetCompanySubscriptionStatusUseCase } from './application/use-cases/get-company-subscription-status.use-case.js';
import { GetMySubscriptionStatusUseCase } from './application/use-cases/get-my-subscription-status.use-case.js';
import { ReactivateCompanySubscriptionUseCase } from './application/use-cases/reactivate-company-subscription.use-case.js';
import { GetCurrentSubscriptionUseCase } from './application/use-cases/get-current-subscription.use-case.js';
import { SubscriptionAccountCascadeService } from './application/services/subscription-account-cascade.service.js';
import { SubscriptionController } from './presentation/subscription.controller.js';

export {
  createAdminSubscriptionRoutes,
  createTenantSubscriptionRoutes,
} from './presentation/subscription.routes.js';

export interface SubscriptionModuleDependencies {
  companyRepository: CompanyRepository;
  companySubscriptionRepository: CompanySubscriptionRepository;
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
}

export function buildSubscriptionController(
  deps: SubscriptionModuleDependencies,
): SubscriptionController {
  const cascadeService = new SubscriptionAccountCascadeService(
    deps.companyRepository,
    deps.userRepository,
    deps.sessionRepository,
  );

  return new SubscriptionController(
    new CreateSubscriptionUseCase(
      deps.companyRepository,
      deps.companySubscriptionRepository,
      cascadeService,
    ),
    new RenewSubscriptionUseCase(
      deps.companyRepository,
      deps.companySubscriptionRepository,
      cascadeService,
    ),
    new UpdateSubscriptionUseCase(
      deps.companyRepository,
      deps.companySubscriptionRepository,
      cascadeService,
    ),
    new ExpireSubscriptionUseCase(
      deps.companyRepository,
      deps.companySubscriptionRepository,
      cascadeService,
    ),
    new SuspendCompanySubscriptionUseCase(deps.companyRepository, cascadeService),
    new ListSubscriptionHistoryUseCase(deps.companyRepository, deps.companySubscriptionRepository),
    new GetSubscriptionUseCase(deps.companySubscriptionRepository),
    new GetCompanySubscriptionStatusUseCase(deps.companyRepository),
    new GetMySubscriptionStatusUseCase(deps.companyRepository),
    new ReactivateCompanySubscriptionUseCase(deps.companyRepository, cascadeService),
    new GetCurrentSubscriptionUseCase(deps.companyRepository, deps.companySubscriptionRepository),
  );
}
