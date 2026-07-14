# Feature Specification: P006 Addendum — Trip Load Management

**Feature Branch**: `[015-trip-load-management]`

**Created**: 2026-07-14

**Updated**: 2026-07-14

**Status**: Draft

**Input**: User description: "Create an addendum to Product Specification P006 - Trip Management introducing optional Trip Loads for recording materials loaded onto vehicles before field operations."

**Parent Specification**: P006 — Trip Management (`specs/007-trip-management/spec.md`)

## Vision

Provide Trip Load as an always-available capability that lets Companies record materials loaded
onto Vehicles before field operations.

Trip Loads are **optional per Trip** (a Trip may have zero or one load). The feature itself is
always on — Managers and Owners may attach a load on any Draft trip without enabling a Company
feature switch.

Trip Loads help operators compare loaded quantities against outbound sales during a Trip without
introducing inventory management. Trip Loads represent temporary operational cargo for one Trip;
they are not inventory and do not change how Transactions are created or settled.

## Objectives

**Managers and Owners** MUST be able to:

- Create Trip Loads on Draft trips (always available)
- Edit Trip Loads before a Trip starts
- Remove Trip Loads from Draft trips
- View Trip Load Summary for trips that have a load
- Configure optional Trip Load validation (on/off and block vs warn)

**Employees** MUST be able to:

- View Trip Load for trips they are assigned to
- View Remaining Quantities for materials on trips that have a load

## Scope

**In scope**:

- Trip Load always available; optional per Trip (zero or one) with Trip Load Items
- Company-level validation settings only (no feature enable/disable)
- Trip lifecycle integration (Draft, Started, Completed, Cancelled)
- Optional outbound validation of sold vs loaded quantities
- Calculated Remaining Quantity (never stored)
- REST contracts for Trip Load, Trip Load Items, Trip Load Summary, and validation settings
- Validation and business rules

**Non-goals**:

- Inventory, warehouse stock, or perpetual material balances
- Requiring Transactions to select materials from a Trip Load
- Inbound transaction validation against Trip Load
- Barcode, QR, scales, warehouse integration, return loads, vehicle stock tracking (future)
- Mobile UI implementation
- Redefining Trip or Transaction foundations from P001–P011

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manager Creates Optional Trip Load on Draft Trip (Priority: P1)

A Manager or Owner optionally records materials loaded onto the vehicle before a Trip starts so
operators can compare planned cargo against field sales. Trips without a load remain fully valid.

**Why this priority**: Optional load capture on Draft trips is the core value.

**Independent Test**: Create a Draft trip load with multiple items; retrieve it; start another
trip with no load successfully.

**Acceptance Scenarios**:

1. **Given** a Draft trip without a load, **When** a Manager creates a Trip Load with one or more
   items, **Then** the Trip has exactly one Trip Load with those items and optional notes.
2. **Given** a Draft trip that already has a Trip Load, **When** create is attempted again,
   **Then** the request is rejected.
3. **Given** a Draft trip without a Trip Load, **When** the trip is started, **Then** start
   succeeds with no Trip Load.
4. **Given** a Draft trip with a Trip Load, **When** a Manager edits items or notes, **Then**
   changes persist while status remains Draft.
5. **Given** a Draft trip with a Trip Load, **When** a Manager removes the load, **Then** the
   trip has no load and may receive a new one before start.

---

### User Story 2 - Owner Configures Trip Load Validation (Priority: P2)

An Owner or Manager configures whether exceeding loaded quantity on outbound sales should block
or warn. Trip Load creation is always available regardless of validation settings.

**Why this priority**: Validation is optional Company policy; loads work without it.

**Independent Test**: Set validation to warn; create a load on a Draft trip; exceed sales either
warns or is ignored when validation is off.

**Acceptance Scenarios**:

1. **Given** validation set to block, a Started trip with a load, **When** outbound sale would
   exceed loaded quantity for a matching material, **Then** the transaction is rejected.
2. **Given** validation disabled, **When** outbound sales exceed loaded quantity, **Then**
   transactions succeed without Trip Load validation.
3. **Given** any validation setting, **When** a Manager creates a Trip Load on a Draft trip,
   **Then** create succeeds.

---

### User Story 3 - Employee Views Load and Remaining Quantities (Priority: P3)

An assigned Employee views what was loaded and how much remains during an active Trip.

**Why this priority**: Field awareness without allowing load edits.

**Independent Test**: Assigned Employee views load and remaining quantities; cannot edit; non-
member cannot view.

**Acceptance Scenarios**:

1. **Given** a Started trip with a Trip Load and assigned Employee, **When** the Employee views
   the Trip Load, **Then** items show loaded quantity, unit, and calculated remaining quantity.
