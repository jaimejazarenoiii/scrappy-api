# Feature Specification: P006 Addendum — Trip Load Management

**Feature Branch**: `[015-trip-load-management]`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Create an addendum to Product Specification P006 - Trip Management introducing optional Trip Loads for recording materials loaded onto vehicles before field operations."

**Parent Specification**: P006 — Trip Management (`specs/007-trip-management/spec.md`)

## Vision

Provide an optional Trip Load capability that allows Companies to record materials loaded onto
Vehicles before leaving a Company location.

Trip Loads help operators compare loaded quantities against outbound sales during a Trip without
introducing inventory management. Trip Loads represent temporary operational cargo assigned to a
specific Trip; they are not inventory and do not alter how Transactions are created or settled.

## Objectives

**Managers and Owners** MUST be able to:

- Enable or disable Trip Load for their Company
- Configure optional Trip Load validation behavior when validation is enabled
- Create Trip Loads on Draft trips
- Edit Trip Loads before a Trip starts
- Remove Trip Loads from Draft trips
- View Trip Load Summary for any trip that has a load

**Employees** MUST be able to:

- View Trip Load for trips they are assigned to
- View Remaining Quantities for materials on active and completed trips that have a load

## Scope

**In scope**:

- Optional Trip Load (zero or one per Trip) with Trip Load Items
- Company-level enablement and validation configuration
- Trip lifecycle integration (Draft, Started, Completed, Cancelled)
- Optional outbound transaction validation against loaded quantities
- Calculated Remaining Quantity (never stored)
- Trip Load, Trip Load Item, and Trip Load Summary API contracts
- Validation and business rules for Trip Load operations

**Non-goals**:

- Inventory management, warehouse stock deduction, or perpetual material balances
- Requiring Transactions to select materials from a Trip Load
- Inbound transaction validation against Trip Load
- Barcode scanning, QR loading, weight scales, warehouse integration, return loads, or vehicle
  stock tracking (future considerations only)
- Changes to Trip lifecycle rules defined in P006 except where Trip Load explicitly extends them
- Mobile UI implementation (API contracts only)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Owner Enables Trip Load (Priority: P1)

An Owner needs to turn on Trip Load for the Company and choose how validation should behave when
outbound sales exceed loaded quantities so field teams can optionally track cargo without
inventory complexity.

**Why this priority**: Trip Load is optional at the Company level; without enablement, no load
features are available.

**Independent Test**: An Owner enables Trip Load and sets validation to warn on exceed; Managers
can create loads on Draft trips; Employees see no load features on trips without loads.

**Acceptance Scenarios**:

1. **Given** Trip Load is disabled for a Company, **When** a Manager attempts to create a Trip
   Load, **Then** the request is rejected.
2. **Given** Trip Load is enabled, **When** an Owner sets validation mode to block on exceed,
   **Then** subsequent outbound transactions that exceed loaded quantity for a matching material
   are rejected when validation applies.
3. **Given** Trip Load is enabled with validation disabled, **When** outbound sales exceed loaded
   quantity, **Then** transactions proceed without Trip Load validation.

---

### User Story 2 - Manager Creates Trip Load on Draft Trip (Priority: P2)

A Manager or Owner needs to record what materials are loaded onto the vehicle before a Trip
starts so operators can compare planned cargo against field sales.

**Why this priority**: Creating loads on Draft trips is the core operational workflow before
departure.

**Independent Test**: A Manager adds a Trip Load with multiple items (material name, quantity,
unit) and optional notes to a Draft trip; the load is retrievable; trip without load remains valid.

**Acceptance Scenarios**:

1. **Given** Trip Load enabled and a Draft trip without a load, **When** a Manager creates a Trip
   Load with one or more items, **Then** the Trip has exactly one Trip Load with the provided
   items and notes.
2. **Given** a Draft trip that already has a Trip Load, **When** a Manager attempts to create a
   second Trip Load, **Then** the request is rejected.
3. **Given** a Draft trip without a Trip Load, **When** the trip is started without creating a
   load, **Then** the trip starts successfully with no Trip Load.
