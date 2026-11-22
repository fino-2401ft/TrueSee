# Contract: Backend Log Entries (FR-008, FR-008a)

Applies to every log entry the backend emits, from Phase 1 onward.

## JSON format (`LOG_FORMAT=json`, default for `test`/CI)

One JSON object per line.

| Field | Required | Notes |
| --- | --- | --- |
| `time` | always | ISO 8601 UTC, e.g. `2026-11-22T10:00:00.000Z` |
| `level` | always | Label: `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `msg` | always | Human-readable message |
| `reqId` | request-scoped entries | UUID; equals the `X-Request-Id` response header |
| `req` | request log | `method`, `url` (path + query) only; headers after redaction |
| `res` | request log | `statusCode` |
| `responseTime` | request log | milliseconds |
| `code` | when applicable | Stable event code, e.g. `DATABASE_UNREACHABLE`, `CONFIG_INVALID` |

Example request log:

```json
{"time":"2026-11-22T10:00:00.000Z","level":"info","reqId":"0b6f3c1e-8a4d-4f7e-9c2a-1d5e6f7a8b9c","req":{"method":"GET","url":"/api/v1/unknown"},"res":{"statusCode":404},"responseTime":3,"msg":"request completed"}
```

## Pretty format (`LOG_FORMAT=pretty`, default for `development`)

Same fields rendered as a colored single line for humans. Content and redaction are identical.

## Redaction rule (central, not per caller)

Any field whose key matches the list below, at any of the configured paths (request headers,
request body, top-level log object), is replaced with `[REDACTED]`:

`password`, `token`, `accessToken`, `refreshToken`, `authorization`, `cookie`, `set-cookie`,
`secret`, `databaseUrl`, `DATABASE_URL`

Additional rules:

- The database URL is never passed to the logger; startup logs only `host:port/database`.
- Message bodies, media content, signed URLs, and tokens MUST NOT be logged (Constitution V).
- Health-check request logs use level `debug`.

## Verification

- Unit test: logging an object containing each listed key yields `[REDACTED]` for every value.
- Integration test: a request with an `Authorization` header produces a request log whose header
  value is `[REDACTED]`, and every request-scoped entry carries the same `reqId` as the response
  header (SC-008).
