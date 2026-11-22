# Quickstart & Validation: Roadmap Phase 1 — Local Foundation

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This guide proves Phase 1 works end to end. It is the acceptance script for the phase report;
the full developer guide lives in the repository `README.md` (FR-021). Commands are for
PowerShell on Windows; they also work in bash unless noted.

## Prerequisites

Node.js 22 (`>=22.13`), npm 10, Docker with Compose v2, Git, JDK 17, Android SDK
(`ANDROID_HOME` set), and an Android emulator or device on **Android 8.0 (API 26) or newer**.
See [research.md R1](./research.md#r1-developer-machine-baseline).

## 1. Setup (target: ≤ 30 minutes from clean clone — SC-001)

```powershell
git clone <repo-url> TrueSee; cd TrueSee
Copy-Item .env.example .env
Copy-Item TrueSeeBE/.env.example TrueSeeBE/.env
Copy-Item TrueSeeFE/.env.example TrueSeeFE/.env
docker compose up -d            # starts PostgreSQL; wait until "healthy"
cd TrueSeeBE; npm ci; npx prisma migrate deploy
```

**Expected**: the migrate output lists `00000000000000_baseline` as applied.

## 2. Validation scenarios

### V1 — Migration is idempotent (US1-AS2, SC-004)

```powershell
npx prisma migrate deploy; npx prisma migrate status
```

**Expected**: "No pending migrations to apply" and "Database schema is up to date". The database
contains only `_prisma_migrations` (no domain tables — SC-006).

### V2 — Backend starts and connects (US1-AS3)

```powershell
npm run start:dev
```

**Expected**: a log line reporting a successful database connection showing only
`host:port/database` — no password or full URL (FR-008).

### V3 — Liveness endpoint (FR-009a)

```powershell
curl.exe -i http://localhost:3000/api/v1/health
```

**Expected**: `200`, body `{"status":"ok","database":"up"}`, an `X-Request-Id` header, response in
under 2 s. Compare against [contracts/health.openapi.yaml](./contracts/health.openapi.yaml).
Swagger UI is available at `http://localhost:3000/api/docs`.

### V4 — Database down while backend runs (edge case)

```powershell
docker compose stop db
curl.exe -i http://localhost:3000/api/v1/health
docker compose start db
```

**Expected**: `503`, body `{"status":"degraded","database":"down"}`, within 2 s.

### V5 — Fail-fast startup (US1-AS4, US1-AS5)

1. Stop the backend, remove `DATABASE_URL` from `TrueSeeBE/.env`, run `npm run start:dev`.
   **Expected**: exits with an error naming `DATABASE_URL` (code `CONFIG_INVALID`). Restore it.
2. Run `docker compose stop db`, then `npm run start:dev`.
   **Expected**: exits within ~30 s with code `DATABASE_UNREACHABLE`; never hangs. Restart the
   database afterwards.

### V6 — Error envelope and log format (FR-008a, SC-008)

```powershell
curl.exe -i -H "Authorization: Bearer abc" http://localhost:3000/api/v1/does-not-exist
```

**Expected**: `404` with `{"error":{"code":"NOT_FOUND",...,"requestId":"<uuid>"}}`; the backend log
entry for this request carries the same `reqId`, and the authorization header value is
`[REDACTED]`. See [contracts/logging.md](./contracts/logging.md).

### V7 — Mobile app shell on Android (US2, SC-002)

In `TrueSeeFE/.env` set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api/v1` (emulator) or
`http://<PC LAN IP>:3000/api/v1` (physical device on the same Wi-Fi).

```powershell
cd ../TrueSeeFE; npm ci; npx expo run:android
```

Check the three setups against
[contracts/mobile-app-shell.md](./contracts/mobile-app-shell.md), cold-launching the app 3 times
in each:

| Setup | Expected text (≤ 10 s) |
| --- | --- |
| Backend + database running | `Backend: reachable` |
| Backend running, `docker compose stop db` | `Backend: reachable, database unavailable` |
| Backend stopped | `Backend: unreachable` (Retry works after restarting backend) |

Also confirm: no other screens, tabs, or navigation exist (US2-AS5); changing
`EXPO_PUBLIC_API_BASE_URL` and restarting the bundler changes the target without code changes
(US2-AS6).

### V8 — Quality checks locally (FR-016, FR-017)

In each of `TrueSeeBE/` and `TrueSeeFE/`:

```powershell
npm run typecheck; npm run lint; npm run format:check; npm test
```

Backend integration tests additionally: `npm run test:integration` (requires the database).
**Expected**: zero errors; all tests pass.

### V9 — CI gate (US3, SC-003)

Push to `main` on GitHub. **Expected**: both `backend` and `mobile` jobs pass in ≤ 15 minutes.
Then push three throwaway commits (type error, lint error, failing test), confirm each fails the
right job, and revert them.

### V10 — Secrets and scope review (SC-005, SC-006, SC-007)

```powershell
git ls-files | Select-String -Pattern '(^|/)\.env$'   # expected: no output
```

Confirm every variable read in code appears in the matching `.env.example`; confirm no
dependency, table, endpoint, module, screen, or route from Phases 2–16 exists (see research.md
"Explicitly not added"); answer the 5 architecture questions from `ARCHITECTURE.md`, `README.md`
and the `.env.example` files alone.
