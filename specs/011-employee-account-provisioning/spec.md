# Feature Specification: P003 Addendum — Employee Account Provisioning

**Feature Branch**: `[011-employee-account-provisioning]`

**Created**: 2026-07-13

**Status**: Draft

**Input**: User description: "Create an addendum to Product Specification P003 - Workforce Management for Employee Account Provisioning: optional login creation during Employee create, grant access to existing Employees, and disable login without deleting Employee records."

## Vision

Provide a seamless onboarding workflow where Companies can create an Employee and optionally grant system access during the same operation.

Employees without login accounts remain valid employees and may receive system access later. Disabling login removes authentication ability without deleting the Employee or rewriting historical records.

**Purpose**:

- Extend Employee Management so Managers and Owners can create Employees with or without login accounts.
- Allow login access to be granted later to Employees who do not yet have a User account.
- Allow login access to be disabled without removing the Employee from the Company.
- Preserve the Employee/User relationship established in P001 without redefining Company or Identity architecture.

**Scope**:

- Optional login account creation during Employee creation
- Grant system access to existing Employees without User accounts
- Disable system access for Employees who have linked User accounts
- Role and uniqueness rules for provisioned accounts
- REST contracts, validation rules, and measurable acceptance criteria for the above

**Non-goals**:

- Replacing standalone Employee creation without login
- Email invitations, password reset, account activation workflows, multi-factor authentication, or single sign-on
- Relinking an Employee to a different existing User identity (covered by existing P001 link behavior where applicable)
- Redefining Company, User, Employee, authentication, or authorization foundations from P001
- Frontend-specific requirements

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Employee With Optional Login (Priority: P1)

An Owner or Manager needs to onboard a worker as an Employee and, when appropriate, create their login in the same step so the worker can authenticate immediately.

**Why this priority**: Combined Employee-plus-login creation is the primary onboarding improvement; without it, Companies must always complete a second step to grant access.

**Independent Test**: Create an Employee without login and confirm no authentication is possible; create an Employee with login and confirm the Employee and User are linked and the worker can authenticate with the provided credentials.

**Acceptance Scenarios**:

1. **Given** an Owner or Manager in an active Company, **When** they create an Employee with login creation disabled, **Then** the Employee is created with no linked User account and cannot authenticate.
2. **Given** an Owner or Manager in an active Company, **When** they create an Employee with login creation enabled and provide valid email, password, confirm password, and an allowed role, **Then** the Employee and User are created, automatically linked, and both belong to the authenticated user's Company.
3. **Given** login creation is enabled, **When** password and confirm password do not match, **Then** the operation is rejected and neither Employee nor User is created.

---

### User Story 2 - Grant System Access to Existing Employee (Priority: P2)

An Owner or Manager needs to grant login access to an Employee who was previously created without a User account.

**Why this priority**: Many workers are recorded as Employees before they need system access; granting access later is required for gradual onboarding.

**Independent Test**: Start with an Employee that has no User account, grant access with valid credentials and role, then confirm the Employee record is unchanged except for the new linked User and that login succeeds.

**Acceptance Scenarios**:

1. **Given** an active Employee with no User account, **When** an Owner or Manager grants system access with valid email, password, confirm password, and allowed role, **Then** a User account is created and linked to that Employee without changing Employee profile fields unrelated to linkage.
2. **Given** an Employee that already has a User account, **When** an Owner or Manager attempts to grant system access again, **Then** the operation is rejected.
3. **Given** an archived Employee, **When** an Owner or Manager attempts to grant system access, **Then** the operation is rejected.

---

### User Story 3 - Disable System Access (Priority: P3)

An Owner or Manager needs to remove an Employee's ability to log in without deleting the Employee or losing historical workforce and operational records.

**Why this priority**: Access revocation is required for offboarding and security control while preserving Employee history.

**Independent Test**: Disable login for a linked Employee-User pair and confirm authentication fails while the Employee remains active and historically referenceable.

**Acceptance Scenarios**:

1. **Given** an active Employee linked to an active User account, **When** an Owner or Manager disables system access, **Then** the Employee remains active, historical records remain unchanged, and the User can no longer authenticate.
2. **Given** an Employee with no User account, **When** an Owner or Manager attempts to disable system access, **Then** the operation is rejected as there is no login to disable.
3. **Given** system access has been disabled, **When** the same credentials are used to authenticate, **Then** authentication is rejected.

---

### Role Expectations

#### Owner

- May create Employees with or without login accounts.
- May grant system access to Employees without User accounts.
- May disable system access for Employees with User accounts.
- May assign Owner, Manager, or Employee roles when provisioning login accounts.
- Operates only within their authenticated Company.

#### Manager

