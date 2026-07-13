import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { CompanySubscriptionStatus } from '../../../company/domain/company-subscription-status.js';
import { isAllowedSubscriptionStatus } from '../../../company/domain/company-subscription-status.js';
import type { SessionRepository } from '../../../session/domain/session.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';

export class SubscriptionAccountCascadeService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async applyForSubscriptionStatus(
    companyId: string,
    subscriptionStatus: CompanySubscriptionStatus,
  ): Promise<void> {
    if (isAllowedSubscriptionStatus(subscriptionStatus)) {
      await this.companyRepository.update(companyId, {
        subscriptionStatus,
        status: 'ACTIVE',
      });
      await this.userRepository.updateAllStatusForCompany(companyId, 'ACTIVE');
      return;
    }

    await this.companyRepository.update(companyId, {
      subscriptionStatus,
      status: 'INACTIVE',
    });
    const users = await this.userRepository.listByCompanyId(companyId);
    await this.userRepository.updateAllStatusForCompany(companyId, 'INACTIVE');
    await Promise.all(users.map((user) => this.sessionRepository.revokeAllForUser(user.id)));
  }
}
