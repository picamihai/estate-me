import { Navigate } from "react-router-dom";
import { hasPermission, isLoggedIn } from "../utils/auth";

export default function RequirePermission({ permission, children }) {
    if (!isLoggedIn()) return <Navigate to="/login" replace />;

    if (!hasPermission(permission)) {
        return (
            <div className="page-narrow">
                <div className="card card-padded">
                    <h1>Access denied</h1>
                    <p className="text-muted">You do not have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return children;
}