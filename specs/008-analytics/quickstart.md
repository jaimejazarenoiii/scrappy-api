# Quickstart: Analytics (P008)

**Feature**: `008-analytics`  
**Purpose**: Validate P008 analytics dashboards end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

## Prerequisites

- P001–P007 operational modules migrated and seeded
- Owner and Manager accounts; at least one Employee account
- Sample data: transactions (inbound/outbound), trips, payroll, attendance, branches, warehouses,
  vehicles
- P007 expenses optional (expense dashboard returns zeros when absent)

## Scenario 1: Owner Company Dashboard (This Month)

1. Authenticate as Owner.
2. `GET /api/v1/analytics/company?period=THIS_MONTH`
3. Confirm response includes all nine KPI fields and `appliedFilters`.
4. Verify `netOperationalAmount = totalTransactionAmount - totalExpenses - totalPayroll`.

**Expected**: 200 with populated metrics; live active counts present.

## Scenario 2: Manager Transaction Analytics

1. Authenticate as Manager.
2. `GET /api/v1/analytics/transactions?period=THIS_WEEK&branchId={branchId}`
3. Confirm inbound/outbound counts, amounts, average, and ranked lists.
4. Repeat without `branchId` — totals should be greater than or equal to filtered totals.

**Expected**: Manager can access transaction analytics (per spec FR-011).

## Scenario 3: Custom Date Range Validation

1. As Owner, `GET /api/v1/analytics/company?period=CUSTOM&from=2026-07-01&to=2026-06-01`
2. Expect `400` validation error (end before start).
3. Valid custom range returns `200`.

**Expected**: Invalid ranges rejected before aggregation.

## Scenario 4: Employee Denied

1. Authenticate as Employee.
2. `GET /api/v1/analytics/company?period=TODAY`
3. Expect `403 Forbidden`.

**Expected**: No analytics access for Employees.

## Scenario 5: Tenant Isolation

1. Owner Company A requests analytics.
2. Owner Company B token requests same filter IDs from Company A.
3. Expect `404` or validation failure for foreign branch/employee IDs; no cross-company metrics.

**Expected**: Strict company tenancy.

## Scenario 6: Empty Range

1. `GET /api/v1/analytics/transactions?period=CUSTOM&from=2099-01-01&to=2099-01-31`
2. Expect `200` with zero counts and empty ranked arrays.

**Expected**: Empty data is not an error.

## Scenario 7: Trip and Organization Dashboards

1. `GET /api/v1/analytics/trips?period=THIS_MONTH`
2. `GET /api/v1/analytics/organization?period=THIS_MONTH`
3. Confirm trip status counts, utilization lists, branch/warehouse performance.

**Expected**: All required fields present per contract.

## Scenario 8: Workforce and Expense Dashboards

1. `GET /api/v1/analytics/workforce?period=THIS_MONTH`
2. `GET /api/v1/analytics/expenses?period=THIS_MONTH`
3. Workforce summaries populated from attendance/payroll/leave/cash advance.
4. Expense totals zero or populated depending on P007 data.

**Expected**: Contracts stable regardless of expense data presence.

## Scenario 9: Include Archived

1. Archive a transaction or trip.
2. Default analytics excludes archived activity.
3. `includeArchived=true` includes archived records where applicable.

**Expected**: Archived exclusion default; opt-in inclusion works.

## Run tests

```bash
pnpm test:api -- tests/api/analytics
pnpm test:integration -- tests/integration/analytics
pnpm test:unit -- tests/unit/analytics
```
