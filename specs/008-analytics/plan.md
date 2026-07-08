# Implementation Plan: P008 - Analytics

**Branch**: `008-analytics` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-analytics/spec.md`

**Note**: This plan is the definitive technical design for Analytics — not implementation code.
It follows architecture, conventions, and engineering decisions from P001–P007 without redefining them.

## Summary

Introduce a new read-only `analytics` module that aggregates operational data from existing modules
(company, organization, workforce, transactions, trips, expenses) into six dashboard endpoints.
Shared `AnalyticsFilter` resolution and validation ensure consistent date and organization scoping.
`AnalyticsQueryRepository` (domain port) performs Prisma aggregate/group-by reads in infrastructure;
no new database tables. Owners and Managers access all dashboards; Employees are denied. Expense
metrics return zeros until P007 data exists.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT (P001), Pino, Swagger/OpenAPI,
Vitest, Supertest (unchanged from P007)

**Storage**: PostgreSQL — **read-only** queries against existing operational tables; no Analytics
persistence in P008

**Testing**: Vitest (unit/integration), Supertest (API/authorization/validation)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API — new `analytics` module only (no operational module changes
except optional read-only repository exports if needed)

**Performance Goals**: Dashboard responses under 2s p95 for typical company volumes (<100k
transactions/year) with 1-year max range; ranked lists capped at 25 items

**Constraints**: Company tenant boundary; read-only GET routes; archived excluded by default; max
custom range 366 days; no cross-company data leakage

**Scale/Scope**: 1 new module, 6 GET endpoints, 6 use cases, 1 query repository, shared filter
services; ~15 response DTOs; no Prisma migrations required for P008 core

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                               |
| -------------------------------- | ---------- | ----------- | --------------------------------------------------- |
| Layer boundaries                 | ✅         | ✅          | Analytics domain has no Prisma imports              |
| No business logic in controllers | ✅         | ✅          | `analytics.controller` delegates to use cases       |
| Repository pattern               | ✅         | ✅          | `AnalyticsQueryRepository` read port                |
| Dependency injection             | ✅         | ✅          | Wired in `src/config/container.ts`                  |
| Zod validation                   | ✅         | ✅          | `analytics.schemas.ts` for query params             |
| DTOs                             | ✅         | ✅          | Dashboard response DTOs; no entity leak             |
| Standard response envelope       | ✅         | ✅          | Reuses P001 `success()` helper                      |
| Pagination conventions           | ✅         | ✅          | Ranked lists use `limit` (not full list pagination) |
| Security                         | ✅         | ✅          | JWT + role middleware; company resolution           |
| No `any`                         | ✅         | ✅          | Strict TypeScript                                   |
| Error handling                   | ✅         | ✅          | ValidationAppError, ForbiddenError, NotFound        |
| Logging                          | ✅         | ✅          | `analytics-audit.service` for read access events    |
| Tests                            | ✅         | ✅          | Unit, integration, API, auth, tenant isolation      |
| OpenAPI                          | ✅         | ✅          | `analytics.openapi.ts` + `common-schemas.ts`        |
| Simplicity                       | ✅         | ✅          | No cache/materialized views in MVP                  |

## Project Structure

### Documentation (this feature)

```text
specs/008-analytics/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 — /speckit-tasks
```

### Source code (new)

```text
src/modules/analytics/
├── domain/
│   ├── analytics-filter.ts
│   ├── analytics-period.ts
│   ├── analytics-query.repository.ts
│   └── analytics-authorization.policy.ts
├── application/
│   ├── dto/
│   │   ├── analytics-filter.response.ts
│   │   ├── company-analytics.response.ts
│   │   ├── transaction-analytics.response.ts
│   │   ├── trip-analytics.response.ts
│   │   ├── expense-analytics.response.ts
│   │   ├── workforce-analytics.response.ts
│   │   └── organization-analytics.response.ts
│   ├── use-cases/
│   │   ├── get-company-analytics.use-case.ts
│   │   ├── get-transaction-analytics.use-case.ts
│   │   ├── get-trip-analytics.use-case.ts
│   │   ├── get-expense-analytics.use-case.ts
│   │   ├── get-workforce-analytics.use-case.ts
│   │   └── get-organization-analytics.use-case.ts
│   ├── policies/
│   │   └── analytics-authorization.policy.ts
│   └── services/
│       ├── analytics-period-resolver.service.ts
│       ├── analytics-filter-validator.service.ts
│       └── analytics-audit.service.ts
├── infrastructure/
│   ├── analytics.prisma-query-repository.ts
│   └── mappers/
│       └── analytics-projection.mapper.ts
├── presentation/
│   ├── analytics.controller.ts
│   ├── analytics.routes.ts
│   ├── analytics.schemas.ts
│   └── analytics.openapi.ts
└── index.ts

