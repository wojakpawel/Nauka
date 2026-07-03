import React from "react";
import { createTeam, inviteToTeam, listTeams } from "./api/teams.js";

const Teams = ({ onTeamsUpdate, refreshKey = 0 }) => {
  const [teams, setTeams] = React.useState([]);
  const [teamName, setTeamName] = React.useState("");
  const [inviteUsernames, setInviteUsernames] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mutating, setMutating] = React.useState(false);

  const loadTeams = React.useCallback(async () => {
    setError("");

    try {
      const data = await listTeams();
      setTeams(data);
      onTeamsUpdate?.(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [onTeamsUpdate]);

  React.useEffect(() => {
    setLoading(true);
    loadTeams();
  }, [loadTeams, refreshKey]);

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    const trimmedName = teamName.trim();

    if (!trimmedName) {
      return;
    }

    setMutating(true);
    setError("");

    try {
      await createTeam(trimmedName);
      setTeamName("");
      await loadTeams();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setMutating(false);
    }
  };

  const handleInvite = async (teamId) => {
    const username = (inviteUsernames[teamId] ?? "").trim();

    if (!username) {
      return;
    }

    setMutating(true);
    setError("");

    try {
      await inviteToTeam(teamId, username);
      setInviteUsernames((current) => ({ ...current, [teamId]: "" }));
    } catch (inviteError) {
      setError(inviteError.message);
    } finally {
      setMutating(false);
    }
  };

  if (loading) {
    return <p className="loading-message">Loading teams...</p>;
  }

  return (
    <div className="todo-panel teams-panel">
      <h2>Teams</h2>
      <form onSubmit={handleCreateTeam}>
        <input
          type="text"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="New team name"
          disabled={mutating}
        />
        <button type="submit" disabled={mutating}>
          Create team
        </button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      {teams.length === 0 ? (
        <p className="no-tasks">No teams yet. Create one above.</p>
      ) : (
        <ul className="team-list">
          {teams.map((team) => (
            <li key={team.id} className="team-item">
              <div>
                <strong>{team.name}</strong>
                {team.isOwner ? (
                  <span className="team-badge">Owner</span>
                ) : null}
              </div>
              {team.isOwner ? (
                <div className="invite-row">
                  <input
                    type="text"
                    value={inviteUsernames[team.id] ?? ""}
                    onChange={(event) =>
                      setInviteUsernames((current) => ({
                        ...current,
                        [team.id]: event.target.value,
                      }))
                    }
                    placeholder="Invite username"
                    disabled={mutating}
                  />
                  <button
                    type="button"
                    className="task-remove"
                    disabled={mutating}
                    onClick={() => handleInvite(team.id)}
                  >
                    Invite
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Teams;
