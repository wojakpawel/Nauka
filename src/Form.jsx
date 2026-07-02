import React from "react";

const Form = ({ onSubmit }) => {
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
        value={taskName}
        onChange={(event) => setTaskName(event.target.value)}
        placeholder="Enter task name"
      />
      <input
        type="text"
        value={taskDescription}
        onChange={(event) => setTaskDescription(event.target.value)}
        placeholder="Enter task description"
      />
      <button type="submit">Add new task</button>
    </form>
  );
};

export default Form;
