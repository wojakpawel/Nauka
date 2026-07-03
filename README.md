# Learning

A small Vite + React learning project with a todo app backed by user accounts, teams, and a PostgreSQL database.

## Features

- Register and log in with username and password
- Passwords stored as bcrypt hashes (never plain text)
- JWT authentication with per-user and per-team task access
- Create teams and invite other users by username
- View team members on demand (collapsible member list)
- Team owners can kick members or delete the team (team tasks are removed with the team)
- Non-owner members can leave a team
- Accept or reject team invitations after logging in
- Add personal tasks or tasks scoped to a team
- Team tasks show who created them when the creator is someone else
- Team tasks visible to all members; only the creator or team owner can mark them complete
- Loading feedback on async actions; layout adapts to mobile screens
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

### View on your phone (same Wi‑Fi)

Vite is configured with `host: true`, so after `npm run dev:all` the terminal also prints a **Network** URL, for example:

```text
➜  Network: http://10.1.123.59:5173/
```

On your phone (same Wi‑Fi as this machine), open that Network URL in the browser. API calls go through the Vite dev proxy to `127.0.0.1:3001` on your computer — the API is not exposed directly to the network.

**Local dev only:** anyone on the same Wi‑Fi who knows the URL can use the app. Do not use this on public Wi‑Fi for long periods, and do not port-forward the dev server to the internet.

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
- **Authentication:** JWT required on protected routes; invalid tokens return `401`
- **Authorization:**
  - Personal tasks visible only to the owner
  - Team tasks visible only to team members
  - Task completion enforced server-side (`403` if not creator or team owner)
  - Team invitations: only the team owner can invite; only the invitee can accept/reject
  - Team member list: only team members can view members
  - Kick member: team owner only; cannot kick self; pending invites for kicked user are removed
  - Leave team: non-owner members only
  - Delete team: owner only; cascades remove members, invitations, and team tasks
  - Team task creation requires membership (server verifies `teamId`)
- **Request size:** JSON bodies limited to 16 KB
- **Secrets:** `JWT_SECRET` and database credentials live in `.env` (gitignored); never commit `.env`
- **Dependencies:** `npm audit` reports no known vulnerabilities in the current lockfile

Known limitations appropriate for local development:

- JWT is stored in `localStorage` (vulnerable to XSS if script injection ever occurs)
- Vite `host: true` exposes the dev UI on your LAN for phone testing; the API stays on `127.0.0.1` and is reached via the Vite proxy
- No rate limiting on login, register, or invitations
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

## Testing

API smoke test (requires PostgreSQL on port 5432):

```bash
npm run test
```

Runs `db:migrate` then `server/smoke.test.js` using Node's built-in test runner. The smoke test covers register, team create, invite/accept, member list, team tasks with creator attribution, leave, and team delete with task cascade.

CI runs `npm run test` on push to `main`.

## Project structure

| Path | Purpose |
|------|---------|
| `src/App.jsx` | App shell, invitations, teams, and todo UI |
| `src/Auth.jsx` | Login and register forms |
| `src/Teams.jsx` | Create teams; member list; owner invite/kick/delete; member leave |
| `src/Invitations.jsx` | Accept or reject pending invitations |
| `src/ToDo.jsx` | Task list backed by the API |
| `src/api/` | Frontend API client and JWT storage |
| `server/` | Express API, JWT auth, PostgreSQL access |
| `server/smoke.test.js` | API smoke test (register → teams → tasks) |
| `scripts/start-postgres.mjs` | Embedded PostgreSQL for local dev |
| `docs/ARCHITECTURE.md` | System design and API contract |
| `docs/core-beliefs.md` | Non-negotiable design rules |
| `AGENTS.md` | Agent entry map and doc rules |

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run lint` | ESLint |
| `npm run test` | Migrate DB and run API smoke test |
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
