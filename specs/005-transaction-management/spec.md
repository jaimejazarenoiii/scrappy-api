# Feature Specification: P004 - Transaction Management (Foundation)

**Feature Branch**: `[005-transaction-management]`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Create Product Specification P004 - Transaction Management (Foundation) for Scrappy."

## Vision

Transaction Management introduces the core operational module of Scrappy: recording every buying and
selling activity performed by a Company. A Transaction captures who was involved, where it occurred,
what materials changed hands, supporting evidence through photos, and operational direction
(Buy/Sell).

**Purpose**:

- Provide a unified transaction system for all operational buying and selling within a Company.
- Enable timed-in Employees to create and manage draft transactions assigned to them.
- Enable Managers and Owners to oversee and manage draft transactions across the Company.
- Establish the transaction data foundation for future Payment, Settlement, Trips, Expenses, and
  Analytics without redesigning core transaction entities in later specifications.

**Scope**:

- Transaction creation, editing, viewing, listing, searching, filtering, and archiving
- Transaction header (direction, status, party, date/time, location, assigned employees, notes)
- Unlimited transaction items (material, weight, unit, price, total, notes)
- Multiple transaction photos per transaction
- Draft and Cancelled statuses only
- Auto-save as Draft after inactivity or when leaving the transaction screen
- Material name and price suggestions from Company history

**Non-goals**:

- Payment workflow, approval workflow, and settlement (P005)
- Ready for Payment and Paid transaction statuses (P005)
- Trip requirement enforcement for Outside transactions (P006; Trip link is optional in P004)
- Expense recording, receipts generation, and analytics dashboards
- Mobile application UI implementation (API contracts only)
- Redefining Company, User, Employee, Branch, Warehouse, or workforce rules from P001–P003

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Employee Creates a Draft Transaction (Priority: P1)

A timed-in Employee needs to create a Buy or Sell transaction with at least one item, assign
themselves and other Employees, set location details, and save it as Draft so the Company has a
record of the operational activity.

**Why this priority**: Transaction creation is the foundational capability; without it no other
transaction features deliver value.

**Independent Test**: A timed-in Employee creates a Draft transaction with header fields, one or
more items, and optional photos; the transaction is retrievable and remains editable.

**Acceptance Scenarios**:

1. **Given** a timed-in Employee, **When** they create a transaction with direction Buy or Sell and
   at least one item, **Then** a Draft transaction is recorded within their Company.
2. **Given** a timed-in Employee creating a transaction, **When** they assign multiple Employees,
   **Then** all assigned Employees are linked to the transaction.
3. **Given** a timed-in Employee, **When** they set location type Branch, Warehouse, or Outside
   with required location fields, **Then** the transaction stores the correct location context.
4. **Given** an Employee who is not timed in, **When** transaction creation is attempted, **Then**
   the request is rejected.

---

### User Story 2 - Draft Editing and Auto-Save (Priority: P2)

An Employee or authorized Manager/Owner needs draft transactions to remain editable and to
auto-save as Draft without explicit save actions so work is not lost during data entry.

**Why this priority**: Draft editing and auto-save protect operational data integrity during
field use and reduce lost work.

**Independent Test**: A Draft transaction is updated after auto-save triggers; changes persist and
status remains Draft.

**Acceptance Scenarios**:

1. **Given** a Draft transaction assigned to an Employee, **When** the Employee edits header or item
   fields, **Then** changes are persisted while status remains Draft.
2. **Given** a user editing a transaction, **When** five seconds pass without further input, **Then**
   the transaction auto-saves as Draft transparently.
3. **Given** a user editing a transaction, **When** they leave the transaction screen, **Then** the
   transaction auto-saves as Draft.
4. **Given** a Cancelled transaction, **When** an edit is attempted, **Then** the request is
   rejected.

---

### User Story 3 - View, List, Search, and Filter Transactions (Priority: P3)

