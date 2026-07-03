const express = require("express");
const pool = require("../db");
const { isTeamMember } = require("../lib/teams");
const { canCompleteTask, mapTaskRow } = require("../lib/tasks");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.description, t.team_id, t.created_by_user_id,
              teams.name AS team_name, teams.owner_id AS team_owner_id
       FROM tasks t
       LEFT JOIN teams ON teams.id = t.team_id
       WHERE (t.team_id IS NULL AND t.user_id = $1)
          OR (t.team_id IN (
            SELECT team_id FROM team_members WHERE user_id = $1
          ))
       ORDER BY t.created_at ASC`,
      [req.userId],
    );

    return res.json(result.rows.map((row) => mapTaskRow(row, req.userId)));
  } catch (error) {
    console.error("List tasks failed:", error);
    return res.status(500).json({ error: "Failed to load tasks." });
  }
});

router.post("/", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const description =
    typeof req.body?.description === "string"
      ? req.body.description.trim()
      : "";
  const teamId = req.body?.teamId ?? null;

  if (!name) {
    return res.status(400).json({ error: "Task name is required." });
  }

  try {
    if (teamId) {
      if (!(await isTeamMember(teamId, req.userId))) {
        return res
          .status(403)
          .json({ error: "You are not a member of that team." });
      }

      const result = await pool.query(
        `INSERT INTO tasks (team_id, created_by_user_id, name, description)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, team_id, created_by_user_id`,
        [teamId, req.userId, name, description],
      );

      const teamResult = await pool.query(
        `SELECT name, owner_id FROM teams WHERE id = $1`,
        [teamId],
      );
      const team = teamResult.rows[0];

      const row = {
        ...result.rows[0],
        team_name: team.name,
        team_owner_id: team.owner_id,
      };

      return res.status(201).json(mapTaskRow(row, req.userId));
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, created_by_user_id, name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, team_id, created_by_user_id`,
      [req.userId, req.userId, name, description],
    );

    return res.status(201).json(mapTaskRow(result.rows[0], req.userId));
  } catch (error) {
    console.error("Create task failed:", error);
    return res.status(500).json({ error: "Failed to create task." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const taskResult = await pool.query(
      `SELECT t.id, t.team_id, t.created_by_user_id, t.user_id,
              teams.owner_id AS team_owner_id
       FROM tasks t
       LEFT JOIN teams ON teams.id = t.team_id
       WHERE t.id = $1`,
      [req.params.id],
    );

    if (taskResult.rowCount === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    const task = taskResult.rows[0];
    const visible =
      (task.team_id === null && task.user_id === req.userId) ||
      (task.team_id !== null && (await isTeamMember(task.team_id, req.userId)));

    if (!visible) {
      return res.status(404).json({ error: "Task not found." });
    }

    if (!canCompleteTask(task, req.userId, task.team_owner_id)) {
      return res.status(403).json({
        error: "Only the task creator or team owner can complete this task.",
      });
    }

    await pool.query(`DELETE FROM tasks WHERE id = $1`, [req.params.id]);

    return res.status(204).send();
  } catch (error) {
    console.error("Delete task failed:", error);
    return res.status(500).json({ error: "Failed to delete task." });
  }
});

module.exports = router;
