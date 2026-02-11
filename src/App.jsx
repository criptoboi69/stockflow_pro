import React from "react";
import Routes from "./Routes";
import { ThemeProvider } from "./hooks/useTheme";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;