# Feature Specification: P003 - Workforce Management

**Feature Branch**: `[004-workforce-management]`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Create Product Specification P003 - Workforce Management for Scrappy."

## Vision

Workforce Management extends Employee capabilities from P001 with operational workforce controls
that determine when employees are ready to participate in day-to-day business activities. It
introduces attendance, leave, cash advances, payroll, and an employee operational dashboard so
Companies can manage workforce readiness before Transactions and Trips.

**Purpose**:

- Enable employees to time in, time out, and review their workforce history.
- Enable Owners and Managers to administer attendance, leave, cash advances, and payroll within
  their Company.
- Establish the operational readiness rule: employees must be timed in before creating Transactions
  or Expenses (enforced when those modules are introduced).
- Prepare workforce records for future integration with Transactions, Trips, Expenses, and
  Analytics without redefining Employee or Company foundations from P001.

**Scope**:

- Attendance (Time In, Time Out, Attendance History)
- Leave Tracking (Half Day, Full Day, request and history)
- Cash Advances (create and history with role-appropriate visibility)
- Payroll (weekly payroll, salary, cash advance deductions, history, mark as paid)
- Employee operational dashboard (readiness and visibility rules before/after Time In)

**Non-goals**:

- Implementing Transaction or Expense creation workflows (only readiness rules and dashboard
  visibility references)
- Implementing Trip assignment, dispatch, or route workflows (only dashboard visibility
  references for upcoming/active trips)
- Redefining Company, User, Employee, authentication, or organization resources from P001/P002
- Mobile application UI implementation (API contracts only)
- Tax computation, government statutory reporting, or multi-currency payroll
- Automated bank disbursement or payment gateway integration

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Employee Attendance and Operational Readiness (Priority: P1)

An Employee needs to Time In at the start of work, Time Out when finished, and view attendance
history so the Company knows when they are operationally active.

**Why this priority**: Attendance is the gate for all downstream operational actions. Without
Time In/Time Out, workforce readiness cannot be enforced for Transactions or Expenses.

**Independent Test**: An active Employee Times In, views current attendance status, Times Out, and
retrieves attendance history within their Company. After Time Out, operational actions are no
longer available.

**Acceptance Scenarios**:

1. **Given** an active Employee who is not currently timed in, **When** the Employee submits Time
   In, **Then** the system records an attendance session and marks the Employee as operationally
   active.
2. **Given** an Employee who is currently timed in, **When** the Employee submits Time Out,
   **Then** the attendance session is closed and the Employee returns to read-only operational
   mode.
3. **Given** an Employee with past attendance sessions, **When** the Employee requests attendance
   history, **Then** only their own records within the Company are returned.
4. **Given** an archived Employee, **When** Time In is attempted, **Then** the request is rejected.

---

### User Story 2 - Leave Requests and History (Priority: P2)

An Employee needs to request Half Day or Full Day leave and view leave history. Owners and
Managers need to review and manage leave records for their Company.

**Why this priority**: Leave tracking supports workforce planning and must be available before
payroll and operational scheduling can be trusted.

**Independent Test**: An Employee submits a leave request, views their history, and an authorized
Manager or Owner updates the leave record status within the same Company.

**Acceptance Scenarios**:

1. **Given** an active Employee and valid leave details, **When** a leave request is submitted,
   **Then** a leave record is created for that Employee within the Company.
2. **Given** leave records exist, **When** an Employee views leave history, **Then** only their own
   leave records are returned.
3. **Given** leave records exist in a Company, **When** an Owner or Manager manages leave records,
   **Then** they can view and update leave records for Employees in that Company only.

---

### User Story 3 - Cash Advances (Priority: P3)

Employees need to view their own cash advance history. Managers and Owners need to create and
review cash advances across the Company for payroll deduction purposes.

**Why this priority**: Cash advances affect weekly payroll calculations and must be recorded
before payroll can reflect deductions accurately.

**Independent Test**: A Manager creates a cash advance for an Employee, the Employee views only
their own advances, and a Manager lists all Company cash advances.

**Acceptance Scenarios**:

1. **Given** an authorized Manager or Owner and valid advance details, **When** a cash advance is
   created, **Then** the advance is recorded against the target Employee within the Company.
2. **Given** cash advances exist, **When** an Employee requests cash advance history, **Then**
   only their own records are returned.
