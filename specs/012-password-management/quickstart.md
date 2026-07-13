# Quickstart: Password Management

**Feature**: `012-password-management`  
**Date**: 2026-07-13

Validate after implementation. Contracts: [contracts/openapi.yaml](./contracts/openapi.yaml).
Data model: [data-model.md](./data-model.md).

## Prerequisites

- API running with seeded or onboarded Company
- Owner token; Employee (or Manager) with linked login from seed / account provisioning
- `curl` or HTTP client

Base URL: `http://localhost:3000/api/v1` (adjust port).

## Scenario 1 — Change own password

1. Login as a linked employee.
2. `POST /users/me/password` with correct `currentPassword`, matching new/confirm.
3. Expect `200`, `passwordChangeRequired: false`.
4. Login with old password fails; new password succeeds.

## Scenario 2 — Incorrect current password

1. Authenticated.
2. Change password with wrong `currentPassword`.
3. Expect `400`; login with original password still works.

## Scenario 3 — Admin reset + forced change (system-generated temp)

1. As Owner, `POST /employees/{employeeId}/password-reset` with empty body `{}`.
2. Expect `200`, `passwordChangeRequired: true`, and a `temporaryPassword` string in the response.
3. Save that temporary password (it will not be returned again).
4. Login with the employee's **previous** password → fails.
5. Login with `temporaryPassword` → `200`, user flag true.
6. `GET /employees` (or any non-allowlisted route) → `403 PASSWORD_CHANGE_REQUIRED`.
7. `GET /users/me/password-status` → `passwordChangeRequired: true`.
8. `POST /users/me/password` with current=temporaryPassword, new password → `200`.
9. Non-allowlisted routes succeed again; login with temporaryPassword fails.

## Scenario 4 — Authorization

1. Manager resets Employee → success with one-time `temporaryPassword`.
2. Manager resets Manager-linked employee → `403`.
3. Employee calls password-reset → `403`.

## Scenario 5 — Tenant isolation

1. Company B owner resets Company A `employeeId` → `404`/`403`.

## Scenario 6 — Session revoke

1. Employee logged in (has refresh token).
2. Owner resets that employee password.
3. Employee refresh token rejected; must login with the new temporary password from the reset response.

## Automated checks (post-implement)

```bash
pnpm test -- tests/unit/user/
pnpm test -- tests/unit/employee/
pnpm test -- tests/api/user/
pnpm test -- tests/api/employee/employee-password-reset.api.test.ts
```

(Exact paths as created in tasks/implement phase.)
