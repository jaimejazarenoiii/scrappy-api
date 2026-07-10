# Data Model: Reports (P009)

**Feature**: `009-reports`  
**Depends on**: P001–P008 operational models (read-only projections; **no new persisted entities**)

## Overview

Reports does **not** introduce database tables or aggregate roots. It defines **read projections**,
**filter value objects**, **pagination/sort/search parameters**, and **response DTO shapes**
computed from existing operational data at request time.

```text
Operational Tables (existing)          Reports Layer (ephemeral)
─────────────────────────────          ───────────────────────────
Company, User, Employee                ReportFilter (request scope)
Branch, Warehouse, Vehicle             ReportPagination (page/limit)
Transaction, TransactionItem, ...      ReportSort (sortBy/sortOrder)
Trip, TripMember                       ReportSearch (optional text)
Attendance, Leave, CashAdvance         TransactionReportRow (DTO)
PayrollRecord                          TripReportRow (DTO)
Expense (P007 — when available)        ... (11 row types)
                                       ReportListResponse (paginated)
                                       AppliedReportCriteria (meta)
                                       ExportArtifact (streamed file)
```

## ReportFilter (Value Object)

**Purpose**: Canonical filter scope for a report request.

| Field             | Type     | Source | Notes                           |
| ----------------- | -------- | ------ | ------------------------------- |
| companyId         | UUID     | Auth   | Never from client               |
| from              | datetime | Query  | Required for date-bound reports |
| to                | datetime | Query  | Required for date-bound reports |
| branchId          | UUID?    | Query  | Optional                        |
| warehouseId       | UUID?    | Query  | Optional                        |
| vehicleId         | UUID?    | Query  | Optional                        |
| employeeId        | UUID?    | Query  | Optional                        |
| tripId            | UUID?    | Query  | Optional                        |
| transactionNumber | string?  | Query  | Transaction report prefix/exact |
| direction         | enum?    | Query  | INBOUND \| OUTBOUND             |
| status            | enum?    | Query  | Domain-specific status enum     |
| category          | string?  | Query  | Expense report (P007)           |
| referenceType     | string?  | Query  | Expense report (P007)           |
| includeArchived   | boolean  | Query  | Default false                   |

### Validation rules

- `companyId` required from session.
- `to >= from`; max span 366 days (date-bound reports).
- Entity IDs validated against company tenancy.
- Archived: `deletedAt IS NOT NULL` rows omitted unless `includeArchived=true`.
- Cancelled transactions included only when status filter allows; default list excludes none
  by status unless client filters (all non-archived statuses visible).

## ReportPagination (Value Object)

| Field | Type    | Default | Max |
| ----- | ------- | ------- | --- |
| page  | integer | 1       | —   |
| limit | integer | 20      | 100 |

## ReportSort (Value Object)

| Field     | Type      | Default                   |
| --------- | --------- | ------------------------- |
| sortBy    | enum      | per report                |
| sortOrder | asc\|desc | desc (dates), asc (names) |

## ReportSearch (Value Object)

| Field  | Type   | Rules                             |
| ------ | ------ | --------------------------------- |
| search | string | Optional; min 2 chars if provided |

## AppliedReportCriteria (DTO — meta)

Echo of resolved filter, search, sort, pagination, and `generatedAt` timestamp.

## Row Projections (DTOs)

### TransactionReportRow

| Field              | Type     | Source                                                          |
| ------------------ | -------- | --------------------------------------------------------------- |
| transactionId      | UUID     | Transaction.id                                                  |
| transactionNumber  | string   | Transaction.transactionNumber                                   |
| direction          | enum     | Transaction.direction                                           |
| status             | enum     | Transaction.status                                              |
| partyName          | string   | Transaction.partyName                                           |
| partyContactNumber | string?  | Transaction.partyContactNumber                                  |
| assignedEmployees  | array    | Employee names from assignments                                 |
| location           | object   | branch/warehouse/outside resolved label                         |
| items              | array    | TransactionItem rows (materialName, weight, unit, price, total) |
| grandTotal         | decimal  | Sum of item totals                                              |
| settlement         | object   | submittedAt, submittedBy, paidAt, paidBy, paymentReference      |
| createdBy          | string   | User display label                                              |
| createdAt          | datetime | Transaction.createdAt                                           |

### TripReportRow

| Field          | Type      | Source                   |
| -------------- | --------- | ------------------------ |
| tripId         | UUID      | Trip.id                  |
| tripNumber     | string    | Trip.tripNumber          |
| vehicle        | object    | plateNumber, description |
| members        | array     | employee name + role     |
| status         | enum      | Trip.status              |
| scheduledStart | datetime  | Trip.scheduledStart      |
| actualStart    | datetime? | Trip.actualStart         |
| actualEnd      | datetime? | Trip.actualEnd           |
| origin         | string    | Trip.origin              |
| destination    | string    | Trip.destination         |

### ExpenseReportRow (P007)

| Field         | Type     | Source                          |
| ------------- | -------- | ------------------------------- |
| expenseId     | UUID     | Expense.id                      |
| category      | string   | Expense.category                |
| amount        | decimal  | Expense.amount                  |
| referenceType | enum     | Expense.referenceType           |
| reference     | string   | Resolved reference label        |
| addedBy       | string   | User label                      |
| date          | datetime | Expense.occurredAt or createdAt |

_Empty when Expense model absent._

### AttendanceReportRow

| Field        | Type      | Source                       |
| ------------ | --------- | ---------------------------- |
| attendanceId | UUID      | AttendanceSession.id         |
| employee     | object    | id, displayName              |
| date         | date      | timeInAt date                |
| timeIn       | datetime  | adjusted or actual timeInAt  |
| timeOut      | datetime? | adjusted or actual timeOutAt |
| status       | enum      | OPEN \| CLOSED               |