2. **Given** no outbound sales yet for a material, **When** remaining is shown, **Then** it
   equals loaded quantity.
3. **Given** outbound sales less than loaded, **When** remaining is shown, **Then** it equals
   loaded minus total outbound for that material and unit.
4. **Given** an Employee not assigned to the trip, **When** they view the Trip Load, **Then**
   the request is rejected.
5. **Given** a Started trip with a load, **When** an Employee attempts to add or edit items,
   **Then** the request is rejected.

---

### User Story 4 - Validation on Outbound Sales (Priority: P4)

When validation is enabled, outbound sales for materials on the Trip Load are compared to loaded
quantities. Inbound never validates against Trip Load.

**Why this priority**: Delivers oversell protection without mandating loads.

**Independent Test**: Block mode rejects exceed; warn mode allows with warning; inbound and
off-load materials skip validation.

**Acceptance Scenarios**:

1. **Given** validation enabled, block mode, Started trip with load, **When** outbound would
   exceed loaded for a matching material, **Then** transaction is rejected with a clear error.
2. **Given** validation enabled, warn mode, **When** the same exceed occurs, **Then**
   transaction succeeds with an explicit warning.
3. **Given** validation enabled and a trip without a load, **When** outbound is created, **Then**
   no Trip Load validation runs.
4. **Given** validation enabled and outbound material not on the load, **When** created, **Then**
   no Trip Load validation for that material.
5. **Given** validation enabled, **When** inbound is created on a trip with a load, **Then**
   Trip Load validation does not apply.

---

### User Story 5 - Load Becomes Read-Only After Trip Ends (Priority: P5)

After complete or cancel, Trip Load history is preserved and immutable.

**Why this priority**: Supports reconciliation without inventory semantics.

**Independent Test**: Completed/Cancelled trips keep load data; mutations rejected; remaining
still calculated at read time.

**Acceptance Scenarios**:

1. **Given** a Started trip with a Trip Load, **When** completed, **Then** load is read-only
   and data preserved.
2. **Given** a Draft trip with a Trip Load cancelled, **When** status is Cancelled, **Then**
   load is read-only.
3. **Given** a Completed trip with a load, **When** edit or remove is attempted, **Then**
   rejected.

---

### Role Expectations

#### Owner / Manager

- May create, edit, and remove Trip Loads on Draft trips.
- May view Trip Load and Summary for Company trips per P006 authorization.
- May configure validation on/off and exceed behavior (block or warn).
- Cannot invent inventory from Trip Load data.

#### Employee

- May view Trip Load and Remaining Quantities only for trips they are assigned to.
- Must not create, edit, or remove Trip Loads or items.
- Experiences the same transaction validation outcomes as other users when validation applies.

---

### Edge Cases

- Trip form submitted without a Trip Load → accepted; load may be added later while Draft.
- Duplicate material names on one load → rejected (normalized uniqueness).
- Material name casing/spacing differs from transaction → match is trim + case-insensitive.
- Unit mismatch between load item and transaction line → skip Trip Load validation for that line.
- Add/edit load items after Started → rejected.
- Validation toggled mid-trip → new transactions use current settings; history not re-validated.
- Trip with no load and validation on → no Trip Load checks on transactions.

## Requirements _(mandatory)_

### Functional Requirements

#### Always available; optional per trip

- **FR-001**: Trip Load MUST be always available for every Company; there MUST NOT be a Company-
  level feature enable/disable switch.
- **FR-002**: A Trip MAY contain zero or one Trip Load; creating a Trip MUST NOT require a load.
- **FR-003**: Managers and Owners MAY create a Trip Load on any Draft trip (subject to Draft
  rules).

#### Company validation configuration

- **FR-004**: Each Company MUST support Trip Load validation on or off; validation applies only
  when on AND the Trip has a Trip Load.
- **FR-005**: When validation is on, exceed behavior MUST be block or warn; default validation
  is off; default exceed behavior when enabling validation is warn.
- **FR-006**: Only Owners and Managers MAY change validation settings.

#### Trip Load structure

- **FR-007**: A Trip Load MUST belong to exactly one Trip in the same Company.
- **FR-008**: A Trip Load MAY include optional notes and zero or more Trip Load Items.
- **FR-009**: Each Trip Load Item MUST include material name, positive quantity, and non-empty
  unit.
- **FR-010**: Trip Load Items belong only to their Trip Load.
- **FR-011**: Material name MUST be unique on a Trip Load after trim and case-insensitive
  normalization.

#### Not inventory; transactions independent

