import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const getInitials = (name) => {
    if (!name) return "ZU";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  return (
    <div className="menu-container">
      <img src="logo.png" alt="Logo" style={{ width: "50px" }} />
      <div className="menus">
        <ul>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/"
              onClick={() => handleMenuClick(0)}
            >
              <p className={selectedMenu === 0 ? activeMenuClass : menuClass}>
                Dashboard
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/orders"
              onClick={() => handleMenuClick(1)}
            >
              <p className={selectedMenu === 1 ? activeMenuClass : menuClass}>
                Orders
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/holdings"
              onClick={() => handleMenuClick(2)}
            >
              <p className={selectedMenu === 2 ? activeMenuClass : menuClass}>
                Holdings
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/positions"
              onClick={() => handleMenuClick(3)}
            >
              <p className={selectedMenu === 3 ? activeMenuClass : menuClass}>
                Positions
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="funds"
              onClick={() => handleMenuClick(4)}
            >
              <p className={selectedMenu === 4 ? activeMenuClass : menuClass}>
                Funds
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/apps"
              onClick={() => handleMenuClick(6)}
            >
              <p className={selectedMenu === 6 ? activeMenuClass : menuClass}>
                Apps
              </p>
            </Link>
          </li>
        </ul>
        <hr />
        <div style={{ position: "relative" }}>
          <div className="profile" onClick={handleProfileClick}>
            <div className="avatar">{getInitials(user?.name)}</div>
            <p className="username">
              {user?.name ? user.name.split(" ")[0] : "USERID"}
            </p>
          </div>

          {isProfileDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "45px",
                right: "0",
                background: "#ffffff",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
                borderRadius: "4px",
                padding: "12px 16px",
                minWidth: "190px",
                zIndex: 1000,
                border: "1px solid #e0e0e0",
                textAlign: "left",
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    color: "#333",
                  }}
                >
                  {user?.name || "Trader"}
                </p>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: "0.75rem",
                    color: "#777",
                  }}
                >
                  {user?.email || ""}
                </p>
              </div>
              <hr style={{ margin: "8px 0", borderTop: "1px solid #eee" }} />
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  padding: "7px 12px",
                  background: "#df5b2b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "3px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