- May create Employees with or without login accounts.
- May grant system access to Employees without User accounts.
- May disable system access for Employees with User accounts.
- May assign the Employee role when provisioning login accounts.
- May assign the Manager role only when Company policy permits Manager-role provisioning by Managers; until Company permission settings exist, Managers may not create Owner or Manager accounts.
- May not create Owner accounts.
- Operates only within their authenticated Company.

#### Employee

- May not create Employees.
- May not grant or disable system access for any Employee.
- May authenticate only when they have an active linked User account that has not been disabled.

---

### Edge Cases

- What happens when login creation is enabled but email, password, confirm password, or role is omitted?
- What happens when the email is already used by another User in any Company?
- What happens when password and confirm password differ?
- What happens when a Manager attempts to provision an Owner account?
- What happens when a Manager attempts to provision a Manager account while Company policy does not allow it?
- What happens when an Employee (role) attempts any provisioning action?
- What happens when grant access is requested for an Employee that already has a User account?
- What happens when disable access is requested for an Employee with no User account?
- How does the system behave when the target Employee belongs to another Company?
- What happens when login creation fails after Employee details were otherwise valid — is the overall operation rejected without partial success?

## Requirements _(mandatory)_

### Functional Requirements

#### Employee creation with optional login

- **FR-001**: The system MUST continue to allow Managers and Owners to create Employees without creating a login account.
- **FR-002**: The system MUST allow Managers and Owners to optionally create a login account as part of Employee creation.
- **FR-003**: When login creation is disabled, the system MUST create only the Employee record with no system access.
- **FR-004**: When login creation is enabled, the system MUST require email, password, confirm password, and role.
- **FR-005**: When login creation is enabled and validation succeeds, the system MUST create the Employee and User account and automatically link them.
- **FR-006**: When login creation is enabled and any required account field fails validation, the system MUST reject the entire operation so neither an orphaned User nor an unintended Employee-without-intent is left in an inconsistent provisioning state for that request.

#### Grant system access

- **FR-007**: The system MUST allow Managers and Owners to grant login access to existing Employees who do not yet have a User account.
- **FR-008**: Grant system access MUST require email, password, confirm password, and role.
- **FR-009**: Grant system access MUST create and link a User account without altering unrelated Employee profile fields.
- **FR-010**: Grant system access MUST be rejected when the Employee already has a User account.
- **FR-011**: Grant system access MUST be rejected for archived Employees.

#### Disable system access

- **FR-012**: The system MUST allow Managers and Owners to disable an Employee's login account.
- **FR-013**: Disabling system access MUST leave the Employee active unless the Employee was already archived by a separate action.
- **FR-014**: Disabling system access MUST leave historical records unchanged.
- **FR-015**: After system access is disabled, the affected User MUST no longer be able to authenticate.
- **FR-016**: Disable system access MUST be rejected when the Employee has no User account.

#### Authorization and tenancy

- **FR-017**: Every User MUST belong to exactly one Company.
- **FR-018**: Every Employee MUST belong to exactly one Company.
- **FR-019**: A User MAY belong to only one Employee.
- **FR-020**: An Employee MAY have zero or one User account.
- **FR-021**: Company assignment for both Employee and User MUST be derived from the authenticated session; clients MUST NOT supply Company identity.
- **FR-022**: Email addresses used for User accounts MUST be globally unique.
- **FR-023**: Only Owners MAY create Owner accounts.
- **FR-024**: Managers MAY create Employee accounts.
- **FR-025**: Manager-role account creation by Managers MUST follow Company permissions; until such permissions exist, only Owners MAY create Manager accounts.
- **FR-026**: Employees MUST NOT create accounts or perform grant/disable system-access actions.
- **FR-027**: Cross-company provisioning, grant, and disable attempts MUST be rejected.

### Key Entities _(include if feature involves data)_

- **Employee**: Workforce identity belonging to one Company; may exist with or without a linked User account.
- **User**: Authenticated identity belonging to one Company; may be linked to at most one Employee.
- **Employee–User Link**: Optional one-to-one association within the same Company that grants the Employee system access through the User account.
- **Role**: Business responsibility assigned to a provisioned User account — Owner, Manager, or Employee — subject to who may assign which role.
- **System Access State**: Whether a linked User account is currently allowed to authenticate.

## API Contracts

### Create Employee (extended)

- **Purpose**: Create an Employee, optionally with a linked login account, in the authenticated user's Company
- **HTTP Method**: `POST`
- **URI**: `/employees`
- **Required Request**:
  - Existing Employee creation fields required by Employee Management
  - Indicator whether login creation is enabled
  - When login creation is enabled: email, password, confirm password, role
- **Successful Response**: Created Employee summary; when login was created, linked User summary (without exposing password)
- **Possible Errors**: unauthenticated, forbidden, validation error, duplicate email, password confirmation mismatch, role not allowed for actor, duplicate employee identity within Company

### Grant System Access

