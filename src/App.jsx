import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import Counter from "./Counter.jsx";
import ToDo from "./ToDo.jsx";
import Auth from "./Auth.jsx";
import { getMe, logout } from "./api/auth.js";
import { getToken } from "./api/token.js";

const App = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

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
  };

  return (
    <div className="app-shell">
      <Counter />
      {loading ? (
        <p className="loading-message">Loading...</p>
      ) : user ? (
        <ToDo user={user} onLogout={handleLogout} />
      ) : (
        <Auth onSuccess={handleAuthSuccess} />
      )}
    </div>
  );
};

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<App />);
