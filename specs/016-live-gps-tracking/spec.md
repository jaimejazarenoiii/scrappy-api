# Feature Specification: P012 — Live GPS Tracking

**Feature Branch**: `[016-live-gps-tracking]`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Create Product Specification P012 - Live GPS Tracking for Scrappy. Real-time location monitoring for Employees on active (Started) Trips. Separate Tracking Application transmits coordinates. Business requirements only."

## Vision

Provide real-time visibility into active field operations by allowing authorized users to monitor
Employees participating in active Trips.

Tracking is intended only for operational awareness while a Trip is active. It supports dispatch,
coordination, and safety oversight without retaining historical route data.

## Objectives

- Allow Employees to share their live GPS location while assigned to an active Trip.
- Allow Owners and Managers to monitor active Trips in real time on an interactive map.
- Allow the system to determine whether a tracked Employee is online or offline.
- Maintain only each Employee's current location; historical GPS routes are out of scope.

## Scope

**Included**:

- Live GPS tracking during Started Trips
- Current Employee location (single latest point per Employee)
- Live Trip monitoring for authorized viewers
- Online / offline tracking status
- Real-time delivery of location updates to authorized viewers
- REST resource contracts and business-level real-time events
- Validation rules and measurable acceptance criteria

**Not included**:

- Route history, GPS playback, or route replay
- Geofencing, ETA calculation, or distance analytics
- Heat maps, historical reports, or driver performance analytics
- Tracking Application user interface design (client is a separate product)
- Redefining Trip lifecycle, authentication, workforce, subscription, or organization rules from
  P001–P011

**Terminology**: In this specification, **active Trip** means a Trip in **Started** status as
defined in P006 (Trip Management). Draft, Completed, and Cancelled Trips are not active for
tracking purposes.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Employee Shares Location During Active Trip (Priority: P1)

An Employee assigned to a Started Trip uses the Tracking Application to transmit their live GPS
location so the Company can monitor field operations in real time.

**Why this priority**: Location transmission is the foundation; without it, monitoring delivers no
value.

**Independent Test**: An authenticated Employee on a Started Trip submits a valid location; the
system stores it as their current location linked to Company, Employee, and Trip; subsequent
submissions replace the prior point.

**Acceptance Scenarios**:

1. **Given** an Employee assigned to a Started Trip and authenticated in the Tracking Application,
   **When** they transmit a valid GPS location, **Then** the system records it as their current
   location associated with the Company, Employee, and active Trip.
2. **Given** an Employee with an existing current location, **When** they transmit a newer location,
   **Then** the previous location is replaced and only the latest point is retained.
3. **Given** an Employee not assigned to any Started Trip, **When** they attempt to transmit a
   location, **Then** the update is rejected.
4. **Given** an unauthenticated caller, **When** a location transmission is attempted, **Then** the
   request is rejected.

---

### User Story 2 - Owner Monitors Active Trip Locations (Priority: P1)

A Company Owner needs to view live locations of all Employees assigned to Started Trips within the
Company on an interactive map, including tracking status and last update time.

**Why this priority**: Owner visibility is a primary business outcome for operational oversight.

**Independent Test**: With multiple Employees on Started Trips transmitting locations, an Owner
opens live monitoring and sees each Employee's current position, online/offline status, and last
location timestamp without manual page refresh.

**Acceptance Scenarios**:

1. **Given** Started Trips with transmitting Employees, **When** an Owner requests current
   locations for a Trip, **Then** they receive each assigned Employee's latest location, tracking
   status, and last update timestamp.
2. **Given** a new location is transmitted by an Employee on a monitored Trip, **When** the Owner
   is viewing that Trip, **Then** the displayed location updates without manual refresh.
3. **Given** an Employee has not transmitted a location recently, **When** an Owner views tracking
   status, **Then** the Employee is shown as Offline.
4. **Given** a Completed or Cancelled Trip, **When** an Owner requests live locations, **Then**
   tracking is not active and current locations for that Trip context are no longer updated.

---

### User Story 3 - Manager Monitors Authorized Active Trips (Priority: P2)