3. **Given** cash advances exist, **When** a Manager or Owner requests company cash advance
   records, **Then** all advances within the Company are returned according to authorization
   rules.

---

### User Story 4 - Weekly Payroll (Priority: P4)

Owners and Managers need to generate weekly payroll using employee weekly salary and outstanding
cash advance deductions, review payroll history, and mark payroll as paid.

**Why this priority**: Payroll completes the workforce loop but depends on employee salary data
from P001 and cash advance records from this feature.

**Independent Test**: An authorized Manager or Owner generates weekly payroll for a pay period,
reviews calculated deductions and net amounts, marks payroll as paid, and retrieves payroll
history.

**Acceptance Scenarios**:

1. **Given** active Employees with defined weekly salary and applicable cash advances, **When**
   weekly payroll is generated for a pay period, **Then** payroll records include gross salary,
   cash advance deductions, and net pay per Employee.
2. **Given** a payroll record in a payable state, **When** an authorized user marks it as paid,
   **Then** the payroll status reflects paid and cannot be paid again.
3. **Given** payroll records exist, **When** payroll history is requested within authorization
   rules, **Then** records for the Company are returned for the requested scope.

---

### User Story 5 - Employee Operational Dashboard (Priority: P5)

An Employee needs a single workforce dashboard that shows attendance status, history summaries,
and the correct visibility of operational actions before and after Time In.

**Why this priority**: The dashboard aggregates workforce readiness and prepares the employee
for Transactions and Trips without implementing those modules in P003.

**Independent Test**: An Employee retrieves the dashboard before Time In and confirms read-only
operational visibility; after Time In, Time Out and future operational entry points become
visible while restricted items remain hidden until timed in.

**Acceptance Scenarios**:

1. **Given** an Employee who has not Timed In, **When** the dashboard is requested, **Then**
   attendance status, attendance history, leave history summary, cash advance summary, and
   read-only references to upcoming trips and transaction history are visible, and new
   Transaction and new Expense actions are not available.
2. **Given** an Employee who is Timed In, **When** the dashboard is requested, **Then** Time Out,
   new Transaction, and new Expense (if permitted) actions are visible alongside active trip and
   today's transaction summaries.
3. **Given** an Employee who Times Out, **When** the dashboard is requested again, **Then**
   operational creation actions are hidden and read-only summaries remain available.

---

### Role Expectations

#### Employee

- May Time In and Time Out for their own attendance.
- May view their own attendance, leave, cash advance, and payroll history.
- May request leave (Half Day or Full Day).
- May view the operational dashboard for their own workforce context.
- May not create cash advances for other Employees.
- May not manage Company-wide payroll or leave records for others.

#### Manager

- Has all Employee capabilities when acting on their own linked employee profile (if applicable).
- May view and manage attendance, leave, cash advances, and payroll for all Employees within the
  Company.
- May create cash advances for Employees in the Company.
- May generate weekly payroll and mark payroll as paid.

#### Owner

- Has full workforce management access for the Company, equivalent to Manager capabilities with
  no additional restrictions defined in P003.

---

### Edge Cases

- What happens when an Employee attempts Time In while already timed in?
- What happens when Time Out is submitted without an open Time In session?
- How does the system handle overlapping leave requests for the same date?
- What happens when payroll is generated for an Employee with no weekly salary defined?
- What happens when cash advance deductions exceed weekly gross salary?
- How does the system behave when a Manager attempts to access workforce records for an Employee
  in another Company?
- What happens when an archived Employee's historical workforce records are requested?
- How are half-day leave requests validated against the same calendar day?

## Requirements _(mandatory)_

### Functional Requirements

#### Attendance

- **FR-001**: The system MUST allow an active Employee to Time In within their Company.
- **FR-002**: The system MUST allow a currently timed-in Employee to Time Out within their
  Company.
- **FR-003**: The system MUST provide attendance history for the requesting Employee scoped to
  their own records.
- **FR-004**: The system MUST allow Owners and Managers to view and manage attendance records for
  all Employees in their Company.
- **FR-005**: The system MUST treat a timed-in Employee as operationally active until Time Out.
- **FR-006**: The system MUST prevent archived Employees from Timing In.
- **FR-007**: The system MUST prevent Employees who are not timed in from being eligible for new
  Transaction or Expense creation when those modules are enforced.
- **FR-008**: The system MUST return Employees to read-only operational mode after Time Out.

#### Leave

