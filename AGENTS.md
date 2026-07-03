# Agent map

Vite + React learning project with a full-stack todo app: Express API, PostgreSQL, JWT auth, and per-user persisted tasks.

## Start here

1. `README.md` — setup, scripts, security notes
2. `docs/ARCHITECTURE.md` — system boundaries, API contract, auth flow
3. `server/routes/` — auth and task handlers
4. `src/ToDo.jsx` — task UI wired to the API
5. `docs/exec-plans/create-plan-file.md` — how to write execution plans for multi-step work

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
    npm run build
    npm run dev:all
    # Register, add a task, refresh — task should persist

If native install scripts are blocked on first run:

    npm approve-scripts --allow-scripts-pending

## Doc maintenance rule

Update docs in the **same change** when you touch:

- **User-facing behavior or setup** → `README.md`
- **Architecture, API contracts, auth, or database** → `docs/ARCHITECTURE.md`
- **Agent entry points or verification commands** → this file (`AGENTS.md`)

Do not link canonical docs to active or completed execution plans. Plans may reference docs; docs stay stable as plans are archived.

## Execution plans

For work that spans backend, database, auth, and frontend, follow `docs/exec-plans/create-plan-file.md` and put active plans in `docs/exec-plans/active/`.
