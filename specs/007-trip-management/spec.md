# Feature Specification: P006 - Trip Management

**Feature Branch**: `[007-trip-management]`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Create Product Specification P006 - Trip Management for Scrappy."

## Vision

Provide a centralized Trip Management capability that allows Managers and Owners to plan, assign,
execute, and complete operational trips outside company premises.

Trips coordinate employees, vehicles, outside transactions, and operational expenses performed
away from company locations. Trips apply only to Outside transactions and serve as the operational
container for field work.

**Purpose**:

- Introduce Trip as a first-class business entity linking people, vehicles, and outside operational
  activity.
- Enforce that Outside transactions may only be recorded while a Trip is in Started status.
- Coordinate vehicle and employee availability during active field operations.
- Establish Trip Numbers for traceability across transactions, expenses, and future reports.

**Scope**:

- Trip lifecycle: Draft, Started, Completed, Cancelled
- Trip header management (create, edit, view, list, search, filter, archive)
- Trip member assignment with roles
- Trip status transitions (start, complete, cancel)
- Employee read access to assigned trips
- Trip and Trip Member API contracts and validation rules
- Integration points with Transactions (Outside only), Vehicles, Employees, and future Expenses

**Non-goals**:

- Expense recording implementation (future specification; P006 defines when expenses may attach)
- Analytics dashboards, operational reports, or GPS tracking
- Mobile application UI implementation (API contracts only)
- Redefining Company, User, Employee, Vehicle, Branch, Warehouse, or workforce rules from P001–P003
- Inbound or non-Outside transaction trip requirements
- Redefining transaction settlement workflow from P005

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manager Plans a Trip (Priority: P1)

A Manager or Owner needs to create a Draft trip, assign a vehicle and employees with roles, and
set origin, destination, and scheduled start so field operations can be coordinated in advance.

**Why this priority**: Trip planning is the foundation; without Draft trips no field work can be
scheduled or started.

**Independent Test**: A Manager creates a Draft trip with vehicle, two employees (Driver and
Helper), origin, destination, and scheduled start; assigned employees can view the upcoming trip;
no transactions may be linked while Draft.

**Acceptance Scenarios**:

1. **Given** an available vehicle and active employees, **When** a Manager creates a Draft trip
   with required header fields and members, **Then** the trip receives a unique Trip Number and
   status Draft.
2. **Given** a Draft trip, **When** a Manager updates origin, destination, scheduled start, vehicle,
   or members, **Then** changes are persisted while status remains Draft.
3. **Given** a Draft trip with assigned employees, **When** an assigned Employee views their trips,
   **Then** the upcoming Draft trip appears in their list.
4. **Given** a Draft trip, **When** a user attempts to link an Outside transaction, **Then** the
   request is rejected.

---

### User Story 2 - Manager Starts a Trip (Priority: P2)

A Manager or Owner needs to start a planned trip so assigned employees can perform Outside
transactions and record trip expenses in the field.

**Why this priority**: Starting a trip unlocks all operational value—vehicle and employee state
changes plus Outside transaction eligibility.

**Independent Test**: A Manager starts a Draft trip; status becomes Started, actual start is
recorded, vehicle becomes In Use, assigned employees become On Trip, and Outside transactions may
be linked to the trip.

**Acceptance Scenarios**:

1. **Given** a complete Draft trip with available vehicle and available employees, **When** a
   Manager starts the trip, **Then** status becomes Started and actual start timestamp is
   recorded.
2. **Given** a Started trip, **When** the assigned vehicle status is observed, **Then** it is In
   Use.
3. **Given** a Started trip, **When** assigned employee availability is observed, **Then** they
   are On Trip.
4. **Given** a Started trip and a timed-in assigned Employee, **When** the Employee creates an
   Outside transaction linked to the trip, **Then** the transaction is accepted per P004/P005 rules.
5. **Given** a vehicle already on an active Started trip, **When** another trip start is attempted
   with that vehicle, **Then** the request is rejected.
6. **Given** an employee already on an active Started trip, **When** they are assigned to another
   trip start, **Then** the request is rejected.

---

### User Story 3 - Manager Completes a Trip (Priority: P3)

A Manager or Owner needs to end an active trip so vehicle and employees return to available
operational state and no further Outside transactions may be linked.

