import React from "react";
import { useAuth } from "../AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const landingPageUrl =
    process.env.REACT_APP_LANDING_PAGE_URL || "http://localhost:3000";

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#666",
          fontSize: "1.1rem",
        }}
      >
        <p>Loading trading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = `${landingPageUrl}/login`;
    return null;
  }

  return children;
};

export default ProtectedRoute;

