# Implementation Plan: P003 Addendum — Password Management

**Branch**: `012-password-management` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-password-management/spec.md`

**Note**: This plan is the definitive technical design for Password Management — not implementation
code. It follows architecture and conventions from P001–P011 without redefining them. It extends
User and Employee modules. Email forgot-password remains out of scope.

## Summary

Add administrator-driven password reset and authenticated self-service password change. Extend the
existing `User` identity with `passwordChangeRequired` and `passwordChangedAt` (no User redesign).
Place change-password and password-status under the `user` module; place admin reset under
`employee` (target by `employeeId`, mutate linked User). On reset, the system **generates** a secure
temporary password, returns it **once** in the response, hashes it as the new credential, sets
`passwordChangeRequired=true`, and revokes sessions (previous password immediately invalid). Enforce
forced-change via middleware allowlist after login. Reuse bcrypt hashing and session revoke patterns
from P001 / account provisioning. Do not expand the forgot-password placeholder.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT, bcrypt, Pino, Swagger/OpenAPI,
Vitest, Supertest — no new runtime dependencies

**Storage**: Extend existing `User` table with two columns; no new tables

**Testing**: Vitest (unit/integration), Supertest (API/authorization/tenant isolation)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API — extensions to `user`, `employee`, auth middleware, and login
response enrichment

**Performance Goals**: Change/reset complete under interactive latency; forced-change gate adds
negligible overhead (flag on User already loaded or cached from JWT enrichment)

**Constraints**: Company tenant boundary; clients never send `companyId`; Managers reset Employees
only; Owners may reset Managers/Employees/Owners (via linked Employee); forced-change blocks
non-allowlisted protected routes; passwords never returned except the one-time system-generated
temporary password on successful admin reset

**Scale/Scope**: ~3 use cases, 3 endpoints, User field extension + migration, middleware gate, OpenAPI
and docs updates, unit + API tests

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                     |
| -------------------------------- | ---------- | ----------- | --------------------------------------------------------- |
| Layer boundaries                 | ✅         | ✅          | Use cases in user/employee; Prisma in repos only          |
| No business logic in controllers | ✅         | ✅          | Controllers delegate to use cases                         |
| Repository pattern               | ✅         | ✅          | Extend `UserRepository` password/status methods           |
| Dependency injection             | ✅         | ✅          | Wire in `src/config/container.ts`                         |
| Zod validation                   | ✅         | ✅          | Change/reset/status schemas                               |
| DTOs                             | ✅         | ✅          | Request/response DTOs; no passwordHash leak               |
| Standard response envelope       | ✅         | ✅          | Reuses P001 helpers                                       |
| Pagination conventions           | ✅         | ✅          | N/A                                                       |
| Security                         | ✅         | ✅          | bcrypt; session revoke on reset; forced-change middleware |
| No `any`                         | ✅         | ✅          | Strict TypeScript                                         |
| Error handling                   | ✅         | ✅          | Existing HTTP exception types                             |
| Logging                          | ✅         | ✅          | Audit events for change/reset (no plaintext passwords)    |
| Tests                            | ✅         | ✅          | Unit, API, authz, tenant, forced-change, session revoke   |
| OpenAPI                          | ✅         | ✅          | user + employee OpenAPI + common schemas                  |
| Simplicity                       | ✅         | ✅          | Two boolean/timestamp fields; no email/token subsystem    |

## Project Structure

### Documentation (this feature)

```text
specs/012-password-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 — /speckit-tasks
```

### Source code (extensions)

```text
src/modules/user/
├── domain/
│   ├── user.entity.ts                         # MOD — passwordChangeRequired, passwordChangedAt
│   ├── user.repository.ts                     # MOD — updatePassword, setPasswordChangeRequired
│   └── user-password-rules.ts                 # NEW — assert not same as current (optional)
├── application/
│   ├── dto/
│   │   ├── change-password.request.ts         # NEW
│   │   ├── password-status.response.ts        # NEW
│   │   └── current-user.response.ts           # MOD — include passwordChangeRequired
│   ├── policies/
│   │   └── password-reset.policy.ts           # NEW — who may reset whom (shared by employee)
│   ├── services/
│   │   └── user-password-audit.service.ts     # NEW
│   └── use-cases/
│       ├── change-password.use-case.ts        # NEW
│       └── get-password-status.use-case.ts    # NEW
├── presentation/
│   ├── user.controller.ts                     # MOD
│   ├── user.routes.ts                         # MOD
│   ├── user.schemas.ts                        # NEW/MOD
│   └── user.openapi.ts                        # MOD

