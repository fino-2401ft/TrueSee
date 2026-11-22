<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.0.1 (PATCH)
Bump rationale: Narrow clarification of the existing Principle V authentication allowlist,
approved by the owner on 2026-11-22 during the Roadmap Phase 1 specification. No principle is
added, removed, or redefined; the security posture for user data is unchanged.

Modified principles:
- V. Security by Default: allowlist now includes one liveness endpoint; new bullet constrains
  what it may return (status and database reachability only; no user data, secrets, connection
  or version details; no writes).

Added sections: none
Removed sections: none

Affected artifacts:
- specs/001-local-foundation/spec.md: FR-009a and the "Constitution amendment v1.0.1" dependency
  are now satisfied; no edits required.
- Templates: none modified (they read the constitution at runtime).

Follow-up TODOs (carried over from v1.0.0, still open):
- TODO(PRD_SYNC): amend prd.md to match the owner-confirmed deepfake deviations.
- TODO(SOCIAL_SCOPE): confirm reporting/moderation vs likes/comments scope.
- TODO(DF_STACK): decide on-device runtime, inference-service language, model, thresholds at
  Roadmap Phase 15 start.
- TODO(DEPLOY_TARGET): decide demo hosting target in Roadmap Phase 1 or 16.
- TODO(CLIENT_LIBS): choose state management and navigation in Roadmap Phase 1 planning.
-->

# TrueSee Constitution

## Core Principles

### I. Phase-Gated, Spec-Driven Delivery (NON-NEGOTIABLE)

TrueSee is delivered as a sequence of Roadmap Phases (1–16, defined in `prd.md` section 14).
"Roadmap Phase" always refers to these product phases, never to Spec Kit planning steps.

- Exactly one Roadmap Phase MUST be in progress at any time. Work on Phase N+1 MUST NOT begin
until Phase N meets its exit criteria (`prd.md` section 13) and the project owner confirms it.
- Each Roadmap Phase MUST flow through Spec Kit: `/speckit-specify` → `/speckit-clarify` (when
ambiguities exist) → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
- Specs, plans, tasks, and code MUST NOT contain endpoints, tables, screens, navigation routes,
dependencies, modules, or placeholder/mock UI belonging to a later Roadmap Phase.
- Hard ordering gates: Roadmap Phase 14 (calls) MUST NOT start before Phase 11 (offline 1-1
chat) is confirmed; Roadmap Phase 15 (deepfake) MUST NOT start before Phases 1–14 are confirmed
and the owner explicitly requests it.
- Any request that expands the current phase's scope MUST be raised with the owner before work.

Rationale: a solo capstone with AI agents fails most often from scope creep and half-finished
parallel work; gates keep every phase demonstrable.

### II. Modular Architecture & Clean Layering

- Mobile app MUST follow pragmatic Clean Architecture: Presentation (screens, components,
navigation, view state) → Application (use cases, sync orchestration) → Domain (entities,
repository interfaces, visibility rules, media-duration rules) → Infrastructure (REST client,
Socket.IO client, SQLite, secure storage, upload clients). Dependencies MUST point inward;
Domain MUST NOT import React, React Native, Expo, or any SDK.
- Business logic MUST NOT live in React components or NestJS controllers. Controllers validate,
delegate to services, and map results; a controller method exceeding ~30 lines of logic is a
review failure.
- Backend MUST be organized as NestJS feature modules (Auth, Users, Follows, Posts, Uploads,
Likes, Comments, Conversations, Messages, Notifications, Calls, Deepfake), each created only in
its Roadmap Phase. Modules communicate via exported services, never via another module's
repository or Prisma models directly.
- Deepfake inference MUST be isolated: on-device inference behind a mobile module interface, and
server inference in a separate service called only by the NestJS Deepfake module. No other
module may depend on inference internals.
- A single Sync Engine MUST handle all offline queues (posts and messages). Duplicate retry
mechanisms are prohibited.
- Abstractions MUST have at least one current consumer; speculative layers are prohibited (YAGNI).

