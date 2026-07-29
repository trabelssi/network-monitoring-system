# Phase 2 — Python Protocol Service (Revised, based on actual repo scan)

Confirmed repo facts this plan is built on:
- Two parallel discovery architectures currently exist:
  - **SancellaDiscoveryService** — writes directly to `device` table. Used by
    the scheduled jobs (`DiscoverNetworkDevices`, `MonitorDeviceStatus`).
  - **DeviceDiscoveryService** — writes to a `discovery_queue` staging table;
    `AutoAssignmentService` then classifies (department/unit/user) and
    promotes into `device`. Used by the UI-triggered flow.
  - These are not standardized — one of the first Phase 2 decisions is which
    one survives.
- SNMP: native PHP `\SNMP` extension (not shell-based), OIDs limited to
  sysDescr/sysName/sysLocation/sysContact/sysObjectID. `config/snmp.php`
  already defines more OIDs (sysUpTime, sysServices) that aren't polled yet.
- ICMP: shells out to the system `ping` binary via `exec()`, and only ever
  checks the return code — response time is never parsed out or stored
  anywhere (confirmed in the Phase 3 repo scan: `PingService` and
  `SancellaDiscoveryService` both discard it).
- Subnets are hardcoded in `app/Jobs/DiscoverNetworkDevices.php` — no config
  table or file.
- **Bug found:** `MonitorDeviceStatus` reads `$device->icmp_status`, but the
  `device` table only has `is_alive`. This job is currently broken or silently
  no-op-ing on that field.
- `WapMonitoringService` is scheduled every 5 minutes but the file does not
  exist in the codebase — scheduler will throw on that tick.
- No automated task creation from device events exists — `Task` is only ever
  created manually via `TaskController::store()`.
- Notifications use Laravel's built-in `Notification` classes (`database` +
  `mail` channels), e.g. `GeneralNotification` for device alerts.
- Relevant shared tables: `device`, `device_status_history`,
  `discovery_queue`, `department`, `unite_materiel`, `tasks`, `notifications`.

---

## Step 0 — Fix before migrating anything (bugs, not architecture)

These are pre-existing bugs independent of the Python migration, but should
be fixed as part of this phase since Python will be writing into the same
tables and would otherwise inherit the same inconsistencies:

1. Fix `MonitorDeviceStatus`'s `icmp_status` → `is_alive` field mismatch.
2. Either implement `WapMonitoringService` or remove it from the scheduler —
   currently referencing a class that doesn't exist.
3. Decide and standardize on **one** discovery architecture. Recommendation:
   keep the **queue-based** flow (`discovery_queue` → `AutoAssignmentService`
   → `device`) as the standard, and retire `SancellaDiscoveryService`. The
   staging-table pattern is the better fit for a Python writer, since it
   avoids the Python service needing to duplicate the 14-scenario
   classification logic in `AutoAssignmentService` — that logic stays in
   Laravel, where it already lives and is tightly coupled to the
   `Department`/`UniteMatériel` Eloquent models.

## Step 1 — Scaffold the Python service

New standalone service (FastAPI recommended), own container, own MySQL
connection to the **same** database (no new schema needed — see Step 4).

## Step 2 — Port SNMP polling

Use `pysnmp` to replicate (then extend) what `\SNMP` currently queries:
sysDescr, sysName, sysLocation, sysContact, sysObjectID — plus the
already-configured-but-unused sysUpTime and sysServices, and optionally
interface counters, since `config/snmp.php` shows OIDs are already
anticipated for this.

## Step 3 — Port ICMP polling (updated: capture RTT, don't discard it)

Replace the `exec("ping ...")` approach with a native async implementation
(e.g. `icmplib` or raw sockets), which also fixes the current
one-ping-at-a-time blocking behavior — this matters directly for the
`MonitorDeviceStatus` job, which currently loops through devices in chunks
of 50 doing a blocking shell ping each.

**Change from the original plan:** the PHP version only ever returns a
boolean (online/offline) and throws away the round-trip time. When this
is ported to Python, keep the RTT value from every ping instead of
discarding it — don't just replicate the old boolean-only behavior. This
single change is what makes Phase 3's `device_response_time_ms` Prometheus
metric possible; there is no separate "add latency capture" task later,
it's a one-line addition here since the polling logic is already being
rewritten in this step.

