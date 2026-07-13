# Feature Specification: P010 - Activity Logs

**Feature Branch**: `[013-activity-logs]`

**Created**: 2026-07-13

**Status**: Draft

**Input**: User description: "Create Product Specification P010 - Activity Logs for Scrappy."

## Vision

Provide complete visibility into important business activities performed within a Company.

Activity Logs improve accountability, operational transparency, troubleshooting, and auditing
by presenting a centralized, chronological history of significant actions taken in the system.

Activity Logs are **read-only**, **automatically generated** by the system, and **never** created,
edited, or deleted by users.

**Purpose**:

- Automatically record important business events across authentication, workforce, organization,
  transactions, trips, expenses, and related modules delivered in P001–P009 (and related addenda).
- Allow authorized users to view, search, filter, and sort Activity Logs for operational auditing.
- Preserve historical records so Companies can reconstruct who did what, and when.

**Scope**:

- Automatic recording of major business operations (listed under Functional Requirements)
- Read-only list and detail access to Activity Logs within a Company
- Search, filter, and sort capabilities for Activity Logs
- REST contracts, validation rules, business rules, and measurable acceptance criteria
- Role rules: Owners and Managers may access; Employees may not

**Non-goals**:

- Manual creation, editing, or deletion of Activity Logs by any user
- Using Activity Logs as part of operational create/update/settle workflows
- Field-level change history, before/after value comparison, notifications, email alerts,
  webhooks, compliance report packs, or event streaming (future considerations)
- Cross-company Activity Log access
- Frontend-specific UX beyond what the API contracts imply

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Owner Reviews Company Activity History (Priority: P1)

An Owner needs a company-wide Activity Log list so they can see recent important actions—who
performed them, when, and against which business records—for accountability and troubleshooting.

**Why this priority**: Company-wide audit visibility is the core value of Activity Logs.

**Independent Test**: As Owner, list Activity Logs for the Company; entries appear for recorded
business actions in the Company only; Employees are denied access.

**Acceptance Scenarios**:

1. **Given** an authenticated Owner and existing Activity Logs in their Company, **When** they
   request the Activity Log list, **Then** they receive Activity Logs belonging only to their
   Company, each including Activity Type, Module, Action, Description, Performed By, and
   Date and Time.
2. **Given** Activity Logs that reference related resources, **When** the Owner views those
   entries, **Then** optional related resource identifiers (such as Employee, Transaction, Trip,
   Expense, Vehicle, Branch, or Warehouse) are included when applicable.
3. **Given** an authenticated Employee, **When** they request Activity Logs, **Then** access is
   denied.

---

### User Story 2 - Manager Searches and Filters Activity Logs (Priority: P2)

A Manager needs to find specific Activity Logs by business identifiers (for example transaction
number or employee name) and narrow results by module, action, user, date range, or activity type.

**Why this priority**: Search and filter make the audit trail usable day to day, not only as a
raw chronological dump.

**Independent Test**: As Manager, search by transaction number and filter by module and date
range; only matching Company Activity Logs return; invalid filters are rejected.

**Acceptance Scenarios**:

1. **Given** Activity Logs that mention a known Transaction Number, **When** a Manager searches
   by that Transaction Number, **Then** matching Activity Logs for the Company are returned.
2. **Given** Activity Logs across multiple modules, **When** a Manager filters by Module,
   Action, User, Date Range, and/or Activity Type, **Then** only entries matching all applied
   filters appear.
3. **Given** a Manager searches by Employee Name, Trip Number, Expense Number, User, or Action,
   **When** results return, **Then** results are limited to Company Activity Logs that match the
   search criteria within any applied filters.
4. **Given** invalid search or filter criteria, **When** a Manager submits the request, **Then**
   the request is rejected with a clear validation outcome and no Activity Logs are returned.

---

### User Story 3 - Authorized User Sorts Activity Logs (Priority: P3)

An Owner or Manager needs to sort Activity Logs by date, module, or user to review history in a
preferred order.

**Why this priority**: Sorting completes the read experience after list/search/filter.

**Independent Test**: As Owner or Manager, request Activity Logs sorted by date, module, or user;
results order matches the requested sort; default order is newest first when sort is omitted.

