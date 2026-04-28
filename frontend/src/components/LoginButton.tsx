import { useState } from 'react';

function LoginButton() {
  const clearScreen = () => {
    console.clear();
  };

  return (
    <button onClick={clearScreen}>Login</button>
  );
}

export default LoginButton;