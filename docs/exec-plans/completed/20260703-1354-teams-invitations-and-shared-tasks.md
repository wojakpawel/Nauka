# Add teams, invitations, and team-scoped tasks

**IMPLEMENTER INSTRUCTION: Keep this plan up to date as you work.**
After each significant step, update the `Progress` section with what was done and what's next. If context is lost or you are interrupted, the plan must contain everything needed to resume. Treat the plan as the single source of truth for this work.

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

Reference: This plan follows conventions from `AGENTS.md`, `docs/ARCHITECTURE.md`, and `docs/exec-plans/create-plan-file.md`.

## Purpose / Big Picture

Today each user has a private task list. There is no way to collaborate or share work.

After this change, a logged-in user can create teams, invite other registered users by username, and see pending invitations after login with accept/reject actions. Accepted members appear on the team. The app shows the user's teams. When adding a task, they choose **Personal** or one of their teams. Team tasks are visible to all members. Only the task creator or the team owner can mark a task complete (the existing **Done!** button). Personal tasks remain completable only by their owner (the creator).

Prove it works with two users: owner creates a team, invites member, member accepts, owner creates a team task, member cannot complete it, owner can, member creates a team task, owner can complete it, member can complete their own.

## Assumptions

- Local dev uses `npm run dev:all` (embedded or Docker PostgreSQL) as documented in `README.md`.
- Invites target **existing usernames** only; no email-based invites.
- A user can belong to multiple teams; a team has exactly one **owner** (the user who created it).
- Only the **team owner** may send invitations (not regular members).
- Task completion remains `DELETE /api/tasks/:id` (the **Done!** button); authorization rules change, not the HTTP verb.
- Existing personal tasks stay personal; migration backfills `created_by_user_id` from `user_id`.
- Team names follow the same character rules as usernames (3–32 chars, `[a-zA-Z0-9_]`).

## Open Questions

None at plan authoring time. Decisions are in the Decision Log.

## Progress

- [x] (2026-07-03) Milestone 1: Database schema for teams, members, invitations, task columns
- [x] (2026-07-03) Milestone 2: Teams API (create, list mine)
- [x] (2026-07-03) Milestone 3: Invitations API (send, list pending, accept, reject)
- [x] (2026-07-03) Milestone 4: Tasks API updates (personal vs team, list, complete authorization)
- [x] (2026-07-03) Milestone 5: Frontend — teams list, invitations panel, task form scope selector
- [x] (2026-07-03) Milestone 6: Frontend — task list badges, conditional Done button, docs update

## Surprises & Discoveries

- Observation: Schema ordering required `teams` before `tasks` FK; migration block handles existing databases.
  Evidence: Initial schema draft failed FK order; fixed with reordered CREATE TABLE statements.

## Decision Log

- Decision: Add `teams`, `team_members`, and `team_invitations` tables; extend `tasks` with nullable `team_id` and required `created_by_user_id`.
  Rationale: Normalized model; personal tasks keep `team_id` NULL; team tasks link to a team.
  Date/Author: 2026-07-03 / plan author

- Decision: `teams.owner_id` references `users(id)`; creator is inserted into `team_members` on team create.
  Rationale: Owner is always a member; simplifies membership checks.
  Date/Author: 2026-07-03 / plan author

- Decision: Invitation status enum: `pending`, `accepted`, `rejected`. Only one `pending` invite per `(team_id, invited_user_id)`.
  Rationale: Prevents duplicate pending invites; history can remain for audit.
  Date/Author: 2026-07-03 / plan author

- Decision: Only the team owner may `POST /api/teams/:teamId/invitations`.
  Rationale: Clear permission model for a learning app; avoids members spam-inviting.
  Date/Author: 2026-07-03 / plan author

- Decision: Complete-task rule — allow delete when: (personal) `created_by_user_id = req.userId`; (team) `created_by_user_id = req.userId` OR `req.userId = teams.owner_id` for that task's team.
  Rationale: Matches user requirement exactly; team members who did not create the task and are not owner cannot complete.
  Date/Author: 2026-07-03 / plan author

