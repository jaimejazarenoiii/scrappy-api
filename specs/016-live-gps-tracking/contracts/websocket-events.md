# WebSocket Events: Live GPS Tracking (P012)

**Feature**: `016-live-gps-tracking`  
**Transport**: WebSocket at `/ws/v1/tracking` (see [plan.md](./plan.md))  
**Note**: This document defines **business-level events** and payload fields. REST OpenAPI is in
[openapi.yaml](./openapi.yaml). Encoding (JSON message envelope), reconnection, and library details
belong to implementation—not repeated here.

## Connection prerequisites

1. Client obtains JWT access token via existing Scrappy login (Employee for uplink; Owner/Manager/Super
   Admin for subscribe).
2. Client opens WebSocket with valid token.
3. Server validates token, resolves identity, accepts or rejects connection.
4. Viewer clients send **subscribe** messages for rooms they are authorized to join.
5. REST endpoints provide **initial snapshot** before/alongside streaming (see OpenAPI).

## Message envelope (logical)

All messages share:

| Field      | Description                                    |
| ---------- | ---------------------------------------------- |
| type       | Event name (below)                             |
| companyId  | Tenant scope                                   |
| occurredAt | ISO-8601 timestamp (PH display +08:00 in REST) |
| payload    | Event-specific body                            |

## Client → Server messages

### `subscribe:company`

Owner/Manager joins company-wide live tracking room.

**Payload**: none (company from JWT)

**Authorization**: OWNER, MANAGER

---

### `subscribe:trip`

Owner/Manager joins trip-scoped room.

**Payload**:

| Field  | Type | Required |
| ------ | ---- | -------- |
| tripId | UUID | Yes      |

**Authorization**: OWNER, MANAGER; trip must belong to JWT company

---

### `subscribe:admin-company`

Super Admin joins platform support room for a company.

**Payload**:

| Field     | Type | Required |
| --------- | ---- | -------- |
| companyId | UUID | Yes      |

**Authorization**: SUPER_ADMIN

---

### `location:update`

Tracking Application sends GPS update (alternative to REST PUT).

**Payload**:

| Field          | Type    | Required | Notes                        |
| -------------- | ------- | -------- | ---------------------------- |
| latitude       | number  | Yes      | −90..90                      |
| longitude      | number  | Yes      | −180..180                    |
| capturedAt     | string  | Yes      | ISO-8601 device time         |
| accuracy       | number  | No       | Meters                       |
| speed          | number  | No       | See REST contract unit       |
| heading        | number  | No       | 0..360                       |
| batteryLevel   | integer | No       | 0..100                       |
| isMockLocation | boolean | No       | Default false; true → reject |

**Authorization**: EMPLOYEE with linked profile on Started Trip

**Server response message**: `location:ack` with success or error code (mirrors REST error semantics)

---

### `ping`

Keep-alive; server responds `pong`.

## Server → Client events

### `tracking:connected`

**Purpose**: Confirm authenticated WebSocket session ready.

**Payload**:

| Field      | Type   | Description               |
| ---------- | ------ | ------------------------- |
| userId     | UUID   | Authenticated user        |
| role       | string | JWT role                  |
| employeeId | UUID   | Present for EMPLOYEE role |

---

### `tracking:disconnected`

**Purpose**: Server-initiated close notice (token revoked, account deactivated, policy violation).

**Payload**:

| Field  | Type   | Description         |
| ------ | ------ | ------------------- |
| reason | string | Safe client message |

---

### `location:updated`

**Purpose**: Employee current location changed; refresh map marker.

**Payload**:

| Field          | Type   | Description         |
| -------------- | ------ | ------------------- |
| employeeId     | UUID   |                     |
| tripId         | UUID   | Active Started trip |
| latitude       | number |                     |
| longitude      | number |                     |
| accuracy       | number | Nullable            |
| speed          | number | Nullable            |
| heading        | number | Nullable            |
| batteryLevel   | number | Nullable            |
| lastSeenAt     | string | ISO-8601            |
| trackingStatus | string | `ONLINE`            |

---

### `tracking:started`

**Purpose**: First accepted location for Employee on Started Trip; new map entity.

**Payload**:

| Field      | Type   |
| ---------- | ------ |
| employeeId | UUID   |
| tripId     | UUID   |
| tripNumber | string |
| lastSeenAt | string |

---

### `tracking:stopped`

**Purpose**: Live tracking ended for Trip context (trip completed or tracking invalidated).

**Payload**:

| Field       | Type   | Description                 |
| ----------- | ------ | --------------------------- |
| tripId      | UUID   |                             |
| tripNumber  | string | Optional enrichment         |
| employeeIds | UUID[] | Affected assigned employees |
| reason      | string | e.g. `TRIP_COMPLETED`       |

---

### `employee:online`

**Purpose**: Tracking status transitioned to Online.

**Payload**:

| Field      | Type   |
| ---------- | ------ |
| employeeId | UUID   |
| tripId     | UUID   |
| lastSeenAt | string |

---

### `employee:offline`

**Purpose**: No recent location within staleness window.

**Payload**:

| Field      | Type   |
| ---------- | ------ |
| employeeId | UUID   |
| tripId     | UUID   | Nullable if trip already cleared |
| lastSeenAt | string | Last known timestamp             |

---

### `error`

**Purpose**: Business or validation failure on client message.

**Payload**:

| Field   | Type   |
| ------- | ------ |
| code    | string | Aligns with REST error codes |
| message | string | Safe client text             |

## Authorization scope per event

| Event                     | Employee | Manager/Owner         | Super Admin        |
| ------------------------- | -------- | --------------------- | ------------------ |
| `location:update`         | Own only | —                     | —                  |
| `subscribe:company`       | —        | Own company           | —                  |
| `subscribe:trip`          | —        | Own company           | —                  |
| `subscribe:admin-company` | —        | —                     | Any company        |
| Downlink events           | —        | Authorized rooms only | Subscribed company |

Employees MUST NOT receive other employees' location events.
