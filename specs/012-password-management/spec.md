# Feature Specification: P003 Addendum — Password Management

**Feature Branch**: `[012-password-management]`

**Created**: 2026-07-13

**Status**: Draft

**Input**: User description: "Create an addendum to Product Specification P003 - Workforce Management for Password Management: authenticated self-service password change, administrator password reset with system-generated one-time temporary passwords, and forced password change after admin reset. Email-based forgot password is out of scope."

## Vision

Provide a secure password management workflow that allows Companies to manage employee credentials while allowing authenticated users to maintain their own passwords after login.

For the MVP, password management is administrator-driven for resets. Email-based forgot password remains out of scope and will be delivered in a future specification.

**Purpose**:

- Allow authenticated users to change their own password after verifying the current password.
- Allow Managers and Owners to reset passwords for eligible Users within their Company; the system generates a secure temporary password returned once for out-of-band delivery.
- Require users whose password was admin-reset to set a new password before using other protected resources.
- Extend Workforce and User Management without redesigning the existing authentication architecture from P001.

**Scope**:

- Self-service change password (authenticated)
- Administrator reset password with **system-generated** temporary password (returned once)
- Forced password change after admin reset until completed
- Password status visibility for the authenticated user
- REST contracts, validation rules, and measurable acceptance criteria

**Non-goals**:

- Email-based forgot password, reset links, or unauthenticated recovery
- Account recovery workflows, multi-factor authentication, or password expiration policies
- Recreating or deleting User accounts as part of password reset
- Frontend-specific requirements
- Redefining Company, User, Employee, login, logout, or refresh foundations from P001

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Change Own Password (Priority: P1)

An authenticated user needs to change their password by proving they know the current password and confirming the new one.

**Why this priority**: Self-service change is the primary day-to-day password control and is required to complete forced changes after an admin reset.

**Independent Test**: Log in as a user, change password with valid current and matching new/confirm values, then authenticate successfully only with the new password.

**Acceptance Scenarios**:

1. **Given** an authenticated User with a known current password, **When** they submit current password, new password, and matching confirm password, **Then** the password is updated and subsequent login succeeds only with the new password.
2. **Given** an authenticated User, **When** they submit an incorrect current password, **Then** the change is rejected and the existing password remains valid.
3. **Given** an authenticated User, **When** new password and confirm password do not match, **Then** the change is rejected.

---

### User Story 2 - Admin Reset with Temporary Password (Priority: P2)

An Owner or Manager needs to reset another User's password within the Company. The system generates a secure temporary password, returns it once so the administrator can communicate it securely to the Employee, and immediately makes that temporary password the User's only valid credential.

**Why this priority**: Companies must recover access for workers who cannot change their own password (lost credentials) without email recovery in MVP.

**Independent Test**: As Owner/Manager, reset an eligible Employee's password with an empty/no password body; response includes a one-time temporary password; previous password no longer works; login with the temporary password succeeds and password status indicates a change is required; a second fetch of the temporary password is impossible.

**Acceptance Scenarios**:

1. **Given** an Owner and an Employee in the same Company, **When** the Owner resets the Employee's password, **Then** the system generates a secure temporary password, returns it only in that successful response, the Employee remains active, historical records are unchanged, the previous password is immediately invalid, and the temporary password can be used to log in.
2. **Given** a Manager and an Employee in the same Company, **When** the Manager resets the Employee's password, **Then** the reset succeeds under Manager eligibility rules and returns a one-time temporary password.
3. **Given** an Owner and another Owner in the same Company, **When** the first Owner resets the second Owner's password, **Then** the reset succeeds and returns a one-time temporary password.
4. **Given** a Manager, **When** they attempt to reset a Manager or Owner password, **Then** the reset is rejected.
5. **Given** a successful admin reset, **When** anyone later requests the temporary password again, **Then** it is not recoverable from the system.

---

### User Story 3 - Forced Password Change After Admin Reset (Priority: P3)

A User whose password was reset by an administrator must change their password immediately after the next successful login with the temporary password, before accessing other protected resources. After the new password is set, the temporary password becomes invalid.

**Why this priority**: Temporary passwords must not remain long-lived credentials; forced change protects the account after admin intervention.

**Independent Test**: After admin reset, log in with the temporary password, confirm password status requires change, verify other protected actions are blocked until change password succeeds, then confirm normal access resumes and the temporary password no longer authenticates.

**Acceptance Scenarios**:

1. **Given** a User whose password was admin-reset, **When** they log in successfully with the temporary password, **Then** password status indicates a password change is required.
2. **Given** a User in forced-change state after login, **When** they attempt other protected resources, **Then** those actions are not permitted until the password is changed.
3. **Given** a User in forced-change state, **When** they successfully change their password, **Then** forced-change is cleared, normal protected access is restored, and the temporary password is no longer valid.
4. **Given** a User not in forced-change state, **When** they access protected resources after login, **Then** access behaves according to existing authorization rules.

---

### Role Expectations

#### Employee