A Manager needs to monitor live locations for Started Trips they are authorized to view within the
Company, consistent with existing Trip visibility rules from P006.

**Why this priority**: Managers are day-to-day operators who coordinate field work and need the
same live visibility as Owners within their authorization scope.

**Independent Test**: A Manager views live locations for Started Trips in their Company; Employees
on those Trips appear on the map with status; Trips outside their visibility scope are not exposed.

**Acceptance Scenarios**:

1. **Given** Started Trips the Manager is authorized to view, **When** they request Trip locations,
   **Then** they receive current locations for assigned Employees on those Trips.
2. **Given** real-time updates for a monitored Trip, **When** an assigned Employee transmits a new
   location, **Then** the Manager's view reflects the update without manual refresh.
3. **Given** an Employee role user, **When** they attempt to view another Employee's location,
   **Then** the request is denied.

---

### User Story 4 - Tracking Application Authenticates and Identifies Employee (Priority: P2)

The Tracking Application must authenticate using the existing Scrappy identity system and derive
Company and Employee context from the authenticated session without accepting manual identity
overrides.

**Why this priority**: Secure, non-spoofable identity binding is required before any location data
is accepted.

**Independent Test**: The Tracking Application logs in with Employee credentials; transmitted
locations are attributed to the authenticated Employee and their Company automatically; attempts to
supply a different Employee or Company identifier are ignored or rejected.

**Acceptance Scenarios**:

1. **Given** valid Employee credentials, **When** the Tracking Application authenticates, **Then**
   subsequent location transmissions are bound to that Employee and Company.
2. **Given** an authenticated Employee session, **When** a location request includes a different
   Employee or Company identifier, **Then** the system does not accept impersonation and attributes
   the location only to the authenticated identity.
3. **Given** a Company with blocked subscription status per P011, **When** the Employee attempts to
   authenticate or transmit locations, **Then** access is denied under existing subscription rules.

---

### User Story 5 - Tracking Stops When Trip Ends (Priority: P2)

When a Trip is Completed or would-be-cancelled (Started Trips are completed, not cancelled per
P006), live tracking for that Trip must stop immediately and viewers must no longer receive live
updates for that Trip context.

**Why this priority**: Tracking is strictly operational during active field work; continuing after
trip end violates scope and privacy expectations.

**Independent Test**: Complete a Started Trip while Employees are transmitting; further
transmissions for that Trip are rejected; viewers receive a tracking-stopped indication for that
Trip.

**Acceptance Scenarios**:

1. **Given** a Started Trip with active tracking, **When** a Manager or Owner completes the Trip,
   **Then** live tracking for that Trip stops immediately.
2. **Given** a Completed Trip, **When** a formerly assigned Employee transmits a location,
   **Then** the update is rejected unless they are on a different Started Trip.
3. **Given** tracking stops for a Trip, **When** authorized viewers are subscribed to that Trip,
   **Then** they are informed that tracking has stopped for that Trip.

---

### User Story 6 - Super Admin Observability Across Companies (Priority: P3)

A Scrappy Super Admin may observe live tracking across Companies for platform support and
operational troubleshooting, without transmitting locations as an Employee.

**Why this priority**: Platform administration is secondary to tenant operational monitoring but
supports support workflows.

**Independent Test**: A Super Admin requests live Trip locations for any Company; receives the
same location payload shape as tenant admins; cannot transmit GPS as an Employee unless they hold a
separate Employee identity (out of normal Super Admin workflow).

**Acceptance Scenarios**:

1. **Given** Started Trips in any Company, **When** a Super Admin requests current Trip locations
   for that Company, **Then** live location data is returned.
2. **Given** a Super Admin without an Employee profile, **When** they attempt to transmit a GPS
   location, **Then** the request is rejected.

---

### Edge Cases

- What happens when an Employee is assigned to a Started Trip but has never transmitted a location?
  They appear in Trip monitoring with no coordinates (or empty location state) and Offline status
  until the first valid transmission.
- What happens when GPS accuracy is poor or coordinates are invalid? The location update is
  rejected; the prior current location (if any) remains unchanged.
