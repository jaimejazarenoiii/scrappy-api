# Feature Specification: P002 - Organization Management

**Feature Branch**: `[003-organization-management]`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Create Product Specification P002 - Organization Management for Scrappy."

## Vision

Organization Management extends the Company foundation by giving each Company a structured way to manage the operational resources used in daily work. It establishes the core operational records that future workforce assignment, trip execution, transaction capture, and expense tracking depend on.

**Purpose**:

- Enable each Company to maintain accurate operational locations and vehicles.
- Define clear ownership boundaries for Branches, Warehouses, and Vehicles.
- Provide stable business rules for creating, updating, listing, viewing, and archiving organization resources.
- Prepare shared resource definitions for future operational modules without redefining Company or Identity concepts from P001.

**Scope**:

- Branch management
- Warehouse management
- Vehicle management
- Company ownership rules for all organization resources
- Resource lifecycle behavior, including archive rules and operational availability
- REST API contracts for organization resources
- Validation rules and measurable acceptance criteria

**Non-goals**:

- Employee assignment to Branches or Warehouses
- Vehicle assignment to Trips
- Transaction workflows tied to Branches or Warehouses
- Expense workflows tied to Branches, Warehouses, or Vehicles
- Route planning, scheduling, dispatching, or maintenance workflows
- Redefining Company, User, Employee, authentication, or authorization foundations established in P001

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manage Branches (Priority: P1)

An Owner or authorized Manager needs to create and maintain Branch records so operational activities can be tied to known business locations within the Company.

**Why this priority**: Branches are foundational operational records that future business flows depend on, and they provide immediate value by defining Company locations for day-to-day operations.

**Independent Test**: Can be fully tested by creating, viewing, updating, listing, and archiving Branch records for a single Company while confirming archived Branches no longer appear in normal operational lists.

**Acceptance Scenarios**:

1. **Given** an active Company with no matching Branch name, **When** an authorized user creates a Branch with valid details, **Then** the Branch is created and belongs to that Company.
2. **Given** a Branch belongs to a Company, **When** an authorized user views or updates that Branch, **Then** the system returns the Branch details within the same Company boundary.
3. **Given** a Branch has been archived, **When** an authorized user requests the normal Branch list, **Then** the archived Branch is excluded from the operational list.

---

### User Story 2 - Manage Warehouses (Priority: P2)

An Owner or authorized Manager needs to manage Warehouse records so storage and operational facilities are consistently defined within the Company.

**Why this priority**: Warehouses are core organizational resources that support future inventory, transaction, and expense workflows, but they depend on the same ownership patterns already established by Branch management.

**Independent Test**: Can be fully tested by creating, viewing, updating, listing, and archiving Warehouse records for one Company while verifying uniqueness and archive behavior.

**Acceptance Scenarios**:

1. **Given** an active Company and no conflicting Warehouse name within that Company, **When** an authorized user creates a Warehouse, **Then** the Warehouse is stored under that Company.
2. **Given** an existing Warehouse record, **When** an authorized user updates its operational details, **Then** the changes are reflected in future Warehouse views and lists.
3. **Given** a Warehouse is archived, **When** operational Warehouse records are listed, **Then** the archived Warehouse does not appear in the normal list.

---

### User Story 3 - Manage Vehicles (Priority: P3)

An Owner or authorized Manager needs to maintain Vehicle records so the Company has a controlled list of operational vehicles available for future trips and logistics activities.

**Why this priority**: Vehicles are required for future trip and logistics capabilities, but they can be introduced after location records because they are not required for all operational setups.

**Independent Test**: Can be fully tested by creating, viewing, updating, listing, and archiving Vehicles while validating status behavior and plate-number uniqueness within a Company.

**Acceptance Scenarios**:

1. **Given** an active Company and no duplicate plate number within that Company, **When** an authorized user creates a Vehicle, **Then** the Vehicle is created with a valid status and Company ownership.
2. **Given** a Vehicle exists without any Trip assignment, **When** an authorized user views or updates the Vehicle, **Then** the Vehicle remains valid as an independent operational resource.
3. **Given** a Vehicle is archived or marked unavailable for operations, **When** normal operational Vehicles are listed or selected for future work, **Then** that Vehicle is not available for operational use.

---

### Edge Cases

