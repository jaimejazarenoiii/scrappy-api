---
description: 'Task list for Analytics (P008) feature'
---

# Tasks: P008 - Analytics

**Input**: Design documents from `/specs/008-analytics/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; P001–P007 operational modules implemented and passing

**Tests**: Included — the specification and plan explicitly require unit, integration, API, authorization, validation, aggregation, and tenant-isolation coverage using Vitest and Supertest.

**Organization**: Tasks introduce a new read-only `analytics` module with shared filter infrastructure and six GET dashboard endpoints. Foundational work blocks all stories. Each user story phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Company Dashboard, `US2` = Transaction Analytics, `US3` = Trip & Expense Analytics, `US4` = Workforce & Organization Analytics, `US5` = Shared Filters & Cross-Dashboard Consistency

## Path Conventions

P008 follows Scrappy API Clean Architecture:

- **Module**: `src/modules/analytics/{domain,application,infrastructure,presentation}/`
- **Shared**: `src/shared/analytics/`
- **Cross-module wiring**: `src/modules/index.ts`, `src/config/container.ts`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/modules/analytics/presentation/analytics.openapi.ts`, `src/swagger/openapi.builder.ts`, `docs/api-reference.md`
- **Tests**: `tests/unit/analytics/`, `tests/integration/analytics/`, `tests/api/analytics/`, `tests/setup/`
- **Schema**: No new Prisma models for P008 (read-only queries against existing tables)

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Create the Analytics module skeleton, shared helpers, and dedicated test areas.