**Why this priority**: Completing trips closes the operational window and restores resource
availability.

**Independent Test**: A Manager completes a Started trip; status becomes Completed, actual end is
recorded, vehicle becomes Available, employees become Available if still timed in, and new
transactions cannot be linked while expenses may still be added.

**Acceptance Scenarios**:

1. **Given** a Started trip, **When** a Manager completes it, **Then** status becomes Completed,
   actual end timestamp is recorded, and the trip is no longer active.
2. **Given** a Completed trip, **When** vehicle status is observed, **Then** it is Available
   (unless separately in Maintenance or Inactive per P002).
3. **Given** a Completed trip and an employee still timed in, **When** employee availability is
   observed, **Then** they are Available for new trips (not On Trip).
4. **Given** a Completed trip, **When** a user attempts to link a new Outside transaction, **Then**
   the request is rejected.
5. **Given** a Completed trip, **When** a Manager adds a trip expense (once Expenses module exists),
   **Then** the expense is accepted per P006 rules.

---

### User Story 4 - Manager Cancels a Draft Trip (Priority: P4)

A Manager or Owner needs to cancel a trip that will not proceed so it becomes read-only and does
not block vehicle or employee availability.

**Why this priority**: Cancellation prevents abandoned plans from cluttering active operations.

**Independent Test**: A Manager cancels a Draft trip; status becomes Cancelled, the trip is
read-only, and no transactions or expenses may be attached.

**Acceptance Scenarios**:

1. **Given** a Draft trip, **When** a Manager cancels it, **Then** status becomes Cancelled and
   the trip is read-only.
2. **Given** a Cancelled trip, **When** edit, start, or member changes are attempted, **Then** the
   requests are rejected.
3. **Given** a Started trip, **When** cancel is attempted, **Then** the request is rejected
   (must complete first).

---

### User Story 5 - Employee Views Assigned Trips (Priority: P5)

An Employee needs to see upcoming Draft trips, active Started trips, and completed trip history for
trips they are assigned to so they can prepare for and participate in field work.

**Why this priority**: Employees are trip participants but must not manage trip configuration.

**Independent Test**: An Employee lists and views trip detail only for trips where they are a
member; they cannot create, edit, start, complete, or cancel trips.

**Acceptance Scenarios**:

1. **Given** trips assigned and not assigned to an Employee, **When** the Employee lists trips,
   **Then** only assigned trips are returned.
2. **Given** an assigned Draft trip, **When** the Employee views detail, **Then** header, members,
   vehicle, schedule, and status are visible.
3. **Given** any trip, **When** an Employee attempts to create or modify a trip, **Then** the
   request is rejected.

---

### User Story 6 - Search and Filter Trips by Trip Number (Priority: P6)

Managers and Owners need to locate trips quickly by Trip Number, status, vehicle, employee, and date
range for coordination and reconciliation.

**Why this priority**: Trip Numbers are the primary business identifier for field operations.

**Independent Test**: A Manager searches by exact or partial Trip Number and filters by status;
results respect Company scope and authorization.

**Acceptance Scenarios**:

1. **Given** trips with assigned Trip Numbers, **When** a Manager searches by exact Trip Number,
   **Then** the matching trip is returned within Company scope.
2. **Given** multiple trips, **When** a Manager filters by status Started, **Then** only Started
   trips are returned.
3. **Given** a Trip Number belonging to another Company, **When** lookup is attempted, **Then**
   the trip is not found.

---

### Edge Cases

- What happens when a Draft trip is started without a vehicle assigned? Start is rejected.
- What happens when a Draft trip has no members? Start is rejected (at least one member required).
- What happens when scheduled start is in the past at creation? Allowed (planning correction); no
  automatic start.
- What happens when an assigned employee is archived or inactive? Assignment at create/edit is
  rejected; if archived after assignment but before start, start is rejected.
- What happens when assigned vehicle is archived, inactive, or in Maintenance? Assignment or start
  is rejected as appropriate.
- What happens when an Outside transaction is created without a Started trip? Rejected once P006
  enforcement is active.
- What happens when duplicate members are added to one trip? Rejected.
- What happens when archive is attempted on a Draft or Started trip? Rejected; only Completed or
  Cancelled trips may be archived.