**Acceptance Scenarios**:

1. **Given** multiple Activity Logs, **When** an authorized user sorts by Date, **Then** results
   are ordered by Date and Time according to the requested direction (default newest first).
2. **Given** multiple Activity Logs, **When** an authorized user sorts by Module or User,
   **Then** results are ordered accordingly within the Company scope.
3. **Given** an unsupported sort field, **When** the request is submitted, **Then** it is
   rejected.

---

### User Story 4 - System Automatically Records Business Activities (Priority: P1)

When important business operations occur (login, employee updates, transaction settlement, trip
lifecycle, expenses, workforce actions, and similar), the system must automatically append
Activity Logs without any user creating them manually.

**Why this priority**: Without automatic recording, the audit module has nothing trustworthy to
show.

**Independent Test**: Perform representative business actions (for example login, create
employee, submit transaction, start trip); corresponding Activity Logs appear for the Company
and cannot be edited or deleted by users.

**Acceptance Scenarios**:

1. **Given** a successful User Login, **When** the action completes, **Then** an Activity Log of
   type Authentication / User Logged In is recorded for the Company with Performed By and
   Date and Time.
2. **Given** a Password Changed or Password Reset action, **When** it succeeds, **Then** a
   corresponding Authentication Activity Log is recorded (without exposing password values).
3. **Given** Employee Created, Updated, Archived, Account Created, or Account Disabled,
   **When** the action succeeds, **Then** an Employee Activity Log is recorded, optionally
   related to the Employee.
4. **Given** Branch, Warehouse, or Vehicle create/update actions, **When** they succeed,
   **Then** Organization Activity Logs are recorded with optional related resource references.
5. **Given** Transaction Created, Updated, Submitted, Returned to Draft, Paid, or Cancelled,
   **When** they succeed, **Then** Transaction Activity Logs are recorded with optional
   Transaction reference.
6. **Given** Trip Created, Started, Completed, or Cancelled, **When** they succeed, **Then**
   Trip Activity Logs are recorded with optional Trip reference.
7. **Given** Expense Created, Recorded, or Cancelled, **When** they succeed, **Then** Expense
   Activity Logs are recorded with optional Expense reference.
8. **Given** Employee Timed In/Out, Leave Recorded, Cash Advance Created, or Payroll Paid,
   **When** they succeed, **Then** Workforce Activity Logs are recorded with optional related
   Employee (and other related resources when applicable).
9. **Given** any recorded Activity Log, **When** a user attempts to create, edit, or delete it
   through Activity Log interfaces, **Then** the attempt is not supported / is rejected.

---

### Edge Cases

- What happens when Activity Logs exist for another Company? They must never appear in the
  requester’s results.
- What happens when search matches no records? An empty result set is returned successfully.
- What happens when a related resource is later archived or cancelled? The Activity Log remains
  as historical record; related identifiers may still be shown for audit context.
- What happens when a system action has no human actor (if any)? Performed By should still be
  representable (for example the acting User when available); actions without a User are out of
  scope for this release’s recorded examples, which are user-driven business operations.
- What happens if recording an Activity Log fails while the business action succeeds?
  Recording failure must not undo the completed business action; the gap is operationally
  undesirable and should be minimized, but source operations remain authoritative.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST automatically record Activity Logs for major business operations
  within a Company. Users MUST NOT manually create Activity Logs.
- **FR-002**: Activity Logs MUST be read-only after creation. Users MUST NOT edit or delete
  Activity Logs.
- **FR-003**: Each Activity Log MUST belong to exactly one Company and MUST never be visible
  outside that Company.
- **FR-004**: Each Activity Log MUST record Activity Type, Module, Action, Description,
  Performed By, and Date and Time.
- **FR-005**: Each Activity Log MAY optionally reference a related resource among: Employee,
  Transaction, Trip, Expense, Vehicle, Branch, Warehouse.
- **FR-006**: The system MUST record Authentication activities including at least: User Logged
  In, User Logged Out, Password Changed, Password Reset.
- **FR-007**: The system MUST record Employee activities including at least: Employee Created,
  Employee Updated, Employee Archived, Employee Account Created, Employee Account Disabled.
