# Agent map

Vite + React learning project with a full-stack todo app: Express API, PostgreSQL, JWT auth, teams, and per-user persisted tasks.

## Start here

1. `README.md` — setup, scripts, security notes
2. `docs/ARCHITECTURE.md` — system boundaries, API contract, auth flow
3. `docs/core-beliefs.md` — non-negotiable design rules for this repo
4. `server/app.js` — Express app wiring (used by `server/index.js` and smoke tests)
5. `server/routes/` — route handlers:
   - `auth.js` — register, login, current user
   - `tasks.js` — personal and team tasks
   - `teams.js` — create/list teams, members, invite, kick, leave, delete
   - `invitations.js` — list, accept, reject invitations
6. `src/ToDo.jsx` — task UI wired to the API
7. `docs/exec-plans/create-plan-file.md` — how to write execution plans for multi-step work

## Hard constraints

- Use **npm** (not pnpm/yarn/bun).
- Frontend code lives in `src/*.jsx` as default-export React components.
- Backend: Express in `server/`, **PostgreSQL** for persistence, **JWT** for auth.
- Passwords are hashed with bcrypt; never store or log plain-text passwords.
- All SQL must use parameterized queries (`$1`, `$2`, …).
- API errors return JSON: `{ "error": "message" }`.
- Do not commit secrets, `.env`, `data/`, or generated `dist/`.

## Verify changes

    npm run lint
    npm run test
    npm run build
    npm run dev:all
    # Register, add a task, refresh — task should persist

`npm run test` requires PostgreSQL on port 5432 (same as `dev:all`). It runs migrations then the API smoke test in `server/smoke.test.js`.

For phone testing on the same Wi‑Fi, use the **Network** URL Vite prints after `dev:all` (see `README.md`).

If native install scripts are blocked on first run:

    npm approve-scripts --allow-scripts-pending

## Doc maintenance rule

Update docs in the **same change** when you touch:

- **User-facing behavior or setup** → `README.md`
- **Architecture, API contracts, auth, or database** → `docs/ARCHITECTURE.md`
- **Stable project principles** → `docs/core-beliefs.md`
- **Agent entry points or verification commands** → this file (`AGENTS.md`)

Do not link canonical docs to active or completed execution plans. Plans may reference docs; docs stay stable as plans are archived.

## Execution plans

For work that spans backend, database, auth, and frontend, follow `docs/exec-plans/create-plan-file.md` and put active plans in `docs/exec-plans/active/`.
