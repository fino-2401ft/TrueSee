---

description: "Task list for Roadmap Phase 1 — Local Foundation"
---

# Tasks: Roadmap Phase 1 — Local Foundation

**Input**: Design documents from `specs/001-local-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED. Constitution Principle VII mandates test-first for core logic and integration
tests for every endpoint. Test tasks in each story MUST be written and seen failing before the
implementation tasks they cover.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified
independently.

**Remote repository**: `https://github.com/fino-2401ft/TrueSee` (owner-provided, branch `main`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story from spec.md (US1–US4)
- Paths are relative to the repository root `TrueSee/`

## Path Conventions

- Backend: `TrueSeeBE/src/`, `TrueSeeBE/test/`, `TrueSeeBE/prisma/`
- Mobile: `TrueSeeFE/src/`, `TrueSeeFE/__tests__/`
- Repository-level: root files, `.github/`, `docker/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Version control, both project skeletons, and shared tooling. Version pins come from
research.md (R1–R4, R11, R13, R14).

- [X] T001 Initialize Git in the repository root with default branch `main`, add remote `origin` = `https://github.com/fino-2401ft/TrueSee.git`; do not modify `prd.md`, `.specify/`, `.cursor/`, or `specs/` (FR-001, FR-002)
- [X] T002 [P] Create root `.gitignore` covering `.env` (any directory), `node_modules/`, `dist/`, `coverage/`, `.expo/`, `TrueSeeFE/android/`, `TrueSeeFE/ios/`, `*.log`, and local database data; keep `!.env.example` tracked (FR-002, research R11)
- [X] T003 [P] Create root `.gitattributes` (`* text=auto eol=lf`) and `.editorconfig` (UTF-8, LF, 2-space indent) (research R14, Windows line-ending edge case)
- [X] T004 Scaffold the backend with `@nestjs/cli@12.0.15` into `TrueSeeBE/` (npm, no Git init, strict mode); delete the sample `AppController`/`AppService` and their spec files (FR-005, FR-009)
- [X] T005 Pin backend dependencies to exact versions in `TrueSeeBE/package.json` per research.md "Dependency justification" (NestJS 12.6.x, `@nestjs/config` 12.1.1, `zod` 4.6.7, `@nestjs/swagger` 12.1.2, `prisma`/`@prisma/client`/`@prisma/adapter-pg` 7.10.x, `pg`, `nestjs-pino` 5.3.2, `pino-http` 11.0.0, dev: `pino-pretty` 13.2.0, `typescript` 6.0.3, `jest` 30.5.2, `ts-jest`, `supertest` 7.3.2, `eslint` 10.15.0, `typescript-eslint` 8.73.0, `eslint-config-prettier`, `prettier` 3.10.1); add `"engines": {"node": ">=22.13 <23"}`; run `npm install` to produce `TrueSeeBE/package-lock.json` (FR-004)
- [X] T006 Scaffold the mobile app with `create-expo-app` `--template blank-typescript` (Expo SDK 58) into `TrueSeeFE/`; confirm no `expo-router` or sample tabs are present (FR-012, FR-015, research R11)
- [X] T007 Pin mobile dependencies to exact versions in `TrueSeeFE/package.json`: add `expo-dev-client` and `expo-build-properties` via `npx expo install` (SDK-compatible versions, then pin exact), dev: `typescript` 6.0.3, `jest` 30.5.2, `jest-expo` 58.0.15, `@testing-library/react-native` 14.1.0, `eslint` 10.15.0, `typescript-eslint` 8.73.0, `eslint-config-prettier`, `prettier` 3.10.1; add `"engines"` as in T005; commit `TrueSeeFE/package-lock.json` (FR-004)
- [X] T008 [P] Configure strict TypeScript in `TrueSeeBE/tsconfig.json` and `TrueSeeBE/tsconfig.build.json` (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `noImplicitOverride`) (FR-005, Constitution VIII)
- [X] T009 [P] Configure strict TypeScript in `TrueSeeFE/tsconfig.json` extending `expo/tsconfig.base` with the same strict flags as T008 (FR-012)
- [X] T010 [P] Add ESLint flat config `TrueSeeBE/eslint.config.mjs` (typescript-eslint type-aware recommended + `eslint-config-prettier`) and `TrueSeeBE/.prettierrc` (FR-016)
- [X] T011 [P] Add ESLint flat config `TrueSeeFE/eslint.config.mjs` (typescript-eslint type-aware recommended + React/React Native rules from Expo's flat config if compatible + `eslint-config-prettier`) and `TrueSeeFE/.prettierrc` (FR-016)
- [X] T012 [P] Add npm scripts to `TrueSeeBE/package.json`: `typecheck`, `lint` (`eslint . --max-warnings=0`), `format`, `format:check`, `test` (unit), `test:integration`, `start:dev`, `build`, `prisma:migrate` (`prisma migrate deploy`), `prisma:status` (FR-016, FR-017)
- [X] T013 [P] Add npm scripts to `TrueSeeFE/package.json`: `typecheck`, `lint` (`eslint . --max-warnings=0`), `format`, `format:check`, `test`, `android` (`expo run:android`) (FR-016, FR-017)
- [X] T014 [P] Configure Jest for the backend in `TrueSeeBE/jest.config.ts` with two projects: `unit` (`test/unit/**/*.spec.ts`) and `integration` (`test/integration/**/*.spec.ts`, `globalSetup: test/global-setup.ts`) (FR-017, research R10)
- [X] T015 [P] Configure Jest for the mobile app in `TrueSeeFE/jest.config.js` with preset `jest-expo` and tests under `TrueSeeFE/__tests__/` (FR-017, research R13)

**Checkpoint**: Both projects install with `npm ci`; `typecheck`, `lint`, `format:check` pass on the empty skeletons.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Local database and environment templates that US1 and US2 need.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T016 Create `docker-compose.yml` at the root with service `db` (`postgres:18-alpine`), env from root `.env` with defaults per data-model.md `Docker Compose Database Configuration.POSTGRES_USER`, `.POSTGRES_PASSWORD`, `.POSTGRES_DB`, `.POSTGRES_PORT` (host port mapping), named volume `truesee_pgdata`, `pg_isready` healthcheck, and mount `docker/postgres/init/` to `/docker-entrypoint-initdb.d` (FR-010, research D2)
- [X] T017 [P] Create `docker/postgres/init/01-create-test-db.sql` that creates database `truesee_test` owned by `POSTGRES_USER` (data-model.md §3, research R10)
- [X] T018 [P] Create root `.env.example` listing data-model.md `Docker Compose Database Configuration.POSTGRES_USER`, `.POSTGRES_PASSWORD`, `.POSTGRES_DB`, `.POSTGRES_PORT`, each with a one-line description and the non-secret default (FR-020, research R16)
- [X] T019 [P] Create `TrueSeeBE/.env.example` listing every variable in data-model.md `Backend Environment Configuration` (`NODE_ENV`, `PORT`, `HOST`, `DATABASE_URL`, `DB_CONNECT_TIMEOUT_MS`, `HEALTH_DB_TIMEOUT_MS`, `LOG_FORMAT`, `LOG_LEVEL`) with descriptions and placeholders; `DATABASE_URL` points at the local Compose database (FR-020)
- [X] T020 [P] Create `TrueSeeFE/.env.example` listing data-model.md `Mobile App Configuration.EXPO_PUBLIC_API_BASE_URL` (emulator value `http://10.0.2.2:3000/api/v1`, with a comment for the LAN-IP device case) and `Mobile App Configuration.EXPO_PUBLIC_APP_ENV`, plus a header comment that these values are public and must never hold secrets (FR-014, FR-020, research R12)
- [X] T021 Verify `docker compose up -d` brings `db` to `healthy` and both `truesee` and `truesee_test` databases exist (quickstart §1)

**Checkpoint**: Database runs locally with one command; all env templates exist.

---

## Phase 3: User Story 1 — Run the backend and database locally (Priority: P1) 🎯 MVP

**Goal**: Backend boots with validated config, fails fast when misconfigured or the DB is
unreachable, applies an idempotent baseline migration, logs structurally without secrets, and
serves the liveness endpoint and error envelope.

**Independent Test**: quickstart.md V1–V6 pass on a clean clone.

### Tests for User Story 1 (write first, confirm they FAIL) ⚠️

- [X] T022 [P] [US1] Unit tests for the env schema in `TrueSeeBE/test/unit/config/env.schema.spec.ts`: valid config parses with defaults; each required field missing → error naming it; out-of-range values rejected for data-model.md `Backend Environment Configuration.NODE_ENV`, `.PORT`, `.HOST` (any non-empty string accepted, default `0.0.0.0`), `.DATABASE_URL`, `.DB_CONNECT_TIMEOUT_MS`, `.HEALTH_DB_TIMEOUT_MS`, `.LOG_FORMAT`, `.LOG_LEVEL`; `LOG_FORMAT` default derives from `NODE_ENV` (FR-006)
- [X] T023 [P] [US1] Unit tests for log redaction in `TrueSeeBE/test/unit/logging/redaction.spec.ts`: every key in contracts/logging.md "Redaction rule" is replaced with `[REDACTED]` in headers, body, and top-level objects; request ID uses a valid incoming UUID `X-Request-Id` and replaces invalid ones (FR-008, FR-008a, SC-008)
- [X] T024 [P] [US1] Unit tests for the global exception filter in `TrueSeeBE/test/unit/common/http-exception.filter.spec.ts`: unknown route → `NOT_FOUND`, unexpected error → `INTERNAL_ERROR` with no stack trace in the body; body matches data-model.md `Error Envelope.error.code`, `.error.message`, `.error.requestId` (research R7)
- [X] T025 [P] [US1] Unit tests for the health service in `TrueSeeBE/test/unit/health/health.service.spec.ts` with a fake DB: success → data-model.md `Health Status.status`=`ok` and `.database`=`up`; DB error or DB call slower than `HEALTH_DB_TIMEOUT_MS` → `degraded`/`down` returned before the timeout plus a small margin (FR-009a)
- [X] T026 [P] [US1] Unit tests for startup DB connection in `TrueSeeBE/test/unit/database/connect-with-timeout.spec.ts`: retries every 2 s, succeeds when DB becomes available, throws `DATABASE_UNREACHABLE` after `DB_CONNECT_TIMEOUT_MS` (use fake timers) (FR-007, research R5)
- [X] T027 [P] [US1] Integration test for the healthy case in `TrueSeeBE/test/integration/health.spec.ts`: `GET /api/v1/health` against `truesee_test` → 200, body exactly `{status:"ok",database:"up"}`, `X-Request-Id` header is a UUID, response < 2 s; validate body against `contracts/health.openapi.yaml` schema `HealthStatus` (FR-009a)
- [X] T028 [P] [US1] Integration test for the database-down case in `TrueSeeBE/test/integration/health-db-down.spec.ts`: app built with `DATABASE_URL` pointing to a closed local port and startup DB check bypassed via the test module → 503 `{status:"degraded",database:"down"}` within 2 s (FR-009a, edge case)
- [X] T029 [P] [US1] Integration test in `TrueSeeBE/test/integration/errors-and-logging.spec.ts`: unknown route → 404 error envelope whose `requestId` equals the `X-Request-Id` header; with `LOG_FORMAT=json`, captured log lines all have `time`, `level`, `msg`, request-scoped lines share that `reqId`, and an `Authorization` header value appears only as `[REDACTED]`; a request to `/api/v1/health` with an invalid `X-Request-Id` (e.g. `not-a-uuid`) responds with a newly generated UUID in `X-Request-Id` and that UUID is the `reqId` in the logs (Constitution VII "validation failure" case) (FR-008a, SC-008, contracts/logging.md)
- [X] T030 [US1] Create `TrueSeeBE/test/global-setup.ts` that runs `prisma migrate deploy` against the test database URL (`truesee_test`) before integration tests (research R10)

### Implementation for User Story 1

- [X] T031 [P] [US1] Implement the Zod env schema and typed config service in `TrueSeeBE/src/config/env.schema.ts` and `TrueSeeBE/src/config/config.module.ts` per data-model.md `Backend Environment Configuration.NODE_ENV`, `.PORT`, `.HOST`, `.DATABASE_URL`, `.DB_CONNECT_TIMEOUT_MS`, `.HEALTH_DB_TIMEOUT_MS`, `.LOG_FORMAT`, `.LOG_LEVEL`; on failure log code `CONFIG_INVALID` with the variable name and exit 1 (FR-006) — makes T022 pass
- [X] T032 [P] [US1] Implement logging in `TrueSeeBE/src/logging/logging.module.ts` and `TrueSeeBE/src/logging/redaction.ts` using `nestjs-pino`: format from data-model.md `Backend Environment Configuration.LOG_FORMAT`, level from `.LOG_LEVEL`, UTC ISO `time`, central redact list from contracts/logging.md, request-ID generator, health requests at `debug` (FR-008, FR-008a) — makes T023 pass
- [X] T033 [P] [US1] Implement the global exception filter and error codes in `TrueSeeBE/src/common/http-exception.filter.ts` and `TrueSeeBE/src/common/error-codes.ts` (`NOT_FOUND`, `INTERNAL_ERROR`) per data-model.md `Error Envelope.error.code`, `Error Envelope.error.message`, and `Error Envelope.error.requestId` (requestId taken from the request's `reqId`) (research R7) — makes T024 pass
- [X] T034 [US1] Create `TrueSeeBE/prisma/schema.prisma` (PostgreSQL datasource, `prisma-client` generator, **no models**) and `TrueSeeBE/prisma.config.ts` reading `DATABASE_URL` (FR-011, research R4)
- [X] T035 [US1] Create the baseline migration `TrueSeeBE/prisma/migrations/00000000000000_baseline/migration.sql` containing only an explanatory SQL comment, plus `TrueSeeBE/prisma/migrations/migration_lock.toml` (provider `postgresql`); verify data-model.md `Migration History` rules: first `migrate deploy` applies it, second reports no pending migrations (FR-011, SC-004)
- [X] T036 [US1] Implement `TrueSeeBE/src/database/prisma.service.ts`, `TrueSeeBE/src/database/connect-with-timeout.ts`, and `TrueSeeBE/src/database/database.module.ts`: Prisma client with `@prisma/adapter-pg`, startup connect + `SELECT 1` with retry until data-model.md `Backend Environment Configuration.DB_CONNECT_TIMEOUT_MS`, log only `host:port/database` derived from `Backend Environment Configuration.DATABASE_URL` on success, `DATABASE_UNREACHABLE` + exit 1 on failure (FR-007, FR-008) — makes T026 pass
- [X] T037 [US1] Implement `TrueSeeBE/src/health/health.service.ts` (race `SELECT 1` against data-model.md `Backend Environment Configuration.HEALTH_DB_TIMEOUT_MS`) and thin `TrueSeeBE/src/health/health.controller.ts` (`GET /health`, 200 or 503 per data-model.md `Health Status.status` and `.database`, Swagger decorators matching `contracts/health.openapi.yaml`, no auth guard, no writes) in `TrueSeeBE/src/health/health.module.ts` (FR-009, FR-009a, Constitution V v1.0.1) — makes T025 pass
- [X] T038 [US1] Wire `TrueSeeBE/src/app.module.ts` (config, logging, database, health modules; global filter) and `TrueSeeBE/src/main.ts` (global prefix `/api/v1`, Swagger UI at `/api/docs` only when `Backend Environment Configuration.NODE_ENV` is `development`, listen on data-model.md `Backend Environment Configuration.HOST`:`.PORT`, no CORS) (FR-005, research R9) — makes T027–T029 pass
- [X] T039 [US1] Run quickstart.md V1–V6 manually against the Compose database and record results for the phase report

**Checkpoint**: US1 complete — backend runs locally, all backend unit and integration tests pass.

---

## Phase 4: User Story 2 — Launch the mobile app shell on Android (Priority: P1)

**Goal**: An Expo development build on Android 8.0+ shows "TrueSee", the environment, and one of
three backend connection states with Retry, and nothing else.

**Independent Test**: quickstart.md V7. Unit/component tests run without a backend (mocked
`fetch`); the live device check needs US1's health endpoint running.

### Tests for User Story 2 (write first, confirm they FAIL) ⚠️

- [X] T040 [P] [US2] Unit tests for the config validator in `TrueSeeFE/__tests__/infrastructure/config.test.ts`: accepts valid values; missing/invalid data-model.md `Mobile App Configuration.EXPO_PUBLIC_API_BASE_URL` (non-absolute, trailing slash, not ending in `/api/v1`) or `.EXPO_PUBLIC_APP_ENV` returns an error naming the variable (FR-014)
- [X] T041 [P] [US2] Unit tests for connection-state mapping in `TrueSeeFE/__tests__/domain/connectionState.test.ts` covering every row of data-model.md §6 (`Connection State`): 200+`ok` → `reachable`; 503 → `databaseUnavailable`; timeout, network error, other status, malformed body → `unreachable` (FR-013)
- [X] T042 [P] [US2] Unit tests for the health client in `TrueSeeFE/__tests__/infrastructure/healthClient.test.ts` with mocked `fetch`: calls `{EXPO_PUBLIC_API_BASE_URL}/health`; aborts after 10 s (fake timers) and reports a timeout outcome (FR-013)
- [X] T043 [P] [US2] Unit tests for the use case in `TrueSeeFE/__tests__/application/checkBackendStatus.test.ts`: returns the mapped state from the client outcome; a second call while one is in flight does not start another request (data-model.md §6 transitions)
- [X] T044 [P] [US2] Component tests for the screen in `TrueSeeFE/__tests__/presentation/AppShellScreen.test.tsx` using test IDs from contracts/mobile-app-shell.md: renders title and environment; shows `Checking backend…` then each exact state text; Retry hidden while `checking`/`misconfigured`, visible otherwise, and re-runs the check; `misconfigured` text names the variable; no other buttons or navigation elements exist (FR-013, US2-AS5)

### Implementation for User Story 2

- [X] T045 [P] [US2] Configure `TrueSeeFE/app.json`: name/slug `TrueSee`, Android `package` and iOS `bundleIdentifier` (e.g. `com.truesee.app`), `expo-dev-client` and `expo-build-properties` plugins with `android.minSdkVersion: 26` (FR-012, research R11)
- [X] T046 [P] [US2] Implement the config validator in `TrueSeeFE/src/infrastructure/config.ts` reading `process.env.EXPO_PUBLIC_API_BASE_URL` and `process.env.EXPO_PUBLIC_APP_ENV` per data-model.md `Mobile App Configuration.EXPO_PUBLIC_API_BASE_URL` and `Mobile App Configuration.EXPO_PUBLIC_APP_ENV` (FR-014) — makes T040 pass
- [X] T047 [P] [US2] Implement pure types and mapping in `TrueSeeFE/src/domain/connectionState.ts` per data-model.md §6 `Connection State` (no React/Expo imports, Constitution II) (FR-013) — makes T041 pass
- [X] T048 [US2] Implement `TrueSeeFE/src/infrastructure/healthClient.ts` with `fetch` + `AbortController` (10 s timeout) returning a raw outcome (status + parsed body or error kind) (FR-013) — makes T042 pass
- [X] T049 [US2] Implement `TrueSeeFE/src/application/checkBackendStatus.ts` combining the client and domain mapping with single-flight protection — makes T043 pass
- [X] T050 [US2] Implement `TrueSeeFE/src/presentation/AppShellScreen.tsx` per contracts/mobile-app-shell.md (texts, test IDs, Retry behaviour, `misconfigured` state) using local React state only (no Zustand, FR-015) — makes T044 pass
- [X] T051 [US2] Update `TrueSeeFE/App.tsx` to render only `AppShellScreen` (no router, no other screens) and keep `TrueSeeFE/index.ts` as the entry (FR-013, FR-023)
- [ ] T052 [US2] Build and run on an Android 8.0+ emulator or device with `npx expo run:android`; run quickstart.md V7 (three setups × 3 cold launches) and record results (SC-002)

**Checkpoint**: US2 complete — app shell verified on Android; all mobile tests pass.

---

## Phase 5: User Story 3 — Automated quality gate on every push (Priority: P2)

**Goal**: GitHub Actions runs all checks for both projects on every push to `main` with no
secrets.

**Independent Test**: quickstart.md V9 (one green run, three deliberate failures).

- [ ] T053 [US3] Create `.github/workflows/ci.yml` triggered on `push` to `main` and `pull_request`; job `backend` (working dir `TrueSeeBE`): Node 22 with npm cache keyed on `TrueSeeBE/package-lock.json`, `npm ci`, `typecheck`, `lint`, `format:check`, `postgres:18-alpine` service with placeholder credentials and a `truesee_test` database, `prisma migrate deploy` twice + `prisma migrate status`, `test`, `test:integration`; env values are inline placeholders, no `secrets.*` used (FR-018, FR-019, research R15)
- [ ] T054 [US3] Add job `mobile` to `.github/workflows/ci.yml` (working dir `TrueSeeFE`): Node 22 with npm cache keyed on `TrueSeeFE/package-lock.json`, `npm ci`, `typecheck`, `lint`, `format:check`, `test` with placeholder `EXPO_PUBLIC_*` env values (FR-018, FR-019)
- [ ] T055 [US3] Make the first commit(s) on `main` using Conventional Commits and push to `origin` (`https://github.com/fino-2401ft/TrueSee`); confirm both CI jobs pass in ≤ 15 minutes (SC-003)
- [ ] T056 [US3] Run the three negative checks from quickstart.md V9 (type error, lint error, failing test) on throwaway commits, confirm each fails the correct job, then revert them with normal (non-force) commits and record results (SC-003)

**Checkpoint**: US3 complete — CI is the enforced quality gate.

---

## Phase 6: User Story 4 — Understand the architecture and configuration (Priority: P3)

**Goal**: A newcomer can run and extend the project using only the docs.

**Independent Test**: A reviewer answers the 5 questions in SC-007 from the docs alone.

- [ ] T057 [P] [US4] Write `README.md` (local-run guide): prerequisites with minimum versions incl. Android 8.0 (API 26), clone, copy the three `.env.example` files, `docker compose up -d`, migrate, start backend, run the app on emulator vs physical device (backend address per case), changing `POSTGRES_PORT` if 5432 is taken, and commands for typecheck/lint/format/tests in each project (FR-021)
- [ ] T058 [P] [US4] Write `ARCHITECTURE.md`: repository layout (D1); mobile four layers and inward dependency rule; backend infrastructure modules now and the planned feature-module-per-Roadmap-Phase schedule (listed as planned only); data source-of-truth rules (PostgreSQL authoritative, device storage arrives in Phase 8); chosen state management (Zustand) and navigation (Expo Router) with "installed when first used"; logging and error-envelope conventions; liveness endpoint rule from Constitution V v1.0.1 (FR-022, Constitution III, X)
- [ ] T059 [US4] Cross-check every `process.env` / config read in `TrueSeeBE/src/` and `TrueSeeFE/src/` against the three `.env.example` files and fix gaps (SC-005, US4-AS2)

**Checkpoint**: US4 complete — documentation answers SC-007's questions.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Phase-wide verification and the completion report.

- [ ] T060 [P] Scope review against research.md "Explicitly not added": confirm no Phase 2–16 dependency, table, endpoint, module, screen, or route exists in `TrueSeeBE/` or `TrueSeeFE/` (FR-023, SC-006)
- [ ] T061 [P] Secret review: `git ls-files` shows no `.env`; search tracked files and Git history for passwords/keys beyond documented local placeholders (SC-005)
- [ ] T062 Confirm `prd.md`, `.specify/`, and `.cursor/` are unchanged from their pre-phase content (FR-001)
- [ ] T063 Re-run the full quickstart.md (V1–V10) from a fresh clone of `https://github.com/fino-2401ft/TrueSee` and time the setup (SC-001)
- [ ] T064 Write the Phase 1 completion report (files created/changed, how to run, tests and checks executed with results, Constitution Check re-verification, remaining risks such as unverified iOS build, conflicts found) and stop for owner confirmation (FR-024, Constitution XI)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T001 first; T004 before T005/T008/T010/T012/T014; T006 before T007/T009/T011/T013/T015.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on Foundational. Code and tests are independent of US1; only T052 (live device check) needs US1's health endpoint running.
- **US3 (Phase 5)**: Depends on US1 and US2 code existing (CI runs their tests); T055 needs the GitHub remote from T001.
- **US4 (Phase 6)**: T057–T058 can start after Foundational; T059 needs US1 and US2 code.
- **Polish (Phase 7)**: Depends on all stories.

### Within Each User Story

- Tests are written first and must fail (Constitution VII), then implementation makes them pass.
- US1 order: T022–T029 (tests) → T030 → T031–T033 → T034 → T035 → T036 → T037 → T038 → T039.
- US2 order: T040–T044 (tests) → T045–T047 → T048 → T049 → T050 → T051 → T052.

### Parallel Opportunities

- Setup: T002, T003 in parallel; backend chain (T004…) and mobile chain (T006…) in parallel.
- Foundational: T017–T020 in parallel after T016 starts.
- US1: all test tasks T022–T029 in parallel; T031–T033 in parallel.
- US2: all test tasks T040–T044 in parallel; T045–T047 in parallel.
- US1 and US2 can proceed in parallel after Foundational.
- US4: T057 and T058 in parallel.

---

## Parallel Example: User Story 1

```text
Task: "Unit tests for env schema in TrueSeeBE/test/unit/config/env.schema.spec.ts"
Task: "Unit tests for log redaction in TrueSeeBE/test/unit/logging/redaction.spec.ts"
Task: "Unit tests for exception filter in TrueSeeBE/test/unit/common/http-exception.filter.spec.ts"
Task: "Unit tests for health service in TrueSeeBE/test/unit/health/health.service.spec.ts"
Task: "Integration test for healthy case in TrueSeeBE/test/integration/health.spec.ts"
```

## Parallel Example: User Story 2

```text
Task: "Unit tests for config validator in TrueSeeFE/__tests__/infrastructure/config.test.ts"
Task: "Unit tests for connection-state mapping in TrueSeeFE/__tests__/domain/connectionState.test.ts"
Task: "Component tests in TrueSeeFE/__tests__/presentation/AppShellScreen.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 (US1) → **STOP and VALIDATE** with quickstart.md V1–V6.

### Incremental Delivery

1. Setup + Foundational → database runs.
2. US1 → backend verified (MVP).
3. US2 → app shell verified on Android against the US1 backend.
4. US3 → CI enforces everything on GitHub.
5. US4 → docs complete.
6. Polish → completion report → stop for owner confirmation before Roadmap Phase 2.

### Commit guidance

Commit to `main` after each task or logical group using Conventional Commits (`chore:` setup,
`test:` failing tests, `feat:` implementation, `ci:` workflow, `docs:` documentation). Never
force-push `main`.

---

## Notes

- [P] tasks touch different files and have no dependency on incomplete tasks.
- Every story is independently verifiable through its quickstart.md scenario.
- Do not install `zustand` or `expo-router` in this phase (FR-015).
- Do not add any authentication guard, user table, or feature module (FR-023).
