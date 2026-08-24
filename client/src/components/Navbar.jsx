import { Menu, Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Navbar({ onMenuClick }) {
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1>Welcome back 👋</h1>
          <p>Smart OP — Hospital Management System</p>
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="profile">
          <div className="profile-avatar">
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user.name || "User"}</strong>
            <span>{user.role || "patient"}</span>
          </div>
        </div>

        <button
          className="icon-btn logout-icon-btn"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;