# Feature Specification: P007 - Expense Management

**Feature Branch**: `[010-expense-management]`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Create Product Specification P007 - Expense Management for Scrappy."

## Vision

Provide a centralized Expense Management capability that records and tracks operational expenses
across the business.

Expenses capture costs incurred by a Company during day-to-day operations. They may occur
independently or be associated with exactly one operational context: Company, Branch, Warehouse,
Vehicle, or Trip.

Expense Management is a standalone operational module. It is independent from Transactions and
exists to support operational reporting, analytics, and future financial integrations without
redesigning core expense entities in later specifications.

**Purpose**:

- Introduce Expense as a first-class business entity for operational cost capture.
- Enable timed-in Employees to record field and operational expenses they incur.
- Enable Managers and Owners to oversee, correct, and reconcile Company-wide spending.
- Establish Expense Numbers for traceability across reports, analytics, and future integrations.
- Provide receipt photo attachments as supporting evidence for audit and dispute resolution.

**Scope**:

- Expense lifecycle: Draft, Recorded, Cancelled
- Expense header management (create, edit, view, list, search, filter, archive)
- Single mutually exclusive reference context per expense
- Multiple receipt photo attachments per expense
- Status transitions (record, cancel)
- Employee create/view own expenses; Manager/Owner company-wide management
- Expense and Expense Attachment API contracts and validation rules
- Integration points with Company, Branch, Warehouse, Vehicle, Trip (P006), and Workforce (P003)

**Non-goals**:

- Approval workflows, budget tracking, recurring expenses, vendor integration, or accounting
  integration (future specifications)
- Expense category catalog administration (future specification; MVP uses validated category text)
- Analytics dashboards or operational report implementation (P008/P009 consume expense data)
- Transaction linkage or settlement coupling (expenses are independent of transactions)
- Mobile application UI implementation (API contracts only)
- Redefining Company, User, Employee, Branch, Warehouse, Vehicle, Trip, or workforce rules from
  P001–P006

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Employee Records an Operational Expense (Priority: P1)

A timed-in Employee needs to create a Draft expense with date, category, amount, description, and
optional reference context so the Company has a record of operational spending.

**Why this priority**: Expense creation is the foundational capability; without it no other expense
features deliver value.

**Independent Test**: A timed-in Employee creates a Draft expense with required header fields and
optional reference; the expense receives a unique Expense Number and remains editable while Draft.

**Acceptance Scenarios**:

1. **Given** a timed-in Employee, **When** they create an expense with expense date, category,
   amount greater than zero, and description, **Then** a Draft expense is recorded within their
   Company with an assigned Expense Number.
2. **Given** a timed-in Employee, **When** they associate exactly one reference context (Company,
   Branch, Warehouse, Vehicle, or Trip), **Then** the expense stores the correct reference type
   and reference identifier (when applicable).
3. **Given** an Employee who is not timed in, **When** expense creation is attempted, **Then** the
   request is rejected.
4. **Given** a Draft expense created by an Employee, **When** the Employee views it, **Then** header
   fields, status, reference, and attachment summary are visible.

---

### User Story 2 - Employee Finalizes and Manages Own Draft Expenses (Priority: P2)

A timed-in Employee needs to edit their Draft expenses, attach receipt photos, and finalize them as
Recorded so spending is captured for management review.

**Why this priority**: Finalizing expenses moves operational costs from in-progress drafts into the
authoritative spending record used by reports and analytics.

**Independent Test**: An Employee edits their Draft expense, uploads receipt photos, records the
expense, and can no longer edit it; the expense appears in Company-wide lists for Managers.

**Acceptance Scenarios**:

1. **Given** a Draft expense created by an Employee, **When** the Employee updates category, amount,
   description, expense date, or reference, **Then** changes persist while status remains Draft.
2. **Given** a Draft expense, **When** the Employee attaches one or more receipt photos, **Then**
   photos are linked to that expense only.
3. **Given** a Draft expense owned by the Employee, **When** the Employee records it, **Then**
   status becomes Recorded and the expense becomes read-only for the Employee.
4. **Given** a Recorded expense, **When** the creating Employee attempts to edit it, **Then** the
   request is rejected.
5. **Given** another Employee's Draft expense, **When** edit is attempted by a non-Manager
   Employee, **Then** the request is rejected.

---

### User Story 3 - Manager Oversees Company Expenses (Priority: P3)