Employees need to view transactions assigned to them. Managers and Owners need to view all Company
transactions with search and filter capabilities.

**Why this priority**: Operational visibility is required to review and continue work on drafts.

**Independent Test**: Employees see only assigned transactions; Managers/Owners see Company-wide
lists with direction, status, date, and location filters.

**Acceptance Scenarios**:

1. **Given** transactions exist, **When** an Employee requests their assigned transactions, **Then**
   only transactions where they are assigned are returned.
2. **Given** transactions exist, **When** a Manager or Owner lists Company transactions, **Then** all
   non-archived transactions within the Company are returned according to filters.
3. **Given** search criteria (party name, material name, notes), **When** a list is requested,
   **Then** matching transactions within authorization scope are returned.
4. **Given** filter criteria (direction, status, location type, date range), **When** a list is
   requested, **Then** results respect all applied filters.

---

### User Story 4 - Transaction Items Management (Priority: P4)

Users need to add, update, and remove unlimited items on a Draft transaction, with per-item
material, weight, unit, price, total, and notes.

**Why this priority**: Items carry the material and commercial substance of every transaction.

**Independent Test**: Items are added, updated, and removed on a Draft transaction; item totals
reflect weight, unit, and price rules.

**Acceptance Scenarios**:

1. **Given** a Draft transaction, **When** items are added, **Then** each item is linked to that
   transaction only.
2. **Given** a Draft transaction with items, **When** an item is updated, **Then** the item fields
   and computed total are persisted.
3. **Given** a Draft transaction, **When** an item is removed, **Then** the item no longer
   appears on the transaction.
4. **Given** a Cancelled transaction, **When** item mutation is attempted, **Then** the request is
   rejected.

---

### User Story 5 - Transaction Photos (Priority: P5)

Users need to attach multiple photos to a transaction as supporting evidence of the operational
activity.

**Why this priority**: Photos support auditability and dispute resolution for material transactions.

**Independent Test**: Multiple photos are uploaded, listed, and removed from a Draft transaction;
photos cannot exist without a parent transaction.

**Acceptance Scenarios**:

1. **Given** a Draft transaction, **When** photos are added, **Then** each photo is linked to that
   transaction within the Company.
2. **Given** a transaction with photos, **When** photos are listed, **Then** all photos for that
   transaction within authorization scope are returned.
3. **Given** a Draft transaction, **When** a photo is removed, **Then** it no longer appears on the
   transaction.
4. **Given** no parent transaction, **When** a photo upload is attempted, **Then** the request is
   rejected.

---

### User Story 6 - Material and Price Suggestions (Priority: P6)

When entering transaction items, users need suggestions for material names and prices based on
previously used values within the same Company to speed data entry while allowing free-form entry.

**Why this priority**: Suggestions improve speed and consistency but are not required for core
recording.

**Independent Test**: Suggestions return prior Company material names and prices; users can still
enter new values.

**Acceptance Scenarios**:

1. **Given** prior transactions with material names in a Company, **When** a user requests material
   suggestions matching partial input, **Then** previously used material names within that Company
   are returned.
2. **Given** a selected or entered material name, **When** price suggestions are requested, **Then**
   previously used prices for that material within the Company are returned.
3. **Given** suggestions are shown, **When** the user enters a new material or price, **Then** the
   new values are accepted on save.

---

### User Story 7 - Cancel and Archive Transactions (Priority: P7)

Authorized users need to cancel draft transactions that should not proceed, and archive
transactions that should be excluded from default operational lists while retaining history.

**Why this priority**: Lifecycle management prevents stale drafts from cluttering operations while
preserving audit history.

**Independent Test**: A Draft transaction is cancelled and becomes read-only; a transaction is
archived and excluded from default lists.

**Acceptance Scenarios**:

1. **Given** a Draft transaction, **When** an authorized user cancels it, **Then** status becomes
   Cancelled and the transaction becomes read-only.
