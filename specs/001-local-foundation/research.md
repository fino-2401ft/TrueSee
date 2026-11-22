# Research: Roadmap Phase 1 — Local Foundation

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-22

Versions were checked against the npm registry on 2026-11-22. "Pinned" means an exact version
in `package.json` plus a committed `package-lock.json` (Constitution III).

## Owner-approved decisions (2026-11-22)

| # | Topic | Decision |
| --- | --- | --- |
| D1 | Repository layout | One Git repository with two independent npm projects: `TrueSeeBE/` (backend) and `TrueSeeFE/` (mobile app). Each has its own `package.json`, lockfile, lint/format/test config. Root holds only docs, Docker Compose, CI, and editor/Git settings. |
| D2 | Local database | PostgreSQL in Docker Compose (Docker 29 is installed on the owner's machine). |
| D3 | State management | Zustand. Recorded now, installed when first consumed (expected Phase 2). |
| D4 | Navigation | Expo Router. Recorded now, installed when first consumed (expected Phase 2). |

## R1. Developer machine baseline

- **Decision**: Require Node.js `>=22.13 <23` (owner has 22.14.0), npm 10, Docker with Compose v2,
  Git, JDK 17, Android SDK with an emulator or device on Android 8.0+ (API 26).
- **Rationale**: Expo SDK 58 requires Node `^22.13`; Prisma 7 requires `^22.12`; NestJS 12 requires
  `>=20`. Node 22 LTS satisfies all. JDK 17 and Android SDK are already installed.
- **Alternatives considered**: Node 24 (newer, but owner does not have it and gains nothing for
  Phase 1); pnpm (not installed; D1 removes the need for workspaces).

## R2. TypeScript version

- **Decision**: Pin TypeScript `6.0.3` in both projects, `strict: true`.
- **Rationale**: TypeScript 7.0.2 is `latest`, but `typescript-eslint@8.73.0` supports only
  `typescript >=4.8.4 <6.1.0`. Using 7.x would break type-aware linting (Constitution VIII).
- **Alternatives considered**: TypeScript 7.0.2 with linting disabled for types (rejected:
  violates VIII); waiting for typescript-eslint 9 (unknown date).

## R3. Backend framework and configuration

- **Decision**: NestJS 12 (`@nestjs/core@12.6.0`, CLI `@nestjs/cli@12.0.15`) on Express, global
  prefix `/api/v1`. Configuration via `@nestjs/config@12.1.1` with a Zod 4 (`zod@4.6.7`) schema
  validated at boot; invalid or missing variables abort startup with the variable name (FR-006).
- **Rationale**: NestJS is the approved stack. Zod is already named in the PRD stack and gives one
  schema for types and validation.
- **Alternatives considered**: Joi (extra library, weaker TypeScript inference); class-validator
  for env (verbose for flat env vars).

## R4. Database access and baseline migration

- **Decision**: Prisma ORM `7.10.1` (`prisma` CLI + `@prisma/client` + `@prisma/adapter-pg` with
  `pg`, all on the 7.10.x line), PostgreSQL 18 image (`postgres:18-alpine`). Baseline migration is a
  hand-written `prisma/migrations/00000000000000_baseline/migration.sql` containing only a comment,
  applied with `prisma migrate deploy`. The schema file declares the datasource and generator but
  **no models**.
- **Rationale**: Prisma's `latest` tag currently points to `8.0.0-rc.34` (a release candidate);
  7.10.1 is the newest stable release. Prisma 7 uses driver adapters, so `@prisma/adapter-pg` and
  `pg` are required. Prisma refuses to generate an empty migration from a model-less schema, so a
  hand-written baseline is the standard way to prove migrations work while creating no domain
  tables (FR-011). `migrate deploy` records it in `_prisma_migrations`; a second run reports no
  pending migrations (SC-004).
- **Alternatives considered**: Prisma 8 RC (unstable); creating the `User` table early (violates
  FR-011 and Constitution I); TypeORM/Drizzle (not approved stack).

## R5. Startup database check (FR-007)

- **Decision**: On boot, the backend connects and runs `SELECT 1`, retrying every 2 s until
  `DB_CONNECT_TIMEOUT_MS` (default 30000) elapses, then exits with code 1 and log message code
  `DATABASE_UNREACHABLE` (no credentials).
- **Rationale**: Satisfies "fail fast, bounded, clear message" while tolerating the few seconds
  Docker needs to start PostgreSQL.
- **Alternatives considered**: Start without DB and report via liveness only (rejected: spec
  requires refusing to start); infinite retry (rejected: hangs).

## R6. Liveness endpoint (FR-009a, Constitution V v1.0.1)

- **Decision**: `GET /api/v1/health`, public, implemented with a plain controller + service that
  races `SELECT 1` against `HEALTH_DB_TIMEOUT_MS` (default 1500 ms). `200 {status:"ok",
  database:"up"}` or `503 {status:"degraded", database:"down"}`. No writes, no version info. Full
  contract in [contracts/health.openapi.yaml](./contracts/health.openapi.yaml).
- **Rationale**: Meets the 2-second budget with margin; a plain controller avoids an extra
  dependency.
- **Alternatives considered**: `@nestjs/terminus` (extra dependency, response shape includes more
  detail than allowed by Constitution V unless customized).

## R7. Error envelope and stable error codes

- **Decision**: A global exception filter returns `{ "error": { "code", "message", "requestId" } }`.
  Phase 1 codes: `NOT_FOUND`, `INTERNAL_ERROR`. The `X-Request-Id` response header echoes the
  request ID.
- **Rationale**: Constitution V requires stable machine-readable codes from the first endpoint;
  defining the envelope now prevents Phase 2 rework. This is cross-cutting infrastructure, not a
  future-phase feature.
- **Alternatives considered**: NestJS default error body (no stable code field).

## R8. Structured logging (FR-008, FR-008a)

- **Decision**: `nestjs-pino@5.3.2` + `pino-http@11.0.0`; `pino-pretty@13.2.0` as a dev
  dependency. `LOG_FORMAT=pretty|json` (default `pretty` in development, `json` in test/CI).
  Request ID: incoming `X-Request-Id` if it is a valid UUID, otherwise a generated UUID v4.
  Central `redact` paths cover `password`, `token`, `accessToken`, `refreshToken`,
  `authorization`, `cookie`, `secret`, `databaseUrl`, `DATABASE_URL` (header and body variants),
  censored as `[REDACTED]`. Health-check request logs are emitted at `debug` level to avoid noise.
  Contract: [contracts/logging.md](./contracts/logging.md).
- **Rationale**: Pino is the de-facto fast structured logger for Node; `nestjs-pino` binds request
  context automatically, giving request IDs on every entry without manual plumbing.
- **Alternatives considered**: Nest built-in `Logger` (no structured JSON or redaction); Winston
  (slower, redaction is manual).

## R9. API documentation (Constitution X)

- **Decision**: `@nestjs/swagger@12.1.2`; Swagger UI served at `/api/docs` only when
  `NODE_ENV=development`. The OpenAPI document is generated from decorators.
- **Rationale**: Required by Constitution X; restricting the UI to development avoids exposing
  docs in deployed environments.
- **Alternatives considered**: Hand-maintained OpenAPI only (drifts from code).

## R10. Backend testing

- **Decision**: Jest `30.5.2` with `ts-jest`, Supertest `7.3.2`. Unit tests (config schema,
  redaction rule, error filter, health service with fake DB) and integration tests (real app
  against `truesee_test` database for healthy case; app pointed at a closed port for the
  database-down case, asserting 503 within 2 s). Jest `globalSetup` runs `prisma migrate deploy`
  on the test database.
- **Rationale**: Constitution VII requires test-first for core logic and integration tests per
  endpoint. Pointing at a closed port makes the DB-down case deterministic without stopping
  containers.
- **Alternatives considered**: Testcontainers (slower on Windows, needs Docker-in-CI tricks).

## R11. Mobile app project

- **Decision**: Create with `create-expo-app` using the `blank-typescript` template on Expo SDK 58
  (`expo@58.0.26`, React Native version as pinned by the SDK, `0.88.x`). Add `expo-dev-client`
  (development build) and `expo-build-properties` (set `android.minSdkVersion: 26`). Use
  Continuous Native Generation: `android/` and `ios/` are generated by `expo prebuild` /
  `expo run:android` and are git-ignored. iOS config is kept in `app.json` (bundle identifier) so
  a later iOS build is not blocked (FR-012).
- **Rationale**: The blank template avoids pulling in Expo Router and tab screens before they are
  needed (FR-015, FR-023). `expo-dev-client` is what makes it a development build per
  Constitution III. `expo-build-properties` is the supported way to set minSdk with CNG.
- **Alternatives considered**: Default template (includes Expo Router + sample tabs → future-phase
  UI); committing native folders (harder upgrades, merge noise).

## R12. Mobile configuration and networking

- **Decision**: `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_APP_ENV` read via `process.env`
  (inlined by Expo at bundle time) and validated by a small hand-written TypeScript function (no
  extra dependency). Health request uses `fetch` with `AbortController`, timeout 10 s (FR-013).
  Emulator uses `http://10.0.2.2:3000/api/v1`; physical device uses the PC's LAN IP. Cleartext HTTP
  is permitted only in debug builds (RN debug manifest default); deployed environments use HTTPS
  (Constitution V). The backend listens on `0.0.0.0` for LAN access.
- **Rationale**: `EXPO_PUBLIC_` values are public by design, so only non-secret values go there.
  A hand-written validator is ~20 lines and avoids adding Zod to the mobile bundle before it is
  needed for forms.
- **Alternatives considered**: `expo-constants` extra config (more indirection); Zod on mobile now
  (deferred to Phase 2 forms).

## R13. Mobile testing

- **Decision**: `jest-expo@58.0.15` preset with Jest 30, `@testing-library/react-native@14.1.0`.
  Tests: config validator, connection-state mapping (pure domain), health client (mocked fetch:
  200, 503, timeout, network error, other status), app-shell screen (renders each state, retry).
- **Rationale**: `jest-expo` is the official preset for SDK 58; RNTL is the standard for
  component behaviour tests.
- **Alternatives considered**: Detox E2E in Phase 1 (heavy; constitution makes E2E optional
  "where feasible"; manual verification recorded in the phase report covers device runs).

## R14. Lint and format

- **Decision**: ESLint `10.15.0` flat config + `typescript-eslint@8.73.0` (type-aware) +
  `eslint-config-prettier`; Prettier `3.10.1`. Each project has its own config. Root
  `.editorconfig` and `.gitattributes` (`* text=auto eol=lf`) handle Windows line endings.
- **Rationale**: Constitution VIII; independent configs follow D1.
- **Alternatives considered**: Biome (not in approved tooling; less mature type-aware rules).

## R15. Continuous integration

- **Decision**: `.github/workflows/ci.yml` on `push` to `main` (and `pull_request` for future use)
  with two jobs. **backend**: Node 22, `npm ci`, typecheck, lint, format check, PostgreSQL 18
  service container, `prisma migrate deploy` twice + `prisma migrate status`, unit + integration
  tests. **mobile**: Node 22, `npm ci`, typecheck, lint, format check, tests. No repository secrets
  are used; CI env values are placeholders (FR-019).
- **Rationale**: Constitution workflow section; running `migrate deploy` twice proves idempotency
  (SC-004) on every push.
- **Alternatives considered**: Building the Android app in CI (slow, needs SDK caching; deferred to
  Phase 16 build pipeline).

## R16. Environments and example files

- **Decision**: Environment names are `development` (local) and `test` (automated tests and CI).
  No production configuration exists in Phase 1. Three example files, one per runnable unit:
  root `.env.example` (Docker Compose: PostgreSQL user, password, database, port),
  `TrueSeeBE/.env.example`, `TrueSeeFE/.env.example`. Together they satisfy FR-020 ("every variable
  read by the code"); each file only covers its own runtime.
- **Rationale**: D1 makes each project independent; a single shared file would couple them.
- **Alternatives considered**: One root file read by all (breaks project independence; Expo only
  reads `.env` from its own project root).

## Dependency justification (Constitution III)

All licenses are MIT or Apache-2.0 (compatible with the project). "Expo compat." applies to mobile
packages only. All are actively maintained (releases within the last 3 months at time of check).

| Package | Project | Type | Purpose | Size impact |
| --- | --- | --- | --- | --- |
| `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs` | BE | runtime | Approved framework | server only |
| `@nestjs/config`, `zod` | BE | runtime | Validated configuration (FR-006) | small |
| `@nestjs/swagger` | BE | runtime | OpenAPI docs (Constitution X) | small |
| `@prisma/client`, `@prisma/adapter-pg`, `pg` | BE | runtime | DB access, approved stack | server only |
| `nestjs-pino`, `pino-http` | BE | runtime | Structured logs, request IDs (FR-008a) | small |
| `prisma`, `@nestjs/cli`, `typescript`, `jest`, `ts-jest`, `supertest`, `pino-pretty`, `eslint`, `typescript-eslint`, `eslint-config-prettier`, `prettier`, type packages | BE | dev | Tooling | none at runtime |
| `expo`, `react`, `react-native` (SDK-pinned) | FE | runtime | Approved stack (Expo compat.: core) | baseline |
| `expo-dev-client` | FE | runtime | Development build (Constitution III) | dev builds only UI |
| `expo-build-properties` | FE | config plugin | Android minSdk 26 (spec clarification: Android 8.0 minimum) | none at runtime |
| `expo-status-bar` | FE | runtime | Included by blank template | tiny |
| `jest-expo`, `jest`, `@testing-library/react-native`, `typescript`, `eslint`, `typescript-eslint`, `eslint-config-prettier`, `prettier`, type packages | FE | dev | Tooling | none at runtime |

**Explicitly not added in Phase 1** (FR-023): `zustand`, `expo-router` (D3/D4, first consumer in
Phase 2), Socket.IO, Cloudinary SDK, SQLite, SecureStore, LiveKit, FCM, any ML/inference package,
password hashing, JWT libraries, `helmet`/rate-limit packages (first authenticated endpoints arrive
in Phase 2).

## Resolved unknowns

All Technical Context items are resolved; no `NEEDS CLARIFICATION` remains.
