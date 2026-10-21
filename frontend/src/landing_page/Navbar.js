import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const dashboardUrl =
    process.env.REACT_APP_DASHBOARD_URL || "http://localhost:3001";

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
  };

  return (
    <nav
      className="navbar navbar-expand-lg border-bottom fixed-top"
      style={{ backgroundColor: "#FFF" }}
    >
      <div className="container p-2">
        <Link className="navbar-brand" to="/">
          <img
            src="media/images/logo.svg"
            style={{ width: "25%" }}
            alt="Logo"
          />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <a
                    className="btn btn-primary btn-sm me-2"
                    href={dashboardUrl}
                    style={{ textDecoration: "none" }}
                  >
                    Dashboard ({user?.name || "Trading"})
                  </a>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-danger btn-sm me-3"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-muted" to="/signup">
                    Signup
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-muted" to="/login">
                    Login
                  </Link>
                </li>
              </>
            )}

            <li className="nav-item">
              <Link className="nav-link text-muted" to="/about">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-muted" to="/product">
                Product
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-muted" to="/pricing">
                Pricing
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-muted" to="/support">
                Support
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
