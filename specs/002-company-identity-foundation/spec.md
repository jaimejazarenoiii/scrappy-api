# Feature Specification: Company & Identity Foundation

**Feature Branch**: `002-company-identity-foundation`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Create Product Specification P001 - Company & Identity Foundation for Scrappy. Establish Company as tenant boundary, identity, roles, authentication behavior, employee foundation, tenant-isolated API contracts, validations, business rules, and reusable acceptance criteria for all future specifications."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Register a New Company with Its Owner (Priority: P1)

A business founder needs to create a new Scrappy company so the business can begin operating
inside its own isolated workspace with a designated Owner account.

**Why this priority**: Every future capability depends on a company existing first and having a
responsible account that governs it. Without this flow, the platform cannot onboard tenants.

**Independent Test**: A founder creates a company and receives a successful result showing the new
company and its initial Owner account are linked to the same company boundary.

**Acceptance Scenarios**:

1. **Given** a founder provides valid company and owner information, **When** company creation is
   submitted, **Then** the system creates exactly one company and exactly one initial Owner
   identity associated with that company.
2. **Given** company creation succeeds, **When** the founder views the company record, **Then** the
   company details and Owner relationship are visible within that company context only.
3. **Given** a duplicate or invalid company registration request is submitted, **When** the system
   evaluates it, **Then** the request is rejected with a client-safe validation or business
   error.

---

### User Story 2 - Authenticate and Operate Within a Company (Priority: P2)

An authorized user needs to sign in, stay signed in, sign out, and continue operating within the
correct company context so protected business data remains isolated.

**Why this priority**: Multi-tenant access control fails without clear identity and company-bound
sessions. Authentication is required before protected resources can be safely used.

**Independent Test**: An existing user signs in, refreshes an active session, signs out, and is
prevented from accessing protected resources after sign-out or without authentication.

**Acceptance Scenarios**:

1. **Given** valid credentials for an existing company user, **When** the user signs in, **Then**
   the system authenticates the user and establishes an active company-bound session.
2. **Given** an authenticated user with an active session, **When** session refresh is requested,
   **Then** the system issues a continued authenticated session for the same company context.
3. **Given** a user is unauthenticated or has signed out, **When** the user requests a protected
   resource, **Then** the request is rejected.

---

### User Story 3 - Manage Employees and Roles Inside One Company (Priority: P3)

A company Owner or Manager needs to create and maintain employee records, link employee records to
user identities when needed, and assign appropriate business responsibilities without crossing
company boundaries.

**Why this priority**: Once a company exists and users can authenticate, the next foundational
need is to represent the workforce and govern responsibilities inside that tenant.

**Independent Test**: An authorized company administrator creates, views, updates, archives, and
links employee records while the system keeps all employee actions confined to one company.

**Acceptance Scenarios**:

1. **Given** an authorized administrator is operating inside a company, **When** a new employee is
   created, **Then** the employee record belongs to that company and is not visible to other
   companies.
2. **Given** an employee record exists, **When** it is linked to a user identity, **Then** the
   relationship is preserved inside the same company only.
3. **Given** an employee is archived, **When** users view active employee lists, **Then** the
   archived employee is excluded from active results but remains available for historical and
   audit use according to authorization rules.

---

### Edge Cases

- What happens when a user attempts to access a company resource belonging to another company?
- What happens when company creation is attempted with information that violates uniqueness or
  required-field rules?
- What happens when an archived company, user, or employee is referenced in a new protected
  action?
- What happens when a user account exists but is not linked to an employee where employee linkage
  is required for a specific business process?
- What happens when an authenticated session is refreshed after it is expired, revoked, or no
  longer valid?

## Requirements _(mandatory)_

### Vision

The Company & Identity Foundation defines the permanent business boundary for Scrappy. A Company is
the tenant boundary through which every protected resource, identity, and future business process
is owned, governed, and isolated.

Multi-tenancy exists so each junkshop or recycling business can operate independently inside the
same platform without exposing operational data to any other business.

**Scope**:

- Company lifecycle foundation
- User identity and authenticated access foundation
- Employee identity foundation
- Role responsibilities foundation
- REST API contract expectations for foundational resources
- Tenant-isolation rules that every future specification must inherit

**Non-goals**:

- Frontend behavior
- Technical implementation approach
- Data storage design
- Permission engine mechanics
- Workforce scheduling, attendance, payroll, inventory, trips, reports, analytics, or transaction
  features beyond their dependency on company ownership

### Functional Requirements

**Company**