- [x] T001 Create the Analytics module directory structure and `src/modules/analytics/index.ts`
- [x] T002 [P] Create Analytics domain file placeholders in `src/modules/analytics/domain/analytics-filter.ts`, `src/modules/analytics/domain/analytics-period.ts`, `src/modules/analytics/domain/analytics-query.repository.ts`, and `src/modules/analytics/domain/analytics-authorization.policy.ts`
- [x] T003 [P] Create Analytics application service placeholders in `src/modules/analytics/application/services/analytics-period-resolver.service.ts`, `src/modules/analytics/application/services/analytics-filter-validator.service.ts`, and `src/modules/analytics/application/services/analytics-audit.service.ts`
- [x] T004 [P] Create Analytics use-case placeholders in `src/modules/analytics/application/use-cases/get-company-analytics.use-case.ts`, `get-transaction-analytics.use-case.ts`, `get-trip-analytics.use-case.ts`, `get-expense-analytics.use-case.ts`, `get-workforce-analytics.use-case.ts`, and `get-organization-analytics.use-case.ts`
- [x] T005 [P] Create Analytics DTO placeholders in `src/modules/analytics/application/dto/analytics-filter.response.ts`, `company-analytics.response.ts`, `transaction-analytics.response.ts`, `trip-analytics.response.ts`, `expense-analytics.response.ts`, `workforce-analytics.response.ts`, and `organization-analytics.response.ts`
- [x] T006 [P] Create Analytics infrastructure and presentation placeholders in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`, `src/modules/analytics/infrastructure/mappers/analytics-projection.mapper.ts`, `src/modules/analytics/presentation/analytics.controller.ts`, `src/modules/analytics/presentation/analytics.routes.ts`, `src/modules/analytics/presentation/analytics.schemas.ts`, and `src/modules/analytics/presentation/analytics.openapi.ts`
- [x] T007 [P] Create shared ranking helper placeholder in `src/shared/analytics/analytics-ranking.ts` and Analytics test directories under `tests/unit/analytics/`, `tests/integration/analytics/`, and `tests/api/analytics/`

**Checkpoint**: Module scaffolding exists for implementation and testing.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared filter model, read query port, validation, authorization, routing, DI, OpenAPI base, and test infrastructure required by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T008 [P] Implement `AnalyticsPeriod` enum and bounds types in `src/modules/analytics/domain/analytics-period.ts`
- [x] T009 [P] Implement `AnalyticsFilter` value object with factory from validated query in `src/modules/analytics/domain/analytics-filter.ts`
- [x] T010 [P] Define read-only `AnalyticsQueryRepository` port with six dashboard query method signatures in `src/modules/analytics/domain/analytics-query.repository.ts`
- [x] T011 [P] Implement `assertCanAccessAnalytics` policy for Owner/Manager allow and Employee deny in `src/modules/analytics/domain/analytics-authorization.policy.ts`
- [x] T012 Implement `AnalyticsPeriodResolverService` for TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, THIS_YEAR, and CUSTOM bounds in `src/modules/analytics/application/services/analytics-period-resolver.service.ts`
- [x] T013 Implement `AnalyticsFilterValidatorService` for tenancy checks on branch, warehouse, vehicle, and employee IDs in `src/modules/analytics/application/services/analytics-filter-validator.service.ts`
- [x] T014 [P] Implement `analytics-audit.service.ts` structured read-access logging in `src/modules/analytics/application/services/analytics-audit.service.ts`
- [x] T015 [P] Implement ranking helpers (`clampLimit`, `assignRanks`, tie-break) in `src/shared/analytics/analytics-ranking.ts`
- [x] T016 [P] Implement `analyticsFilterQuerySchema` with period, from/to, org filters, includeArchived, and limit refinements in `src/modules/analytics/presentation/analytics.schemas.ts`
- [x] T017 [P] Implement `AppliedAnalyticsFilters` and `RankedMetricItem` response helpers in `src/modules/analytics/application/dto/analytics-filter.response.ts`
- [x] T018 Implement shared Prisma where-builder helpers for company scope, archived exclusion, and org dimensions in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`
- [x] T019 [P] Implement `AnalyticsProjectionMapper` for ranked lists and decimal rounding in `src/modules/analytics/infrastructure/mappers/analytics-projection.mapper.ts`
- [x] T020 Implement `AnalyticsPrismaQueryRepository` class skeleton implementing `AnalyticsQueryRepository` with not-implemented stubs in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`
- [x] T021 [P] Implement `AnalyticsController` method signatures for six GET handlers in `src/modules/analytics/presentation/analytics.controller.ts`
- [x] T022 Implement `createAnalyticsRoutes()` with GET-only routes and `authorize(['OWNER','MANAGER'])` in `src/modules/analytics/presentation/analytics.routes.ts`
- [x] T023 [P] Add Analytics schemas to `src/swagger/common-schemas.ts` (`AnalyticsPeriod`, `AnalyticsFilterQuery`, `AppliedAnalyticsFilters`, `RankedMetricItem`, dashboard response types)
- [x] T024 [P] Implement base Analytics OpenAPI path declarations in `src/modules/analytics/presentation/analytics.openapi.ts`
- [x] T025 Register `analyticsOpenApiPaths` in `src/swagger/openapi.builder.ts`
- [x] T026 Wire Analytics controller builder and exports in `src/modules/analytics/index.ts` and `src/config/container.ts`
- [x] T027 Register Analytics routes in `src/modules/index.ts`
- [x] T028 [P] Add `InMemoryAnalyticsQueryRepository` for unit/API tests in `tests/setup/in-memory-repositories.ts`
- [x] T029 [P] Extend `tests/setup/test-app.ts` and `tests/setup/auth-helpers.ts` for Owner/Manager/Employee analytics scenarios
- [x] T030 [P] Add foundational unit tests for period resolver in `tests/unit/analytics/analytics-period-resolver.test.ts`
- [x] T031 [P] Add foundational unit tests for filter schema refinements in `tests/unit/analytics/analytics-schemas.test.ts`
- [x] T032 [P] Add foundational unit tests for authorization policy in `tests/unit/analytics/analytics-authorization.test.ts`
- [x] T033 [P] Add foundational API test for Employee denied on all analytics routes in `tests/api/analytics/analytics-auth.api.test.ts`

**Checkpoint**: Shared filter infrastructure, read port, routes, DI, OpenAPI base, and auth denial are ready.

---

## Phase 3: User Story 1 - Owner Reviews Company Performance (Priority: P1) 🎯 MVP

**Goal**: Deliver `GET /api/v1/analytics/company` with all nine company KPIs, net operational amount, and live active counts.

**Independent Test**: Owner requests Company Analytics for THIS_MONTH and receives inbound/outbound counts, amounts, expenses, payroll, net operational amount, and active employees/trips/vehicles; Employee receives 403.

### Tests for User Story 1

- [x] T034 [P] [US1] Create API tests for company dashboard success and field presence in `tests/api/analytics/company-analytics.api.test.ts`
- [x] T035 [P] [US1] Create unit tests for net operational amount calculation in `tests/unit/analytics/company-metrics.test.ts`
- [x] T036 [P] [US1] Create integration tests for company aggregation against seeded data in `tests/integration/analytics/company-analytics.persistence.test.ts`

### Implementation for User Story 1

- [x] T037 [US1] Implement `getCompanyMetrics(filter)` in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts` (transactions, expenses placeholder, payroll, live active counts)
- [x] T038 [US1] Implement `GetCompanyAnalyticsUseCase` orchestrating filter resolve → validate → query → DTO in `src/modules/analytics/application/use-cases/get-company-analytics.use-case.ts`
- [x] T039 [US1] Implement `CompanyAnalyticsResponseDto` builder in `src/modules/analytics/application/dto/company-analytics.response.ts`
- [x] T040 [US1] Complete `getCompany` controller handler and route binding in `src/modules/analytics/presentation/analytics.controller.ts` and `src/modules/analytics/presentation/analytics.routes.ts`
- [x] T041 [US1] Update company analytics OpenAPI path and example in `src/modules/analytics/presentation/analytics.openapi.ts`