A Manager needs to view, search, filter, edit, record, cancel, and archive expenses across the
Company so operational spending can be managed and corrected.

**Why this priority**: Managers are accountable for Company-wide cost control and reconciliation.

**Independent Test**: A Manager lists all Company expenses with filters, edits a Recorded expense,
cancels an erroneous expense, and archives a closed expense; Employees see only their own expenses.

**Acceptance Scenarios**:

1. **Given** expenses exist across multiple Employees, **When** a Manager lists Company expenses,
   **Then** all non-archived expenses within the Company are returned according to filters.
2. **Given** a Recorded expense, **When** a Manager updates permitted header fields, **Then**
   changes are persisted while status remains Recorded.
3. **Given** a Draft or Recorded expense, **When** a Manager cancels it with a reason, **Then**
   status becomes Cancelled and the expense is immutable.
4. **Given** a Recorded or Cancelled expense, **When** a Manager archives it, **Then** it is
   excluded from default active lists but retrievable when explicitly requested.
5. **Given** any expense, **When** an Employee attempts Manager-only actions on another Employee's
   expense, **Then** the request is rejected.

---

### User Story 4 - Trip-Linked Field Expenses (Priority: P4)

A Manager or timed-in Employee needs to record expenses against an active or recently completed
field trip so trip operational costs are traceable.

**Why this priority**: Trip-linked expenses explain field spending and feed trip analytics and
reports introduced in P008/P009.

**Independent Test**: Expenses linked to Started and Completed trips are accepted; expenses linked to
Draft or Cancelled trips are rejected.

**Acceptance Scenarios**:

1. **Given** a Started trip, **When** a timed-in Employee creates an expense with Trip reference,
   **Then** the expense is accepted.
2. **Given** a Completed trip, **When** a Manager creates an expense with Trip reference, **Then**
   the expense is accepted (post-trip expense capture).
3. **Given** a Draft trip, **When** an expense with Trip reference is attempted, **Then** the
   request is rejected.
4. **Given** a Cancelled trip, **When** an expense with Trip reference is attempted, **Then** the
   request is rejected.
5. **Given** a trip belonging to another Company, **When** reference is attempted, **Then** the
   request is rejected.

---

### User Story 5 - Search and Filter by Expense Number (Priority: P5)

Managers and Owners need to locate expenses quickly by Expense Number, category, reference context,
date range, and status for reconciliation and audit.

**Why this priority**: Expense Numbers are the primary business identifier for operational spending.

**Independent Test**: A Manager searches by exact or partial Expense Number and filters by category
and date range; results respect Company scope and authorization.

**Acceptance Scenarios**:

1. **Given** expenses with assigned Expense Numbers, **When** a Manager searches by exact Expense
   Number, **Then** the matching expense is returned within Company scope.
2. **Given** multiple expenses, **When** a Manager filters by status Recorded and a date range,
   **Then** only matching expenses are returned.
3. **Given** an Expense Number belonging to another Company, **When** lookup is attempted, **Then**
   the expense is not found.

---

### Edge Cases

- What happens when amount is zero or negative? Rejected.
- What happens when multiple reference identifiers are supplied? Rejected (mutually exclusive).
- What happens when reference type is Branch but branch identifier is missing? Rejected.
- What happens when reference type is Company? No sub-reference identifier is required; Company
  context is implicit from tenant scope.
- What happens when a timed-in Employee times out after creating a Draft? Draft remains editable by
  the Employee when they time in again; Managers retain oversight.
- What happens when a referenced Branch, Warehouse, or Vehicle is archived after expense creation?
  Existing expenses remain readable; new expenses referencing archived entities are rejected.
- What happens when receipt photos are removed from a Draft expense? Allowed; photos cannot exist
  without a parent expense.
- What happens when cancel is attempted on a Cancelled expense? Rejected.
- What happens when record is attempted on a Recorded expense? Rejected.
- What happens when archive is attempted on a Draft expense? Rejected; Draft expenses should be
  recorded or cancelled first.
- What happens when an Employee attempts to view another Employee's expense? Rejected unless the
  caller is a Manager or Owner.

## Requirements _(mandatory)_

### Functional Requirements

#### Expense identity and numbering

- **FR-001**: Every expense MUST receive a unique Expense Number immediately upon creation.
- **FR-002**: Expense Numbers MUST use the format `EXP-YYYYMMDD-000001` where the six-digit suffix
  increments per Company per calendar day.