- **FR-001**: The system MUST allow a new business to create exactly one Company during onboarding.
- **FR-002**: The system MUST create the initial Owner account together with Company creation.
- **FR-003**: The system MUST allow authorized users to view Company information within their own
  Company context.
- **FR-004**: The system MUST allow only Owners to update Company information.
- **FR-005**: The system MUST allow only Owners to archive a Company.
- **FR-006**: Archiving a Company MUST preserve historical records and MUST NOT permanently delete
  the Company.

**User**

- **FR-007**: The system MUST support registration of the initial Owner account during Company
  creation.
- **FR-008**: The system MUST support user login for existing authorized identities.
- **FR-009**: The system MUST support user logout.
- **FR-010**: The system MUST support session refresh for active authenticated users.
- **FR-011**: The system MUST expose a forgot-password placeholder contract for future extension.
- **FR-012**: Every authenticated user MUST operate within exactly one Company context per active
  session.

**Employee**

- **FR-013**: The system MUST allow authorized administrators to create Employee records within
  their Company.
- **FR-014**: The system MUST allow authorized administrators to view Employee records belonging
  to their Company.
- **FR-015**: The system MUST allow authorized administrators to update Employee records belonging
  to their Company.
- **FR-016**: The system MUST allow authorized administrators to archive Employee records without
  permanently deleting them.
- **FR-017**: The system MUST allow an Employee record to be linked to one User identity within
  the same Company.
- **FR-018**: The system MUST allow an Employee record to exist before it is linked to a User
  identity.

**Roles**

- **FR-019**: The system MUST recognize three foundational roles: Owner, Manager, and Employee.
- **FR-020**: The Owner role MUST be responsible for Company governance and high-trust company
  administration.
- **FR-021**: The Manager role MUST be responsible for operational administration delegated by the
  Owner within the same Company.
- **FR-022**: The Employee role MUST represent workforce members who operate within assigned
  business responsibilities inside one Company.
- **FR-023**: This specification MUST define role responsibilities and business expectations
  without defining technical permission implementation.

**Multi-tenant rules**

- **FR-024**: Every Company MUST own its own Users, Employees, Branches, Warehouses, Vehicles,
  Transactions, Trips, Expenses, Attendance, Payroll, and Reports.
- **FR-025**: Users MUST NEVER access another Company's data.
- **FR-026**: Company data MUST remain isolated across all protected resources and operations.
- **FR-027**: Every future business entity introduced by later specifications MUST belong to
  exactly one Company.
- **FR-028**: Managers and Employees MUST belong to exactly one Company.

**Authentication**

- **FR-029**: Authentication MUST be required for protected resources.
- **FR-030**: Unauthenticated requests to protected resources MUST be rejected.
- **FR-031**: Session refresh MUST preserve the same Company context as the authenticated user.
- **FR-032**: Logout MUST end the user's ability to continue using the active authenticated
  session.

**API contracts**

- **FR-033**: The Company resource MUST expose contracts for create, view, update, and archive
  actions.
- **FR-034**: The Authentication resource MUST expose contracts for login, logout, refresh, and a
  forgot-password placeholder action.
- **FR-035**: The User resource MUST expose contracts for viewing identity information within the
  user's own Company.
- **FR-036**: The Employee resource MUST expose contracts for create, view, update, archive, and
  link-to-user actions.
- **FR-037**: Every contract defined by this foundation MUST describe request fields, success
  responses, and possible client-safe errors.

**Validation and business controls**

- **FR-038**: Company data MUST satisfy required-field, uniqueness, and lifecycle validation rules
  before a Company can be created or updated.
- **FR-039**: User identity data MUST satisfy required-field, uniqueness, and authentication-state
  validation rules before protected identity actions are accepted.
- **FR-040**: Employee data MUST satisfy required-field, lifecycle, and same-company relationship
  validation rules before employee actions are accepted.
- **FR-041**: Business validation MUST reject requests that would break tenant isolation, violate
  role responsibilities, or link identities across different Companies.

### User Roles

- **Owner**: Creates the Company, governs Company information, manages high-trust administrative
  actions, and remains accountable for who may administer the business.
- **Manager**: Administers day-to-day workforce and operational records delegated by the Owner
  within the same Company.
- **Employee**: Operates inside assigned business responsibilities and uses only the access needed
  to perform approved work for one Company.

### Multi-Tenant Business Rules

- Every protected business record belongs to exactly one Company.
- Company boundaries apply equally to operational data, identity data, and future domain records.
- Cross-company access is always invalid unless a future specification explicitly introduces a new
  business concept and updates this foundation through amendment.
