# Addendum: P012 — Live GPS Tracking Session Synchronization

**Feature**: `016-live-gps-tracking`  
**Status**: Addendum  
**Created**: 2026-07-20  
**Depends on**: P012 base implementation (REST location upsert, WebSocket broadcasts, trip-complete stop)

## Purpose

Improve reliability when the Android Tracking Application resumes from the background, reconnects
after losing network connectivity, or restarts after being terminated.

The **backend remains the single source of truth** for tracking state. The mobile client must
synchronize with the server before resuming GPS transmission or WebSocket subscriptions.

---

## Tracking Session Synchronization

### `GET /api/v1/tracking/session`

**Role**: `EMPLOYEE` only

Returns the authenticated Employee's current tracking session so the mobile app can decide whether
to resume GPS updates automatically or prompt Trip selection.

#### Query parameters

| Parameter         | Type | Required | Notes                                                                |
| ----------------- | ---- | -------- | -------------------------------------------------------------------- |
| `lastKnownTripId` | uuid | no       | Trip ID the client believed was active (detect `TRIP_ENDED` offline) |

#### Response (`data`)

| Field            | Type    | Notes                                                |
| ---------------- | ------- | ---------------------------------------------------- |
| `sessionState`   | enum    | See states below                                     |
| `canTrack`       | boolean | `true` only when GPS upsert is currently permitted   |
| `employeeId`     | uuid    | Present when employee profile resolved               |
| `trip`           | object  | Active trip snapshot when `sessionState=ACTIVE_TRIP` |
| `endedTrip`      | object  | Ended trip snapshot when `sessionState=TRIP_ENDED`   |
| `synchronizedAt` | ISO8601 | Server evaluation timestamp (PH +08:00)              |

#### Session states

| `sessionState`                  | `canTrack` | Meaning                                                           |
| ------------------------------- | ---------- | ----------------------------------------------------------------- |
| `ACTIVE_TRIP`                   | `true`     | Employee is assigned to a **Started** trip; resume tracking       |
| `NO_ACTIVE_TRIP`                | `false`    | No Started trip; stop GPS and show Trip selection                 |
| `TRIP_ENDED`                    | `false`    | `lastKnownTripId` refers to a **Completed** or **Cancelled** trip |
| `EMPLOYEE_NOT_ASSIGNED`         | `false`    | JWT user has no linked employee profile                           |
| `EMPLOYEE_INACTIVE`             | `false`    | Linked employee is archived or inactive                           |
| `COMPANY_SUBSCRIPTION_INACTIVE` | `false`    | Company subscription blocks operational access                    |

Evaluation order: subscription → employee link → employee active → active Started trip → ended trip
(via `lastKnownTripId`) → no active trip.

---

## Available Trips

### `GET /api/v1/tracking/available-trips`

**Role**: `EMPLOYEE` only

Returns **Started** trips the authenticated Employee is assigned to. Used after tracking ends or
when no active session exists so the Employee can choose which Trip to join operationally.

#### Response

Paginated list of `TripSummary` rows (`status=STARTED`, member filter = authenticated employee).

---

## Reconnect Behavior (Mobile Contract)

When the Tracking Application **resumes from background**, **reconnects after WebSocket
disconnection**, or **restarts after process termination**, it MUST follow this sequence:

1. **Authenticate** — obtain or refresh JWT (existing auth flow).
2. **Synchronize tracking session** — `GET /tracking/session` with optional `lastKnownTripId` from
   local cache.
3. **If `canTrack=true`** — resume GPS location upserts (`PUT /tracking/location` or WS
   `location:update`) for the returned `trip`.
4. **If `canTrack=false`** — stop GPS updates, clear local active-session cache, and:
   - `TRIP_ENDED` or `NO_ACTIVE_TRIP` → call `GET /tracking/available-trips` and prompt selection.
   - `EMPLOYEE_*` or `COMPANY_SUBSCRIPTION_INACTIVE` → show blocking message; do not transmit GPS.
5. **Reconnect WebSocket only after successful session sync** — subscribe to trip/company rooms using
   server-confirmed `trip.id` when tracking is permitted.