- What happens when an employee times out while On Trip? They remain On Trip until the trip
  completes (trip assignment is independent of attendance session closure for availability
  blocking purposes).

## Requirements _(mandatory)_

### Functional Requirements

#### Trip identity and numbering

- **FR-001**: Every trip MUST receive a unique Trip Number immediately upon creation.
- **FR-002**: Trip Numbers MUST use the format `TRIP-YYYYMMDD-000001` where the six-digit suffix
  increments per Company per calendar day.
- **FR-003**: Trip Numbers MUST be unique within a Company.
- **FR-004**: Trip Numbers MUST never change once assigned.
- **FR-005**: Trip Numbers MUST be searchable and appear on reports and linked operational records.

#### Trip header

- **FR-006**: A trip MUST include Trip Number, status, scheduled start, vehicle, origin,
  destination, and optional notes.
- **FR-007**: Actual start MUST be recorded when a trip transitions to Started.
- **FR-008**: Actual end MUST be recorded when a trip transitions to Completed.
- **FR-009**: Origin and destination MUST be human-readable location descriptions (free text).
- **FR-010**: Each trip MUST belong to exactly one Company.

#### Trip members

- **FR-011**: A trip MUST support multiple employee members.
- **FR-012**: Each member MUST reference one Employee and one role within the trip.
- **FR-013**: Supported role examples include Driver, Helper, Buyer, and Supervisor; the system
  MUST validate roles against an allowed set defined for the Company or product defaults.
- **FR-014**: The same Employee MUST NOT appear more than once on the same trip.
- **FR-015**: At least one member MUST be present before a trip may start.

#### Trip lifecycle — Draft

- **FR-016**: Draft is the planning stage; Managers and Owners MAY create and edit trips.
- **FR-017**: While Draft, Managers and Owners MAY assign or change vehicle, members, origin,
  destination, scheduled start, and notes.
- **FR-018**: Assigned Employees MAY view Draft trips they belong to.
- **FR-019**: No Outside transactions MAY be linked while status is Draft.
- **FR-020**: No trip expenses MAY be recorded while status is Draft.

#### Trip lifecycle — Started

- **FR-021**: Only Managers and Owners MAY start a Draft trip.
- **FR-022**: Start MUST transition status to Started and record actual start time.
- **FR-023**: When Started, the assigned vehicle MUST become In Use.
- **FR-024**: When Started, assigned employees MUST become On Trip.
- **FR-025**: While Started, Outside transactions MAY be created and linked to the trip per P004
  rules.
- **FR-026**: While Started, trip expenses MAY be recorded once the Expenses module exists.
- **FR-027**: Draft header fields (vehicle, members, route) MUST NOT be editable while Started;
  correction flows are out of scope except via future amendment specifications.

#### Trip lifecycle — Completed

- **FR-028**: Only Managers and Owners MAY complete a Started trip.
- **FR-029**: Complete MUST transition status to Completed and record actual end time.
- **FR-030**: When Completed, the vehicle MUST return to Available unless otherwise constrained by
  P002 vehicle rules.
- **FR-031**: When Completed, assigned employees MUST return to Available if still timed in;
  employees not timed in follow normal workforce availability rules.
- **FR-032**: No additional Outside transactions MAY be linked after completion.
- **FR-033**: Trip expenses MAY still be added to Completed trips (post-trip expense capture).

#### Trip lifecycle — Cancelled

- **FR-034**: Only Managers and Owners MAY cancel a Draft trip.
- **FR-035**: Cancel MUST transition status to Cancelled; Cancelled trips are read-only.
- **FR-036**: Cancelled trips MUST NOT accept transactions or expenses.
- **FR-037**: Started trips MUST NOT be cancelled; they MUST be completed.

#### Concurrency and business rules

- **FR-038**: At most one Started trip MAY exist per vehicle at a time within a Company.
- **FR-039**: At most one Started trip MAY include a given employee at a time within a Company.
- **FR-040**: Outside transactions MUST require a Started trip once P006 enforcement is active.
- **FR-041**: Completed trips MUST NOT receive additional transactions.
- **FR-042**: Cancelled trips MUST be immutable.

#### Authorization

