# Data Model: Workforce Management

**Feature**: `004-workforce-management`  
**Date**: 2026-07-07

## Overview

P003 introduces workforce operational records scoped to Company and Employee from P001. All
workforce entities carry `companyId` for tenant isolation and `employeeId` for workforce ownership.
Attendance sessions gate operational readiness; leave, cash advances, and payroll extend employee
lifecycle without redefining Employee identity.

## Base Workforce Pattern

All workforce records share:

| Field     | Type     | Required | Notes                               |
| --------- | -------- | -------- | ----------------------------------- |
| id        | UUID     | Yes      | Primary identifier                  |
| companyId | UUID     | Yes      | Mandatory tenant boundary from P001 |
| createdAt | datetime | Yes      | Audit timestamp                     |
| updatedAt | datetime | Yes      | Audit timestamp                     |

Employee-scoped records additionally require `employeeId` (FK → Employee).

---

## AttendanceSession

**Purpose**: A timed work period for one Employee with Time In/Time Out and operational status.

| Field             | Type     | Required | Default   | Nullable | Notes                         |
| ----------------- | -------- | -------- | --------- | -------- | ----------------------------- |
| id                | UUID     | Yes      | generated | No       | Primary key                   |
| companyId         | UUID     | Yes      | —         | No       | FK → Company                  |
| employeeId        | UUID     | Yes      | —         | No       | FK → Employee                 |
| status            | enum     | Yes      | `OPEN`    | No       | `OPEN`, `CLOSED`              |
| timeInAt          | datetime | Yes      | now       | No       | Session start                 |
| timeOutAt         | datetime | No       | null      | Yes      | Session end when closed       |
| note              | string   | No       | null      | Yes      | Optional employee note        |
| correctionNote    | string   | No       | null      | Yes      | Manager correction annotation |
| adjustedTimeInAt  | datetime | No       | null      | Yes      | Manager-adjusted start        |
| adjustedTimeOutAt | datetime | No       | null      | Yes      | Manager-adjusted end          |
| createdByUserId   | UUID     | No       | null      | Yes      | Audit                         |
| updatedByUserId   | UUID     | No       | null      | Yes      | Audit                         |
| createdAt         | datetime | Yes      | now       | No       | Audit                         |
| updatedAt         | datetime | Yes      | now       | No       | Audit                         |

**Relationships**:

- Many AttendanceSessions belong to one Employee
- Many AttendanceSessions belong to one Company
- Future: Transactions may reference active attendance session (not in P003)

**Cardinality**: Employee 1 → N AttendanceSessions; Company 1 → N AttendanceSessions

**Indexes**:

- Primary: `id`
- Index: `(companyId, employeeId, status)` — find open session
- Index: `(companyId, employeeId, timeInAt)` — history queries
- Index: `(companyId, timeInAt)` — company-wide attendance lists

**Constraints**:

- At most one `OPEN` session per Employee (enforced in application layer + partial unique index
  where feasible)
- `timeOutAt` MUST be after `timeInAt` when set
- Archived Employees (`Employee.deletedAt IS NOT NULL` or `status != ACTIVE`) cannot open sessions

**State transitions**:

```text
[no open session] --Time In--> OPEN --Time Out--> CLOSED
```

---

## LeaveRecord

**Purpose**: Half Day or Full Day leave request for one Employee.

| Field           | Type     | Required | Default   | Nullable | Notes                                          |
| --------------- | -------- | -------- | --------- | -------- | ---------------------------------------------- |
| id              | UUID     | Yes      | generated | No       | Primary key                                    |
| companyId       | UUID     | Yes      | —         | No       | FK → Company                                   |
| employeeId      | UUID     | Yes      | —         | No       | FK → Employee                                  |
| leaveType       | enum     | Yes      | —         | No       | `HALF_DAY`, `FULL_DAY`                         |
| leaveDate       | date     | Yes      | —         | No       | Calendar date of leave                         |
| status          | enum     | Yes      | `PENDING` | No       | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| reason          | string   | No       | null      | Yes      | Optional employee reason                       |
| managerNote     | string   | No       | null      | Yes      | Manager annotation on manage                   |
| createdByUserId | UUID     | No       | null      | Yes      | Audit                                          |
| updatedByUserId | UUID     | No       | null      | Yes      | Audit                                          |
| createdAt       | datetime | Yes      | now       | No       | Audit                                          |
| updatedAt       | datetime | Yes      | now       | No       | Audit                                          |

