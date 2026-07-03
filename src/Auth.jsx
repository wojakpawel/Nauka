import React from "react";
import { login, register } from "./api/auth.js";

const Auth = ({ onSuccess }) => {
  const [mode, setMode] = React.useState("login");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const action = mode === "login" ? login : register;
      const data = await action(username, password);
      onSuccess(data);
      setUsername("");
      setPassword("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="todo-panel auth-panel">
      <h2>{mode === "login" ? "Log in" : "Create account"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          id="auth-username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          autoComplete="username"
          disabled={submitting}
        />
        <input
          type="password"
          id="auth-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          disabled={submitting}
        />
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting
            ? "Please wait..."
            : mode === "login"
              ? "Log in"
              : "Register"}
        </button>
      </form>
      <p className="auth-toggle">
        {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
          disabled={submitting}
        >
          {mode === "login" ? "Register" : "Log in"}
        </button>
      </p>
    </div>
  );
};

export default Auth;