src/shared/analytics/
└── analytics-ranking.ts              # tie-break helpers, limit clamping

src/config/container.ts               # MOD — wire analytics module
src/modules/index.ts                  # MOD — register analytics routes
src/swagger/openapi.builder.ts        # MOD — import analyticsOpenApiPaths
src/swagger/common-schemas.ts         # MOD — analytics schemas

tests/
├── unit/analytics/
├── integration/analytics/
└── api/analytics/
```

**Structure Decision**: Single read-only module with unified query repository; mirrors
`workforce-dashboard` presentation patterns but with manager/owner BI scope.

## Complexity Tracking

No constitution violations requiring justification.

---

## 1. Module Architecture

### Responsibilities

| Component                         | Responsibility                                           |
| --------------------------------- | -------------------------------------------------------- |
| `analytics` module                | Read-only dashboards, filter resolution, metric assembly |
| `AnalyticsFilter`                 | Canonical scope (period, org filters, tenancy)           |
| `AnalyticsPeriodResolverService`  | Preset → `from`/`to` bounds                              |
| `AnalyticsFilterValidatorService` | Zod-backed + tenancy reference checks                    |
| `AnalyticsQueryRepository`        | Domain read port for all aggregations                    |
| `AnalyticsPrismaQueryRepository`  | Prisma groupBy/aggregate implementations                 |
| `analytics-authorization.policy`  | Owner/Manager allow; Employee deny                       |
| Dashboard use cases (×6)          | Orchestrate filter → query → DTO mapping                 |

### Read-only architecture

```text
HTTP GET → controller → use case → AnalyticsQueryRepository (read)
                                      ↓
                              Operational tables (existing)