- **Purpose**: Create a User account and link it to an existing Employee that has no User account
- **HTTP Method**: `POST`
- **URI**: `/employees/{employeeId}/system-access`
- **Required Request**: email, password, confirm password, role; authenticated Owner or Manager context; employee identifier
- **Successful Response**: Employee summary with linked User summary (without exposing password)
- **Possible Errors**: unauthenticated, forbidden, employee not found, employee already has access, employee archived, validation error, duplicate email, password confirmation mismatch, role not allowed for actor, cross-company access denied

### Disable System Access

- **Purpose**: Disable login for an Employee's linked User account without deleting the Employee
- **HTTP Method**: `POST`
- **URI**: `/employees/{employeeId}/system-access/disable`
- **Required Request**: authenticated Owner or Manager context; employee identifier
- **Successful Response**: Confirmation that system access is disabled, with Employee and User access-state summary
- **Possible Errors**: unauthenticated, forbidden, employee not found, no linked User account, cross-company access denied, invalid access state

## Validation Rules

### Employee validation

- Employee creation remains subject to existing Employee Management required fields and lifecycle rules.
- Archived Employees cannot receive new system access.
- Target Employees must belong to the authenticated user's Company.

### Email validation

- Email is required when creating or granting system access.
- Email must be a valid email address format.
- Email must be globally unique across User accounts.

### Password validation

- Password and confirm password are required when creating or granting system access.
- Password and confirm password must match.
- Password must satisfy the same strength rules used for other account password creation in the product.

### Role validation

- Role is required when creating or granting system access.
- Role must be one of Owner, Manager, or Employee.
- Only Owners may assign the Owner role.
- Managers may assign the Employee role.
- Assignment of the Manager role by Managers is allowed only when Company permissions permit it; otherwise only Owners may assign Manager.

### Business validation

- Clients must not supply Company identity; Company is taken from the authenticated session.
- Employees cannot perform provisioning, grant, or disable actions.
- An Employee may have at most one User account.
- A User may be linked to at most one Employee.
- Disable requires an existing linked User account.
- Grant requires the absence of a linked User account.

## Business Rules

- This feature extends Employee creation; it does not replace Employee-only creation.
- Employees without login accounts remain valid Employees.
- Company ownership for Employee and User is automatic from the authenticated session.
- Email uniqueness is global.
- Only Owners may create Owner accounts.
- Managers may create Employee accounts.
- Manager account creation by Managers depends on Company permissions; until those permissions exist, Manager accounts are Owner-provisioned only.
- Employees cannot create accounts.
- Disabling system access does not delete the Employee and does not rewrite historical records.
- Existing P001 Employee-to-User link semantics remain the identity foundation; this addendum adds create-with-login, grant-access, and disable-access behaviors on top of that relationship.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Authorized users can create an Employee without login in a single successful operation, and that Employee cannot authenticate afterward.
- **SC-002**: Authorized users can create an Employee with login in a single successful operation, and the worker can authenticate with the provided credentials afterward.
- **SC-003**: 100% of create-with-login attempts with mismatched password confirmation are rejected with no partial User/Employee provisioning success for that request.
- **SC-004**: Authorized users can grant system access to an Employee without a User account and achieve successful authentication afterward without needing to recreate the Employee.
- **SC-005**: 100% of grant-access attempts against Employees that already have a User account are rejected.
- **SC-006**: After disable system access, 100% of authentication attempts with the previous credentials fail while the Employee record remains available within the Company.
- **SC-007**: 100% of Employee-role actors attempting create-with-login, grant, or disable actions are rejected.
- **SC-008**: 100% of cross-company provisioning, grant, and disable attempts are rejected.
- **SC-009**: Onboarding with optional login can be completed by an Owner or Manager in under 3 minutes for a single Employee during baseline operations.

## Future Considerations

Future versions may support the following without redesigning the Employee/User relationship:

- Email Invitations
- Password Reset
- Account Activation
- Multi-Factor Authentication
- Single Sign-On
- Company-configurable permissions for which roles Managers may provision
- Re-enabling previously disabled system access

## Assumptions

- P001 Company & Identity, P002 Organization Management, and P003 Workforce Management foundations remain in force.
- Existing Employee creation without login continues to work and is the default when login creation is not enabled.
- Password strength rules match those already used for Owner registration and other User password creation in the product.
- Until Company permission settings for Manager-role provisioning exist, only Owners may create Manager or Owner accounts; Managers may create Employee-role accounts only.
- Re-enabling disabled system access is out of scope for this addendum unless added later.
- Linking an Employee to a pre-existing User identity remains governed by existing P001 link contracts where applicable; Grant System Access in this addendum creates a new User account rather than selecting an existing one.
- This specification covers backend API product behavior only and excludes frontend-specific requirements.
- No implementation technologies, storage designs, or project structure are prescribed by this specification.
