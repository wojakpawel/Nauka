const pool = require("../db");

async function isTeamMember(teamId, userId) {
  const result = await pool.query(
    `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId],
  );

  return result.rowCount > 0;
}

async function isTeamOwner(teamId, userId) {
  const result = await pool.query(
    `SELECT 1 FROM teams WHERE id = $1 AND owner_id = $2`,
    [teamId, userId],
  );

  return result.rowCount > 0;
}

async function getTeamOwnerId(teamId) {
  const result = await pool.query(`SELECT owner_id FROM teams WHERE id = $1`, [
    teamId,
  ]);

  return result.rows[0]?.owner_id ?? null;
}

module.exports = {
  isTeamMember,
  isTeamOwner,
  getTeamOwnerId,
};
