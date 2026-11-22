# Feature Specification: Roadmap Phase 1 — Local Foundation

**Feature Branch**: `001-local-foundation` (no Git repository exists yet; Git is initialized
in this phase)

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "The TrueSee Project Constitution has been reviewed and approved.
I am ready to begin Roadmap Phase 1. Create the specification for Roadmap Phase 1 only. Do not
include features belonging to Roadmap Phases 2–16. Do not introduce future-phase modules,
database tables, API endpoints, screens, or dependencies. Treat the Constitution as the
governing document."

**Roadmap Phase**: 1 of 16 — Local Foundation (`prd.md` §13 "Phase 1", §14 "Phase 1").
Next phase (2 — Registration, Login, Logout) MUST NOT start until this phase's exit criteria
are met and the owner confirms.

## Clarifications

### Session 2026-11-22

- Q: Should Phase 1 include an unauthenticated liveness endpoint, and should the app shell show
  backend reachability? → A: Yes. Amend the constitution (v1.0.1) to allow one liveness endpoint
  returning no user data; the app shell shows backend reachability.
- Q: Which platforms must pass Phase 1 acceptance? → A: Android only; iOS verification is deferred
  to a later phase (no later than Roadmap Phase 16).
- Q: When the backend is running but its database is down, what should the app screen show?
  → A: Three states: "Backend: reachable", "Backend: reachable, database unavailable",
  "Backend: unreachable"; the liveness endpoint answers "service unavailable" (HTTP 503) when
  the database is down.
- Q: What is the oldest Android version TrueSee must support? → A: Android 8.0 (API 26) or newer.
- Q: What format should the backend's logs use from Phase 1 onward? → A: Structured JSON logs
  (time, level, message, request ID) with automatic request logging and sensitive-field
  redaction; human-readable console output in local development.

## User Scenarios & Testing *(mandatory)*

Phase 1 delivers no end-user features. Its users are the **project owner/developer**, **AI
coding agents** working on later phases, and the **capstone evaluator** who needs to run the
project. Each story below is independently verifiable.

### User Story 1 - Run the backend and database locally from a clean checkout (Priority: P1)

The developer clones the repository onto a machine that has only the documented prerequisites,
follows the local-run guide, provisions the local database, applies schema migrations, and starts
the backend service. The backend reports that it is running and connected to the database.

**Why this priority**: Every later phase (auth, social, chat) depends on a running backend and a
migratable database. Without this, nothing else can be built or demonstrated.

**Independent Test**: On a clean clone, follow only the local-run guide; verify the database
starts, the baseline migration applies, and the backend starts and confirms a successful
database connection.

**Acceptance Scenarios**:

1. **Given** a clean clone and a filled-in local environment file created from the example,
   **When** the developer runs the documented database and migration commands, **Then** the
   migration history is created and the baseline migration is recorded as applied.
2. **Given** migrations have already been applied, **When** the developer runs the migration
   command again, **Then** it reports no pending changes and makes no modifications.
3. **Given** the database is running and migrated, **When** the developer starts the backend,
   **Then** it starts without errors and logs a successful database connection without printing
   credentials.
4. **Given** a required environment variable is missing, **When** the developer starts the
   backend, **Then** it refuses to start and names the missing variable.
5. **Given** the database is not running, **When** the developer starts the backend, **Then** it
   fails with a clear "database unreachable" message instead of hanging indefinitely.

---

### User Story 2 - Launch the mobile app shell on a device or emulator (Priority: P1)

The developer builds and launches the TrueSee mobile app (development build) on Android. The
app opens to a single neutral app-shell screen identifying the product and showing one of three
connection states: "Backend: reachable", "Backend: reachable, database unavailable", or
"Backend: unreachable".

**Why this priority**: The mobile app is the only product client. Proving it builds, runs with
the approved toolchain, and can reach the backend de-risks every later UI phase.