- **FR-003**: Expense Numbers MUST be unique within a Company.
- **FR-004**: Expense Numbers MUST never change once assigned.
- **FR-005**: Expense Numbers MUST be searchable and appear on reports and analytics.

#### Expense header

- **FR-006**: An expense MUST include Expense Number, expense date, category, amount, description,
  status, and Company ownership.
- **FR-007**: Amount MUST be greater than zero.
- **FR-008**: Description MUST be a non-empty human-readable text field within documented length
  limits.
- **FR-009**: Category MUST be a non-empty validated text value; predefined category catalog
  management is deferred to a future specification.
- **FR-010**: Each expense MUST belong to exactly one Company.
- **FR-011**: Each expense MUST record who created it and when for audit purposes.

#### Reference context

- **FR-012**: An expense MAY associate with exactly one operational reference context.
- **FR-013**: Supported reference types are Company, Branch, Warehouse, Vehicle, and Trip.
- **FR-014**: Reference types MUST be mutually exclusive; at most one reference type and its
  corresponding identifier (when required) MAY be set per expense.
- **FR-015**: When reference type is Company, no additional reference identifier is required beyond
  Company scope.
- **FR-016**: When reference type is Branch, Warehouse, Vehicle, or Trip, the referenced entity MUST
  exist within the same Company and be eligible for association.
- **FR-017**: Trip reference MUST be permitted only when the trip status is Started or Completed.
- **FR-018**: Trip reference MUST be rejected when the trip status is Draft or Cancelled.

#### Expense lifecycle — Draft

- **FR-019**: New expenses MUST begin in Draft status unless explicitly recorded in the same
  creation flow by authorized actors (creation defaults to Draft).
- **FR-020**: While Draft, the creating Employee MAY edit their own expense header, reference, and
  attachments.
- **FR-021**: While Draft, Managers and Owners MAY edit any Company expense header, reference, and
  attachments.
- **FR-022**: Draft expenses MUST NOT appear as finalized spending in analytics or reports until
  recorded (reports may optionally include Draft rows only when explicitly filtered; default
  operational views use Recorded expenses).

#### Expense lifecycle — Recorded

- **FR-023**: Recording MUST transition status from Draft to Recorded.
- **FR-024**: The creating Employee MAY record their own Draft expense.
- **FR-025**: Managers and Owners MAY record any Draft expense within the Company.
- **FR-026**: Once Recorded, the creating Employee MUST NOT edit the expense.
- **FR-027**: Once Recorded, Managers and Owners MAY edit permitted header fields, reference, and
  attachments unless the expense is Cancelled or archived.
- **FR-028**: Recorded expenses MUST be included in expense analytics and expense reports per
  P008/P009 consumption rules.

#### Expense lifecycle — Cancelled

- **FR-029**: Cancellation MUST transition status to Cancelled from Draft or Recorded.
- **FR-030**: The creating Employee MAY cancel their own Draft expense.
- **FR-031**: Managers and Owners MAY cancel any Draft or Recorded expense within the Company.
- **FR-032**: Cancelled expenses MUST be immutable (no edits, no re-record, no new attachments).
- **FR-033**: Cancelled expenses MUST be excluded from operational spending totals unless a report
  explicitly includes cancelled rows for audit.

#### Attachments

- **FR-034**: An expense MUST support multiple attachments.
- **FR-035**: The MVP MUST support receipt photos as the primary attachment type.
- **FR-036**: Attachments MUST belong to exactly one expense and MUST NOT exist without a parent
  expense.
- **FR-037**: Receipt photos MAY be added, listed, and removed while the expense is Draft.
- **FR-038**: Managers and Owners MAY add or remove receipt photos on Recorded expenses unless the
  expense is Cancelled.
- **FR-039**: Future specifications MAY add additional document types without redesigning the
  attachment association model.

#### Workforce and authorization

- **FR-040**: Only timed-in Employees MAY create expenses.
- **FR-041**: Employees MAY view only expenses they created unless they hold Manager or Owner role.
- **FR-042**: Employees MAY edit only their own Draft expenses.
- **FR-043**: Employees MUST NOT edit, record, cancel, or archive another Employee's expenses.
- **FR-044**: Managers MUST be able to create, view, edit, record, cancel, archive, list, search,
  and filter all Company expenses.
