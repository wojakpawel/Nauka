const express = require("express");
const pool = require("../db");
const { validateTeamName, validateUsername } = require("../lib/validation");
const { isTeamMember, isTeamOwner } = require("../lib/teams");

const router = express.Router();

router.post("/", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const nameError = validateTeamName(name);

  if (nameError) {
    return res.status(400).json({ error: nameError });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const teamResult = await client.query(
      `INSERT INTO teams (name, owner_id)
       VALUES ($1, $2)
       RETURNING id, name, owner_id`,
      [name, req.userId],
    );
    const team = teamResult.rows[0];

    await client.query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)`,
      [team.id, req.userId],
    );

    await client.query("COMMIT");

    return res.status(201).json({
      id: team.id,
      name: team.name,
      ownerId: team.owner_id,
      isOwner: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "You already have a team with that name." });
    }

    console.error("Create team failed:", error);
    return res.status(500).json({ error: "Failed to create team." });
  } finally {
    client.release();
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.owner_id
       FROM teams t
       INNER JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at ASC`,
      [req.userId],
    );

    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        isOwner: row.owner_id === req.userId,
      })),
    );
  } catch (error) {
    console.error("List teams failed:", error);
    return res.status(500).json({ error: "Failed to load teams." });
  }
});

router.post("/:teamId/invitations", async (req, res) => {
  const { teamId } = req.params;
  const username =
    typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const usernameError = validateUsername(username);

  if (usernameError) {
    return res.status(400).json({ error: usernameError });
  }

  try {
    if (!(await isTeamOwner(teamId, req.userId))) {
      return res
        .status(403)
        .json({ error: "Only the team owner can invite members." });
    }

    const userResult = await pool.query(
      `SELECT id FROM users WHERE username = $1`,
      [username],
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const invitedUserId = userResult.rows[0].id;

    if (invitedUserId === req.userId) {
      return res.status(400).json({ error: "You cannot invite yourself." });
    }

    if (await isTeamMember(teamId, invitedUserId)) {
      return res.status(409).json({ error: "User is already a team member." });
    }

    const inviteResult = await pool.query(
      `INSERT INTO team_invitations (team_id, invited_user_id, invited_by_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [teamId, invitedUserId, req.userId],
    );

    return res.status(201).json({ id: inviteResult.rows[0].id });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "A pending invitation already exists." });
    }

    console.error("Create invitation failed:", error);
    return res.status(500).json({ error: "Failed to send invitation." });
  }
});

module.exports = router;
