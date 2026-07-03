# Architecture

This document describes the Learning todo app: a React frontend, Express API, and PostgreSQL database with JWT authentication, teams, and shared tasks.

## Overview

    Browser (React, Vite dev server — localhost + LAN when host: true)
        |
        |  fetch /api/...  +  Authorization: Bearer <JWT>
        v
    Vite dev proxy (/api → 127.0.0.1:3001)
        |
        v
    Express API (:3001, 127.0.0.1)
        |
        v
    PostgreSQL

Production CI builds the static frontend (`dist/`). Full-stack production deployment is not configured yet.

**Local phone testing:** `vite.config.js` sets `server.host: true` so Vite prints a Network URL on the LAN. The Express API still listens on `127.0.0.1` only; phones reach it through the Vite proxy. Suitable for trusted home Wi‑Fi during development, not for public exposure.

## Frontend (`src/`)

| File | Role |
|------|------|
| `App.jsx` | Auth gate; renders invitations, teams, and todo UI |
| `Auth.jsx` | Login and register forms |
| `Teams.jsx` | Create teams; collapsible member list; owner invite/kick/delete; member leave |
| `Invitations.jsx` | Pending invites; accept or reject |
| `ToDo.jsx` | Task list with personal/team scope and creator attribution |
| `Form.jsx` | Task input with personal/team selector |
| `List.jsx` | Task name and description display |
| `api/client.js` | Shared `fetch` wrapper with JWT header |
| `api/teams.js` | Team list, create, invite, members, kick, leave, delete |
| `api/invitations.js` | List, accept, reject invitations |
| `api/tasks.js` | List, create, delete tasks |

After login, pending invitations and teams load in the main shell. Tasks include `canComplete` and `showCreator` flags from the API; the UI hides **Done!** when the user is not allowed to complete and shows creator attribution only when `showCreator` is true.

## API (`server/`)

| File | Role |
|------|------|
| `app.js` | Express app (shared by `index.js` and smoke tests) |
| `index.js` | Starts the HTTP listener |
| `smoke.test.js` | API smoke test |
| `routes/auth.js` | Register, login, current user |
| `routes/tasks.js` | Personal and team tasks |
| `routes/teams.js` | Teams, members, invitations, kick, leave, delete |
| `routes/invitations.js` | Accept and reject invitations |

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Liveness check |
| `POST /api/auth/register` | Create account, return JWT |
| `POST /api/auth/login` | Authenticate, return JWT |
| `GET /api/auth/me` | Current user (requires JWT) |
| `POST /api/teams` | Create team (caller becomes owner + member) |
| `GET /api/teams` | List teams the user belongs to |
| `GET /api/teams/:teamId/members` | List team members (members only) |
| `POST /api/teams/:teamId/invitations` | Owner invites user by username |
| `DELETE /api/teams/:teamId/members/:userId` | Owner kicks a member |
| `POST /api/teams/:teamId/leave` | Non-owner member leaves team |
| `DELETE /api/teams/:teamId` | Owner deletes team (cascades tasks) |
| `GET /api/invitations` | Pending invitations for current user |
| `POST /api/invitations/:id/accept` | Accept invitation, join team |
| `POST /api/invitations/:id/reject` | Reject invitation |
| `GET /api/tasks` | Personal + team tasks for current user |
| `POST /api/tasks` | Create personal or team task |
| `DELETE /api/tasks/:id` | Complete task (authorized users only) |

### Authentication (JWT)

Auth is stateless. The frontend stores the token in `localStorage` as `authToken` and sends `Authorization: Bearer <token>` on protected requests. `requireAuth` middleware sets `req.userId`.

### Authorization rules

| Action | Who may perform it |
|--------|-------------------|
| Create team | Any authenticated user |
| Invite to team | Team owner only |
| View team members | Team member |
| Kick member | Team owner only (not self) |
| Leave team | Non-owner member |
| Delete team | Team owner only |
| Accept/reject invitation | Invited user only |
| Create team task | Team member |
| View personal task | Task owner (`user_id`) |
| View team task | Any member of that team |
| Complete personal task | Task creator |
| Complete team task | Task creator **or** team owner |

The server enforces all rules in route handlers; `canComplete` on `GET /api/tasks` is a UI hint only.

### Security properties

- Passwords hashed with **bcrypt** before storage
- All SQL uses **parameterized queries**
- JSON body size limited to **16 KB**
- Invitation accept uses a **transaction** with `FOR UPDATE` to avoid races
- Tasks not visible to the user return **404** (not 403) on delete

Not implemented (acceptable for local learning use): rate limiting, HTTPS, refresh tokens, httpOnly cookies.

### Error responses

    { "error": "Human-readable message" }

Typical codes: `400` validation, `401` auth, `403` forbidden, `404` not found, `409` conflict, `500` server error.

## Database (PostgreSQL)

**Local dev:** `npm run db:start` (embedded) or `docker compose up -d`.

Default connection string:

    postgresql://learning:learning@127.0.0.1:5432/learning

**Tables:**

- `users` — accounts
- `teams` — `name`, `owner_id`
- `team_members` — membership (`team_id`, `user_id`)
- `team_invitations` — `status`: `pending` | `accepted` | `rejected`
- `tasks` — personal (`team_id` NULL, `user_id` set) or team (`team_id` set); always has `created_by_user_id`

Apply schema: `npm run db:migrate`

## Testing

`npm run test` migrates the database and runs `server/smoke.test.js` with Node's built-in test runner. The test spins up the Express app on a random port (no separate `dev:server` needed) and exercises:

- health check
- register two users
- create team, list members, invite and accept
- create team task; verify `showCreator` for the non-creator
- member leave; owner delete team; verify tasks are gone

Requires PostgreSQL (same `DATABASE_URL` as local dev). CI runs this on push to `main`.

## HTTP API contract

    POST   /api/teams                         { name }
    GET    /api/teams                         → [{ id, name, ownerId, isOwner }]
    GET    /api/teams/:teamId/members         → [{ userId, username, isOwner, joinedAt }]
    POST   /api/teams/:teamId/invitations     { username }
    DELETE /api/teams/:teamId/members/:userId
    POST   /api/teams/:teamId/leave
    DELETE /api/teams/:teamId
    GET    /api/invitations                   → [{ id, teamId, teamName, invitedByUsername }]
    POST   /api/invitations/:id/accept
    POST   /api/invitations/:id/reject

    GET    /api/tasks   → [{ id, name, description, scope, teamId, teamName, createdByUserId, createdByUsername, showCreator, canComplete }]
    POST   /api/tasks   { name, description, teamId?: null | uuid }
    DELETE /api/tasks/:id

## Key dependencies

| Package | Use |
|---------|-----|
| `express` | HTTP server |
| `pg` | PostgreSQL connection pool |
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT sign and verify |
| `embedded-postgres` | Local PostgreSQL without Docker |
| `concurrently`, `wait-on` | Run DB + API + Vite together |

## CI

GitHub Actions starts PostgreSQL, runs migrations, runs `npm run test`, lints, builds the frontend, and uploads `dist`.
