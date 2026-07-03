# Add user accounts and per-user persisted tasks

**IMPLEMENTER INSTRUCTION: Keep this plan up to date as you work.**
After each significant step, update the `Progress` section with what was done and what's next. If context is lost or you are interrupted, the plan must contain everything needed to resume. Treat the plan as the single source of truth for this work.

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

Reference: This plan follows conventions from `AGENTS.md`, `docs/ARCHITECTURE.md`, and `docs/exec-plans/create-plan-file.md`.

## Purpose / Big Picture

Today the todo app keeps tasks only in browser memory inside `src/ToDo.jsx`. Refreshing the page clears every task, and there is no concept of a user.

After this work, a person can create an account with a username and password, log in, add tasks, mark tasks done, log out, and log back in to see the same tasks. Each user sees only their own tasks. You prove it works by registering two users in the browser, giving each different tasks, and confirming neither user can see the other's list after login.

## Assumptions

- Local development runs on macOS, Linux, or WSL with Node.js 20+ (matching CI) and Docker for PostgreSQL.
- It is acceptable to add a small Node.js API server alongside the existing Vite frontend; the app is no longer frontend-only after this plan.
- Passwords are hashed before storage; plain-text passwords are never written to the database or logs.
- PostgreSQL runs locally via `docker compose up -d`; connection string comes from `DATABASE_URL`.
- Auth uses **JWT** (stateless tokens), not server-side sessions. The frontend stores the token in `localStorage`.
- The existing task UI (`Form`, `List`, task list layout in `ToDo`) stays visually the same; we add auth screens and wire persistence behind the existing interactions.

## Open Questions

None at plan authoring time. Decisions below are recorded in the Decision Log.

## Progress

- [x] (2026-07-03) Milestone 1: Docker PostgreSQL, API scaffold, schema migration
- [x] (2026-07-03) Milestone 2: Register, login, JWT middleware
- [x] (2026-07-03) Milestone 3: Task CRUD API scoped to authenticated user
- [x] (2026-07-03) Milestone 4: Frontend auth UI and JWT bootstrap
- [x] (2026-07-03) Milestone 5: Replace in-memory tasks with API calls in `ToDo.jsx`
- [x] (2026-07-03) Milestone 6: Dev scripts, Vite proxy, lint/build/CI verification
- [ ] Manual browser acceptance (requires Docker Postgres running locally)

## Surprises & Discoveries

- Observation: Docker daemon was not available in the implementation environment; `npm run lint` and `npm run build` pass without a running database.
  Evidence: `eslint .` exit 0; `vite build` exit 0.

## Decision Log

- Decision: Use Express 4 as the API server in a new `server/` directory at the repo root.
  Rationale: Minimal setup, widely understood, fits a learning repo without introducing a heavier framework.
  Date/Author: 2026-07-03 / plan author

- Decision: Use PostgreSQL via the `pg` package and a connection pool; local database via Docker Compose.
  Rationale: Matches target architecture in `docs/ARCHITECTURE.md`; relational DB with realistic dev/prod path.
  Date/Author: 2026-07-03 / plan author

- Decision: Authenticate with JWT (`jsonwebtoken`); return token on register/login; verify in `requireAuth` middleware.
  Rationale: Stateless auth, no session store; frontend sends `Authorization: Bearer` on each request.
  Date/Author: 2026-07-03 / plan author

- Decision: Store JWT in `localStorage` under key `authToken`; logout clears that key only.
  Rationale: Survives page refresh so users stay logged in; no cookie/session server dependency.
  Date/Author: 2026-07-03 / plan author

- Decision: Hash passwords with `bcrypt` (cost factor 10).
  Rationale: Standard practice; never store reversible passwords.
  Date/Author: 2026-07-03 / plan author

- Decision: Username rules: 3–32 characters, letters, digits, and underscore only; unique in the database. Password rules: minimum 8 characters.
  Rationale: Prevents empty/trivial accounts without heavy validation UI.
  Date/Author: 2026-07-03 / plan author

- Decision: API listens on port `3001`; Vite dev server proxies `/api` to it via `vite.config.js`.
  Rationale: Avoids CORS complexity during local dev; frontend always calls relative `/api/...` URLs.
  Date/Author: 2026-07-03 / plan author

- Decision: Default `DATABASE_URL` for local dev: `postgresql://learning:learning@localhost:5432/learning`.
  Rationale: Matches `docker-compose.yml` credentials; overridable via `.env`.
  Date/Author: 2026-07-03 / plan author