- May change their own password while authenticated.
- May view their own password status (whether a change is required).
- May not reset another User's password.
- After an admin reset, must change password before using other protected resources.

#### Manager

- May change their own password while authenticated.
- May reset passwords for Employees within their Company.
- May not reset passwords for Managers or Owners.
- After an admin reset of their own account (by an Owner), must change password before using other protected resources.

#### Owner

- May change their own password while authenticated.
- May reset passwords for Managers and Employees within their Company.
- May reset another Owner's password within the same Company.
- After an admin reset of their own account, must change password before using other protected resources.

---

### Edge Cases

- What happens when current password is omitted or incorrect on change password?
- What happens when new password and confirm password differ?
- What happens when a Manager attempts to reset a Manager or Owner?
- What happens when an Employee attempts to reset any password?
- What happens when the target User belongs to another Company?
- What happens when admin reset targets a User with no login account / inactive User?
- How does the system behave when a User in forced-change state calls change password successfully?
- How does the system behave when a User in forced-change state calls logout or refresh — are those still permitted?
- What happens when password status is requested by an unauthenticated caller?
- What happens if the administrator loses the one-time temporary password after the reset response?

## Requirements _(mandatory)_

### Functional Requirements

#### Change password

- **FR-001**: The system MUST allow an authenticated User to change their own password.
- **FR-002**: Change password MUST require current password, new password, and confirm password.
- **FR-003**: The system MUST verify the current password before applying the new password.
- **FR-004**: Change password MUST reject mismatched new and confirm password values.
- **FR-005**: Users MUST NOT change another User's password through the change-password action.

#### Admin reset password

- **FR-006**: The system MUST allow Managers and Owners to reset passwords for eligible Users within their Company.
- **FR-007**: Admin reset MUST require identification of the target Employee (with linked User); clients MUST NOT supply a temporary password.
- **FR-007a**: On successful admin reset, the system MUST automatically generate a secure temporary password.
- **FR-007b**: The temporary password MUST be returned only once in the successful reset response and MUST NOT be recoverable afterward.
- **FR-007c**: Managers and Owners are responsible for securely communicating the temporary password to the Employee out of band.
- **FR-007d**: The temporary password MUST immediately become the User's only valid password; previous credentials MUST be invalidated immediately on reset.
- **FR-008**: Admin reset MUST leave the User account active and MUST NOT delete or recreate the User.
- **FR-009**: Admin reset MUST leave historical records unchanged.
- **FR-010**: After admin reset, the system MUST require the User to change password after the next successful login with the temporary password.
- **FR-011**: Managers MUST only reset passwords for Employees.
- **FR-012**: Owners MUST be able to reset passwords for Managers and Employees.
- **FR-013**: Only Owners MUST be able to reset another Owner's password.
- **FR-014**: Cross-company password reset MUST be rejected.

#### Forced password change

- **FR-015**: When a password has been reset by an administrator, the User MUST change their password after the next successful login before other protected resources are permitted.
- **FR-016**: Until the forced password change is completed, access to other protected resources MUST NOT be permitted.
- **FR-017**: Completing change password MUST clear the forced-change requirement and MUST invalidate the temporary password (it is no longer a valid credential).
- **FR-018**: Authentication session establishment (login) MUST still succeed with a valid temporary password so the User can reach change password.

#### Password status

- **FR-019**: The system MUST allow an authenticated User to retrieve whether their account currently requires a password change.
- **FR-020**: Password status MUST reflect forced-change state after admin reset and cleared state after successful change password.

#### Cross-cutting

- **FR-021**: Company ownership for all password management actions MUST be derived from the authenticated session.
- **FR-022**: Clients MUST NOT supply Company identity for password management operations.
- **FR-023**: Email-based forgot password remains out of scope for this specification; the existing placeholder recovery contract is not expanded here.

### Key Entities _(include if feature involves data)_

- **User**: Authenticated identity whose credentials are changed or reset; remains the authentication identity from P001.
- **Password Credential**: The secret used for authentication; updated by change or admin reset without replacing the User identity.
- **Temporary Password**: System-generated secure password created on admin reset, returned once to the administrator for out-of-band delivery, immediately becoming the User's valid credential until forced change completes.
- **Forced Password Change State**: Indicator that the User must change password before other protected access is allowed.
- **Password Status**: Authenticated view of whether a password change is currently required.

## API Contracts

### Change Password

- **Purpose**: Allow the authenticated User to change their own password after verifying the current password
- **HTTP Method**: `POST`
- **URI**: `/users/me/password`
- **Required Request**: current password, new password, confirm password; authenticated session
- **Successful Response**: Confirmation that the password was changed; password status no longer requires change
- **Possible Errors**: unauthenticated, validation error, current password incorrect, password confirmation mismatch, weak new password

### Reset Password (Admin)

