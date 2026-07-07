# Quickstart: Workforce Management

**Feature**: `004-workforce-management`  
**Purpose**: Validate P003 Workforce Management end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

## Prerequisites

- P001 Company and Identity Foundation running (Company, Owner, Manager, Employee with linked User)
- Employee profile has `weeklySalary` defined for payroll scenarios
- API available at `http://localhost:3000` (or Docker equivalent)
- Database migrated with AttendanceSession, LeaveRecord, CashAdvance, PayrollRecord models

## Validation Scenario 1: Employee Attendance Lifecycle

1. Authenticate as Employee with linked profile.
2. `GET /api/v1/workforce/attendance/status` — confirm `isTimedIn: false`.
3. `POST /api/v1/workforce/attendance/time-in` with optional note.
4. `GET /api/v1/workforce/attendance/status` — confirm `isTimedIn: true`.
5. `GET /api/v1/workforce/attendance` — confirm session appears in history.
6. `POST /api/v1/workforce/attendance/time-out`.
7. `GET /api/v1/workforce/attendance/status` — confirm `isTimedIn: false`.

**Expected**: Time In/Out lifecycle works; only one open session at a time.

## Validation Scenario 2: Attendance Conflict Rules

1. Time In as Employee.
2. Attempt second Time In — expect 409 conflict.
3. Time Out.
4. Attempt Time Out again — expect 409 conflict (no open session).

**Expected**: Double Time In and Time Out without session rejected.

## Validation Scenario 3: Leave Request and Management

1. Authenticate as Employee.
2. `POST /api/v1/workforce/leave` with `{ leaveType: "FULL_DAY", leaveDate: "2026-07-15" }`.
3. `GET /api/v1/workforce/leave` — confirm own leave record returned.
4. Attempt duplicate leave same date — expect 409 overlap conflict.
5. Authenticate as Manager.
6. `GET /api/v1/workforce/leave/company` — confirm company leave records visible.
7. `PATCH /api/v1/workforce/leave/{leaveId}` — update status to `APPROVED`.

**Expected**: Employee self-service leave; Manager company management.

## Validation Scenario 4: Cash Advances

1. Authenticate as Manager.
2. `POST /api/v1/workforce/cash-advances` with target `employeeId`, `amount`, optional reason.
3. `GET /api/v1/workforce/cash-advances/company` — confirm advance listed.
4. Authenticate as target Employee.
5. `GET /api/v1/workforce/cash-advances` — confirm only own advances returned.
6. Attempt create cash advance as Employee — expect 403.

**Expected**: Manager creates; Employee read-only own history.

## Validation Scenario 5: Weekly Payroll

1. Ensure Employee has outstanding cash advance and `weeklySalary` set.
2. Authenticate as Manager.
3. `POST /api/v1/workforce/payroll` with `{ payPeriodStart: "2026-07-07", payPeriodEnd: "2026-07-13" }`.
4. Confirm response includes gross, deductions, and net pay per employee.
5. `GET /api/v1/workforce/payroll/{payrollId}` — confirm details.
6. `POST /api/v1/workforce/payroll/{payrollId}/mark-paid`.
7. Attempt mark-paid again — expect 409 already paid conflict.
8. Authenticate as Employee — `GET /api/v1/workforce/payroll` returns only own lines.

**Expected**: Payroll generation, deduction math, and paid lifecycle enforced.

## Validation Scenario 6: Operational Dashboard

1. Authenticate as Employee (not timed in).
2. `GET /api/v1/workforce/dashboard`.
3. Confirm `visibility.canTimeOut: false`, `visibility.canCreateTransaction: false`.
4. Time In.
5. `GET /api/v1/workforce/dashboard` — confirm `canTimeOut: true`, operational flags updated.
6. Time Out — confirm creation flags hidden again.

**Expected**: Dashboard visibility reflects attendance readiness.

## Validation Scenario 7: Tenant Isolation and Authorization

1. Create workforce records in Company A.
2. Authenticate as user from Company B.
3. Attempt access to Company A attendance, leave, cash advance, or payroll IDs.

**Expected**: 403 or 404; no cross-company data leakage.

## Validation Scenario 8: Archived Employee

1. Archive an Employee via P001 employee archive.
2. Attempt Time In as that Employee — expect rejection.

**Expected**: Archived employees cannot open attendance sessions.

## Acceptance Checklist

- [ ] Attendance Time In/Out/status/history endpoints work
- [ ] Company attendance list and manage (Manager/Owner) work
- [ ] Leave request, history, company list, and manage work
- [ ] Cash advance create (Manager) and scoped list work
- [ ] Payroll generate, history, detail, mark-paid work
- [ ] Dashboard reflects readiness visibility rules
- [ ] Cross-company access rejected
- [ ] Role-based authorization enforced
- [ ] OpenAPI docs reflect all 18 workforce endpoints
- [ ] All tests pass (`pnpm test`)
