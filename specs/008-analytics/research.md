# Research: Analytics (P008)

**Feature**: `008-analytics`  
**Date**: 2026-07-09

## 1. Bounded context placement

**Decision**: Implement a new top-level `analytics` module under `src/modules/analytics/` following
the same Clean Architecture layout as `workforce-dashboard` and `trip`.

**Rationale**: Analytics is a cross-cutting read model over many operational modules. A dedicated
module keeps aggregation logic out of operational aggregates (transaction, trip, payroll, etc.)
and prevents write paths from creeping into dashboards.

**Alternatives considered**:

- Embed analytics endpoints in each source module — rejected; duplicates filter logic and splits
  dashboard contracts.
- Separate microservice — rejected; violates monolith conventions and adds operational cost.

## 2. Read-only architecture

**Decision**: Analytics exposes **GET-only** routes. No Prisma `create`/`update`/`delete` in
analytics infrastructure. Use cases inject read query ports only.

**Rationale**: Product spec FR-009 and plan constraint: Analytics must never modify business data.
GET-only routing makes violations obvious in code review.

**Alternatives considered**:

- POST for complex filter bodies — deferred; query-string filters sufficient for P008 dashboards.

## 3. Data aggregation strategy

**Decision**: **Online aggregation** against operational PostgreSQL tables at request time via
Prisma aggregate/group-by queries in `AnalyticsQueryRepository` implementations. No materialized
views or analytics tables in P008.

**Rationale**: Spec FR-013 requires reflecting current operational data. Company scale in Scrappy
junkshop domain is manageable with indexed queries and bounded date ranges (max 1 year).

**Alternatives considered**:

- Nightly rollup tables — rejected for P008 scope; noted in Future Extensibility.
- Event-sourced projections — rejected; over-engineered for initial dashboards.

## 4. Repository / query port design

**Decision**: Single domain port `AnalyticsQueryRepository` with methods grouped by dashboard
(`getCompanyMetrics`, `getTransactionMetrics`, etc.). One `AnalyticsPrismaQueryRepository`
implements all methods using existing Prisma models.

**Rationale**: Read-only module with no aggregate roots; a unified query port avoids six parallel
repository interfaces while still keeping Prisma out of application layer.

**Alternatives considered**:

- Inject each operational module's repository — rejected; leaks list/pagination semantics and
  forces N+1 aggregation in application layer.
- Raw SQL views — rejected; plan prohibits SQL generation in design doc; Prisma groupBy sufficient.

## 5. Shared filter model

**Decision**: `AnalyticsFilter` value object in analytics domain:

- `period`, `from`, `to` (resolved bounds)
- optional `branchId`, `warehouseId`, `vehicleId`, `employeeId`
- `includeArchived` (default false)
- `companyId` (from auth, never client-supplied)

Resolved by `AnalyticsPeriodResolverService` + `AnalyticsFilterValidatorService` before queries.

**Rationale**: Spec requires consistent filters across dashboards. Central resolver prevents
per-endpoint date math drift.

**Alternatives considered**:

- Per-dashboard filter types — rejected; duplicates validation and OpenAPI schemas.

## 6. Period preset resolution

**Decision**: Resolve presets in application service using company-local calendar boundaries.
Default timezone: **UTC** (consistent with Trip Number / Transaction Number date components in
P005/P006). `period` enum: `TODAY | YESTERDAY | THIS_WEEK | THIS_MONTH | THIS_YEAR | CUSTOM`.

**Rationale**: Spec requires preset periods; UTC matches existing Scrappy date sequencing patterns.

**Alternatives considered**:

- Per-company timezone column — deferred; no Company timezone field in P001 schema yet.

## 7. Transaction amount calculation

**Decision**:

- **Transaction count**: non-cancelled transactions in scope (status ≠ `CANCELLED`).
- **Total transaction amount**: sum of `TransactionItem.total` for items belonging to in-scope
  transactions (same filter dimensions applied via transaction header).
