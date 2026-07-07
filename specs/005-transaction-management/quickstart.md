# Quickstart: Transaction Management (Foundation)

**Feature**: `005-transaction-management`  
**Purpose**: Validate P004 Transaction Management end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

## Prerequisites

- P001 Company and Identity Foundation running (Company, Owner, Manager, Employee with linked User)
- P002 Branch and Warehouse records available in the Company
- P003 Workforce Management running; Employee timed in for creation scenarios
- API available at `http://localhost:3000` (or Docker equivalent)
- Database migrated with Transaction, TransactionItem, TransactionAttachment,
  TransactionEmployeeAssignment models
- `UPLOAD_DIR` configured for attachment storage (local dev default: `./uploads`)

## Validation Scenario 1: Create Draft Transaction (Timed In)

1. Authenticate as Employee with linked profile.
2. `POST /api/v1/workforce/attendance/time-in` — ensure timed in.
3. `POST /api/v1/transactions` with:
   - `direction: "BUY"`
   - `partyName`, `transactionDate`, `locationType: "BRANCH"`, `branchId`
   - `assignedEmployeeIds: [ownEmployeeId]`
   - at least one item in `items` array
4. `GET /api/v1/transactions/{transactionId}` — confirm `status: DRAFT`, items and assignments.

**Expected**: Draft transaction created; response includes detail with items.

## Validation Scenario 2: Operational Readiness Gate

1. Authenticate as Employee (not timed in).
2. Attempt `POST /api/v1/transactions`.

**Expected**: 409 `BUSINESS_RULE_VIOLATION` — employee not timed in.

## Validation Scenario 3: Draft Edit and Auto-Save (PATCH)

1. Authenticate as assigned Employee on a Draft transaction.
2. `PATCH /api/v1/transactions/{transactionId}` with updated `partyName` or `notes`.
3. Confirm `status` remains `DRAFT` and fields persist.
4. Attempt PATCH on a Cancelled transaction — expect 409.

**Expected**: Draft updates succeed; cancelled transactions reject edits.

## Validation Scenario 4: Transaction Items

1. `POST /api/v1/transactions/{transactionId}/items` — add item with material, weight, unit, price.
2. Confirm `total = weight × price` in response.
3. `PATCH /api/v1/transactions/{transactionId}/items/{itemId}` — update weight.
4. `DELETE /api/v1/transactions/{transactionId}/items/{itemId}` — remove item.
5. `GET /api/v1/transactions/{transactionId}/items` — confirm list.

**Expected**: Item CRUD on Draft only; total recalculated on update.

## Validation Scenario 5: Photo Attachments

1. `POST /api/v1/transactions/{transactionId}/attachments` with multipart `file` (JPEG/PNG).
2. `GET /api/v1/transactions/{transactionId}/attachments` — confirm metadata returned.
3. `DELETE /api/v1/transactions/{transactionId}/attachments/{attachmentId}`.
4. Attempt upload exceeding 5 MB — expect 400.

**Expected**: Photo upload/list/delete on Draft; file validation enforced.

## Validation Scenario 6: List, Search, and Filter

1. Authenticate as Manager.
2. `GET /api/v1/transactions?direction=INBOUND&status=DRAFT&fromDate=2026-07-01`.
3. Confirm paginated results with `meta.page`, `meta.total`.
4. `GET /api/v1/transactions?search={partyName}` — confirm match.
5. Authenticate as assigned Employee.
6. `GET /api/v1/transactions/assigned` — confirm only assigned transactions returned.
7. Attempt `GET /api/v1/transactions` as Employee — expect 403.

**Expected**: Role-scoped lists; filters and search work within tenant.

## Validation Scenario 7: Cancel and Archive

1. `POST /api/v1/transactions/{transactionId}/cancel` with optional reason.
2. Confirm `status: CANCELLED`, `cancelledAt` set.
3. Attempt item add on cancelled transaction — expect 409.
4. Create another Draft; `POST /api/v1/transactions/{transactionId}/archive` as Manager.
5. `GET /api/v1/transactions` — archived transaction excluded by default.
6. `GET /api/v1/transactions?includeArchived=true` — archived visible to Manager.

**Expected**: Cancel immutability; archive soft-deletes from default lists.

## Validation Scenario 8: Material and Price Suggestions

1. After creating transactions with material `Copper Wire` at price `150.00`.
2. `GET /api/v1/transactions/suggestions/materials?search=Copper` — confirm suggestion.
3. `GET /api/v1/transactions/suggestions/prices?materialName=Copper%20Wire` — confirm `150.00`.

**Expected**: Suggestions derived from Company transaction history.

## Validation Scenario 9: Authorization Matrix

1. Employee A creates transaction assigned to self.
2. Employee B (not assigned) attempts PATCH — expect 403.
3. Manager attempts PATCH on Employee A's Draft — expect 200.
4. Owner has same company-wide edit access as Manager.

**Expected**: Assignment-scoped Employee edit; Manager/Owner company Draft edit.

## Validation Scenario 10: Tenant Isolation

1. Create transactions in Company A.
2. Authenticate as user from Company B.
3. Attempt GET/PATCH/cancel on Company A transaction IDs.

**Expected**: 403 or 404; no cross-company data leakage.

## Acceptance Checklist

- [ ] All transaction endpoints implemented and documented in OpenAPI
- [ ] Prisma models and migration applied
- [ ] Operational readiness gate on create (100% test coverage)
- [ ] Draft-only mutation rules enforced (100% test coverage)
- [ ] Assignment authorization enforced (100% test coverage)
- [ ] Cross-company access rejected (100% test coverage)
- [ ] Material and price suggestions return Company-scoped history
- [ ] `pnpm run build`, `pnpm test`, `pnpm run lint` pass