**Checkpoint**: Company dashboard is fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Manager Analyzes Transaction Performance (Priority: P2)

**Goal**: Deliver `GET /api/v1/analytics/transactions` with counts, amounts, averages, and ranked materials/employees/branches/warehouses.

**Independent Test**: Manager requests Transaction Analytics for a branch-filtered week and receives inbound/outbound metrics plus top lists scoped to that branch.

### Tests for User Story 2

- [x] T042 [P] [US2] Create API tests for transaction analytics metrics and rankings in `tests/api/analytics/transaction-analytics.api.test.ts`
- [x] T043 [P] [US2] Create unit tests for average transaction value and cancelled exclusion in `tests/unit/analytics/transaction-metrics.test.ts`
- [x] T044 [P] [US2] Create integration tests for transaction item amount aggregation in `tests/integration/analytics/transaction-analytics.persistence.test.ts`

### Implementation for User Story 2

- [x] T045 [US2] Implement `getTransactionMetrics(filter)` with groupBy for materials, employees, branches, and warehouses in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`
- [x] T046 [US2] Implement `GetTransactionAnalyticsUseCase` in `src/modules/analytics/application/use-cases/get-transaction-analytics.use-case.ts`
- [x] T047 [US2] Implement `TransactionAnalyticsResponseDto` builder in `src/modules/analytics/application/dto/transaction-analytics.response.ts`
- [x] T048 [US2] Complete `getTransactions` controller handler in `src/modules/analytics/presentation/analytics.controller.ts`
- [x] T049 [US2] Update transaction analytics OpenAPI path in `src/modules/analytics/presentation/analytics.openapi.ts`

**Checkpoint**: Transaction analytics dashboard works independently with rankings.

---

## Phase 5: User Story 3 - Manager Reviews Trip and Expense Insights (Priority: P3)

**Goal**: Deliver `GET /api/v1/analytics/trips` and `GET /api/v1/analytics/expenses` with status counts, utilization, breakdowns, and monthly trend.

**Independent Test**: Manager requests Trip and Expense Analytics for THIS_WEEK; trip status mix and expense breakdowns return within filters; expense zeros gracefully when P007 data absent.

### Tests for User Story 3

- [x] T050 [P] [US3] Create API tests for trip analytics in `tests/api/analytics/trip-analytics.api.test.ts`
- [x] T051 [P] [US3] Create API tests for expense analytics including zero fallback in `tests/api/analytics/expense-analytics.api.test.ts`
- [x] T052 [P] [US3] Create unit tests for average trip duration and driver ranking in `tests/unit/analytics/trip-metrics.test.ts`
- [x] T053 [P] [US3] Create integration tests for trip aggregation in `tests/integration/analytics/trip-analytics.persistence.test.ts`

### Implementation for User Story 3

- [x] T054 [US3] Implement `getTripMetrics(filter)` in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`
- [x] T055 [US3] Implement `getExpenseMetrics(filter)` with P007 graceful zero fallback in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`
- [x] T056 [US3] Implement `GetTripAnalyticsUseCase` in `src/modules/analytics/application/use-cases/get-trip-analytics.use-case.ts`
- [x] T057 [US3] Implement `GetExpenseAnalyticsUseCase` in `src/modules/analytics/application/use-cases/get-expense-analytics.use-case.ts`
- [x] T058 [P] [US3] Implement trip and expense response DTO builders in `src/modules/analytics/application/dto/trip-analytics.response.ts` and `expense-analytics.response.ts`
- [x] T059 [US3] Complete `getTrips` and `getExpenses` controller handlers in `src/modules/analytics/presentation/analytics.controller.ts`
- [x] T060 [US3] Update trip and expense OpenAPI paths in `src/modules/analytics/presentation/analytics.openapi.ts`

**Checkpoint**: Trip and expense dashboards work independently.

---

## Phase 6: User Story 4 - Manager Reviews Workforce and Organization Performance (Priority: P4)

**Goal**: Deliver `GET /api/v1/analytics/workforce` and `GET /api/v1/analytics/organization` with workforce summaries and org performance views.

**Independent Test**: Manager requests Workforce and Organization Analytics for THIS_MONTH; attendance, payroll, leave, cash advance summaries and branch/warehouse/vehicle performance return for the company.

### Tests for User Story 4

- [x] T061 [P] [US4] Create API tests for workforce analytics in `tests/api/analytics/workforce-analytics.api.test.ts`
- [x] T062 [P] [US4] Create API tests for organization analytics in `tests/api/analytics/organization-analytics.api.test.ts`
- [x] T063 [P] [US4] Create integration tests for workforce aggregation in `tests/integration/analytics/workforce-analytics.persistence.test.ts`
- [x] T064 [P] [US4] Create integration tests for organization aggregation in `tests/integration/analytics/organization-analytics.persistence.test.ts`

### Implementation for User Story 4

- [x] T065 [US4] Implement `getWorkforceMetrics(filter)` in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`
- [x] T066 [US4] Implement `getOrganizationMetrics(filter)` in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`
- [x] T067 [US4] Implement `GetWorkforceAnalyticsUseCase` in `src/modules/analytics/application/use-cases/get-workforce-analytics.use-case.ts`
- [x] T068 [US4] Implement `GetOrganizationAnalyticsUseCase` in `src/modules/analytics/application/use-cases/get-organization-analytics.use-case.ts`
- [x] T069 [P] [US4] Implement workforce and organization response DTO builders in `src/modules/analytics/application/dto/workforce-analytics.response.ts` and `organization-analytics.response.ts`
- [x] T070 [US4] Complete `getWorkforce` and `getOrganization` controller handlers in `src/modules/analytics/presentation/analytics.controller.ts`
- [x] T071 [US4] Update workforce and organization OpenAPI paths in `src/modules/analytics/presentation/analytics.openapi.ts`

**Checkpoint**: All six analytics dashboards are implemented.

---

## Phase 7: User Story 5 - Shared Filters & Cross-Dashboard Consistency (Priority: P5)

**Goal**: Ensure preset/custom date ranges and org filters behave consistently across all dashboards with proper validation and empty-range handling.

**Independent Test**: Owner switches periods and applies branch filter across multiple dashboards; invalid custom range and foreign filter IDs are rejected; empty range returns zeros.

### Tests for User Story 5

- [x] T072 [P] [US5] Create API tests for invalid custom date range rejection in `tests/api/analytics/analytics-validation.api.test.ts`
- [x] T073 [P] [US5] Create API tests for foreign-company filter ID rejection in `tests/api/analytics/analytics-tenant-isolation.api.test.ts`
- [x] T074 [P] [US5] Create API tests for empty-range zero results across dashboards in `tests/api/analytics/analytics-empty-range.api.test.ts`
- [x] T075 [P] [US5] Create API tests for `includeArchived` behavior in `tests/api/analytics/analytics-archived.api.test.ts`
- [x] T076 [P] [US5] Create API tests verifying `appliedFilters` echo consistency in `tests/api/analytics/analytics-filter-consistency.api.test.ts`

### Implementation for User Story 5

- [x] T077 [US5] Finalize shared filter pipeline in all six use cases (resolve → validate → audit → query) in `src/modules/analytics/application/use-cases/`
- [x] T078 [US5] Ensure all repository methods honor identical `AnalyticsFilter` predicates in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`
- [x] T079 [US5] Add slow-query warning log threshold (>1s) in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`

**Checkpoint**: Filters are consistent, validated, and tenant-safe across all dashboards.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, performance review, and quickstart validation.

- [x] T080 [P] Add Analytics section to `docs/api-reference.md` documenting all six endpoints, shared query params, and response fields
- [x] T081 [P] Verify `specs/008-analytics/contracts/openapi.yaml` stays aligned with `analytics.openapi.ts` and `common-schemas.ts`
- [x] T082 Run `specs/008-analytics/quickstart.md` scenarios manually or via documented test commands
- [x] T083 [P] Add optional large-dataset integration test with soft timing assertion in `tests/integration/analytics/analytics-performance.test.ts`
- [x] T084 Run `pnpm lint`, `pnpm test:unit -- tests/unit/analytics`, `pnpm test:api -- tests/api/analytics`, and `pnpm build`
- [x] T085 Review Analytics module for read-only guarantee (no write Prisma calls) in `src/modules/analytics/`

**Checkpoint**: Feature is documented, validated, and merge-ready.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Stories (Phase 3–7)**: Depend on Foundational completion
  - US1 (P1) can start first as MVP
  - US2–US4 can proceed sequentially or in parallel after Foundational
  - US5 validates cross-cutting filters after dashboards exist (depends on US1–US4)
- **Polish (Phase 8)**: Depends on US1–US5 completion

### User Story Dependencies

| Story    | Depends on   | Delivers                                  |
| -------- | ------------ | ----------------------------------------- |
| US1 (P1) | Foundational | Company dashboard                         |
| US2 (P2) | Foundational | Transaction dashboard                     |
| US3 (P3) | Foundational | Trip + Expense dashboards                 |
| US4 (P4) | Foundational | Workforce + Organization dashboards       |
| US5 (P5) | US1–US4      | Filter consistency & validation hardening |

US2–US4 do not depend on each other; they share Foundational filter/query infrastructure only.

### Within Each User Story

- Tests written first (fail before implementation)
- Repository query methods before use cases
- Use cases before controller handlers
- OpenAPI updates after handler contracts stabilize

### Parallel Opportunities

- Phase 1: T002–T007 all parallel after T001
- Phase 2: T008–T011, T014–T017, T023–T024, T028–T032 parallel where marked [P]
- After Foundational: US2, US3, US4 can be staffed in parallel by different developers
- Within each story: test tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
T034 — tests/api/analytics/company-analytics.api.test.ts
T035 — tests/unit/analytics/company-metrics.test.ts
T036 — tests/integration/analytics/company-analytics.persistence.test.ts

# Then sequential implementation:
T037 → T038 → T039 → T040 → T041
```

