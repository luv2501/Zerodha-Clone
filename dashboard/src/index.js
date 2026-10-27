import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import "./index.css";
import Home from "./components/Home";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Receive JWT from frontend login redirect
const params = new URLSearchParams(
  window.location.hash.slice(1)
);

const token = params.get("token");

if (token) {
  localStorage.setItem("token", token);

  // Remove token from browser address bar
  window.history.replaceState(
    null,
    document.title,
    window.location.pathname + window.location.search
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);