Rationale: auth, social, chat, calls, and deepfake must be addable phase-by-phase without
rewriting earlier modules.

### III. Approved Technology Stack & Dependency Discipline

- The approved stack is fixed: React Native + TypeScript with Expo Development Build (iOS and
Android); NestJS + TypeScript; REST (`/api/v1`) + Socket.IO; PostgreSQL via Prisma; SQLite on
device; Cloudinary for uploaded media; LiveKit + WebRTC (Roadmap Phase 14 only); FCM (Roadmap
Phase 13 only); a separate inference service for deepfake server analysis (Roadmap Phase 15
only); Jest (Detox for E2E where feasible); GitHub Actions for CI.
- Prohibited: any web client (React web, Next.js, web admin), Firebase Realtime Database or
Firestore as a data store, a second server database, custom WebRTC signaling protocols,
end-to-end encryption.
- Exactly one state-management library and one navigation solution MUST be used app-wide,
chosen in Roadmap Phase 1 and recorded in `ARCHITECTURE.md`.
- Adding a runtime dependency MUST be justified in the plan (purpose, maintenance status,
license compatibility, Expo compatibility, size impact) and approved by the owner. Lockfiles
(`package-lock.json`/`pnpm-lock.yaml`) MUST be committed; versions MUST NOT float on `latest`.
- Changing an approved stack item is a constitution amendment (see Governance).

Rationale: stack churn is irreversible cost; the owner approves every hard-to-reverse choice.

### IV. Offline-First Data Integrity (NON-NEGOTIABLE)

- User-created posts and messages MUST be persisted to SQLite before the send action is
acknowledged in the UI, and MUST survive force-close and restart.
- Every create operation MUST carry a client-generated UUID (`clientPostId`, `clientMessageId`)
and the server MUST enforce uniqueness (`(authorId, clientPostId)`, `(senderId, clientMessageId)`); a retry MUST return the existing record, never a duplicate.
- PostgreSQL is the single source of truth on the server; SQLite is cache, drafts, and queue.
Socket.IO events are never the sole carrier of data; reconnect MUST resync via REST cursors.
- Retries MUST use bounded exponential backoff, resume on app launch, foreground, and
connectivity change, and MUST NOT treat NetInfo "online" as proof the API is reachable.
- Errors MUST be classified as transient (retry), permanent (mark `failed`, show reason),
unauthorized (refresh or re-login, never send as another account), or duplicate (mark `sent`).
- Local data MUST be partitioned per user; pending items MUST NOT be deleted on logout and MUST
NOT be visible to another account on the same device.
- Local media files MUST NOT be deleted before upload succeeds and the server confirms metadata.
Large files MUST NOT be stored in SQLite (paths and metadata only).
- Creation order MUST be preserved per conversation and per author.
- Every schema change MUST ship with a Prisma migration (server) or versioned SQLite migration.

Rationale: losing or duplicating user content is the single most damaging defect for this app.

### V. Security by Default

- Every API endpoint MUST require authentication except an explicit allowlist (register, login,
refresh, and one liveness endpoint). There MUST be no unauthenticated read path for posts,
media, or messages.
- The liveness endpoint MUST report only service status and database reachability. It MUST NOT
return user data, secrets, connection details, or version/stack information, and MUST NOT
perform writes.
- Authorization MUST be enforced server-side on every read and write: post visibility on feed,
detail, profile posts, likes, comments, and media URLs; conversation membership on every chat
operation; ownership on every edit/delete. Client-side hiding alone is a defect.
- Passwords MUST be hashed with Argon2 or bcrypt. Login MUST be rate-limited.
- Access/refresh tokens MUST be stored only in OS secure storage (Expo SecureStore /
Keychain / Keystore), never in plain SQLite, AsyncStorage, or logs.
- All server input MUST be validated with DTO/schema validation; uploads MUST be validated by
MIME sniffing, size, and duration on both client and server.
- Secrets (Cloudinary, LiveKit, FCM, database, JWT) MUST live only in server environment
variables. `.env` MUST NOT be committed; `.env.example` MUST list every variable. The mobile
bundle MUST NOT contain any server secret; Cloudinary uploads MUST use short-lived signed
parameters.
- Transport MUST be HTTPS/WSS in any deployed environment.
- APIs MUST return stable machine-readable error codes (e.g., `VIDEO_DURATION_EXCEEDED`); the
client MUST branch on codes, never on message text.
- Logs MUST NOT contain passwords, tokens, signed URLs, message bodies, or media content.