- What happens when an Employee's device loses connectivity? No new locations arrive; status
  transitions to Offline after the staleness window elapses; last known location and timestamp remain
  visible until tracking stops or a newer location arrives.
- What happens when two location updates arrive out of order? Only a location with a timestamp
  newer than the stored last update replaces the current location; stale updates are ignored.
- What happens when an Employee is removed from a Started Trip (if member changes were allowed)?
  Per P006, member changes are not permitted while Started; this edge case does not apply during
  active tracking.
- What happens when a Trip completes while the Tracking Application is mid-session? Subsequent
  transmissions for that Trip are rejected; the app should receive a business-level tracking-stopped
  signal.
- What happens when an Employee is on one Started Trip and attempts to transmit without trip
  context? The system resolves the Employee's single active Started Trip per P006 concurrency
  rules; if none exists, transmission is rejected.
- What happens when cross-Company access is attempted? Rejected for all operations.

## Requirements _(mandatory)_

### Functional Requirements

#### Location ingestion (Tracking Application / Employee)

- **FR-001**: Only authenticated Employees MAY transmit GPS locations.
- **FR-002**: The Tracking Application MUST authenticate using the existing Scrappy authentication
  system; Company and Employee identity MUST be derived from the authenticated session.
- **FR-003**: The Tracking Application MUST NOT manually specify Company or Employee identity in a
  way that overrides the authenticated identity.
- **FR-004**: Employees MAY transmit locations only while assigned to a Started Trip.
- **FR-005**: Each location transmission MUST be associated with exactly one Company, one Employee,
  and one Started Trip.
- **FR-006**: The system MUST maintain at most one current location per Employee.
- **FR-007**: A newer valid location MUST replace the Employee's previous current location; the
  system MUST NOT retain historical location points.
- **FR-008**: Location transmissions MUST be rejected when no Started Trip exists for the Employee.
- **FR-009**: Location transmissions MUST be rejected for unauthorized or unauthenticated callers.
- **FR-010**: Employees MUST NOT transmit locations on behalf of other Employees.

#### Live monitoring (Owner / Manager)

- **FR-011**: Owners MUST be able to view current locations of Employees assigned to Started Trips
  within their Company.
- **FR-012**: Managers MUST be able to view current locations for Started Trips they are authorized
  to view within their Company, consistent with Trip visibility rules from P006.
- **FR-013**: Authorized viewers MUST see each tracked Employee's current coordinates (when
  available), tracking status (Online or Offline), and last location timestamp.
- **FR-014**: Authorized viewers MUST be able to view current locations in the context of a
  specific Started Trip and as a Company-wide view of all active Trip tracking.
- **FR-015**: Employees MUST NOT view locations of other Employees.
- **FR-016**: Scrappy Super Admins MUST be able to view live Trip locations across all Companies
  for platform support purposes.
- **FR-017**: Cross-Company access MUST be rejected for tenant roles.

#### Real-time delivery

- **FR-018**: When a new current location is accepted, the system MUST make the updated location
  available to authorized viewers immediately.
- **FR-019**: Authorized viewers monitoring a Trip MUST receive location updates without manually
  refreshing the page.
- **FR-020**: Business-level real-time notifications MUST inform authorized viewers when tracking
  starts, a location is updated, an Employee becomes online or offline, and tracking stops for a
  Trip.

#### Tracking status

- **FR-021**: Each tracked Employee MUST expose a tracking status of Online or Offline.
- **FR-022**: Online indicates a recent location was received within the configured staleness
  window.
- **FR-023**: Offline indicates no location has been received within the staleness window.
- **FR-024**: Tracking status MUST be evaluable whenever current location is queried and whenever
  status changes.

#### Trip lifecycle integration

- **FR-025**: Live tracking MUST be permitted only while the associated Trip is in Started status.
- **FR-026**: Completing a Started Trip MUST immediately stop live tracking for that Trip.
- **FR-027**: When tracking stops for a Trip, authorized viewers MUST be notified via a
  tracking-stopped business event.
