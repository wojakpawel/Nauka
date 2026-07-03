const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.team_id, t.name AS team_name, u.username AS invited_by_username
       FROM team_invitations i
       INNER JOIN teams t ON t.id = i.team_id
       INNER JOIN users u ON u.id = i.invited_by_id
       WHERE i.invited_user_id = $1 AND i.status = 'pending'
       ORDER BY i.created_at ASC`,
      [req.userId],
    );

    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        teamId: row.team_id,
        teamName: row.team_name,
        invitedByUsername: row.invited_by_username,
      })),
    );
  } catch (error) {
    console.error("List invitations failed:", error);
    return res.status(500).json({ error: "Failed to load invitations." });
  }
});

router.post("/:id/accept", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const inviteResult = await client.query(
      `SELECT id, team_id, invited_user_id, status
       FROM team_invitations
       WHERE id = $1
       FOR UPDATE`,
      [req.params.id],
    );

    if (inviteResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invitation not found." });
    }

    const invitation = inviteResult.rows[0];

    if (invitation.invited_user_id !== req.userId) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "Not allowed to accept this invitation." });
    }

    if (invitation.status !== "pending") {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ error: "Invitation is no longer pending." });
    }

    await client.query(
      `UPDATE team_invitations
       SET status = 'accepted', responded_at = NOW()
       WHERE id = $1`,
      [invitation.id],
    );

    await client.query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [invitation.team_id, req.userId],
    );

    const teamResult = await client.query(
      `SELECT name FROM teams WHERE id = $1`,
      [invitation.team_id],
    );

    await client.query("COMMIT");

    return res.json({
      teamId: invitation.team_id,
      teamName: teamResult.rows[0].name,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Accept invitation failed:", error);
    return res.status(500).json({ error: "Failed to accept invitation." });
  } finally {
    client.release();
  }
});

router.post("/:id/reject", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE team_invitations
       SET status = 'rejected', responded_at = NOW()
       WHERE id = $1 AND invited_user_id = $2 AND status = 'pending'
       RETURNING id`,
      [req.params.id, req.userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Invitation not found." });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Reject invitation failed:", error);
    return res.status(500).json({ error: "Failed to reject invitation." });
  }
});

module.exports = router;
