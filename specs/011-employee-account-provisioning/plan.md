# Implementation Plan: P003 Addendum — Employee Account Provisioning

**Branch**: `011-employee-account-provisioning` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-employee-account-provisioning/spec.md`

**Note**: This plan is the definitive technical design for Employee Account Provisioning — not
implementation code. It follows architecture, conventions, and engineering decisions from
P001–P010 without redefining them. It extends Employee Management and User Management only.

## Summary

Extend the existing `employee` module (with orchestration against `user`, `auth`/`session`, and
shared password hashing) so Owners and Managers can:

1. Create an Employee with or without a login account in one request.
2. Grant system access later by creating and linking a User for an Employee that has none.
3. Disable and re-enable login by toggling `User.status` without deleting the Employee or rewriting
   history.

Employee remains the business/workforce identity; User remains the authentication identity. The
existing optional one-to-one link (`User.employeeId` ↔ `Employee.userId`) is reused — no User model
redesign. Create-with-account and grant-access run inside a single DB transaction so Employee and
User stay consistent. Company IDs are always taken from `req.auth.companyId`.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT (P001), bcrypt, Pino,
Swagger/OpenAPI, Vitest, Supertest — no new runtime dependencies

**Storage**: Existing `User` and `Employee` tables; no new tables. Reuse `UserStatus`
(`ACTIVE` | `INACTIVE`) for disable/enable. Bidirectional optional FKs already present.

**Testing**: Vitest (unit/integration), Supertest (API/authorization/tenant isolation)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API — extensions to `employee` + `user` (+ session revoke on disable)

**Performance Goals**: Create-with-account and grant-access complete under interactive latency for
single-employee onboarding; email uniqueness enforced by existing global unique index

**Constraints**: Company tenant boundary; clients never send `companyId`; only Owners create Owner
accounts; Managers create Employee accounts (Manager-role provisioning Owner-only until Company
permissions exist); passwords never returned; disable does not archive Employee

**Scale/Scope**: ~4–5 use cases, 3 new/extended routes, Zod schema extensions, authorization policy
for role assignment, OpenAPI updates, unit + API tests — no new module package

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                              |
| -------------------------------- | ---------- | ----------- | ------------------------------------------------------------------ |
| Layer boundaries                 | ✅         | ✅          | Logic in employee/user application use cases; Prisma in repos only |
| No business logic in controllers | ✅         | ✅          | Controller delegates to use cases                                  |
| Repository pattern               | ✅         | ✅          | Extend `UserRepository` / `EmployeeRepository`; no ad-hoc Prisma   |
| Dependency injection             | ✅         | ✅          | Wire new use cases in `src/config/container.ts`                    |
| Zod validation                   | ✅         | ✅          | Extended create + system-access schemas                            |
| DTOs                             | ✅         | ✅          | Request/response DTOs; password never in responses                 |
| Standard response envelope       | ✅         | ✅          | Reuses P001 helpers                                                |
| Pagination conventions           | ✅         | ✅          | N/A for mutate endpoints; list unchanged                           |
| Security                         | ✅         | ✅          | bcrypt hash; JWT auth; role matrix; revoke sessions on disable     |
| No `any`                         | ✅         | ✅          | Strict TypeScript                                                  |
| Error handling                   | ✅         | ✅          | Existing HTTP exception types                                      |
| Logging                          | ✅         | ✅          | Structured audit for provision / grant / disable / enable          |
| Tests                            | ✅         | ✅          | Unit, API, authz, tenant, rollback, duplicate email                |
| OpenAPI                          | ✅         | ✅          | `employee.openapi.ts` + common schemas                             |
| Simplicity                       | ✅         | ✅          | No new module or permission engine; reuse UserStatus               |

## Project Structure

### Documentation (this feature)

```text
specs/011-employee-account-provisioning/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 — /speckit-tasks
```

### Source code (extensions)

```text
src/modules/employee/
├── application/
│   ├── dto/
│   │   ├── create-employee.request.ts          # MOD — optional account block
│   │   ├── grant-system-access.request.ts      # NEW
│   │   ├── employee.response.ts                # MOD — optional linkedUser summary
│   │   └── linked-user.response.ts             # NEW — safe user summary (no password)
│   ├── policies/
│   │   ├── employee-authorization.policy.ts    # EXISTING
│   │   └── account-provisioning.policy.ts      # NEW — who may assign which role
│   ├── services/
│   │   ├── employee-account-provisioning.service.ts  # NEW — shared create+link orchestration
│   │   └── employee-account-audit.service.ts         # NEW — audit events
│   └── use-cases/
│       ├── create-employee.use-case.ts         # MOD — optional createAccount path
│       ├── grant-system-access.use-case.ts     # NEW
│       ├── disable-system-access.use-case.ts   # NEW
│       └── enable-system-access.use-case.ts    # NEW
├── domain/
│   ├── employee-rules.ts                       # MOD — access-state guards
│   └── employee.repository.ts                  # MOD — transactional create helpers if needed
├── presentation/
│   ├── employee.controller.ts                  # MOD
│   ├── employee.routes.ts                      # MOD
│   ├── employee.schemas.ts                     # MOD
│   └── employee.openapi.ts                     # MOD
└── index.ts                                    # MOD — export wiring

