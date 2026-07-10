# Research: Expense Management (P007)

**Feature**: `010-expense-management`  
**Date**: 2026-07-09

## 1. Bounded context placement

**Decision**: Implement a new top-level `expense` module under `src/modules/expense/` following the
same Clean Architecture layout as `transaction`, `trip`, and `cash-advance`.

**Rationale**: Expense is an aggregate root with its own lifecycle, numbering, context rules, and
attachment collection. It is independent from Transactions. A dedicated module keeps operational
cost capture localized and matches P004/P006 modular boundaries.

**Alternatives considered**:

- Embed expenses inside `trip` module — rejected; expenses may reference Branch, Warehouse,
  Vehicle, or Company without a trip.
- Embed expenses inside `transaction` module — rejected; product spec explicitly decouples expenses
  from transactions.

## 2. Aggregate composition

**Decision**: `Expense` is the aggregate root; `ExpenseAttachment` is a child entity within the same
aggregate. Attachments are created/updated/deleted only through expense operations while the expense
is editable per lifecycle rules.

**Rationale**: Attachments have no standalone business meaning without a parent expense. Attachment
invariants (orphan prevention, parent status gates) are expense-level concerns.

**Alternatives considered**:

- ExpenseAttachment as separate aggregate — rejected; no independent lifecycle.

## 3. Expense Number generation

**Decision**: Mirror P005 `TransactionNumberSequence` and P006 `TripNumberSequence` with
`ExpenseNumberSequence` keyed by `(companyId, sequenceDate)` where `sequenceDate` is UTC calendar
date at expense creation. Format: `EXP-{YYYYMMDD}-{000001}`. Assign synchronously in
`CreateExpenseUseCase` inside the same DB transaction as expense insert.

**Rationale**: Established Scrappy pattern; atomic sequence prevents duplicates under concurrent
creates; date embedded in number aids operator readability and report search.

**Alternatives considered**:

- UUID-based expense codes — rejected; product spec mandates `EXP-YYYYMMDD-000001`.
- Application-level max+1 without lock — rejected; race under concurrency.

## 4. Expense context (single reference)

**Decision**: Persist `contextType` enum (`COMPANY`, `BRANCH`, `WAREHOUSE`, `VEHICLE`, `TRIP`) with
nullable FK columns (`branchId`, `warehouseId`, `vehicleId`, `tripId`). Only the column matching
`contextType` may be non-null. `COMPANY` requires all FK columns null.

**Rationale**: Mirrors `Transaction.locationType` + conditional FK pattern from P004; supports
indexed filters for analytics/reports dimensional breakdowns without JSON blobs.

**Alternatives considered**:

- Polymorphic `referenceId` + `referenceType` only — rejected; loses typed FK constraints and
  complicates Prisma relations.
- Multiple optional FKs without enum guard — rejected; allows invalid multi-reference rows.

## 5. Trip context eligibility

**Decision**: Expense module injects `TripRepository` (read-only) and reuses
`TripEligibilityService.assertTripAcceptsExpense(trip)` from the `trip` module (already stubbed for
`STARTED` and `COMPLETED`; extend to reject `DRAFT` and `CANCELLED` explicitly).

**Rationale**: Trip lifecycle authority remains in P006; expense module validates references without
mutating trips.

## 6. Timed-in gate for Employees

**Decision**: `CreateExpenseUseCase` injects `AttendanceRepository.findOpenSession(employeeId,
companyId)` and reuses P003 operational readiness helpers (`assertOperationallyReady`,
`isOperationallyReadyForRole`) — same pattern as `create-transaction.use-case.ts`. Managers and
Owners skip timed-in requirement.

**Rationale**: Consistent workforce gate; no new attendance rules.

## 7. Attachment storage

**Decision**: Reuse the `FileStorage` port and `LocalFileStorage` implementation from the
transaction module via DI container wiring. Expense attachments stored under a dedicated namespace
prefix (e.g. `expenses/{expenseId}/`). MVP `attachmentType` enum value `PHOTO` only; schema reserves
enum extension for future document types.

**Rationale**: Avoid duplicating file I/O infrastructure; transaction module already proves multipart
upload, size limits, and content retrieval patterns.

**Alternatives considered**:

- Extract `FileStorage` to `src/shared/file-storage/` immediately — deferred to implementation if
  cross-module import feels awkward; container can wire concrete class to both modules.

## 8. Creator identity

**Decision**: Persist `createdByUserId` (required) and `createdByEmployeeId` (nullable — set when
caller has linked employee profile). Employee "own expense" checks and `GET /expenses/mine` filter by
`createdByUserId` for Employees; Managers filter company list by optional `employeeId` via
`createdByEmployeeId`.

**Rationale**: Matches auth model (User is security principal); `createdByEmployeeId` supports
workforce/report filters without joining User→Employee on every list query.

## 9. Analytics and Reports integration

**Decision**: Extend existing P008/P009 read repositories only — no new endpoints in expense module
for analytics/reports.

| Consumer    | Change                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `reports`   | Replace `isExpenseModelAvailable()` stubs in `ReportsPrismaQueryRepository` with Prisma queries against `Expense` |
| `analytics` | Replace zero stubs in `AnalyticsPrismaQueryRepository` expense methods                                            |

Filter semantics: default report/analytics views include `status = RECORDED` and `deletedAt IS NULL`;
optional flags may include Draft/Cancelled for audit when product requires.

**Rationale**: P008/P009 contracts already defined; P007 populates operational source data.

## 10. Category field (MVP)

**Decision**: `category` is a required validated string (max 200 chars) on Expense. No category
catalog table in P007.

**Rationale**: Product spec defers category management; free-form text unblocks MVP and reports.

## 11. Record vs Submit terminology

**Decision**: API action named `record` (`POST /expenses/{id}/record`) mapping Draft → Recorded.
No separate "submit for approval" state in MVP.

**Rationale**: Aligns with product spec lifecycle and keeps state machine minimal.

## 12. Archive semantics

**Decision**: `deletedAt` soft-archive on `POST /expenses/{id}/archive` for `RECORDED` or
`CANCELLED` expenses only. Archive does not change `status`.

**Rationale**: Consistent with Trip and Transaction archive patterns; Cancelled remains auditable
before archive.

## 13. Monetary amount storage

**Decision**: Store `amount` as `Decimal` in Prisma (same as Transaction items and CashAdvance).

**Rationale**: Avoid floating-point errors; established project convention.

## 14. OpenAPI and validation placement

**Decision**: Zod schemas in `expense.schemas.ts`; OpenAPI in `expense.openapi.ts` + shared
components in `common-schemas.ts` (ExpenseStatus, ExpenseContextType, ExpenseNumber, ExpenseSummary,
ExpenseDetail, ExpenseAttachment).

**Rationale**: P001–P006 convention unchanged.
