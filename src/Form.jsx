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
      <br></br>
      <textarea
        style={{
          marginTop: "8px",
          minWidth: "200px",
          maxWidth: "200px",
          minHeight: "80px",
          maxHeight: "80px",
          borderRadius: "8px",
          border: "2px solid #ccc",
          padding: "4px",
          resize: "vertical",
        }}
        value={taskDescription}
        onChange={(event) => setTaskDescription(event.target.value)}
        placeholder="Enter task description"
        rows={4}
      />
      <br></br>
      <button type="submit">Add new task</button>
    </form>
  );
};

export default Form;