---

## Parallel Example: After Foundational

```bash
# Three developers after Phase 2 checkpoint:
Developer A: Phase 3 (US1 — Company) — MVP
Developer B: Phase 4 (US2 — Transactions)
Developer C: Phase 5 (US3 — Trips & Expenses)

# Then Developer A or B takes Phase 6 (US4), then Phase 7 (US5)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**critical**)
3. Complete Phase 3: User Story 1 (Company dashboard)
4. **STOP and VALIDATE**: `pnpm test:api -- tests/api/analytics/company-analytics.api.test.ts`
5. Demo Owner company snapshot

### Incremental Delivery

1. Setup + Foundational → shared filter infrastructure ready
2. US1 → Company dashboard → deploy/demo (**MVP**)
3. US2 → Transaction analytics → deploy/demo
4. US3 → Trip + Expense analytics → deploy/demo
5. US4 → Workforce + Organization → deploy/demo
6. US5 → Filter hardening → deploy/demo
7. Polish → docs + quickstart

### Suggested MVP Scope

**User Story 1 only** (Company Analytics) after Foundational — delivers executive snapshot and proves read-only aggregation architecture before expanding to specialized dashboards.

---

## Notes

- Analytics is **read-only**: no Prisma migrations or write operations in this feature
- Expense metrics return zeros until P007 `Expense` model exists — do not block other dashboards
- All monetary values: PHP, 2 decimal places; ranked lists default `limit=10`, max `25`
- Live metrics (`activeEmployees`, `activeTrips`, `activeVehicles`) ignore historical date range per spec FR-017
- Verify tests fail before implementing corresponding production code
- Stop at any checkpoint to validate story independence