**Relationships**:

- Many LeaveRecords belong to one Employee
- Many LeaveRecords belong to one Company

**Cardinality**: Employee 1 → N LeaveRecords

**Indexes**:

- Primary: `id`
- Index: `(companyId, employeeId, leaveDate)`
- Index: `(companyId, status)`
- Unique (application): no overlapping non-cancelled leave on same `(employeeId, leaveDate)`

**Constraints**:

- `leaveType` MUST be `HALF_DAY` or `FULL_DAY`
- Overlapping leave for same Employee on same date rejected unless Manager overrides via PATCH
- `reason` max length enforced at validation boundary

---

## CashAdvance

**Purpose**: Monetary advance issued to an Employee, tracked for payroll deduction.

| Field           | Type     | Required | Default       | Nullable | Notes                     |
| --------------- | -------- | -------- | ------------- | -------- | ------------------------- |
| id              | UUID     | Yes      | generated     | No       | Primary key               |
| companyId       | UUID     | Yes      | —             | No       | FK → Company              |
| employeeId      | UUID     | Yes      | —             | No       | FK → Employee             |
| amount          | decimal  | Yes      | —             | No       | Original advance amount   |
| deductedAmount  | decimal  | Yes      | `0`           | No       | Amount already deducted   |
| remainingAmount | decimal  | Yes      | `amount`      | No       | Balance remaining         |
| status          | enum     | Yes      | `OUTSTANDING` | No       | `OUTSTANDING`, `SETTLED`  |
| reason          | string   | No       | null          | Yes      | Optional reference        |
| createdByUserId | UUID     | No       | null          | Yes      | Manager/Owner who created |
| createdAt       | datetime | Yes      | now           | No       | Audit                     |
| updatedAt       | datetime | Yes      | now           | No       | Audit                     |

**Relationships**:

- Many CashAdvances belong to one Employee
- Payroll generation references outstanding advances

**Cardinality**: Employee 1 → N CashAdvances

**Indexes**:

- Primary: `id`
- Index: `(companyId, employeeId, status)`
- Index: `(companyId, createdAt)`

**Constraints**:

- `amount` MUST be positive
- `deductedAmount + remainingAmount = amount` (maintained on deduction)
- `status = SETTLED` when `remainingAmount = 0`

---

## PayrollRecord

**Purpose**: Weekly payroll entry for one Employee including gross, deductions, and net pay.

| Field                 | Type     | Required | Default   | Nullable | Notes                      |
| --------------------- | -------- | -------- | --------- | -------- | -------------------------- |
| id                    | UUID     | Yes      | generated | No       | Primary key                |
| companyId             | UUID     | Yes      | —         | No       | FK → Company               |
| employeeId            | UUID     | Yes      | —         | No       | FK → Employee              |
| payPeriodStart        | date     | Yes      | —         | No       | Inclusive period start     |
| payPeriodEnd          | date     | Yes      | —         | No       | Inclusive period end       |
| grossSalary           | decimal  | Yes      | —         | No       | From Employee.weeklySalary |
| cashAdvanceDeductions | decimal  | Yes      | `0`       | No       | Total deductions applied   |
| netPay                | decimal  | Yes      | —         | No       | gross - deductions         |
| status                | enum     | Yes      | `PAYABLE` | No       | `PAYABLE`, `PAID`          |
| paidAt                | datetime | No       | null      | Yes      | Set when marked paid       |
| paymentReference      | string   | No       | null      | Yes      | Optional payment reference |
| createdByUserId       | UUID     | No       | null      | Yes      | Audit                      |
| updatedByUserId       | UUID     | No       | null      | Yes      | Audit                      |
| createdAt             | datetime | Yes      | now       | No       | Audit                      |
| updatedAt             | datetime | Yes      | now       | No       | Audit                      |