- **FR-009**: The system MUST allow Employees to request leave with type Half Day or Full Day.
- **FR-010**: The system MUST allow Employees to view their own leave history.
- **FR-011**: The system MUST allow Owners and Managers to view and manage leave records for their
  Company.
- **FR-012**: Every leave record MUST belong to exactly one Employee and one Company.

#### Cash Advances

- **FR-013**: The system MUST allow Owners and Managers to create cash advances for Employees in
  their Company.
- **FR-014**: The system MUST allow Employees to view only their own cash advance history.
- **FR-015**: The system MUST allow Managers and Owners to view all cash advance records within
  their Company.
- **FR-016**: Every cash advance MUST belong to exactly one Employee and one Company.

#### Payroll

- **FR-017**: The system MUST support weekly payroll generation per Company pay period.
- **FR-018**: Weekly payroll MUST use each Employee's weekly salary as the gross pay basis.
- **FR-019**: Weekly payroll MUST apply outstanding cash advance deductions applicable to the pay
  period.
- **FR-020**: The system MUST provide payroll history within authorization scope.
- **FR-021**: The system MUST allow Owners and Managers to mark payroll records as paid.
- **FR-022**: Paid payroll records MUST NOT be marked paid again.

#### Dashboard

- **FR-023**: The system MUST provide an employee operational dashboard reflecting attendance
  status and workforce summaries.
- **FR-024**: Before Time In, the dashboard MUST hide new Transaction and new Expense actions.
- **FR-025**: After Time In, the dashboard MUST expose Time Out and permitted operational entry
  points for Transactions and Expenses.
- **FR-026**: The dashboard MUST expose read-only summaries for upcoming trips, transaction
  history, and cash advances appropriate to the Employee's authorization scope.

#### Cross-cutting

- **FR-027**: All workforce records MUST be scoped to exactly one Company.
- **FR-028**: Cross-company access to workforce records MUST be rejected.
- **FR-029**: Employees MUST only access their own workforce records unless acting in a Manager or
  Owner capacity with Company-wide authorization.
- **FR-030**: P003 MUST extend P001 Employee capabilities without redefining Employee identity or
  Company tenant rules.

### API Contracts

All endpoints use the standard API response structure established in P001. Protected endpoints
require authenticated Company-bound access. Errors include validation failures, unauthorized
access, forbidden role actions, not found, and business rule conflicts.

#### Attendance

- **Time In**
  - Purpose: Start an attendance session for the authenticated Employee.
  - Method: `POST`
  - URI: `/api/v1/workforce/attendance/time-in`
  - Request: optional note or location reference if supported; no required fields beyond
    authentication context.
  - Response: Current attendance session with timed-in status.
  - Errors: already timed in, archived employee, unauthenticated, forbidden, cross-company
    violation.

- **Time Out**
  - Purpose: Close the current attendance session for the authenticated Employee.
  - Method: `POST`
  - URI: `/api/v1/workforce/attendance/time-out`
  - Request: optional note; no required fields beyond authentication context.
  - Response: Closed attendance session with timed-out status.
  - Errors: not currently timed in, unauthenticated, forbidden.

- **View Current Attendance Status**
  - Purpose: Return whether the authenticated Employee is currently timed in.
  - Method: `GET`
  - URI: `/api/v1/workforce/attendance/status`
  - Request: none.
  - Response: Operational attendance status for the authenticated Employee.
  - Errors: unauthenticated, forbidden.

- **List My Attendance History**
  - Purpose: Return attendance history for the authenticated Employee.
  - Method: `GET`
  - URI: `/api/v1/workforce/attendance`
  - Request: optional date range and pagination parameters.
  - Response: Collection of attendance records for the authenticated Employee.
  - Errors: unauthenticated, forbidden, validation error on filters.

- **List Company Attendance (Manager/Owner)**
  - Purpose: Return attendance records for Employees in the authenticated Company.
  - Method: `GET`
  - URI: `/api/v1/workforce/attendance/company`
  - Request: optional employee filter, date range, and pagination parameters.
  - Response: Collection of attendance records within the Company.
  - Errors: unauthenticated, forbidden for Employee role, validation error.

- **Manage Attendance Record (Manager/Owner)**
  - Purpose: Correct or annotate an attendance record when authorized.
  - Method: `PATCH`
  - URI: `/api/v1/workforce/attendance/{attendanceId}`
  - Request: at least one mutable attendance field (for example correction note or adjusted times
    where business rules allow).
  - Response: Updated attendance record.
  - Errors: not found, forbidden, validation error, cross-company violation.