- Decision: Superseded SQLite + express-session (2026-07-03 initial draft) with PostgreSQL + JWT per maintainer request.
  Rationale: Aligns with `docs/ARCHITECTURE.md` and preferred stack.
  Date/Author: 2026-07-03 / plan revision

- Decision: GitHub Actions uses a PostgreSQL service container for API smoke checks once the server exists.
  Rationale: CI must prove migrations and server boot against real Postgres, not SQLite.
  Date/Author: 2026-07-03 / plan author

## Outcomes & Retrospective

Implementation complete in code. Backend (`server/`), frontend auth/API client (`src/api/`, `src/Auth.jsx`), and documentation (`README.md`, CI workflow) match the JWT + PostgreSQL architecture in `docs/ARCHITECTURE.md`.

Remaining: run manual acceptance locally with `docker compose up -d`, `npm run db:migrate`, and `npm run dev:all`. Move this plan to `docs/exec-plans/completed/` when merged.

## Context and Orientation

This repository is a Vite + React 19 learning project. The entry point is `index.html`, which loads `src/App.jsx`. `App.jsx` renders `Counter` and `ToDo`. Task functionality lives in:

- `src/ToDo.jsx` — owns task state as `useState(new Map())`, generates IDs with `crypto.randomUUID()`, passes `{ name, description }` objects
- `src/Form.jsx` — form to add a task; calls `onSubmit({ name, description })`
- `src/List.jsx` — displays task name and description
- `src/styles.css` — shared styles

There is no backend today. Tasks disappear on refresh.

Read `docs/ARCHITECTURE.md` for the canonical system diagram, schema, and API contract. This plan implements that document.

**Terms used in this plan:**

- **API server** — a Node.js program in `server/` that listens for HTTP requests and talks to PostgreSQL.
- **JWT (JSON Web Token)** — a signed string the API issues on login; the browser sends it on later requests to prove identity without sending the password again.
- **Middleware** — Express functions that run before a route handler; `requireAuth` verifies the JWT and rejects invalid or missing tokens with `401`.
- **Connection pool** — a `pg.Pool` instance that reuses database connections efficiently.

**Target architecture after implementation:**

    Browser (Vite, port 5173)
        fetch /api/... + Authorization: Bearer <JWT>
            -->  Vite proxy  -->  Express (port 3001)
                                        |
                                        v
                                  PostgreSQL (Docker, port 5432)

**Database schema (PostgreSQL):**

    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    users
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
      username      VARCHAR(32) NOT NULL UNIQUE
      password_hash TEXT NOT NULL
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()

    tasks
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
      name          TEXT NOT NULL
      description   TEXT NOT NULL DEFAULT ''
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()

**HTTP API (final):**

    POST   /api/auth/register   body: { username, password }  -> 201 { token, user: { id, username } }
    POST   /api/auth/login      body: { username, password }  -> 200 { token, user: { id, username } }
    GET    /api/auth/me         header: Authorization: Bearer  -> 200 { id, username } or 401

    GET    /api/tasks           header: Authorization: Bearer  -> 200 [{ id, name, description }]
    POST   /api/tasks           body: { name, description }   -> 201 { id, name, description }
    DELETE /api/tasks/:id       header: Authorization: Bearer  -> 204 or 404

There is no server logout endpoint; logout removes `authToken` from `localStorage` on the client.

All `/api/tasks` and `GET /api/auth/me` require a valid JWT. Error responses use JSON: `{ error: "message" }` with appropriate status codes (400, 401, 409, 500).

## Plan of Work

Work proceeds in six milestones. Each milestone leaves the repo in a runnable state.

### Milestone 1: Docker PostgreSQL, API scaffold, schema migration

Create the backend skeleton and database tooling.

Add `docker-compose.yml` at repo root:

    services:
      postgres:
        image: postgres:16-alpine
        environment:
          POSTGRES_USER: learning
          POSTGRES_PASSWORD: learning
          POSTGRES_DB: learning
        ports:
          - "5432:5432"
        volumes:
          - postgres_data:/var/lib/postgresql/data
    volumes:
      postgres_data:

