const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const { signToken } = require("../lib/jwt");
const { validateUsername, validatePassword } = require("../lib/validation");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
const BCRYPT_ROUNDS = 10;

router.post("/register", async (req, res) => {
  const { username, password } = req.body ?? {};
  const usernameError = validateUsername(username);
  const passwordError = validatePassword(password);

  if (usernameError || passwordError) {
    return res.status(400).json({ error: usernameError || passwordError });
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username`,
      [username, passwordHash],
    );
    const user = result.rows[0];
    const token = signToken(user.id);

    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username is already taken." });
    }

    console.error("Register failed:", error);
    return res.status(500).json({ error: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  const usernameError = validateUsername(username);
  const passwordError = validatePassword(password);

  if (usernameError || passwordError) {
    return res.status(400).json({ error: usernameError || passwordError });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, password_hash
       FROM users
       WHERE username = $1`,
      [username],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = signToken(user.id);

    return res.json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username
       FROM users
       WHERE id = $1`,
      [req.userId],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Get current user failed:", error);
    return res.status(500).json({ error: "Failed to load user." });
  }
});

module.exports = router;
