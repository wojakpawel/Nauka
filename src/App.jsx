import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import Counter from "./Counter.jsx";
import ToDo from "./ToDo.jsx";
import Auth from "./Auth.jsx";
import Teams from "./Teams.jsx";
import Invitations from "./Invitations.jsx";
import { getMe, logout } from "./api/auth.js";
import { getToken } from "./api/token.js";

const App = () => {
  const [user, setUser] = React.useState(null);
  const [teams, setTeams] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [taskRefreshKey, setTaskRefreshKey] = React.useState(0);
  const [teamsRefreshKey, setTeamsRefreshKey] = React.useState(0);

  React.useEffect(() => {
    const bootstrapAuth = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getMe();
        setUser(currentUser);
      } catch {
        logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const handleAuthSuccess = (data) => {
    setUser(data.user);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setTeams([]);
  };

  const handleMembershipChange = React.useCallback(() => {
    setTeamsRefreshKey((current) => current + 1);
    setTaskRefreshKey((current) => current + 1);
  }, []);

  return (
    <div className="app-shell">
      <Counter />
      {loading ? (
        <p className="loading-message">Loading...</p>
      ) : user ? (
        <>
          <Invitations onMembershipChange={handleMembershipChange} />
          <Teams onTeamsUpdate={setTeams} refreshKey={teamsRefreshKey} />
          <ToDo
            user={user}
            teams={teams}
            onLogout={handleLogout}
            refreshKey={taskRefreshKey}
          />
        </>
      ) : (
        <Auth onSuccess={handleAuthSuccess} />
      )}
    </div>
  );
};

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<App />);