- **FR-028**: Draft, Completed, and Cancelled Trips MUST NOT accept location transmissions.
- **FR-029**: P012 MUST integrate with Trip member assignment and Started status from P006 without
  redefining Trip lifecycle rules.

#### Data and privacy boundaries

- **FR-030**: The system MUST NOT store historical GPS routes or past location snapshots beyond the
  single current location per Employee.
- **FR-031**: Current location data MUST be scoped to Company tenancy; tenant users MUST only access
  locations within their Company except Super Admin platform access.
- **FR-032**: Subscription and account access rules from P011 MUST continue to gate authentication;
  blocked Companies MUST NOT transmit or monitor locations through normal tenant flows.

#### Cross-cutting

- **FR-033**: All location acceptance and rejection outcomes MUST be auditable for support (actor,
  trip, timestamp, outcome) without retaining rejected coordinate history.
- **FR-034**: Location updates SHOULD tolerate intermittent mobile connectivity; last known good
  location remains visible until replaced or tracking stops.

### Key Entities _(include if feature involves data)_

- **Employee Current Location**: The single latest known geographic position for an Employee,
  including coordinates, accuracy indicator (when provided by the client), capture timestamp, and
  associations to Company, Employee, and active Started Trip. Replaced atomically on each accepted
  update; not historized.
- **Tracking Status (logical)**: Derived Online/Offline state for an Employee based on elapsed time
  since the last accepted location timestamp relative to a staleness window.
- **Live Trip View (logical)**: The set of assigned Employees on a Started Trip with their current
  location (if any), tracking status, and last update time—presented for authorized monitoring.
- **Tracking Session Context (logical)**: The binding between an authenticated Employee, their
  Company, and their current Started Trip during location transmission; resolved by the system, not
  supplied by the client.

### API Contracts

All endpoints use the standard API response structure established in P001. Protected endpoints
require authenticated access. Location transmission endpoints require an authenticated Employee with
a linked Employee profile. Monitoring endpoints require Owner, Manager, or Super Admin as specified.
Errors include validation failures, unauthenticated access, forbidden role actions, not found,
business rule conflicts, and trip lifecycle conflicts.

#### Submit / update current location

- **Purpose**: Accept a GPS location from the Tracking Application for the authenticated Employee
  on their active Started Trip and replace their current location.
- **Method**: `PUT`
- **URI**: `/api/v1/tracking/location`
- **Required request**: geographic coordinates (latitude and longitude within valid Earth bounds),
  location capture timestamp, optional accuracy indicator, optional movement metadata (e.g., speed,
  heading) when available from the device.
- **Successful response**: Confirmed current location summary including Employee reference, Trip
  reference, coordinates, capture timestamp, and tracking status Online.
- **Possible errors**: unauthenticated; forbidden (non-Employee or no linked Employee profile);
  validation error (invalid coordinates or timestamp); no active Started Trip; Trip not Started;
  subscription or account inactive; stale timestamp rejected (older than stored current location).

#### Get Employee current location

- **Purpose**: Retrieve the latest known location and tracking status for one Employee within
  authorization scope.
- **Method**: `GET`
- **URI**: `/api/v1/tracking/employees/{employeeId}/location`
- **Required request**: Employee identifier.
- **Successful response**: Current location (if any), tracking status, last update timestamp, active
  Trip reference when tracking is active, or empty location state when the Employee has never
  transmitted during the current active Trip.
- **Possible errors**: unauthenticated; forbidden (Employee viewing another Employee; Manager/Owner
  outside scope); not found; cross-Company violation.

#### Get current locations for a Trip

- **Purpose**: Retrieve live locations for all assigned Employees on a specific Started Trip for
  map display and operational monitoring.
- **Method**: `GET`
- **URI**: `/api/v1/trips/{tripId}/tracking/locations`
- **Required request**: Trip identifier.
- **Successful response**: Trip identifier and status; collection of assigned Employees each with
  Employee summary, current location (if any), tracking status, and last update timestamp; trip-level
  tracking active flag.