- **FR-012**: Trip Load MUST NOT decrement warehouse/branch inventory or maintain company stock.
- **FR-013**: Trip Load is temporary operational data scoped to one Trip.
- **FR-014**: Transaction creation MUST NOT require selecting Trip Load items.
- **FR-015**: Trip Load MUST NOT modify Transaction records except via optional validation at
  create time when configured.

#### Lifecycle — Draft

- **FR-016**: While Draft, Managers and Owners MAY create, edit notes, add/edit/remove items, and
  remove the entire Trip Load.
- **FR-017**: Assigned Employees MAY view a Draft trip's Trip Load if present.

#### Lifecycle — Started

- **FR-018**: On Started, existing Trip Load becomes operational; items and notes MUST NOT be
  added, edited, or removed.
- **FR-019**: Remaining Quantity MUST be calculated per item as loaded minus total outbound for
  matching material and unit during the trip.
- **FR-020**: Assigned Employees and Managers/Owners MAY view Trip Load and Remaining Quantities.

#### Lifecycle — Completed / Cancelled

- **FR-021**: Trip Load becomes read-only; historical data is preserved.
- **FR-022**: Remaining Quantity is calculated at read time, not stored.

#### Validation

- **FR-023**: Validation applies only when enabled, trip has load, direction is Outbound, and
  material matches a load item (normalized name + matching unit).
- **FR-024**: Compare loaded vs cumulative outbound including the current transaction.
- **FR-025**: Block mode rejects exceed; warn mode allows with warning.
- **FR-026**: Inbound never uses Trip Load validation.
- **FR-027**: Materials not on the load and trips without a load skip Trip Load validation.

#### Remaining Quantity

- **FR-028**: Remaining = Loaded − Total Outbound (same material and unit); never persisted;
  may be negative when validation is off or warn mode.

#### Authorization

- **FR-029**: Only Managers and Owners mutate Trip Loads (lifecycle permitting).
- **FR-030**: Employees view only assigned trips' loads.
- **FR-031**: Cross-Company access is rejected.

#### Cross-cutting

- **FR-032**: Respect P006 trip status and auth rules.
- **FR-033**: Integrate with P004/P005 transaction create without changing settlement.
- **FR-034**: Validation setting changes MUST be auditable.

### Key Entities

- **Trip Load**: Optional per-trip cargo record (always-available feature). Notes + items;
  editable in Draft; immutable items when Started; read-only when Completed/Cancelled.
- **Trip Load Item**: Material name, quantity, unit; unique material per load after
  normalization.
- **Trip Load Summary**: Per-item loaded, total outbound, calculated remaining.
- **Company Trip Load Settings**: Validation on/off and exceed behavior (block|warn) only.

### API Contracts

Standard P001 response envelope. Authenticated Company-bound access. Errors: validation,
unauthenticated, forbidden, not found, conflict, lifecycle, Trip Load validation block.

#### Company Trip Load settings

- **Get Trip Load Settings**
  - Purpose: Read validation configuration.
  - Method: `GET`
  - URI: `/api/v1/companies/me/trip-load-settings`
  - Request: none.
  - Response: validationEnabled, exceedBehavior (`block` | `warn`).
  - Errors: unauthenticated, forbidden (Employee).

- **Update Trip Load Settings**
  - Purpose: Set validation on/off and exceed behavior. Does not enable/disable Trip Load.
  - Method: `PATCH`
  - URI: `/api/v1/companies/me/trip-load-settings`
  - Request: at least one of validationEnabled, exceedBehavior.
  - Response: updated settings.
  - Errors: validation, unauthenticated, forbidden (Employee).

#### Trip Load

- **Create Trip Load**
  - Purpose: Attach load to Draft trip with none.
  - Method: `POST`
  - URI: `/api/v1/trips/{tripId}/load`
  - Request: optional notes; one or more items (materialName, quantity, unit).
  - Response: Trip Load with items.
  - Errors: not found, forbidden, not Draft, load already exists, validation, cross-company.

- **Get Trip Load**
  - Purpose: Load detail; remaining quantities when Started/Completed as applicable.
  - Method: `GET`
  - URI: `/api/v1/trips/{tripId}/load`
  - Request: trip id.
  - Response: Trip Load with items (and remaining when applicable).
  - Errors: not found (trip or load), forbidden (Employee not assigned), cross-company.

- **Update Trip Load**
  - Purpose: Update notes on Draft trip load.
  - Method: `PATCH`
  - URI: `/api/v1/trips/{tripId}/load`
  - Request: notes.
  - Response: updated Trip Load.
  - Errors: not found, not Draft, forbidden, lifecycle conflict.

