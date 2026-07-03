import { api } from "./client.js";

export function listTeams() {
  return api("/api/teams");
}

export function createTeam(name) {
  return api("/api/teams", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function inviteToTeam(teamId, username) {
  return api(`/api/teams/${teamId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}