- Decision: Any team member may create a task for that team; creator must be a member at create time.
  Rationale: Collaboration; authorization on complete is restricted separately.
  Date/Author: 2026-07-03 / plan author

- Decision: `GET /api/tasks` returns personal tasks plus tasks for all teams the user belongs to; each task includes `scope: "personal" | "team"`, `teamId`, `teamName`, `createdByUserId`, `canComplete` (boolean for UI).
  Rationale: Frontend can hide **Done!** without duplicating authorization logic; server still enforces on delete.
  Date/Author: 2026-07-03 / plan author

- Decision: Invitations UI appears in the main authenticated shell (`App.jsx`), above the todo panel, only when pending invites exist (or always show empty state — implementer may show section with "No pending invitations").
  Rationale: User requirement: "appear after logging in".
  Date/Author: 2026-07-03 / plan author

## Outcomes & Retrospective

Teams, invitations, and team-scoped tasks are implemented end-to-end. Security review found no critical issues; authorization is enforced server-side for invites, membership, task visibility, and completion. Docs updated in README and ARCHITECTURE. `npm audit`, lint, build, and migration all pass.

## Context and Orientation

This is a Vite + React 19 frontend (`src/`) and Express API (`server/`) with PostgreSQL and JWT auth. Read `docs/ARCHITECTURE.md` for the current API contract.

**Relevant files today:**

- `server/db/schema.sql` — `users`, `tasks` tables
- `server/routes/tasks.js` — list/create/delete; all scoped to `req.userId` as sole owner
- `server/routes/auth.js` — register, login, me
- `server/middleware/requireAuth.js` — sets `req.userId` from JWT
- `src/ToDo.jsx` — task list and form
- `src/Form.jsx` — name + description inputs
- `src/App.jsx` — auth gate, renders `ToDo` when logged in
- `src/api/tasks.js` — API client for tasks

**Terms:**

- **Team owner** — user in `teams.owner_id`; full invite rights; can complete any team task on that team.
- **Team member** — row in `team_members`; can see team tasks and create team tasks.
- **Personal task** — `tasks.team_id IS NULL`; only the creator completes it.
- **Team task** — `tasks.team_id` set; visible to all members; completable by creator or team owner.

**Target data model (after migration):**

    teams
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
      name            VARCHAR(32) NOT NULL
      owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      UNIQUE (owner_id, name)   -- one team name per owner

    team_members
      team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE
      user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
      joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      PRIMARY KEY (team_id, user_id)

    team_invitations
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
      team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE
      invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
      invited_by_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
      status          TEXT NOT NULL CHECK (status IN ('pending','accepted','rejected'))
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      responded_at    TIMESTAMPTZ

    tasks (altered)
      id                  UUID PRIMARY KEY
      user_id             UUID REFERENCES users(id) ON DELETE CASCADE  -- personal owner when team_id IS NULL
      team_id             UUID NULL REFERENCES teams(id) ON DELETE CASCADE
      created_by_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
      name, description, created_at  -- unchanged

    Constraint: (team_id IS NULL AND user_id IS NOT NULL)
             OR (team_id IS NOT NULL)

    Partial unique index: one pending invite per team+invitee

**Target HTTP API (additions and changes):**

    POST   /api/teams                              { name }  → 201 { id, name, ownerId }
    GET    /api/teams                              → 200 [{ id, name, ownerId, isOwner }]

    GET    /api/invitations                        → 200 [{ id, teamId, teamName, invitedByUsername }]
    POST   /api/teams/:teamId/invitations          { username }  → 201
    POST   /api/invitations/:id/accept             → 200 { teamId, teamName }
    POST   /api/invitations/:id/reject             → 204

    GET    /api/tasks        → 200 [{ id, name, description, scope, teamId, teamName,
                                      createdByUserId, canComplete }]
    POST   /api/tasks        { name, description, teamId?: null | uuid }  → 201
    DELETE /api/tasks/:id    → 204 | 403 | 404   (403 when not allowed to complete)