The backend never trusts client-local trip state for authorization; session sync reconciles client
assumptions with server truth.

---

## Trip Completion and Cancellation

When a Trip becomes **Completed** or **Cancelled**, the backend:

1. Clears `tripId` on affected `CurrentLocation` rows (via lifecycle hook on complete).
2. Broadcasts `tracking:stopped` to subscribed viewers.
3. **Immediately rejects** subsequent location upserts with **409** `BUSINESS_RULE_VIOLATION` and
   reason `NO_ACTIVE_TRIP` (or `TRIP_ENDED` when detected via session sync).

### Mobile behavior on trip end

When session sync returns `TRIP_ENDED` or location upsert returns 409:

- Stop GPS updates.
- Disconnect WebSocket.
- Clear active tracking session from local storage.
- Call `GET /tracking/available-trips` and prompt the Employee to select another Started trip
  (operational assignment is unchanged; tracking resumes only when a new Started trip exists).

---

## WebSocket Recovery

WebSocket is used **only for real-time communication while connected**. It is not a source of truth.

If the WebSocket connection drops:

1. Do **not** assume tracking state from the last WS message.
2. Call `GET /tracking/session` before reconnecting or resuming GPS.
3. Re-subscribe (`subscribe:trip` / `subscribe:company`) only after `canTrack=true`.
4. Use REST upsert for the first location after reconnect if WS is not yet ready (REST remains
   authoritative for persistence).

Missed WS events during downtime are acceptable; session sync + REST snapshot restore correctness.

---

## Acceptance Criteria

### AC-1 — App resumed from background

**Given** an Employee was tracking on a Started trip before backgrounding  
**When** the app returns to foreground and calls `GET /tracking/session`  
**Then** response is `ACTIVE_TRIP` with `canTrack=true` and matching `trip.id`  
**And** GPS upsert succeeds without user action.

### AC-2 — Lost internet connection

**Given** an Employee loses connectivity mid-trip  
**When** connectivity returns and the app calls `GET /tracking/session` before upsert  
**Then** server returns current session state (active or ended)  
**And** the app resumes or stops GPS according to `canTrack`.

### AC-3 — WebSocket reconnection

**Given** WebSocket disconnected while REST session remains valid  
**When** the app reconnects WS  
**Then** it calls `GET /tracking/session` first  
**And** re-subscribes only if `canTrack=true`  
**And** receives live events after subscription without duplicating authoritative state.

### AC-4 — Trip completed while device was offline

**Given** a Started trip is completed on the server while the device is offline  
**When** the device calls `GET /tracking/session?lastKnownTripId={tripId}`  
**Then** response is `TRIP_ENDED` with `canTrack=false`  
**And** subsequent `PUT /tracking/location` returns **409**  
**And** the app stops GPS and prompts Trip selection via available trips.

### AC-5 — Process killed and restarted

**Given** the Tracking Application process is terminated  
**When** the user reopens the app and authenticates  
**Then** the first operational call is `GET /tracking/session` (with cached `lastKnownTripId` if any)  
**And** tracking resumes only when the server returns `canTrack=true`.

### AC-6 — No Active Trip

**Given** the Employee has no Started trip assignment  
**When** `GET /tracking/session` is called  
**Then** response is `NO_ACTIVE_TRIP` with `canTrack=false`  
**And** `GET /tracking/available-trips` returns an empty list or other Started trips if any exist.

### AC-7 — Employee selects another Trip

**Given** session sync returned `NO_ACTIVE_TRIP` or `TRIP_ENDED`  
**When** the Employee is assigned to a different Started trip (via normal Trip operations)  
**And** `GET /tracking/session` is called again  
**Then** response becomes `ACTIVE_TRIP` with the new trip  
**And** GPS upsert succeeds on the new Started trip.

---

## API Contract References

- REST extensions: [`contracts/openapi.yaml`](./contracts/openapi.yaml) (session + available-trips paths)
- WebSocket events (unchanged): [`contracts/websocket-events.md`](./contracts/websocket-events.md)
- Frontend reference: [`docs/api-reference.md`](../../docs/api-reference.md) — Live GPS Tracking section
