# Quickstart: Reports (P009)

**Feature**: `009-reports`  
**Purpose**: Validate P009 operational reports end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

## Prerequisites

- P001–P008 operational modules migrated and seeded
- Owner and Manager accounts; at least one Employee account
- Sample data: transactions (multiple statuses), trips, payroll, attendance, branches,
  warehouses, vehicles
- P007 expenses optional (expense report returns empty when absent)

## Scenario 1: Owner Transaction Report

1. Authenticate as Owner.
2. `GET /api/v1/reports/transactions?from=2026-07-01T00:00:00.000Z&to=2026-07-31T23:59:59.999Z&page=1&limit=20`
3. Confirm each item includes transactionNumber, direction, status, party, assignedEmployees,
   location, items, grandTotal, settlement, createdBy, createdAt.
4. Confirm `meta.total` ≥ 1 and `appliedCriteria` echoes filters.

**Expected**: 200 with paginated rows.

## Scenario 2: Manager Export Payroll to Excel

1. Authenticate as Manager.
2. `GET /api/v1/reports/payroll/export?from=2026-07-01T00:00:00.000Z&to=2026-07-31T23:59:59.999Z&format=xlsx`
3. Confirm `Content-Type` is Excel MIME type and `Content-Disposition` attachment filename present.
4. Open file — headers match payroll report columns.

**Expected**: Download succeeds; row count matches list `total` when ≤ 10,000.

## Scenario 3: Search and Sort Transactions

1. `GET /api/v1/reports/transactions?from=...&to=...&search=Acme&sortBy=grandTotal&sortOrder=desc`
2. Confirm all rows match search (party or transaction number contains term).
3. Confirm amounts descending.

**Expected**: 200; search + sort applied.

## Scenario 4: Employee Denied

1. Authenticate as Employee.
2. `GET /api/v1/reports/transactions?from=...&to=...`
3. Expect `403 Forbidden`.

**Expected**: No report access for Employees.

## Scenario 5: Tenant Isolation

1. Owner Company A lists transactions.
2. Owner Company B requests report with Company A branchId.
3. Expect `404` for foreign filter ID; no cross-company rows.

**Expected**: Strict tenancy.

## Scenario 6: Invalid Date Range

1. `GET /api/v1/reports/transactions?from=2026-08-01&to=2026-07-01`
2. Expect `400` validation error.

**Expected**: Rejected before query.

## Scenario 7: Empty Range

1. `GET /api/v1/reports/transactions?from=2099-01-01&to=2099-01-31`
2. Expect `200` with `items: []`, `meta.total: 0`.

**Expected**: Empty is not an error.

## Scenario 8: Export Limit

1. Seed or mock > 10,000 matching rows (integration test).
2. `GET /api/v1/reports/transactions/export?from=...&to=...&format=csv`
3. Expect `422` export limit error.

**Expected**: No silent truncation.

## Scenario 9: PDF Print Layout

1. `GET /api/v1/reports/transactions/export?from=...&to=...&format=pdf&disposition=inline`
2. Confirm PDF opens with company name, date range, column headers, page numbers.

**Expected**: Printable layout per plan §5.

## Scenario 10: Archived Exclusion

1. Archive a transaction.
2. List without `includeArchived` — archived absent.
3. List with `includeArchived=true` — archived present.

**Expected**: Default excludes archived.

## Verification commands (post-implementation)

```bash
pnpm test:unit -- tests/unit/reports
pnpm test:api -- tests/api/reports
pnpm test:integration -- tests/integration/reports
pnpm lint && pnpm build
```

## API documentation

After implementation, add Reports section to `docs/api-reference.md` and verify Swagger tag
`Reports` lists all 22 endpoints.