- Role assignment, employee linkage, and authenticated sessions must always stay inside one
  Company boundary.

### Authentication Requirements

- Login must authenticate an existing identity and bind the resulting session to one Company.
- Logout must terminate the current authenticated session.
- Session refresh must continue the user's existing authenticated context without switching
  Companies.
- Unauthenticated access to protected resources must be rejected consistently.
- Forgot Password remains a placeholder contract in this specification and is not expanded beyond
  its business intent.

### Employee Requirements

- Employee profiles must capture the business identity needed to recognize a worker inside one
  Company.
- Employee status must distinguish active and archived lifecycle states.
- A User-to-Employee link is optional at creation time but, once linked, both records must remain
  inside the same Company.
- Archived Employees remain historically referenceable according to authorization rules but are
  excluded from normal active operations.

### API Contracts

**Company**

- **Create Company**
  - Purpose: Onboard a new tenant and initial Owner
  - HTTP Method: `POST`
  - URI: `/companies`
  - Required Request Fields: company name, company display name, owner full name, owner email,
    owner password
  - Successful Response: created Company summary and initial Owner summary
  - Possible Errors: validation error, duplicate company identity, duplicate owner identity
- **View Company**
  - Purpose: Retrieve Company information for the current Company context
  - HTTP Method: `GET`
  - URI: `/companies/{companyId}`
  - Required Request Fields: authenticated company context, company identifier
  - Successful Response: Company details for the requesting Company
  - Possible Errors: unauthenticated request, forbidden cross-company access, company not found,
    archived company unavailable for requested action
- **Update Company**
  - Purpose: Modify Company information
  - HTTP Method: `PATCH`
  - URI: `/companies/{companyId}`
  - Required Request Fields: authenticated Owner context, company identifier, at least one
    allowed Company field
  - Successful Response: updated Company details
  - Possible Errors: unauthenticated request, forbidden action, validation error, company not
    found
- **Archive Company**
  - Purpose: Archive a Company without permanent deletion
  - HTTP Method: `POST`
  - URI: `/companies/{companyId}/archive`
  - Required Request Fields: authenticated Owner context, company identifier
  - Successful Response: archived Company status summary
  - Possible Errors: unauthenticated request, forbidden action, company not found, invalid
    lifecycle transition

**Authentication**

- **Login**
  - Purpose: Start an authenticated Company-bound session
  - HTTP Method: `POST`
  - URI: `/auth/login`
  - Required Request Fields: login identifier, password
  - Successful Response: authenticated identity summary, Company summary, session summary
  - Possible Errors: invalid credentials, archived identity, company unavailable, validation
    error
- **Logout**
  - Purpose: End the current session
  - HTTP Method: `POST`
  - URI: `/auth/logout`
  - Required Request Fields: active authenticated session
  - Successful Response: logout confirmation
  - Possible Errors: unauthenticated request, invalid session state
- **Refresh Authentication**
  - Purpose: Continue an active authenticated session
  - HTTP Method: `POST`
  - URI: `/auth/refresh`
  - Required Request Fields: active refresh context
  - Successful Response: refreshed authenticated session summary for the same Company
  - Possible Errors: unauthenticated request, expired refresh context, revoked session, invalid
    session state
- **Forgot Password (Placeholder)**
  - Purpose: Register future password-recovery intent
  - HTTP Method: `POST`
  - URI: `/auth/forgot-password`
  - Required Request Fields: account recovery identifier
  - Successful Response: recovery request accepted response
  - Possible Errors: validation error, account recovery unavailable for current lifecycle state

**Users**

- **View Current User**
  - Purpose: Retrieve the authenticated user's identity summary inside the current Company
  - HTTP Method: `GET`
  - URI: `/users/me`
  - Required Request Fields: active authenticated session
  - Successful Response: current user identity, role, Company summary, linked employee summary if
    present
  - Possible Errors: unauthenticated request, archived identity unavailable for requested action

**Employees**

- **Create Employee**
  - Purpose: Add an employee to the current Company
  - HTTP Method: `POST`
  - URI: `/employees`
  - Required Request Fields: employee full name, employee code or identifier if required by the
    business, role, status, company-bound context
  - Successful Response: created Employee summary
  - Possible Errors: unauthenticated request, forbidden action, validation error, duplicate
    employee identity within the same Company