- **Delete Trip Load**
  - Purpose: Remove load from Draft trip.
  - Method: `DELETE`
  - URI: `/api/v1/trips/{tripId}/load`
  - Request: none.
  - Response: success confirmation.
  - Errors: not found, not Draft, forbidden, lifecycle conflict.

#### Trip Load Items

- **Add Trip Load Item**
  - Purpose: Add line to Draft trip load.
  - Method: `POST`
  - URI: `/api/v1/trips/{tripId}/load/items`
  - Request: materialName, quantity, unit.
  - Response: item or load detail.
  - Errors: not found, no load, not Draft, duplicate material, validation, forbidden.

- **Update Trip Load Item**
  - Purpose: Change Draft load item fields.
  - Method: `PATCH`
  - URI: `/api/v1/trips/{tripId}/load/items/{itemId}`
  - Request: at least one of materialName, quantity, unit.
  - Response: updated item or load.
  - Errors: not found, not Draft, duplicate material, validation, forbidden.

- **Remove Trip Load Item**
  - Purpose: Remove one Draft load item.
  - Method: `DELETE`
  - URI: `/api/v1/trips/{tripId}/load/items/{itemId}`
  - Request: none.
  - Response: success or updated load.
  - Errors: not found, not Draft, forbidden, lifecycle conflict.

#### Trip Load Summary

- **Get Trip Load Summary**
  - Purpose: Loaded vs sold vs remaining per material.
  - Method: `GET`
  - URI: `/api/v1/trips/{tripId}/load/summary`
  - Request: trip id.
  - Response: per-item materialName, unit, loadedQuantity, totalOutboundQuantity,
    remainingQuantity; trip status; notes.
  - Errors: not found (trip or load), forbidden (Employee not assigned), cross-company.

### Validation Rules

#### Trip Load / items

- Notes length within product max (assumed ≤ 2000 chars).
- Quantity > 0; unit and material name non-empty after trim.
- Unique material per load after normalization.
- Item mutations only when Trip is Draft.

#### Material

- Matching uses trim + case-insensitive name within the Trip.
- Validation quantity compare requires matching unit; else skip for that line.

#### Business

- At most one Trip Load per Trip.
- Started/Completed/Cancelled reject load mutations.
- Outbound validation uses cumulative sold on the trip including current line.
- Inbound never Trip Load-validated.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Managers can create a Trip Load with ≥5 items on a Draft trip in under 3 minutes
  without extra Company enablement steps.
- **SC-002**: Assigned Employees see Remaining Quantities without manual calculation.
- **SC-003**: With validation block mode, 100% of exceeding outbound sales for on-load matching
  materials are rejected before persist.
- **SC-004**: With warn mode, 100% of exceeding outbound sales persist and return a warning.
- **SC-005**: 100% of inbound transactions skip Trip Load validation.
- **SC-006**: Trips without a load need zero extra steps for Trip/Transaction workflows.
- **SC-007**: Completed trips retain read-only Trip Load history for Company retention period.

## Acceptance Criteria

- Trip Load is always available; no Company feature enable/disable.
- Draft trips may omit or include a load; start without load succeeds.
- At most one Trip Load per Trip.
- Draft: full load CRUD; Started: no item add/edit/remove; Complete/Cancel: read-only.
- Remaining = loaded − sold; never stored.
- Validation only when configured + load present + outbound + material/unit match.
- Employees view assigned trips only; Managers/Owners follow P006.
- Transactions never require Trip Load item selection.

## Assumptions

- P006 Trip Management and P004/P005 transaction rules are in place.
- Material names on transactions and load items are free-text business labels (no mandatory
  catalog FK in this addendum).
- Validation settings are Company-wide.
- Warn responses use the standard success envelope with a warning signal.
- Owner/Manager share Trip Load write permissions; Employees are read-only on assigned trips.
- Prompt wording "Enable Trip Load" is interpreted as ability to use loads on trips, not a
  Company feature flag (product decision: always on).

## Future Considerations

Future versions MAY add without redesigning the Trip Load model:

- Barcode Scanning
- QR Code Loading
- Warehouse Inventory Integration
- Weight Scale Integration
- Vehicle Stock Tracking
- Return Load Recording

## Dependencies

- **P001** — Company & Identity Foundation
- **P002** — Organization Management
- **P003** — Workforce Management
- **P004** — Transaction Management Foundation
- **P005** — Transaction Settlement
- **P006** — Trip Management
- **P010** — Activity Logs (settings/load audit when wired)
- **P011** — Company Subscription Management (completed; no subscription changes)

## Important Constraints

- Backend API business specification only.
- No implementation details, frameworks, middleware, database design, project structure, testing
  strategy, or code examples.
- Extends Trip Management only.
- Trip Load is optional per Trip and is not an inventory system.
