import React from "react";

const Form = ({ onSubmit, disabled = false }) => {
  const [taskName, setTaskName] = React.useState("");
  const [taskDescription, setTaskDescription] = React.useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedTask = taskName.trim();
    const trimmedDescription = taskDescription.trim();

    if (!trimmedTask) {
      return;
    }

    onSubmit({ name: trimmedTask, description: trimmedDescription });
    setTaskName("");
    setTaskDescription("");
  };

  return (
    <form onSubmit={handleSubmit}>
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
