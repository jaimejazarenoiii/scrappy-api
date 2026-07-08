# Feature Specification: P005 - Transaction Settlement

**Feature Branch**: `[006-transaction-settlement]`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Create Product Specification P005 - Transaction Settlement for Scrappy."

## Vision

Provide a controlled settlement workflow where operational Employees record transactions while
Managers and Owners handle financial settlement. The settlement workflow ensures operational
accuracy, financial accountability, and auditability.

**Purpose**:

- Extend the Transaction module introduced in P004 with a post-draft settlement workflow.
- Assign immutable Transaction Numbers at creation for traceability across receipts, reports, and
  references.
- Separate operational data entry (Employees) from financial settlement (Managers and Owners).
- Support receipt generation after payment is recorded.

**Scope**:

- Transaction Number assignment and search
- Status transitions: Draft → Ready for Payment → Paid, and Cancelled
- Employee finish/submit workflow
- Manager/Owner review, edit, return-to-draft, settlement, and reopen
- Receipt generation for settled transactions
- Settlement-related API contracts and validation rules

**Non-goals**:

- Redefining transaction creation, items, photos, or auto-save from P004
- Trip requirement enforcement (P006)
- Expense recording, analytics dashboards, or reporting modules
- Mobile application UI implementation (API contracts only)
- Redefining Company, User, Employee, Branch, Warehouse, or workforce rules from P001–P003
- Payment gateway integration or external accounting system sync

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Employee Finishes a Draft Transaction (Priority: P1)

A timed-in Employee who has completed operational data entry needs to submit their Draft
transaction for settlement so Managers or Owners can review and pay.

**Why this priority**: Submitting for settlement is the entry point to the entire P005 workflow;
without it no transaction reaches financial review.

**Independent Test**: An Employee with a complete Draft transaction selects Finish Transaction; the
transaction moves to Ready for Payment, becomes non-editable to the Employee, and retains its
Transaction Number.

**Acceptance Scenarios**:

1. **Given** a complete Draft transaction assigned to an Employee, **When** the Employee finishes
   the transaction, **Then** status becomes Ready for Payment and the Employee can no longer edit
   it.
2. **Given** a Draft transaction missing required fields or items, **When** finish is attempted,
   **Then** the request is rejected with a clear validation message.
3. **Given** a Draft transaction, **When** an unassigned Employee attempts to finish it, **Then**
   the request is rejected.
4. **Given** any transaction at creation, **When** it is first saved, **Then** it already carries
   a unique Transaction Number for its Company and direction.

---

### User Story 2 - Manager Reviews and Edits Submitted Transactions (Priority: P2)

A Manager or Owner needs to review Ready for Payment transactions, correct operational details if
needed, or return a transaction to Draft for the Employee to fix.

**Why this priority**: Financial reviewers must verify operational accuracy before settlement and
recover from data entry errors without cancelling the transaction.

**Independent Test**: A Manager edits a Ready for Payment transaction, returns another to Draft, and
is forbidden from finishing on behalf of an Employee.

**Acceptance Scenarios**:

1. **Given** a Ready for Payment transaction, **When** a Manager or Owner updates header or item
   fields, **Then** changes are persisted while status remains Ready for Payment.
2. **Given** a Ready for Payment transaction, **When** a Manager or Owner returns it to Draft,
   **Then** status becomes Draft and assigned Employees may edit again.
3. **Given** a Ready for Payment transaction, **When** an Employee attempts to edit it, **Then**
   the request is rejected.
4. **Given** a Paid transaction, **When** a Manager (non-Owner) attempts to edit it, **Then** the
   request is rejected.

---

### User Story 3 - Manager Settles a Transaction (Priority: P3)

A Manager or Owner needs to mark a Ready for Payment transaction as Paid, recording who performed
settlement and when, so the Company has an auditable financial record.

**Why this priority**: Settlement is the core financial outcome of the workflow.

**Independent Test**: A Manager marks a Ready for Payment transaction Paid; paid metadata is
recorded, the transaction becomes read-only, and a receipt can be generated.

**Acceptance Scenarios**:

1. **Given** a Ready for Payment Inbound transaction, **When** a Manager settles it, **Then**
   status becomes Paid, Paid By and Paid At are recorded, and the transaction is locked.
2. **Given** a Ready for Payment Outbound transaction, **When** an Owner settles it, **Then**
   status becomes Paid with settlement metadata recorded.
3. **Given** a Draft transaction, **When** settlement is attempted, **Then** the request is
   rejected.
