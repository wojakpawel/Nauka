# Architecture

This document describes the Learning todo app: a React frontend, Express API, and PostgreSQL database with JWT authentication.

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
| `App.jsx` | Root shell; gates todo UI behind auth |
| `Auth.jsx` | Login and register forms |
| `ToDo.jsx` | Task list loaded from API |
| `Form.jsx` | Task name + description input |
| `List.jsx` | Renders a single task card |
| `Counter.jsx` | Unrelated counter demo |
| `styles.css` | Global styles |
| `api/client.js` | Shared `fetch` wrapper with JWT header |
| `api/token.js` | `localStorage` read/write for `authToken` |
| `api/auth.js` | Register, login, logout, getMe |
| `api/tasks.js` | List, create, delete tasks |

After login, tasks load from `GET /api/tasks`. The JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every API request.

## API (`server/`)

Express app with JSON body parsing and route modules:

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Liveness check |
| `POST /api/auth/register` | Create account, return JWT |
| `POST /api/auth/login` | Authenticate, return JWT |
| `GET /api/auth/me` | Current user (requires JWT) |
| `GET /api/tasks` | List tasks for authenticated user |
| `POST /api/tasks` | Create task for authenticated user |
| `DELETE /api/tasks/:id` | Delete task owned by authenticated user |

### Authentication (JWT)

Auth is stateless: the server does not keep session records.

1. **Register** or **login** validates credentials, hashes the password (register only), returns a signed JWT.
2. The frontend stores the token in `localStorage` as `authToken`.
3. Protected requests send `Authorization: Bearer <token>`.
4. `requireAuth` middleware verifies signature and expiry, sets `req.userId`.
5. **Logout** is client-only: remove the token from `localStorage`.

Environment variables (see `.env.example`):

- `JWT_SECRET` — signing key (required; use a long random value)
- `JWT_EXPIRES_IN` — token lifetime (default `7d`)
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — API port (default `3001`)

### Security properties

- Passwords hashed with **bcrypt** before insert; `password_hash` column only
- All SQL uses **parameterized queries** — no string concatenation of user input
- Task **authorization** enforced in SQL (`WHERE user_id = $1` / delete matches `user_id`)
- Login failures return a generic message (no password leak via error text)
- API binds to **127.0.0.1** in development

Not implemented (acceptable for local learning use): rate limiting, HTTPS, refresh tokens, httpOnly cookies, CSRF protection.

### Error responses

    { "error": "Human-readable message" }

Typical codes: `400` validation, `401` missing/invalid token, `409` duplicate username, `404` task not found, `500` server error.

## Database (PostgreSQL)

**Local dev without Docker:** `npm run db:start` runs embedded PostgreSQL (`scripts/start-postgres.mjs`); data in `data/pg/`.

**Local dev with Docker:** `docker compose up -d` (see `docker-compose.yml`).

Default connection string:

    postgresql://learning:learning@127.0.0.1:5432/learning

Schema (`server/db/schema.sql`):

**users** — `id` (UUID), `username` (unique), `password_hash`, `created_at`

**tasks** — `id` (UUID), `user_id` (FK → users, CASCADE), `name`, `description`, `created_at`

Apply schema: `npm run db:migrate`

## HTTP API contract

    POST   /api/auth/register   { username, password }  → 201 { token, user: { id, username } }
    POST   /api/auth/login      { username, password }  → 200 { token, user: { id, username } }
    GET    /api/auth/me         Authorization: Bearer   → 200 { id, username } | 401

    GET    /api/tasks           Authorization: Bearer   → 200 [{ id, name, description }]
    POST   /api/tasks           { name, description }   → 201 { id, name, description }
    DELETE /api/tasks/:id       Authorization: Bearer   → 204 | 404

Validation: username 3–32 chars `[a-zA-Z0-9_]`, password minimum 8 characters.

## Key dependencies

| Package | Use |
|---------|-----|
| `express` | HTTP server |
| `pg` | PostgreSQL connection pool |
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT sign and verify |
| `embedded-postgres` | Local PostgreSQL without Docker (dev) |
| `concurrently`, `wait-on` | Run DB + API + Vite together |

## CI

GitHub Actions (`.github/workflows/build-and-deploy.yml`) uses a PostgreSQL service container, runs `npm run db:migrate`, starts the API, lints, builds the frontend, and uploads `dist`.