- **Inbound / outbound counts**: count by `Transaction.direction`.
- **Average transaction value**: `totalTransactionAmount / transactionCount` (0 when count is 0).

**Rationale**: Transaction header has no persisted total; item totals are authoritative in P004.

## 8. Active vs period metrics

**Decision**:

| Metric class      | Uses date range? | Definition                                                                                       |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| Active Employees  | No               | `Employee.status = ACTIVE` and `deletedAt IS NULL`, further narrowed by optional employee filter |
| Active Trips      | No               | `Trip.status = STARTED` and not archived                                                         |
| Active Vehicles   | No               | `Vehicle.status IN (AVAILABLE, IN_USE)` and not archived                                         |
| All other metrics | Yes              | Filtered by resolved `from`/`to` on domain-appropriate date fields                               |

**Rationale**: Spec FR-017/FR-018 distinguishes live status from period aggregates.

## 9. Expense module integration (P007)

**Decision**: Define `ExpenseAnalyticsQuery` methods on `AnalyticsQueryRepository`. When P007
`Expense` model is absent, infrastructure returns **zero totals and empty breakdowns** without
error.

**Rationale**: Spec allows zeros when expense data missing; keeps Analytics contract stable.

**Alternatives considered**:

- Hide expense endpoint until P007 — rejected; breaks dashboard completeness and quickstart.

## 10. Authorization matrix

**Decision**: **Owner and Manager** may access **all six** analytics endpoints. **Employee** denied
all (`403 Forbidden`).

**Rationale**: Product spec FR-011 and User Story 2–4 require Manager access to transaction, trip,
expense, workforce, and organization analytics. Plan prompt section 7 suggested Manager-only
company dashboard; **spec takes precedence** for authorization.

## 11. Ranking list limits

**Decision**: Top/most-active lists default `limit=10`, max `25`, sorted descending by primary
measure. Stable tie-breaker: alphabetical by display name.

**Rationale**: Spec assumption: dashboard-sized lists; prevents unbounded payloads.

## 12. Caching

**Decision**: **No cache in P008 MVP**. Document optional future `AnalyticsCachePort` (in-memory
TTL 30–60s or Redis) keyed by `(companyId, endpoint, filterHash)`.

**Rationale**: Simplicity gate; correctness first. Add cache when profiling shows hot paths.

## 13. Performance indexes (existing + recommended)

**Decision**: Rely on existing indexes from P004–P007. Add migration only if profiling gaps found:

| Area         | Existing / recommended index focus                                        |
| ------------ | ------------------------------------------------------------------------- |
| Transactions | `(companyId, transactionDate)`, `(companyId, deletedAt, transactionDate)` |
| Items        | `(transactionId)`, `(transactionId, materialName)`                        |
| Trips        | `(companyId, status, deletedAt)`, `(companyId, scheduledStart)`           |
| Payroll      | `(companyId, payPeriodStart, payPeriodEnd)`                               |
| Attendance   | `(companyId, timeInAt)`                                                   |

Parallel `Promise.all` for independent sub-queries within a dashboard use case.

## 14. Relationship to workforce-dashboard

**Decision**: Keep `workforce-dashboard` as employee-scoped operational snapshot. Analytics is
**manager/owner BI** with company-wide aggregation. No merge in P008; optional future link from
dashboard cards to analytics deep links.

**Rationale**: Different audiences and authorization models.

## 15. Swagger / OpenAPI

**Decision**: `analytics.openapi.ts` registered in `openapi.builder.ts`; reusable schemas in
`common-schemas.ts` (`AnalyticsFilterQuery`, `RankedMetricItem`, dashboard response types).

**Rationale**: Matches P006/P005 OpenAPI conventions.

## 16. Testing approach

**Decision**:

- Unit: period resolver, filter validator, metric math helpers, authorization policy
- Integration: prisma query repository against seeded data
- API: Supertest per endpoint, role matrix, validation errors, tenant isolation, empty range

**Rationale**: Constitution testing gates; aggregation correctness is highest risk.