- **Purpose**: Allow an Owner or Manager to reset an eligible User's password; system generates a secure temporary password returned once
- **HTTP Method**: `POST`
- **URI**: `/employees/{employeeId}/password-reset`
- **Required Request**: authenticated Owner or Manager context; employee identifier for a User-linked Employee in the same Company (no temporary password in the request body)
- **Successful Response**: Confirmation that the password was reset, `passwordChangeRequired` is true, and the **one-time** `temporaryPassword` plaintext (only in this response)
- **Possible Errors**: unauthenticated, forbidden (role or target eligibility), employee not found, employee has no linked User, cross-company access denied

### Password Status

- **Purpose**: Return whether the authenticated User must change their password before other protected access
- **HTTP Method**: `GET`
- **URI**: `/users/me/password-status`
- **Required Request**: authenticated session
- **Successful Response**: Password status summary including whether password change is required
- **Possible Errors**: unauthenticated

## Validation Rules

### Current password validation

- Current password is required for change password.
- Current password must match the authenticated User's existing credential.

### Temporary password rules

- The system generates temporary passwords automatically on admin reset.
- Temporary passwords are displayed only once (in the successful reset response).
- Temporary passwords are never recoverable after generation.
- Temporary passwords immediately become the Employee's valid password; previous credentials are invalidated immediately.
- Employees must change their password after logging in with a temporary password.
- After successful change password, the temporary password is invalid.
- Generated temporary passwords MUST meet product password strength rules.

### New password validation

- New password is required for change password.
- New password must satisfy the product password strength rules.
- New password should not be accepted when identical to the current password when that rule is enforced by product policy (assumed enforced for MVP).

### Password confirmation validation

- Confirm password is required for change password and must match new password.

### Business validation

- Employees may only change their own password.
- Managers may reset Employees only.
- Owners may reset Managers, Employees, and other Owners in the same Company.
- Target of admin reset must be a User-linked Employee in the authenticated user's Company.
- Cross-company password management is forbidden.
- Password reset does not remove or recreate the User account.
- Clients must not submit temporary passwords on reset.
- Forced-change Users may perform change password and password status; other protected resources remain blocked until change completes.

## Business Rules

- Password management for MVP is administrator-driven for resets; self-service change is available to authenticated Users.
- Email forgot password is out of scope.
- Employees may only change their own password.
- Managers may reset passwords for Employees.
- Owners may reset passwords for Managers and Employees.
- Only Owners may reset another Owner's password.
- Cross-company password management is forbidden.
- Password reset does not remove or recreate the User account.
- Company ownership is automatically determined from the authenticated session.
- The system generates temporary passwords automatically.
- Temporary passwords are displayed only once and are never recoverable after generation.
- Temporary passwords immediately become the User's valid password; password reset immediately invalidates previous credentials.
- Managers and Owners must securely communicate the temporary password to the Employee out of band.
- After admin reset, the User must change password after next successful login before other protected access.
- Once the password has been changed successfully, the temporary password becomes invalid.
- Historical records remain unchanged by password reset or change.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Authenticated users can change their own password in a single successful operation and then log in only with the new password.
- **SC-002**: 100% of change-password attempts with an incorrect current password are rejected without updating the credential.
- **SC-003**: 100% of change-password attempts with mismatched confirmation are rejected.
- **SC-004**: Eligible Owners/Managers can reset an Employee password and receive a one-time system-generated temporary password; the User remains active afterward; the previous password no longer authenticates.
- **SC-005**: 100% of Manager attempts to reset Manager or Owner passwords are rejected.
- **SC-006**: 100% of cross-company reset attempts are rejected.
- **SC-007**: After admin reset, 100% of attempts to use other protected resources before changing password are rejected, while change password remains available after login with the temporary password.
- **SC-008**: After forced password change completes, normal protected access is restored and the temporary password no longer authenticates.
- **SC-009**: Authenticated users can retrieve password status and correctly observe required vs not-required states.
- **SC-010**: An Owner or Manager can complete an admin password reset for an eligible Employee in under 2 minutes during baseline operations.
- **SC-011**: 100% of successful reset responses include a temporary password exactly once; subsequent APIs do not return or recover that value.

## Future Considerations

Future versions may introduce the following without redesigning the Password Management workflow:

- Email Forgot Password
- Password Reset Links
- Account Recovery
- Multi-Factor Authentication
- Password Expiration Policies

## Assumptions

- Any authenticated User (Employee, Manager, or Owner) may change their own password through the change-password contract.
- Admin reset targets an Employee with a linked User account via `employeeId`. Resetting another Owner requires that Owner to have a linked Employee profile in the Company (consistent with optional Employee–User linkage from identity foundations and account provisioning).
- Temporary passwords are **system-generated**, not supplied by the administrator and not emailed by the system; administrators communicate them out of band.
- If the one-time temporary password is lost after the reset response, the administrator must perform another reset to obtain a new temporary password.
- While forced-change is active after login, change password and password status remain available; logout and session refresh also remain available; other protected resources are blocked until change completes.
- Password strength rules for generated temporary passwords and for new passwords match those already used for account provisioning and registration in the product.
- The existing forgot-password placeholder from P001 is not expanded by this addendum.
- This specification covers backend API product behavior only and excludes frontend-specific requirements.
- No implementation technologies, storage designs, or project structure are prescribed by this specification.