#### Leave

- **Request Leave**
  - Purpose: Create a leave request for the authenticated Employee.
  - Method: `POST`
  - URI: `/api/v1/workforce/leave`
  - Request: leave type (`HALF_DAY` or `FULL_DAY`), leave date, optional reason.
  - Response: Created leave record.
  - Errors: validation error, overlapping leave conflict, unauthenticated, forbidden.

- **List My Leave History**
  - Purpose: Return leave records for the authenticated Employee.
  - Method: `GET`
  - URI: `/api/v1/workforce/leave`
  - Request: optional status filter, date range, pagination.
  - Response: Collection of leave records for the authenticated Employee.
  - Errors: unauthenticated, forbidden.

- **List Company Leave (Manager/Owner)**
  - Purpose: Return leave records for the Company.
  - Method: `GET`
  - URI: `/api/v1/workforce/leave/company`
  - Request: optional employee filter, status filter, date range, pagination.
  - Response: Collection of leave records within the Company.
  - Errors: unauthenticated, forbidden for Employee role.

- **Manage Leave Record (Manager/Owner)**
  - Purpose: Update leave status or details for a Company Employee.
  - Method: `PATCH`
  - URI: `/api/v1/workforce/leave/{leaveId}`
  - Request: at least one mutable leave field (for example status or manager note).
  - Response: Updated leave record.
  - Errors: not found, forbidden, validation error, lifecycle conflict.

#### Cash Advances

- **Create Cash Advance (Manager/Owner)**
  - Purpose: Record a cash advance for an Employee in the Company.
  - Method: `POST`
  - URI: `/api/v1/workforce/cash-advances`
  - Request: target employee identifier, amount, optional reason or reference.
  - Response: Created cash advance record.
  - Errors: validation error, employee not found, forbidden, cross-company violation.

- **List My Cash Advances**
  - Purpose: Return cash advance history for the authenticated Employee.
  - Method: `GET`
  - URI: `/api/v1/workforce/cash-advances`
  - Request: optional status filter, date range, pagination.
  - Response: Collection of cash advance records for the authenticated Employee.
  - Errors: unauthenticated, forbidden.

- **List Company Cash Advances (Manager/Owner)**
  - Purpose: Return all cash advance records in the Company.
  - Method: `GET`
  - URI: `/api/v1/workforce/cash-advances/company`
  - Request: optional employee filter, status filter, date range, pagination.
  - Response: Collection of company cash advance records.
  - Errors: unauthenticated, forbidden for Employee role.

#### Payroll

- **Generate Weekly Payroll (Manager/Owner)**
  - Purpose: Create payroll records for a weekly pay period.
  - Method: `POST`
  - URI: `/api/v1/workforce/payroll`
  - Request: pay period start date, pay period end date, optional employee scope.
  - Response: Generated payroll batch with per-employee payroll lines.
  - Errors: validation error, duplicate pay period conflict, forbidden, employee salary missing.

- **List Payroll History**
  - Purpose: Return payroll records within authorization scope.
  - Method: `GET`
  - URI: `/api/v1/workforce/payroll`
  - Request: optional pay period filters, employee filter (Manager/Owner), pagination.
  - Response: Collection of payroll records; Employees receive only their own lines.
  - Errors: unauthenticated, forbidden.

- **View Payroll Record**
  - Purpose: Retrieve one payroll record by identifier.
  - Method: `GET`
  - URI: `/api/v1/workforce/payroll/{payrollId}`
  - Request: payroll identifier.
  - Response: Payroll record with gross salary, deductions, and net pay details.
  - Errors: not found, forbidden, cross-company violation.

- **Mark Payroll as Paid (Manager/Owner)**
  - Purpose: Mark a payroll record as paid.
  - Method: `POST`
  - URI: `/api/v1/workforce/payroll/{payrollId}/mark-paid`
  - Request: payroll identifier; optional payment reference.
  - Response: Updated payroll record with paid status.
  - Errors: not found, already paid conflict, forbidden.

#### Employee Dashboard

