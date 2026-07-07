# Quickstart: Organization Management

**Feature**: `003-organization-management`  
**Purpose**: Validate P002 Organization Management end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

## Prerequisites

- P001 Company & Identity Foundation running (Company + Owner exist)
- Authenticated Owner or Manager session token
- API available at `http://localhost:3000` (or Docker equivalent)
- Database migrated with Branch, Warehouse, Vehicle models

## Validation Scenario 1: Branch Lifecycle

1. Authenticate as Owner/Manager.
2. `POST /api/v1/branches` with `{ name, address, contactNumber, status: "ACTIVE" }`.
3. `GET /api/v1/branches/{branchId}` — confirm details and `companyId` matches session.
4. `PATCH /api/v1/branches/{branchId}` — update address.
5. `GET /api/v1/branches` — confirm branch appears in list.
6. `POST /api/v1/branches/{branchId}/archive`.
7. `GET /api/v1/branches` — confirm archived branch is excluded.

**Expected**: Full branch lifecycle within tenant; archived excluded from list.

## Validation Scenario 2: Warehouse Lifecycle

Repeat Scenario 1 pattern for `/api/v1/warehouses`.

**Expected**: Warehouse name unique per company; archive excludes from list.

## Validation Scenario 3: Vehicle Lifecycle

1. `POST /api/v1/vehicles` with `{ plateNumber, description, status: "AVAILABLE" }`.
2. View, update status to `MAINTENANCE`, list, archive.
3. Confirm vehicle can exist without any Trip assignment.

**Expected**: Plate unique per company; status transitions valid; archive works.

## Validation Scenario 4: Tenant Isolation

1. Create resources in Company A.
2. Authenticate as user from Company B.
3. Attempt GET/PATCH/archive on Company A resource IDs.

**Expected**: 403 or 404; no cross-company data leakage.

## Validation Scenario 5: Authorization

1. Authenticate as Employee.
2. Attempt create/update/archive on any resource — expect 403.
3. List and get — expect 200 for same-company resources.

**Expected**: Employee read-only; Owner/Manager full management.

## Validation Scenario 6: Uniqueness and Validation

1. Create branch with duplicate name in same company — expect 409.
2. Create vehicle with duplicate plate in same company — expect 409.
3. Submit empty name or missing required fields — expect 400.

**Expected**: Business and schema validation enforced.

## Acceptance Checklist

- [ ] Branch CRUD + archive + list works
- [ ] Warehouse CRUD + archive + list works
- [ ] Vehicle CRUD + archive + list works
- [ ] Archived resources excluded from default lists
- [ ] Cross-company access rejected
- [ ] Role-based authorization enforced
- [ ] Uniqueness rules enforced
- [ ] OpenAPI docs reflect all endpoints
- [ ] All tests pass (`npm test`)