- **Possible errors**: unauthenticated; forbidden; not found; cross-Company violation; Trip not in
  Started status (returns not active for live tracking—Completed/Cancelled/Draft trips do not
  stream live updates).

#### List current locations for active Trips

- **Purpose**: Provide a Company-wide live monitoring view of all Started Trips with tracked
  Employees (Owner/Manager dashboard map).
- **Method**: `GET`
- **URI**: `/api/v1/tracking/trips/active/locations`
- **Required request**: optional filters (Trip identifier, Employee identifier) within Company
  scope; pagination when the result set is large.
- **Successful response**: Paginated collection of active Trip tracking summaries, each including
  Trip summary and assigned Employee location entries with tracking status and last update
  timestamp.
- **Possible errors**: unauthenticated; forbidden; validation error on filters; cross-Company
  violation.

#### Get tracking status

- **Purpose**: Retrieve Online/Offline tracking status and last update time for an Employee without
  requiring full coordinate detail (lightweight polling fallback).
- **Method**: `GET`
- **URI**: `/api/v1/tracking/employees/{employeeId}/status`
- **Required request**: Employee identifier.
- **Successful response**: Tracking status (Online or Offline), last location timestamp (if any),
  active Trip reference when applicable.
- **Possible errors**: unauthenticated; forbidden; not found; cross-Company violation.

#### Super Admin — list active Trip locations for a Company

- **Purpose**: Platform support view of live tracking for a specified Company.
- **Method**: `GET`
- **URI**: `/api/v1/admin/companies/{companyId}/tracking/trips/active/locations`
- **Required request**: Company identifier; optional Trip filter.
- **Successful response**: Same shape as tenant active Trip locations list, scoped to the requested
  Company.
- **Possible errors**: unauthenticated; forbidden (non–Super Admin); not found.

### WebSocket Events (business-level)

These events describe what authorized subscribers SHOULD be notified of in real time. They do not
prescribe transport, protocol, or payload encoding.

- **Location Updated**: An assigned Employee's current location changed. Purpose: refresh map
  markers for authorized viewers monitoring the Trip or Employee.
- **Tracking Started**: Live tracking became active for an Employee on a Started Trip (typically upon
  first accepted location for that Trip). Purpose: inform viewers that a new trackable Employee
  appeared on the map.
- **Tracking Stopped**: Live tracking ended for a Trip or Employee because the Trip Completed or
  location transmission ceased to be valid for that Trip. Purpose: remove or dim tracking indicators
  and stop expecting updates for that Trip context.
- **Employee Online**: An Employee's tracking status changed to Online after a recent location was
  received. Purpose: update status badges and reassure operators the field worker is connected.
- **Employee Offline**: An Employee's tracking status changed to Offline because no recent location
  was received within the staleness window. Purpose: alert operators to possible connectivity or
  device issues.

Subscribers MUST only receive events for Trips and Employees within their authorization scope.
Super Admin subscribers MAY receive events across Companies when explicitly subscribed in a platform
support context.

### Validation Rules

#### Employee validation

- Caller MUST be authenticated with the Employee role (or equivalent Tracking Application identity
  tied to an Employee profile).
- Caller MUST have an active linked Employee record within the Company.
- Caller MUST NOT specify a different Employee identifier than the authenticated identity.
- Employee MUST be assigned as a member of the target Started Trip.
- Employee account and Company MUST satisfy existing active-account and subscription entitlement
  rules from P001 and P011.

#### Trip validation

- Trip MUST exist and belong to the same Company as the Employee.
- Trip status MUST be Started for location transmission and live monitoring.
- Trip MUST NOT be Draft, Completed, or Cancelled for accepting new locations.
- At most one Started Trip per Employee per Company (per P006) simplifies Trip resolution when the
  client does not specify a Trip identifier.

#### Authentication validation

- Requests without valid authentication MUST be rejected.
- Tracking Application sessions MUST use the same Scrappy authentication system as other clients.
- Token expiry and revocation follow existing session rules; revoked sessions MUST NOT transmit
  locations.

#### Location validation