- **FR-045**: Owners MUST have unrestricted access to all expense operations within their Company.
- **FR-046**: Cross-company access MUST be rejected for all expense operations.

#### Discovery and archive

- **FR-047**: Authorized users MUST be able to list expenses with pagination, sorting, and filters
  (status, category, reference type, reference identifiers, expense date range, Expense Number
  search).
- **FR-048**: Default list views MUST sort by expense date descending unless otherwise specified.
- **FR-049**: Archive MUST be permitted only for Recorded or Cancelled expenses.
- **FR-050**: Archived expenses MUST be excluded from default active lists but retrievable when
  explicitly requested.
- **FR-051**: Employees MUST NOT archive expenses unless future policy extends archive rights;
  archive is a Manager and Owner capability in this specification.

#### Cross-cutting

- **FR-052**: P007 MUST integrate with Trip lifecycle rules from P006 without redefining trip
  status transitions.
- **FR-053**: P007 MUST integrate with Workforce attendance rules from P003 (timed-in requirement)
  without redefining attendance sessions.
- **FR-054**: P007 MUST integrate with Organization entities from P002 (Branch, Warehouse, Vehicle)
  for reference validation without redefining org lifecycle.
- **FR-055**: All expense status changes (record, cancel, archive) MUST be auditable (who acted and
  when).
- **FR-056**: Expense data MUST be consumable by Analytics (P008) and Reports (P009) using Expense
  Number, category, amount, reference dimensions, and expense date without schema redesign.

### Key Entities _(include if feature involves data)_

- **Expense**: A Company-scoped operational cost record with immutable Expense Number, expense date,
  category, amount, description, status (Draft, Recorded, Cancelled), optional single reference
  context, creator identity, and audit timestamps.
- **Expense Number**: Business identifier assigned at creation; encodes date and daily sequence
  within Company.
- **Expense Reference**: Logical association to exactly one of Company, Branch, Warehouse, Vehicle,
  or Trip for dimensional reporting.
- **Expense Attachment**: Receipt photo evidence linked to one expense; supports multiple
  attachments per expense in MVP.

### API Contracts

All endpoints use the standard API response structure established in P001. Protected endpoints
require authenticated Company-bound access. Errors include validation failures, unauthenticated
access, forbidden role actions, not found, duplicate resource conflicts, and business rule or
lifecycle conflicts.

#### Expenses

- **Create Expense**
  - Purpose: Create a Draft expense with header and optional reference context.
  - Method: `POST`
  - URI: `/api/v1/expenses`
  - Request: expense date, category, amount, description, reference type, optional reference
    identifier (when required by type), optional flag to record immediately (Manager/Owner only).
  - Response: Expense detail including assigned Expense Number and status Draft (or Recorded when
    immediately finalized by authorized actor).
  - Errors: not timed in (Employee), validation error, reference not found, trip not eligible,
    forbidden, cross-company violation.

- **Update Expense**
  - Purpose: Edit expense header and reference while permitted by status and role.
  - Method: `PATCH`
  - URI: `/api/v1/expenses/{expenseId}`
  - Request: at least one mutable field (expense date, category, amount, description, reference type
    and identifier).
  - Response: Updated expense detail.
  - Errors: not found, not editable status, forbidden (Employee editing non-own or Recorded),
    validation error, reference conflict, trip not eligible.

- **Get Expense**
  - Purpose: Retrieve expense detail including header, reference summary, attachment list, and audit
    metadata.
  - Method: `GET`
  - URI: `/api/v1/expenses/{expenseId}`
  - Request: expense identifier.
  - Response: Expense detail.
  - Errors: not found, forbidden (Employee viewing non-own), cross-company violation.

- **List Expenses**
  - Purpose: List expenses within authorization scope with search and filters.
  - Method: `GET`
  - URI: `/api/v1/expenses`
  - Request: pagination (`page`, `limit`), sort (`sortBy` including expense date and Expense Number,
    `sortOrder`), filters for status, category, reference type, branch, warehouse, vehicle, trip,
    expense date range, Expense Number search (exact or partial), include archived flag.
  - Response: Paginated collection of expense summaries.
  - Errors: unauthenticated, forbidden, validation error on filters.

- **List My Expenses (Employee)**
  - Purpose: List expenses created by the authenticated Employee.
  - Method: `GET`
  - URI: `/api/v1/expenses/mine`
  - Request: pagination, optional status filter, optional date range.
  - Response: Paginated collection of the caller's expenses.
  - Errors: unauthenticated, forbidden (no linked employee profile).