Add `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `PORT=3001`. Add `.env` to `.gitignore`.

Add dependencies: `express`, `pg`, `bcrypt`, `jsonwebtoken`, and dev dependency `concurrently`.

Create `server/db/schema.sql` with the PostgreSQL tables above (`CREATE TABLE IF NOT EXISTS` or idempotent migration pattern).

Create `server/db/migrate.js` that reads `DATABASE_URL`, connects with `pg`, runs `schema.sql`, exits 0 on success.

Create `server/db/index.js` exporting a `pg.Pool` configured from `DATABASE_URL`.

Create `server/index.js` that:
- creates an Express app
- parses JSON bodies
- mounts `GET /api/health` returning `{ ok: true }`
- listens on `process.env.PORT || 3001`

Add npm scripts:

    "dev:server": "node server/index.js"
    "db:migrate": "node server/db/migrate.js"

### Milestone 2: Register, login, JWT middleware

Add auth routes and token verification.

Create `server/lib/jwt.js`:
- `signToken(userId)` — signs `{ sub: userId }` with `JWT_SECRET`, expiry from `JWT_EXPIRES_IN` (default `7d`)
- `verifyToken(token)` — returns payload or throws

Create `server/middleware/requireAuth.js`:
- read `Authorization` header, expect `Bearer <token>`
- verify JWT, set `req.userId` from `payload.sub`
- on failure respond `401 { error: "Not authenticated" }`

Create `server/routes/auth.js`:

- `POST /register` — validate username/password; reject duplicate username with `409`; hash password; insert user; return `{ token, user: { id, username } }` with `201`
- `POST /login` — find user by username; `bcrypt.compare`; on success return token + user; on failure `401`
- `GET /me` — behind `requireAuth`; return `{ id, username }` from database

Mount at `/api/auth` in `server/index.js`.

Add `server/lib/validation.js` for username/password checks.

### Milestone 3: Task CRUD API scoped to user

Create `server/routes/tasks.js`:

- `GET /` — query tasks where `user_id = $1` (`req.userId`), ordered by `created_at`
- `POST /` — validate non-empty trimmed `name`; insert with `user_id = req.userId`; return created row
- `DELETE /:id` — delete where `id` and `user_id` match; `404` if no row deleted

Use parameterized queries (`$1`, `$2`) everywhere — never interpolate user input into SQL.

Mount at `/api/tasks` behind `requireAuth` in `server/index.js`.

### Milestone 4: Frontend auth UI and JWT bootstrap

Create `src/api/token.js`:
- `getToken()`, `setToken(token)`, `clearToken()` — read/write/remove `localStorage.authToken`

Create `src/api/client.js` — thin `fetch` wrapper:
- attach `Authorization: Bearer <token>` when token exists
- `Content-Type: application/json`
- parse JSON; throw readable errors from `{ error }` responses
- on `401`, clear token and optionally surface "session expired"

Create `src/api/auth.js` — `register`, `login`, `logout` (clear token only), `getMe` (calls `/api/auth/me`).

Create `src/Auth.jsx` — login/register forms; on success call `setToken` and notify parent.

Update `src/App.jsx`:
- on mount, if token exists call `getMe()`; while loading show "Loading..."
- if not authenticated, render `Auth`
- if authenticated, render `ToDo` with `user` and `onLogout` (clears token, resets state)

### Milestone 5: Replace in-memory tasks with API

Create `src/api/tasks.js` — `listTasks`, `createTask`, `deleteTask`.

Refactor `src/ToDo.jsx`:
- remove in-memory `Map` as source of truth
- on mount, `listTasks()` into state
- `handleAddTask` → `createTask` then update state
- `handleRemoveTask` → `deleteTask` then update state
- loading and error UI; disable form during mutations

### Milestone 6: Dev scripts, Vite proxy, verification

Update `vite.config.js`:

    server: {
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },

Add scripts:

    "dev:all": "concurrently \"npm run dev:server\" \"npm run dev\""

Add `server/README.md` — env vars, `docker compose up -d`, `npm run db:migrate`.

Update `README.md` and `docs/ARCHITECTURE.md` if implementation diverges from documented contracts.

Update `.github/workflows/build-and-deploy.yml`:
- add PostgreSQL service container
- set `DATABASE_URL`, `JWT_SECRET` for the job
- run `npm run db:migrate`, start API in background, then `npm run lint` and `npm run build`

Run full acceptance. Move this plan to `docs/exec-plans/completed/` when the PR merges.

## Concrete Steps

From the repository root:

    docker compose up -d
    # Expected: postgres listening on 5432

    cp .env.example .env
    # Edit .env if needed; set JWT_SECRET to any long random string for local dev

    npm install express pg bcrypt jsonwebtoken
    npm install -D concurrently

    npm run db:migrate
    # Expected: tables created, exit 0

    npm run dev:server
    # In another terminal:
    curl -s http://localhost:3001/api/health
    # Expected: {"ok":true}

After auth routes exist:

    curl -s -X POST http://localhost:3001/api/auth/register \
      -H 'Content-Type: application/json' \
      -d '{"username":"alice","password":"password123"}'
    # Expected: 201 {"token":"eyJ...","user":{"id":"...","username":"alice"}}

    export TOKEN="<paste token from above>"

    curl -s http://localhost:3001/api/auth/me \
      -H "Authorization: Bearer $TOKEN"
    # Expected: 200 {"id":"...","username":"alice"}

After task routes exist:

    curl -s -X POST http://localhost:3001/api/tasks \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d '{"name":"Buy milk","description":"2%"}'
    # Expected: 201 with id and fields

    curl -s http://localhost:3001/api/tasks \
      -H "Authorization: Bearer $TOKEN"
    # Expected: array with one task

Full stack:

    npm run dev:all
    # Open http://localhost:5173

    npm run lint
    npm run build

## Validation and Acceptance

**Account system**

1. Start `docker compose up -d`, `npm run db:migrate`, `npm run dev:all`.
2. Open `http://localhost:5173`.
3. Register user `alice` with password `password123`. Expect todo UI with username shown.
4. Refresh the page. Expect still logged in as `alice` (JWT in localStorage).
5. Log out. Expect auth form.
6. Log in as `alice`. Expect todo UI again.
7. Register fails visibly for duplicate username or short password.

