# Data Model: Analytics (P008)

**Feature**: `008-analytics`  
**Depends on**: P001–P007 operational models (read-only projections; **no new persisted entities**)

## Overview

Analytics does **not** introduce database tables or aggregate roots. It defines **read projections**,
**filter value objects**, and **response DTO shapes** computed from existing operational data at
request time.

```text
Operational Tables (existing)          Analytics Layer (ephemeral)
─────────────────────────────          ───────────────────────────
Company, Branch, Warehouse, Vehicle    AnalyticsFilter (request scope)
Employee, Transaction, TransactionItem AnalyticsPeriodBounds (resolved)
Trip, TripMember                       CompanyAnalyticsResponse (DTO)
Attendance, Leave, CashAdvance         TransactionAnalyticsResponse (DTO)
PayrollRecord                          TripAnalyticsResponse (DTO)
Expense (P007 — when available)        ExpenseAnalyticsResponse (DTO)
                                       WorkforceAnalyticsResponse (DTO)
                                       OrganizationAnalyticsResponse (DTO)
```

## AnalyticsFilter (Value Object)

**Purpose**: Canonical filter scope applied consistently across dashboards.

| Field           | Type     | Source       | Notes                  |
| --------------- | -------- | ------------ | ---------------------- |
| companyId       | UUID     | Auth context | Never from client body |
| period          | enum     | Query        | Preset or CUSTOM       |
| from            | datetime | Resolved     | Inclusive start bound  |
| to              | datetime | Resolved     | Inclusive end bound    |
| branchId        | UUID?    | Query        | Optional               |
| warehouseId     | UUID?    | Query        | Optional               |
| vehicleId       | UUID?    | Query        | Optional               |
| employeeId      | UUID?    | Query        | Optional               |
| includeArchived | boolean  | Query        | Default false          |
| rankingLimit    | integer  | Query        | Default 10, max 25     |

### Validation rules

- `companyId` required (from session).
- Custom period requires `from` and `to`; `to >= from`.
- Max span: 366 days.
- Filter IDs validated against company tenancy before query execution.
- Archived exclusion: operational rows with `deletedAt IS NOT NULL` omitted unless
  `includeArchived=true`.

## AnalyticsPeriodBounds (Value Object)

**Purpose**: Output of `AnalyticsPeriodResolverService`.

| Preset     | Resolution (UTC)                                                 |
| ---------- | ---------------------------------------------------------------- |
| TODAY      | Start/end of current UTC day                                     |
| YESTERDAY  | Previous UTC day                                                 |
| THIS_WEEK  | Monday 00:00 UTC through Sunday 23:59:59.999 UTC of current week |
| THIS_MONTH | First through last instant of current UTC month                  |
| THIS_YEAR  | Jan 1 through Dec 31 current UTC year                            |
| CUSTOM     | Client `from`/`to` after validation                              |

## RankedMetricItem (Projection)

**Purpose**: Standard shape for top/most-active lists.

| Field | Type    | Notes                                                     |
| ----- | ------- | --------------------------------------------------------- |
| id    | UUID?   | Entity id when applicable                                 |
| label | string  | Display name (material, employee name, branch name, etc.) |
| value | number  | Primary measure (count, amount, hours, etc.)              |
| unit  | string? | Optional unit hint (`PHP`, `count`, `minutes`)            |
| rank  | integer | 1-based position                                          |

## CompanyAnalyticsResponse (DTO)

| Field                     | Type     | Metric type | Source / rule                                           |
| ------------------------- | -------- | ----------- | ------------------------------------------------------- |
| totalInboundTransactions  | integer  | Period      | Count `direction=INBOUND`, not cancelled                |
| totalOutboundTransactions | integer  | Period      | Count `direction=OUTBOUND`, not cancelled               |
| totalTransactionAmount    | decimal  | Period      | Sum item totals for in-scope transactions               |
| totalExpenses             | decimal  | Period      | Sum expense amounts (P007); 0 if none                   |
| totalPayroll              | decimal  | Period      | Sum `PayrollRecord.netPay` overlapping period           |
| netOperationalAmount      | decimal  | Period      | `totalTransactionAmount - totalExpenses - totalPayroll` |
| activeEmployees           | integer  | Live        | `Employee.status=ACTIVE`, not archived                  |
| activeTrips               | integer  | Live        | `Trip.status=STARTED`, not archived                     |
| activeVehicles            | integer  | Live        | `Vehicle.status IN (AVAILABLE, IN_USE)`, not archived   |
| appliedFilters            | object   | Meta        | Echo resolved filter for clients                        |
| generatedAt               | datetime | Meta        | Response timestamp                                      |

## TransactionAnalyticsResponse (DTO)

| Field                   | Type               | Notes                             |
| ----------------------- | ------------------ | --------------------------------- |
| totalInbound            | integer            | Period count                      |
| totalOutbound           | integer            | Period count                      |
| totalTransactionAmount  | decimal            | Sum item totals                   |
| transactionCount        | integer            | Non-cancelled in scope            |
| averageTransactionValue | decimal            | Amount / count; 0 if count 0      |
| topMaterials            | RankedMetricItem[] | By summed item `total` DESC       |
| mostActiveEmployees     | RankedMetricItem[] | By assignment participation count |
| mostActiveBranches      | RankedMetricItem[] | By transaction count at branch    |
| mostActiveWarehouses    | RankedMetricItem[] | By transaction count at warehouse |
| appliedFilters          | object             |                                   |
| generatedAt             | datetime           |                                   |