- **FR-008**: The system MUST record Organization activities including at least: Branch Created,
  Warehouse Created, Vehicle Created, Vehicle Updated.
- **FR-009**: The system MUST record Transaction activities including at least: Transaction
  Created, Transaction Updated, Transaction Submitted, Transaction Returned to Draft,
  Transaction Paid, Transaction Cancelled.
- **FR-010**: The system MUST record Trip activities including at least: Trip Created, Trip
  Started, Trip Completed, Trip Cancelled.
- **FR-011**: The system MUST record Expense activities including at least: Expense Created,
  Expense Recorded, Expense Cancelled.
- **FR-012**: The system MUST record Workforce activities including at least: Employee Timed
  In, Employee Timed Out, Leave Recorded, Cash Advance Created, Payroll Paid.
- **FR-013**: Owners MUST be able to view all Activity Logs for their Company.
- **FR-014**: Managers MUST be able to view Activity Logs for their Company (same Company
  visibility as Owners for this release).
- **FR-015**: Employees MUST NOT be able to access Activity Logs.
- **FR-016**: Authorized users MUST be able to search Activity Logs by Employee Name,
  Transaction Number, Trip Number, Expense Number, User, and Action.
- **FR-017**: Authorized users MUST be able to filter Activity Logs by Module, Action, User,
  Date Range, and Activity Type.
- **FR-018**: Authorized users MUST be able to sort Activity Logs by Date, Module, and User.
- **FR-019**: Activity Logs MUST be excluded from operational workflows (they do not create,
  update, settle, or otherwise change source business records).
- **FR-020**: Activity Log descriptions and metadata MUST NOT expose secrets such as passwords
  or temporary credentials.
- **FR-021**: The product MUST expose read-only REST resources for listing Activity Logs and
  retrieving a single Activity Log within the authenticated Company context.

### Key Entities

- **Activity Log**: An immutable audit entry for one significant business action in a Company.
  Includes Activity Type, Module, Action, Description, Performed By, Date and Time, and optional
  related resource references.
- **Company**: Tenant boundary; every Activity Log belongs to exactly one Company.
- **Performed By (User)**: The authenticated user who performed the action, when applicable.
- **Related Resource**: Optional pointer to a business record involved in the action (Employee,
  Transaction, Trip, Expense, Vehicle, Branch, or Warehouse).

## API Contracts _(business contracts only)_

Base path context: authenticated Company API. Clients never supply Company identity as a free
input for tenancy; Company is taken from the authenticated session.

### List Activity Logs

| Field               | Value                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose             | Return a searchable, filterable, sortable list of Activity Logs for the authenticated Company                                                                           |
| HTTP Method         | `GET`                                                                                                                                                                   |
| URI                 | `/activity-logs`                                                                                                                                                        |
| Required Request    | Authenticated Owner or Manager; optional query: search term / search field, module, action, user, activity type, date range start/end, sort field/direction, pagination |
| Successful Response | Collection of Activity Logs with Activity Type, Module, Action, Description, Performed By, Date and Time, optional related resource summary, and pagination metadata    |
| Possible Errors     | Unauthenticated; Forbidden (Employee or unauthorized); Validation error for invalid search/filter/sort/pagination; Not found only if using invalid resource paths       |

### Get Activity Log by Identifier

| Field               | Value                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Purpose             | Return one Activity Log in the authenticated Company                                                      |
| HTTP Method         | `GET`                                                                                                     |
| URI                 | `/activity-logs/{activityLogId}`                                                                          |
| Required Request    | Authenticated Owner or Manager; Activity Log identifier                                                   |
| Successful Response | Single Activity Log with all required fields and optional related resource details                        |
| Possible Errors     | Unauthenticated; Forbidden; Not found (missing or other Company); Validation error for invalid identifier |

### Explicitly Unsupported

| Field               | Value                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Purpose             | Clarify that Activity Logs are not user-writable                                                    |
| HTTP Method         | `POST` / `PATCH` / `PUT` / `DELETE` on Activity Log resources                                       |
| URI                 | `/activity-logs` and `/activity-logs/{activityLogId}`                                               |
| Required Request    | N/A                                                                                                 |
| Successful Response | N/A                                                                                                 |
| Possible Errors     | Method not allowed / not supported — Activity Logs cannot be created, edited, or deleted by clients |

