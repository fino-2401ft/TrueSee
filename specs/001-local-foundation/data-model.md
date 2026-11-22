# Data Model: Roadmap Phase 1 — Local Foundation

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-22

Phase 1 has **no domain entities and no domain tables** (FR-011, Constitution I). The Prisma
schema declares a datasource and generator only. The "entities" below are configuration and
runtime value objects needed to test Phase 1 behaviour.

## 1. Backend Environment Configuration

Validated once at startup (Zod schema). Any violation aborts startup and names the variable
(FR-006).

| Variable | Type / allowed values | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | `development` \| `test` | yes | — | Phase 1 environments only (research R16) |
| `PORT` | integer 1–65535 | no | `3000` | |
| `HOST` | string | no | `0.0.0.0` | LAN access for physical devices |
| `DATABASE_URL` | `postgresql://` URL | yes | — | Never logged (FR-008) |
| `DB_CONNECT_TIMEOUT_MS` | integer 1000–120000 | no | `30000` | Startup fail-fast bound (FR-007) |
| `HEALTH_DB_TIMEOUT_MS` | integer 100–1900 | no | `1500` | Must stay < 2000 to meet FR-009a |
| `LOG_FORMAT` | `pretty` \| `json` | no | `pretty` if development, else `json` | FR-008a |
| `LOG_LEVEL` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` | no | `info` | |

## 2. Mobile App Configuration

Inlined at bundle time; **public values only** (no secrets may ever be placed here).

| Variable | Type / allowed values | Required | Notes |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | absolute `http(s)://` URL ending in `/api/v1`, no trailing slash | yes | Emulator: `http://10.0.2.2:3000/api/v1`; device: LAN IP |
| `EXPO_PUBLIC_APP_ENV` | `development` \| `test` | yes | Shown on the app shell (FR-013) |

Invalid or missing values: the app shell shows a configuration error message naming the variable
instead of attempting a request.

## 3. Docker Compose Database Configuration (repository root)

| Variable | Default | Notes |
| --- | --- | --- |
| `POSTGRES_USER` | `truesee` | Local only |
| `POSTGRES_PASSWORD` | `truesee_dev_password` | Local only; placeholder, not a real secret |
| `POSTGRES_DB` | `truesee` | Development database |
| `POSTGRES_PORT` | `5432` | Host port; change if already in use (edge case) |

An init script also creates `truesee_test` for automated tests.

## 4. Migration History

- Managed by Prisma in table `_prisma_migrations` (bookkeeping only, not a domain table).
- Phase 1 contains exactly one migration: `00000000000000_baseline` (SQL comment only).
- Rules: applying to an empty DB records the baseline; re-applying reports no pending migrations
  and changes nothing (SC-004).

## 5. Health Status (backend response value)

| Field | Values | Rule |
| --- | --- | --- |
| `status` | `ok` \| `degraded` | `ok` iff database check succeeded within `HEALTH_DB_TIMEOUT_MS` |
| `database` | `up` \| `down` | `down` on error or timeout |

HTTP status: `200` when `ok`, `503` when `degraded`. No other fields (Constitution V).

## 6. Connection State (mobile domain value)

Derived purely from the outcome of one liveness request (FR-013).

| Outcome of request | Connection state | Text shown |
| --- | --- | --- |
| HTTP 200 with `status: "ok"` | `reachable` | "Backend: reachable" |
| HTTP 503 | `databaseUnavailable` | "Backend: reachable, database unavailable" |
| Timeout (> 10 s), network error, any other status, or malformed body | `unreachable` | "Backend: unreachable" |

### State transitions

```text
[app opens] ──► checking ──► reachable
                   │   ├──► databaseUnavailable
                   │   └──► unreachable
                   ▲
[retry tapped] ────┘   (retry is available from every non-checking state)
```

- Only one request is in flight at a time; retry is disabled while `checking`.
- A configuration error (section 2) is a separate terminal state `misconfigured` with no request.

## 7. Error Envelope (backend, all non-health errors)

| Field | Type | Notes |
| --- | --- | --- |
| `error.code` | string enum | Phase 1: `NOT_FOUND`, `INTERNAL_ERROR` |
| `error.message` | string | Human-readable; clients MUST NOT branch on it |
| `error.requestId` | string (UUID) | Same value as `X-Request-Id` header |