- What happens when a Branch or Warehouse name duplicates another active resource of the same type within the same Company?
- How does the system behave when a user attempts to access a Branch, Warehouse, or Vehicle belonging to a different Company?
- What happens when an archived resource is requested directly by identifier?
- How does the system behave when a Vehicle status is changed to `Inactive` while future operational records have not yet been created?
- What happens when optional contact or descriptive fields are omitted during resource creation?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST allow an authorized user to create a Branch for exactly one Company.
- **FR-002**: The system MUST allow an authorized user to view a Branch belonging to their Company.
- **FR-003**: The system MUST allow an authorized user to update Branch details belonging to their Company.
- **FR-004**: The system MUST allow an authorized user to archive a Branch without permanently deleting it.
- **FR-005**: The system MUST provide a Branch listing endpoint that returns operational Branch records for the requesting Company.
- **FR-006**: The system MUST allow an authorized user to create a Warehouse for exactly one Company.
- **FR-007**: The system MUST allow an authorized user to view a Warehouse belonging to their Company.
- **FR-008**: The system MUST allow an authorized user to update Warehouse details belonging to their Company.
- **FR-009**: The system MUST allow an authorized user to archive a Warehouse without permanently deleting it.
- **FR-010**: The system MUST provide a Warehouse listing endpoint that returns operational Warehouse records for the requesting Company.
- **FR-011**: The system MUST allow an authorized user to create a Vehicle for exactly one Company.
- **FR-012**: The system MUST allow an authorized user to view a Vehicle belonging to their Company.
- **FR-013**: The system MUST allow an authorized user to update Vehicle details belonging to their Company.
- **FR-014**: The system MUST allow an authorized user to archive a Vehicle without permanently deleting it.
- **FR-015**: The system MUST provide a Vehicle listing endpoint that returns operational Vehicle records for the requesting Company.
- **FR-016**: Every Branch MUST belong to exactly one Company.
- **FR-017**: Every Warehouse MUST belong to exactly one Company.
- **FR-018**: Every Vehicle MUST belong to exactly one Company.
- **FR-019**: The system MUST prevent users from viewing or modifying Branches outside their Company boundary.
- **FR-020**: The system MUST prevent users from viewing or modifying Warehouses outside their Company boundary.
- **FR-021**: The system MUST prevent users from viewing or modifying Vehicles outside their Company boundary.
- **FR-022**: Archived Branches, Warehouses, and Vehicles MUST NOT appear in normal operational lists.
- **FR-023**: Archived Branches, Warehouses, and Vehicles MUST remain retained for historical reference and MUST NOT be permanently deleted through this feature.
- **FR-024**: Branches and Warehouses MUST be allowed to exist without employee assignments.
- **FR-025**: Vehicles MUST be allowed to exist without Trip assignments.
- **FR-026**: Branch names MUST be unique within a Company.
- **FR-027**: Warehouse names MUST be unique within a Company.
- **FR-028**: Vehicle plate numbers MUST be unique within a Company.
- **FR-029**: The system MUST store Branch fields including name, address, contact number, and status.
- **FR-030**: The system MUST store Warehouse fields including name, address, contact number, and status.
- **FR-031**: The system MUST store Vehicle fields including plate number, description, and status.
- **FR-032**: Vehicle status MUST support `Available`, `In Use`, `Maintenance`, and `Inactive`.
- **FR-033**: Only active resources MUST be available for future operational selection.
- **FR-034**: Archived resources MUST NOT be eligible for future operational selection.
- **FR-035**: The system MUST support role-appropriate resource management behavior where Owners can manage all organization resources, Managers can manage organization resources according to assigned permissions, and Employees can view organization resources when required for operations.
- **FR-036**: The API contract for each Branch, Warehouse, and Vehicle endpoint MUST define its purpose, HTTP method, URI, required request fields, successful response, and possible errors.
- **FR-037**: Resource list endpoints MUST clearly distinguish operational list behavior from archived-record exclusion.
- **FR-038**: The feature MUST extend P001 without redefining Company or Identity concepts already established in the platform foundation.

### API Contracts

#### Branches

- **Create Branch**
  - Purpose: Create a new Branch owned by the authenticated Company.
  - HTTP Method: `POST`
  - URI: `/api/v1/branches`
  - Required Request Fields: `name`, `address`, `contactNumber`, `status`
  - Response: Created Branch resource in the standard API response structure.
  - Errors: validation error, duplicate name conflict, unauthenticated request, forbidden request, cross-company access rejection.