4. **Given** a Draft trip with a Trip Load, **When** a Manager edits item quantities or notes,
   **Then** changes are persisted while the trip remains Draft.
5. **Given** a Draft trip with a Trip Load, **When** a Manager removes the entire Trip Load,
   **Then** the trip has no Trip Load and may receive a new one before start.

---

### User Story 3 - Employee Views Load and Remaining Quantities (Priority: P3)

An assigned Employee needs to see what was loaded and how much remains during an active Trip so
they can avoid overselling relative to loaded cargo when validation is enabled or for operational
awareness.

**Why this priority**: Employees participate in field sales but do not manage load configuration.

**Independent Test**: An Employee assigned to a Started trip with a load views load detail and
summary; remaining quantities reflect outbound sales; Employee cannot edit the load.

**Acceptance Scenarios**:

1. **Given** a Started trip with a Trip Load and assigned Employee, **When** the Employee views
   the Trip Load, **Then** all items with loaded quantity, unit, and calculated remaining quantity
   are visible.
2. **Given** no outbound sales for a material yet, **When** remaining quantity is displayed,
   **Then** it equals the loaded quantity.
3. **Given** outbound sales totaling less than loaded quantity, **When** remaining quantity is
   displayed, **Then** it equals loaded quantity minus total outbound quantity for that material.
4. **Given** an Employee not assigned to the trip, **When** they attempt to view the Trip Load,
   **Then** the request is rejected.
5. **Given** a Started trip with a Trip Load, **When** an Employee attempts to add or edit load
   items, **Then** the request is rejected.

---

### User Story 4 - Validation on Outbound Sales (Priority: P4)

When validation is enabled, the system must compare outbound sales against loaded quantities for
materials present on the Trip Load so Companies can prevent or warn on overselling.

**Why this priority**: Validation delivers the primary business value of comparing load vs sales
without making loads mandatory.

**Independent Test**: With validation enabled and block mode, an outbound transaction for a
material on the load that would exceed loaded quantity is rejected; inbound transactions are never
validated against the load.

**Acceptance Scenarios**:

1. **Given** validation enabled, a Started trip with a load, and block mode, **When** an outbound
   transaction would cause total sold to exceed loaded quantity for a matching material, **Then**
   the transaction is rejected with a clear business error.
2. **Given** validation enabled and warn mode, **When** the same exceed condition occurs, **Then**
   the transaction succeeds and the user receives a warning indicating loaded quantity was exceeded.
3. **Given** validation enabled and a trip without a Trip Load, **When** an outbound transaction
   is created, **Then** no Trip Load validation is applied.
4. **Given** validation enabled and an outbound transaction for a material not on the load,
   **When** the transaction is created, **Then** no Trip Load validation is applied for that
   material.
5. **Given** validation enabled, **When** an inbound transaction is created during a Started trip
   with a load, **Then** Trip Load validation is not applied regardless of material.

---

### User Story 5 - Load Becomes Read-Only After Trip Ends (Priority: P5)

Managers, Owners, and Employees need historical load data preserved after a Trip completes or is
cancelled for reconciliation and reporting.

**Why this priority**: Preserving read-only history supports audit and post-trip review without
treating loads as inventory.

**Independent Test**: Completed and Cancelled trips retain Trip Load data; no edits or removals
are permitted; remaining quantities reflect sales at completion time.

**Acceptance Scenarios**:

1. **Given** a Started trip with a Trip Load, **When** the trip is completed, **Then** the Trip
   Load becomes read-only and historical data is preserved.
2. **Given** a Draft trip with a Trip Load that is cancelled, **When** the trip becomes Cancelled,
   **Then** the Trip Load becomes read-only.
3. **Given** a Completed trip with a Trip Load, **When** a Manager attempts to edit or remove the
   load, **Then** the request is rejected.

---

### Edge Cases

- What happens when Trip Load is disabled after loads exist on Draft trips? Existing Draft trip
  loads remain visible and editable until removed or the trip starts; new loads cannot be created
  while disabled.
- What happens when duplicate material names appear on the same Trip Load? Rejected at item
  creation or update (one line per material per load).
- What happens when outbound sales use a material name that differs in casing or spacing from the
  load item? Matching uses normalized material name comparison (trimmed, case-insensitive) within
  the same Company trip context.