2. **Given** a Draft transaction, **When** a Manager or Owner archives it, **Then** it is excluded
   from default transaction lists but remains retrievable when explicitly requested.
3. **Given** a Cancelled transaction, **When** cancel or edit is attempted again, **Then** the
   request is rejected.

---

### Role Expectations

#### Employee

- May create transactions only when timed in.
- May create, edit, and view Draft transactions assigned to them.
- May add, update, and remove items and photos on assigned Draft transactions.
- May cancel assigned Draft transactions.
- May view material and price suggestions within their Company.
- May not edit transactions not assigned to them unless acting as Manager/Owner.
- May not view unassigned Company-wide transactions.

#### Manager

- Has all Employee capabilities when assigned to a transaction.
- May view all Company transactions (subject to filters).
- May edit any Draft transaction within the Company.
- May cancel and archive Draft transactions within the Company.
- May manage items and photos on any Company Draft transaction.

#### Owner

- Has full transaction management access for the Company, equivalent to Manager capabilities with
  no additional restrictions defined in P004.

---

### Edge Cases

- What happens when an Employee attempts to create a transaction while not timed in?
- What happens when a Draft transaction has zero items and completeness is evaluated?
- How does the system handle Branch location type without a valid Branch in the Company?
- How does the system handle Warehouse location type without a valid Warehouse in the Company?
- What happens when Outside location is selected without required outside name or address?
- What happens when an Employee attempts to edit a transaction they are not assigned to?
- What happens when auto-save runs concurrently with an explicit edit?
- How are duplicate material suggestions ordered when many historical matches exist?
- What happens when a Manager attempts to access a transaction from another Company?
- What happens when all assigned Employees are removed from a Draft transaction?
- How does the system behave when a photo upload exceeds allowed size or format limits?

## Requirements _(mandatory)_

### Functional Requirements

#### Transaction lifecycle

- **FR-001**: The system MUST allow timed-in Employees to create transactions within their Company.
- **FR-002**: The system MUST support transaction direction as Inbound or Outbound, presented to
  users as Buy or Sell respectively.
- **FR-003**: The system MUST support transaction statuses Draft and Cancelled only in P004.
- **FR-004**: The system MUST allow creation of transactions that auto-save as Draft.
- **FR-005**: The system MUST allow editing of Draft transactions according to role and assignment
  rules.
- **FR-006**: The system MUST make Cancelled transactions read-only.
- **FR-007**: The system MUST support archiving transactions to exclude them from default lists
  while retaining historical access.
- **FR-008**: The system MUST allow viewing a single transaction within authorization scope.
- **FR-009**: The system MUST allow listing, searching, and filtering transactions within
  authorization scope.

#### Transaction header

- **FR-010**: Every transaction MUST capture direction, status, party name, optional party contact
  number, transaction date and time, assigned employees, location type, location details, and
  optional notes.
- **FR-011**: Location type MUST be Branch, Warehouse, or Outside.
- **FR-012**: When location type is Branch, a Branch within the Company MUST be specified.
- **FR-013**: When location type is Warehouse, a Warehouse within the Company MUST be specified.
- **FR-014**: When location type is Outside, outside location name and outside address MUST be
  specified.
- **FR-015**: A transaction MAY reference zero or one Trip; Trip is optional in P004.
- **FR-016**: A transaction MUST support multiple assigned Employees within the same Company.
- **FR-017**: Every transaction MUST be created by exactly one User and belong to exactly one
  Company.

#### Transaction items

- **FR-018**: A transaction MUST support unlimited items in P004.
- **FR-019**: Each item MUST include material name, weight, unit, price, total, and optional notes.
- **FR-020**: Items MUST NOT exist without a parent transaction.
- **FR-021**: Items on Draft transactions MUST be addable, updatable, and removable by authorized
  users.
- **FR-022**: A transaction MUST contain at least one item before it can be considered complete
  for operational handoff to future payment workflows.

