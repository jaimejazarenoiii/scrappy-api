# Quickstart: Expense Management (P007)

**Feature**: `010-expense-management`  
**Purpose**: Validate P007 expense workflow end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

## Prerequisites

- P001–P006 implemented and migrated
- P008/P009 present (expense report/analytics stubs will populate after P007)
- Seed data: `pnpm run db:seed` (owner, manager, employee accounts)
- At least one Started or Completed trip for trip-context scenarios
- Employee timed in for employee create scenarios

## Scenario 1: Employee Creates Draft Expense

1. Authenticate as timed-in Employee (`employee1@example.com`).
2. `POST /api/v1/expenses` with `expenseDate`, `category`, `amount`, `description`, `contextType: COMPANY`.
3. Confirm `status: DRAFT`, `expenseNumber` matches `EXP-{YYYYMMDD}-{sequence}`.
4. `GET /api/v1/expenses/mine` — expense appears.
5. Sign out; authenticate as different Employee — `GET /api/v1/expenses/{id}` — expect 403.

**Expected**: Expense Number assigned at creation; employee sees own expense only.

## Scenario 2: Timed-In Gate

1. Authenticate as Employee **not** timed in.
2. `POST /api/v1/expenses` — expect 409 `BUSINESS_RULE_VIOLATION` (must be timed in).
3. Authenticate as Manager (no timed-in required) — `POST /api/v1/expenses` — expect 201.

**Expected**: Workforce gate enforced for Employees only.

## Scenario 3: Attach Receipt and Record

1. As Employee (timed in), create Draft expense.
2. `POST /api/v1/expenses/{expenseId}/attachments` with multipart `file` (JPEG receipt).
3. `POST /api/v1/expenses/{expenseId}/record`.
4. Confirm `status: RECORDED`, `recordedAt` set.
5. `PATCH /api/v1/expenses/{expenseId}` as Employee — expect 409 (read-only for employee).

**Expected**: Employee can finalize own draft; Recorded is employee read-only.

## Scenario 4: Manager Company List and Edit

1. Authenticate as Manager.
2. `GET /api/v1/expenses?page=1&limit=10&sortBy=expenseDate&sortOrder=desc` — expect 200 with rows.
3. `PATCH /api/v1/expenses/{expenseId}` — update `category` on Recorded expense — expect 200.
4. `GET /api/v1/reports/expenses?from=...&to=...` — expect non-empty `items` when Recorded expenses exist in range.

**Expected**: Frontend list endpoint live; reports consume Recorded data.

## Scenario 5: Trip Context Rules

1. Create expense with `contextType: TRIP`, `tripId` of a **Started** trip — expect 201.
2. Repeat with **Completed** trip — expect 201.
3. Repeat with **Draft** trip — expect 409.
4. Repeat with **Cancelled** trip — expect 409.

**Expected**: Trip eligibility matches P006 rules.

## Scenario 6: Branch Context Validation

1. `POST /api/v1/expenses` with `contextType: BRANCH` and valid `branchId` — expect 201.
2. `POST` with `contextType: BRANCH` but also `vehicleId` set — expect 400 validation error.
3. `POST` with `contextType: COMPANY` and any FK set — expect 400.

**Expected**: Mutually exclusive context enforced.

## Scenario 7: Cancel and Archive

1. As Manager, `POST /api/v1/expenses/{expenseId}/cancel` with `{ "reason": "Duplicate entry" }`.
2. Confirm `status: CANCELLED`.
3. `PATCH /api/v1/expenses/{expenseId}` — expect 409.
4. On another Recorded expense, `POST /api/v1/expenses/{expenseId}/archive`.
5. `GET /api/v1/expenses` — archived expense excluded; `includeArchived=true` includes it.

**Expected**: Cancelled immutable; archive soft-hides.

## Scenario 8: Search by Expense Number

1. `GET /api/v1/expenses/by-number/{expenseNumber}` — exact match.
2. `GET /api/v1/expenses?expenseNumber=EXP-2026` — partial filter as Manager.
3. Cross-company token — expect 404.

**Expected**: Lookup within tenant scope.

## Scenario 9: Authorization Matrix

1. Employee `GET /api/v1/expenses` (company list) — expect 403.
2. Employee `POST /api/v1/expenses/{id}/archive` — expect 403.
3. Owner full access — all operations succeed per matrix.

**Expected**: Role enforcement matches plan authorization matrix.

## Scenario 10: Analytics Integration

1. Record at least one expense in the current month.
2. `GET /api/v1/analytics/expenses?period=THIS_MONTH` as Manager.
3. Confirm `totalExpenses > 0` (was zero before P007).

**Expected**: P008 expense dashboard populated from operational data.
