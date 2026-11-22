# TrueSee

TrueSee is a mobile messaging app with deepfake awareness. This repository holds two independent
npm projects:

| Folder | What it is |
| --- | --- |
| `TrueSeeBE/` | Backend API — NestJS 12, PostgreSQL 18 via Prisma 7, REST under `/api/v1` |
| `TrueSeeFE/` | Mobile app — React Native 0.88 + Expo SDK 58 (development build), TypeScript |

The current state is **Roadmap Phase 1 — Local Foundation**: the backend exposes one liveness
endpoint and the app shows a single screen with the backend connection state. Product
requirements are in [`prd.md`](./prd.md), governance in
[`.specify/memory/constitution.md`](./.specify/memory/constitution.md), and the structure in
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Prerequisites

| Tool | Minimum version |
| --- | --- |
| Node.js | 22.13 (and below 23) |
| npm | 10 |
| Git | any recent version |
| Docker Desktop / Docker Engine with Compose v2 | any recent version |
| JDK | 17 |
| Android SDK (`ANDROID_HOME` set) | platform tools + an emulator image, or a physical phone |
| Android device or emulator | **Android 8.0 (API 26)** or newer |

iOS is not an acceptance target in Phase 1 (the build is configured but not verified).

## 1. Clone and configure

```powershell
git clone https://github.com/fino-2401ft/TrueSee.git
cd TrueSee
Copy-Item .env.example .env
Copy-Item TrueSeeBE/.env.example TrueSeeBE/.env
Copy-Item TrueSeeFE/.env.example TrueSeeFE/.env
```

(bash: use `cp` instead of `Copy-Item`.) Every variable is described in its `.env.example`.
`.env` files are git-ignored and must never be committed.

## 2. Start the database

```powershell
docker compose up -d
docker compose ps        # wait until the db service is "healthy"
```

This starts PostgreSQL 18 with a development database (`truesee`) and a test database
(`truesee_test`, created on first start).

**Port 5432 already in use?** (for example by a locally installed PostgreSQL) Set another port in
the root `.env` (`POSTGRES_PORT=5434`), use the same port in `TrueSeeBE/.env` (`DATABASE_URL=…:5434/truesee`
and `TEST_DATABASE_URL=…:5434/truesee_test`), then run `docker compose up -d` again.

## 3. Run the backend

```powershell
cd TrueSeeBE
npm ci
npm run prisma:migrate   # applies the baseline migration; safe to run repeatedly
npm run start:dev
```

Check it: `curl.exe -i http://localhost:3000/api/v1/health` → `200 {"status":"ok","database":"up"}`.
API docs (development only): <http://localhost:3000/api/docs>.

The backend refuses to start if configuration is invalid (`CONFIG_INVALID`, naming the variable)
or if the database is unreachable for `DB_CONNECT_TIMEOUT_MS` (`DATABASE_UNREACHABLE`).

## 4. Run the mobile app (Android)

Set the backend address in `TrueSeeFE/.env`:

| Running on | `EXPO_PUBLIC_API_BASE_URL` |
| --- | --- |
| Android emulator | `http://10.0.2.2:3000/api/v1` (10.0.2.2 is your computer, seen from the emulator) |
| Physical phone on the same Wi-Fi | `http://<your-computer-LAN-IP>:3000/api/v1`, e.g. `http://192.168.1.20:3000/api/v1` |

For a physical phone, allow inbound TCP 3000 through the Windows firewall. The backend already
listens on all interfaces (`HOST=0.0.0.0`).

```powershell
cd TrueSeeFE
npm ci
npm run android          # builds the development build and installs it (first build takes a while)
```

The app shows `TrueSee`, the environment, and one of: `Backend: reachable`,
`Backend: reachable, database unavailable`, or `Backend: unreachable` (with a Retry button).
After changing `.env`, restart the bundler (`npm start`) so the new values are inlined.

## 5. Quality checks

Run inside `TrueSeeBE/` or `TrueSeeFE/`:

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | TypeScript strict type check |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm run format:check` / `npm run format` | Check / apply Prettier formatting |
| `npm test` | Unit and component tests |
| `npm run test:integration` | Backend only: API tests against `truesee_test` (database must be running) |

The same checks run in GitHub Actions on every push to `main` and on pull requests
(`.github/workflows/ci.yml`).

## Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
`test:`, `docs:`, `chore:`, `ci:`). Never force-push `main`.
