import { api } from "./client.js";

export function listInvitations() {
  return api("/api/invitations");
}

export function acceptInvitation(invitationId) {
  return api(`/api/invitations/${invitationId}/accept`, {
    method: "POST",
  });
}

export function rejectInvitation(invitationId) {
  return api(`/api/invitations/${invitationId}/reject`, {
    method: "POST",
  });
}
