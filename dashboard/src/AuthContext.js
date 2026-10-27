import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import api from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const landingPageUrl =
    process.env.REACT_APP_LANDING_PAGE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://zerodha-clone-seven-orpin.vercel.app");

  const checkAuth = async () => {
    try {
      const response = await api.get("/auth/verify");

      if (response.data && response.data.authenticated) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Dashboard logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);

      window.location.href = landingPageUrl;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;