4. **Given** a Paid transaction, **When** an Employee attempts settlement, **Then** the request is
   rejected.

---

### User Story 4 - Owner Reopens a Paid Transaction (Priority: P4)

An Owner needs to reopen a Paid transaction when a settlement error is discovered, so corrections
can be made and settlement performed again.

**Why this priority**: Financial corrections require a controlled reversal path without deleting
historical records.

**Independent Test**: An Owner reopens a Paid transaction; paid metadata is cleared, status
returns to Ready for Payment, and only the Owner may perform reopen.

**Acceptance Scenarios**:

1. **Given** a Paid transaction, **When** the Owner reopens it, **Then** status becomes Ready for
   Payment, Paid By and Paid At are cleared, and Managers may edit again.
2. **Given** a Paid transaction, **When** a Manager attempts reopen, **Then** the request is
   rejected.
3. **Given** a reopened transaction, **When** settlement is performed again, **Then** new Paid By
   and Paid At values are recorded.

---

### User Story 5 - Generate and Retrieve Receipt (Priority: P5)

A Manager, Owner, or authorized user needs a receipt after settlement for the party, internal
records, or dispute resolution.

**Why this priority**: Receipts provide the customer-facing and audit artifact of completed
settlement.

**Independent Test**: After a transaction is Paid, a receipt is generated containing all required
fields; requesting a receipt before settlement is rejected.

**Acceptance Scenarios**:

1. **Given** a Paid transaction, **When** an authorized user requests a receipt, **Then** the
   receipt includes Transaction Number, Company, direction, party, date, items, grand total, Paid
   By, and Paid At.
2. **Given** a Ready for Payment transaction, **When** a receipt is requested, **Then** the request
   is rejected.
3. **Given** a Paid transaction, **When** the receipt is requested again, **Then** the same
   settlement facts are returned consistently.

---

### User Story 6 - Search and Filter by Transaction Number (Priority: P6)

Users need to locate transactions quickly by Transaction Number across lists and direct lookup for
support, reconciliation, and reference on receipts.

**Why this priority**: Transaction Numbers are the primary business identifier once assigned.

**Independent Test**: A user searches by full or partial Transaction Number within authorization
scope and retrieves the matching transaction(s).

**Acceptance Scenarios**:

1. **Given** transactions with assigned numbers, **When** a user searches by exact Transaction
   Number, **Then** the matching transaction is returned within authorization scope.
2. **Given** multiple transactions, **When** a Manager filters the company list by Transaction
   Number prefix, **Then** only matching transactions are returned.
3. **Given** a Transaction Number belonging to another Company, **When** lookup is attempted,
   **Then** the transaction is not found.

---

### Edge Cases

- What happens when two transactions are created on the same day with the same direction? Each
  receives the next sequential suffix for that date and direction within the Company.
- What happens when finish is attempted on a Cancelled transaction? Request is rejected.
- What happens when cancel is attempted on a Paid transaction? Request is rejected unless Owner
  reopens first.
- What happens when return-to-draft is attempted on a Paid transaction? Request is rejected.
- What happens when settlement is attempted twice on the same transaction? Second attempt is
  rejected.
- What happens when an archived transaction (from P004) is submitted or settled? Archived
  transactions remain excluded from active settlement workflows.
- What happens when grand total is zero? Finish may be rejected if business rules require a
  positive total (assumption: at least one item with positive total required).

## Requirements _(mandatory)_

### Functional Requirements

#### Transaction Number

- **FR-001**: Every transaction MUST receive a unique Transaction Number immediately upon
  creation.
- **FR-002**: Inbound transactions MUST use the format `IN-YYYYMMDD-000001` where the six-digit
  suffix increments per Company per calendar day for Inbound transactions.
- **FR-003**: Outbound transactions MUST use the format `OUT-YYYYMMDD-000001` where the six-digit
  suffix increments per Company per calendar day for Outbound transactions.
- **FR-004**: Transaction Numbers MUST be unique within a Company.
- **FR-005**: Transaction Numbers MUST never change once assigned.
- **FR-006**: Transaction Numbers MUST remain attached throughout the transaction lifecycle
  (Draft, Ready for Payment, Paid, Cancelled).
- **FR-007**: Transaction Numbers MUST be usable on receipts, reports, searches, and external
  references.

#### Transaction status lifecycle

- **FR-008**: The system MUST support statuses Draft, Ready for Payment, Paid, and Cancelled in
  P005 (extending P004 Draft and Cancelled).
- **FR-009**: Draft transactions MUST remain editable by assigned Employees and by Managers and
  Owners per P004 rules.
