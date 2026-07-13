import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import { assertSuperAdmin } from '../../../subscription/application/policies/subscription-authorization.policy.js';
import type { AnalyticsQueryRepository } from '../../domain/analytics-query.repository.js';
import {
  buildCompanyAnalyticsResponse,
  type CompanyAnalyticsResponseDto,
} from '../dto/company-analytics.response.js';
import {
  buildTransactionAnalyticsResponse,
  type TransactionAnalyticsResponseDto,
} from '../dto/transaction-analytics.response.js';
import {
  buildTripAnalyticsResponse,
  type TripAnalyticsResponseDto,
} from '../dto/trip-analytics.response.js';
import {
  buildExpenseAnalyticsResponse,
  type ExpenseAnalyticsResponseDto,
} from '../dto/expense-analytics.response.js';
import {
  buildWorkforceAnalyticsResponse,
  type WorkforceAnalyticsResponseDto,
} from '../dto/workforce-analytics.response.js';
import {
  buildOrganizationAnalyticsResponse,
  type OrganizationAnalyticsResponseDto,
} from '../dto/organization-analytics.response.js';
import type {
  AnalyticsFilterPipeline,
  ResolvedAnalyticsQuery,
} from '../services/analytics-filter-pipeline.js';
import { logAnalyticsAccess } from '../services/analytics-audit.service.js';

export class AdminGetCompanyScopedAnalyticsUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly queryRepository: AnalyticsQueryRepository,
    private readonly filterPipeline: AnalyticsFilterPipeline,
  ) {}

  private async assertCompany(auth: AuthorizationContext, companyId: string) {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company || company.isDeleted()) {
      throw new ResourceNotFoundError('Company not found');
    }
  }

  async company(
    auth: AuthorizationContext,
    companyId: string,
    query: ResolvedAnalyticsQuery,
  ): Promise<CompanyAnalyticsResponseDto> {
    await this.assertCompany(auth, companyId);
    const filter = await this.filterPipeline.build(companyId, query);
    logAnalyticsAccess('admin.company', filter, auth.userId);
    const metrics = await this.queryRepository.getCompanyMetrics(filter);
    return buildCompanyAnalyticsResponse(filter, metrics);
  }

  async transactions(
    auth: AuthorizationContext,
    companyId: string,
    query: ResolvedAnalyticsQuery,
  ): Promise<TransactionAnalyticsResponseDto> {
    await this.assertCompany(auth, companyId);
    const filter = await this.filterPipeline.build(companyId, query);
    logAnalyticsAccess('admin.transactions', filter, auth.userId);
    const metrics = await this.queryRepository.getTransactionMetrics(filter);
    return buildTransactionAnalyticsResponse(filter, metrics);
  }

  async trips(
    auth: AuthorizationContext,
    companyId: string,
    query: ResolvedAnalyticsQuery,
  ): Promise<TripAnalyticsResponseDto> {
    await this.assertCompany(auth, companyId);
    const filter = await this.filterPipeline.build(companyId, query);
    logAnalyticsAccess('admin.trips', filter, auth.userId);
    const metrics = await this.queryRepository.getTripMetrics(filter);
    return buildTripAnalyticsResponse(filter, metrics);
  }

  async expenses(
    auth: AuthorizationContext,
    companyId: string,
    query: ResolvedAnalyticsQuery,
  ): Promise<ExpenseAnalyticsResponseDto> {
    await this.assertCompany(auth, companyId);
    const filter = await this.filterPipeline.build(companyId, query);
    logAnalyticsAccess('admin.expenses', filter, auth.userId);
    const metrics = await this.queryRepository.getExpenseMetrics(filter);
    return buildExpenseAnalyticsResponse(filter, metrics);
  }

  async workforce(
    auth: AuthorizationContext,
    companyId: string,
    query: ResolvedAnalyticsQuery,
  ): Promise<WorkforceAnalyticsResponseDto> {
    await this.assertCompany(auth, companyId);
    const filter = await this.filterPipeline.build(companyId, query);
    logAnalyticsAccess('admin.workforce', filter, auth.userId);
    const metrics = await this.queryRepository.getWorkforceMetrics(filter);
    return buildWorkforceAnalyticsResponse(filter, metrics);
  }

  async organization(
    auth: AuthorizationContext,
    companyId: string,
    query: ResolvedAnalyticsQuery,
  ): Promise<OrganizationAnalyticsResponseDto> {
    await this.assertCompany(auth, companyId);
    const filter = await this.filterPipeline.build(companyId, query);
    logAnalyticsAccess('admin.organization', filter, auth.userId);
    const metrics = await this.queryRepository.getOrganizationMetrics(filter);
    return buildOrganizationAnalyticsResponse(filter, metrics);
  }
}
