# Quickstart: P006 Addendum — Trip Load Management

**Feature**: `015-trip-load-management`  
**Date**: 2026-07-14

Validate after `/speckit-implement`. Contracts: [contracts/openapi.yaml](./contracts/openapi.yaml).
Data model: [data-model.md](./data-model.md).

## Prerequisites

- Migrations applied (Trip.loadEnabled, Trip.strictLoadValidation, TripLoad, TripLoadItem)
- Seeded Company with Owner/Manager and Employee; Draft trip available
- API running locally

## Scenario A — Optional load on Draft

1. As Manager, create Draft trip (or use existing).
2. `POST /api/v1/trips/{tripId}/load` with 2+ items → `201`; `loadEnabled` true.
3. `GET .../load` → items returned.
4. Start another trip **without** load → start succeeds.

## Scenario B — Lock after start + remaining

1. Draft trip with load; `POST .../start`.
2. Create outbound Outside transaction linked to trip selling partial quantity of a load material.
3. `GET .../load/summary` → remaining = loaded − outbound weight sum.
4. `POST .../load/items` → `409` (locked).

## Scenario C — Strict validation blocks exceed

1. Enable load with `strictLoadValidation: true` (or PATCH trip flags via enable).
2. Started trip with load quantity 10.
3. Outbound sell weight 12 matching material/unit → rejected.
4. Inbound matching material → accepted (no load validation).

## Scenario D — Warn mode

1. `strictLoadValidation: false`, load quantity 10.
2. Outbound sell 12 → `201`/`200` with warning; transaction persisted.
3. Summary remaining negative.

## Scenario E — Authorization

1. Employee assigned: GET load/summary → `200`; POST load → `403`.
2. Employee not assigned: GET → `403`.
3. Owner/Manager: full Draft CRUD.

## Scenario F — Disable clears load

1. Draft trip with load.
2. `POST .../load/disable` → `loadEnabled` false; GET load → `404`.

## Suggested tests (post-implement)

```bash
pnpm test -- tests/api/trip tests/unit/trip
```

## Done when

- Scenarios A–F pass
- OpenAPI + `docs/api-reference.md` document Trip Load APIs
- Activity Logs record load enable/disable/create/update/delete
