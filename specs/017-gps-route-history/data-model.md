# Data Model: P013 — GPS Route History

**Feature**: `017-gps-route-history` | **Extends**: P012 `CurrentLocation`

## LocationHistory (new)

Append-only GPS sample recorded during a Started Trip when P012 upsert succeeds and sampling allows.

| Field        | Type          | Required | Notes                                     |
| ------------ | ------------- | -------- | ----------------------------------------- |
| id           | UUID          | yes      | PK                                        |
| companyId    | UUID          | yes      | FK → Company; tenant scope                |
| employeeId   | UUID          | yes      | FK → Employee                             |
| tripId       | UUID          | yes      | FK → Trip                                 |
| latitude     | decimal(10,8) | yes      | −90..90                                   |
| longitude    | decimal(11,8) | yes      | −180..180                                 |
| capturedAt   | timestamptz   | yes      | Device capture time (from upsert payload) |
| accuracy     | decimal(8,2)  | no       | Meters                                    |
| speed        | decimal(8,3)  | no       | km/h                                      |
| heading      | decimal(6,2)  | no       | Degrees                                   |
| batteryLevel | int           | no       | 0–100                                     |
| createdAt    | timestamptz   | yes      | Server insert time                        |

### Indexes

- `(tripId, employeeId, capturedAt)` — route queries, ordered asc
- `(companyId, tripId)` — tenant-scoped trip purge
- `(tripId)` — retention delete by trip batch

### Constraints

- **No UNIQUE** on employee — many rows per employee per trip (append-only)
- FK `tripId` — ON DELETE RESTRICT (purge via retention job, not cascade delete trips)

### Relationships

```text
Company 1──* LocationHistory
Employee 1──* LocationHistory
Trip 1──* LocationHistory
```

## CurrentLocation (unchanged — P012)

One row per employee; upsert on transmit. History append does not modify this model.

## Derived: TripRoute (API only)

Not persisted. Built from `LocationHistory` + `TripMember` join:

```text
TripRoute
├── tripId, tripNumber, tripStatus
└── employees[]
    ├── employeeId, firstName, lastName
    ├── points[] — ordered by capturedAt
    └── meta — pagination
```

## Sampling state

Not a separate table. Before insert, query latest history point for `(employeeId, tripId)`:

- If `now - last.capturedAt < LOCATION_HISTORY_SAMPLE_MS` → skip insert

Optional optimization: cache last sample time in memory per process (not required MVP).

## Retention

Delete all `LocationHistory` where `tripId` IN (

```sql
SELECT id FROM Trip
WHERE status IN ('COMPLETED','CANCELLED')
  AND actualEnd < NOW() - INTERVAL '90 days'
```

)

## Privacy

- Coordinates MUST NOT appear in Activity Log metadata (P012 rule continues)
- Retention purge is hard delete (no soft-delete on history)

## Migration notes

- Additive migration only; no changes to `CurrentLocation` columns
- Existing live tracking data is not backfilled (history starts at deploy time)

## Future extensions (out of scope)

| Capability                     | Approach                               |
| ------------------------------ | -------------------------------------- |
| Company-configurable retention | `Company.locationHistoryRetentionDays` |
| Downsampling old trips         | Batch job to thin points > 30 days     |
| GPX export                     | New export endpoint reading same table |
