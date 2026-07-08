# Scrappy API Reference

Frontend integration reference for the Scrappy API. All authenticated routes are **tenant-scoped**:
the access token carries the user's `companyId`, and every request only ever sees that company's data.

- **Base URL**: `http://localhost:3000` (dev) — all paths prefixed with `/api/v1`
- **Auth**: JWT Bearer token in the `Authorization` header
- **Content-Type**: `application/json` (except photo upload → `multipart/form-data`)
- **Interactive docs**: Swagger UI at `GET /docs` when the server is running

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
15. [Typical frontend flows](#15-typical-frontend-flows)

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
  "user": { "id": "uuid", "email": "owner@example.com", "role": "OWNER" }
}
```

Send on every authenticated request:

```
Authorization: Bearer <accessToken>
```

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

| Endpoint                   | Roles | Returns                                                                   |
| -------------------------- | ----- | ------------------------------------------------------------------------- |
| `GET /api/v1/users/me`     | all   | Current user (`id`, `companyId`, `email`, `role`, `status`, `employeeId`) |
| `GET /api/v1/companies/me` | all   | Current user's company                                                    |
| `GET /api/v1/employees`    | all   | Active employees of the current company                                   |
| `GET /api/v1/employees/me` | all   | Employee profile linked to the current user (`404` if none)               |

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

| Method & path   | Roles | Description                |
| --------------- | ----- | -------------------------- |
| `GET /users/me` | all   | Current authenticated user |

**CurrentUser shape**: `{ id, companyId, employeeId, email, role, status, lastLoginAt }`.

---

## 5. Employees

| Method & path                            | Roles          | Description                            |
| ---------------------------------------- | -------------- | -------------------------------------- |
| `GET /employees/me`                      | all            | Current user's linked employee profile |
| `GET /employees`                         | all            | Active employees (for pickers)         |
| `POST /employees`                        | OWNER, MANAGER | Create employee                        |
| `GET /employees/{employeeId}`            | OWNER, MANAGER | Get employee by id                     |
| `PATCH /employees/{employeeId}`          | OWNER, MANAGER | Update employee                        |
| `POST /employees/{employeeId}/archive`   | OWNER, MANAGER | Soft-delete employee                   |
| `POST /employees/{employeeId}/user-link` | OWNER, MANAGER | Link employee to a user account        |

**Create body**:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "weeklySalary": 3500,
  "employeeNumber": "EMP-001",
  "contactNumber": "0917...",
  "status": "ACTIVE"
}
```

**Employee shape**: `{ id, companyId, userId, employeeNumber, firstName, middleName, lastName,
suffix, contactNumber, weeklySalary, status, createdAt, updatedAt, deletedAt }`.

**Link user body**: `{ "userId": "uuid" }`.

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

| Method & path                                | Roles          | Description                                        |
| -------------------------------------------- | -------------- | -------------------------------------------------- |
| `POST /workforce/attendance/time-in`         | all            | Open attendance session (linked employee required) |
| `POST /workforce/attendance/time-out`        | all            | Close open session                                 |
| `GET /workforce/attendance/status`           | all            | `{ isTimedIn, openSession }`                       |
| `GET /workforce/attendance`                  | all            | My attendance history (paginated)                  |
| `GET /workforce/attendance/company`          | OWNER, MANAGER | Company attendance (paginated)                     |
| `PATCH /workforce/attendance/{attendanceId}` | OWNER, MANAGER | Correct/manage a record                            |

**Time-in / time-out body** (optional): `{ "note": "..." }`.

**AttendanceSession shape**: `{ id, companyId, employeeId, status, timeInAt, timeOutAt, note,
correctionNote, adjustedTimeInAt, adjustedTimeOutAt, createdAt, updatedAt }` where `status` is
`OPEN` | `CLOSED`.

**My history query params**: `page`, `limit`, `sortBy` (`timeInAt` \| `createdAt`), `sortOrder`,
`fromDate`, `toDate`.

**Company list** adds `employeeId` filter.

> **Required before creating transactions**: the acting user must be a linked employee who is
> currently timed in (`isTimedIn: true`), otherwise transaction create returns `409`.

---

## 10. Workforce — Leave

| Method & path                      | Roles          | Description                     |
| ---------------------------------- | -------------- | ------------------------------- |
| `POST /workforce/leave`            | all            | Request leave (linked employee) |
| `GET /workforce/leave`             | all            | My leave history (paginated)    |
| `GET /workforce/leave/company`     | OWNER, MANAGER | Company leave records           |
| `PATCH /workforce/leave/{leaveId}` | OWNER, MANAGER | Approve/reject/cancel           |

**Request body**:

```json
{ "leaveType": "FULL_DAY", "leaveDate": "2026-07-08", "reason": "optional" }
```

