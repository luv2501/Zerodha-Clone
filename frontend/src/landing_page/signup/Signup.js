import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const dashboardUrl =
    process.env.REACT_APP_DASHBOARD_URL || "http://localhost:3001";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");

    const { name, email, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/signup", {
        name,
        email,
        password,
        confirmPassword,
      });

      if (response.data && response.data.success) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login", {
            state: { message: "Account created! Please log in to continue." },
          });
        }, 1500);
      }
    } catch (err) {
      console.error("Signup request error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Unable to connect to the server. Please try again.");
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
            alt="Zerodha Signup"
            className="img-fluid"
            style={{ maxWidth: "85%" }}
          />
        </div>

        <div className="col-md-5">
          <div className="p-4 border rounded shadow-sm bg-white">
            <h2 className="fs-3 mb-1 text-dark">Signup now</h2>
            <p className="text-muted fs-6 mb-4">
              Or track your existing application
            </p>

            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-muted small">Full name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

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

              <div className="mb-3">
                <label className="form-label text-muted small">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
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
                {loading ? "Creating Account..." : "Continue"}
              </button>

              <div className="text-center">
                <span className="text-muted small">
                  Already have an account?{" "}
                  <Link to="/login" style={{ textDecoration: "none", color: "#387ed1" }}>
                    Login
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

export default Signup;