### Transaction scope rules

- Date field: `Transaction.transactionDate`.
- Exclude `status = CANCELLED`.
- Branch filter: `branchId` match when `locationType` uses branch.
- Warehouse filter: `warehouseId` match when applicable.
- Employee filter: transaction has assignment for employee.
- Vehicle filter: transaction `tripId` links to trip with `vehicleId`.

## TripAnalyticsResponse (DTO)

| Field               | Type               | Notes                                                              |
| ------------------- | ------------------ | ------------------------------------------------------------------ |
| totalTrips          | integer            | Trips with `scheduledStart` in range                               |
| activeTrips         | integer            | Live `STARTED` count                                               |
| completedTrips      | integer            | `status=COMPLETED` with `actualEnd` in range                       |
| cancelledTrips      | integer            | `status=CANCELLED` with cancel timestamp in range                  |
| averageTripDuration | number             | Minutes; avg of `(actualEnd - actualStart)` for completed in range |
| vehicleUtilization  | object[]           | Per vehicle: trip count or % active time in range                  |
| mostActiveVehicles  | RankedMetricItem[] | By trip count                                                      |
| mostActiveDrivers   | RankedMetricItem[] | Trip members with role DRIVER by trip count                        |
| appliedFilters      | object             |                                                                    |
| generatedAt         | datetime           |                                                                    |

## ExpenseAnalyticsResponse (DTO)

| Field               | Type               | Notes                                            |
| ------------------- | ------------------ | ------------------------------------------------ |
| totalExpenses       | decimal            | Sum in range (P007)                              |
| expensesByCategory  | RankedMetricItem[] | Group by expense category                        |
| expensesByBranch    | RankedMetricItem[] | Group by branch dimension                        |
| expensesByWarehouse | RankedMetricItem[] | Group by warehouse dimension                     |
| expensesByVehicle   | RankedMetricItem[] | Group by vehicle dimension                       |
| expensesByTrip      | RankedMetricItem[] | Group by trip dimension                          |
| monthlyExpenseTrend | object[]           | `{ month: YYYY-MM, amount }[]` bucketed in range |
| appliedFilters      | object             |                                                  |
| generatedAt         | datetime           |                                                  |

**P007 placeholder**: When Expense table absent, all amounts zero and lists empty.

## WorkforceAnalyticsResponse (DTO)

| Field               | Type               | Notes                                                         |
| ------------------- | ------------------ | ------------------------------------------------------------- |
| attendanceSummary   | object             | `{ sessionsCount, totalHours, openSessions }` in range        |
| payrollSummary      | object             | `{ recordsCount, totalNetPay, totalGross }` overlapping range |
| leaveSummary        | object             | `{ approvedDays, pendingCount, rejectedCount }`               |
| cashAdvanceSummary  | object             | `{ outstandingTotal, advancesCount, deductedTotal }`          |
| employeeActivity    | object[]           | Per-employee activity score in range                          |
| mostActiveEmployees | RankedMetricItem[] | By composite activity (transactions + trips + attendance)     |
| appliedFilters      | object             |                                                               |
| generatedAt         | datetime           |                                                               |

## OrganizationAnalyticsResponse (DTO)

| Field                | Type     | Notes                                                |
| -------------------- | -------- | ---------------------------------------------------- |
| branchPerformance    | object[] | Per branch: transaction count, amount, expense share |
| warehousePerformance | object[] | Per warehouse: transaction count, amount             |
| vehicleUtilization   | object[] | Per vehicle: trip count, in-use ratio in range       |
| appliedFilters       | object   |                                                      |
| generatedAt          | datetime |                                                      |

## AnalyticsQueryRepository (Domain Port)

Read-only interface; implemented in infrastructure.

```text
getCompanyMetrics(filter): CompanyMetricsProjection
getTransactionMetrics(filter): TransactionMetricsProjection
getTripMetrics(filter): TripMetricsProjection
getExpenseMetrics(filter): ExpenseMetricsProjection
getWorkforceMetrics(filter): WorkforceMetricsProjection
getOrganizationMetrics(filter): OrganizationMetricsProjection
validateFilterReferences(filter): Promise<void>  // tenancy checks
```

No `save`, `update`, or `delete` methods.

## Source module date fields

| Module      | Primary date for period filter                                                |
| ----------- | ----------------------------------------------------------------------------- |
| Transaction | `transactionDate`                                                             |
| Trip        | `scheduledStart` (counts); `actualEnd` (completed); live status ignores range |
| Payroll     | Overlap with `payPeriodStart`/`payPeriodEnd`                                  |
| Attendance  | `timeInAt`                                                                    |
| Leave       | `leaveDate`                                                                   |
| CashAdvance | `createdAt`                                                                   |
| Expense     | `expenseDate` (P007 assumed)                                                  |

## Future extensibility (no P008 schema)

- Materialized `AnalyticsSnapshot` table for scheduled reports
- `KpiGoal` reference table for target comparisons
- Time-series cache keyed by `(companyId, metric, period)`

None required for P008.