- What happens when units differ between load item and transaction line? Validation compares
  quantities only when units match; mismatched units skip Trip Load validation for that line.
- What happens when a Manager tries to add new load items after the trip starts? Rejected; Started
  trips do not accept new items.
- What happens when a Manager tries to edit existing load item quantities after start? Rejected;
  load items are immutable once the trip is Started.
- What happens when validation is toggled mid-trip? New transactions follow the configuration
  effective at transaction time; historical transactions are not re-validated retroactively.
- What happens when a trip has no load and validation is enabled? Outbound transactions behave
  per P004/P005 with no Trip Load checks.

## Requirements _(mandatory)_

### Functional Requirements

#### Company configuration

- **FR-001**: Each Company MUST support a Trip Load enabled flag (on or off).
- **FR-002**: Only Owners and Managers MAY change the Trip Load enabled flag.
- **FR-003**: When Trip Load is disabled, users MUST NOT create new Trip Loads; existing Draft
  trip loads MAY remain until removed or the trip transitions out of Draft per lifecycle rules.
- **FR-004**: Each Company MUST support optional Trip Load validation (on or off) independent of
  enablement; validation applies only when both Trip Load is enabled and validation is enabled.
- **FR-005**: When validation is enabled, the Company MUST configure exceed behavior as either
  block transaction or warn user; default for new enablement is warn.

#### Trip Load identity and structure

- **FR-006**: A Trip MAY contain zero or one Trip Load.
- **FR-007**: A Trip Load MUST belong to exactly one Trip within the same Company.
- **FR-008**: A Trip Load MUST contain zero or more Trip Load Items when present.
- **FR-009**: A Trip Load MUST support optional notes (free text).
- **FR-010**: Each Trip Load Item MUST include material name, quantity (positive numeric), and
  unit (non-empty text).
- **FR-011**: Trip Load Items MUST belong only to their parent Trip Load.
- **FR-012**: The same material name MUST NOT appear more than once on a single Trip Load
  (after normalization: trim whitespace, case-insensitive comparison).

#### Trip Load is not inventory

- **FR-013**: Trip Load MUST NOT decrement warehouse or branch inventory.
- **FR-014**: Trip Load MUST NOT maintain company-wide material stock balances.
- **FR-015**: Trip Load MUST represent temporary operational data scoped to one Trip only.
- **FR-016**: Transaction creation MUST NOT require selecting materials from a Trip Load.
- **FR-017**: Trip Load MUST NOT modify Transaction records except through optional validation
  at transaction creation time when configured.

#### Trip lifecycle — Draft

- **FR-018**: While a Trip is Draft and Trip Load is enabled, Managers and Owners MAY create a
  Trip Load on a trip that has none.
- **FR-019**: While Draft, Managers and Owners MAY add, edit, or remove Trip Load Items.
- **FR-020**: While Draft, Managers and Owners MAY update Trip Load notes.
- **FR-021**: While Draft, Managers and Owners MAY remove the entire Trip Load.
- **FR-022**: Assigned Employees MAY view a Draft trip's Trip Load if one exists.

#### Trip lifecycle — Started

- **FR-023**: When a Trip transitions to Started, an existing Trip Load becomes operational.
- **FR-024**: While Started, new Trip Load Items MUST NOT be added.
- **FR-025**: While Started, existing Trip Load Items MUST NOT be edited or removed.
- **FR-026**: While Started, Trip Load notes MUST NOT be edited.
- **FR-027**: While Started, Remaining Quantity MUST be calculated for each load item as loaded
  quantity minus total outbound quantity sold during the trip for matching material and unit.
- **FR-028**: Assigned Employees and Managers/Owners MAY view Trip Load and Remaining Quantities
  while Started.

#### Trip lifecycle — Completed and Cancelled

- **FR-029**: When a Trip becomes Completed or Cancelled, an existing Trip Load MUST become
  read-only.
- **FR-030**: Historical Trip Load data MUST be preserved on Completed and Cancelled trips.
- **FR-031**: Remaining Quantity on Completed trips MUST reflect outbound sales recorded during
  the trip up to completion; it is calculated at read time, not stored.

