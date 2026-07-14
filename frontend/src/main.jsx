import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "./index.css";

// Global unhandled promise rejection handler to prevent extension noise
window.addEventListener("unhandledrejection", (event) => {
  console.warn("[Glitch Shield] Intercepted unhandled async rejection:", event.reason?.message || event.reason);
  event.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
