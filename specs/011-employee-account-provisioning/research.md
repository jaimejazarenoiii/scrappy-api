# Research: Employee Account Provisioning

**Feature**: `011-employee-account-provisioning`  
**Date**: 2026-07-13

## 1. Module ownership

**Decision**: Orchestrate provisioning inside the existing `employee` module; persist Users via
`UserRepository`; hash via shared `PasswordHasher`; revoke sessions via `SessionRepository`.

**Rationale**: Spec extends Employee Management. Creating a new top-level module would duplicate
P001 boundaries. Employee create is already the onboarding entry point.

**Alternatives considered**:

- New `account-provisioning` module — rejected; YAGNI and splits a thin workflow across packages.
- Put create-with-account in `user` module — rejected; clients think in Employee onboarding terms.

## 2. User model changes

**Decision**: No schema redesign. Reuse `UserStatus.ACTIVE | INACTIVE` for disable/enable. Reuse
existing optional `User.employeeId` / `Employee.userId` unique FKs.

**Rationale**: Login policy already rejects inactive users (`assertValidLoginUser`). Soft-delete /
archive of Employee remains separate from login disable.

**Alternatives considered**:

- New `DISABLED` enum value — rejected; redundant with `INACTIVE`.
- Soft-delete User on disable — rejected; complicates re-enable and email uniqueness.
- Separate `Account` entity — rejected; redesigns identity without benefit.

## 3. “User must always have Employee” rule

**Decision**: Enforce for Users **created by this feature**. Keep P001 exception: Company Owner
created at onboarding may have no Employee.

**Rationale**: Plan text “User may never exist without Employee” would break existing Owners and
transaction/expense paths that allow Owner without employee link. Provisioning path always links.

**Alternatives considered**:

- Force-create Employee for every Owner — rejected; out of scope and breaks P001.
- Ban Owner-without-employee going forward — rejected; separate product decision.

## 4. Transaction strategy

**Decision**: Prisma interactive transaction (or repository unit-of-work already used in project)
wrapping Employee create + User create + bidirectional link for workflows B and C.

**Rationale**: Spec requires no partial success when account creation fails.

**Alternatives considered**:

- Compensating deletes — rejected; race-prone and harder to reason about.
- Two-phase client calls — rejected; violates single-operation onboarding goal.

## 5. Grant vs existing user-link

**Decision**: Keep `POST /employees/{id}/user-link` for linking an **existing** User. Add
`POST /employees/{id}/system-access` to **create** a User and link.

**Rationale**: Different intents; merging would overload one contract with incompatible bodies
(`userId` vs credentials).

**Alternatives considered**:

- Overload user-link with credentials — rejected; ambiguous and harder to document.
- Remove user-link — rejected; still useful for linking pre-created Users.

## 6. Role assignment policy (v1)

**Decision**: Owners may assign `OWNER | MANAGER | EMPLOYEE`. Managers may assign `EMPLOYEE` only.
Manager-role creation by Managers deferred until Company permissions exist.

**Rationale**: Matches spec assumptions; avoids inventing a permission engine in this addendum.

**Alternatives considered**:

- Allow Managers to create Managers immediately — rejected; spec gates on Company permissions.
- Config table now — rejected; premature.

## 7. Enable system access

**Decision**: Include `POST .../system-access/enable` even though the product spec listed re-enable
as a future consideration; the plan input explicitly requires it and it is a one-line status flip
on the same model.

**Rationale**: Symmetric with disable; no new entities; low complexity.

**Alternatives considered**:

- Defer enable entirely — rejected; plan requirements include it and cost is minimal.

## 8. Session handling on disable

**Decision**: Revoke all refresh sessions for the User when disabling system access.

**Rationale**: Status check blocks new logins; open refresh tokens could otherwise mint access
tokens until expiry depending on refresh validation depth. Revoke is defense in depth.

**Alternatives considered**:

- Status-only disable — weaker; may leave live sessions.
- Rotate a global user token version — not present in P001; heavier than revoke-all.

## 9. Password rules

**Decision**: Reuse existing product rule: minimum 8 characters (login/create schemas); require
`confirmPassword` match at Zod boundary.

**Rationale**: Consistency with P001 auth schemas; no new complexity.

**Alternatives considered**:

- Complexity regex (upper/lower/digit) — deferred; not in current product baseline.

## 10. Response shape

**Decision**: Extend Employee responses with optional `linkedUser: { id, email, role, status }`
never including `passwordHash`.

**Rationale**: Clients need confirmation of provisioned access without a second round-trip.

**Alternatives considered**:

- Return only employee id — poorer UX for onboarding confirmation.
- Full user entity — would leak password hash if mis-mapped; avoid.
