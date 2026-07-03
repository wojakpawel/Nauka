import React from "react";
import Form from "./Form.jsx";
import List from "./List.jsx";
import { createTask, deleteTask, listTasks } from "./api/tasks.js";

const ToDo = ({ user, teams, onLogout, refreshKey }) => {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mutating, setMutating] = React.useState(false);

  const loadTasks = React.useCallback(async () => {
    setError("");

    try {
      const data = await listTasks();
      setTasks(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setLoading(true);
    loadTasks();
  }, [loadTasks, refreshKey]);

  const handleAddTask = async (task) => {
    setMutating(true);
    setError("");

    try {
      const createdTask = await createTask(task);
      setTasks((currentTasks) => [...currentTasks, createdTask]);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setMutating(false);
    }
  };

  const handleRemoveTask = async (taskId) => {
    setMutating(true);
    setError("");

    try {
      await deleteTask(taskId);
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="todo-panel">
      <div className="todo-header">
        <h2>To Do</h2>
        <div className="user-bar">
          <span>Logged in as {user.username}</span>
          <button type="button" className="logout-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>
      <Form
        onSubmit={handleAddTask}
        teams={teams}
        disabled={loading || mutating}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? (
        <p className="loading-message">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="no-tasks">No tasks yet. Add your first one above.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-item">
              <div className="task-card">
                {task.scope === "team" ? (
                  <span className="team-badge">Team: {task.teamName}</span>
                ) : null}
                <List name={task.name} description={task.description} />
              </div>
              {task.canComplete ? (
                <button
                  type="button"
                  onClick={() => handleRemoveTask(task.id)}
                  className="task-remove"
                  disabled={mutating}
                >
                  Done!
                </button>
              ) : (
                <span
                  className="task-locked"
                  title="Only the creator or team owner can complete this task"
                >
                  Locked
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ToDo;