- **Get Expense by Expense Number**
  - Purpose: Direct lookup for reconciliation and support.
  - Method: `GET`
  - URI: `/api/v1/expenses/by-number/{expenseNumber}`
  - Request: Expense Number path parameter.
  - Response: Expense detail within authorization scope.
  - Errors: not found, forbidden, cross-company violation.

- **Archive Expense**
  - Purpose: Soft-archive a Recorded or Cancelled expense.
  - Method: `POST`
  - URI: `/api/v1/expenses/{expenseId}/archive`
  - Request: optional archive reason.
  - Response: Archived expense detail.
  - Errors: not found, not archivable status, forbidden, lifecycle conflict.

#### Expense attachments

- **Add Attachment**
  - Purpose: Attach a receipt photo to an editable expense.
  - Method: `POST`
  - URI: `/api/v1/expenses/{expenseId}/attachments`
  - Request: photo content reference or upload payload per API standards.
  - Response: Created attachment metadata.
  - Errors: not editable status, validation error, forbidden, not found, cancelled expense.

- **List Attachments**
  - Purpose: List receipt photos for an expense.
  - Method: `GET`
  - URI: `/api/v1/expenses/{expenseId}/attachments`
  - Request: expense identifier.
  - Response: Collection of attachment metadata.
  - Errors: not found, forbidden.

- **Remove Attachment**
  - Purpose: Remove a receipt photo from an editable expense.
  - Method: `DELETE`
  - URI: `/api/v1/expenses/{expenseId}/attachments/{attachmentId}`
  - Request: none.
  - Response: Confirmation of removal.
  - Errors: not editable status, not found, forbidden, cancelled expense.

#### Expense status

- **Record Expense**
  - Purpose: Transition Draft to Recorded and finalize spending.
  - Method: `POST`
  - URI: `/api/v1/expenses/{expenseId}/record`
  - Request: optional record note for audit.
  - Response: Expense detail with status Recorded.
  - Errors: not found, not Draft, forbidden (Employee recording non-own), validation error,
    incomplete required fields.

- **Cancel Expense**
  - Purpose: Transition Draft or Recorded to Cancelled.
  - Method: `POST`
  - URI: `/api/v1/expenses/{expenseId}/cancel`
  - Request: required cancellation reason.
  - Response: Expense detail with status Cancelled.
  - Errors: not found, already Cancelled, forbidden, lifecycle conflict.

### Validation Rules

#### Expense validation

- Expense date MUST be a valid date (and optional time if supported by API contract).
- Category MUST be a non-empty string within documented length limits.
- Amount MUST be a positive monetary value greater than zero.
- Description MUST be a non-empty string within documented length limits.
- Expense Number is system-assigned; clients MUST NOT supply it on create.
- Status MUST be one of Draft, Recorded, or Cancelled; clients MUST NOT set status directly except
  through record and cancel operations.

#### Reference validation

- Exactly one reference type MUST be selected per expense.
- When reference type is Company, reference identifier MUST NOT be supplied.
- When reference type is Branch, a valid branch identifier within the Company MUST be supplied.
- When reference type is Warehouse, a valid warehouse identifier within the Company MUST be supplied.
- When reference type is Vehicle, a valid vehicle identifier within the Company MUST be supplied.
- When reference type is Trip, a valid trip identifier within the Company MUST be supplied and the
  trip MUST be Started or Completed.
- Supplying identifiers for more than one reference dimension MUST be rejected.
- Referenced entities MUST belong to the same Company as the expense.

#### Attachment validation

- At least one attachment SHOULD be encouraged for Recorded expenses but MUST NOT be mandatory in
  MVP unless business policy is extended later.
- Attachment content MUST meet documented size and format limits for receipt photos.
- Attachment MUST reference a parent expense that exists and is not Cancelled when adding.
- Removing the last attachment from a Draft expense MUST be allowed.

#### Status validation

| From      | To        | Allowed actors                     |
| --------- | --------- | ---------------------------------- |
| Draft     | Recorded  | Creator (Employee), Manager, Owner |
| Draft     | Cancelled | Creator (Employee), Manager, Owner |
| Recorded  | Cancelled | Manager, Owner                     |
| Cancelled | (none)    | terminal                           |

