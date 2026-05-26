import { NavLink, Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../utils/auth";

export default function Navbar() {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const isAdmin = user?.role === "ADMIN";

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav>
            <Link to="/dashboard">Dashboard</Link> |{" "}
            <NavLink to="/properties">Properties</NavLink> |{" "}
            <Link to="/chat">Chat</Link> |{" "}
            <Link to="/viewings">Viewings</Link> |{" "}
            <Link to="/statistics">Statistics</Link> |{" "}
            {isAdmin && (
                <>
                    <Link to="/admin/logs">Admin Logs</Link> |{" "}
                </>
            )}
            <button onClick={handleLogout}>Logout</button>
        </nav>
    );
}