`leaveType`: `HALF_DAY` | `FULL_DAY`. **Status**: `PENDING` | `APPROVED` | `REJECTED` | `CANCELLED`.

**Manage body**: `{ "status", "managerNote?" }`.

---

## 11. Workforce — Cash advances

| Method & path                          | Roles          | Description                    |
| -------------------------------------- | -------------- | ------------------------------ |
| `POST /workforce/cash-advances`        | OWNER, MANAGER | Issue cash advance to employee |
| `GET /workforce/cash-advances`         | EMPLOYEE       | My cash advances               |
| `GET /workforce/cash-advances/company` | OWNER, MANAGER | Company cash advances          |

**Create body**: `{ "employeeId": "uuid", "amount": 500, "reason?": "..." }`.

**CashAdvance shape**: `{ id, companyId, employeeId, amount, deductedAmount, remainingAmount,
status, reason, createdAt, updatedAt }` where `status` is `OUTSTANDING` | `SETTLED`.

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
- **Location**: `locationType` is `BRANCH` | `WAREHOUSE` | `OUTSIDE` with required companion fields:
  - `BRANCH` → `branchId`
  - `WAREHOUSE` → `warehouseId`
  - `OUTSIDE` → `outsideLocationName` + `outsideAddress`
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
fileSize, uploadedByUserId, createdAt }`.

### Endpoints

| Method & path                                          | Roles          | Notes                                                                                         |
| ------------------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------- |
| `POST /transactions`                                   | all\*          | Create draft. \*Timed-in linked employee required. **201**                                    |
| `GET /transactions/by-number/{transactionNumber}`      | all\*\*        | Lookup by business transaction number                                                         |
| `GET /transactions/{transactionId}`                    | all\*\*        | Full detail                                                                                   |
| `PATCH /transactions/{transactionId}`                  | all\*\*        | Partial update / auto-save. Draft for employees; draft or ready-for-payment for owner/manager |
| `GET /transactions`                                    | OWNER, MANAGER | Paginated company list                                                                        |
| `GET /transactions/assigned`                           | all            | Paginated list for acting employee                                                            |
| `POST /transactions/{id}/finish`                       | EMPLOYEE\*\*   | Draft → ready for payment                                                                     |
| `POST /transactions/{id}/return-to-draft`              | OWNER, MANAGER | Ready for payment → draft                                                                     |
| `POST /transactions/{id}/settle`                       | OWNER, MANAGER | Ready for payment → paid                                                                      |
| `POST /transactions/{id}/cancel`                       | all\*\*        | Draft/ready-for-payment → cancelled                                                           |
| `POST /transactions/{id}/reopen`                       | OWNER          | Paid → ready for payment                                                                      |
| `GET /transactions/{id}/receipt`                       | all\*\*        | Receipt for paid transaction only                                                             |
| `POST /transactions/{id}/archive`                      | OWNER, MANAGER | Soft-delete                                                                                   |
| `GET /transactions/{id}/items`                         | all\*\*        | List items                                                                                    |
| `POST /transactions/{id}/items`                        | all\*\*        | Add item. **201**                                                                             |
| `PATCH /transactions/{id}/items/{itemId}`              | all\*\*        | Update item                                                                                   |
| `DELETE /transactions/{id}/items/{itemId}`             | all\*\*        | Remove item → `{ deleted: true }`                                                             |
| `GET /transactions/{id}/attachments`                   | all\*\*        | List photos                                                                                   |
| `POST /transactions/{id}/attachments`                  | all\*\*        | Upload photo (`multipart/form-data`, field `file`)                                            |
| `DELETE /transactions/{id}/attachments/{attachmentId}` | all\*\*        | Remove photo                                                                                  |
| `GET /transactions/suggestions/materials`              | all            | Material autocomplete                                                                         |
| `GET /transactions/suggestions/prices`                 | all            | Price autocomplete for a material                                                             |

\*\* Employees must be assigned to the transaction (else `403`).

**Create body**:

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

**List query params**: `page`, `limit`, `sortBy` (`transactionDate` \| `createdAt` \| `status`),
`sortOrder`, `search`, `transactionNumber`, `direction`, `status`, `locationType`, `branchId`,
`warehouseId`, `fromDate`, `toDate`, `includeArchived`.

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

## 15. Typical frontend flows

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

| Email                   | Role     | Password      |
| ----------------------- | -------- | ------------- |
| `owner@example.com`     | OWNER    | `password123` |
| `manager@example.com`   | MANAGER  | `password123` |
| `employee1@example.com` | EMPLOYEE | `password123` |
| `employee2@example.com` | EMPLOYEE | `password123` |
| `employee3@example.com` | EMPLOYEE | `password123` |
