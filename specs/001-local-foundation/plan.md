# Implementation Plan: Roadmap Phase 1 — Local Foundation

**Branch**: `001-local-foundation` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-local-foundation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Build the local development foundation for TrueSee with no end-user features: a NestJS backend
(`TrueSeeBE/`) connected to PostgreSQL in Docker Compose with a baseline Prisma migration that
creates no domain tables; one public liveness endpoint (`GET /api/v1/health`, 200/503); structured
JSON logging with request IDs and central redaction; a stable error envelope; an Expo development
build (`TrueSeeFE/`) with a single app-shell screen showing environment and one of three backend
connection states; strict TypeScript, ESLint, Prettier, and Jest in both projects; a GitHub Actions
pipeline on every push; and `README.md`, `ARCHITECTURE.md`, and `.env.example` files. Decisions and
version pins are in [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (`strict`) on Node.js 22 LTS (`>=22.13 <23`)

**Primary Dependencies**: Backend: NestJS 12.6, `@nestjs/config` + Zod 4, `@nestjs/swagger` 12,
Prisma 7.10.1 (`@prisma/adapter-pg`, `pg`), `nestjs-pino` 5 + `pino-http` 11. Mobile: Expo SDK 58
(React Native 0.88.x as pinned by SDK), `expo-dev-client`, `expo-build-properties`. Full list and
justification: [research.md § Dependency justification](./research.md#dependency-justification-constitution-iii).

**Storage**: PostgreSQL 18 (Docker Compose, `postgres:18-alpine`); databases `truesee`
(development) and `truesee_test` (tests). No domain tables. No on-device storage in Phase 1.

**Testing**: Backend: Jest 30 + ts-jest, Supertest (unit + integration against `truesee_test`).
Mobile: Jest 30 + `jest-expo` 58 + React Native Testing Library 14.

**Target Platform**: Backend: Node 22 on Windows (dev) and Ubuntu (CI). Mobile: Android 8.0+
(API 26) verified in Phase 1; iOS configured but verified no later than Phase 16.

**Project Type**: Mobile app + API (two independent npm projects in one repository).

**Performance Goals**: Liveness response < 2 s in all cases (DB check timeout 1.5 s); app shell
shows final connection state ≤ 10 s; CI run ≤ 15 min; clean clone to running backend ≤ 30 min.

**Constraints**: No future-phase dependencies, tables, endpoints, modules, screens, or routes
(FR-023); no real secrets in repo or CI; logs never contain credentials; Windows-friendly scripts
and LF line endings.

**Scale/Scope**: 1 endpoint, 1 screen, 1 baseline migration, 2 projects, 1 CI workflow, 3 docs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution version: **1.0.1**.

| Principle | Pre-research | Post-design | Evidence |
| --- | --- | --- | --- |
| I. Phase-Gated, Spec-Driven Delivery | PASS | PASS | Only Phase 1 scope; spec → clarify → plan followed; `zustand`/`expo-router` recorded but not installed; research "Explicitly not added" list |
| II. Modular Architecture & Clean Layering | PASS | PASS | Mobile `src/{presentation,application,domain,infrastructure}` with inward dependencies; backend `config`, `logging`, `database`, `health`, `common` infrastructure modules only — no feature modules; health logic in service, not controller |
| III. Approved Stack & Dependency Discipline | PASS | PASS | Expo dev build, NestJS, REST `/api/v1`, PostgreSQL + Prisma, Jest, GitHub Actions; every dependency justified in research.md; exact pins + lockfiles; state/nav choice recorded (D3/D4) |
| IV. Offline-First Data Integrity | N/A | N/A | No user-created data in Phase 1; baseline migration via Prisma satisfies "schema change ships with migration" |
| V. Security by Default (v1.0.1) | PASS | PASS | Only public route is the allowlisted liveness endpoint returning status + DB reachability only, no writes; Zod-validated config; no secrets in repo/bundle; central log redaction; stable error codes; HTTPS required for deployed envs (none in Phase 1) |
| VI. Privacy & Responsible Deepfake | PASS | PASS | No personal data collected; no deepfake artifacts |
| VII. Test-First for Core Logic | PASS | PASS | Tests-first for config validation, connection-state mapping, health service, redaction, error filter; integration tests for health (healthy + DB-down) and 404 envelope. Health is public, so "unauthenticated/unauthorized" cases do not apply (recorded in Complexity Tracking); "validation failure" is covered by the invalid `X-Request-Id` case |
| VIII. Code Quality & Maintainability | PASS | PASS | `strict` TS 6.0.3, ESLint 10 + typescript-eslint type-aware, Prettier, LF via `.gitattributes`, UTC timestamps in logs |
| IX. Performance, Scalability & Reliability | PASS | PASS | Explicit timeouts (DB check 1.5 s, app request 10 s, startup 30 s); retry on app shell; no list endpoints yet |
| X. Documentation & Traceability | PASS | PASS | Spec/plan/tasks in `specs/001-local-foundation/`; Swagger from decorators; `README.md`, `ARCHITECTURE.md`, three `.env.example` files; all docs in English |
| XI. AI Coding Agent Conduct | PASS | PASS | Plan stops before implementation; dependency list submitted for owner approval with this plan; phase report required (FR-024) |
| Workflow: Git/CI | PASS | PASS | Commits to `main`, Conventional Commits, CI on every push, no secrets in CI |

**Gate result**: PASS with one recorded exception (see Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/001-local-foundation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (acceptance script)
├── contracts/
│   ├── health.openapi.yaml
│   ├── logging.md
│   └── mobile-app-shell.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit-tasks (not by this command)
```

### Source Code (repository root)

```text
TrueSee/
├── .github/workflows/ci.yml        # backend + mobile jobs
├── .editorconfig
├── .gitattributes                  # * text=auto eol=lf
├── .gitignore                      # .env, node_modules, dist, coverage, android/, ios/, .expo/
├── .env.example                    # Docker Compose (PostgreSQL) variables
├── docker-compose.yml              # service "db": postgres:18-alpine, healthcheck, volume
├── docker/postgres/init/01-create-test-db.sql
├── README.md                       # local-run guide (FR-021)
├── ARCHITECTURE.md                 # FR-022
├── prd.md                          # existing, unchanged
├── .specify/  .cursor/  specs/     # existing Spec Kit material
│
├── TrueSeeBE/                      # backend (independent npm project)
│   ├── package.json  package-lock.json  tsconfig.json  tsconfig.build.json
│   ├── nest-cli.json  eslint.config.mjs  .prettierrc  jest.config.ts  .env.example
│   ├── prisma.config.ts
│   ├── prisma/
│   │   ├── schema.prisma           # datasource + generator only, no models
│   │   └── migrations/00000000000000_baseline/migration.sql
│   ├── src/
│   │   ├── main.ts                 # bootstrap: prefix /api/v1, Swagger (dev), host/port
│   │   ├── app.module.ts
│   │   ├── config/                 # env schema (Zod), typed config service
│   │   ├── logging/                # pino setup, redaction list, request-id generator
│   │   ├── database/               # Prisma service, startup connect-with-timeout
│   │   ├── health/                 # controller (thin) + service (DB check with timeout)
│   │   └── common/                 # global exception filter, error codes
│   └── test/
│       ├── unit/                   # config, redaction, error filter, health service
│       ├── integration/            # health (200, 503), 404 envelope, request-id/log checks
│       └── global-setup.ts         # migrate deploy on truesee_test
│
└── TrueSeeFE/                      # mobile app (independent npm project)
    ├── package.json  package-lock.json  tsconfig.json  app.json
    ├── eslint.config.mjs  .prettierrc  jest.config.js  .env.example
    ├── App.tsx  index.ts           # entry renders AppShellScreen (no router yet)
    ├── src/
    │   ├── presentation/AppShellScreen.tsx
    │   ├── application/checkBackendStatus.ts
    │   ├── domain/connectionState.ts     # pure mapping + types
    │   └── infrastructure/
    │       ├── config.ts                 # EXPO_PUBLIC_* validation
    │       └── healthClient.ts           # fetch + AbortController (10 s)
    └── __tests__/                        # mirrors src/ layers
```

**Structure Decision**: Mobile + API in one Git repository as two independent npm projects,
`TrueSeeBE/` and `TrueSeeFE/` (owner decision D1). Each has its own lockfile, tooling config, and
CI job; there is no shared package (no current consumer). Backend folders are infrastructure
modules only; feature modules start in Phase 2 (`AuthModule`). Mobile follows the four layers from
Constitution II; Expo Router's `app/` directory will be introduced in Phase 2 when navigation gets
its first consumer.

## Owner approvals requested with this plan

1. The dependency list in [research.md](./research.md#dependency-justification-constitution-iii)
   (Constitution III requires owner approval for each runtime dependency).
2. TypeScript pinned to 6.0.3 instead of 7.0.2 (linting compatibility, research R2).
3. Prisma pinned to stable 7.10.1 instead of the `latest` tag 8.0.0-rc.34 (research R4).
4. Three `.env.example` files (root, `TrueSeeBE/`, `TrueSeeFE/`) as the interpretation of FR-020
   under decision D1 (research R16).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle VII: health endpoint integration tests omit the "unauthenticated" and "unauthorized" cases | The endpoint is public by Constitution v1.0.1 (Principle V allowlist), so no authentication or authorization path exists to test. Owner-approved 2026-11-22; permanent for this endpoint only. | Adding an auth guard to make the cases testable would contradict the approved amendment and break the mobile reachability check. |
