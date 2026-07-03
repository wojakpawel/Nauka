function canCompleteTask(task, userId, teamOwnerId) {
  if (!task.team_id) {
    return task.created_by_user_id === userId;
  }

  return (
    task.created_by_user_id === userId ||
    (teamOwnerId !== null && teamOwnerId === userId)
  );
}

function mapTaskRow(row, userId) {
  const isTeam = row.team_id !== null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    scope: isTeam ? "team" : "personal",
    teamId: row.team_id,
    teamName: row.team_name ?? null,
    createdByUserId: row.created_by_user_id,
    canComplete: canCompleteTask(row, userId, row.team_owner_id ?? null),
  };
}

module.exports = {
  canCompleteTask,
  mapTaskRow,
};