## Step 4 — Where Python writes

Following the queue-based architecture decision in Step 0:
- Python writes new discoveries to `discovery_queue` (status `pending`),
  exactly like `DeviceDiscoveryService` does today.
- Python writes status transitions to `device_status_history` and updates
  `device.is_alive` / `device.last_seen` directly, replicating what
  `PingService` does today.
- Python does **not** touch `AutoAssignmentService`'s job — classification
  (department/unit/user matching) stays in Laravel, reading from
  `discovery_queue` exactly as it does now. No new tables needed; Python
  and Laravel share the existing schema.
- The RTT captured in Step 3 is **not** written to any MySQL table — it's
  held in memory and exposed via the Python service's `/metrics` endpoint
  (Phase 3), scraped by Prometheus. `device_status_history` stays exactly
  as it is today (sparse, status-change-only); it is not being repurposed
  into a metrics table.

## Step 5 — Subnet targets

Replace the hardcoded array in `DiscoverNetworkDevices` with a
`monitored_subnets` table (`subnet`, `name`, `enabled`), shared between
Laravel (for management via UI later, if wanted) and Python (which reads
it as the source of truth for what to scan). Removes the hardcoding
without inventing a separate Python-only config system.

## Step 6 — Trap / syslog listener

New in Python: SNMP trap receiver (UDP 162) and/or syslog listener
(UDP 514). On event:
1. Write to `device_status_history` directly (same as polling-based
   detection).
2. Call a new Laravel API endpoint (see Step 7) rather than writing to
   `tasks`/`notifications` directly — those need Laravel's queue/mail
   pipeline, not a raw DB insert.

## Step 7 — New Laravel-side pieces Python calls into

Two things need to be built in Laravel that don't exist yet:
1. `TaskService::createFromDeviceEvent(Device $device, string $eventType, string $details)`
   — wraps `Task::create()` with sensible defaults (priority by event
   severity, assigned to a network-admin user), called from a new internal
   API endpoint.
2. A small internal API route (e.g. `POST /api/internal/device-events`)
   that Python calls with `{device_id, event_type, severity, message}`.
   Handler calls `TaskService::createFromDeviceEvent()` and fires the
   existing `GeneralNotification` — reusing what's already there instead
   of building a parallel notification path.

This is Option 2 from the scan (HTTP API call) rather than Option 1 (queue
push) or Option 3 (direct DB insert) — HTTP keeps the Python service from
needing to know Laravel's internal job/queue serialization format, and
avoids bypassing Laravel's notification pipeline the way a raw DB insert
would.

This same endpoint is reused in Phase 3: Alertmanager's webhook receiver
points at it too, so Prometheus-detected alerts flow through the identical
`TaskService`/`GeneralNotification` pipeline as trap/syslog events, instead
of a second parallel notification path.

## Step 8 — Python-side CI

Add `pytest` + `ruff`/`black` to the GitHub Actions workflow set up in
Phase 1.

---

## What moves to Python vs. what stays in Laravel

| Stays in Laravel | Moves to Python |
|---|---|
| `AutoAssignmentService` (14-scenario classification) | SNMP polling (sysDescr, sysName, etc.) |
| `Department` / `UniteMatériel` models & logic | ICMP polling (async, replacing shell `ping`, now keeping RTT) |
| `TaskService` (new) | Trap/syslog listener (new) |
| Notifications (`GeneralNotification`, etc.) | Writing to `discovery_queue` and `device_status_history` |
| Task/ticketing UI and models | Subnet-driven scan scheduling |
| | `/metrics` endpoint (Prometheus exposition — see Phase 3) |

---

## Order to execute

Step 0 (bug fixes + architecture decision) → Step 1 → Steps 2-3 (polling
logic, RTT now captured) → Step 4 (write targets) → Step 5 (subnet config)
→ Steps 6-7 (event pipeline) → Step 8 (CI). Step 0 is not optional —
building Python polling on top of the `icmp_status` bug or the
dual-architecture ambiguity would just move the existing inconsistency
into two codebases instead of one.
