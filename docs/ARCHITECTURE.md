# Architecture

This document describes the Learning todo app: a React frontend, Express API, and PostgreSQL database with JWT authentication, teams, and shared tasks.

## Overview

    Browser (React, :5173)
        |
        |  fetch /api/...  +  Authorization: Bearer <JWT>
        v
    Vite dev proxy
        |
        v
    Express API (:3001, 127.0.0.1)
        |
        v
    PostgreSQL

Production CI builds the static frontend (`dist/`). Full-stack production deployment is not configured yet.

## Frontend (`src/`)

| File | Role |
|------|------|
| `App.jsx` | Auth gate; renders invitations, teams, and todo UI |
| `Auth.jsx` | Login and register forms |
| `Teams.jsx` | Create teams; owners invite by username |
| `Invitations.jsx` | Pending invites; accept or reject |
| `ToDo.jsx` | Task list with personal/team scope |
| `Form.jsx` | Task input with personal/team selector |
| `List.jsx` | Task name and description display |
| `api/client.js` | Shared `fetch` wrapper with JWT header |
| `api/teams.js` | Team list, create, invite |
| `api/invitations.js` | List, accept, reject invitations |
| `api/tasks.js` | List, create, delete tasks |

After login, pending invitations and teams load in the main shell. Tasks include a `canComplete` flag from the API; the UI hides **Done!** when the user is not allowed to complete.

## API (`server/`)

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Liveness check |
| `POST /api/auth/register` | Create account, return JWT |
| `POST /api/auth/login` | Authenticate, return JWT |
| `GET /api/auth/me` | Current user (requires JWT) |
| `POST /api/teams` | Create team (caller becomes owner + member) |
| `GET /api/teams` | List teams the user belongs to |
| `POST /api/teams/:teamId/invitations` | Owner invites user by username |
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

## HTTP API contract

    POST   /api/teams                         { name }
    GET    /api/teams                         → [{ id, name, ownerId, isOwner }]
    POST   /api/teams/:teamId/invitations     { username }
    GET    /api/invitations                   → [{ id, teamId, teamName, invitedByUsername }]
    POST   /api/invitations/:id/accept
    POST   /api/invitations/:id/reject

    GET    /api/tasks   → [{ id, name, description, scope, teamId, teamName, createdByUserId, canComplete }]
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

GitHub Actions starts PostgreSQL, runs migrations, boots the API, lints, builds the frontend, and uploads `dist`.
