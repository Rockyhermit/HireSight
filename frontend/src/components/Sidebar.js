import { Briefcase, LayoutDashboard, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "My Jobs", to: "/jobs", icon: Briefcase },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const sidebarStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "240px",
    height: "100vh",
    background: "#1e293b",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid rgba(148, 163, 184, 0.2)",
  };

  const headerStyle = {
    padding: "24px 20px 10px",
  };

  const logoStyle = {
    margin: 0,
    fontSize: "24px",
    fontWeight: 800,
    color: "#3b82f6",
    letterSpacing: "0.3px",
  };

  const navStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "8px 12px 12px",
  };

  const footerStyle = {
    padding: "12px",
  };

  const getLinkStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: isActive ? "#eff6ff" : "#cbd5e1",
    background: isActive ? "rgba(59, 130, 246, 0.35)" : "transparent",
    border: isActive ? "1px solid rgba(147, 197, 253, 0.45)" : "1px solid transparent",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "15px",
    fontWeight: 600,
    transition: "all 0.2s ease",
  });

  const logoutButtonStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(248, 113, 113, 0.25)",
    borderRadius: "10px",
    color: "#fecaca",
    padding: "10px 12px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <aside style={sidebarStyle}>
      <div>
        <div style={headerStyle}>
          <h1 style={logoStyle}>HireSphere</h1>
        </div>

        <nav style={navStyle}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/dashboard" && location.pathname.startsWith(item.to));

            return (
              <Link key={item.to} to={item.to} style={getLinkStyle(isActive)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={footerStyle}>
        <button type="button" onClick={handleLogout} style={logoutButtonStyle}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