#### Trip Load validation (optional)

- **FR-032**: Trip Load validation MUST apply only when Company validation is enabled, the Trip
  has a Trip Load, the Transaction direction is Outbound, and the transaction material matches a
  Trip Load Item (normalized name and matching unit).
- **FR-033**: For applicable outbound transactions, the system MUST compare loaded quantity to
  total outbound quantity for that material on the trip including the current transaction.
- **FR-034**: When total sold would exceed loaded quantity and exceed behavior is block, the
  transaction MUST be rejected.
- **FR-035**: When total sold would exceed loaded quantity and exceed behavior is warn, the
  transaction MUST succeed and the user MUST receive a warning describing the exceed condition.
- **FR-036**: Inbound transactions MUST NEVER trigger Trip Load validation.
- **FR-037**: Outbound transactions for materials not on the Trip Load MUST NOT trigger Trip Load
  validation.
- **FR-038**: Trips without a Trip Load MUST NOT trigger Trip Load validation regardless of
  Company validation setting.

#### Remaining Quantity

- **FR-039**: Remaining Quantity MUST be calculated as loaded quantity minus total outbound
  quantity for the same material and unit on the trip.
- **FR-040**: Remaining Quantity MUST NOT be persisted; it MUST be computed whenever load summary
  or detail is requested.
- **FR-041**: Remaining Quantity MAY be negative when validation is off or in warn mode and sales
  exceed loaded quantity; display MUST still show the calculated value.

#### Authorization

- **FR-042**: Only Managers and Owners MAY create, update, or delete Trip Loads and Trip Load
  Items subject to lifecycle rules.
- **FR-043**: Employees assigned to a Trip MAY view Trip Load and Trip Load Summary for that trip
  only.
- **FR-044**: Employees MUST NOT create, edit, or remove Trip Loads or items.
- **FR-045**: Cross-Company access MUST be rejected for all Trip Load operations.

#### Cross-cutting

- **FR-046**: Trip Load operations MUST respect Trip status and authorization rules from P006.
- **FR-047**: Trip Load validation MUST integrate with Transaction creation from P004/P005 without
  redefining transaction settlement or requiring load item selection.
- **FR-048**: Trip Load configuration changes MUST be auditable (who changed settings and when).

### Key Entities _(include if feature involves data)_

- **Trip Load**: Optional operational cargo record for one Trip. Contains optional notes and a
  collection of Trip Load Items. Lifecycle follows parent Trip status (editable in Draft,
  operational but immutable items in Started, read-only in Completed/Cancelled).
- **Trip Load Item**: One material line on a Trip Load with material name, loaded quantity, and
  unit. Unique material name per load after normalization.
- **Trip Load Summary**: A read model aggregating each load item with loaded quantity, total
  outbound quantity sold during the trip, and calculated remaining quantity.
- **Company Trip Load Settings**: Company-scoped configuration for Trip Load enabled flag,
  validation enabled flag, and exceed behavior (block or warn).

### API Contracts

All endpoints use the standard API response structure established in P001. Protected endpoints
require authenticated Company-bound access. Errors include validation failures, unauthenticated
access, forbidden role actions, not found, duplicate resource conflicts, business rule violations,
lifecycle conflicts, and Trip Load validation blocks.

#### Company Trip Load settings

- **Get Trip Load Settings**
  - Purpose: Retrieve Company Trip Load enablement and validation configuration.
  - Method: `GET`
  - URI: `/api/v1/companies/me/trip-load-settings`
  - Request: none.
  - Response: enabled flag, validation enabled flag, exceed behavior (block or warn).
  - Errors: unauthenticated, forbidden (Employee).

- **Update Trip Load Settings**
  - Purpose: Enable or disable Trip Load and configure validation behavior.
  - Method: `PATCH`
  - URI: `/api/v1/companies/me/trip-load-settings`
  - Request: at least one of enabled, validation enabled, exceed behavior.
  - Response: updated settings.
  - Errors: validation error, unauthenticated, forbidden (Employee).

#### Trip Load