- **FR-043**: Only Managers and Owners MAY create, edit, start, complete, cancel, archive, list all
  company trips, and search trips.
- **FR-044**: Employees MAY only view trips where they are assigned members.
- **FR-045**: Employees MUST NOT create, edit, start, complete, cancel, or archive trips.
- **FR-046**: Cross-company access MUST be rejected for all trip operations.

#### Discovery and archive

- **FR-047**: Users MUST be able to list trips with pagination, sorting, and filters (status,
  vehicle, employee member, scheduled date range, Trip Number search).
- **FR-048**: Archive MUST be permitted only for Completed or Cancelled trips.
- **FR-049**: Archived trips MUST be excluded from default active lists but retrievable when
  explicitly requested.

#### Cross-cutting

- **FR-050**: P006 MUST integrate with existing Vehicle status values from P002 (`AVAILABLE`,
  `IN_USE`, `MAINTENANCE`, `INACTIVE`).
- **FR-051**: P006 MUST integrate with Transaction Outside location rules from P004/P005 without
  redefining transaction creation or settlement.
- **FR-052**: All trip status changes MUST be auditable (who acted and when).
- **FR-053**: Workforce dashboard trip summary placeholders from P003 MUST be populated from Trip
  data in a future dashboard update tied to this feature or a follow-on task.

### Key Entities _(include if feature involves data)_

- **Trip**: A Company-scoped operational outing coordinating vehicle, employees, schedule, route,
  and lifecycle status. Carries immutable Trip Number, scheduled/actual timestamps, origin,
  destination, notes, and relationships to Vehicle and Trip Members.
- **Trip Member**: An assignment linking one Employee to a Trip with a role (e.g., Driver, Helper).
- **Trip Number**: Business identifier assigned at creation; encodes date and daily sequence within
  Company.
- **Employee trip availability (logical)**: On Trip while assigned to a Started trip; Available when
  not on an active trip (subject to attendance and workforce rules from P003).
- **Vehicle trip usage (logical)**: In Use while assigned to a Started trip; Available when not on
  an active trip (subject to P002 vehicle status rules).

### API Contracts

All endpoints use the standard API response structure established in P001. Protected endpoints
require authenticated Company-bound access. Errors include validation failures, unauthenticated
access, forbidden role actions, not found, duplicate resource conflicts, and business rule or
lifecycle conflicts.

#### Trips

- **Create Trip**
  - Purpose: Create a Draft trip with header and optional initial members.
  - Method: `POST`
  - URI: `/api/v1/trips`
  - Request: scheduled start, vehicle identifier, origin, destination, optional notes, optional
    initial members (employee identifier and role each).
  - Response: Trip detail including assigned Trip Number and status Draft.
  - Errors: validation error, vehicle not found or unavailable, employee not found or inactive,
    forbidden (Employee), cross-company violation.

- **Update Trip**
  - Purpose: Edit a Draft trip header or replace member set.
  - Method: `PATCH`
  - URI: `/api/v1/trips/{tripId}`
  - Request: at least one mutable Draft field (scheduled start, vehicle, origin, destination,
    notes); member changes via dedicated member endpoints or embedded member list per API design
    consistency with P004 patterns.
  - Response: Updated trip detail.
  - Errors: not found, not Draft, forbidden, validation error, vehicle/employee conflicts.

- **Get Trip**
  - Purpose: Retrieve trip detail including header, members, and status timestamps.
  - Method: `GET`
  - URI: `/api/v1/trips/{tripId}`
  - Request: trip identifier.
  - Response: Trip detail with members, vehicle summary, and linked transaction count summary
    (optional aggregate, not full transaction payloads).
  - Errors: not found, forbidden (Employee not a member), cross-company violation.

- **List Trips**
  - Purpose: List trips within Company scope with search and filters.
  - Method: `GET`
  - URI: `/api/v1/trips`
  - Request: pagination, sort (scheduled start, created date, Trip Number), filters for status,
    vehicle, employee member, scheduled date range, Trip Number search (exact or prefix), include
    archived flag.
  - Response: Paginated collection of trip summaries.
  - Errors: unauthenticated, forbidden, validation error on filters.