src/modules/employee/
├── application/
│   ├── dto/reset-employee-password.request.ts # NEW
│   └── use-cases/reset-employee-password.use-case.ts  # NEW
├── presentation/
│   ├── employee.controller.ts                 # MOD
│   ├── employee.routes.ts                     # MOD
│   ├── employee.schemas.ts                    # MOD
│   └── employee.openapi.ts                    # MOD

src/modules/auth/
├── application/dto/auth.response.ts           # MOD — passwordChangeRequired on login
└── application/use-cases/login.use-case.ts    # MOD — include flag in response

src/middleware/
└── password-change-gate.middleware.ts         # NEW — block non-allowlisted routes

src/shared/auth/
└── password-policy.ts                         # NEW optional — shared min-length helpers for Zod

prisma/
└── schema.prisma                              # MOD — User.passwordChangeRequired, passwordChangedAt
└── migrations/…                               # NEW migration (implement phase)

tests/
├── unit/user/
├── unit/employee/
├── api/user/
└── api/employee/
```

**Structure Decision**: Password Management extends **User Management** (credential ownership) rather
than Authentication. Auth remains login/logout/refresh/session issuance. Credential mutation and
forced-change state belong on User; Authentication consumes the flag (login payload + middleware).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |

---

## 1. Module Architecture

### Responsibilities

| Concern                   | Owner                                        |
| ------------------------- | -------------------------------------------- |
| Change own password       | `user` use case                              |
| Password status           | `user` use case                              |
| Admin reset by employeeId | `employee` use case (loads Employee → User)  |
| Password hashing          | shared `PasswordHasher`                      |
| Session revoke            | `SessionRepository.revokeAllForUser`         |
| Forced-change enforcement | `password-change-gate` middleware            |
| Login / refresh / logout  | `auth` (unchanged flows; login DTO enriched) |

### Dependencies

- **User → PasswordHasher, SessionRepository**: change/reset credential + revoke sessions.
- **Employee → UserRepository, PasswordHasher, SessionRepository, password-reset policy**: admin reset.
- **Auth → User**: read `passwordChangeRequired` for login response; does not own password mutation.
- **Middleware → UserRepository or JWT claim**: evaluate forced-change allowlist.

### Service boundaries

- `ChangePasswordUseCase`: verify current → hash new → update User → clear flag → set `passwordChangedAt` → revoke other refresh sessions (recommended).
- `ResetEmployeePasswordUseCase`: authorize actor vs target role → generate secure temporary password → hash → update User → set `passwordChangeRequired=true` → revoke all target sessions → return plaintext temporary password once.
- `GetPasswordStatusUseCase`: return `{ passwordChangeRequired, passwordChangedAt }` for `req.auth.userId`.

### Transaction boundaries

| Operation       | Atomic unit                                                            |
| --------------- | ---------------------------------------------------------------------- |
| Change password | User passwordHash + flags update; then session revoke                  |
| Admin reset     | User passwordHash + `passwordChangeRequired=true`; then session revoke |

Employee records are never written during password operations.

### Why User Management, not Authentication

Authentication establishes and refreshes sessions. Password Management mutates long-lived User
credentials and a User-owned compliance flag. Keeping mutation in User/Employee avoids turning
`auth` into a general identity admin module and matches P001 separation (Auth vs User vs Employee).

---

## 2. Entity Extension Design

### User additions (conceptual — no Prisma dump in this section)

| Field                    | Type     | Default | Purpose                                   |
| ------------------------ | -------- | ------- | ----------------------------------------- |
| `passwordChangeRequired` | boolean  | `false` | Forced change after admin reset           |
| `passwordChangedAt`      | datetime | `null`  | Last successful password change timestamp |

**Business rules**

- Default `passwordChangeRequired = false` for existing and newly provisioned Users.
- Admin reset sets `passwordChangeRequired = true` and updates `passwordHash`.
- Successful self-service change sets `passwordChangeRequired = false` and `passwordChangedAt = now`.
- Fields do not replace `status`, `lastLoginAt`, or soft-delete.

**Future extensibility**

- Password expiration can compare `passwordChangedAt` to policy windows later.
- MFA and password history can key off `userId` without changing these two fields' meaning.
- Do **not** redesign User; do **not** add email-token tables in this feature.

---

## 3. Password Workflow Design

### Workflow A — Change password

```text
Authenticated User
  → POST /users/me/password { currentPassword, newPassword, confirmPassword }
  → Verify current against passwordHash
  → Validate strength + confirmation + new ≠ current
  → Update passwordHash; passwordChangeRequired=false; passwordChangedAt=now
  → Revoke refresh sessions for user (all or all-except-current — see §10)
  → Success
