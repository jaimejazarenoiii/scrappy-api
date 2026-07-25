# Research: P013 — GPS Route History

**Feature**: `017-gps-route-history` | **Date**: 2026-07-24

## R1 — Storage model: row-per-point vs polyline blob

**Decision**: One PostgreSQL row per accepted GPS point (`LocationHistory`).

**Rationale**: Enables pagination, per-trip purge, per-employee filter, and index-friendly range
queries. JSON array per trip would require full read/rewrite and complicates retention.

**Alternatives rejected**:

- PostGIS `LineString` — adds extension dependency; overkill for display-only polylines
- Client-only buffer — lost on refresh; fails SC-001

---

## R2 — When to write history

**Decision**: Append synchronously inside `UpsertCurrentLocationUseCase` after successful
`CurrentLocation` upsert, via dedicated `AppendLocationHistoryUseCase`.

**Rationale**: Same transaction boundary as live location; guaranteed consistency; failure to append
should not fail upsert (log error, continue live tracking).

**Alternatives rejected**:

- DB trigger on `CurrentLocation` — hides business rules; hard to apply sampling
- Separate async worker — operational complexity for MVP scale

---

## R3 — Sampling interval

**Decision**: Default **15 seconds** minimum between stored points per `(employeeId, tripId)`.
Env: `LOCATION_HISTORY_SAMPLE_MS` (default `15000`).

**Rationale**: At 100 users × 2.5 trips × 3hr ≈ **180k rows/day** (~2 GB/month). Without sampling
at 1/sec, storage grows ~10×.

**Alternatives rejected**:

- 30s — fewer points on short trips
- Store all — acceptable only at very small scale

---

## R4 — Retention

**Decision**: Delete history **90 days** after Trip `actualEnd`. Env:
`LOCATION_HISTORY_RETENTION_DAYS` (default `90`). Daily sweep on server start + interval.

**Rationale**: Bounds long-term storage; aligns with operational review window (disputes, audits).

**Alternatives rejected**:

- Forever — unbounded growth
- 30 days — may be short for payroll/dispute workflows; 90 is reasonable default

---

## R5 — Route API shape

**Decision**: `GET /trips/{tripId}/tracking/route` returns `employees[].points[]` ordered by
`capturedAt asc`, paginated per employee (`page`, `limit`, max 1000).

**Rationale**: Matches frontend polyline use case; optional `employeeId` filter for single-driver view;
reuses trip member list from P012 trip tracking snapshot pattern.

**Alternatives rejected**:

- GeoJSON FeatureCollection — can add later; arrays simpler for existing frontend stack
- WebSocket route stream — out of scope; live remains single-point P012 events

---

## R6 — Authorization

**Decision**: Same as P012 read paths — OWNER, MANAGER within JWT `companyId`; EMPLOYEE forbidden;
trip must belong to company.

**Rationale**: Route reveals movement history; not for field workers viewing peers.

---

## R7 — Cancelled trips

**Decision**: Retain points recorded while Trip was STARTED; stop appending on cancel (P012 stops
transmit). Route readable for CANCELLED trips with partial path.

**Rationale**: Operational value for incomplete runs; retention purge still applies from
`actualEnd`/cancel time.

---

## Storage estimate (validated)

| Assumption               | Value                |
| ------------------------ | -------------------- |
| Employees                | 100                  |
| Trips/employee/day       | 2.5 avg              |
| Trip duration            | 3 hr                 |
| Sample interval          | 15 s                 |
| Points/trip              | ~720                 |
| Points/day (all users)   | ~180,000             |
| Bytes/row (with indexes) | ~350                 |
| Storage/day              | ~63 MB               |
| Storage/month (no purge) | ~1.9 GB              |
| With 90-day retention    | steady-state ~5–6 GB |

Conclusion: **Not a problem** at target scale with sampling + retention.
