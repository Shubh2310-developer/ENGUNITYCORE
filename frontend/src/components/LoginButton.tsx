import { useState } from 'react';
import * as os from 'os';

function LoginButton() {
  const clearScreen = () => {
    os.system('cls' if (process.platform == 'win32') else 'clear');
  };

  return (
    // Your JSX here...
  );
}