#### Transaction photos

- **FR-023**: A transaction MUST support multiple photos.
- **FR-024**: Photos MUST NOT exist without a parent transaction.
- **FR-025**: Photos on Draft transactions MUST be addable and removable by authorized users.

#### Auto-save

- **FR-026**: The system MUST auto-save transactions as Draft after five seconds of user inactivity
  during editing.
- **FR-027**: The system MUST auto-save transactions as Draft when the user leaves the transaction
  screen.
- **FR-028**: Auto-save MUST be transparent to the user and MUST NOT change status away from Draft
  unless an explicit cancel action occurs.

#### Suggestions

- **FR-029**: The system MUST provide material name suggestions from previously used material names
  within the same Company when entering item material name.
- **FR-030**: The system MUST provide price suggestions from previously used prices for a material
  within the same Company when requested.
- **FR-031**: Users MUST be able to enter material names and prices not present in suggestions.

#### Authorization

- **FR-032**: Employees MUST only edit Draft transactions assigned to them.
- **FR-033**: Managers and Owners MUST be able to edit any Draft transaction within their Company.
- **FR-034**: Employees MUST only view transactions assigned to them unless acting as Manager or
  Owner.
- **FR-035**: Managers and Owners MUST view all Company transactions within authorization scope.
- **FR-036**: Cross-company transaction access MUST be rejected.

#### Workforce readiness

- **FR-037**: Only timed-in Employees MUST be eligible to create transactions, consistent with P003
  operational readiness rules.

#### Cross-cutting

- **FR-038**: P004 MUST integrate with Company, Employee, Branch, and Warehouse from P001/P002
  without redefining those entities.
- **FR-039**: Archived transactions MUST be excluded from default operational list queries.

### API Contracts

All endpoints use the standard API response structure established in P001. Protected endpoints
require authenticated Company-bound access. Errors include validation failures, unauthorized
access, forbidden role actions, not found, and business rule conflicts.

#### Transactions

- **Create Transaction**
  - Purpose: Create a new Draft transaction for the authenticated timed-in Employee.
  - Method: `POST`
  - URI: `/api/v1/transactions`
  - Request: direction (`BUY`/`SELL` or `INBOUND`/`OUTBOUND`), party name, optional party contact,
    transaction date/time, location type and location fields, assigned employee identifiers,
    optional notes, optional trip identifier, optional initial items.
  - Response: Created Draft transaction with header summary.
  - Errors: not timed in, validation error, invalid branch/warehouse, forbidden, cross-company
    violation.

- **Auto-Save / Update Transaction**
  - Purpose: Update a Draft transaction (including auto-save payloads).
  - Method: `PATCH`
  - URI: `/api/v1/transactions/{transactionId}`
  - Request: at least one mutable header field.
  - Response: Updated Draft transaction.
  - Errors: not found, not draft, cancelled, forbidden, assignment violation, validation error.

- **View Transaction**
  - Purpose: Retrieve one transaction with header, items, and photo references.
  - Method: `GET`
  - URI: `/api/v1/transactions/{transactionId}`
  - Request: transaction identifier.
  - Response: Transaction detail.
  - Errors: not found, forbidden, cross-company violation.

- **List Transactions**
  - Purpose: List transactions within authorization scope with pagination, search, and filters.
  - Method: `GET`
  - URI: `/api/v1/transactions`
  - Request: optional filters for direction, status, location type, branch, warehouse, assigned
    employee, date range, search text, include archived flag.
  - Response: Paginated collection of transactions.
  - Errors: unauthenticated, forbidden, validation error on filters.

- **List My Assigned Transactions**
  - Purpose: List transactions assigned to the authenticated Employee.
  - Method: `GET`
  - URI: `/api/v1/transactions/assigned`
  - Request: optional filters and pagination.
  - Response: Paginated collection of assigned transactions.
  - Errors: unauthenticated, forbidden, no linked employee profile.