- Latitude MUST be within −90 to +90 degrees; longitude MUST be within −180 to +180 degrees.
- Capture timestamp MUST be present and MUST NOT be unreasonably far in the future relative to
  server receive time.
- Updates with capture timestamps older than the stored current location timestamp MUST be ignored
  or rejected to prevent out-of-order regression.
- Optional accuracy, speed, and heading values MUST fall within validated ranges when provided.

#### Tracking status validation

- Online MUST require a stored current location timestamp within the staleness window.
- Offline MUST apply when no location exists or the last timestamp is older than the staleness
  window.
- Status MUST re-evaluate on each new location and on status queries.

#### Business rule validation

- One current location per Employee MUST be enforced.
- Historical locations MUST NOT be persisted.
- Cross-Company access MUST be rejected.
- Employees MUST NOT read other Employees' locations.
- Super Admin read access MUST NOT imply Employee transmit privileges.

### Business Rules

- Every live location belongs to exactly one Company, one Employee, and one Started Trip.
- Only Employees assigned to Started Trips may transmit locations.
- Only authenticated Employees may transmit locations; impersonation is prohibited.
- Only one current location exists per Employee; newer valid locations replace older ones.
- Completing a Started Trip immediately ends live tracking for that Trip.
- Historical GPS records are not stored.
- Tracking is for operational awareness during active field work only.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Authorized Owners and Managers see location updates on an active Trip within 5
  seconds of an Employee transmitting a new location under normal operating conditions.
- **SC-002**: 100% of location transmissions from Employees not on a Started Trip are rejected.
- **SC-003**: 100% of location transmissions after Trip completion for that Trip are rejected.
- **SC-004**: Zero historical location points are retained beyond the single current location per
  Employee (verifiable by absence of route history APIs and storage behavior).
- **SC-005**: Employees attempting to view another Employee's location receive a forbidden outcome
  in 100% of unauthorized attempts.
- **SC-006**: Tracking status correctly reflects Offline within 1 minute after the staleness window
  elapses with no new locations (given default 5-minute window, Offline within 6 minutes of last
  update).
- **SC-007**: At least 95% of field operators successfully begin transmitting location on their
  first Started Trip session without administrator intervention (measured during pilot rollout).
- **SC-008**: Super Admin support staff can retrieve live active Trip locations for any Company in
  a single request without cross-tenant data leakage.

## Assumptions

- **Active Trip** aligns with P006 **Started** status; the terms are used interchangeably in
  operator-facing language.
- Manager Trip visibility follows P006 Company-scoped Trip list rules unless a future specification
  introduces branch-scoped Manager restrictions.
- **Staleness window** for Offline status defaults to **5 minutes** without a recent accepted
  location; this default may be adjusted per Company in a future settings specification.
- The Tracking Application is a separate mobile client that obtains GPS from the device OS and
  sends periodic updates at an interval appropriate for battery and connectivity (recommended
  client interval: 30–60 seconds while tracking active); interval tuning is a client concern.
- Philippine Time (UTC+8) display conventions from the platform apply to timestamps shown to users.
- Location transmission requires mobile network or data connectivity; offline device behavior is
  limited to last known location display.
- P011 subscription gating applies through existing authentication; no separate tracking
  entitlement flag is introduced in P012.
- Map rendering and interactive map UI are client responsibilities; the API supplies coordinates
  and status only.

## Future Considerations

Future versions may introduce capabilities without redesigning the Live Tracking architecture:

- Route history and GPS playback / route replay
- Geofencing and arrival alerts
- ETA calculation and distance reports
- Heat maps and operational density views
- Driver performance analytics

The current model—single current location per Employee, Trip-scoped tracking during Started status,
and real-time fan-out to authorized viewers—is intended to extend by adding optional historized
location streams or analytics modules rather than replacing core tracking behavior.

## Dependencies

- **P001** — Company & Identity Foundation (authentication, roles, standard response envelope)
- **P003** — Workforce Management (Employee profiles linked to Users)
- **P006** — Trip Management (Started Trip lifecycle, member assignment, concurrency rules)
- **P011** — Company Subscription Management (login and access gating)