- Record MUST require status Draft and all mandatory header fields valid.
- Cancel MUST require status Draft or Recorded.
- Edit MUST require status Draft for Employees (own expenses only).
- Edit MUST require status Draft or Recorded for Managers and Owners.
- Cancelled expenses MUST reject all mutations except read and archive.
- Archive MUST require status Recorded or Cancelled.

#### Business validation

- Create MUST require the caller to be timed in when the caller is an Employee.
- Managers and Owners MAY create expenses without timed-in requirement.
- Trip reference MUST reject Draft and Cancelled trips.
- Archived reference entities MUST reject new expense association.
- Cancelled expenses MUST be immutable.
- Expense Number MUST remain immutable for the life of the expense.

### Business Constraints

- Expense Number is immutable.
- Amount must be greater than zero.
- Reference must exist within Company scope when an identifier is required.
- Reference type determines the allowed reference identifier shape.
- Attachments belong only to expenses.
- Only Draft expenses may be edited by Employees (own expenses only).
- Managers and Owners may edit Recorded expenses when not Cancelled or archived.
- Cancelled expenses cannot be modified.
- Only one operational reference context per expense.
- Expenses are independent from transactions; no transaction identifier on expense in this
  specification.

### Acceptance Criteria

- A timed-in Employee can create a Draft expense with category, amount, and description and receive
  a unique Expense Number in a single flow.
- An Employee can attach receipt photos, edit their Draft, and record it; after recording they cannot
  edit the expense.
- A Manager can list all Company expenses with pagination sorted by expense date descending.
- A Manager can edit a Recorded expense and cancel an erroneous expense with a reason.
- Expenses linked to Started and Completed trips are accepted; Draft and Cancelled trip references
  are rejected.
- Employees who are not timed in cannot create expenses.
- Employees cannot view or modify another Employee's expenses.
- Expense search by Expense Number returns the correct expense within Company scope for authorized
  users.
- 100% of expense status transitions (record, cancel, archive) record the acting user and timestamp
  for audit.
- Recorded expenses appear in expense report and analytics consumption paths defined in P008/P009.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A timed-in Employee can create and record a complete expense (header, reference,
  receipt photo) in under 3 minutes using the API contract flows.
- **SC-002**: Managers can retrieve a paginated Company expense list sorted by expense date within
  2 seconds under normal operating load.
- **SC-003**: 100% of expenses linked to trips reference only Started or Completed trips in
  production data (trip eligibility rules enforced).
- **SC-004**: Employees see only their own expenses on first request; Managers see Company-wide
  expenses without manual filtering workarounds.
- **SC-005**: Expense Number lookup by exact match returns the correct expense for authorized users
  in under 2 seconds under normal load.
- **SC-006**: 95% of operational expense capture scenarios (create → attach receipt → record) complete
  without manual workaround once clients adopt the expense workflow.
- **SC-007**: After P007 delivery, expense analytics and expense reports return non-zero rows when
  Recorded expenses exist (P008/P009 integration validated).

## Assumptions

- Expense category values are free-form validated text in MVP; a future specification will introduce
  managed category catalogs without redesigning the Expense entity.
- Receipt photos follow the same upload and metadata patterns established for transaction photos in
  P004 unless a dedicated attachment standard is introduced during planning.
- Company reference type represents Company-wide operational spending not tied to a sub-entity.
- Managers and Owners are not required to be timed in to create or manage expenses.
- Default list sort is expense date descending to match frontend integration expectations.
- Archive is a soft-delete visibility control; Cancelled is a business status indicating the expense
  must not count toward operational totals.
- P008 Analytics and P009 Reports already define expense consumption contracts; P007 populates the
  underlying operational data without changing those read contracts.
- Currency is single-currency per Company; multi-currency support is out of scope.

## Future Considerations

Future specifications may extend Expenses with:

- Approval workflow (submit → approve → record)
- Budget tracking and threshold alerts
- Recurring expenses and scheduled capture
- Vendor integration and vendor master data
- Accounting integration and journal export
- Expense categories management (administered category catalog)

These extensions MUST attach to the existing Expense model (Expense Number, lifecycle, single
reference context, attachments) without redesigning the core Expense aggregate.

Future specifications will integrate Expenses with:

- **Analytics (P008)** — populate expense totals, category breakdowns, and dimensional rankings.
- **Reports (P009)** — populate line-level expense report rows and exports.
- **Trips (P006)** — continue trip-linked expense capture under Started and Completed rules.