### LeaveReportRow

| Field     | Type   | Source                             |
| --------- | ------ | ---------------------------------- |
| leaveId   | UUID   | LeaveRecord.id                     |
| employee  | object | id, displayName                    |
| leaveType | enum   | LeaveRecord.leaveType              |
| leaveDate | date   | LeaveRecord.leaveDate              |
| status    | enum   | LeaveRecord.status (audit context) |

### CashAdvanceReportRow

| Field           | Type     | Source                         |
| --------------- | -------- | ------------------------------ |
| cashAdvanceId   | UUID     | CashAdvance.id                 |
| employee        | object   | id, displayName                |
| amount          | decimal  | CashAdvance.amount             |
| issuedBy        | string   | createdByUser label            |
| issuedAt        | datetime | CashAdvance.createdAt          |
| status          | enum     | OUTSTANDING \| SETTLED (audit) |
| remainingAmount | decimal  | CashAdvance.remainingAmount    |

### PayrollReportRow

| Field                | Type      | Source                              |
| -------------------- | --------- | ----------------------------------- |
| payrollId            | UUID      | PayrollRecord.id                    |
| employee             | object    | id, displayName                     |
| payPeriodStart       | date      | PayrollRecord.payPeriodStart        |
| payPeriodEnd         | date      | PayrollRecord.payPeriodEnd          |
| salary               | decimal   | PayrollRecord.grossSalary           |
| cashAdvanceDeduction | decimal   | PayrollRecord.cashAdvanceDeductions |
| totalAmount          | decimal   | PayrollRecord.netPay                |
| status               | enum      | PayrollRecord.status                |
| paidBy               | string?   | updatedByUser label when paid       |
| paidAt               | datetime? | PayrollRecord.paidAt                |

### EmployeeReportRow

| Field           | Type     | Source                  |
| --------------- | -------- | ----------------------- |
| employeeId      | UUID     | Employee.id             |
| employeeNumber  | string?  | Employee.employeeNumber |
| firstName       | string   | Employee.firstName      |
| middleName      | string?  | Employee.middleName     |
| lastName        | string   | Employee.lastName       |
| suffix          | string?  | Employee.suffix         |
| displayName     | string   | Computed full name      |
| contactNumber   | string?  | Employee.contactNumber  |
| weeklySalary    | decimal  | Employee.weeklySalary   |
| status          | enum     | Employee.status         |
| linkedUserEmail | string?  | User.email if linked    |
| createdAt       | datetime | Employee.createdAt      |

### BranchReportRow

| Field                    | Type     | Source                           |
| ------------------------ | -------- | -------------------------------- |
| branchId                 | UUID     | Branch.id                        |
| name                     | string   | Branch.name                      |
| address                  | string   | Branch.address                   |
| contactNumber            | string   | Branch.contactNumber             |
| status                   | enum     | Branch.status                    |
| createdAt                | datetime | Branch.createdAt                 |
| updatedAt                | datetime | Branch.updatedAt                 |
| transactionCountInPeriod | integer? | Derived when date filter applied |

### WarehouseReportRow

| Field                    | Type     | Source                           |
| ------------------------ | -------- | -------------------------------- |
| warehouseId              | UUID     | Warehouse.id                     |
| name                     | string   | Warehouse.name                   |
| address                  | string   | Warehouse.address                |
| contactNumber            | string   | Warehouse.contactNumber          |
| status                   | enum     | Warehouse.status                 |
| createdAt                | datetime | Warehouse.createdAt              |
| updatedAt                | datetime | Warehouse.updatedAt              |
| transactionCountInPeriod | integer? | Derived when date filter applied |

### VehicleReportRow

| Field             | Type     | Source                           |
| ----------------- | -------- | -------------------------------- |
| vehicleId         | UUID     | Vehicle.id                       |
| plateNumber       | string   | Vehicle.plateNumber              |
| description       | string   | Vehicle.description              |
| status            | enum     | Vehicle.status                   |
| createdAt         | datetime | Vehicle.createdAt                |
| updatedAt         | datetime | Vehicle.updatedAt                |
| tripCountInPeriod | integer? | Derived when date filter applied |

## ReportListResponse (Generic envelope)

| Field           | Type                  | Notes                          |
| --------------- | --------------------- | ------------------------------ |
| items           | array                 | Domain-specific row DTOs       |
| meta            | object                | page, limit, total, totalPages |
| appliedCriteria | AppliedReportCriteria |                                |
| generatedAt     | datetime              |                                |

## ExportArtifact (Ephemeral)

| Field       | Type     | Notes                                         |
| ----------- | -------- | --------------------------------------------- |
| filename    | string   | Per naming convention                         |
| contentType | string   | text/csv, application/vnd..., application/pdf |
| stream      | Readable | Node stream for response pipe                 |

## Date column mapping (query design reference)

| Report        | Primary date column for `from`/`to`            |
| ------------- | ---------------------------------------------- |
| Transactions  | transactionDate                                |
| Trips         | scheduledStart                                 |
| Expenses      | expense date field (P007)                      |
| Attendance    | timeInAt                                       |
| Leave         | leaveDate                                      |
| Cash Advances | createdAt                                      |
| Payroll       | pay period overlap (start ≤ to AND end ≥ from) |
| Employees     | createdAt (optional; list all if no range)     |
| Branches      | createdAt (optional)                           |
| Warehouses    | createdAt (optional)                           |
| Vehicles      | createdAt (optional)                           |

Organization reports: `from`/`to` optional; when omitted, return all non-archived company records.
When provided, filter by `createdAt` and compute in-period activity counts.
