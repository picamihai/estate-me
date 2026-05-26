import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { API_URL } from "../config/api";

export default function ForgotPassword() {
    const [step, setStep] = useState("request");

    const [username, setUsername] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [devCode, setDevCode] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRequestCode(e) {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Could not create reset code");
            }

            setDevCode(data.devCode || "");
            setMessage(data.message || "Password reset code created.");
            setStep("reset");
        } catch (err) {
            setError(err.message || "Could not create reset code");
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    code,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Password reset failed");
            }

            setMessage(data.message || "Password reset successful.");
            setCode("");
            setNewPassword("");
        } catch (err) {
            setError(err.message || "Password reset failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Logo variant="full" size="lg" />
                    <p>Reset your password</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}

                {step === "request" && (
                    <form onSubmit={handleRequestCode} className="form-stack">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <button className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? "Creating code..." : "Create reset code"}
                        </button>
                    </form>
                )}

                {step === "reset" && (
                    <form onSubmit={handleResetPassword} className="form-stack">
                        {devCode && (
                            <div className="hint-box">
                                Development code: <strong>{devCode}</strong>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="code">Reset code</label>
                            <input
                                id="code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter reset code"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New password</label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                minLength={4}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                            />
                        </div>

                        <button className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? "Resetting..." : "Reset password"}
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    Remembered your password? <Link to="/login">Back to login</Link>
                </p>
            </div>
        </div>
    );
}