- **View Branch**
  - Purpose: Retrieve one Branch owned by the authenticated Company.
  - HTTP Method: `GET`
  - URI: `/api/v1/branches/{branchId}`
  - Required Request Fields: `branchId`
  - Response: Branch resource in the standard API response structure.
  - Errors: not found, unauthenticated request, forbidden request, cross-company access rejection.

- **Update Branch**
  - Purpose: Update an existing Branch owned by the authenticated Company.
  - HTTP Method: `PATCH`
  - URI: `/api/v1/branches/{branchId}`
  - Required Request Fields: `branchId` and at least one mutable Branch field.
  - Response: Updated Branch resource in the standard API response structure.
  - Errors: validation error, duplicate name conflict, not found, unauthenticated request, forbidden request, cross-company access rejection.

- **Archive Branch**
  - Purpose: Archive a Branch without permanent deletion.
  - HTTP Method: `POST`
  - URI: `/api/v1/branches/{branchId}/archive`
  - Required Request Fields: `branchId`
  - Response: Archived Branch resource or lifecycle confirmation in the standard API response structure.
  - Errors: not found, already archived lifecycle conflict, unauthenticated request, forbidden request, cross-company access rejection.

- **List Branches**
  - Purpose: Return operational Branches for the authenticated Company.
  - HTTP Method: `GET`
  - URI: `/api/v1/branches`
  - Required Request Fields: none
  - Response: Collection of Branch resources in the standard API response structure.
  - Errors: unauthenticated request, forbidden request.

#### Warehouses

- **Create Warehouse**
  - Purpose: Create a new Warehouse owned by the authenticated Company.
  - HTTP Method: `POST`
  - URI: `/api/v1/warehouses`
  - Required Request Fields: `name`, `address`, `contactNumber`, `status`
  - Response: Created Warehouse resource in the standard API response structure.
  - Errors: validation error, duplicate name conflict, unauthenticated request, forbidden request, cross-company access rejection.

- **View Warehouse**
  - Purpose: Retrieve one Warehouse owned by the authenticated Company.
  - HTTP Method: `GET`
  - URI: `/api/v1/warehouses/{warehouseId}`
  - Required Request Fields: `warehouseId`
  - Response: Warehouse resource in the standard API response structure.
  - Errors: not found, unauthenticated request, forbidden request, cross-company access rejection.

- **Update Warehouse**
  - Purpose: Update an existing Warehouse owned by the authenticated Company.
  - HTTP Method: `PATCH`
  - URI: `/api/v1/warehouses/{warehouseId}`
  - Required Request Fields: `warehouseId` and at least one mutable Warehouse field.
  - Response: Updated Warehouse resource in the standard API response structure.
  - Errors: validation error, duplicate name conflict, not found, unauthenticated request, forbidden request, cross-company access rejection.

- **Archive Warehouse**
  - Purpose: Archive a Warehouse without permanent deletion.
  - HTTP Method: `POST`
  - URI: `/api/v1/warehouses/{warehouseId}/archive`
  - Required Request Fields: `warehouseId`
  - Response: Archived Warehouse resource or lifecycle confirmation in the standard API response structure.
  - Errors: not found, already archived lifecycle conflict, unauthenticated request, forbidden request, cross-company access rejection.

- **List Warehouses**
  - Purpose: Return operational Warehouses for the authenticated Company.
  - HTTP Method: `GET`
  - URI: `/api/v1/warehouses`
  - Required Request Fields: none
  - Response: Collection of Warehouse resources in the standard API response structure.
  - Errors: unauthenticated request, forbidden request.

#### Vehicles

- **Create Vehicle**
  - Purpose: Create a new Vehicle owned by the authenticated Company.
  - HTTP Method: `POST`
  - URI: `/api/v1/vehicles`
  - Required Request Fields: `plateNumber`, `description`, `status`
  - Response: Created Vehicle resource in the standard API response structure.
  - Errors: validation error, duplicate plate-number conflict, unauthenticated request, forbidden request, cross-company access rejection.

- **View Vehicle**
  - Purpose: Retrieve one Vehicle owned by the authenticated Company.
  - HTTP Method: `GET`
  - URI: `/api/v1/vehicles/{vehicleId}`
  - Required Request Fields: `vehicleId`
  - Response: Vehicle resource in the standard API response structure.
  - Errors: not found, unauthenticated request, forbidden request, cross-company access rejection.