- **View Operational Dashboard**
  - Purpose: Return workforce readiness summary and permitted operational visibility for the
    authenticated Employee.
  - Method: `GET`
  - URI: `/api/v1/workforce/dashboard`
  - Request: none.
  - Response: Dashboard payload including attendance status, summaries, and visibility flags for
    operational actions (Time Out, new Transaction, new Expense, trips, transactions).
  - Errors: unauthenticated, forbidden.

### Validation Rules

#### Attendance validation

- Time In and Time Out MUST be rejected when no open/closed session rules are satisfied.
- An Employee MUST NOT have more than one open attendance session at a time.
- Attendance timestamps MUST be valid and chronologically consistent (Time Out after Time In).
- Archived Employees MUST NOT pass Time In validation.

#### Leave validation

- Leave type MUST be `HALF_DAY` or `FULL_DAY`.
- Leave date MUST be provided and valid.
- Overlapping leave requests for the same Employee on the same date MUST be rejected unless an
  authorized Manager or Owner explicitly overrides per business policy.
- Leave reason MAY be optional but MUST meet length limits when provided.

#### Cash advance validation

- Amount MUST be a positive monetary value.
- Target Employee MUST belong to the same Company as the requester.
- Employees MUST NOT create cash advances for other Employees.

#### Payroll validation

- Pay period start and end dates MUST be valid and define a weekly period.
- Weekly salary MUST exist for each Employee included in payroll generation.
- Deductions MUST NOT produce negative net pay; conflicts MUST be surfaced for resolution.
- Mark-as-paid MUST be rejected for already paid payroll records.

#### Business validation

- Workforce actions MUST enforce Company tenant boundaries.
- Employees MUST access only their own records unless authorized as Manager or Owner.
- Operational readiness MUST reflect attendance state for dashboard visibility rules.
- Historical workforce records MUST remain available according to role and retention rules.

### Key Entities

- **Attendance Session**: A timed work period for one Employee with Time In, optional Time Out,
  Company ownership, and operational status.
- **Leave Record**: A Half Day or Full Day leave request for one Employee with date, type, status,
  and optional reason.
- **Cash Advance**: A monetary advance issued to one Employee, tracked for deduction from future
  weekly payroll.
- **Payroll Record**: A weekly payroll entry for one Employee including gross weekly salary, cash
  advance deductions, net pay, pay period, and paid status.
- **Workforce Dashboard View**: A read model summarizing attendance readiness, workforce history
  snippets, and which operational actions are currently visible to the Employee.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Active Employees can complete Time In and Time Out within their Company in under 30
  seconds in at least 95% of tested scenarios.
- **SC-002**: Employees who are not timed in are blocked from operational creation eligibility in
  100% of readiness validation scenarios.
- **SC-003**: Employees can view only their own attendance, leave, cash advance, and payroll
  history in 100% of authorization test scenarios.
- **SC-004**: Managers and Owners can administer Company-wide workforce records without
  cross-company data exposure in 100% of tenant isolation scenarios.
- **SC-005**: Weekly payroll correctly reflects weekly salary and applicable cash advance
  deductions in 100% of payroll validation scenarios.
- **SC-006**: The operational dashboard shows correct action visibility before and after Time In
  in 100% of dashboard validation scenarios.
- **SC-007**: Archived Employees cannot Time In in 100% of lifecycle validation scenarios.

## Assumptions

- P001 authentication, roles (Owner, Manager, Employee), and Employee records remain the
  foundation; workforce features extend Employees already linked to Users where applicable.
- P002 organization resources are available but not required for every workforce action in P003.
- Weekly salary is sourced from the Employee profile established in P001.
- Pay periods follow a weekly calendar aligned to the Company's operational week (seven-day
  periods); exact week boundary defaults to Monday–Sunday unless configured in a future feature.
- Leave approval workflow uses Manager/Owner management actions without a separate approver role.
- Cash advances are deducted from the next applicable weekly payroll until fully applied.
- Trip and Transaction summaries on the dashboard may return empty or placeholder collections until
  those modules exist; visibility rules are still enforced.
- Currency is single-currency per Company for P003; amounts are expressed in the Company's
  operational currency without conversion.

## Future Considerations

Future specifications will integrate Workforce with Transactions, Trips, Expenses, and Analytics
by referencing attendance readiness, leave status, payroll outcomes, and cash advance balances
without redefining workforce entities or P003 business rules. Transaction and Expense modules MUST
honor the operational readiness established by attendance. Trip modules MAY reference attendance
and leave when determining employee availability.
