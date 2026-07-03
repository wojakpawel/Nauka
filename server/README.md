# API server

Express API for user accounts and persisted tasks.

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — required signing key for auth tokens
- `JWT_EXPIRES_IN` — token lifetime (default `7d`)
- `PORT` — API port (default `3001`)

## Local setup

    docker compose up -d
    npm run db:migrate
    npm run dev:server

Health check: `curl http://localhost:3001/api/health`
