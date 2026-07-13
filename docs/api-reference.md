# Scrappy API Reference

Frontend integration reference for the Scrappy API. All authenticated routes are **tenant-scoped**:
the access token carries the user's `companyId`, and every request only ever sees that company's data.

- **Base URL**: `http://localhost:3000` (dev) — all paths prefixed with `/api/v1`
- **Auth**: JWT Bearer token in the `Authorization` header
- **Content-Type**: `application/json` (except photo upload → `multipart/form-data`)
- **Interactive docs**: Swagger UI at `GET /docs` when the server is running
- **Attachment storage**: local disk in development/test; S3 (or S3-compatible) in production.
  Upload/download APIs are unchanged — clients still use the authenticated attachment endpoints.

## Table of contents

1. [Response envelope](#1-response-envelope)
2. [Authentication](#2-authentication)
3. [Company](#3-company)
4. [Users](#4-users)
5. [Employees](#5-employees)
6. [Branches](#6-branches)
7. [Warehouses](#7-warehouses)
8. [Vehicles](#8-vehicles)
9. [Workforce — Attendance](#9-workforce--attendance)
10. [Workforce — Leave](#10-workforce--leave)
11. [Workforce — Cash advances](#11-workforce--cash-advances)
12. [Workforce — Payroll](#12-workforce--payroll)
13. [Workforce — Dashboard](#13-workforce--dashboard)
14. [Transactions](#14-transactions)
15. [Trip Management](#15-trip-management)
16. [Analytics](#16-analytics)
17. [Reports](#17-reports)
18. [Expense Management](#18-expense-management)
19. [Company Subscriptions](#19-company-subscriptions)
20. [Admin supervision](#20-admin-supervision)
21. [Activity Logs](#21-activity-logs)
22. [Typical frontend flows](#22-typical-frontend-flows)

---

## 1. Response envelope

Every response (success or error) uses the same envelope.

**Success**

```json
{
  "success": true,
  "data": { "...": "payload (object or array)" },
  "meta": {},
  "error": null
}
```

**Paginated success** — `data` is an array and `meta` holds pagination:

```json
{
  "success": true,
  "data": [{ "...": "item" }],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 },
  "error": null
}
```

**Error**

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [{ "path": "branchId", "message": "branchId is required for BRANCH transactions." }]
  }
}
```

### Error codes → HTTP status

| HTTP | `error.code`              | When it happens                                                        |
| ---- | ------------------------- | ---------------------------------------------------------------------- |
| 400  | `VALIDATION_ERROR`        | Bad/missing fields, invalid location shape, unsupported/oversized file |
| 401  | `UNAUTHENTICATED`         | Missing/invalid/expired access token                                   |
| 403  | `FORBIDDEN`               | Role not allowed, or employee not assigned to the transaction          |
| 404  | `RESOURCE_NOT_FOUND`      | Resource not found (or belongs to another company)                     |
| 409  | `LIFECYCLE_CONFLICT`      | Editing a cancelled transaction, or archiving an archived record       |
| 409  | `BUSINESS_RULE_VIOLATION` | Not timed in, item total mismatch, max photos exceeded, etc.           |

### Roles

`OWNER`, `MANAGER`, `EMPLOYEE`. Listed per endpoint below.

---

## 2. Authentication

### `POST /api/v1/auth/login` — public

Tenant login for company users (`OWNER`, `MANAGER`, `EMPLOYEE`). **`SUPER_ADMIN` cannot use this endpoint** — even with a correct password the API returns `401` `INVALID_CREDENTIALS` (same as a wrong password). Use `POST /api/v1/admin/auth/login` instead.

```json
{ "identifier": "owner@example.com", "password": "password123" }
```

Response `data`:

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "company": { "id": "uuid", "name": "...", "status": "ACTIVE" },
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "OWNER",
    "passwordChangeRequired": false
  }
}
```

Send on every authenticated request:

```
Authorization: Bearer <accessToken>
```

### `POST /api/v1/admin/auth/login` — public

Platform admin login. **Only `SUPER_ADMIN` succeeds.** Tenant roles (`OWNER`, `MANAGER`, `EMPLOYEE`) get `401` `INVALID_CREDENTIALS` even with a correct password. Skips tenant subscription and company `ACTIVE` gates so admins can manage suspended/expired companies.

Create an admin account (CLI):

```bash
pnpm run db:create-super-admin -- \
  --email admin@scrappy.com \
  --password 'SecurePass123'
```

Optional: `--company-id <uuid>` to attach the admin to an existing company (default: create/reuse company `Scrappy Platform`).

```json
{ "identifier": "superadmin@example.com", "password": "password123" }
```

Response shape matches tenant login (`AuthResponse`), with `user.role` = `SUPER_ADMIN`.

### `POST /api/v1/auth/refresh` — public

```json
{ "refreshToken": "..." }
```

Returns a new `{ accessToken, refreshToken, expiresIn, company, user }`.

### `POST /api/v1/auth/logout` — authenticated

Revokes the current refresh session. No body required.

### `POST /api/v1/auth/forgot-password` — public

Placeholder for future password reset. `{ "identifier": "user@example.com" }`.

### Token-based scoping (no `companyId` needed)

The access token carries `userId`, `companyId`, and `role`. **You never pass `companyId` in queries**
for list endpoints — they automatically return only the current company's records.

Convenience endpoints that resolve everything from the token:

| Endpoint                   | Roles | Returns                                                                                             |
| -------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| `GET /api/v1/users/me`     | all   | Current user (`id`, `companyId`, `email`, `role`, `status`, `employeeId`, `passwordChangeRequired`) |
| `GET /api/v1/companies/me` | all   | Current user's company                                                                              |
| `GET /api/v1/employees`    | all   | Active employees of the current company                                                             |
| `GET /api/v1/employees/me` | all   | Employee profile linked to the current user (`404` if none)                                         |

---

## 3. Company

| Method & path                         | Auth   | Roles  | Description                                   |
| ------------------------------------- | ------ | ------ | --------------------------------------------- |
| `POST /companies`                     | —      | public | Onboarding: create company + first owner user |
| `GET /companies/me`                   | Bearer | all    | Current company (from token)                  |
| `GET /companies/{companyId}`          | Bearer | all    | Company by id (must match token company)      |
| `PATCH /companies/{companyId}`        | Bearer | OWNER  | Update company                                |
| `POST /companies/{companyId}/archive` | Bearer | OWNER  | Soft-delete company                           |

**Create body** (public onboarding):

```json
{
  "name": "Acme Recycling",
  "contactNumber": "09171234567",
  "email": "company@example.com",
  "address": "Manila, Philippines",
  "ownerFullName": "Jane Owner",
  "ownerEmail": "owner@example.com",
  "ownerPassword": "password123"
}
```

**Company shape** (`data`): `{ id, name, logoUrl, contactNumber, email, address, status }` where
`status` is `ACTIVE` | `INACTIVE`.

---

## 4. Users

| Method & path                   | Roles | Description                                     |
| ------------------------------- | ----- | ----------------------------------------------- |
| `GET /users/me`                 | all   | Current authenticated user                      |
| `GET /users/me/password-status` | all   | Whether password change is required             |
| `POST /users/me/password`       | all   | Change own password (verifies current password) |

**CurrentUser shape**: `{ id, companyId, employeeId, email, role, status, lastLoginAt, passwordChangeRequired }`.

**Change password body**: `{ "currentPassword", "newPassword", "confirmPassword" }` (`newPassword` min 8, must match confirm, must differ from current).

**Password status shape**: `{ passwordChangeRequired, passwordChangedAt }`.

After an admin reset, login succeeds with the temporary password but non-allowlisted protected routes return `403` with code `PASSWORD_CHANGE_REQUIRED` until `POST /users/me/password` succeeds. Allowlisted while forced-change is active: `GET /users/me`, `GET /users/me/password-status`, `POST /users/me/password` (plus auth logout/refresh).

---

## 5. Employees

| Method & path                                        | Roles          | Description                                    |
| ---------------------------------------------------- | -------------- | ---------------------------------------------- |
| `GET /employees/me`                                  | all            | Current user's linked employee profile         |
| `GET /employees`                                     | all            | Active employees (for pickers)                 |
| `POST /employees`                                    | OWNER, MANAGER | Create employee (optional `createAccount`)     |
| `GET /employees/{employeeId}`                        | OWNER, MANAGER | Get employee by id                             |
| `PATCH /employees/{employeeId}`                      | OWNER, MANAGER | Update employee                                |
| `POST /employees/{employeeId}/archive`               | OWNER, MANAGER | Soft-delete employee                           |
| `POST /employees/{employeeId}/user-link`             | OWNER, MANAGER | Link employee to an **existing** user account  |
| `POST /employees/{employeeId}/system-access`         | OWNER, MANAGER | Create User + link (grant system access)       |
| `POST /employees/{employeeId}/system-access/disable` | OWNER, MANAGER | Disable login (`User.status=INACTIVE`)         |
| `POST /employees/{employeeId}/system-access/enable`  | OWNER, MANAGER | Re-enable login                                |
| `POST /employees/{employeeId}/password-reset`        | OWNER, MANAGER | Reset password; system generates one-time temp |

**Create body**:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "weeklySalary": 3500,
  "employeeNumber": "EMP-001",
  "contactNumber": "0917...",
  "status": "ACTIVE",
  "createAccount": true,
  "account": {
    "email": "jane@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "EMPLOYEE"
  }
}
```

Omit `createAccount` / set `false` to create Employee only. `createAccount` cannot be combined with
`userId`. Managers may only assign `EMPLOYEE` role; Owners may assign `OWNER`, `MANAGER`, or
`EMPLOYEE`.

**Employee shape**: `{ id, companyId, userId, employeeNumber, firstName, middleName, lastName,
suffix, contactNumber, weeklySalary, status, createdAt, updatedAt, deletedAt, linkedUser? }` where
`linkedUser` is `{ id, email, role, status }` when an account was provisioned or access toggled.

**Grant system access body**: `{ "email", "password", "confirmPassword", "role" }`.

**Link user body**: `{ "userId": "uuid" }` (existing User only).

**Password reset**: empty body `{}`. Managers may reset Employee-role accounts only; Owners may reset
Employee, Manager, or Owner (when linked via Employee). Response includes one-time
`temporaryPassword` (plaintext returned only once; only the hash is stored). Sets
`passwordChangeRequired=true`, invalidates previous credentials, and revokes all refresh sessions.
Administrators must communicate the temporary password securely out of band. After the Employee
changes their password, the temporary password becomes invalid.

---

## 6. Branches

| Method & path                       | Roles          | Description                      |
| ----------------------------------- | -------------- | -------------------------------- |
| `GET /branches`                     | all            | Paginated list (current company) |
| `POST /branches`                    | OWNER, MANAGER | Create branch                    |
| `GET /branches/{branchId}`          | all            | Get branch                       |
| `PATCH /branches/{branchId}`        | OWNER, MANAGER | Update branch                    |
| `POST /branches/{branchId}/archive` | OWNER, MANAGER | Archive branch                   |

**List query params**: `page`, `limit`, `sortBy` (`name` \| `createdAt` \| `status`), `sortOrder`,
`search`, `status` (`ACTIVE` \| `INACTIVE`).

**Create body**: `{ "name", "address", "contactNumber", "status?" }`.

**Branch shape**: `{ id, companyId, name, address, contactNumber, status, createdAt, updatedAt,
deletedAt }`.

---

## 7. Warehouses

Same CRUD pattern as branches.

| Method & path                            | Roles          |
| ---------------------------------------- | -------------- |
| `GET /warehouses`                        | all            |
| `POST /warehouses`                       | OWNER, MANAGER |
| `GET /warehouses/{warehouseId}`          | all            |
| `PATCH /warehouses/{warehouseId}`        | OWNER, MANAGER |
| `POST /warehouses/{warehouseId}/archive` | OWNER, MANAGER |

**List query params**: same as branches. **Warehouse shape** mirrors branch fields.

---

## 8. Vehicles

| Method & path                        | Roles          |
| ------------------------------------ | -------------- |
| `GET /vehicles`                      | all            |
| `POST /vehicles`                     | OWNER, MANAGER |
| `GET /vehicles/{vehicleId}`          | all            |
| `PATCH /vehicles/{vehicleId}`        | OWNER, MANAGER |
| `POST /vehicles/{vehicleId}/archive` | OWNER, MANAGER |

**Create body**: `{ "plateNumber", "description", "status?" }` where `status` is `AVAILABLE` |
`IN_USE` | `MAINTENANCE` | `INACTIVE`.

**Vehicle shape**: `{ id, companyId, plateNumber, description, status, createdAt, updatedAt,
deletedAt }`.

---

## 9. Workforce — Attendance

| Method & path                                | Roles             | Description                                                |
| -------------------------------------------- | ----------------- | ---------------------------------------------------------- |
| `POST /workforce/attendance/time-in`         | MANAGER, EMPLOYEE | Open attendance session (linked employee profile required) |
| `POST /workforce/attendance/time-out`        | MANAGER, EMPLOYEE | Close open session                                         |
| `GET /workforce/attendance/status`           | all               | `{ isTimedIn, openSession }`                               |
| `GET /workforce/attendance`                  | all               | My attendance history (paginated)                          |
| `GET /workforce/attendance/company`          | OWNER, MANAGER    | Company attendance (paginated)                             |
| `GET /workforce/attendance/dashboard`        | OWNER, MANAGER    | All employees with today status summary                    |
| `PATCH /workforce/attendance/{attendanceId}` | OWNER, MANAGER    | Correct/manage a record                                    |

**Time-in / time-out body** (optional): `{ "note": "..." }`.

**AttendanceSession shape**: `{ id, companyId, employeeId, status, timeInAt, timeOutAt, note,
correctionNote, adjustedTimeInAt, adjustedTimeOutAt, createdAt, updatedAt }` where `status` is
`OPEN` | `CLOSED`.

**Company attendance list** items also include `firstName`, `lastName`, and `employeeNumber`.

**My history query params**: `page`, `limit`, `sortBy` (`timeInAt` \| `createdAt`), `sortOrder`,
`fromDate`, `toDate`.

**Company list** adds `employeeId` filter.

**Attendance dashboard** (`GET /workforce/attendance/dashboard`) returns per-employee quick details for
the requested `date` (defaults to today UTC): `status` (`ABSENT` | `ON_TIME` | `LATE` | `TIMED_OUT`
| `ON_LEAVE`), `isTimedIn`, `isLate`, `isAbsent`, `onLeave`, `timeInToday`, `timeOutToday`, plus a
company `summary` (`present`, `late`, `absent`, `onLeave`, `timedIn`). Late is computed against a
default 09:00 UTC start time.

> **Role rules**: Owners are exempt from time-in/out and are always operationally ready for
> transactions. Managers and employees must time in before creating transactions.

---

## 10. Workforce — Leave

| Method & path                      | Roles                    | Description                       |
| ---------------------------------- | ------------------------ | --------------------------------- |
| `POST /workforce/leave`            | OWNER, MANAGER, EMPLOYEE | Request leave (self or on behalf) |
| `GET /workforce/leave`             | all                      | My leave history (paginated)      |
| `GET /workforce/leave/company`     | OWNER, MANAGER           | Company leave records             |
| `GET /workforce/leave/dashboard`   | OWNER, MANAGER           | All employees leave summary       |
| `PATCH /workforce/leave/{leaveId}` | OWNER, MANAGER           | Approve/reject/cancel/edit        |

**Request body**:

```json
{
  "leaveType": "FULL_DAY",
  "leaveDate": "2026-07-08",
  "reason": "optional",
  "employeeId": "uuid (required for owners; optional for managers)"
}
```

`leaveType`: `HALF_DAY` | `FULL_DAY`. **Status**: `PENDING` | `APPROVED` | `REJECTED` | `CANCELLED`.

**Manage body**: `{ "status?", "managerNote?", "leaveType?", "leaveDate?", "reason?" }` — at least one field required.

**Company leave list** items include `firstName`, `lastName`, and `employeeNumber` alongside leave fields.

**Leave dashboard** (`GET /workforce/leave/dashboard`) returns per-employee pending leave counts,
today's approved leave, and company summary (`pendingRequests`, `onLeaveToday`,
`approvedThisWeek`). Owners cannot request leave for themselves; owners and managers can create leave on behalf of employees.

---

## 11. Workforce — Cash advances

| Method & path                          | Roles          | Description                    |
| -------------------------------------- | -------------- | ------------------------------ |
| `POST /workforce/cash-advances`        | OWNER, MANAGER | Issue cash advance to employee |
| `GET /workforce/cash-advances`         | EMPLOYEE       | My cash advances               |
| `GET /workforce/cash-advances/company` | OWNER, MANAGER | Company cash advances          |

**Create body**: `{ "employeeId": "uuid", "amount": 500, "reason?": "...", "issuedAt?": "ISO-8601" }`.
`issuedAt` is the business issue date shown in the UI; omit it to default to server time on create.

**CashAdvance shape**: `{ id, companyId, employeeId, amount, deductedAmount, remainingAmount,
status, reason, issuedAt, createdAt, updatedAt }` where `status` is `OUTSTANDING` | `SETTLED`.
List filters `fromDate`/`toDate` and default sort use `issuedAt`.

---

## 12. Workforce — Payroll

| Method & path                                   | Roles          | Description                                 |
| ----------------------------------------------- | -------------- | ------------------------------------------- |
| `POST /workforce/payroll`                       | OWNER, MANAGER | Generate weekly payroll batch               |
| `GET /workforce/payroll`                        | all            | Payroll history (employees see own records) |
| `GET /workforce/payroll/{payrollId}`            | all            | Single payroll record                       |
| `POST /workforce/payroll/{payrollId}/mark-paid` | OWNER, MANAGER | Mark as paid                                |

**Generate body**:

```json
{
  "payPeriodStart": "2026-07-01",
  "payPeriodEnd": "2026-07-07",
  "employeeIds": ["uuid"]
}
```

`employeeIds` is optional — omit to include all active employees.

**PayrollRecord shape**: `{ id, companyId, employeeId, payPeriodStart, payPeriodEnd, grossSalary,
cashAdvanceDeductions, netPay, status, paidAt, paymentReference, createdAt, updatedAt }` where
`status` is `PAYABLE` | `PAID`.

**Mark paid body** (optional): `{ "paymentReference": "..." }`.

---

## 13. Workforce — Dashboard

| Method & path              | Roles | Description                                |
| -------------------------- | ----- | ------------------------------------------ |
| `GET /workforce/dashboard` | all   | Operational dashboard for the current user |

Returns role-aware summaries: attendance status, recent attendance, leave, cash advances, payroll,
and visibility flags (`canTimeIn`, `canTimeOut`, `canCreateTransaction`, etc.).

---

## 14. Transactions

### Core concepts

- **Direction**: canonical `INBOUND` / `OUTBOUND`; UI labels `BUY` / `SELL`. Send either form;
  responses include both `direction` and `directionLabel`.
- **Transaction Number**: server-assigned at create, formatted as `IN-YYYYMMDD-000001` or
  `OUT-YYYYMMDD-000001`, immutable for the life of the transaction.
- **Status**: `DRAFT` → `READY_FOR_PAYMENT` → `PAID`, with `CANCELLED` as a terminal state.
- **Editability**:
  - `DRAFT`: assigned Employees, Managers, Owners
  - `READY_FOR_PAYMENT`: Managers, Owners
  - `PAID`: read-only, Owner may reopen
  - `CANCELLED`: read-only
- **Location**: `locationType` is `BRANCH` | `WAREHOUSE` | `OUTSIDE` | `TRIP` with required companion fields:
  - `BRANCH` → `branchId`
  - `WAREHOUSE` → `warehouseId`
  - `OUTSIDE` → `outsideLocationName` + `outsideAddress`
  - `TRIP` → `tripId` (assigned employees must be trip members)
- **Items**: `total` = `weight × price` (server-computed). Sending a mismatched `total` → `409`.
- **Item unit**: `KG`, `G`, `TON`, `LB`, `PIECE`, `BUNDLE`, `SACK`.
- **Archive** = soft delete. Hidden from default lists unless `includeArchived=true`.

### Data shapes

**TransactionDetail** (create/get/update/cancel/archive):

```jsonc
{
  "id": "uuid",
  "companyId": "uuid",
  "createdByUserId": "uuid",
  "transactionNumber": "IN-20260708-000001",
  "direction": "INBOUND",
  "directionLabel": "BUY",
  "status": "READY_FOR_PAYMENT",
  "partyName": "Acme Recycling",
  "partyContactNumber": "0917...",
  "transactionDate": "2026-07-08T03:00:00.000Z",
  "locationType": "OUTSIDE",
  "branchId": null,
  "warehouseId": null,
  "outsideLocationName": "Roadside",
  "outsideAddress": "123 Scrap Lane",
  "tripId": null,
  "notes": null,
  "totalAmount": 2500,
  "assignedEmployeeIds": ["uuid"],
  "submittedAt": "date-time",
  "submittedByUserId": "uuid",
  "paidAt": null,
  "paidByUserId": null,
  "cancelledByUserId": null,
  "reopenedAt": null,
  "reopenedByUserId": null,
  "reopenReason": null,
  "assignments": [{ "employeeId": "uuid", "assignedAt": "date-time" }],
  "items": [/* TransactionItem[] */],
  "attachments": [/* TransactionAttachment[] */],
  "deletedAt": null,
}
```

**TransactionSummary** (lists): same header fields + `itemCount`, `totalAmount` — no nested
`items`/`attachments`.

**TransactionItem**: `{ id, transactionId, materialName, weight, unit, price, total, notes,
createdAt, updatedAt }`.

**TransactionAttachment**: `{ id, transactionId, attachmentType, fileName, filePath, mimeType,
fileSize, uploadedByUserId, downloadUrl, createdAt }`. Use `downloadUrl` (not `filePath`) to
fetch image bytes. For `<img>` tags or opening in a new tab, append your JWT:
`{downloadUrl}?access_token={accessToken}` (same token as `Authorization: Bearer`).

### Endpoints

| Method & path                                               | Roles                        | Notes                                                                                                                        |
| ----------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `POST /transactions`                                        | all\*                        | Create draft. \*Employees need a timed-in linked profile; owners/managers may create without one (assign employees). **201** |
| `GET /transactions/by-number/{transactionNumber}`           | all\*\*                      | Lookup by business transaction number                                                                                        |
| `GET /transactions/{transactionId}`                         | all\*\*                      | Full detail                                                                                                                  |
| `PATCH /transactions/{transactionId}`                       | all\*\*                      | Partial update / auto-save. Draft for employees; draft or ready-for-payment for owner/manager                                |
| `GET /transactions`                                         | OWNER, MANAGER               | Paginated company list                                                                                                       |
| `GET /transactions/assigned`                                | all                          | Paginated list for acting employee                                                                                           |
| `POST /transactions/{id}/finish`                            | OWNER, MANAGER, EMPLOYEE\*\* | Draft → ready for payment                                                                                                    |
| `POST /transactions/{id}/return-to-draft`                   | OWNER, MANAGER               | Ready for payment → draft                                                                                                    |
| `POST /transactions/{id}/settle`                            | OWNER, MANAGER               | Ready for payment → paid                                                                                                     |
| `POST /transactions/{id}/cancel`                            | all\*\*                      | Draft/ready-for-payment → cancelled                                                                                          |
| `POST /transactions/{id}/reopen`                            | OWNER                        | Paid → ready for payment                                                                                                     |
| `GET /transactions/{id}/receipt`                            | all\*\*                      | Receipt for paid transaction only                                                                                            |
| `POST /transactions/{id}/archive`                           | OWNER, MANAGER               | Soft-delete                                                                                                                  |
| `GET /transactions/{id}/items`                              | all\*\*                      | List items                                                                                                                   |
| `POST /transactions/{id}/items`                             | all\*\*                      | Add item. **201**                                                                                                            |
| `PATCH /transactions/{id}/items/{itemId}`                   | all\*\*                      | Update item                                                                                                                  |
| `DELETE /transactions/{id}/items/{itemId}`                  | all\*\*                      | Remove item → `{ deleted: true }`                                                                                            |
| `GET /transactions/{id}/attachments`                        | all\*\*                      | List photos                                                                                                                  |
| `POST /transactions/{id}/attachments`                       | all\*\*                      | Upload photo (`multipart/form-data`, field `file`)                                                                           |
| `GET /transactions/{id}/attachments/{attachmentId}/content` | all\*\*                      | Download photo bytes (`image/jpeg`, `image/png`, or `image/webp`)                                                            |
| `DELETE /transactions/{id}/attachments/{attachmentId}`      | all\*\*                      | Remove photo                                                                                                                 |
| `GET /transactions/suggestions/materials`                   | all                          | Material autocomplete                                                                                                        |
| `GET /transactions/suggestions/prices`                      | all                          | Price autocomplete for a material                                                                                            |

\*\* Employees must be assigned to the transaction (else `403`). Owners and managers may finish any company draft.

**Create body** (`OUTSIDE`):

```jsonc
{
  "direction": "BUY",
  "partyName": "Acme Recycling",
  "locationType": "OUTSIDE",
  "outsideLocationName": "Roadside",
  "outsideAddress": "123 Scrap Lane",
  "assignedEmployeeIds": ["uuid"],
  "items": [{ "materialName": "Copper", "weight": 10, "unit": "KG", "price": 250 }],
}
```

`items` may be `[]` or omitted when creating a draft; add lines later via `POST /transactions/{id}/items`. Finish rejects drafts with zero items.

**Create body** (`TRIP` — link transaction to a trip):

```jsonc
{
  "direction": "BUY",
  "partyName": "Acme Recycling",
  "locationType": "TRIP",
  "tripId": "65ef6c96-5edd-44e7-9bb6-ae0cafa1e552",
  "assignedEmployeeIds": ["uuid"],
  "items": [{ "materialName": "Copper", "weight": 10, "unit": "KG", "price": 250 }],
}
```

`tripId` is only accepted when `locationType` is `TRIP`. For `BRANCH`, `WAREHOUSE`, and `OUTSIDE`, omit `tripId` (or send `null` on update). For `TRIP`, `outsideLocationName` and `outsideAddress` are not used.

**TRIP validation errors**:

| HTTP | When                                                                      |
| ---- | ------------------------------------------------------------------------- |
| 400  | `tripId` missing for `TRIP`, or `tripId` sent with another `locationType` |
| 404  | `tripId` not found in company                                             |
| 409  | Assigned employee is not a trip member                                    |

**List query params**: `page`, `limit`, `sortBy` (`transactionDate` \| `createdAt` \| `status`),
`sortOrder`, `search`, `transactionNumber`, `direction`, `status`, `locationType` (`BRANCH` \| `WAREHOUSE` \| `OUTSIDE` \| `TRIP`), `branchId`,
`warehouseId`, `tripId`, `fromDate`, `toDate`, `includeArchived`.

**Settlement actions**:

- `POST /transactions/{id}/finish`: no body required; sets `status=READY_FOR_PAYMENT`,
  `submittedAt`, `submittedByUserId`.
- `POST /transactions/{id}/return-to-draft`: optional `{ "reason": "..." }`.
- `POST /transactions/{id}/settle`: optional `{ "settlementNote": "..." }`; sets `status=PAID`,
  `paidAt`, `paidByUserId`.
- `POST /transactions/{id}/reopen`: required `{ "reason": "..." }`; clears `paidAt` and
  `paidByUserId`, then returns to `READY_FOR_PAYMENT`.
- `GET /transactions/{id}/receipt`: returns `{ transactionNumber, company, direction,
directionLabel, partyName, transactionDate, items, grandTotal, paidByDisplayName, paidAt }`.

**Photo limits**: max 20 per transaction; `image/jpeg`, `image/png`, `image/webp`; max 5 MB.

**Suggestions**:

- `GET /transactions/suggestions/materials?q=&limit=10` →
  `[{ materialName, lastUsedAt, usageCount }]`
- `GET /transactions/suggestions/prices?materialName=Copper&limit=10` →
  `[{ price, lastUsedAt }]`

---

## 15. Trip Management

Trip Management (`/api/v1/trips`) coordinates employees and vehicles for operational work outside company locations.

**Trip Number** is server-assigned and immutable: `TRIP-YYYYMMDD-000001`.

**Implementation status**: `GET /trips`, `GET /trips/dashboard`, `POST /trips`, `GET /trips/{tripId}`, `GET /trips/{tripId}/transactions`, and `GET /trips/{tripId}/history` are live. All other endpoints in the table below are specified in P007 but not yet implemented — they will return **404** until that work ships.

### `GET /trips` — company trip list

**Roles**: Owner, Manager. **Employee** receives **403**.

Paginated trip summaries for the authenticated company. `data` is an array of trip rows; pagination is in `meta`.

#### Query parameters

| Parameter         | Type    | Default          | Notes                                                                                                      |
| ----------------- | ------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `page`            | integer | `1`              | 1-based page number                                                                                        |
| `limit`           | integer | `20`             | Page size (1–100)                                                                                          |
| `sortBy`          | string  | `scheduledStart` | `scheduledStart`, `createdAt`, or `tripNumber` (`scheduledStartAt` accepted as alias for `scheduledStart`) |
| `sortOrder`       | enum    | `desc`           | `asc` or `desc`                                                                                            |
| `status`          | enum    | —                | `DRAFT`, `STARTED`, `COMPLETED`, `CANCELLED`                                                               |
| `vehicleId`       | uuid    | —                | Filter by vehicle                                                                                          |
| `employeeId`      | uuid    | —                | Filter by assigned member                                                                                  |
| `fromDate`        | date    | —                | Inclusive scheduled-start lower bound                                                                      |
| `toDate`          | date    | —                | Inclusive scheduled-start upper bound                                                                      |
| `tripNumber`      | string  | —                | Partial match on trip number                                                                               |
| `includeArchived` | boolean | `false`          | Include soft-deleted trips                                                                                 |

#### Example

```http
GET /api/v1/trips?page=1&limit=10&sortBy=scheduledStart&sortOrder=desc
```

#### Response row (`TripSummary`)

Each item in `data` includes: `id`, `companyId`, `tripNumber`, `status`, `scheduledStart`, `actualStart`, `actualEnd`, `origin`, `destination`, `notes`, and nested `vehicle` (`id`, `plateNumber`, `description`, `status`).

---

### `GET /trips/dashboard` — status counts

**Roles**: Owner, Manager. **Employee** receives **403**.

Returns aggregate trip counts for the company (non-archived trips only).

#### Response (`data`)

| Field            | Type    | Meaning                                                                  |
| ---------------- | ------- | ------------------------------------------------------------------------ |
| `draftCount`     | integer | `DRAFT` trips with `scheduledStart` today or in the past (ready/overdue) |
| `scheduledCount` | integer | `DRAFT` trips with `scheduledStart` in the future (upcoming)             |
| `startedCount`   | integer | `STARTED` trips                                                          |
| `completedCount` | integer | `COMPLETED` trips                                                        |
| `cancelledCount` | integer | `CANCELLED` trips                                                        |

#### Example

```json
{
  "success": true,
  "data": {
    "draftCount": 3,
    "scheduledCount": 2,
    "startedCount": 1,
    "completedCount": 10,
    "cancelledCount": 0
  },
  "meta": {},
  "error": null
}
```

---

### `POST /trips` — create Draft trip

**Roles**: Owner, Manager. **Employee** receives **403**.

Creates a new trip in `DRAFT` status with a server-assigned Trip Number.

#### Request body

| Field            | Type    | Required | Notes                                                              |
| ---------------- | ------- | -------- | ------------------------------------------------------------------ |
| `vehicleId`      | uuid    | yes      | Must be an available company vehicle                               |
| `scheduledStart` | ISO8601 | yes      | Planned departure time                                             |
| `origin`         | string  | yes      | Max 500 characters                                                 |
| `destination`    | string  | yes      | Max 500 characters                                                 |
| `notes`          | string  | no       | Max 2000 characters                                                |
| `members`        | array   | no       | `{ employeeId, role }` — `DRIVER`, `HELPER`, `BUYER`, `SUPERVISOR` |

#### Response

**201** with `TripDetail` in `data` (includes `tripNumber`, `vehicle`, `members`, etc.).

---

### `GET /trips/{tripId}` — trip detail

**Roles**: Owner, Manager (any company trip); Employee (assigned members only).

Returns full trip detail including members and `linkedTransactionCount`.

#### Response (`TripDetail`)

Includes trip header fields, nested `vehicle`, `members` array, `linkedTransactionCount`, `createdAt`, and `updatedAt`.

#### Errors

| Status | When                                        |
| ------ | ------------------------------------------- |
| `404`  | Trip not found or archived (unless exposed) |
| `403`  | Employee not assigned to the trip           |

---

### `GET /trips/{tripId}/transactions` — linked transactions

**Roles**: Owner, Manager (any company trip); Employee (assigned members only).

Returns paginated `TransactionSummary` rows where `tripId` matches the trip. Linking is stored on the transaction (`locationType: TRIP` + `tripId`).

#### Query parameters

| Parameter         | Type    | Default           | Notes                                    |
| ----------------- | ------- | ----------------- | ---------------------------------------- |
| `page`            | integer | `1`               | 1-based page number                      |
| `limit`           | integer | `20`              | Page size (1–100)                        |
| `sortBy`          | string  | `transactionDate` | `transactionDate`, `createdAt`, `status` |
| `sortOrder`       | enum    | `desc`            | `asc` or `desc`                          |
| `includeArchived` | boolean | `false`           | Include soft-deleted transactions        |

**Fallback**: `GET /transactions?tripId={tripId}&locationType=TRIP` (Owner/Manager only) returns the same filter for company transaction lists.

---

### `GET /trips/{tripId}/history` — lifecycle history

**Roles**: Owner, Manager (any company trip); Employee (assigned members only).

Returns a chronological list of lifecycle events derived from the trip record (`CREATED`, `STARTED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`). This is not a full audit log; member changes are not included yet.

#### Response (`data`)

```jsonc
{
  "tripId": "uuid",
  "events": [
    {
      "action": "CREATED",
      "occurredAt": "2026-07-09T08:00:00.000Z",
      "actorUserId": "uuid",
      "note": null,
    },
  ],
}
```

---

### All endpoints (spec)

| Method & path                               | Roles                    | Status / notes                              |
| ------------------------------------------- | ------------------------ | ------------------------------------------- |
| `GET /trips`                                | OWNER, MANAGER           | **Live** — paginated company list           |
| `GET /trips/dashboard`                      | OWNER, MANAGER           | **Live** — status count summary             |
| `POST /trips`                               | OWNER, MANAGER           | **Live** — create Draft trip (**201**)      |
| `GET /trips/{tripId}`                       | OWNER, MANAGER, EMPLOYEE | **Live** — Employee restricted to assigned  |
| `GET /trips/{tripId}/transactions`          | OWNER, MANAGER, EMPLOYEE | **Live** — transactions linked via `tripId` |
| `GET /trips/{tripId}/history`               | OWNER, MANAGER, EMPLOYEE | **Live** — lifecycle event timeline         |
| `PATCH /trips/{tripId}`                     | OWNER, MANAGER           | Planned — Draft-only header edits           |
| `GET /trips/mine`                           | EMPLOYEE                 | Planned — assigned trips                    |
| `GET /trips/by-number/{tripNumber}`         | OWNER, MANAGER, EMPLOYEE | Planned — lookup by trip number             |
| `POST /trips/{tripId}/start`                | OWNER, MANAGER           | Planned — Draft → Started                   |
| `POST /trips/{tripId}/complete`             | OWNER, MANAGER           | Planned — Started → Completed               |
| `POST /trips/{tripId}/cancel`               | OWNER, MANAGER           | Planned — Draft → Cancelled                 |
| `POST /trips/{tripId}/archive`              | OWNER, MANAGER           | Planned — archive Completed/Cancelled       |
| `POST /trips/{tripId}/members`              | OWNER, MANAGER           | Planned — add member                        |
| `PATCH /trips/{tripId}/members/{memberId}`  | OWNER, MANAGER           | Planned — update member role                |
| `DELETE /trips/{tripId}/members/{memberId}` | OWNER, MANAGER           | Planned — remove member                     |

---

## 16. Analytics

Read-only analytics dashboards under `/api/v1/analytics/*` for **Owner** and **Manager** roles. **Employee** receives **403**.

All endpoints share the same query parameters and return `appliedFilters` plus `generatedAt` in the response envelope.

### Shared query parameters

| Parameter         | Type    | Default      | Notes                                                                  |
| ----------------- | ------- | ------------ | ---------------------------------------------------------------------- |
| `period`          | enum    | `THIS_MONTH` | `TODAY`, `YESTERDAY`, `THIS_WEEK`, `THIS_MONTH`, `THIS_YEAR`, `CUSTOM` |
| `from`            | ISO8601 | —            | Required when `period=CUSTOM`                                          |
| `to`              | ISO8601 | —            | Required when `period=CUSTOM`; max 366-day span                        |
| `branchId`        | uuid    | —            | Tenant-scoped branch filter                                            |
| `warehouseId`     | uuid    | —            | Tenant-scoped warehouse filter                                         |
| `vehicleId`       | uuid    | —            | Tenant-scoped vehicle filter                                           |
| `employeeId`      | uuid    | —            | Tenant-scoped employee filter                                          |
| `includeArchived` | boolean | `false`      | Include soft-deleted operational records                               |
| `limit`           | integer | `10`         | Ranking list size (1–25)                                               |

### Endpoints

| Method & path                 | Roles          | Response highlights                                                                                                     |
| ----------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `GET /analytics/company`      | OWNER, MANAGER | Inbound/outbound counts, transaction amount, expenses, payroll, net operational amount, active employees/trips/vehicles |
| `GET /analytics/transactions` | OWNER, MANAGER | Transaction counts, totals, average value, top materials, most active employees/branches/warehouses                     |
| `GET /analytics/trips`        | OWNER, MANAGER | Trip totals, duration, vehicle utilization, active vehicles/drivers                                                     |
| `GET /analytics/expenses`     | OWNER, MANAGER | Expense totals and breakdowns (zeros until expense module is live)                                                      |
| `GET /analytics/workforce`    | OWNER, MANAGER | Attendance, payroll, leave, and cash-advance summaries                                                                  |
| `GET /analytics/organization` | OWNER, MANAGER | Branch/warehouse performance and vehicle utilization                                                                    |

**Net operational amount** = `totalTransactionAmount - totalExpenses - totalPayroll`.

Cancelled transactions are excluded. Archived records are excluded unless `includeArchived=true`.

---

## 17. Reports

Read-only operational detail reports under `/api/v1/reports/*` for **Owner** and **Manager** roles. **Employee** receives **403**.

List endpoints return paginated rows in `data` with `appliedCriteria`, `generatedAt`, and pagination in `meta`. Export endpoints stream CSV, Excel, or PDF files using the same filters as the list view.

### Shared query parameters (list endpoints)

| Parameter         | Type    | Default | Notes                                                     |
| ----------------- | ------- | ------- | --------------------------------------------------------- |
| `from`            | ISO8601 | —       | Required for date-bound reports; optional for org reports |
| `to`              | ISO8601 | —       | Required for date-bound reports; max 366-day span         |
| `branchId`        | uuid    | —       | Tenant-scoped branch filter                               |
| `warehouseId`     | uuid    | —       | Tenant-scoped warehouse filter                            |
| `vehicleId`       | uuid    | —       | Tenant-scoped vehicle filter                              |
| `employeeId`      | uuid    | —       | Tenant-scoped employee filter                             |
| `tripId`          | uuid    | —       | Trip/expense filter                                       |
| `includeArchived` | boolean | `false` | Include soft-deleted operational records                  |
| `search`          | string  | —       | Optional; minimum 2 characters when provided              |
| `page`            | integer | `1`     | 1-based page number                                       |
| `limit`           | integer | `20`    | Page size (1–100)                                         |
| `sortBy`          | string  | —       | Allowlisted per report (see Swagger)                      |
| `sortOrder`       | enum    | `desc`  | `asc` or `desc`                                           |

### Export query parameters

Same as list, plus:

| Parameter     | Type | Default      | Notes                                       |
| ------------- | ---- | ------------ | ------------------------------------------- |
| `format`      | enum | —            | `csv`, `xlsx`, or `pdf` (required)          |
| `disposition` | enum | `attachment` | `attachment` download or `inline` for print |

Export is capped at **10,000 rows**; requests exceeding the limit return **422**.

### List endpoints

| Method & path                | Roles          | Description                                      |
| ---------------------------- | -------------- | ------------------------------------------------ |
| `GET /reports/transactions`  | OWNER, MANAGER | Transaction audit rows with items and settlement |
| `GET /reports/trips`         | OWNER, MANAGER | Trip rows with vehicle, members, schedule        |
| `GET /reports/expenses`      | OWNER, MANAGER | Expense rows (empty until expense module live)   |
| `GET /reports/attendance`    | OWNER, MANAGER | Attendance session rows                          |
| `GET /reports/leave`         | OWNER, MANAGER | Leave record rows                                |
| `GET /reports/cash-advances` | OWNER, MANAGER | Cash advance issuance rows                       |
| `GET /reports/payroll`       | OWNER, MANAGER | Payroll period rows                              |
| `GET /reports/employees`     | OWNER, MANAGER | Employee profile rows                            |
| `GET /reports/branches`      | OWNER, MANAGER | Branch registry rows                             |
| `GET /reports/warehouses`    | OWNER, MANAGER | Warehouse registry rows                          |
| `GET /reports/vehicles`      | OWNER, MANAGER | Vehicle registry rows                            |

### Export endpoints

| Method & path                       | Roles          | Description                |
| ----------------------------------- | -------------- | -------------------------- |
| `GET /reports/transactions/export`  | OWNER, MANAGER | Export transaction report  |
| `GET /reports/trips/export`         | OWNER, MANAGER | Export trip report         |
| `GET /reports/expenses/export`      | OWNER, MANAGER | Export expense report      |
| `GET /reports/attendance/export`    | OWNER, MANAGER | Export attendance report   |
| `GET /reports/leave/export`         | OWNER, MANAGER | Export leave report        |
| `GET /reports/cash-advances/export` | OWNER, MANAGER | Export cash advance report |
| `GET /reports/payroll/export`       | OWNER, MANAGER | Export payroll report      |
| `GET /reports/employees/export`     | OWNER, MANAGER | Export employee report     |
| `GET /reports/branches/export`      | OWNER, MANAGER | Export branch report       |
| `GET /reports/warehouses/export`    | OWNER, MANAGER | Export warehouse report    |
| `GET /reports/vehicles/export`      | OWNER, MANAGER | Export vehicle report      |

Reports are **read-only** — no mutations. All monetary values are PHP with 2 decimal places.

---

## 18. Expense Management

Operational expenses are tracked independently from transactions. Each expense receives an immutable
`EXP-YYYYMMDD-000001` number. Employees create drafts when timed in; managers and owners oversee
company-wide expenses.

### Roles

| Action                                       | Owner | Manager | Employee       |
| -------------------------------------------- | ----- | ------- | -------------- |
| Create expense                               | Yes   | Yes     | Yes (timed in) |
| List company (`GET /expenses`)               | Yes   | Yes     | No             |
| List own (`GET /expenses/mine`)              | Yes*  | Yes*    | Yes            |
| View detail / by number                      | Yes   | Yes     | Own only       |
| Edit draft                                   | Yes   | Yes     | Own only       |
| Edit recorded                                | Yes   | Yes     | No             |
| Record draft                                 | Yes   | Yes     | Own only       |
| Cancel draft                                 | Yes   | Yes     | Own only       |
| Cancel recorded                              | Yes   | Yes     | No             |
| Manage attachments                           | Yes   | Yes     | Own draft only |
| List categories (`GET /expenses/categories`) | Yes   | Yes     | Yes            |
| Archive                                      | Yes   | Yes     | No             |

\*When linked to an employee profile.

**ExpenseAttachment**: `{ id, expenseId, attachmentType, fileName, mimeType, fileSize,
uploadedByUserId, downloadUrl, createdAt }`. Use `downloadUrl` to fetch image bytes. For `<img>`
tags or opening in a new tab, append your JWT: `{downloadUrl}?access_token={accessToken}` (same
token as `Authorization: Bearer`).

**Expense categories** are stored per company in `ExpenseCategory`. The seed script inserts nine
defaults (Fuel, Maintenance, Supplies, Travel, Meals, Utilities, Rent, Salaries, Other). New
companies created outside seed do not get categories automatically yet — `GET /expenses/categories`
falls back to the same default list when the catalog is empty.

`GET /expenses/categories` response:

```json
{
  "success": true,
  "data": [
    "Fuel",
    "Maintenance",
    "Supplies",
    "Travel",
    "Meals",
    "Utilities",
    "Rent",
    "Salaries",
    "Other"
  ],
  "meta": {},
  "error": null
}
```

### Endpoints

| Endpoint                                                   | Method | Purpose                                                                                                                 |
| ---------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `/expenses`                                                | POST   | Create draft (or recorded if manager/owner + `recordImmediately`)                                                       |
| `/expenses`                                                | GET    | Company list with filters (manager/owner)                                                                               |
| `/expenses/mine`                                           | GET    | Employee own list                                                                                                       |
| `/expenses/categories`                                     | GET    | Company category catalog (seeded defaults + custom values used on expenses)                                             |
| `/expenses/by-number/{expenseNumber}`                      | GET    | Lookup by expense number                                                                                                |
| `/expenses/{expenseId}`                                    | GET    | Detail with attachments                                                                                                 |
| `/expenses/{expenseId}`                                    | PATCH  | Update header/context                                                                                                   |
| `/expenses/{expenseId}/record`                             | POST   | Draft → Recorded                                                                                                        |
| `/expenses/{expenseId}/cancel`                             | POST   | Draft/Recorded → Cancelled (reason required)                                                                            |
| `/expenses/{expenseId}/archive`                            | POST   | Soft archive (recorded/cancelled, manager/owner)                                                                        |
| `/expenses/{expenseId}/attachments`                        | POST   | Upload receipt photo (`multipart/form-data`, field `file`)                                                              |
| `/expenses/{expenseId}/attachments`                        | GET    | List attachment metadata                                                                                                |
| `/expenses/{expenseId}/attachments/{attachmentId}`         | DELETE | Remove attachment (**204** No Content)                                                                                  |
| `/expenses/{expenseId}/attachments/{attachmentId}/content` | GET    | Download photo bytes (`image/jpeg`, `image/png`, or `image/webp`); supports `?access_token=` for browser image requests |

### List query parameters

`page`, `limit`, `sortBy` (`expenseDate`, `createdAt`, `expenseNumber`, `amount`), `sortOrder`
(default `expenseDate desc` for managers), `status`, `category`, `contextType`, `branchId`,
`warehouseId`, `vehicleId`, `tripId`, `employeeId`, `fromDate`, `toDate`, `expenseNumber`, `search`
(min 2 chars), `includeArchived`.

### Context types

`COMPANY` (no FK), `BRANCH` (`branchId`), `WAREHOUSE` (`warehouseId`), `VEHICLE` (`vehicleId`),
`TRIP` (`tripId` — only started or completed trips).

---

## 19. Company Subscriptions

Super Admin management of company subscription periods and operational entitlement status.
Online billing is out of scope.

**Company.subscriptionStatus** (operational gate): `TRIAL`, `ACTIVE`, `GRACE_PERIOD`, `EXPIRED`, `SUSPENDED`.
Default for new companies: `TRIAL`.

**Login entitlement**: Tenant users may log in only when `subscriptionStatus` is `TRIAL`, `ACTIVE`, or
`GRACE_PERIOD`. `EXPIRED` / `SUSPENDED` returns `409` with code `SUBSCRIPTION_INACTIVE`.
`SUPER_ADMIN` bypasses the subscription gate on `POST /admin/auth/login`. Tenant `POST /auth/login` rejects `SUPER_ADMIN` with `INVALID_CREDENTIALS`.

**Cascade**: Allowed statuses set Company + all Users to `ACTIVE`. Blocked statuses set Company + all
Users to `INACTIVE` and revoke refresh sessions.

### Admin endpoints (SUPER_ADMIN only)

| Path                                                          | Method | Purpose                        |
| ------------------------------------------------------------- | ------ | ------------------------------ |
| `/admin/companies/{companyId}/subscriptions`                  | POST   | Create subscription period     |
| `/admin/companies/{companyId}/subscriptions/renew`            | POST   | Renew (prior ACTIVE → EXPIRED) |
| `/admin/companies/{companyId}/subscriptions/expire`           | POST   | Expire entitlement             |
| `/admin/companies/{companyId}/subscriptions/suspend`          | POST   | Suspend access                 |
| `/admin/companies/{companyId}/subscriptions`                  | GET    | Paginated history              |
| `/admin/companies/{companyId}/subscriptions/{subscriptionId}` | GET    | Period detail                  |
| `/admin/companies/{companyId}/subscription-status`            | GET    | Current operational status     |

Admin routes require JWT authentication only (no company-resolution middleware). Super Admin may
target any `{companyId}` in the path.

### Tenant read-only

| Path                                | Method | Auth                           |
| ----------------------------------- | ------ | ------------------------------ |
| `/companies/me/subscription-status` | GET    | All tenant roles + Super Admin |

### Activity Log actions

`subscription.created`, `subscription.renewed`, `subscription.expired`, `subscription.suspended`

---

## 20. Admin supervision

Platform `SUPER_ADMIN` APIs under `/api/v1/admin/...` (JWT required; no tenant company-resolution middleware). Login via `POST /admin/auth/login`.

### Companies and accounts

Company must exist before accounts can be created. Prefer: create company → add one or more Employee+User accounts.

| Path                                    | Method | Purpose                                                     |
| --------------------------------------- | ------ | ----------------------------------------------------------- |
| `/admin/companies`                      | POST   | Create company only (default `subscriptionStatus=TRIAL`)    |
| `/admin/companies`                      | GET    | Paginated company list                                      |
| `/admin/companies/{companyId}`          | GET    | Company detail (includes `subscriptionStatus`)              |
| `/admin/companies/{companyId}/accounts` | POST   | Create Employee + User (`OWNER` \| `MANAGER` \| `EMPLOYEE`) |

Account body:

```json
{
  "firstName": "Ada",
  "lastName": "Owner",
  "weeklySalary": 0,
  "account": {
    "email": "owner@tenant.test",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "OWNER"
  }
}
```

### Analytics

Dedicated admin analytics (does **not** reuse tenant `/analytics/*`).

| Path                                                  | Method | Purpose                             |
| ----------------------------------------------------- | ------ | ----------------------------------- |
| `/admin/analytics/overview`                           | GET    | Portfolio metrics for all companies |
| `/admin/analytics/companies/{companyId}/company`      | GET    | Company dashboard for a tenant      |
| `/admin/analytics/companies/{companyId}/transactions` | GET    | Transactions analytics              |
| `/admin/analytics/companies/{companyId}/trips`        | GET    | Trips analytics                     |
| `/admin/analytics/companies/{companyId}/expenses`     | GET    | Expenses analytics                  |
| `/admin/analytics/companies/{companyId}/workforce`    | GET    | Workforce analytics                 |
| `/admin/analytics/companies/{companyId}/organization` | GET    | Organization analytics              |

Query params match tenant analytics (`period`, `from`/`to`, dimensions, `includeArchived`, `limit`).

### Activity Log actions

`admin.company_created`, `admin.account_created`

---

## 21. Activity Logs

Append-only company audit trail. Entries are created automatically by the API when business
operations succeed. Clients **cannot** create, update, or delete activity logs.

**Auth**: Owner and Manager only. Employees receive `403`.

| Path                             | Method | Notes                                   |
| -------------------------------- | ------ | --------------------------------------- |
| `/activity-logs`                 | GET    | Paginated list with search/filter/sort  |
| `/activity-logs/{activityLogId}` | GET    | Single entry; other-company ids → `404` |

### List query parameters

| Param                | Notes                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `page`, `limit`      | Defaults `1` / `20` (max 100)                                                                                                          |
| `sortBy`             | `createdAt` (default), `module`, `user`                                                                                                |
| `sortOrder`          | `asc` / `desc` (default `desc`)                                                                                                        |
| `q` + `searchBy`     | Search text; `searchBy` required when `q` is set: `employeeName`, `transactionNumber`, `tripNumber`, `expenseNumber`, `user`, `action` |
| `module`             | e.g. `auth`, `employee`, `transaction`, `trip`, `expense`, …                                                                           |
| `action`             | Exact action string (e.g. `transaction.settled`)                                                                                       |
| `userId`             | Actor user UUID                                                                                                                        |
| `eventType`          | `AUTHENTICATION`, `COMPANY`, `EMPLOYEE`, `ORGANIZATION`, `TRANSACTION`, `TRIP`, `EXPENSE`, `WORKFORCE`                                 |
| `dateFrom`, `dateTo` | ISO date-time range on `createdAt`                                                                                                     |

### Response shape (item)

`id`, `companyId`, `eventType`, `module`, `action`, `description`, `userId` (actor account),
optional `employeeId` (actor’s linked employee when present), optional
`resourceType` / `resourceId` / `resourceNumber` / `ipAddress` / `userAgent` / `metadata`,
`createdAt`, and `performedBy` (`id`, `employeeId`, `email`, `role`). Password-related
metadata never includes secrets.

---

## 22. Typical frontend flows

### App bootstrap (after login)

1. `POST /auth/login` → store `accessToken` + `refreshToken`.
2. `GET /users/me` → resolve `role`, `employeeId`.
3. `GET /companies/me` → company profile for header/settings.
4. If employee: `GET /employees/me` → employee profile.
5. `GET /workforce/dashboard` → home screen data + visibility flags.
6. Load reference data as needed: `GET /branches`, `/warehouses`, `/vehicles`, `/employees`.

### Employee transaction flow

1. `POST /workforce/attendance/time-in` (required).
2. `POST /transactions` with header + items + assigned employees.
3. Auto-save via `PATCH /transactions/{id}`.
4. Manage items and upload photos.
5. Use suggestion endpoints for autocomplete.
6. `POST /transactions/{id}/finish` when operational entry is complete.

### Settlement flow

1. Employee finishes draft via `POST /transactions/{id}/finish`.
2. Manager/Owner reviews queue via `GET /transactions?status=READY_FOR_PAYMENT`.
3. Optional correction path:
   - manager/owner `PATCH /transactions/{id}`
   - or `POST /transactions/{id}/return-to-draft`
4. Finalize via `POST /transactions/{id}/settle`.
5. Retrieve artifact with `GET /transactions/{id}/receipt`.
6. If settlement was wrong, Owner may `POST /transactions/{id}/reopen` and re-settle.

### Manager operations

- Org setup: branches, warehouses, vehicles, employees.
- Workforce: approve leave, manage attendance, issue cash advances, generate/mark payroll.
- Transactions: `GET /transactions` with filters, search by `transactionNumber`, settle submitted
  transactions, reopen incorrect paid transactions, and retrieve receipts.

### Seed accounts (development)

After `pnpm run db:seed`:

| Email                   | Role     | Password      | Notes                                      |
| ----------------------- | -------- | ------------- | ------------------------------------------ |
| `owner@example.com`     | OWNER    | `password123` | No employee link; time-in not required     |
| `manager@example.com`   | MANAGER  | `password123` | Linked to employee `EMP-MGR` (can time in) |
| `employee1@example.com` | EMPLOYEE | `password123` | Linked to `EMP-001`                        |
| `employee2@example.com` | EMPLOYEE | `password123` | Linked to `EMP-002`                        |
| `employee3@example.com` | EMPLOYEE | `password123` | Linked to `EMP-003`                        |

### Create a blank real company (no demo data)

Use this instead of `db:seed` when onboarding a client:

```bash
pnpm run db:create-company -- \
  --name "Acme Recycling" \
  --owner-email owner@acme.com \
  --owner-password 'SecurePass123' \
  --contact 09171234567 \
  --email office@acme.com \
  --address "Quezon City"
```

Creates only: company + OWNER user + default expense categories. The client then adds
employees/branches/etc. in the app.

### Production seed (once-only, no deletes)

Creates 1 company + 5 accounts (owner, manager, 3 employees) + expense categories.
Safe to re-run: if the company name already exists, it skips.

```bash
pnpm run db:seed:prod -- \
  --name "Acme Recycling" \
  --password 'SecurePass123' \
  --email-domain acme.com
```

On Railway (after deploy):

```bash
pnpm run db:seed:prod -- --name "Acme Recycling" --password 'SecurePass123' --email-domain acme.com
```

Do **not** run `pnpm run db:seed` in production — that script wipes all data.

### Disable / re-enable a non-paying company (no delete)

```bash
# Stop access — keeps all data
pnpm run db:disable-company -- --name "Acme Recycling"
# or
pnpm run db:disable-company -- --id <company-uuid>

# Restore access later
pnpm run db:enable-company -- --name "Acme Recycling"
```

Disable sets company + all users to `INACTIVE` and revokes refresh sessions.
Enable sets them back to `ACTIVE`. Nothing is deleted.