- **View Employee**
  - Purpose: Retrieve one employee record inside the current Company
  - HTTP Method: `GET`
  - URI: `/employees/{employeeId}`
  - Required Request Fields: employee identifier, authenticated company context
  - Successful Response: Employee details
  - Possible Errors: unauthenticated request, forbidden cross-company access, employee not found
- **Update Employee**
  - Purpose: Change employee profile or status information
  - HTTP Method: `PATCH`
  - URI: `/employees/{employeeId}`
  - Required Request Fields: employee identifier, at least one allowed employee field,
    authenticated administrative context
  - Successful Response: updated Employee details
  - Possible Errors: unauthenticated request, forbidden action, validation error, employee not
    found
- **Archive Employee**
  - Purpose: Archive an employee without permanent deletion
  - HTTP Method: `POST`
  - URI: `/employees/{employeeId}/archive`
  - Required Request Fields: employee identifier, authenticated administrative context
  - Successful Response: archived Employee status summary
  - Possible Errors: unauthenticated request, forbidden action, employee not found, invalid
    lifecycle transition
- **Link Employee to User**
  - Purpose: Associate one Employee record with one User identity in the same Company
  - HTTP Method: `POST`
  - URI: `/employees/{employeeId}/user-link`
  - Required Request Fields: employee identifier, user identifier, authenticated administrative
    context
  - Successful Response: linked employee-user relationship summary
  - Possible Errors: unauthenticated request, forbidden action, cross-company mismatch, employee
    not found, user not found, invalid linkage state

### Validation Rules

**Company validation**

- Company name and display identity are required.
- Company identity fields that must be unique cannot be reused by another active Company where
  uniqueness applies.
- Archived Companies cannot be recreated in a way that violates active uniqueness rules without an
  explicit business policy defined by a later specification.

**User validation**

- The initial Owner's name, login identifier, and password are required during Company creation.
- Login requests require a valid identifier and password.
- A User identity may belong to only one Company in this foundation unless a future amendment
  redefines that rule.

**Employee validation**

- Employee full name and role are required.
- Employee lifecycle status must be valid for the requested action.
- Employee-to-User links must be same-company only.

**Authentication validation**

- Protected requests require an authenticated user.
- Session refresh requires a still-valid refresh context.
- Logged-out, expired, revoked, or otherwise invalid sessions must be rejected.

**Business validation**

- Owners can manage Company information; non-Owners cannot.
- Managers and Employees cannot act outside their Company boundary.
- Archived resources cannot be treated as active resources.

### Business Rules

- The Owner is created together with the Company.
- Only Owners can manage Company information.
- Managers and Employees belong to exactly one Company.
- Archived resources are not permanently deleted.
- Authentication is required for protected resources.
- Every future foundational or operational entity must inherit Company ownership rather than
  redefining tenant boundaries.

### Key Entities _(include if feature involves data)_

- **Company**: The tenant boundary for all business records, users, employees, and future
  operational resources.
- **User**: An authenticated identity that acts inside exactly one Company context.
- **Employee**: A workforce identity belonging to one Company and optionally linked to one User
  identity.
- **Role**: The business responsibility category assigned to a User or Employee, limited in this
  foundation to Owner, Manager, or Employee.
- **Session**: The active authenticated context that allows a User to operate within one Company.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of new tenant onboarding flows create exactly one Company and exactly one
  initial Owner account in the same submission.
- **SC-002**: 100% of protected requests from unauthenticated users are rejected.
- **SC-003**: 100% of attempted cross-company reads or writes are rejected.
- **SC-004**: Company Owners can complete company creation and retrieve their Company summary in
  under 5 minutes during baseline onboarding.
- **SC-005**: 100% of archived Company and Employee actions preserve historical records rather than
  permanently deleting them.
- **SC-006**: 100% of future feature specifications can reference Company ownership, User
  identity, and Employee linkage without redefining tenant boundaries or foundational roles.

## Future Considerations

Future specifications will extend this foundation with Organization, Workforce, Transactions,
Trips, Expenses, Analytics, and Reports without redefining Company or Identity.

## Assumptions

- Each business operating on Scrappy is represented by exactly one Company at this foundation
  level.
- The initial Owner is the first administrative identity for a newly created Company.
- Forgot Password is intentionally defined only as a placeholder business contract in this
  specification and will be expanded by a later feature if needed.
- Branches, Warehouses, Vehicles, Transactions, Trips, Expenses, Attendance, Payroll, and Reports
  are future resources but are already governed by the Company ownership rules in this
  foundation.
- This specification covers backend API product behavior only and excludes frontend-specific
  requirements.
