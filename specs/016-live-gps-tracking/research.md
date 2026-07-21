# Research: Live GPS Tracking (P012)

**Feature**: `016-live-gps-tracking`  
**Date**: 2026-07-20

## 1. Real-time transport library

**Decision**: Add **`ws`** (native WebSocket) attached to the existing Node.js `http.Server` via the
HTTP upgrade path.

**Rationale**:

- Scrappy API already bootstraps `createServer(app)` in `src/server.ts`; WebSocket upgrade on the
  same port avoids CORS/proxy complexity for dashboards and the Tracking App.
- Constitution Principle VII (simplicity): `ws` is minimal, well-maintained, and sufficient for
  room-based fan-out without Socket.IO’s fallback/long-polling stack.
- P012 requires business-level events and authorized broadcast—not a full chat/reconnection
  framework.

**Alternatives considered**:

| Alternative                | Rejected because                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| Socket.IO                  | Heavier dependency; adds protocol overhead and opinionated reconnection not required for MVP |
| Server-Sent Events only    | Unidirectional; Tracking App also needs efficient uplink for frequent GPS posts              |
| Polling-only               | Fails SC-001 (5s update latency) and spec real-time requirement                              |
| Separate WebSocket service | Violates YAGNI; adds deployment complexity before multi-region scale is needed               |

## 2. Location ingestion channel

**Decision**: Support **both** REST `PUT /tracking/location` (spec contract + fallback) **and**
WebSocket `location:update` messages from the Tracking Application on the same authenticated
session.

**Rationale**:

- Spec defines REST PUT; mobile clients benefit from persistent WebSocket for lower overhead.
- Both paths delegate to a single `UpsertCurrentLocationUseCase` to enforce one code path for
  validation and upsert semantics.

**Alternatives considered**:

- WebSocket-only ingestion — rejected; spec explicitly defines REST endpoint; REST aids debugging and
  integration tests.
- REST-only — rejected; continuous 30–60s GPS posts over HTTP increase battery and connection churn.

## 3. Current location persistence strategy

**Decision**: One **`CurrentLocation` row per Employee** with **UPSERT** (`ON CONFLICT (employeeId)
DO UPDATE`) — never INSERT-only history rows.

**Rationale**:

- FR-006/FR-007 and SC-004 require replace-not-append semantics.
- Unique constraint on `employeeId` enforces invariant at database level.
- `lastSeenAt` updated on every accepted location; drives Online/Offline derivation.

**Alternatives considered**:

- Append-only location table with “latest” view — rejected; violates no-history requirement.
- Redis-only ephemeral store — rejected; REST monitoring must survive WebSocket disconnects and
  server restarts; PostgreSQL is source of truth.

## 4. Online / Offline detection

**Decision**: **Derived status** computed on read and on a lightweight **in-process staleness
sweep** (default interval 60s) that emits `employee:offline` WebSocket events when
`now - lastSeenAt > TRACKING_STALENESS_MS` (default 5 minutes, env-configurable).

**Rationale**:

- No separate “status” column avoids drift; status is always derived from `lastSeenAt`.
- Periodic sweep covers viewers who stay connected without polling; transitions Online→Offline once
  per employee per staleness crossing (debounced in broadcaster).
- Accepting a new location immediately sets Online and emits `employee:online` if previously offline.

**Alternatives considered**:

- DB column `status` updated by cron — rejected; duplicates truth and requires sync logic.
- Client-only offline detection — rejected; spec requires system-determined status for all viewers.

## 5. Trip lifecycle integration point

**Decision**: **`CompleteTripUseCase`** (trip module) invokes **`TrackingLifecyclePort.stopTrackingForTrip(tripId, companyId)`** after successful completion. Tracking module clears `tripId` on affected `CurrentLocation` rows whose `tripId` matches, broadcasts `tracking:stopped` per employee, and rejects subsequent upserts for that trip.

**Rationale**:

- Trip module owns lifecycle; tracking module owns location rules—port keeps dependency direction
  clean (trip → tracking port interface defined in tracking domain/application).
- P006 forbids cancelling Started trips; only **complete** stops active tracking (cancel applies to Draft only).

**Alternatives considered**:

- DB trigger on Trip status — rejected; hides business logic in infrastructure, harder to test and broadcast events.
- Polling trip status on each GPS update — rejected; race conditions and wasted reads.

## 6. WebSocket authentication

**Decision**: JWT access token presented **during connection handshake** via `Sec-WebSocket-Protocol`
subprotocol list or `Authorization` header on upgrade (prefer header; fall back to query
`?access_token=` for mobile clients that cannot set upgrade headers—documented as secondary).

**Rationale**:

- Reuses existing `TokenProvider.verifyAccessToken` and auth payload (`userId`, `companyId`, `role`).
- Same subscription and account gates as REST middleware before accepting connection.
- Employee `employeeId` resolved post-connect via `resolveActingEmployeeIdForUser` (reuse transaction
  access helper pattern).

**Alternatives considered**:

- Separate tracking API keys — rejected; spec requires Scrappy JWT identity.
- Cookie-based WS auth — rejected; mobile Tracking App uses Bearer tokens like existing API clients.

## 7. Room / broadcast strategy

**Decision**: Hierarchical rooms keyed by tenant and trip:

| Room key                                | Subscribers                        | Events received                          |
| --------------------------------------- | ---------------------------------- | ---------------------------------------- |
| `company:{companyId}:tracking:live`     | Owner, Manager (company-wide map)  | All company Started-trip location events |
| `company:{companyId}:trip:{tripId}`     | Owner, Manager monitoring one trip | Events for that trip only                |
| `platform:company:{companyId}:tracking` | Super Admin support view           | Same events, explicit admin subscribe    |

Employee transmitters **do not join viewer rooms**; they send uplink messages on their authenticated
connection only.

**Rationale**:

- Scoped fan-out prevents cross-trip leakage within a company.
- Company-wide room supports dashboard map; trip room supports trip detail view.
- Super Admin requires explicit company context to avoid accidental global firehose.

**Alternatives considered**:

- Single global room per company — rejected; trip-scoped views would receive unnecessary traffic.
- Per-employee rooms — rejected; over-granular for MVP; trip room covers assigned employees.

## 8. Activity Log integration

**Decision**: Record **high-signal** Activity Log events only:

- `tracking.started` — first accepted location for Employee on Started Trip
- `tracking.stopped` — trip completed or tracking invalidated

Do **not** log every GPS update (would violate Activity Log purpose and flood storage).

**Rationale**:

- FR-033 requires auditable outcomes without retaining coordinate history.
- Aligns with P010 pattern: significant business events, not high-frequency telemetry.
- Per-location audit via structured Pino debug logs (ops only, no coordinates in production info logs).

## 9. Mock location / anti-spoofing (MVP)

**Decision**: Accept `isMockLocation` from client, **reject updates when `true`**, log structured
warning with employee/trip ids (no coordinates in warn log fields beyond lat/long rounded to 2dp for
support if needed—prefer omitting coordinates in logs).

**Rationale**:

- Android/iOS expose mock flag; rejecting protects operational integrity at minimal cost.
- Full anti-spoofing (root detection, velocity checks) deferred to future hardening.

## 10. Multi-instance scaling (future)

**Decision**: Define **`TrackingBroadcastPort`** interface in application layer; default in-process
implementation fan-outs to local `ws` connections. Future Redis pub/sub adapter implements same port
for horizontal scale **without** changing use cases or REST APIs.

**Rationale**:

- Meets “support future scaling without redesign” requirement.
- Railway single-instance MVP does not require Redis yet.