**Independent Test**: Follow the guide to build and launch the app on an Android emulator or
device; confirm the app-shell screen appears and shows the correct state in each of three
setups: backend and database running; backend running with database stopped; backend stopped.

**Acceptance Scenarios**:

1. **Given** the documented mobile prerequisites are installed, **When** the developer runs the
   documented build-and-launch command for Android, **Then** the app installs and opens to the
   app-shell screen showing the product name "TrueSee".
2. **Given** the backend and database are running and the app's backend address is correct,
   **When** the app shell opens, **Then** it shows "Backend: reachable" within 10 seconds.
3. **Given** the backend is running but the database is stopped, **When** the app shell opens,
   **Then** it shows "Backend: reachable, database unavailable" within 10 seconds and offers a
   retry action.
4. **Given** the backend is stopped or the address is wrong, **When** the app shell opens,
   **Then** it shows "Backend: unreachable" within 10 seconds and offers a retry action, without
   crashing or hanging.
5. **Given** the app is open, **When** the developer inspects available navigation, **Then**
   there are no screens, routes, buttons, or placeholders for any later phase (no splash,
   register, login, profile, feed, chat, call, or deepfake UI).
6. **Given** the backend address is configured through environment configuration, **When** the
   developer changes it, **Then** the app uses the new value without any code change.

---

### User Story 3 - Automated quality gate on every push (Priority: P2)

Every push to the main branch triggers an automated pipeline that installs dependencies from
the lockfiles, type-checks, lints, checks formatting, runs the test suites for the mobile app
and backend, and verifies that migrations apply to a fresh, disposable database. Any failure
marks the push as failed.

**Why this priority**: The constitution's definition of done requires a green pipeline for every
phase. Establishing it now prevents quality debt from accumulating.

**Independent Test**: Push a clean commit and observe a passing pipeline; push commits that
introduce (a) a type error, (b) a lint error, and (c) a failing test, and observe each fails.

**Acceptance Scenarios**:

1. **Given** a clean commit, **When** it is pushed to main, **Then** the pipeline runs all
   checks and passes.
2. **Given** a commit with a type error, lint error, formatting violation, or failing test,
   **When** it is pushed, **Then** the pipeline fails and identifies the failing check.
3. **Given** the pipeline runs, **When** it executes, **Then** it requires no real secrets; it
   uses non-sensitive placeholder values and a disposable database.

---

### User Story 4 - Understand the architecture and configuration before contributing (Priority: P3)

A developer or AI agent starting Roadmap Phase 2 reads the architecture document, the
environment-variable example, and the local-run guide, and can determine the layering rules,
where new modules go, which state-management and navigation approach is used, and which
variables must be set — without reading source code.

**Why this priority**: Required by the PRD and Principle X; reduces errors by AI agents in
later phases, but the project can technically run without it.

**Independent Test**: A reviewer answers a fixed list of questions (layers and dependency
direction, module-per-phase plan, chosen state/navigation approach, data source-of-truth rules,
every required variable and its purpose) using only the three documents.

**Acceptance Scenarios**:

1. **Given** the architecture document, **When** a reviewer looks for the mobile layering and
   backend module rules, **Then** both are described and consistent with Principle II.
2. **Given** the environment example file, **When** compared with every variable the code
   reads, **Then** every variable is listed with a description and a non-secret placeholder.
3. **Given** the repository, **When** scanned for committed environment files or secrets,
   **Then** none are found.

---

### Edge Cases

- Database port already in use on the developer's machine: the guide documents how to change the
  port via configuration, and the backend reads the changed value.
- The mobile device/emulator cannot reach the backend at "localhost" (emulator networking or a
  physical device on LAN): the guide documents how to set the backend address for each case.
- Backend running but database stopped: the liveness endpoint still answers within 2 seconds
  with "service unavailable" (HTTP 503) and reports the database as unavailable; the app shell
  shows "Backend: reachable, database unavailable", not a crash.
- Migration command run against a database that already has the baseline applied: no-op, no
  error.
