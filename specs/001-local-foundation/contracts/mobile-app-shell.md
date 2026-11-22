# Contract: Mobile App Shell Screen (FR-013, FR-014)

The only screen in Phase 1. No navigation, routes, tabs, or buttons other than **Retry**.

## Content

| Element | Content |
| --- | --- |
| Title | `TrueSee` |
| Environment line | `Environment: <EXPO_PUBLIC_APP_ENV>` |
| Connection line | One of the texts below |
| Retry button | Visible in every state except `checking` and `misconfigured` |

## Connection states and exact texts

| State | Text | Retry |
| --- | --- | --- |
| `checking` | `Checking backend…` | hidden |
| `reachable` | `Backend: reachable` | visible |
| `databaseUnavailable` | `Backend: reachable, database unavailable` | visible |
| `unreachable` | `Backend: unreachable` | visible |
| `misconfigured` | `Configuration error: <VARIABLE_NAME> is missing or invalid` | hidden |

Mapping from request outcome to state: see [data-model.md §6](../data-model.md).

## Behaviour

- On first render, perform one `GET {EXPO_PUBLIC_API_BASE_URL}/health` with a 10-second timeout.
- A final state is shown within 10 seconds of opening in every case (SC-002).
- Tapping **Retry** returns to `checking` and repeats the request; double taps do not start a
  second request.
- The app never crashes on network errors or malformed responses.

## Test IDs

`app-shell-title`, `app-shell-environment`, `app-shell-connection`, `app-shell-retry` — used by
component tests.
