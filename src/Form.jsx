import React from "react";

const Form = ({ onSubmit, teams = [], disabled = false }) => {
  const [taskName, setTaskName] = React.useState("");
  const [taskDescription, setTaskDescription] = React.useState("");
  const [scope, setScope] = React.useState("personal");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedTask = taskName.trim();
    const trimmedDescription = taskDescription.trim();

    if (!trimmedTask) {
      return;
    }

    onSubmit({
      name: trimmedTask,
      description: trimmedDescription,
      teamId: scope === "personal" ? null : scope,
    });
    setTaskName("");
    setTaskDescription("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="task-scope-select">
        Task for
      </label>
      <select
        id="task-scope-select"
        value={scope}
        onChange={(event) => setScope(event.target.value)}
        disabled={disabled}
      >
        <option value="personal">Personal</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            Team: {team.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        id="task-name-input"
        value={taskName}
        onChange={(event) => setTaskName(event.target.value)}
        placeholder="Enter task name"
        disabled={disabled}
      />
      <textarea
        id="task-description-input"
        value={taskDescription}
        onChange={(event) => setTaskDescription(event.target.value)}
        placeholder="Enter task description"
        rows={4}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled}>
        Add new task
      </button>
    </form>
  );
};

export default Form;