- **List My Trips (Employee)**
  - Purpose: List trips assigned to the authenticated Employee.
  - Method: `GET`
  - URI: `/api/v1/trips/mine`
  - Request: pagination, optional status filter (Draft, Started, Completed).
  - Response: Paginated collection of trips where the caller is a member.
  - Errors: unauthenticated, forbidden (no linked employee profile).

- **Get Trip by Trip Number**
  - Purpose: Direct lookup for coordination and support.
  - Method: `GET`
  - URI: `/api/v1/trips/by-number/{tripNumber}`
  - Request: Trip Number path parameter.
  - Response: Trip detail within authorization scope.
  - Errors: not found, forbidden, cross-company violation.

- **Archive Trip**
  - Purpose: Soft-archive a Completed or Cancelled trip.
  - Method: `POST`
  - URI: `/api/v1/trips/{tripId}/archive`
  - Request: optional archive reason.
  - Response: Archived trip detail.
  - Errors: not found, not archivable status, forbidden, lifecycle conflict.

#### Trip members

- **Add Trip Member**
  - Purpose: Add an employee member to a Draft trip.
  - Method: `POST`
  - URI: `/api/v1/trips/{tripId}/members`
  - Request: employee identifier, role.
  - Response: Updated trip detail or created member record.
  - Errors: not found, not Draft, duplicate member, employee unavailable, forbidden.

- **Update Trip Member**
  - Purpose: Change a member role on a Draft trip.
  - Method: `PATCH`
  - URI: `/api/v1/trips/{tripId}/members/{memberId}`
  - Request: role.
  - Response: Updated member record.
  - Errors: not found, not Draft, forbidden, validation error.

- **Remove Trip Member**
  - Purpose: Remove a member from a Draft trip.
  - Method: `DELETE`
  - URI: `/api/v1/trips/{tripId}/members/{memberId}`
  - Request: none.
  - Response: success confirmation or updated trip detail.
  - Errors: not found, not Draft, cannot remove last member if start would violate minimum,
    forbidden.

#### Trip status

- **Start Trip**
  - Purpose: Transition Draft to Started and begin field operations.
  - Method: `POST`
  - URI: `/api/v1/trips/{tripId}/start`
  - Request: optional start note for audit.
  - Response: Trip detail with status Started and actual start recorded.
  - Errors: not found, not Draft, incomplete trip (missing vehicle, members, route), vehicle or
    employee already on active trip, forbidden, lifecycle conflict.

- **Complete Trip**
  - Purpose: Transition Started to Completed and end field operations.
  - Method: `POST`
  - URI: `/api/v1/trips/{tripId}/complete`
  - Request: optional completion note for audit.
  - Response: Trip detail with status Completed and actual end recorded.
  - Errors: not found, not Started, forbidden, lifecycle conflict.

- **Cancel Trip**
  - Purpose: Transition Draft to Cancelled.
  - Method: `POST`
  - URI: `/api/v1/trips/{tripId}/cancel`
  - Request: required cancellation reason.
  - Response: Trip detail with status Cancelled.
  - Errors: not found, not Draft, forbidden, lifecycle conflict.

#### Transaction integration (contractual requirement)

- **Create/Update Outside Transaction (extended from P004)**
  - Purpose: Outside transactions MUST reference a Started trip when P006 enforcement is active.
  - Method: existing P004 transaction endpoints.
  - URI: existing P004 transaction URIs.
  - Request: trip identifier required when location type is Outside.
  - Response: unchanged P004/P005 transaction shapes with trip reference validated.
  - Errors: trip not found, trip not Started, trip Completed or Cancelled, employee not a trip
    member when policy requires assignee on trip, validation error.

### Validation Rules

#### Trip validation

- Scheduled start MUST be a valid date-time.
- Origin and destination MUST be non-empty strings within documented length limits.
- Vehicle MUST belong to the same Company and be eligible for assignment (ACTIVE/AVAILABLE or
  equivalent per P002 at Draft; AVAILABLE at start).
- Notes MUST respect maximum length when provided.
- Trip Number is system-assigned; clients MUST NOT supply it on create.

#### Trip member validation

- Employee MUST belong to the same Company and be active (not archived/inactive).
- Role MUST be a non-empty allowed value.
- Duplicate employee on the same trip MUST be rejected.
- At least one member MUST exist before start.

#### Vehicle validation