- **Create Trip Load**
  - Purpose: Attach a Trip Load with items to a Draft trip that has none.
  - Method: `POST`
  - URI: `/api/v1/trips/{tripId}/load`
  - Request: optional notes; one or more items each with material name, quantity, unit.
  - Response: Trip Load detail including items.
  - Errors: not found, forbidden, Trip Load disabled for Company, trip not Draft, load already
    exists, validation error (duplicate material, non-positive quantity), cross-company violation.

- **Get Trip Load**
  - Purpose: Retrieve Trip Load detail for a trip.
  - Method: `GET`
  - URI: `/api/v1/trips/{tripId}/load`
  - Request: trip identifier.
  - Response: Trip Load with items; for Started/Completed trips includes calculated remaining
    quantity per item where applicable.
  - Errors: not found (trip or load), forbidden (Employee not assigned), cross-company violation.

- **Update Trip Load**
  - Purpose: Update Trip Load notes on a Draft trip.
  - Method: `PATCH`
  - URI: `/api/v1/trips/{tripId}/load`
  - Request: notes.
  - Response: updated Trip Load detail.
  - Errors: not found, not Draft, forbidden, Trip Load disabled, lifecycle conflict.

- **Delete Trip Load**
  - Purpose: Remove entire Trip Load from a Draft trip.
  - Method: `DELETE`
  - URI: `/api/v1/trips/{tripId}/load`
  - Request: none.
  - Response: success confirmation.
  - Errors: not found, not Draft, forbidden, lifecycle conflict.

#### Trip Load Items

- **Add Trip Load Item**
  - Purpose: Add a material line to a Draft trip's Trip Load.
  - Method: `POST`
  - URI: `/api/v1/trips/{tripId}/load/items`
  - Request: material name, quantity, unit.
  - Response: created item or updated load detail.
  - Errors: not found, no load on trip, not Draft, duplicate material, validation error, forbidden.

- **Update Trip Load Item**
  - Purpose: Change quantity, unit, or material name on a Draft trip load item.
  - Method: `PATCH`
  - URI: `/api/v1/trips/{tripId}/load/items/{itemId}`
  - Request: at least one of material name, quantity, unit.
  - Response: updated item or load detail.
  - Errors: not found, not Draft, duplicate material after change, validation error, forbidden.

- **Remove Trip Load Item**
  - Purpose: Remove one item from a Draft trip's Trip Load.
  - Method: `DELETE`
  - URI: `/api/v1/trips/{tripId}/load/items/{itemId}`
  - Request: none.
  - Response: success confirmation or updated load detail.
  - Errors: not found, not Draft, forbidden, lifecycle conflict.

#### Trip Load Summary

- **Get Trip Load Summary**
  - Purpose: View operational summary with loaded, sold, and remaining quantities per material.
  - Method: `GET`
  - URI: `/api/v1/trips/{tripId}/load/summary`
  - Request: trip identifier.
  - Response: per-item material name, unit, loaded quantity, total outbound quantity during trip,
    calculated remaining quantity; trip status and load notes included.
  - Errors: not found (trip or load), forbidden (Employee not assigned), cross-company violation.

### Validation Rules

#### Trip Load validation (request payload)

- Notes MUST NOT exceed reasonable length limits defined at implementation time (assumed max 2000
  characters for business consistency with other trip notes).
- Trip Load creation MUST include at least one item unless added incrementally via item endpoints.
- Quantity MUST be a positive number greater than zero.
- Unit MUST be non-empty after trim.
- Material name MUST be non-empty after trim.

#### Trip Load Item validation

- Material name MUST be unique within the Trip Load after normalization.
- Quantity MUST remain positive on update.
- Item changes MUST be rejected when parent Trip is not Draft.

#### Material validation

- Material matching for Remaining Quantity and transaction validation MUST use normalized material
  name (trim, case-insensitive) within the Trip.
- Quantity comparison for validation MUST require matching unit between load item and transaction
  line; otherwise validation is skipped for that line.

#### Business validation

- Trip Load operations MUST be rejected when Trip Load is disabled for the Company (except read of
  existing loads on non-Draft trips and settings retrieval).