## Plan of Work

### Milestone 1: Database schema

Append to `server/db/schema.sql` (idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` guards).

Create `teams`, `team_members`, `team_invitations` as above.

Alter `tasks`:

    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id);

Backfill existing rows:

    UPDATE tasks SET created_by_user_id = user_id WHERE created_by_user_id IS NULL;
    ALTER TABLE tasks ALTER COLUMN created_by_user_id SET NOT NULL;

Add check constraint and partial unique index for pending invitations.

Run `npm run db:migrate` against a fresh or existing DB and confirm no errors.

### Milestone 2: Teams API

Create `server/routes/teams.js`:

- `POST /` — validate team name; insert team with `owner_id = req.userId`; insert owner into `team_members`; return team
- `GET /` — teams where user is in `team_members`, include `isOwner: (owner_id === req.userId)`

Create `server/lib/teams.js` helpers:

- `isTeamMember(teamId, userId)`
- `isTeamOwner(teamId, userId)`
- `getTeamOwnerId(teamId)`

Mount in `server/index.js` at `/api/teams` behind `requireAuth`.

### Milestone 3: Invitations API

Create `server/routes/invitations.js`:

- `GET /` — pending invitations for `invited_user_id = req.userId`; join team name and inviter username
- `POST /api/teams/:teamId/invitations` — owner only; resolve `username` to user id; reject if already member, if pending exists, if inviting self; insert `pending`
- `POST /api/invitations/:id/accept` — invitee only, status must be `pending`; transaction: update status, insert `team_members`, set `responded_at`
- `POST /api/invitations/:id/reject` — invitee only; set status `rejected`

Mount team-scoped invite route under teams router or nested mount; top-level `/api/invitations` for list/accept/reject.

### Milestone 4: Tasks API updates

Refactor `server/routes/tasks.js`:

**List** — single query (or two merged) returning tasks where:

- `team_id IS NULL AND user_id = req.userId`, OR
- `team_id IN (SELECT team_id FROM team_members WHERE user_id = req.userId)`

Join `teams` for `teamName`. Compute `canComplete` per row:

- personal: `created_by_user_id === req.userId`
- team: `created_by_user_id === req.userId` OR user is owner of `team_id`

**Create** — body optional `teamId`:

- If omitted or null: personal task — `user_id = req.userId`, `team_id = NULL`, `created_by_user_id = req.userId`
- If `teamId` set: verify `isTeamMember(teamId, req.userId)`; insert with `team_id`, `user_id = NULL`, `created_by_user_id = req.userId`

**Delete (complete)** — load task; if not found 404; if not authorized to complete 403; else delete.

Extract `canCompleteTask(task, userId)` in `server/lib/tasks.js` shared by list and delete.

### Milestone 5: Frontend — teams and invitations

Create `src/api/teams.js` — `listTeams`, `createTeam`.

Create `src/api/invitations.js` — `listInvitations`, `inviteToTeam`, `acceptInvitation`, `rejectInvitation`.

Create `src/Teams.jsx`:

- List teams from API
- Form to create a new team (name input)
- Per team (if `isOwner`): input + button to invite by username

Create `src/Invitations.jsx`:

- On mount load pending invitations
- Each row: team name, invited by, Accept / Reject buttons
- On accept/reject refresh list and notify parent to refresh teams if needed

Update `src/App.jsx`:

- Render `Invitations` and `Teams` above `ToDo` when authenticated
- Pass `onTeamsChanged` callback to refresh task form team options

Update `src/Form.jsx`:

- Add prop `teams` (array) and `scope` state: `"personal"` or team id
- Render `<select>`: "Personal" + each team name
- Include `teamId` in `onSubmit` payload (`null` for personal)

Update `src/api/tasks.js` — `createTask({ name, description, teamId })`.

### Milestone 6: Frontend — task list and docs

Update `src/ToDo.jsx`:

- Pass `teams` into `Form`
- Render team badge on team tasks (e.g. "Team: alpha")
- Show **Done!** only when `task.canComplete`; otherwise omit or disable with title "Only creator or team owner can complete"
- Reload tasks after invitation accept (team membership may affect visibility)

Update `docs/ARCHITECTURE.md` and `README.md` features section in the **same PR** (per `AGENTS.md` doc rule). Do not link from those docs to this plan file.

Run `npm run lint` and manual acceptance below.

## Concrete Steps

From repository root:

    npm run dev:all

Create two users via the UI or curl (`alice`, `bob`).

    # Alice creates team
    curl -s -X POST http://127.0.0.1:3001/api/teams \
      -H "Authorization: Bearer $ALICE_TOKEN" \
      -H 'Content-Type: application/json' \
      -d '{"name":"alpha"}'

    # Alice invites bob
    curl -s -X POST http://127.0.0.1:3001/api/teams/$TEAM_ID/invitations \
      -H "Authorization: Bearer $ALICE_TOKEN" \
      -H 'Content-Type: application/json' \
      -d '{"username":"bob"}'

    # Bob lists invitations
    curl -s http://127.0.0.1:3001/api/invitations \
      -H "Authorization: Bearer $BOB_TOKEN"

    npm run lint
    npm run build

## Validation and Acceptance

**Teams**

1. Log in as `alice`. Create team `alpha`. Team appears in teams panel; alice is owner.
2. Invite `bob` by username. Success message or no error.
3. Log in as `bob`. Pending invitation shows with team name and inviter.
4. Accept. Invitation disappears; `alpha` appears in bob's teams list.
5. Reject flow: invite again (new pending after prior accepted — or use second team), reject, bob is not added.

**Tasks — personal**

1. Create personal task as alice. Bob does not see it in his list.
2. Alice can complete it; bob cannot.

**Tasks — team**

1. Alice creates team task "Shared A" on `alpha`. Bob sees it after accept.
2. Bob cannot click **Done!** on alice's team task (button hidden or disabled).
3. Alice (owner) can complete bob's team task if bob creates one.
4. Bob can complete a team task he created.

**Regression**

1. `npm run lint` and `npm run build` pass.
2. Existing personal tasks still load and complete for their owner.

## Idempotence and Recovery

- `npm run db:migrate` remains idempotent (`IF NOT EXISTS`, safe `ALTER`).
- If migration fails mid-way, fix SQL and re-run; embedded DB can be reset with `docker compose down -v` or delete `data/pg/`.
- Rejecting then re-inviting the same user is allowed (new row or new pending after prior rejected).

## Artifacts and Notes

Example task list entry:

    {
      "id": "...",
      "name": "Ship feature",
      "description": "",
      "scope": "team",
      "teamId": "...",
      "teamName": "alpha",
      "createdByUserId": "...",
      "canComplete": false
    }

Example pending invitation:

    {
      "id": "...",
      "teamId": "...",
      "teamName": "alpha",
      "invitedByUsername": "alice"
    }

## Interfaces and Dependencies

**`server/lib/tasks.js`**

    function canCompleteTask({ team_id, created_by_user_id }, userId, teamOwnerId) {
      if (!team_id) return created_by_user_id === userId;
      return created_by_user_id === userId || teamOwnerId === userId;
    }

**`POST /api/tasks` body**

    { "name": "string", "description": "string", "teamId": null | "uuid" }

**New/changed files (checklist)**

    server/db/schema.sql
    server/lib/teams.js
    server/lib/tasks.js
    server/routes/teams.js
    server/routes/invitations.js
    server/routes/tasks.js          (modified)
    server/index.js                 (modified)
    src/api/teams.js
    src/api/invitations.js
    src/api/tasks.js                (modified)
    src/Teams.jsx
    src/Invitations.jsx
    src/App.jsx                     (modified)
    src/Form.jsx                    (modified)
    src/ToDo.jsx                    (modified)
    src/styles.css                  (modified — teams/invitation panels)
    docs/ARCHITECTURE.md            (modified)
    README.md                       (modified)

---

Plan authored 2026-07-03. Implemented 2026-07-03; moved to `completed/` after security review and doc update.
