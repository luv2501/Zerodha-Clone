import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../AuthContext";

function Login() {
  const location = useLocation();
  const { isAuthenticated, loginSuccess } = useAuth();
  const dashboardUrl =
    process.env.REACT_APP_DASHBOARD_URL || "http://localhost:3001";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState(
    location.state?.message || ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = dashboardUrl;
    }
  }, [isAuthenticated, dashboardUrl]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    const { email, password } = formData;

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data && response.data.success) {
        loginSuccess(response.data.user);
        window.location.href = dashboardUrl;
      }
    } catch (err) {
      console.error("Login request error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Unable to connect to the server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: "100px", marginBottom: "80px" }}>
      <div className="row align-items-center">
        <div className="col-md-7 text-center mb-4 mb-md-0">
          <img
            src="media/images/signup.png"
            alt="Zerodha Kite Login"
            className="img-fluid"
            style={{ maxWidth: "85%" }}
          />
        </div>

        <div className="col-md-5">
          <div className="p-4 border rounded shadow-sm bg-white">
            <h2 className="fs-3 mb-1 text-dark">Login to Kite</h2>
            <p className="text-muted fs-6 mb-4">
              Access your Zerodha trading dashboard
            </p>

            {infoMessage && (
              <div className="alert alert-info py-2">{infoMessage}</div>
            )}
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-muted small">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fs-6 mb-3"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="text-center">
                <span className="text-muted small">
                  Don't have an account?{" "}
                  <Link to="/signup" style={{ textDecoration: "none", color: "#387ed1" }}>
                    Sign up now
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

