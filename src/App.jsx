import React from "react";
import ReactDOM from "react-dom/client";
import List from "./List.jsx";
import Counter from "./Counter.jsx";
import ToDo from "./ToDo.jsx";

const App = () => {
  const [name, setName] = React.useState("Name goes here!");
  console.log("Rendering App component");

  return (
    <div>
      <header>
        <h1>Hello World</h1>
      </header>
      <input
        id="name-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <p id="name-display">{`Name: ${name}`}</p>
      <Counter />
      <List name="Nazwa" description="Opis" />
      <ToDo />
    </div>
  );
};

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<App />);
