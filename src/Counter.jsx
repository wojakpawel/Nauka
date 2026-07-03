import React from "react";

const Counter = () => {
  console.log("Rendering Counter component");
  const [count, setCount] = React.useState(0);
  const onClickIncrement = () => setCount((count) => count + 1);

  return (
    <>
      <p id="count-display">{`Count: ${count}`}</p>
      {count >= 20 && <p id="count-high">Stop clicking already!</p>}
      <button
        id="increment-button"
        style={{ border: "none", background: "none" }}
        onClick={onClickIncrement}
      >
        <img
          src="https://clipart-library.com/2023/cookie-png-transparent-images-background-23.png"
          alt="Increment"
          style={{ width: "20px", height: "20px" }}
        />
      </button>
    </>
  );
};

export default Counter;
