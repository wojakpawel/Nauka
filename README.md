# Learning

A small Vite + React learning project with a todo app backed by user accounts and a PostgreSQL database.

## Features

- Register and log in with username and password
- Passwords stored as bcrypt hashes (never plain text)
- JWT authentication with per-user task isolation
- Add a task with a name and description
- Remove completed tasks from the list
- Tasks persist in PostgreSQL and reload after login or page refresh

## Installation

Install dependencies:

```bash
npm install
```

Copy environment variables for the API server:

```bash
cp .env.example .env
```

Edit `.env` and set `JWT_SECRET` to a long random string before running locally.

## Run locally

The simplest way to start everything (database, API, and frontend):

```bash
npm run dev:all
```

Open the app at the URL Vite prints (usually `http://localhost:5173`).

`dev:all` will:

1. Start PostgreSQL (embedded, if nothing is already on port 5432)
2. Run database migrations
3. Start the API on `http://127.0.0.1:3001`
4. Start the Vite dev server

On first run, npm may block native install scripts. If database startup fails:

```bash
npm approve-scripts --allow-scripts-pending
npm run dev:all
```

### Database options

**Embedded PostgreSQL (default, no Docker):** data is stored in `data/pg/` (gitignored).

**Docker PostgreSQL:** if you prefer Docker, start it first:

```bash
docker compose up -d
npm run db:migrate
npm run dev:api    # terminal 1 — API + migrate
npm run dev:web    # terminal 2 — Vite frontend
```

If Postgres is already listening on port 5432, the embedded database is skipped.

### Run servers separately

```bash
npm run db:start      # keep open — embedded Postgres only
npm run db:migrate    # once, in another terminal
npm run dev:server    # API on http://127.0.0.1:3001
npm run dev           # frontend on http://localhost:5173
```

## Security

This is a learning project, not production-hardened infrastructure. The codebase follows these practices:

- **Password hashing:** bcrypt (cost factor 10); only `password_hash` is stored in the database
- **SQL injection:** all queries use parameterized placeholders (`$1`, `$2`, …)
- **Authorization:** task routes require a valid JWT; queries are scoped to the authenticated `user_id`
- **Secrets:** `JWT_SECRET` and database credentials live in `.env` (gitignored); never commit `.env`
- **Dependencies:** `npm audit` reports no known vulnerabilities in current lockfile

Known limitations appropriate for local development:

- JWT is stored in `localStorage` (vulnerable to XSS if script injection ever occurs)
- No rate limiting on login or register
- API listens on `127.0.0.1` only — suitable for local dev, not public deployment as-is

Use a strong `JWT_SECRET` and treat `.env.example` values as dev-only defaults.

## Build for production

Build the frontend output into `dist`:

```bash
npm run build
```

Full-stack production deployment is not configured yet; CI builds and uploads the static frontend only.

## Linting

```bash
npm run lint
```

## Project structure

| Path | Purpose |
|------|---------|
| `src/App.jsx` | App shell and auth gate |
| `src/Auth.jsx` | Login and register forms |
| `src/ToDo.jsx` | Task list backed by the API |
| `src/api/` | Frontend API client and JWT storage |
| `server/` | Express API, JWT auth, PostgreSQL access |
| `scripts/start-postgres.mjs` | Embedded PostgreSQL for local dev |
| `docs/ARCHITECTURE.md` | System design and API contract |
| `AGENTS.md` | Agent entry map and doc rules |

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev:all` | Start DB, migrate, API, and Vite together |
| `npm run dev:api` | Wait for Postgres, migrate, start API |
| `npm run dev:web` | Wait for Postgres, start Vite |
| `npm run db:start` | Start embedded PostgreSQL |
| `npm run db:migrate` | Apply `server/db/schema.sql` |
| `npm run dev:server` | Start API only |
| `npm run dev` | Start Vite only |

## GitHub Actions

`.github/workflows/build-and-deploy.yml` runs on push to `main`. It starts a PostgreSQL service container, runs migrations, boots the API, lints, builds the frontend, and uploads `dist` as an artifact.

## Notes

- `dist/`, `node_modules/`, `.env`, and `data/` are gitignored
- Source files live in `src/`; the API lives in `server/`