Rationale: a social platform holding private messages and personal videos is a high-value target.

### VI. Privacy & Responsible Deepfake Detection (NON-NEGOTIABLE)

- Data minimization: only data required by an approved spec MAY be collected or stored. Push
payloads MUST NOT contain full private content.
- Post privacy is per post (`Post.visibility`: `PUBLIC` default, or `FOLLOWERS`), evaluated
against current follow state at read time. There MUST be no account-level privacy field.
- Deepfake detection (Roadmap Phase 15 only) MUST obey:
  - Scope: video only; analyzed clips MUST NOT exceed 30 seconds.
  - Routing: clips ≤ 10 s MUST run on-device (offline-capable). Clips > 10 s MUST run on the
  server when connectivity exists. When offline with a clip > 10 s, the app MUST perform a
  partial on-device analysis and label the result clearly as "partial".
  - Consent: no clip may leave the device without an explicit, per-upload consent prompt that
  states which clip is sent and why. Declining MUST NOT upload anything.
  - Retention: server-side clips MUST be deleted immediately after analysis completes or fails;
  clips MUST NOT be retained for model training.
  - Results: shown as a verdict (Real / Fake / Uncertain) plus confidence score, with a visible
  limitation disclaimer. Results MAY be saved to the requesting user's private, synced
  history containing only verdict, score, timestamp, duration, routing mode, and a small
  thumbnail. History MUST be visible only to its owner and deletable by them.
  - Results MUST attach to the analyzed clip/post-view of the requesting user only, MUST NOT be
  published on the post, and MUST NOT label any user account as fake.
  - Model failure or unsupported device MUST produce an explicit error state; fabricated or
  placeholder results are prohibited. No model training occurs in the app.
  - Deepfake analysis MUST NOT run on live call streams.
- Users MUST be able to delete their own posts, messages they authored where specified, and
deepfake history; deletion MUST remove associated media safely and retryably.

Rationale: a tool that judges authenticity of people's videos carries reputational and privacy
risk; consent, minimal retention, and no account labeling are non-negotiable safeguards.

### VII. Test-First for Core Logic

- Tests MUST be written before implementation (red → green → refactor) for core logic: sync
engine and queue, idempotency, error classification, post visibility and conversation
membership checks, media duration/size validation, auth and token lifecycle, and deepfake
routing/consent rules.
- Every backend endpoint in the current phase MUST have integration tests covering success,
validation failure, unauthenticated, and unauthorized cases.
- Roadmap Phases 8 and 11 MUST include tests for: queue survival across restart, automatic
retry, no duplicates on retry, resync after reconnect, and account isolation.
- UI tests are REQUIRED only for critical flows (login, create post, send message, offline
pending state, deepfake consent prompt); other UI MAY rely on manual verification recorded in
the phase report.
- Every bug fix MUST include a regression test that fails without the fix.
- A phase MUST NOT be reported complete with failing, skipped, or commented-out tests.

Rationale: offline sync and permission rules fail silently; only tests prove them.

### VIII. Code Quality & Maintainability

- TypeScript `strict` MUST be enabled on mobile and backend. `any`, `@ts-ignore`, and non-null
assertions require an inline justification comment.
- ESLint and Prettier MUST run in CI with zero errors; warnings MUST NOT increase.
- Naming MUST be descriptive and consistent; one concept, one name across client, server, and
database (e.g., `clientPostId` everywhere).
- Functions SHOULD stay under ~50 lines and files under ~400 lines; exceeding requires a reason
in review.
- Dead code, commented-out code, and unused dependencies MUST be removed before merge.
- Existing code MUST NOT be deleted or rewritten unless the plan demonstrates necessity.
- Timestamps MUST be stored and transmitted in UTC; clients render in device timezone.