- **Update Vehicle**
  - Purpose: Update an existing Vehicle owned by the authenticated Company.
  - HTTP Method: `PATCH`
  - URI: `/api/v1/vehicles/{vehicleId}`
  - Required Request Fields: `vehicleId` and at least one mutable Vehicle field.
  - Response: Updated Vehicle resource in the standard API response structure.
  - Errors: validation error, duplicate plate-number conflict, not found, unauthenticated request, forbidden request, cross-company access rejection.

- **Archive Vehicle**
  - Purpose: Archive a Vehicle without permanent deletion.
  - HTTP Method: `POST`
  - URI: `/api/v1/vehicles/{vehicleId}/archive`
  - Required Request Fields: `vehicleId`
  - Response: Archived Vehicle resource or lifecycle confirmation in the standard API response structure.
  - Errors: not found, already archived lifecycle conflict, unauthenticated request, forbidden request, cross-company access rejection.

- **List Vehicles**
  - Purpose: Return operational Vehicles for the authenticated Company.
  - HTTP Method: `GET`
  - URI: `/api/v1/vehicles`
  - Required Request Fields: none
  - Response: Collection of Vehicle resources in the standard API response structure.
  - Errors: unauthenticated request, forbidden request.

### Validation Rules

- **Branch validation**:
  - Branch name is required.
  - Branch address is required.
  - Branch contact number is required.
  - Branch status must be valid.
  - Branch name must be unique within the Company.

- **Warehouse validation**:
  - Warehouse name is required.
  - Warehouse address is required.
  - Warehouse contact number is required.
  - Warehouse status must be valid.
  - Warehouse name must be unique within the Company.

- **Vehicle validation**:
  - Vehicle plate number is required.
  - Vehicle description is required.
  - Vehicle status must be valid.
  - Vehicle plate number must be unique within the Company.

- **Status validation**:
  - Branch and Warehouse statuses must follow the allowed operational resource status set.
  - Vehicle status must be one of `Available`, `In Use`, `Maintenance`, or `Inactive`.
  - Archived resources must not be returned in normal operational lists.

- **Business validation**:
  - Every Branch, Warehouse, and Vehicle must belong to exactly one Company.
  - Cross-company access must be rejected.
  - Archived resources cannot be used for future operational selection.
  - Only active resources are available for operational use.

### Key Entities _(include if feature involves data)_

- **Branch**: An operational Company location used for day-to-day activities, identified by name, address, contact number, status, and Company ownership.
- **Warehouse**: A storage or operational facility owned by a Company, defined by name, address, contact number, status, and Company ownership.
- **Vehicle**: A Company-owned operational vehicle identified by plate number, description, lifecycle status, and Company ownership.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Authorized users can create, view, update, list, and archive Branches, Warehouses, and Vehicles for their Company without requiring manual data correction in at least 95% of tested scenarios.
- **SC-002**: Archived Branches, Warehouses, and Vehicles are excluded from normal operational lists in 100% of validation scenarios.
- **SC-003**: Cross-company access to Branches, Warehouses, and Vehicles is rejected in 100% of tested access-control scenarios.
- **SC-004**: Resource uniqueness rules for Branch names, Warehouse names, and Vehicle plate numbers prevent duplicate active operational records within a Company in 100% of validation scenarios.
- **SC-005**: Owners and authorized Managers can complete creation of an operational resource record in under 2 minutes using the defined API contract and valid data.
- **SC-006**: The specification supports future workforce, trip, transaction, and expense features without requiring Company or Identity rules from P001 to be redefined.

## Assumptions

- P001 Company and Identity foundations remain the source of truth for Company ownership, authentication, and role context.
- Employees have read access to organization resources only when operational workflows require it; broader resource management remains reserved for Owners and authorized Managers.
- Branch and Warehouse names are unique only within the same Company and resource type, not across the entire platform.
- Vehicles may remain unassigned until future Trip-related features are introduced.
- Archiving is the only supported record-removal behavior for this feature; permanent deletion is out of scope.
- List endpoints return operational records by default and do not include archived resources unless a future feature explicitly introduces historical listing behavior.
- Future modules may reference Branches, Warehouses, and Vehicles, but those relationships are not managed by this feature.