- Only one Trip Load per Trip.
- Trip Load item mutations MUST be rejected when Trip status is Started, Completed, or Cancelled.
- Outbound transaction validation MUST evaluate cumulative sold quantity for the trip, not only
  the current line in isolation.
- Inbound transactions MUST bypass Trip Load validation entirely.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Managers can create a Trip Load with at least five items on a Draft trip in under
  three minutes without training beyond existing trip workflows.
- **SC-002**: Assigned Employees can view Remaining Quantities for an active trip load on first
  request without manual calculation.
- **SC-003**: When validation is enabled in block mode, 100% of outbound transactions that would
  exceed loaded quantity for a matching on-load material are rejected before persisting.
- **SC-004**: When validation is enabled in warn mode, 100% of exceeding outbound transactions
  persist and return an explicit warning to the user.
- **SC-005**: 100% of inbound transactions bypass Trip Load validation regardless of load
  configuration.
- **SC-006**: Trips without a Trip Load continue to support full Trip and Transaction workflows
  with zero additional steps required.
- **SC-007**: Completed trips retain read-only Trip Load history retrievable for reconciliation
  for the Company's standard data retention period.

## Acceptance Criteria

- A Company with Trip Load disabled cannot create new Trip Loads; enabling allows creation on
  Draft trips only.
- A Draft trip may exist with or without a Trip Load; starting without a load succeeds.
- A Trip has at most one Trip Load; duplicate create attempts fail.
- Draft trips allow full CRUD on Trip Load and items; Started trips reject item add/edit/remove.
- Completed and Cancelled trips reject all Trip Load mutations; GET and summary remain available.
- Remaining Quantity equals loaded minus sold and is never stored as a separate persisted field.
- Validation runs only when enabled, trip has load, transaction is outbound, and material/unit
  match a load item.
- Exceed behavior follows Company configuration (block vs warn).
- Employees view loads only for assigned trips; Managers and Owners view all Company trips per P006.
- Transaction creation never requires Trip Load item selection.

## Assumptions

- P006 Trip Management is implemented and Trip lifecycle statuses (Draft, Started, Completed,
  Cancelled) behave as specified in `specs/007-trip-management/spec.md`.
- P004 Transaction Management and P005 Transaction Settlement provide outbound transaction
  direction, material name, quantity, unit, and trip linkage on Outside transactions during
  Started trips.
- Material name on transaction lines is the same business identifier operators use when defining
  load items (free-text material name, not a mandatory catalog reference).
- Company settings for Trip Load apply to all branches and warehouses within the Company unless a
  future specification introduces scoped settings.
- Warn-mode responses expose the warning in the standard API success envelope without failing the
  transaction.
- Owners and Managers share the same Trip Load management permissions; Employees retain read-only
  access on assigned trips consistent with P006.

## Future Considerations

Future versions MAY add capabilities without redesigning the Trip Load model:

- Barcode scanning for load item entry
- QR code loading workflows
- Warehouse inventory integration (optional sync, not required for loads)
- Weight scale integration for quantity capture
- Vehicle stock tracking across multiple trips
- Return load recording for unsold materials

The core Trip Load entity (one optional load per trip, items with material/quantity/unit, calculated
remaining quantity, optional outbound validation) SHOULD remain stable as these extensions are added.

## Dependencies

- **P001** — Company & Identity Foundation (authentication, Company scope, response envelope)
- **P002** — Organization Management (Vehicles referenced by trips)
- **P003** — Workforce Management (Employee roles and trip assignment visibility)
- **P004** — Transaction Management Foundation (Outbound transactions, material lines, trip linkage)
- **P005** — Transaction Settlement (transaction persistence rules; no change to settlement flow)
- **P006** — Trip Management (Trip lifecycle, authorization, trip identifiers)
- **P010** — Activity Logs (audit of settings and load changes, when wired)

## Important Constraints

- Backend API specification only; no implementation details, frameworks, middleware, database
  design, project structure, testing strategy, or code examples in this document.
- Trip Load is an optional operational feature and is NOT an inventory system.
- This specification extends Trip Management only; it does not redefine Transactions, Trips, or
  settlement workflows except for optional outbound validation at transaction creation.