- **Cancel Transaction**
  - Purpose: Mark a Draft transaction as Cancelled.
  - Method: `POST`
  - URI: `/api/v1/transactions/{transactionId}/cancel`
  - Request: optional cancellation reason.
  - Response: Cancelled transaction.
  - Errors: not found, not draft, already cancelled, forbidden.

- **Archive Transaction**
  - Purpose: Archive a transaction and exclude it from default lists.
  - Method: `POST`
  - URI: `/api/v1/transactions/{transactionId}/archive`
  - Request: none.
  - Response: Archived transaction metadata.
  - Errors: not found, forbidden, lifecycle conflict.

#### Transaction items

- **Add Item**
  - Purpose: Add an item to a Draft transaction.
  - Method: `POST`
  - URI: `/api/v1/transactions/{transactionId}/items`
  - Request: material name, weight, unit, price, optional notes.
  - Response: Created item with computed total.
  - Errors: not draft, validation error, forbidden, not found.

- **Update Item**
  - Purpose: Update an item on a Draft transaction.
  - Method: `PATCH`
  - URI: `/api/v1/transactions/{transactionId}/items/{itemId}`
  - Request: at least one mutable item field.
  - Response: Updated item.
  - Errors: not draft, not found, validation error, forbidden.

- **Remove Item**
  - Purpose: Remove an item from a Draft transaction.
  - Method: `DELETE`
  - URI: `/api/v1/transactions/{transactionId}/items/{itemId}`
  - Request: none.
  - Response: Confirmation of removal.
  - Errors: not draft, not found, forbidden.

- **List Items**
  - Purpose: List items for a transaction.
  - Method: `GET`
  - URI: `/api/v1/transactions/{transactionId}/items`
  - Request: transaction identifier.
  - Response: Collection of items.
  - Errors: not found, forbidden.

#### Transaction photos

- **Add Photo**
  - Purpose: Attach a photo to a Draft transaction.
  - Method: `POST`
  - URI: `/api/v1/transactions/{transactionId}/photos`
  - Request: photo content reference or upload payload per API standards.
  - Response: Created photo metadata.
  - Errors: not draft, validation error, forbidden, not found.

- **List Photos**
  - Purpose: List photos for a transaction.
  - Method: `GET`
  - URI: `/api/v1/transactions/{transactionId}/photos`
  - Request: transaction identifier.
  - Response: Collection of photo metadata.
  - Errors: not found, forbidden.

- **Remove Photo**
  - Purpose: Remove a photo from a Draft transaction.
  - Method: `DELETE`
  - URI: `/api/v1/transactions/{transactionId}/photos/{photoId}`
  - Request: none.
  - Response: Confirmation of removal.
  - Errors: not draft, not found, forbidden.

#### Suggestions

- **Material Name Suggestions**
  - Purpose: Return material name suggestions for the Company.
  - Method: `GET`
  - URI: `/api/v1/transactions/suggestions/materials`
  - Request: optional search prefix, pagination.
  - Response: List of suggested material names.
  - Errors: unauthenticated, forbidden.

- **Price Suggestions**
  - Purpose: Return price suggestions for a material within the Company.
  - Method: `GET`
  - URI: `/api/v1/transactions/suggestions/prices`
  - Request: material name, optional pagination.
  - Response: List of suggested prices.
  - Errors: unauthenticated, forbidden, validation error.

### Validation Rules

#### Transaction validation

- Direction MUST be valid (`INBOUND`/`OUTBOUND` or user-facing `BUY`/`SELL` mapped consistently).
- Status MUST be `DRAFT` or `CANCELLED` in P004.
- Party name MUST be provided and non-empty.
- Party contact number MAY be optional but MUST meet format limits when provided.
- Transaction date and time MUST be valid and not unreasonably in the future.
- Location type MUST be `BRANCH`, `WAREHOUSE`, or `OUTSIDE`.
- Branch identifier REQUIRED when location type is Branch and MUST belong to the Company.
- Warehouse identifier REQUIRED when location type is Warehouse and MUST belong to the Company.
- Outside location name and address REQUIRED when location type is Outside.
- At least one assigned Employee REQUIRED on create; all assigned Employees MUST belong to the
  Company.