- **FR-010**: Only Draft transactions MAY transition to Ready for Payment via the finish action.
- **FR-011**: Ready for Payment transactions MUST NOT be editable by Employees.
- **FR-012**: Managers and Owners MUST be able to edit Ready for Payment transactions.
- **FR-013**: Managers and Owners MUST be able to return Ready for Payment transactions to Draft.
- **FR-014**: Only Managers and Owners MAY mark Ready for Payment transactions as Paid.
- **FR-015**: Paid transactions MUST become read-only for Managers and Employees.
- **FR-016**: Only Owners MAY reopen Paid transactions.
- **FR-017**: Reopened Paid transactions MUST return to Ready for Payment and clear prior Paid By
  and Paid At values.
- **FR-018**: Cancelled transactions MUST remain read-only with no further settlement allowed.
- **FR-019**: Cancel MUST be permitted from Draft and Ready for Payment by authorized roles per
  P004/P005 rules; Cancel MUST NOT be permitted from Paid without prior Owner reopen.

#### Settlement workflow

- **FR-020**: Employees MUST be able to finish Draft transactions (submit for settlement).
- **FR-021**: Finish MUST validate that the transaction is operationally complete (required header
  fields, at least one item, valid location context per P004).
- **FR-022**: Managers and Owners MUST be able to review Ready for Payment transactions within
  their Company.
- **FR-023**: Settlement (mark Paid) MUST record Paid By (the settling user) and Paid At (settlement
  timestamp).
- **FR-024**: For Inbound transactions, settlement represents the Company paying money to the
  Party.
- **FR-025**: For Outbound transactions, settlement represents the Company receiving money from
  the Party.
- **FR-026**: Receipt generation MUST only be available after a transaction is Paid.

#### Search and visibility

- **FR-027**: Users MUST be able to search and filter transactions by Transaction Number within
  authorization scope.
- **FR-028**: Transaction list and detail responses MUST include Transaction Number.
- **FR-029**: Status filters MUST support Ready for Payment and Paid in addition to Draft and
  Cancelled.

#### Authorization

- **FR-030**: Employees MUST only finish Draft transactions they are assigned to.
- **FR-031**: Employees MUST NOT mark transactions Paid, reopen Paid transactions, or return
  Ready for Payment transactions to Draft.
- **FR-032**: Managers and Owners MUST perform settlement actions within their Company only.
- **FR-033**: Cross-company access MUST be rejected for all settlement operations.

#### Cross-cutting

- **FR-034**: P005 MUST extend P004 transaction entities without redefining creation, items,
  photos, or auto-save behavior.
- **FR-035**: All settlement state changes MUST be auditable (who acted and when).

### Key Entities _(include if feature involves data)_

- **Transaction (extended)**: Operational and financial record from P004, now including immutable
  Transaction Number, extended status (Ready for Payment, Paid), and settlement fields (Paid By, Paid
  At). Relationships to Company, Party, Items, and assigned Employees unchanged from P004.
- **Transaction Number**: Business identifier assigned at creation; encodes direction prefix, date,
  and daily sequence within Company.
- **Receipt**: A read-only settlement artifact derived from a Paid transaction, containing Company
  identity, transaction facts, line items, grand total, and settlement metadata. Not a separate
  editable business record in P005.
- **Settlement record (logical)**: The Paid By and Paid At values on a Paid transaction representing
  who settled and when.

### API Contracts

All endpoints use the standard API response structure established in P001. Protected endpoints
require authenticated Company-bound access. Errors include validation failures, unauthenticated
access, forbidden role actions, not found, and business rule or lifecycle conflicts.

#### Transaction status and settlement

- **Finish Transaction (Submit for Settlement)**
  - Purpose: Move a complete Draft transaction to Ready for Payment.
  - Method: `POST`
  - URI: `/api/v1/transactions/{transactionId}/finish`
  - Request: none (optional confirmation note may be added in future; not required in P005).
  - Response: Transaction detail with status Ready for Payment and unchanged Transaction Number.
  - Errors: not found, not draft, incomplete transaction, not assigned employee, forbidden,
    lifecycle conflict, cross-company violation.

- **Return to Draft**
  - Purpose: Move a Ready for Payment transaction back to Draft for Employee correction.
  - Method: `POST`
  - URI: `/api/v1/transactions/{transactionId}/return-to-draft`
  - Request: optional reason for audit.
  - Response: Transaction detail with status Draft.
  - Errors: not found, not ready for payment, forbidden (Employee), lifecycle conflict.