- Device or emulator older than Android 8.0 (API 26): installation is refused by the platform;
  this is expected and not a defect. The local-run guide states the minimum version.
- Required native mobile toolchain is missing: the guide's prerequisite section lets the developer
  detect this before building; build errors are not considered a Phase 1 defect if prerequisites
  are unmet.
- Windows line endings or path separators: scripts and documentation work on Windows (the
  owner's development OS) and in the CI environment.
- Pipeline runs on a fork or without repository secrets: it still passes, because no real secret
  is required in Phase 1.
- Someone accidentally creates a real environment file: it is ignored by version control and
  never committed.

## Requirements *(mandatory)*

### Functional Requirements

**Repository & version control**

- **FR-001**: The existing repository content (`prd.md`, `.specify/`, `.cursor/`) MUST be
  preserved unchanged; nothing existing is deleted or overwritten.
- **FR-002**: Version control MUST be initialized for the repository, with ignore rules covering
  real environment files, dependency directories, build outputs, and local database data.
- **FR-003**: The repository MUST contain both the mobile app and the backend in a single
  repository with a documented top-level layout.
- **FR-004**: Dependency lockfiles MUST be committed; no dependency may be declared with a
  floating "latest" version.

**Backend & database**

- **FR-005**: A backend service MUST be created using the approved stack (Constitution
  Principle III) with strict type checking enabled.
- **FR-006**: The backend MUST read all configuration (database connection, port, environment
  name) from environment variables and MUST refuse to start, naming the variable, when a
  required variable is missing or invalid.
- **FR-007**: The backend MUST fail fast with a clear message when the database is unreachable,
  within a bounded timeout (default: 30 seconds).
- **FR-008**: The backend MUST NOT log passwords, full connection strings containing
  credentials, or other secrets.
- **FR-008a**: The backend MUST emit structured logs (JSON) where every entry contains a
  timestamp in UTC, level, and message. Every incoming request MUST be assigned a request ID that
  appears on all log entries for that request, and each request MUST be logged automatically
  (method, path, status, duration). Sensitive fields (e.g., password, token, authorization,
  cookie, secret, connection string) MUST be redacted by a central rule, not by each caller. In
  the local development environment, the same entries MUST be rendered in a human-readable
  console format; the log format MUST be selectable by configuration. An automated test MUST
  prove that a sensitive field is redacted.
- **FR-009**: The backend MUST expose no feature endpoints and contain no feature modules in this
  phase. The only endpoint is a liveness endpoint (FR-009a).
- **FR-009a**: The backend MUST expose exactly one unauthenticated, versioned liveness endpoint
  that reports overall status and whether the database is reachable. It MUST return no user
  data, secrets, connection details, or internal version/stack information, MUST respond within
  2 seconds (reporting the database as unavailable rather than waiting), MUST answer HTTP 200
  when healthy and HTTP 503 ("service unavailable") when the database is unavailable, MUST be
  documented in
  the API documentation, and MUST have integration tests for the healthy and
  database-unreachable cases. This endpoint requires constitution amendment v1.0.1 (see
  Dependencies).
- **FR-010**: A local database MUST be provisionable with a single documented command that
  produces an empty, migratable database.
- **FR-011**: Schema migration tooling MUST be configured with a baseline migration that applies
  cleanly to an empty database and is idempotent on re-run. The baseline MUST NOT create any
  domain tables (e.g., users, follows, posts, messages); those belong to their Roadmap Phases.

**Mobile app**

- **FR-012**: A mobile app project MUST be created using the approved stack (Constitution
  Principle III) as a development build, configured for both iOS and Android, with a minimum
  supported Android version of 8.0 (API 26). Phase 1 acceptance is verified on Android only, on
  an emulator or device running Android 8.0 or newer; iOS verification is deferred to a later phase (no later than
  Roadmap Phase 16), and Phase 1 MUST NOT introduce anything that prevents an iOS build.
- **FR-013**: The app MUST open to exactly one app-shell screen that displays the product name,
  the running environment name, and one of three connection states obtained from the liveness
  endpoint ("Backend: reachable" on HTTP 200; "Backend: reachable, database unavailable" on
  HTTP 503; "Backend: unreachable" on timeout, network error, or any other response), with a
  retry action and a request timeout of at most 10 seconds. It MUST
  NOT contain screens, routes, navigation entries, buttons, or mock UI for any later Roadmap
  Phase.
- **FR-014**: The app's backend address MUST come from environment configuration, not
  hardcoded source values.
- **FR-015**: A single state-management approach and a single navigation approach MUST be
  selected (owner-approved during planning) and recorded in the architecture document. They are
  installed only when their first real consumer exists (Principle II, no speculative layers).

**Quality tooling & automation**

- **FR-016**: Type checking, linting, and formatting checks MUST be configured for both the
  mobile app and backend, and MUST pass with zero errors.
- **FR-017**: A test runner MUST be configured for both the mobile app and backend, each with at
  least one meaningful passing test of real Phase 1 code (for example, configuration
  validation). Placeholder tests that assert nothing are not acceptable.
- **FR-018**: An automated pipeline MUST run on every push to the main branch and execute:
  lockfile-based install, type check, lint, format check, all tests, and migration apply against
  a fresh disposable database. Any failing step MUST fail the pipeline.
- **FR-019**: The pipeline MUST NOT require any real secret.

**Documentation & configuration**

- **FR-020**: An environment example file MUST list every environment variable read by the
  mobile app and backend, each with a description and a non-secret placeholder value. Real
  environment files MUST NOT be committed.
- **FR-021**: A local-run guide MUST document: prerequisites with minimum versions (including
  the minimum Android version 8.0 / API 26 for emulators and devices), cloning,
  creating the environment file, provisioning the database, applying migrations, starting the
  backend, building and launching the mobile app on Android, setting the backend
  address for emulator vs physical device, and running type check, lint, format, and tests.
- **FR-022**: An architecture document MUST describe: repository layout; mobile layering and
  dependency direction; backend module organization and the planned module-per-phase schedule
  (future modules listed as planned only, not created); data source-of-truth rules; and the
  chosen state-management and navigation approaches.

**Scope guard & reporting**

- **FR-023**: The phase MUST NOT add any dependency, configuration, module, table, endpoint,
  screen, or route belonging to Roadmap Phases 2–16 (see Out of Scope).
- **FR-024**: At phase end, a completion report MUST list files created/changed, how to run,
  tests and checks executed with results, remaining risks, and conflicts found; work then stops
  pending owner confirmation.

### Out of Scope (belongs to Roadmap Phases 2–16)

- Registration, login, logout, tokens, password hashing, secure token storage (Phase 2).
- User/profile data, follows, posts, feed, visibility rules (Phases 3–5).
- Media upload or any media-storage integration (Phases 6–7).
- On-device local database, offline queue, Sync Engine (Phases 8 and 11).
- Likes, comments, search (Phase 9).
- Realtime messaging connection, conversations, messages, group chat (Phases 10–12).
- Push notifications (Phase 13).
- Voice/video calls (Phase 14).
- Deepfake detection: models, runtimes, inference service, DF CHECK button, screens (Phase 15).
- Production deployment, hosting, release builds, performance verification (Phase 16).
- Any web client, web admin, or end-to-end encryption (permanently out of scope).

### Traceability

| Source | Requirement | Covered by |
| --- | --- | --- |
| `prd.md` §13 Phase 1 | Read repository; do not overwrite existing content | FR-001 |
| `prd.md` §13 Phase 1 | Mobile app and backend run locally | FR-005–FR-007, FR-012–FR-014 |
| `prd.md` §13 Phase 1 | Schema migration runs | FR-010, FR-011 |
| `prd.md` §13 Phase 1 | Environment example exists; real env file not committed | FR-002, FR-020 |
| `prd.md` §13 Phase 1 | Local-run guide | FR-021 |
| `prd.md` §14 Phase 1 | Architecture document | FR-022 |
| Constitution III | One state/navigation approach chosen in Phase 1; lockfiles | FR-004, FR-015 |
| Constitution VIII | Strict typing, lint, format | FR-005, FR-012, FR-016 |
| Constitution VII, workflow | Tests; CI on every push | FR-017–FR-019 |
| Constitution I, XI | No future-phase artifacts; phase report | FR-013, FR-023, FR-024 |
| Constitution V (amended v1.0.1), X | Liveness endpoint, documented and tested | FR-009a |
| Constitution V (logs), `prd.md` §6.1 | No secrets in logs; structured, traceable logging | FR-008, FR-008a |
| `prd.md` §9.3 (later reuse) | Lightweight request to confirm API is alive | FR-009a, FR-013 |

### Key Entities *(include if feature involves data)*

- **Environment Configuration**: The set of named settings (database connection, backend port,
  environment name, backend address for the app) that each runtime reads at startup. No domain
  data.
- **Migration History**: The ordered record of schema migrations applied to a database. Phase 1
  contains only the baseline entry and no domain tables.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with prerequisites installed goes from a clean clone to a running
  backend connected to a migrated database in 30 minutes or less, using only the local-run guide.
- **SC-002**: The mobile app shell launches successfully on 3 out of 3 consecutive cold launches
  on Android and shows the correct connection state within 10 seconds in 100% of launches
  across all three setups (all running; database stopped; backend stopped).
- **SC-003**: The automated pipeline passes on a clean commit and fails in 3 out of 3 deliberate
  negative checks (type error, lint error, failing test); a full run completes in 15 minutes or
  less.
- **SC-004**: Re-running the migration command on an already-migrated database produces zero
  changes in 100% of attempts.
- **SC-005**: 100% of environment variables read by the code are listed in the environment
  example file; zero real environment files or secrets exist in the repository history.
- **SC-006**: A review of the repository finds zero dependencies, tables, endpoints, modules,
  screens, or routes belonging to Roadmap Phases 2–16.
- **SC-007**: A reviewer answers 5 out of 5 architecture questions (layers and dependency
  direction, module-per-phase plan, state/navigation choice, source-of-truth rules, required
  variables) using only the documentation.
- **SC-008**: 100% of backend log entries produced during the test suite carry a timestamp,
  level, and (for request-scoped entries) a request ID, and zero entries contain the value of
  any field on the sensitive-field list.

## Assumptions

- The owner develops on Windows and will create the remote GitHub repository and grant push
  access; the agent does not create remote accounts or repositories on the owner's behalf.
- Mobile app and backend live in one repository; the exact folder layout is decided during
  planning and recorded in the architecture document.
- The local database is provisioned via a documented single command (containerized or native,
  decided during planning with owner approval).
- The mobile development build requires the native Android toolchain on the developer machine;
  installing it is a documented prerequisite, not a deliverable.
- Phase 1 includes no deployment; the demo hosting target remains an open decision (constitution
  TODO) for a later phase.
- The baseline migration creates migration bookkeeping only; the first domain table (users) is
  created in Roadmap Phase 2.
- All documentation, code, and UI text are in English (Principle X).
- The PRD/constitution deepfake deviations do not affect Phase 1.
- iOS is a supported target platform, but no Mac or cloud build service is assumed for Phase 1.

### Dependencies

- **Constitution amendment v1.0.1 (blocking for `/speckit-plan`)**: Principle V's
  unauthenticated allowlist (register, login, refresh) MUST be amended to also permit one
  liveness endpoint that returns no user data. The owner approved this on 2026-11-22; it must
  be applied via `/speckit-constitution` before the plan's Constitution Check.
- The owner provides a GitHub repository for the pipeline (FR-018) before the phase is reported
  complete.