## Validation Rules

### Search validation

- Search field, when provided, MUST be one of: Employee Name, Transaction Number, Trip Number,
  Expense Number, User, Action (or an equivalent constrained set exposed by the contract).
- Search text, when provided, MUST be non-empty after trimming and within a reasonable maximum
  length.
- Unknown search fields MUST be rejected.

### Filter validation

- Module, Action, Activity Type, and User filters MUST use allowed values when provided.
- Date Range start MUST NOT be after Date Range end when both are provided.
- Date values MUST be valid calendar dates/times as accepted by the contract.
- Combining filters MUST apply as AND (all must match).

### Business validation

- Only Owners and Managers of the authenticated Company may access Activity Log resources.
- Results MUST be limited to the authenticated Company.
- Write operations against Activity Logs MUST be rejected.
- Sorting MUST be limited to Date, Module, and User (with direction when applicable).

## Business Rules

1. Activity Logs are generated automatically by the system when significant business actions
   succeed.
2. Activity Logs cannot be edited.
3. Activity Logs cannot be deleted by users.
4. Activity Logs belong to exactly one Company.
5. Only authorized users (Owner, Manager) may access Activity Logs.
6. Employees cannot access Activity Logs.
7. Activity Logs are excluded from operational workflows; they observe history, they do not drive
   create/update/settle behavior.
8. Activity Logs must not store or return secret credential values.
9. Related resource links are optional and informational for audit context.

## Acceptance Criteria

- **AC-001**: After each listed major business operation succeeds, a corresponding Activity Log
  exists for the Company with required fields populated.
- **AC-002**: Owners can list and open Activity Logs for their Company only.
- **AC-003**: Managers can list and open Activity Logs for their Company only.
- **AC-004**: Employees receive access denied for all Activity Log endpoints.
- **AC-005**: Search by Employee Name, Transaction Number, Trip Number, Expense Number, User,
  and Action returns only matching Company Activity Logs.
- **AC-006**: Filters by Module, Action, User, Date Range, and Activity Type correctly narrow
  results; invalid filters are rejected.
- **AC-007**: Sorting by Date, Module, and User works; default date ordering is newest first.
- **AC-008**: No client can successfully create, edit, or delete an Activity Log.
- **AC-009**: Cross-company Activity Log access never succeeds.
- **AC-010**: Password Changed / Password Reset Activity Logs never include password or
  temporary password values.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For 100% of the explicitly listed major business operations in this specification,
  a successful completion produces a corresponding Activity Log visible to authorized Company
  users.
- **SC-002**: Authorized users can locate a known Activity Log via search or filters in under
  1 minute during normal operational review.
- **SC-003**: 100% of Employee attempts to access Activity Logs are denied.
- **SC-004**: 100% of attempted client create/edit/delete operations on Activity Logs fail.
- **SC-005**: 0% of Activity Log responses expose another Company’s data.
- **SC-006**: 100% of Authentication password-related Activity Logs omit secret credential
  values.

## Assumptions

- Manager Company visibility for Activity Logs matches Owner visibility for this release
  (“according to permissions” interpreted as Owner/Manager allowed, Employee denied).
- Activity Logs are appended when the underlying business action succeeds; they are not a
  substitute for source-of-truth operational records.
- Pagination is available on list endpoints using the product’s standard list conventions.
- Default sort is Date and Time descending (newest first).
- “Activity Type” groups high-level categories (for example Authentication, Employee,
  Organization, Transactions, Trips, Expenses, Workforce) while “Action” names the specific
  event (for example Transaction Paid).
- Existing modules from P001–P009 and related addenda (including password management and
  employee account provisioning) are the producers of the events listed here.
- UI presentation of Activity Logs is out of scope beyond the API contracts.

## Future Considerations

Future versions may extend Activity Logs with:

- Field-level Change History
- Before/After Value Comparison
- Notifications
- Email Alerts
- Webhooks
- Compliance Reports
- Event Streaming

without redesigning the core Activity Log model (Company-scoped, immutable audit entries with
type/module/action/description/actor/time and optional related resources).