- **Settle Transaction (Mark Paid)**
  - Purpose: Record financial settlement and lock the transaction.
  - Method: `POST`
  - URI: `/api/v1/transactions/{transactionId}/settle`
  - Request: optional settlement note (for audit; not printed on receipt unless specified later).
  - Response: Transaction detail with status Paid, Paid By, and Paid At populated.
  - Errors: not found, not ready for payment, forbidden (Employee), lifecycle conflict, validation
    error.

- **Reopen Paid Transaction**
  - Purpose: Allow Owner to reverse settlement and return transaction to Ready for Payment.
  - Method: `POST`
  - URI: `/api/v1/transactions/{transactionId}/reopen`
  - Request: required reason for audit.
  - Response: Transaction detail with status Ready for Payment; Paid By and Paid At cleared.
  - Errors: not found, not paid, forbidden (Manager, Employee), lifecycle conflict.

- **Cancel Transaction (extended)**
  - Purpose: Cancel a Draft or Ready for Payment transaction (extends P004 cancel).
  - Method: `POST`
  - URI: `/api/v1/transactions/{transactionId}/cancel`
  - Request: optional cancellation reason.
  - Response: Transaction detail with status Cancelled.
  - Errors: not found, not cancellable status (e.g., Paid), forbidden, lifecycle conflict.

#### Receipt

- **Get Receipt**
  - Purpose: Retrieve receipt data for a Paid transaction.
  - Method: `GET`
  - URI: `/api/v1/transactions/{transactionId}/receipt`
  - Request: transaction identifier.
  - Response: Receipt payload containing Transaction Number, Company name and contact details,
    transaction direction (Buy/Sell label), party name, transaction date, line items with material,
    weight, unit, price, line total, grand total, Paid By display name, and Paid At.
  - Errors: not found, not paid (receipt not available), forbidden, cross-company violation.

#### Transaction discovery (extended)

- **List Transactions (extended filters)**
  - Purpose: List transactions including settlement statuses and Transaction Number search.
  - Method: `GET`
  - URI: `/api/v1/transactions`
  - Request: existing P004 filters plus `status` values `READY_FOR_PAYMENT` and `PAID`; `search` and
    dedicated `transactionNumber` filter for exact or prefix match.
  - Response: Paginated collection including Transaction Number and settlement summary fields.
  - Errors: unauthenticated, forbidden, validation error on filters.

- **Get Transaction by Transaction Number**
  - Purpose: Direct lookup for support and receipt reference.
  - Method: `GET`
  - URI: `/api/v1/transactions/by-number/{transactionNumber}`
  - Request: Transaction Number path parameter.
  - Response: Transaction detail within authorization scope.
  - Errors: not found, forbidden, cross-company violation.

- **Update Transaction (extended authorization)**
  - Purpose: Edit Draft (P004) or Ready for Payment (P005 Manager/Owner) transactions.
  - Method: `PATCH`
  - URI: `/api/v1/transactions/{transactionId}`
  - Request: mutable header fields per P004.
  - Response: Updated transaction detail.
  - Errors: not found, paid (read-only), cancelled, forbidden (Employee on Ready for Payment),
    validation error.

### Validation Rules

#### Settlement validation

- Finish MUST require status Draft.
- Finish MUST require at least one transaction item.
- Finish MUST require all P004 mandatory header and location fields to be present and valid.
- Settle MUST require status Ready for Payment.
- Settle MUST reject transactions that are archived (soft-deleted).
- Reopen MUST require status Paid and Owner role.
- Return to Draft MUST require status Ready for Payment and Manager or Owner role.

#### Status transition validation

| From              | To                | Allowed actors      |
| ----------------- | ----------------- | ------------------- |
| Draft             | Ready for Payment | Assigned Employee   |
| Draft             | Cancelled         | Authorized per P004 |
| Ready for Payment | Paid              | Manager, Owner      |
| Ready for Payment | Draft             | Manager, Owner      |
| Ready for Payment | Cancelled         | Manager, Owner      |
| Paid              | Ready for Payment | Owner (reopen only) |
| Cancelled         | (any)             | None (terminal)     |
| Paid              | Cancelled         | Not allowed         |

#### Receipt validation

- Receipt MUST only be produced when status is Paid.
- Receipt MUST include all required fields: Transaction Number, Company, direction, party name,
  transaction date, items, grand total, Paid By, Paid At.
- Receipt MUST reflect current item totals and grand total at time of request.
- Receipt MUST NOT be generated for Draft, Ready for Payment, or Cancelled transactions.