```

**Failures**: unauthenticated; validation; incorrect current; weak password; mismatch.

### Workflow B — Admin reset Employee → forced change

See **§4 Temporary Password Strategy** for the full lifecycle. API-level summary:

```text
Manager/Owner
  → POST /employees/{employeeId}/password-reset  (no password body)
  → Resolve Employee in auth.companyId; require linked User; active checks
  → Assert actor may reset target role
  → Generate → hash → set passwordChangeRequired=true → revoke sessions
  → Return temporaryPassword once; admin communicates out of band
  → Employee login → forced change → Workflow A → normal access
```

**Failures**: forbidden role; no linked user; not found; cross-company.

### Workflow C — Owner resets Manager (same as B with role policy)

Owner may reset Manager-linked Employees. Same reset endpoint and forced-change path.

### Owner resets Owner

Permitted when target Owner has a linked Employee profile addressable by `employeeId` (per spec
assumption). Policy: actor OWNER and target OWNER in same company.

---

## 4. Temporary Password Strategy

### Design

| Concern              | Decision                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generation           | Automatic secure temporary password generation (cryptographically random; meets product strength rules). Clients never supply a temporary password. |
| Hashing              | Temporary password is hashed with existing bcrypt `PasswordHasher` before persistence.                                                              |
| One-time display     | Plaintext temporary password is returned **only once** in the successful reset response.                                                            |
| Forced change flag   | Reset sets `passwordChangeRequired = true` on the target User.                                                                                      |
| Password replacement | Successful change password replaces the hash; the temporary password becomes invalid.                                                               |
| Session invalidation | Password reset immediately revokes all refresh tokens and invalidates existing authenticated sessions for the target User.                          |

### Storage rules

- Temporary passwords are **never** stored in plaintext.
- Only password hashes are persisted (`User.passwordHash`).
- Plaintext MUST NOT appear in logs, audit metadata, or any subsequent API response.
- If the administrator loses the one-time value, they must perform another reset.

### Complete lifecycle

```text
Manager / Owner
       ↓
Reset Password
  (POST /employees/{employeeId}/password-reset, empty body)
       ↓
System Generates Temporary Password
       ↓
Hash Stored
  (bcrypt → User.passwordHash;
   passwordChangeRequired = true;
   previous credentials immediately invalid)
       ↓
Temporary Password Returned Once
  (response only; admin communicates out of band)
       ↓
Employee Logs In
  (temporary password authenticates; sessions established)
       ↓
Password Change Required
  (middleware blocks non-allowlisted protected routes)
       ↓
Employee Changes Password
  (POST /users/me/password with current = temporary password)
       ↓
Temporary Password Replaced
  (new hash stored; passwordChangeRequired = false;
   passwordChangedAt = now; temporary password invalid)
       ↓