Rationale: one developer maintains everything; readability is the main productivity lever.

### IX. Performance, Scalability & Reliability

- All list endpoints (feed, profile posts, comments, followers/following, conversations,
messages, search) MUST use cursor pagination with a server-enforced maximum page size.
- Database queries for feed, conversations, messages, and follows MUST be backed by indexes
declared in the Prisma schema; N+1 queries in list endpoints are defects.
- Media MUST NOT be fully loaded into memory for upload or playback; streaming/chunked upload
is required. Lists MUST show thumbnails; full media loads on open.
- Post and chat UI MUST render from local data immediately (optimistic), without waiting on the
network.
- Background sync MUST cap concurrency (default ≤ 3 parallel operations).
- Uploaded videos MUST NOT exceed 30 s (posts and chat), enforced on client before queueing and
on server; missing duration is rejected. Live calls are exempt.
- Targets for the demo build (verified in Roadmap Phase 16): API p95 < 500 ms for paginated
reads on seeded data; on-device deepfake analysis of a 10 s clip < 15 s on a mid-range device;
cold start to usable screen < 3 s on a mid-range device. Misses MUST be documented with cause.
- Every network operation MUST have a timeout and observable failure state with retry.

Rationale: the app must stay responsive on unreliable mobile networks and modest devices.

### X. Documentation & Traceability

- Every Roadmap Phase MUST have a Spec Kit feature directory containing `spec.md`, `plan.md`,
and `tasks.md`; each task MUST trace to a requirement in the spec.
- Endpoints of the current phase MUST be documented via OpenAPI/Swagger generated from NestJS
decorators before the phase is reported complete.
- `ARCHITECTURE.md`, `.env.example`, and a local-run guide (README) MUST exist from Roadmap
Phase 1 and be updated whenever architecture, environment variables, or run steps change.
- Decisions that are hard to reverse (stack, data model shape, deepfake model/runtime) MUST be
recorded in the relevant `plan.md` with alternatives considered.
- Documentation, code, comments, specs, and UI text MUST be in English.

Rationale: capstone evaluation and future maintenance both depend on traceable decisions.

### XI. AI Coding Agent Conduct (NON-NEGOTIABLE)

- Agents MUST read this constitution and the active feature's spec/plan/tasks before editing.
- Before implementing a phase, agents MUST report: current repository structure and stack,
phases already done, the single next phase and its exit criteria, and conflicts with the PRD
or this constitution. No files are edited during this report step unless the owner says so.
- Agents MUST NOT make irreversible or hard-to-reverse decisions (new dependency, stack change,
schema redesign, data deletion, force-push, history rewrite) without owner approval.
- Agents MUST NOT fabricate results: no fake AI outputs, no mocked APIs presented as real, no
claims that tests pass without running them.
- Agents MUST stay within the current task; unrelated refactors require a separate approved task.
- Agents MUST NOT hardcode API URLs, secrets, or credentials, and MUST NOT commit `.env`.
- At the end of each phase, agents MUST report files created/changed, how to run, tests executed
with results, and remaining risks; then stop and wait for confirmation.
- When requirements are ambiguous or conflict, agents MUST ask rather than assume.

Rationale: AI agents are fast but overconfident; these rules keep the owner in control.

## Product Scope & Technical Constraints

**Product**: TrueSee is a mobile-only (iOS and Android) social network and messaging app for the
general public, with on-demand deepfake detection for videos. Built solo by the owner with AI
coding agents as a university capstone (DACN); the goal is a working, demonstrable prototype.

**Confirmed constraints**:

- Accounts: email + password only. One-way instant follow; no friend requests or approvals.
- Posts: text, images, and videos ≤ 30 s; per-post visibility `PUBLIC` (default) or `FOLLOWERS`.
- Messaging: 1-1 then group chat (≥ 3 active members at creation), text/images/videos ≤ 30 s,
offline compose with automatic sync. Calls: 1-1 voice/video only, after Roadmap Phase 11.
- UI language: English only.
- Deepfake (Roadmap Phase 15): users start a check by picking a video from the device gallery or
by tapping a **DF CHECK** button on a feed post's video. Routing, consent, retention, and
result rules are defined in Principle VI.
- Out of scope: web client or web admin, end-to-end encryption, group calls, livestream, stories
or reels, recommendation algorithms, uploaded videos > 30 s, model training in the app,
labeling accounts as fake, any deepfake work before Roadmap Phase 15.

**PRD deviations (owner-confirmed, supersede** `prd.md` **v1.2 until it is amended)**:

| Topic | `prd.md` v1.2 | Governing rule |
| --- | --- | --- |
| Deepfake max clip | 10 s, longer rejected | 30 s; ≤ 10 s on-device, > 10 s on server |
| Server use | Fallback only on device failure | Primary path for clips > 10 s when online |
| Offline, clip > 10 s | Not analyzed | Partial on-device analysis, labeled partial |
| Entry point | Device clip only | Device clip or DF CHECK on feed post video |
| Result storage | Shown locally only | Private synced history with thumbnail |

Rules preserved from the PRD despite deviations: explicit per-upload consent before any clip
leaves the device; immediate deletion of server clips; no account labeling.

## Development Workflow & Quality Gates

- **Version control**: Git hosted on GitHub. Solo workflow commits directly to `main`; every
push MUST pass CI. Commits MUST be small and use Conventional Commits (`feat:`, `fix:`,
`docs:`, `test:`, `refactor:`, `chore:`). Force-pushing `main` is prohibited.
- **CI (GitHub Actions)** MUST run on every push: install with lockfile, type-check, lint,
unit and integration tests (backend against a disposable PostgreSQL), Prisma migration check.
A red CI MUST be fixed before any new feature work.
- **Constitution Check (plan gate)**: every `plan.md` MUST list each principle (I–XI) with
pass/fail and evidence before research and again after design. Any violation MUST be recorded
in the plan's Complexity Tracking with justification and owner approval.
- **Spec requirements**: each spec MUST name its Roadmap Phase, cite the PRD requirements it
covers, list explicit out-of-scope items for later phases, and define measurable acceptance
criteria.
- **Task requirements**: tasks MUST order tests before implementation for core logic
(Principle VII), include migration tasks for schema changes, and include documentation tasks
(OpenAPI, `ARCHITECTURE.md`, `.env.example`) where affected.
- **Definition of done for a Roadmap Phase**: all exit criteria met; CI green; tests required
by Principle VII written and passing; API documented; no secrets committed; phase report
delivered; owner confirmation received.

## Governance

- This constitution supersedes all other project practices and documents, including `prd.md`,
where they conflict. Specs, plans, tasks, and code reviews MUST verify compliance.
- **Amendments**: proposed via `/speckit-constitution` with the change, rationale, and impact on
existing specs/plans. Only the project owner may approve. Approved amendments MUST update the
version, `Last Amended` date, and the Sync Impact Report, and MUST list affected artifacts to
revise.
- **Versioning (SemVer)**: MAJOR for removing or redefining a principle or approved stack item;
MINOR for adding a principle/section or materially expanding guidance; PATCH for
clarifications and wording.
- **Compliance review**: at the start of every Roadmap Phase and at Roadmap Phase 16 hardening,
the owner (or an agent on request) reviews the codebase against all principles and records
findings in the phase report. Unresolved violations block phase completion.
- **Exceptions**: temporary deviations require a written justification in the plan's Complexity
Tracking, an owner approval, and a removal deadline (a specific Roadmap Phase).
- **PRD synchronization**: when this constitution and `prd.md` diverge, `prd.md` MUST be amended
before the affected Roadmap Phase begins.

**Version**: 1.0.1 | **Ratified**: 2026-11-22 | **Last Amended**: 2026-11-22