src/modules/user/
├── domain/
│   ├── user.repository.ts                      # MOD — updateStatus; createWithEmployeeLink
│   ├── user-rules.ts                           # NEW/MOD — disable/enable invariants
│   └── user.entity.ts                          # unchanged fields; helpers if needed
└── infrastructure/
    └── user.prisma-repository.ts               # MOD

src/modules/session/                            # EXTENSION
└── domain/session.repository.ts                # MOD/USE — revokeAllForUser on disable

src/shared/auth/                                # REUSE
└── password-hasher.interface.ts

tests/
├── unit/employee/
│   ├── create-employee-with-account.use-case.test.ts
│   ├── grant-system-access.use-case.test.ts
│   ├── disable-enable-system-access.use-case.test.ts
│   └── account-provisioning.policy.test.ts
├── api/employee/
│   ├── employee-create-with-account.api.test.ts
│   ├── employee-system-access.api.test.ts
│   └── employee-account-tenant-isolation.api.test.ts
└── integration/employee/
    └── employee-account-transaction.persistence.test.ts
```

**Structure Decision**: Extend `employee` as the orchestration owner for provisioning workflows;
`user` remains the identity store. Do not create a new top-level module — this is an addendum to
Employee/User management established in P001.

## Complexity Tracking

> No constitution violations. Empty by design.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |

---

## 1. Module Architecture

### Feature responsibilities

| Concern                         | Owner module                         |
| ------------------------------- | ------------------------------------ |
| Employee CRUD (existing)        | `employee`                           |
| Optional account on create      | `employee` use case orchestration    |
| Grant / disable / enable access | `employee` use cases                 |
| User persistence & status       | `user` repository                    |
| Password hashing                | shared `PasswordHasher` (auth infra) |
| Session revoke on disable       | `session` repository                 |
| Role-assignment authorization   | `employee` policy                    |

### Dependencies

- **Employee → User**: create User, link, update status, find by email (uniqueness).
- **Employee → PasswordHasher**: hash plaintext passwords before persist.
- **Employee → SessionRepository**: revoke refresh sessions when disabling access.
- **Employee does not** own authentication (login remains `auth` module).

### Service boundaries

- `CreateEmployeeUseCase` remains the public create entry; when `createAccount` is true it
  delegates shared provisioning helper inside one transaction.
- `GrantSystemAccessUseCase` creates User + bidirectional link for an existing Employee.
- `DisableSystemAccessUseCase` / `EnableSystemAccessUseCase` mutate User status only.
- Existing `LinkEmployeeToUserUseCase` (`POST .../user-link`) remains for linking an **already
  existing** User; Grant System Access is for **creating** a new User.

### Transaction boundaries

| Workflow                     | Atomic unit                                        |
| ---------------------------- | -------------------------------------------------- |
| Create Employee (no account) | Single Employee insert (existing)                  |
| Create Employee + account    | Employee insert + User insert + bidirectional link |
| Grant system access          | User insert + bidirectional link                   |
| Disable / enable             | User status update (+ session revoke on disable)   |

Failure of any step in a multi-write workflow rolls back the entire transaction — no orphan User
or Employee half-provisioned for that request.

### Why Employee vs User stay separate

- **Employee** is the workforce/business identity (salary, attendance, trips, transactions).
- **User** is the authentication identity (email, password hash, role, login eligibility).
- Optional link allows workers without system access and Owners without workforce profiles (P001
  company onboarding). Provisioning via this feature always creates the link immediately.

---

## 2. Entity Extension Design

### Employee

**Relationship**

```text
Employee 1 ──(optional)── 1 User
```

Existing fields reused: `id`, `companyId`, `userId`, profile fields, `status`, soft-delete.

**Business rules (unchanged structurally)**

- Employee may exist without User (`userId` null).
- Employee may have only one User (`userId` unique).
- When provisioned via this feature, the created User is linked to that Employee immediately.

No new Employee columns required.

### User

**Existing fields reused**: `id`, `companyId`, `employeeId`, `email`, `passwordHash`, `role`,
`status`, `lastLoginAt`, soft-delete timestamps.

**Provisioning considerations**

| Concern              | Design                                                             |
| -------------------- | ------------------------------------------------------------------ |
| Account provisioning | Create User with `status=ACTIVE`, hash password, set `employeeId`  |
| Account activation   | Out of scope as invite/token flow; provisioned accounts are ACTIVE |
| Account disabling    | Set `status=INACTIVE`; login policy already rejects inactive users |
| Account enabling     | Set `status=ACTIVE` for a linked inactive User                     |

**Do not redesign the User model.** No new enums or tables.

**Clarified rule (provisioning path)**: Users created through Employee Account Provisioning MUST be
linked to exactly one Employee. Pre-existing Owner accounts from Company onboarding may exist
without an Employee (P001 exception). Ad-hoc User creation without Employee is not introduced by
this feature.

---

## 3. Business Workflow

### Workflow A — Create Employee without account

```text
Create Employee (createAccount=false|omitted)
  → Validate employee fields
  → Persist Employee (companyId from auth)
  → Return Employee (userId=null)