Normal Login Flow
```

### Session effects on reset

1. Password reset immediately revokes **all** refresh tokens for the target User (`SessionRepository.revokeAllForUser`).
2. Existing authenticated sessions are invalidated; the Employee must log in with the new temporary password.
3. After forced change completes, subsequent logins use the Employee-chosen password only.

### Relation to other plan sections

- Generation / empty-body validation: §7
- Authorization who may reset: §8
- Forced-change allowlist and DB re-check: §10
- Acceptance: AC-003, AC-003b, AC-005, AC-008

---

## 5. Company Ownership Strategy

- `companyId` never accepted from clients for these operations.
- All lookups use `auth.companyId`.
- Reset resolves `Employee.findById(employeeId, companyId)` then `User` via `employee.userId`.
- Cross-company attempts yield 404/403 with no writes.

---

## 6. API Design

Base: `/api/v1`.

### Change Password

| Field    | Value                                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose  | Authenticated user changes own password                                                                                                                                              |
| URI      | `/users/me/password`                                                                                                                                                                 |
| Method   | `POST`                                                                                                                                                                               |
| Auth     | OWNER, MANAGER, EMPLOYEE (allowlisted under forced-change)                                                                                                                           |
| Request  | `{ currentPassword, newPassword, confirmPassword }`                                                                                                                                  |
| Response | `200` `{ passwordChangeRequired: false, passwordChangedAt }`                                                                                                                         |
| Errors   | `401`, `400` validation, `401`/`409` incorrect current (prefer generic invalid credentials style or 400 with field error — use `400` with path `currentPassword` for UX consistency) |

### Reset Employee Password

| Field    | Value                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Purpose  | Admin reset linked Employee User; system generates temporary password returned once                            |
| URI      | `/employees/{employeeId}/password-reset`                                                                       |
| Method   | `POST`                                                                                                         |
| Auth     | OWNER, MANAGER                                                                                                 |
| Request  | empty body `{}` (or no body); path `employeeId` only                                                           |
| Response | `200` `{ employeeId, userId, passwordChangeRequired: true, temporaryPassword }` — plaintext temp **only here** |
| Errors   | `401`, `403`, `404`, `409` no linked user / inactive                                                           |

### Get Password Status

| Field    | Value                                                 |
| -------- | ----------------------------------------------------- |
| Purpose  | Whether authenticated user must change password       |
| URI      | `/users/me/password-status`                           |
| Method   | `GET`                                                 |
| Auth     | OWNER, MANAGER, EMPLOYEE (allowlisted)                |
| Request  | none                                                  |
| Response | `200` `{ passwordChangeRequired, passwordChangedAt }` |
| Errors   | `401`                                                 |

### Login enrichment (existing endpoint)

`POST /auth/login` response `user` object includes `passwordChangeRequired: boolean` so clients can
route to change-password UI immediately.

---

## 7. Validation Design (Zod)

### Shared

```text
passwordField: z.string().min(8)
```

### Change password schema

- `currentPassword`: min 1 (or min 8 — prefer min 1 so short legacy isn't blocked from stating current; verification is hash compare)
- `newPassword`: min 8
- `confirmPassword`: min 8
- refine: `newPassword === confirmPassword`
- refine: `newPassword !== currentPassword`

### Reset schema

- Empty object / no body fields required for password values
- Do **not** accept client-supplied temporary passwords

### Temporary password generation (application service)

- Cryptographically secure random generator producing a password meeting product strength rules (min length and entropy sufficient for temporary use)
- Plaintext returned only in the use-case response; only bcrypt hash stored
- Never logged; never written to audit metadata in plaintext

### Business validation (application)

- Current password bcrypt compare
- Role matrix for reset (`password-reset.policy.ts`)
- Employee linked, same company, User active
- Strength already covered by Zod min length (same product baseline as provisioning)

### Shared validators

Extract `passwordConfirmationPair(passwordKey, confirmKey)` helper used by the change-password schema
(and align with `employeeAccountCredentialsSchema` patterns from P011).

---

## 8. Authorization Matrix

| Action                  | Owner | Manager | Employee |
| ----------------------- | ----- | ------- | -------- |
| Change own password     | ✅    | ✅      | ✅       |
| Get own password status | ✅    | ✅      | ✅       |
| Reset Employee password | ✅    | ✅      | ❌       |
| Reset Manager password  | ✅    | ❌      | ❌       |
| Reset Owner password    | ✅    | ❌      | ❌       |

Target resolution uses linked User's `role`, not Employee profile fields.

---

## 9. Business Rules

1. Users may only change their own password.
2. Current password must be verified before change.
3. Managers may only reset Employee-role accounts.
4. Owners may reset Manager and Employee accounts; Owners may reset other Owners (same company, linked Employee).
5. Target User must belong to authenticated Company.
6. Reset generates a temporary password, sets `passwordChangeRequired = true`, and immediately invalidates previous credentials.
7. Change clears `passwordChangeRequired = false` and sets `passwordChangedAt`; temporary password becomes invalid.
8. Reset does not modify Employee records.
9. Historical operational records remain intact.
10. Temporary passwords are returned once only and are never recoverable afterward.
11. Email forgot-password out of scope.

---

## 10. Session & Security Strategy

| Topic                        | Decision                                                                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password hashing             | Existing bcrypt `PasswordHasher`; never log plaintext; never persist plaintext temporary passwords — **only hashes**                                                                                                                                             |
| Admin reset sessions         | Immediately revoke **all** refresh tokens for the target User (`revokeAllForUser`); existing authenticated sessions are invalidated                                                                                                                              |
| Change password sessions     | Revoke all refresh sessions for the user (forces re-login with new password on other devices). Access token until expiry is acceptable MVP (short TTL); optional future: token version claim                                                                     |
| Access token behavior        | Unchanged JWT; forced-change enforced server-side via middleware using User flag (load user or embed claim refreshed at login only — **Decision**: middleware loads User by `auth.userId` or reads flag if stamped on login and re-checked from DB for security) |
| DB re-check                  | Middleware MUST read current `passwordChangeRequired` from User repository (not trust stale JWT-only claim)                                                                                                                                                      |
| Allowlist when required      | `POST /users/me/password`, `GET /users/me/password-status`, `POST /auth/logout`, `POST /auth/refresh`, `GET /users/me` (optional for profile)                                                                                                                    |
| `passwordChangedAt`          | Set on successful change; left unchanged on admin reset (or set on reset too — **Decision**: update on both change and reset to reflect last credential mutation time)                                                                                           |
| Temporary password lifecycle | Full design in **§4 Temporary Password Strategy**                                                                                                                                                                                                                |
| MFA future                   | Side-car factors by `userId`; gate can compose later                                                                                                                                                                                                             |

---

## 11. Error Scenarios

| Scenario                        | Response                                              |
| ------------------------------- | ----------------------------------------------------- |
| Incorrect current password      | `400` validation / invalid current                    |
| Weak new password (change)      | `400`                                                 |
| Passwords do not match (change) | `400`                                                 |
| User / employee not found       | `404`                                                 |
| Employee has no login           | `409`                                                 |
| Unauthorized reset              | `403`                                                 |
| Cross-company access            | `404`/`403`                                           |
| Forced-change blocked route     | `403` with clear code e.g. `PASSWORD_CHANGE_REQUIRED` |
| Inactive user reset             | `409`                                                 |

Add `PASSWORD_CHANGE_REQUIRED` to shared error codes if not present.

---

## 12. Swagger Design

- **Tags**: `Users`, `Employees`
- **Schemas**: `ChangePasswordRequest`, `PasswordStatusResponse`, `ResetEmployeePasswordResponse` (includes one-time `temporaryPassword`); empty reset request body; extend login `User` summary with `passwordChangeRequired`
- **Examples**: successful change; reset showing one-time temp; status required true/false
- **Errors**: standard envelope + forced-change 403 example

Update `user.openapi.ts`, `employee.openapi.ts`, `common-schemas.ts`, auth login schema.

---

## 13. Testing Strategy

### Unit (Vitest)

- Change password success / bad current / mismatch / clears flag
- Reset policy matrix (Manager→Employee ok; Manager→Manager fail; Owner→Owner ok)
- Reset sets flag + hashing called
- Password gate allowlist logic

### Integration

- User column persistence for new fields
- Session revoke after reset/change

### API (Supertest)

- Change password + login with new password only
- Reset → login → blocked resource → change → access restored
- Authz and tenant isolation
- Validation failures
- Existing user-link / provisioning regression smoke

---

## 14. Acceptance Criteria (Engineering)

- **AC-001**: Change password updates hash; old password fails login; new succeeds.
- **AC-002**: Incorrect current password leaves hash unchanged.
- **AC-003**: Admin reset sets `passwordChangeRequired=true`, returns one-time `temporaryPassword`, and that value works for login; previous password fails.
- **AC-003b**: Temporary password plaintext is not returned by any subsequent endpoint.
- **AC-004**: While flag true, non-allowlisted protected routes return 403 `PASSWORD_CHANGE_REQUIRED`.
- **AC-005**: After change, flag false, protected routes work, and temporary password no longer authenticates.
- **AC-006**: Manager cannot reset Manager/Owner; Owner can reset Employee/Manager/Owner (linked).
- **AC-007**: Cross-company reset returns not-found/forbidden.
- **AC-008**: Reset/change revoke refresh sessions for target/self as specified.
- **AC-009**: OpenAPI + `docs/api-reference.md` updated.
- **AC-010**: Unit and API tests pass in CI.

---

## 15. Future Extensibility

| Capability            | Fit without redesign                                                          |
| --------------------- | ----------------------------------------------------------------------------- |
| Forgot password email | Expand P001 placeholder; set token side-table; still update User hash + flags |
| Reset links           | Token entity references `userId`                                              |
| Account recovery      | Parallel to User identity                                                     |
| MFA                   | Factors keyed by `userId`; login challenge before session                     |
| Password expiration   | Policy vs `passwordChangedAt`                                                 |
| Password history      | History table keyed by `userId`; check on change                              |

`passwordChangeRequired` remains the forced-compliance switch for admin and future recovery flows.

---

## Phase 0 / Phase 1 Artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [quickstart.md](./quickstart.md)

## Implementation Notes for Tasks Phase

1. Migration: add User columns with defaults
2. Domain/entity/repo + in-memory updates
3. Error code + password-change-gate middleware wiring in app
4. Change password + status (user module)
5. Reset password (employee module) + secure temp generator + policy
6. Login DTO enrichment + password-change gate
7. Tests + OpenAPI + docs