**Relationships**:

- Many PayrollRecords belong to one Employee
- Deductions update linked CashAdvance balances when marked paid

**Cardinality**: Employee 1 → N PayrollRecords per pay period

**Indexes**:

- Primary: `id`
- Unique: `(companyId, employeeId, payPeriodStart)`
- Index: `(companyId, payPeriodStart, payPeriodEnd)`
- Index: `(companyId, status)`

**Constraints**:

- Pay period MUST span exactly seven days (`payPeriodEnd - payPeriodStart = 6 days`)
- `netPay` MUST NOT be negative; generation fails if deductions exceed gross
- `status = PAID` records cannot be marked paid again
- Employee MUST have `weeklySalary` defined for inclusion in generation

---

## WorkforceDashboardView (Read Model)

**Purpose**: Composed response for employee operational dashboard; not persisted.

| Section             | Type   | Notes                                            |
| ------------------- | ------ | ------------------------------------------------ |
| attendanceStatus    | object | `isTimedIn`, `openSession` (if any)              |
| attendanceSummary   | array  | Recent attendance sessions                       |
| leaveSummary        | array  | Recent leave records                             |
| cashAdvanceSummary  | object | Outstanding balance and recent advances          |
| payrollSummary      | array  | Recent payroll lines (employee scope)            |
| visibility          | object | Flags for Time Out, new Transaction, new Expense |
| tripsSummary        | array  | Empty placeholder until Trips module             |
| transactionsSummary | array  | Empty placeholder until Transactions module      |

---

## Prisma Enums (planned)

```prisma
enum AttendanceSessionStatus { OPEN CLOSED }
enum LeaveType { HALF_DAY FULL_DAY }
enum LeaveStatus { PENDING APPROVED REJECTED CANCELLED }
enum CashAdvanceStatus { OUTSTANDING SETTLED }
enum PayrollStatus { PAYABLE PAID }
```

## Relationship Diagram

```text
Company (P001)
│
├── 1:N → Employees (P001)
│         │
│         ├── 1:N → AttendanceSessions
│         ├── 1:N → LeaveRecords
│         ├── 1:N → CashAdvances
│         └── 1:N → PayrollRecords
│
└── (indirect) all workforce records via companyId
```

## Company Model Extension

```prisma
model Company {
  // existing fields ...
  attendanceSessions AttendanceSession[]
  leaveRecords       LeaveRecord[]
  cashAdvances       CashAdvance[]
  payrollRecords     PayrollRecord[]
}

model Employee {
  // existing fields ...
  attendanceSessions AttendanceSession[]
  leaveRecords       LeaveRecord[]
  cashAdvances       CashAdvance[]
  payrollRecords     PayrollRecord[]
}
```

## Migration Notes

- Single migration: `20260707190000_workforce_management`
- Monetary fields use `Decimal(10, 2)` consistent with `Employee.weeklySalary`
- No soft-delete on workforce history records in P003; historical records remain queryable
- Partial unique index on open attendance sessions per employee recommended where PostgreSQL supports

## Future Extensibility

| Future Feature | Extension Point                                       |
| -------------- | ----------------------------------------------------- |
| Transactions   | `isOperationallyReady()` from attendance open session |
| Trips          | Dashboard tripsSummary populated from Trip module     |
| Expenses       | Dashboard visibility flags already defined            |
| Analytics      | Aggregate by companyId, pay period, attendance dates  |
| Branch linkage | Optional `branchId` on AttendanceSession              |