```

### Workflow B — Create Employee with account

```text
Create Employee (createAccount=true)
  → Validate employee + account fields (email, password, confirmPassword, role)
  → Assert actor may assign role
  → Assert email globally unique
  → BEGIN TRANSACTION
      → Persist Employee
      → Hash password
      → Persist User (companyId from auth, employeeId set, status ACTIVE)
      → Set Employee.userId
  → COMMIT
  → Return Employee + linkedUser summary
```

### Workflow C — Grant system access

```text
Existing Employee (no user)
  → Validate account fields + role policy
  → Assert Employee active, same company, no existing user
  → Assert email unique
  → BEGIN TRANSACTION
      → Create User + link both sides
  → COMMIT
  → Return Employee + linkedUser summary
```

### Workflow D — Disable login

```text
Disable system access
  → Assert Employee same company + has linked User
  → Set User.status = INACTIVE
  → Revoke all refresh sessions for that User
  → Employee unchanged (remains ACTIVE unless separately archived)
```

### Workflow E — Enable login

```text
Enable system access
  → Assert Employee same company + has linked User currently INACTIVE
  → Set User.status = ACTIVE
  → Employee unchanged
```

### Failure scenarios (consistency)

| Failure                       | Result                                                |
| ----------------------------- | ----------------------------------------------------- |
| Validation / role policy fail | No writes                                             |
| Duplicate email               | Transaction aborted; no Employee created (workflow B) |
| Employee already has User (C) | 409 / business conflict; no second User               |
| Mid-transaction DB error      | Full rollback                                         |
| Cross-company employee id     | 404/403; no writes                                    |

---

## 4. Company Ownership Strategy

- `companyId` is **never** accepted from client bodies for these operations.
- `Employee.companyId = auth.companyId`
- `User.companyId = auth.companyId`
- Lookups use `(employeeId, companyId)` repository methods.
- Cross-company account creation is forbidden (tenant isolation middleware + repository scoping).

---

## 5. API Design

Base path prefix: `/api/v1` (existing).

### Create Employee (with optional account)

| Field    | Value                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Purpose  | Create Employee; optionally create and link User                                                                                |
| URI      | `/employees`                                                                                                                    |
| Method   | `POST`                                                                                                                          |
| Auth     | OWNER, MANAGER                                                                                                                  |
| Request  | Existing employee fields + optional `createAccount: boolean` + when true: `account: { email, password, confirmPassword, role }` |
| Response | `201` Employee summary; includes `linkedUser: { id, email, role, status }` when account created                                 |
| Errors   | `401`, `403`, `422` validation, `409` duplicate email / employee number, `403` role not allowed                                 |

Mutual exclusion: `createAccount=true` cannot be combined with legacy `userId` (link existing user).

### Grant System Access

| Field    | Value                                                                                     |
| -------- | ----------------------------------------------------------------------------------------- |
| Purpose  | Create User and link to Employee without account                                          |
| URI      | `/employees/{employeeId}/system-access`                                                   |
| Method   | `POST`                                                                                    |
| Auth     | OWNER, MANAGER                                                                            |
| Request  | `{ email, password, confirmPassword, role }`                                              |
| Response | `201` Employee + `linkedUser`                                                             |
| Errors   | `401`, `403`, `404` employee, `409` already has user / duplicate email, `422`, `403` role |

### Disable System Access

| Field    | Value                                                        |
| -------- | ------------------------------------------------------------ |
| Purpose  | Disable login without deleting Employee                      |
| URI      | `/employees/{employeeId}/system-access/disable`              |
| Method   | `POST`                                                       |
| Auth     | OWNER, MANAGER                                               |
| Request  | path `employeeId` only                                       |
| Response | `200` Employee + `linkedUser` with `status: INACTIVE`        |
| Errors   | `401`, `403`, `404`, `409` no linked user / already inactive |

### Enable System Access

| Field    | Value                                                      |
| -------- | ---------------------------------------------------------- |
| Purpose  | Re-enable a previously disabled linked User                |
| URI      | `/employees/{employeeId}/system-access/enable`             |
| Method   | `POST`                                                     |
| Auth     | OWNER, MANAGER                                             |
| Request  | path `employeeId` only                                     |
| Response | `200` Employee + `linkedUser` with `status: ACTIVE`        |
| Errors   | `401`, `403`, `404`, `409` no linked user / already active |

### Existing (unchanged) link

`POST /employees/{employeeId}/user-link` with `{ userId }` remains for associating a pre-existing
User; it is not the grant-access create path.

---

## 6. Validation Design (Zod)

### Employee validation

Reuse existing create fields (`firstName`, `lastName`, `weeklySalary`, etc.).

### Account block (shared)

```text
accountFields:
  email: z.string().email()
  password: z.string().min(8)
  confirmPassword: z.string().min(8)
  role: z.enum(['OWNER', 'MANAGER', 'EMPLOYEE'])
