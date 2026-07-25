# Implementation Plan: P013 — GPS Route History

**Branch**: `017-gps-route-history` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-gps-route-history/spec.md`

**Note**: Extends P012 `tracking` module. Does not replace live `CurrentLocation` upsert.

## Summary

Add **`LocationHistory`** append-only table and repository. Hook **`UpsertCurrentLocationUseCase`**
to append a history point after successful upsert when minimum sampling interval elapsed (default
15s). Expose **`GET /trips/{tripId}/tracking/route`** returning ordered `points[]` per employee
(paginated). Run **`LocationHistoryRetentionService`** on server bootstrap (daily sweep) to delete
points for Trips completed > 90 days ago. Reuse P012 auth (Owner/Manager read; Employee denied).

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js ≥22

**Primary Dependencies**: Express, Prisma, PostgreSQL, Zod, Vitest, Supertest — no new npm packages

**Storage**: PostgreSQL `LocationHistory` table; index `(tripId, employeeId, capturedAt)`; retention
delete by trip completion date

**Testing**: Unit (sampling, retention), integration (append + query), API (authz, pagination)

**Target Platform**: Same as P012 (Docker/Railway)

**Performance Goals**: Route query p95 < 500ms for ≤ 2,000 points; append adds < 20ms to upsert p95

**Constraints**: Tenant isolation; no coordinate logging at info; Employee read denied; sampling +
retention env-configurable

**Scale/Scope**: ~100 employees × ~180k rows/day worst-case mitigated by 15s sampling + 90-day purge

## Constitution Check

| Gate                    | Pre-Design | Post-Design | Notes                                    |
| ----------------------- | ---------- | ----------- | ---------------------------------------- |
| Layer boundaries        | ✅         | ✅          | History repo in infrastructure           |
| No logic in controllers | ✅         | ✅          | Delegate to use cases                    |
| Repository pattern      | ✅         | ✅          | `LocationHistoryRepository`              |
| DI                      | ✅         | ✅          | Extend `buildTrackingModule`             |
| Zod validation          | ✅         | ✅          | Route query params                       |
| DTOs                    | ✅         | ✅          | `TripRouteResponseDto`                   |
| Response envelope       | ✅         | ✅          | Standard `success()`                     |
| Pagination              | ✅         | ✅          | `page`/`limit` or cursor on points       |
| Security                | ✅         | ✅          | Owner/Manager only; tenant scoped        |
| Logging                 | ✅         | ✅          | Counts only in audit, no lat/lng at info |
| Tests                   | ✅         | ✅          | Unit + API                               |
| OpenAPI                 | ✅         | ✅          | Extend tracking.openapi.ts               |
| Simplicity              | ✅         | ✅          | No Redis; synchronous append on upsert   |

## Project Structure

### Documentation

```text
specs/017-gps-route-history/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
├── checklists/requirements.md
└── tasks.md
```

### Source code (extensions to P012)

```text
src/modules/tracking/
├── domain/
│   ├── location-history.repository.ts      # NEW
│   └── location-history-rules.ts           # NEW — sampling interval
├── application/
│   ├── dto/trip-route.response.ts          # NEW
│   ├── use-cases/
│   │   ├── get-trip-tracking-route.use-case.ts    # NEW
│   │   └── append-location-history.use-case.ts    # NEW (called from upsert)
│   └── services/
│       └── location-history-retention.service.ts  # NEW
├── infrastructure/
│   └── location-history.prisma-repository.ts      # NEW
└── presentation/
    ├── tracking.controller.ts                # MOD — getTripRoute
    ├── tracking.routes.ts                    # MOD
    ├── tracking.schemas.ts                   # MOD
    └── tracking.openapi.ts                   # MOD

prisma/schema.prisma                          # MOD — LocationHistory model
src/config/env.schema.ts                      # MOD — HISTORY_SAMPLE_MS, HISTORY_RETENTION_DAYS
src/server.ts                                 # MOD — start retention sweep
tests/setup/in-memory-location-history-repository.ts  # NEW
```

## API Surface

| Method | Path                             | Roles          | Purpose                          |
| ------ | -------------------------------- | -------------- | -------------------------------- |
| GET    | `/trips/{tripId}/tracking/route` | OWNER, MANAGER | Ordered route points (paginated) |

**Query params**: `employeeId?`, `page`, `limit`, `sortOrder=asc`

**Response `data`**:

```jsonc
{
  "tripId": "uuid",
  "tripNumber": "TRP-001",
  "tripStatus": "COMPLETED",
  "employees": [
    {
      "employeeId": "uuid",
      "firstName": "Juan",
      "lastName": "Cruz",
      "points": [{ "latitude": 14.59, "longitude": 120.98, "capturedAt": "...", "accuracy": 10 }],
      "meta": { "total": 120, "page": 1, "limit": 500 },
    },
  ],
}
```

When `employeeId` filter provided, return single employee entry in `employees` array.

## Integration with P012 Upsert

```text
UpsertCurrentLocationUseCase.execute()
  → upsert CurrentLocation (unchanged)
  → broadcast (unchanged)
  → AppendLocationHistoryUseCase.execute()  // NEW
       → skip if last history point < SAMPLE_MS ago for (employeeId, tripId)
       → insert LocationHistory row
```

## Retention

`LocationHistoryRetentionService` runs daily:

- Find Trips with `status IN (COMPLETED, CANCELLED)` and `actualEnd < now - RETENTION_DAYS`
- Delete all `LocationHistory` rows for those `tripId`s (batch)

## Phase 0 / Phase 1 Artifacts

- [research.md](./research.md) — sampling, retention, pagination decisions
- [data-model.md](./data-model.md) — `LocationHistory` entity
- [contracts/openapi.yaml](./contracts/openapi.yaml) — route endpoint
- [quickstart.md](./quickstart.md) — validation scenarios

## Complexity Tracking

| Decision                   | Why                                | Alternative rejected                 |
| -------------------------- | ---------------------------------- | ------------------------------------ |
| Sync append on upsert      | Simple, consistent with live point | Async queue — overkill at 100 users  |
| Row-per-point vs JSON blob | Query, index, purge by trip        | JSON column — hard to paginate/purge |
| 15s sampling               | ~720 pts/3hr/trip vs 10,800 at 1s  | Store all — 10× storage              |
