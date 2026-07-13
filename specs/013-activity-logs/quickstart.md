# Quickstart: P010 - Activity Logs

**Feature**: `013-activity-logs`  
**Date**: 2026-07-13

Validate Activity Logs end-to-end after `/speckit-implement`. Contracts:
[contracts/openapi.yaml](./contracts/openapi.yaml). Data model: [data-model.md](./data-model.md).

## Prerequisites

- API running with migrations applied (including ActivityLog table)
- Seeded or created Company with Owner, Manager, and Employee users
- Ability to perform a few business actions (login, create employee, etc.)

## Scenario A — Automatic recording

1. Login as Owner.
2. Perform a listed action (e.g. create Employee, or mark a transaction paid).
3. `GET /api/v1/activity-logs?page=1&limit=20`
4. Expect `200` with a recent row matching module/action for that operation.
5. Confirm description has no password secrets for password-related events.

## Scenario B — Authorization

1. Login as Employee → `GET /activity-logs` → `403`.
2. Login as Manager → `GET /activity-logs` → `200` (Company rows only).
3. Login as Owner → same.

## Scenario C — Search / filter / sort

1. As Owner/Manager, search with `q` + `searchBy=transactionNumber` for a known number.
2. Filter `module=transaction` and a `dateFrom`/`dateTo` window.
3. Sort `sortBy=createdAt&sortOrder=desc` (default).
4. Invalid `dateFrom > dateTo` → `400`.

## Scenario D — Immutability

1. `POST` / `PATCH` / `DELETE` `/activity-logs` (or by id) → not allowed (`405`/`404`).
2. Get-by-id returns the same content on repeat reads.

## Scenario E — Tenant isolation

1. Create Activity Logs in Company A.
2. Auth as Company B Owner → must not see Company A ids (list empty of those; get → `404`).

## Suggested test commands (post-implement)

```bash
pnpm test -- tests/api/activity-log tests/unit/activity-log
```

## Done when

- Scenarios A–E pass
- OpenAPI / api-reference mention Activity Logs
- Representative producer actions emit rows (see plan taxonomy)
