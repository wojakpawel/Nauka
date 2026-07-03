const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description
       FROM tasks
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.userId],
    );

    return res.json(result.rows);
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

  if (!name) {
    return res.status(400).json({ error: "Task name is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, name, description`,
      [req.userId, name, description],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create task failed:", error);
    return res.status(500).json({ error: "Failed to create task." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Delete task failed:", error);
    return res.status(500).json({ error: "Failed to delete task." });
  }
});

module.exports = router;