- Trip identifier MAY be optional; when provided it MUST belong to the Company when Trip module
  exists.

#### Item validation

- Material name MUST be non-empty.
- Weight MUST be a positive numeric value.
- Unit MUST be a supported unit of measure.
- Price MUST be a non-negative numeric value.
- Total MUST equal weight multiplied by price unless business rules define rounding; mismatches
  MUST be rejected or normalized consistently.
- Notes MAY be optional with length limits.

#### Photo validation

- At least one photo file reference REQUIRED per add request.
- Supported formats and maximum size MUST be enforced at the API boundary.
- Photo MUST belong to the same Company as the parent transaction.

#### Business validation

- Only timed-in Employees MAY create transactions.
- Only Draft transactions MAY be edited.
- Cancelled transactions MUST NOT be modified.
- Employees MAY edit only assigned Draft transactions.
- Managers and Owners MAY edit any Company Draft transaction.
- Items and photos MUST NOT be mutated on Cancelled transactions.
- A transaction without items MUST NOT be marked complete for downstream payment handoff.
- Cross-company access MUST be rejected on all operations.

### Key Entities

- **Transaction**: A buying or selling operational record for one Company with direction, status,
  party details, date/time, location context, assigned employees, optional trip link, notes, and
  audit metadata.
- **Transaction Item**: A line item on a transaction describing material, quantity, unit, price,
  total, and optional notes.
- **Transaction Photo**: Supporting image evidence attached to a transaction.
- **Material Suggestion**: A read model of previously used material names within a Company.
- **Price Suggestion**: A read model of previously used prices for a material within a Company.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Timed-in Employees can create a Draft transaction with at least one item in under 60
  seconds in at least 95% of tested scenarios.
- **SC-002**: Employees who are not timed in are blocked from creating transactions in 100% of
  readiness validation scenarios.
- **SC-003**: Auto-save persists Draft changes within five seconds of inactivity in 100% of
  auto-save test scenarios.
- **SC-004**: Employees can view only assigned transactions in 100% of authorization test
  scenarios.
- **SC-005**: Managers and Owners can list and filter all Company transactions without
  cross-company data exposure in 100% of tenant isolation scenarios.
- **SC-006**: Cancelled transactions reject further edits in 100% of lifecycle validation
  scenarios.
- **SC-007**: Material and price suggestions return relevant prior Company values in at least 90%
  of suggestion test scenarios where historical data exists.

## Assumptions

- P001 authentication, roles (Owner, Manager, Employee), and tenant isolation remain the foundation.
- P002 Branches and Warehouses are available for Branch and Warehouse location types.
- P003 attendance operational readiness (timed-in) is enforced before transaction creation.
- Buy maps to Inbound and Sell maps to Outbound consistently across API and clients.
- New transactions default to Draft status on create and auto-save.
- Trip linkage is optional in P004; mandatory Outside+Trip rules arrive in P006.
- Single currency per Company; amounts use the Company operational currency without conversion.
- Photo storage and retrieval mechanics follow existing API file-handling conventions established
  in prior modules without defining implementation in this specification.
- Search spans party name, material names on items, and notes unless extended in a future spec.
- Archive excludes transactions from default lists similar to organization resource archive behavior.

## Future Considerations

Future specifications will extend Transactions with Payment Workflow, Settlement, Receipts, Trips,
Expenses, and Analytics by referencing Transaction, Item, and Photo identifiers and statuses
without redesigning the P004 transaction model. Payment statuses (Ready for Payment, Paid) will be
introduced in P005. Outside transactions may require Trip linkage when Trip Management (P006) is
available.