```

Cross-field: `password === confirmPassword` via `.superRefine` / `.refine`.

### Create Employee schema extension

- `createAccount: z.boolean().optional().default(false)`
- When `createAccount === true`, `account` object required.
- When `createAccount === true`, `userId` must be absent.
- When `createAccount === false`, `account` must be absent.

### Grant schema

Same account fields as body (no nest).

### Shared validators

Extract `accountCredentialsSchema` in `employee.schemas.ts` (or shared auth schemas if already
present) and reuse for create + grant.

### Business validation (application layer)

- Email uniqueness via `userRepository.findByEmail`
- Role assignment via `account-provisioning.policy`
- Employee active / no existing user / has user for disable-enable
- Company scoping via repository `findById(id, companyId)`

---

## 7. Authorization Matrix

| Action                                     | Owner | Manager                        | Employee |
| ------------------------------------------ | ----- | ------------------------------ | -------- |
| Create Employee                            | ✅    | ✅                             | ❌       |
| Create Login Account (on create)           | ✅    | ✅ (role limits below)         | ❌       |
| Grant System Access                        | ✅    | ✅ (role limits below)         | ❌       |
| Disable Login                              | ✅    | ✅                             | ❌       |
| Enable Login                               | ✅    | ✅                             | ❌       |
| Assign role EMPLOYEE                       | ✅    | ✅                             | ❌       |
| Assign role MANAGER                        | ✅    | ❌ (until Company permissions) | ❌       |
| Assign role OWNER / Owner account creation | ✅    | ❌                             | ❌       |

Company permission settings for Manager-role provisioning are future work; v1 hard-codes
Manager→EMPLOYEE only.

---

## 8. Business Rules

1. Employee may exist without User.
2. Users created by this feature must be linked to exactly one Employee (P001 Owner-without-employee exception remains for company onboarding only).
3. Only one User per Employee.
4. Email addresses are globally unique.
5. Company ownership is server-controlled; clients never submit `companyId`.
6. Only Owners may create Owner accounts.
7. Managers may create Employee accounts.
8. Managers may create Manager accounts only if permitted (not in v1).
9. Disabling login never removes Employee history or archives the Employee by itself.
10. Historical audit/workforce records remain unchanged on disable/enable.
11. `createAccount` and legacy `userId` on create are mutually exclusive.
12. Passwords are hashed with bcrypt; plaintext never stored or logged.
13. Disabled users cannot authenticate (existing login policy).
14. Disable revokes refresh sessions for that user.

---

## 9. Error Scenarios

| Scenario                        | HTTP / code pattern                 |
| ------------------------------- | ----------------------------------- |
| Duplicate email                 | `409` DuplicateResource             |
| Employee already has User       | `409` Lifecycle/Duplicate linkage   |
| Missing Employee                | `404`                               |
| Cross-company access            | `404` or `403` (tenant-scoped find) |
| Unauthorized role assignment    | `403` Forbidden                     |
| Weak / short password           | `422` Validation                    |
| Password ≠ confirm              | `422` Validation                    |
| Validation failures             | `422` with field details            |
| No linked user (disable/enable) | `409`                               |
| Archived employee grant         | `409` / business rule               |
| Unauthenticated                 | `401`                               |

---

## 10. Swagger Design

- **Tags**: reuse `Employees` (or add `Employee Account Provisioning` under Employees).
- **Schemas**:
  - `CreateEmployeeRequest` — extend with `createAccount`, `account`
  - `EmployeeAccountCredentials` — email, password, confirmPassword, role
  - `GrantSystemAccessRequest`
  - `LinkedUserSummary` — id, email, role, status (never passwordHash)
  - `EmployeeResponse` — include optional `linkedUser`
- **Examples**: create without account; create with account; grant; disable; enable.
- **Responses**: standard success envelope; error envelope with codes above.
- Update `employee.openapi.ts` and `src/swagger/common-schemas.ts`.

---

## 11. Testing Strategy

### Unit (Vitest)

- Create without account (regression).
- Create with account success; password mismatch; role forbidden; duplicate email.
- Grant success / already linked / archived / role policy.
- Disable → login policy rejects; enable restores ACTIVE.
- Account provisioning policy matrix.

### Integration

- Transaction rollback: forced failure after Employee insert leaves zero Users and zero Employees
  for that attempt (or compensated assertion via unique email retry).
- Bidirectional link consistency (`User.employeeId` and `Employee.userId`).

### API (Supertest)

- Happy paths for A/B/C/D/E.
- Authorization: Employee role 403 on all provisioning routes.
- Manager cannot assign OWNER/MANAGER.
- Owner can assign all roles.
- Tenant isolation: company A cannot grant/disable company B employee.
- Duplicate email across companies still 409 (global unique).
- Login works after provision; fails after disable; works after enable.

---

## 12. Acceptance Criteria (Engineering)

- **AC-001**: Create without account leaves `userId` null; login with any credentials for that worker fails.
- **AC-002**: Create with account returns linked user; login succeeds with provided email/password.
- **AC-003**: Password mismatch yields 422 and zero new Employee/User rows for that request.
- **AC-004**: Grant on unlinked active Employee creates User and enables login.
- **AC-005**: Grant on already-linked Employee returns conflict.
- **AC-006**: Disable sets User `INACTIVE`, revokes sessions, Employee stays ACTIVE; login fails.
- **AC-007**: Enable sets User `ACTIVE`; login succeeds.
- **AC-008**: Manager assigning OWNER or MANAGER returns 403.
- **AC-009**: Cross-company employeeId returns not-found/forbidden with no writes.
- **AC-010**: OpenAPI documents all new/changed contracts.
- **AC-011**: All new unit/API tests pass in CI.

---

## 13. Future Extensibility

| Future capability  | How this design supports it without redesign                                            |
| ------------------ | --------------------------------------------------------------------------------------- |
| Email invitations  | Add invite token entity; User created pending; still link to Employee                   |
| Account activation | New status or flag on User; login policy gate                                           |
| Password reset     | Expand existing forgot-password placeholder; User identity unchanged                    |
| MFA                | Side-car factors keyed by `userId`                                                      |
| SSO                | External subject map to User; Employee link unchanged                                   |
| Role builder       | Replace fixed enum assignment policy with permission checks; User.role may evolve later |

Employee remains workforce identity; User remains auth identity; optional 1:1 link is the stable seam.

---

## Phase 0 / Phase 1 Artifacts

- [research.md](./research.md) — decisions and alternatives
- [data-model.md](./data-model.md) — entity extension and state transitions
- [contracts/openapi.yaml](./contracts/openapi.yaml) — API contracts
- [quickstart.md](./quickstart.md) — validation scenarios

## Implementation Notes for Tasks Phase

Preferred task order:

1. Policy + shared Zod account schema + DTOs
2. UserRepository status + transactional create/link helpers
3. Extend CreateEmployeeUseCase
4. Grant / Disable / Enable use cases + routes + OpenAPI
5. Session revoke on disable
6. Tests (unit → integration → API)
7. Docs (`docs/api-reference.md`) touch-up