```

- **No** `POST`/`PATCH`/`DELETE` analytics routes.
- **No** `prisma.*.create/update/delete` in analytics infrastructure.
- Use cases MUST NOT call operational write use cases.

### Why Analytics never modifies business data

1. **Product invariant** — Analytics is BI, not operations (spec FR-009).
2. **Aggregate integrity** — Transaction, Trip, Payroll lifecycles stay in their owning modules.
3. **Audit clarity** — All mutations remain traceable to operational endpoints.
4. **Security** — Read-only surface reduces attack footprint.
5. **Simplicity** — No dual-write or sync lag between analytics and operations.

### Data aggregation strategy

**Online aggregation** at request time (see [research.md](./research.md)):

- Prisma `count`, `aggregate`, `groupBy` against indexed columns
- Parallel sub-queries via `Promise.all` within each dashboard use case
- Ranked lists: `orderBy` + `take(limit)` in repository layer

### Dependencies (read-only)

| Module         | Usage                                               |
| -------------- | --------------------------------------------------- |
| `company`      | Implicit tenant via auth                            |
| `branch`       | Filter validation; branch labels in rankings        |
| `warehouse`    | Filter validation; warehouse labels                 |
| `vehicle`      | Filter validation; utilization metrics              |
| `employee`     | Filter validation; activity rankings                |
| `transaction`  | Counts, amounts, material/branch/warehouse rankings |
| `trip`         | Status counts, duration, driver/vehicle rankings    |
| `attendance`   | Workforce attendance summary                        |
| `leave`        | Leave summary                                       |
| `cash-advance` | Cash advance summary                                |
| `payroll`      | Payroll totals                                      |
| `expense`      | Expense breakdowns (P007; graceful zero fallback)   |

Analytics MUST NOT import operational **use cases**. Optional read of operational **repositories**
only for filter existence checks (`BranchRepository.findById`, etc.) via validator service.

### Separation from operational modules

- Operational modules own writes and lifecycle rules.
- Analytics consumes **projections** through `AnalyticsQueryRepository` only.
- `workforce-dashboard` remains employee-scoped; Analytics is company-wide BI.

### Shared services

| Service                      | Location               | Purpose                        |
| ---------------------------- | ---------------------- | ------------------------------ |
| `analytics-period-resolver`  | analytics application  | Preset date boundaries         |
| `analytics-filter-validator` | analytics application  | Tenancy + reference validation |
| `analytics-audit`            | analytics application  | Structured read-access logging |
| `analytics-ranking`          | `src/shared/analytics` | Limit clamp, rank assignment   |

---

## 2. Metrics Design

All monetary values: **PHP**, 2 decimal places, rounded half-up. Counts: integers.

### Company Metrics

| Metric                   | Definition                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Total Inbound            | Count of transactions where `direction=INBOUND`, `status≠CANCELLED`, `transactionDate` in range, matching org filters |
| Total Outbound           | Same for `direction=OUTBOUND`                                                                                         |
| Total Transaction Amount | Sum of `TransactionItem.total` for items whose parent transaction is in scope                                         |
| Total Expenses           | Sum of expense amounts in range (P007); 0 if no expense data                                                          |
| Total Payroll            | Sum of `PayrollRecord.netPay` where pay period overlaps `[from, to]`                                                  |
| Net Operational Amount   | `totalTransactionAmount - totalExpenses - totalPayroll`                                                               |
| Active Employees         | **Live**: count `Employee` where `status=ACTIVE` and not archived; narrowed by `employeeId` if set                    |
| Active Trips             | **Live**: count `Trip` where `status=STARTED` and not archived                                                        |
| Active Vehicles          | **Live**: count `Vehicle` where `status∈{AVAILABLE,IN_USE}` and not archived                                          |

### Transaction Metrics

| Metric                    | Definition                                                                       |
| ------------------------- | -------------------------------------------------------------------------------- |
| Transaction Count         | In-scope non-cancelled transactions                                              |
| Average Transaction Value | `totalTransactionAmount / transactionCount` (0 if count=0)                       |
| Total Inbound             | Inbound count (same scope)                                                       |
| Total Outbound            | Outbound count                                                                   |
| Top Materials             | Group items by `materialName`; rank by sum of `item.total` DESC                  |
| Most Active Employees     | Group by assigned `employeeId`; rank by transaction assignment count             |
| Most Active Branches      | Group by `branchId` where `locationType=BRANCH`; rank by transaction count       |
| Most Active Warehouses    | Group by `warehouseId` where `locationType=WAREHOUSE`; rank by transaction count |

### Trip Metrics

| Metric                | Definition                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Total Trips           | Trips with `scheduledStart` in range                                                            |
| Active Trips          | **Live** `status=STARTED`                                                                       |
| Completed Trips       | `status=COMPLETED` and `actualEnd` in range                                                     |
| Cancelled Trips       | `status=CANCELLED` and `updatedAt` (cancel) in range                                            |
| Average Trip Duration | Mean minutes of `(actualEnd - actualStart)` for completed trips in range                        |
| Vehicle Utilization   | Per vehicle: trip count in range; optional utilization rate = active trip time / range duration |
| Most Active Drivers   | `TripMember` with `role=DRIVER`; rank by trip count in range                                    |
| Most Active Vehicles  | Rank vehicles by trip count in range                                                            |

### Expense Metrics

| Metric                | Definition                                      |
| --------------------- | ----------------------------------------------- |
| Total Expenses        | Sum expense amounts in range                    |
| Expenses by Category  | Group by expense category                       |
| Expenses by Branch    | Group by branch dimension                       |
| Expenses by Warehouse | Group by warehouse dimension                    |
| Expenses by Vehicle   | Group by vehicle dimension                      |
| Expenses by Trip      | Group by trip dimension                         |
| Monthly Expense Trend | Bucket by `YYYY-MM` within range; sum per month |

_P007 field names assumed per expense spec; zeros when model absent._

### Workforce Metrics

| Metric                | Definition                                                                      |
| --------------------- | ------------------------------------------------------------------------------- |
| Attendance Summary    | `{ sessionsCount, totalHours, openSessions }` from `AttendanceSession` in range |
| Payroll Summary       | `{ recordsCount, totalGross, totalNetPay }` for overlapping payroll records     |
| Leave Summary         | `{ approvedDays, pendingCount, rejectedCount }` by `leaveDate`/status           |
| Cash Advance Summary  | `{ outstandingTotal, advancesCount, deductedTotal }`                            |
| Employee Activity     | Per-employee composite score (transactions + trips + attendance hours)          |
| Most Active Employees | Rank by activity score                                                          |

### Organization Metrics

| Metric                | Definition                                                                        |
| --------------------- | --------------------------------------------------------------------------------- |
| Branch Performance    | Per branch: transaction count, transaction amount, expense amount in range        |
| Warehouse Performance | Per warehouse: transaction count, transaction amount                              |
| Vehicle Utilization   | Per vehicle: trip count, utilization rate (shared definition with trip dashboard) |

---

## 3. Query Design

### Aggregation strategy

- **Filter first**: Build Prisma `where` clause from `AnalyticsFilter` via shared builder
  (`buildTransactionWhere(filter)`, etc.).
- **Header + item joins**: Transaction amounts always aggregate at item level with transaction
  header filters applied.
- **Parallel reads**: Independent metrics in same dashboard fetched concurrently.
- **No SQL in plan**: Implementation uses Prisma aggregate APIs in infrastructure only.

### Grouping

| Dashboard    | Group-by keys                                                              |
| ------------ | -------------------------------------------------------------------------- |
| Transaction  | `materialName`, `employeeId`, `branchId`, `warehouseId`                    |
| Trip         | `vehicleId`, driver `employeeId`                                           |
| Expense      | `category`, `branchId`, `warehouseId`, `vehicleId`, `tripId`, month bucket |
| Workforce    | `employeeId`                                                               |
| Organization | `branchId`, `warehouseId`, `vehicleId`                                     |

### Filtering

Shared dimensions applied consistently:

- `companyId` (required, from auth)
- `from`/`to` on domain-appropriate date columns
- Optional `branchId`, `warehouseId`, `vehicleId`, `employeeId`
- `includeArchived` toggles `deletedAt` predicates
- Cancelled transactions always excluded from amount/count metrics

### Sorting

- Ranked lists: primary measure DESC, `label` ASC tie-break.
- Organization branch/warehouse lists: transaction amount DESC.

### Pagination

- Dashboard totals: not paginated (single snapshot).
- Ranked lists: `limit` query param (default 10, max 25) — not full cursor pagination.

### Searching

- Not in P008 scope. Future: `q` prefix on material or employee name in rankings.

### Date range filtering

Resolved by `AnalyticsPeriodResolverService` before query execution. All period-based metrics use
the same resolved `from`/`to` except live active counts.

### Reusable query services

| Builder / service            | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `buildBaseCompanyWhere`      | `companyId` + archived predicate        |
| `buildTransactionScopeWhere` | Date + org filters on Transaction       |
| `buildTripScopeWhere`        | Date + vehicle/employee filters on Trip |
| `buildWorkforceScopeWhere`   | Employee-scoped workforce tables        |

Located in `analytics.prisma-query-repository.ts` as private helpers (infrastructure).

### Performance considerations

- Reuse existing indexes (see research.md §13).
- Avoid N+1: use `groupBy` not per-row loops.
- Cap range to 366 days at validation.
- Cap ranked list size at 25.
- Log slow queries (>1s) via Pino in repository.

---

## 4. Dashboard Design

### Company Dashboard

| Aspect         | Design                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Purpose        | Executive snapshot of company health                                           |
| Endpoint       | `GET /api/v1/analytics/company`                                                |
| Metrics        | All Company Metrics (§2)                                                       |
| Filters        | period, from/to, branchId, warehouseId, vehicleId, employeeId, includeArchived |
| Business rules | Net operational formula; live active counts ignore historical period           |

### Transaction Dashboard

| Aspect         | Design                                |
| -------------- | ------------------------------------- |
| Purpose        | Commercial activity and concentration |
| Endpoint       | `GET /api/v1/analytics/transactions`  |
| Metrics        | All Transaction Metrics               |
| Filters        | Shared + `limit` for rankings         |
| Business rules | Exclude cancelled; amounts from items |

### Trip Dashboard

| Aspect         | Design                                          |
| -------------- | ----------------------------------------------- |
| Purpose        | Field operations and fleet utilization          |
| Endpoint       | `GET /api/v1/analytics/trips`                   |
| Metrics        | All Trip Metrics                                |
| Filters        | Shared + `limit`                                |
| Business rules | Active trips live; duration from completed only |

### Expense Dashboard

| Aspect         | Design                                   |
| -------------- | ---------------------------------------- |
| Purpose        | Spend analysis by category and dimension |
| Endpoint       | `GET /api/v1/analytics/expenses`         |
| Metrics        | All Expense Metrics                      |
| Filters        | Shared + `limit`                         |
| Business rules | Zeros when P007 absent                   |

### Workforce Dashboard

| Aspect         | Design                                         |
| -------------- | ---------------------------------------------- |
| Purpose        | People operations summary                      |
| Endpoint       | `GET /api/v1/analytics/workforce`              |
| Metrics        | All Workforce Metrics                          |
| Filters        | Shared; `employeeId` narrows all sub-summaries |
| Business rules | Attendance hours from session timeIn/timeOut   |

### Organization Dashboard

| Aspect         | Design                                            |
| -------------- | ------------------------------------------------- |
| Purpose        | Branch, warehouse, vehicle performance comparison |
| Endpoint       | `GET /api/v1/analytics/organization`              |
| Metrics        | All Organization Metrics                          |
| Filters        | Shared + `limit` where applicable                 |
| Business rules | Combines transaction + trip signals per org unit  |

---

## 5. API Design

Base path: `/api/v1/analytics`. Standard success envelope. See
[contracts/openapi.yaml](./contracts/openapi.yaml).

| Purpose                | Method | URI                              | Auth           | Request (query)              | Response                | Errors        |
| ---------------------- | ------ | -------------------------------- | -------------- | ---------------------------- | ----------------------- | ------------- |
| Company analytics      | GET    | `/api/v1/analytics/company`      | Owner, Manager | AnalyticsFilterQuery         | `CompanyAnalytics`      | 400, 401, 403 |
| Transaction analytics  | GET    | `/api/v1/analytics/transactions` | Owner, Manager | AnalyticsFilterQuery + limit | `TransactionAnalytics`  | 400, 401, 403 |
| Trip analytics         | GET    | `/api/v1/analytics/trips`        | Owner, Manager | AnalyticsFilterQuery + limit | `TripAnalytics`         | 400, 401, 403 |
| Expense analytics      | GET    | `/api/v1/analytics/expenses`     | Owner, Manager | AnalyticsFilterQuery + limit | `ExpenseAnalytics`      | 400, 401, 403 |
| Workforce analytics    | GET    | `/api/v1/analytics/workforce`    | Owner, Manager | AnalyticsFilterQuery + limit | `WorkforceAnalytics`    | 400, 401, 403 |
| Organization analytics | GET    | `/api/v1/analytics/organization` | Owner, Manager | AnalyticsFilterQuery + limit | `OrganizationAnalytics` | 400, 401, 403 |

**Default period**: `THIS_MONTH` when `period` omitted.

---

## 6. Validation Design

Using Zod in `analytics.schemas.ts` (same patterns as `transaction.schemas.ts`).

### Shared schema: `analyticsFilterQuerySchema`

```typescript
period: z.enum(['TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR', 'CUSTOM']).default(
  'THIS_MONTH',
);
from: z.coerce.date().optional();
to: z.coerce.date().optional();
branchId: z.string().uuid().optional();
warehouseId: z.string().uuid().optional();
vehicleId: z.string().uuid().optional();
employeeId: z.string().uuid().optional();
includeArchived: z.coerce.boolean().default(false);
limit: z.coerce.number().int().min(1).max(25).default(10);
```

### Refinements

- CUSTOM → `from` and `to` required
- `to >= from`
- Range span ≤ 366 days
- At most one of conflicting filters validated for existence (business layer)

### Business validation (`AnalyticsFilterValidatorService`)

- `branchId` exists in company
- `warehouseId` exists in company
- `vehicleId` exists in company
- `employeeId` exists in company
- Fail with `ResourceNotFoundError` or `ValidationAppError` per P001 conventions

### Shared validators

Export `analyticsFilterQuerySchema` once; all six routes use `validate(..., 'query')`.

---

## 7. Authorization Matrix

| Role     | Company | Transactions | Trips | Expenses | Workforce | Organization |
| -------- | ------- | ------------ | ----- | -------- | --------- | ------------ |
| Owner    | ✅      | ✅           | ✅    | ✅       | ✅        | ✅           |
| Manager  | ✅      | ✅           | ✅    | ✅       | ✅        | ✅           |
| Employee | ❌ 403  | ❌ 403       | ❌    | ❌       | ❌        | ❌           |

**Note**: Product spec FR-011 and user stories require Manager access to all dashboards. Plan prompt
section 7 suggested Manager-only company access; **spec takes precedence** (see research.md §10).

Implementation:

```typescript
authorize(['OWNER', 'MANAGER']); // on all analytics routes
```

Employees receive `403 Forbidden` before query execution.

---

## 8. Business Rules

1. Analytics is read-only (GET only).
2. All queries scoped to `req.auth.companyId`.
3. Archived records excluded unless `includeArchived=true`.
4. Filters apply consistently — same `AnalyticsFilter` object passed to all sub-queries in a
   dashboard.
5. Metrics reflect current DB state at request time.
6. Cancelled transactions excluded from financial/count metrics.
7. Ranked lists stable order (measure DESC, label ASC).
8. Empty results return zeros/empty arrays, not errors.

---

## 9. Performance Strategy

| Technique                | P008 approach                                                         |
| ------------------------ | --------------------------------------------------------------------- |
| Aggregation optimization | Prisma `groupBy`/`aggregate`; parallel sub-queries                    |
| Query optimization       | Shared where builders; select only needed columns                     |
| Index considerations     | Leverage existing P004–P007 indexes; add only if profiling shows gap  |
| Caching                  | None in MVP; document `AnalyticsCachePort` for future TTL cache       |
| Large datasets           | 366-day max range; ranked list cap; slow-query logging                |
| Future scalability       | Materialized views, read replicas, Redis cache — without API redesign |

Target: p95 < 2s per dashboard for seeded integration test dataset.

---

## 10. Error Scenarios

| Scenario                              | HTTP | Code / behavior                               |
| ------------------------------------- | ---- | --------------------------------------------- |
| Missing/invalid token                 | 401  | `UNAUTHENTICATED`                             |
| Employee role                         | 403  | `FORBIDDEN`                                   |
| Invalid period enum                   | 400  | `VALIDATION_ERROR`                            |
| CUSTOM without from/to                | 400  | `VALIDATION_ERROR`                            |
| End before start                      | 400  | `VALIDATION_ERROR`                            |
| Range > 366 days                      | 400  | `VALIDATION_ERROR`                            |
| Foreign company filter ID             | 404  | `NOT_FOUND`                                   |
| Unknown branch/employee ID in company | 404  | `NOT_FOUND`                                   |
| No data in range                      | 200  | Zero metrics (not an error)                   |
| Cross-company data                    | —    | Prevented by `companyId` in all where clauses |

---

## 11. Swagger Design

| Element          | Design                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Tag              | `Analytics`                                                                                                            |
| Paths            | Six GET resources under `/api/v1/analytics/*`                                                                          |
| Schemas          | `AnalyticsPeriod`, `AnalyticsFilterQuery`, `AppliedAnalyticsFilters`, `RankedMetricItem`, six dashboard response types |
| Reusable objects | `RankedMetricItem`, `AppliedAnalyticsFilters` shared across dashboards                                                 |
| Examples         | Company dashboard THIS_MONTH example in `analytics.openapi.ts`                                                         |
| Registration     | `analyticsOpenApiPaths` imported in `openapi.builder.ts`                                                               |

Mirror field names from [data-model.md](./data-model.md) and [contracts/openapi.yaml](./contracts/openapi.yaml).

---

## 12. Testing Strategy

Using Vitest and Supertest (P001 conventions).

| Layer                   | Focus                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Unit                    | `AnalyticsPeriodResolverService` presets; filter refinements; net operational math; ranking tie-break; authorization policy |
| Aggregation integration | `AnalyticsPrismaQueryRepository` against seeded DB — transaction amounts, trip counts, empty range                          |
| API                     | Each endpoint 200 shape; query param defaults                                                                               |
| Authorization           | Employee 403 on all six; Owner/Manager 200                                                                                  |
| Validation              | Invalid CUSTOM range; foreign filter IDs; max span                                                                          |
| Tenant isolation        | Company A cannot see Company B metrics                                                                                      |
| Large dataset           | Seed 1000+ transactions; assert response time budget in integration test (soft threshold)                                   |

Test layout:

```text
tests/unit/analytics/
tests/integration/analytics/
tests/api/analytics/
```

---

## 13. Acceptance Criteria (Engineering)

- [ ] All six GET endpoints registered and documented in OpenAPI
- [ ] No write routes or mutation code paths in analytics module
- [ ] Employee receives 403 on every analytics endpoint (automated)
- [ ] Company dashboard returns all nine KPI fields per SC-001
- [ ] Transaction dashboard returns all FR-002 fields including rankings
- [ ] Trip, expense, workforce, organization dashboards return all spec fields
- [ ] Shared filter produces consistent `appliedFilters` echo in responses
- [ ] Invalid custom date range returns 400 before repository call
- [ ] Empty period returns 200 with zeros (not 404/500)
- [ ] `includeArchived=false` excludes soft-deleted operational rows in integration test
- [ ] Cross-company filter ID rejected
- [ ] `pnpm lint`, `pnpm test:unit`, `pnpm test:api` pass for analytics tests
- [ ] `docs/api-reference.md` updated with Analytics section (implementation phase)

---

## 14. Future Extensibility

The read-only projection architecture supports future capabilities **without redesign**:

| Future capability  | Extension approach                                                  |
| ------------------ | ------------------------------------------------------------------- |
| Interactive charts | Clients consume same JSON; optional `granularity` query param       |
| Trend analysis     | Add time-bucket series to existing endpoints                        |
| Forecasting        | New read endpoints or `?projection=forecast` backed by new services |
| AI insights        | New `GET /analytics/insights` reading same query repository         |
| Scheduled reports  | Background job calls use cases; optional snapshot persistence table |
| Business KPIs      | `KpiGoal` reference table compared in assembler layer               |
| Caching            | Inject `AnalyticsCachePort` decorator around query repository       |

Core remains: **operational tables → AnalyticsQueryRepository → DTO → GET endpoint**.

---

## Phase Artifacts

| Artifact   | Path                                               | Status                   |
| ---------- | -------------------------------------------------- | ------------------------ |
| Research   | [research.md](./research.md)                       | ✅ Complete              |
| Data model | [data-model.md](./data-model.md)                   | ✅ Complete              |
| Contracts  | [contracts/openapi.yaml](./contracts/openapi.yaml) | ✅ Complete              |
| Quickstart | [quickstart.md](./quickstart.md)                   | ✅ Complete              |
| Tasks      | tasks.md                                           | Pending `/speckit-tasks` |
