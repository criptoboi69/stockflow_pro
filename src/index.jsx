import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate, useSearchParams } from "react-router-dom";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";

// Component to handle auth token redirect
const AuthHandler = ({ children }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    // If there's a recovery token, redirect to reset-password
    if (token && type === 'recovery') {
      navigate('/reset-password', { replace: true });
    }
  }, [searchParams, navigate]);
  
  return children;
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <AuthHandler>
      <App />
    </AuthHandler>
  </BrowserRouter>
);