- Vehicle MUST not be assigned to another Started trip.
- Vehicle in Maintenance or Inactive MUST NOT be assigned or started.
- Vehicle status MUST transition to In Use on start and Available on complete (unless Maintenance
  override exists from P002).

#### Business validation

| From      | To        | Allowed actors |
| --------- | --------- | -------------- |
| Draft     | Started   | Manager, Owner |
| Draft     | Cancelled | Manager, Owner |
| Started   | Completed | Manager, Owner |
| Completed | (none)    | terminal       |
| Cancelled | (none)    | terminal       |

- Start MUST require status Draft and all mandatory planning fields.
- Complete MUST require status Started.
- Cancel MUST require status Draft.
- Edit and member changes MUST require status Draft.
- Archive MUST require status Completed or Cancelled.
- Outside transaction link MUST require trip status Started.
- Post-completion transaction link MUST be rejected.
- Cancelled trip MUST reject all mutations except read and archive.

### Acceptance Criteria

- A Manager can create a Draft trip with vehicle, members, route, and schedule in a single flow
  and receive a unique Trip Number.
- Assigned Employees can view upcoming Draft and active Started trips within 30 seconds of
  assignment (under normal operating conditions).
- Starting a trip makes the vehicle In Use and blocks that vehicle from another Started trip until
  completion.
- Starting a trip marks assigned employees On Trip and blocks them from another Started trip until
  completion.
- Outside transactions cannot be created against Draft, Completed, or Cancelled trips once P006 is
  active.
- Outside transactions can be created against a Started trip when the employee satisfies P003/P004
  operational readiness rules.
- Completing a trip prevents new Outside transaction links while allowing expense attachment per
  P006 rules.
- Cancelling a Draft trip makes all trip data read-only with no linked transactions or expenses.
- Employees cannot modify any trip they can view.
- Trip search by Trip Number returns the correct trip within Company scope in authorized lists.
- 100% of trip status transitions record the acting user and timestamp for audit.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Managers can plan a complete Draft trip (vehicle, two members, route, schedule) in
  under 5 minutes using the API contract flows.
- **SC-002**: 100% of Outside transactions created after P006 enforcement include a valid Started
  trip reference.
- **SC-003**: Zero overlapping Started trips per vehicle or per employee within a Company in
  production data (concurrency rules enforced).
- **SC-004**: Assigned Employees can retrieve their active and upcoming trips on first request
  without seeing unassigned company trips.
- **SC-005**: Trip Number lookup by exact match returns the correct trip for authorized users in
  under 2 seconds under normal load.
- **SC-006**: 95% of field coordination scenarios (plan → start → transact → complete) complete
  without manual workaround once clients adopt the trip workflow.

## Assumptions

- P001 (Company & Identity), P002 (Organization including Vehicles), P003 (Workforce), P004
  (Transactions), and P005 (Settlement) are implemented and available.
- Trip roles use a fixed product allowlist (Driver, Helper, Buyer, Supervisor) unless extended by
  later configuration specifications.
- Cancel is permitted only from Draft; active Started trips must be Completed, not cancelled.
- Archive applies only to Completed and Cancelled trips, consistent with other Scrappy resources.
- Origin and destination are free-text fields; structured geocoding is out of scope for P006.
- Employee "On Trip" is a trip-driven availability state layered on workforce attendance rules from
  P003; timing out does not automatically remove On Trip status before trip completion.
- Expense recording endpoints are defined in a future specification; P006 only states when
  expenses may attach (Started and Completed, not Draft or Cancelled).
- GPS tracking, route optimization, and live maps are explicitly deferred.
- Trip enforcement on Outside transactions is activated as part of P006 delivery, superseding the
  optional trip link behavior documented in P004.

## Future Considerations

Future specifications will integrate Trips with:

- **Expenses** — record operational expenses against Started and Completed trips without
  redesigning the Trip model.
- **Analytics** — trip duration, utilization, and field productivity metrics keyed by Trip Number.
- **Reports** — trip summaries, member participation, and linked transaction totals.
- **GPS Tracking** — optional live location capture; the Trip header model does not require
  redesign to add coordinates later.

The Trip entity, Trip Number, lifecycle states, and member model are intended to remain stable as
these capabilities are added.
