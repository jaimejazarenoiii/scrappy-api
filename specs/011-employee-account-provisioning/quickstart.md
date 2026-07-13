# Quickstart: Employee Account Provisioning

**Feature**: `011-employee-account-provisioning`  
**Date**: 2026-07-13

Validate the addendum end-to-end after implementation. Contracts:
[contracts/openapi.yaml](./contracts/openapi.yaml). Data model: [data-model.md](./data-model.md).

## Prerequisites

- API running locally with seeded or onboarded Company
- Owner token (`owner@example.com` / seed password) and optionally Manager token
- `curl` or HTTP client

Base URL: `http://localhost:3000/api/v1` (adjust to local port).

## Scenario 1 — Create Employee without account

1. `POST /employees` as Owner/Manager with employee fields and `"createAccount": false` (or omit).
2. Expect `201`, `userId` / `linkedUser` null.
3. Attempt login with a guessed email → credentials fail.

## Scenario 2 — Create Employee with account

1. `POST /employees` with `"createAccount": true` and `account` block (email, password,
   confirmPassword, role `EMPLOYEE`).
2. Expect `201` with `linkedUser.email` and `status: ACTIVE`.
3. `POST /auth/login` with that email/password → `200` tokens.

## Scenario 3 — Password mismatch rejects atomically

1. Repeat Scenario 2 with mismatched `confirmPassword`.
2. Expect `422`.
3. Confirm no Employee with that identity and no User with that email exist.

## Scenario 4 — Grant system access

1. Create Employee without account (Scenario 1).
2. `POST /employees/{id}/system-access` with credentials + role `EMPLOYEE`.
3. Expect `201` and successful login.
4. Repeat grant → `409`.

## Scenario 5 — Disable and enable

1. From a linked Employee, `POST /employees/{id}/system-access/disable` → `200`,
   `linkedUser.status: INACTIVE`.
2. Login → rejected (inactive).
3. `POST /employees/{id}/system-access/enable` → login succeeds again.
4. Confirm Employee `status` remained `ACTIVE` throughout.

## Scenario 6 — Authorization

1. As Employee role: create/grant/disable/enable → `403`.
2. As Manager: assign `role: OWNER` or `MANAGER` on create/grant → `403`.
3. As Owner: assign `MANAGER` → succeeds.

## Scenario 7 — Tenant isolation

1. Using Company A token, call grant/disable on Company B `employeeId`.
2. Expect `404`/`403` and no User created in either company for that attempt.

## Scenario 8 — Duplicate email

1. Provision account with email `dup@example.com`.
2. Create another Employee with account using same email (same or other company).
3. Expect `409`.

## Automated checks (post-implement)

```bash
pnpm test -- tests/unit/employee/
pnpm test -- tests/api/employee/employee-create-with-account.api.test.ts
pnpm test -- tests/api/employee/employee-system-access.api.test.ts
pnpm test -- tests/api/employee/employee-account-tenant-isolation.api.test.ts
```

(Exact paths as created in tasks/implement phase.)