**Per-user persisted tasks**

1. As `alice`, add "Task A". Refresh — task remains.
2. Log out. Register/login as `bob` — empty list.
3. Add "Task B" for bob. Log in as `alice` — only "Task A".
4. Mark task done — removed and stays removed after refresh.

**Invalid token**

1. In browser devtools, set `localStorage.authToken` to `invalid`.
2. Refresh. Expect redirect to auth UI or clear error, not a crash.

**Commands**

    npm run lint
    npm run build
    npm run db:migrate

All succeed with PostgreSQL running.

## Idempotence and Recovery

- `npm run db:migrate` is idempotent (`IF NOT EXISTS` / safe re-run).
- `docker compose down -v` wipes the database volume — safe reset for local dev.
- If port 5432 or 3001 is in use, stop conflicting services or change ports in `docker-compose.yml` / `PORT`.
- If JWT verification fails after deploy, check `JWT_SECRET` matches between token issuance and verification.

## Artifacts and Notes

Example register response:

    HTTP/1.1 201 Created
    {"token":"eyJhbGciOiJIUzI1NiIs...","user":{"id":"...","username":"alice"}}

Example authorized task list:

    [{"id":"...","name":"Buy milk","description":"2%"}]

## Interfaces and Dependencies

**npm packages (production)**

- `express` — HTTP server
- `pg` — PostgreSQL client (pool)
- `bcrypt` — password hashing
- `jsonwebtoken` — JWT sign and verify

**npm packages (dev)**

- `concurrently` — run API and Vite together

**`server/db/index.js`**

    import pg from 'pg';
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    export default pool;

**`server/lib/jwt.js`**

    import jwt from 'jsonwebtoken';
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    export function signToken(userId) {
      return jwt.sign({ sub: userId }, secret, { expiresIn });
    }

    export function verifyToken(token) {
      return jwt.verify(token, secret);
    }

**`server/middleware/requireAuth.js`**

    export function requireAuth(req, res, next) {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      try {
        const payload = verifyToken(header.slice(7));
        req.userId = payload.sub;
        next();
      } catch {
        return res.status(401).json({ error: 'Not authenticated' });
      }
    }

**`src/api/client.js`**

    import { getToken } from './token.js';

    export async function api(path, options = {}) {
      const headers = { 'Content-Type': 'application/json', ...options.headers };
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(path, { ...options, headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }
      if (res.status === 204) return null;
      return res.json();
    }

**New/changed files (checklist)**

    docker-compose.yml
    .env.example
    server/index.js
    server/db/schema.sql
    server/db/migrate.js
    server/db/index.js
    server/lib/jwt.js
    server/lib/validation.js
    server/middleware/requireAuth.js
    server/routes/auth.js
    server/routes/tasks.js
    server/README.md
    src/api/token.js
    src/api/client.js
    src/api/auth.js
    src/api/tasks.js
    src/Auth.jsx
    src/App.jsx          (modified)
    src/ToDo.jsx         (modified)
    vite.config.js       (modified)
    package.json         (modified)
    .gitignore           (modified)
    README.md            (modified)
    docs/ARCHITECTURE.md (modified if contracts change)
    .github/workflows/build-and-deploy.yml (modified)

---

Plan revised 2026-07-03: switched from SQLite + sessions to **PostgreSQL + JWT** per `docs/ARCHITECTURE.md`.

Implementation completed 2026-07-03. All milestones implemented; manual browser acceptance pending local Docker/Postgres.
