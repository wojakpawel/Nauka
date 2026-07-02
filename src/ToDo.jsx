import React from "react";
import Form from "./Form.jsx";
import List from "./List.jsx";

const ToDo = () => {
  const [tasks, setTasks] = React.useState([]);

  const handleAddTask = (task) => {
    setTasks((currentTasks) => [...currentTasks, task]);
  };

  const handleRemoveTask = (taskIndex) => {
    setTasks((currentTasks) =>
      currentTasks.filter((_, index) => index !== taskIndex),
    );
  };

  return (
    <div>
      <h2>To Do</h2>
      <Form onSubmit={handleAddTask} />
      <ul>
        {tasks.map((task, index) => (
          <li key={`${task.name}-${index}`}>
            <List name={task.name} description={task.description} />
            <button type="button" onClick={() => handleRemoveTask(index)}>
              Done!
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ToDo;
