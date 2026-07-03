import React from "react";
import {
  listInvitations,
  acceptInvitation,
  rejectInvitation,
} from "./api/invitations.js";

const Invitations = ({ onMembershipChange }) => {
  const [invitations, setInvitations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mutating, setMutating] = React.useState(false);

  const loadInvitations = React.useCallback(async () => {
    setError("");

    try {
      const data = await listInvitations();
      setInvitations(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAccept = async (invitationId) => {
    setMutating(true);
    setError("");

    try {
      await acceptInvitation(invitationId);
      await loadInvitations();
      onMembershipChange?.();
    } catch (acceptError) {
      setError(acceptError.message);
    } finally {
      setMutating(false);
    }
  };

  const handleReject = async (invitationId) => {
    setMutating(true);
    setError("");

    try {
      await rejectInvitation(invitationId);
      await loadInvitations();
    } catch (rejectError) {
      setError(rejectError.message);
    } finally {
      setMutating(false);
    }
  };

  if (loading) {
    return <p className="loading-message">Loading invitations...</p>;
  }

  return (
    <div className="todo-panel invitations-panel">
      <h2>Invitations</h2>
      {error ? <p className="form-error">{error}</p> : null}
      {invitations.length === 0 ? (
        <p className="no-tasks">No pending invitations.</p>
      ) : (
        <ul className="invitation-list">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="invitation-item">
              <div>
                <strong>{invitation.teamName}</strong>
                <p>Invited by {invitation.invitedByUsername}</p>
              </div>
              <div className="invitation-actions">
                <button
                  type="button"
                  className="task-remove"
                  disabled={mutating}
                  onClick={() => handleAccept(invitation.id)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="logout-button"
                  disabled={mutating}
                  onClick={() => handleReject(invitation.id)}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Invitations;
