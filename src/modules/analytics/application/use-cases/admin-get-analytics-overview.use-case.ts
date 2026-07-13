import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import { assertSuperAdmin } from '../../../subscription/application/policies/subscription-authorization.policy.js';
import type { AnalyticsQueryRepository } from '../../domain/analytics-query.repository.js';
import type { CompanyMetricsProjection } from '../../domain/analytics-query.repository.js';
import type {
  AnalyticsFilterPipeline,
  ResolvedAnalyticsQuery,
} from '../services/analytics-filter-pipeline.js';
import type { AnalyticsPeriod } from '../../domain/analytics-period.js';

export interface AdminPortfolioCompanyItem {
  companyId: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  subscriptionStatus: string;
  metrics: CompanyMetricsProjection;
}

export interface AdminAnalyticsOverviewResponseDto {
  items: AdminPortfolioCompanyItem[];
  appliedFilters: {
    period: AnalyticsPeriod;
    from: Date;
    to: Date;
  };
  generatedAt: Date;
}

export class AdminGetAnalyticsOverviewUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly queryRepository: AnalyticsQueryRepository,
    private readonly filterPipeline: AnalyticsFilterPipeline,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ResolvedAnalyticsQuery,
  ): Promise<AdminAnalyticsOverviewResponseDto> {
    assertSuperAdmin(auth);
    const companies = await this.companyRepository.list({
      page: 1,
      limit: 500,
      sortOrder: 'asc',
    });

    const items: AdminPortfolioCompanyItem[] = [];
    let appliedPeriod: AnalyticsPeriod = query.period ?? 'THIS_MONTH';
    let from = new Date();
    let to = new Date();

    for (const company of companies.items) {
      const filter = await this.filterPipeline.build(company.id, {
        period: query.period,
        from: query.from,
        to: query.to,
        includeArchived: query.includeArchived,
        limit: query.limit,
      });
      appliedPeriod = filter.period;
      from = filter.from;
      to = filter.to;
      const metrics = await this.queryRepository.getCompanyMetrics(filter);
      items.push({
        companyId: company.id,
        name: company.name,
        status: company.status,
        subscriptionStatus: company.subscriptionStatus,
        metrics,
      });
    }

    return {
      items,
      appliedFilters: { period: appliedPeriod, from, to },
      generatedAt: new Date(),
    };
  }
}