#### Business validation

- Transaction Number MUST be assigned at creation and MUST NOT be supplied by the client.
- Transaction Number uniqueness MUST be enforced per Company.
- Employees MUST NOT modify Ready for Payment or Paid transactions (except finish on own Draft).
- Paid transactions MUST reject all mutation except Owner reopen.
- Settlement MUST NOT proceed if transaction has zero items or zero grand total.
- Cancelled transactions MUST reject finish, settle, reopen, and receipt generation.

### Business Rules

1. Only Draft transactions may move to Ready for Payment.
2. Only Managers and Owners may mark transactions Paid.
3. Employees cannot modify Ready for Payment transactions.
4. Paid transactions become read-only for all roles except Owner reopen.
5. Only Owners may reopen Paid transactions.
6. Transaction Numbers are immutable and assigned at creation.
7. Receipt generation only occurs after settlement (Paid status).
8. Inbound settlement means Company pays the Party; Outbound settlement means Company receives from
   the Party.
9. Return to Draft is only available from Ready for Payment, not from Paid.
10. Cancel from Paid is not permitted; Owner must reopen first if correction is needed.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An Employee can finish a complete Draft transaction in a single action, and the
  transaction appears in the Manager's Ready for Payment queue within the same session.
- **SC-002**: 100% of created transactions receive a unique Transaction Number before any user
  views the transaction detail.
- **SC-003**: Managers can locate any transaction by Transaction Number in under 10 seconds using
  search or direct lookup.
- **SC-004**: Settlement (mark Paid) records Paid By and Paid At on every successfully settled
  transaction with no manual reconciliation fields required.
- **SC-005**: Receipt data for Paid transactions includes all eight required content groups
  (Transaction Number, Company, direction, party, date, items, grand total, settlement metadata)
  on every request.
- **SC-006**: Employees attempting to edit or settle Ready for Payment transactions receive a
  clear forbidden response with zero data mutations.
- **SC-007**: Owners can reopen a Paid transaction and re-settle it with updated settlement
  metadata in a single correction cycle.
- **SC-008**: Invalid status transitions (e.g., Draft → Paid, Paid → Cancelled) are rejected 100%
  of the time with lifecycle conflict feedback.

## Assumptions

- P004 Transaction Management is implemented and deployed; P005 extends it in place.
- Transaction Numbers use the calendar date at creation time (server-local or Company timezone —
  consistent with P004 transaction date handling).
- Daily sequence resets at midnight per Company timezone for Transaction Number suffix allocation.
- "Paid By" is recorded as the authenticated User who performed settlement; display name is derived
  from linked Employee or User profile.
- Reopen returns Paid transactions to Ready for Payment (not Draft) unless explicitly returned to
  Draft by a Manager/Owner afterward.
- Archive behavior from P004 continues to apply; archived transactions are not eligible for finish
  or settlement.
- Receipt in P005 is a structured API response; printable PDF or email delivery may be added in a
  future specification.
- Grand total is the sum of line item totals as defined in P004.
- Cancel from Draft retains P004 authorization rules (assigned Employee, Manager, or Owner).

## Future Considerations

Future specifications will integrate settlement with Trips, Expenses, Analytics, and Reports by
referencing Transaction Number, Paid status, and settlement metadata without redesigning the P005
settlement workflow. Trip linkage may become mandatory for Outside transactions in P006. Expense
modules may consume Paid transaction totals. Analytics and reporting will aggregate by Transaction
Number, status, direction, and settlement date.

## Acceptance Criteria

1. Every new transaction displays a unique Transaction Number matching direction prefix and date
   format immediately after creation.
2. An assigned Employee can finish a valid Draft transaction; status becomes Ready for Payment and
   subsequent Employee edit attempts fail.
3. A Manager can edit, return to Draft, settle, or cancel a Ready for Payment transaction within
   their Company.
4. Settlement sets Paid By and Paid At; transaction becomes read-only for Managers and Employees.
5. Only an Owner can reopen a Paid transaction; Paid metadata is cleared and status becomes Ready
   for Payment.
6. Receipt endpoint returns complete receipt payload for Paid transactions only.
7. Search and lookup by Transaction Number return correct results within tenant and role scope.
8. All invalid transitions are rejected with appropriate error codes and no partial state changes.
9. Cancelled transactions remain read-only and cannot be finished, settled, or receipted.
10. P004 creation, item, photo, and list behaviors continue to work unchanged except where P005
    explicitly extends status and authorization.
