import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3002"
    : "https://zerodha-clone-1-xvb3.onrender.com");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;