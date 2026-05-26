import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
    LayoutDashboard,
    Home,
    BarChart3,
    LogOut,
    ChevronDown,
    MessageCircle,
    ClipboardList,
    Calendar,
} from "lucide-react";
import Logo from "./Logo";
import { getCurrentUser, logout } from "../utils/auth";

export default function Layout() {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const user = getCurrentUser();
    const isAdmin = user?.role === "ADMIN";

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/properties", label: "Properties", icon: Home },
        { path: "/viewings", label: "Viewings", icon: Calendar },
        { path: "/statistics", label: "Statistics", icon: BarChart3 },
        { path: "/chat", label: "Chat", icon: MessageCircle },
        ...(isAdmin ? [{ path: "/admin/logs", label: "Admin Logs", icon: ClipboardList }] : []),
    ];

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate("/login");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDropdownOpen]);

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header-inner">
                    <div className="header-left">
                        <Link to="/dashboard" aria-label="EstateMe dashboard">
                            <Logo variant="full" size="sm" />
                        </Link>

                        <nav className="main-nav" aria-label="Main navigation">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="user-menu" ref={dropdownRef}>
                        <button className="user-trigger" onClick={() => setIsDropdownOpen((value) => !value)}>
                            <span className="avatar">{(user?.username || "U").charAt(0).toUpperCase()}</span>
                            <span className="user-mini">
                <strong>{user?.username || "User"}</strong>
                <span>{user?.role || "USER"}</span>
              </span>
                            <ChevronDown size={18} color="var(--muted-foreground)" />
                        </button>

                        {isDropdownOpen && (
                            <div className="dropdown">
                                <div className="dropdown-header">
                                    <p><strong>{user?.username || "User"}</strong></p>
                                    <p className="text-muted">Role: {user?.role || "USER"}</p>
                                    <p className="text-muted">{user?.permissions?.length || 0} permissions</p>
                                </div>
                                <button className="dropdown-action" onClick={handleLogout}>
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="mobile-nav" aria-label="Mobile navigation">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                            >
                                <Icon size={16} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </header>

            <main className="page-main">
                <Outlet />
            </main>
        </div>
    );
}