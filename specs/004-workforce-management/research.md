# Research: Workforce Management

**Feature**: `004-workforce-management`  
**Date**: 2026-07-07

## 1. Module decomposition strategy

**Decision**: Implement four workforce domain modules (`attendance`, `leave`, `cash-advance`, `payroll`)
plus a read-only `workforce-dashboard` module, all under the `/api/v1/workforce` route namespace.

**Rationale**: Attendance, leave, cash advances, and payroll have distinct lifecycles and validation
rules but share tenant scoping and employee linkage patterns from P001. Separating modules matches
P002 organization patterns while keeping payroll deduction logic isolated from attendance sessions.

**Alternatives considered**:

- Single monolithic `workforce` module — rejected due to mixed concerns and large policy surface.
- One module per endpoint group without shared workforce primitives — rejected; operational
  readiness and dashboard aggregation need shared services.

## 2. Employee context resolution

**Decision**: Workforce mutations for Employees resolve the target `employeeId` from the
authenticated User's linked Employee profile (`User.employeeId` / `Employee.userId`). Managers and
Owners act on explicit `employeeId` parameters when managing other Employees.

**Rationale**: P001 establishes User and Employee as separate models with optional linkage. Time
In/Out must apply to the acting Employee, not arbitrary IDs from Employees.

**Alternatives considered**:

- Accept `employeeId` on every Employee self-service call — rejected; enables impersonation mistakes.
- Require Employee role only for self-service — accepted; Managers without linked profiles use
  company-scoped management endpoints only.

## 3. Attendance session model

**Decision**: One open attendance session per Employee at a time. `timeInAt` set on Time In;
`timeOutAt` set on Time Out; status `OPEN` | `CLOSED`. Archived Employees cannot open sessions.

**Rationale**: Matches product rule that operational readiness is binary per employee until Time Out.

**Alternatives considered**:

- Multiple concurrent sessions — rejected by business rules.
- Daily auto-close at midnight — deferred; manual Time Out required in P003.

## 4. Operational readiness export

**Decision**: Extend shared workforce primitives in `src/shared/workforce/operational-readiness.ts`
with `isOperationallyReady(attendanceSession)` consumed by dashboard and future Transaction/Expense
modules.

**Rationale**: Centralizes readiness logic established conceptually in P003 spec for reuse without
coupling future modules to attendance repositories.

**Alternatives considered**:

- Inline checks in dashboard only — rejected; future modules need the same rule.

## 5. Leave overlap policy

**Decision**: Reject new leave requests that overlap an existing non-cancelled leave record for the
same Employee on the same calendar date. Managers may update status via PATCH to resolve conflicts.

**Rationale**: Spec requires overlap rejection; Manager override handled through manage endpoint.

**Alternatives considered**:

- Allow multiple half-day leaves same day — rejected for P003 simplicity.

## 6. Cash advance deduction model

**Decision**: Cash advances track `amount`, `deductedAmount`, and `remainingAmount`. Payroll
generation applies deductions up to remaining advance balance capped by gross weekly salary. Marking
payroll paid updates advance balances.

**Rationale**: Supports partial deduction across pay periods and prevents negative net pay.

**Alternatives considered**:

- Full deduction in single payroll only — rejected when advance exceeds weekly salary.

## 7. Payroll generation granularity

**Decision**: Generate one `PayrollRecord` per active Employee per pay period with unique constraint
on `(companyId, employeeId, payPeriodStart)`. Batch response groups records for the same generation
request.

**Rationale**: Simplifies history queries and mark-paid operations per employee line.

**Alternatives considered**:

- Single batch header table only — rejected; employees need individual paid status and amounts.

## 8. Pay period definition

**Decision**: Weekly pay periods are inclusive date ranges (`payPeriodStart`, `payPeriodEnd`) with
validation that the range spans exactly seven days, defaulting to Monday–Sunday when clients omit
custom boundaries.

**Rationale**: Aligns with spec assumption and Employee `weeklySalary` semantics from P001.

**Alternatives considered**:

- Rolling 7-day windows from generation time — rejected for payroll audit clarity.

## 9. Dashboard as read model

**Decision**: Dashboard endpoint composes attendance status, recent history summaries, leave/cash
advance/payroll snippets, and visibility flags. Trip/transaction sections return empty collections
until future modules exist.

**Rationale**: Spec allows placeholder summaries while enforcing visibility rules now.

**Alternatives considered**:

- Persisted dashboard snapshot table — rejected as unnecessary for P003.

## 10. Authorization matrix

**Decision**: Reuse P001 `authorize()` middleware. Employee role: self-service attendance, leave
request, own history reads, dashboard. Manager/Owner: company-scoped list/manage endpoints and
payroll/cash-advance creation.

**Rationale**: Consistent with P002 organization resource authorization patterns.

**Alternatives considered**:

- Fine-grained permission codes — deferred until product requires sub-manager roles.
