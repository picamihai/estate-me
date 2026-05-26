import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { API_URL } from "../config/api";

export default function Login() {
    const navigate = useNavigate();

    const [step, setStep] = useState("credentials");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [loginSessionId, setLoginSessionId] = useState("");
    const [code, setCode] = useState("");
    const [devCode, setDevCode] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            setLoginSessionId(data.loginSessionId);
            setDevCode(data.devCode || "");
            setStep("verification");
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerify(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/login/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    loginSessionId,
                    code,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Verification failed");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Logo variant="full" size="lg" />
                    <p>Manage properties with clarity and control</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {step === "credentials" && (
                    <form onSubmit={handleLogin} className="form-stack">
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

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                )}

                {step === "verification" && (
                    <form onSubmit={handleVerify} className="form-stack">
                        <div className="hint-box">
                            <p>A verification code was generated for this login session.</p>

                            {devCode && (
                                <p>
                                    Development code: <strong>{devCode}</strong>
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="code">Verification code</label>
                            <input
                                id="code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter your verification code"
                                required
                            />
                        </div>

                        <button className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? "Verifying..." : "Verify and login"}
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary btn-full"
                            onClick={() => {
                                setStep("credentials");
                                setError("");
                                setCode("");
                                setLoginSessionId("");
                                setDevCode("");
                            }}
                        >
                            Back
                        </button>
                    </form>
                )}

                {step === "credentials" && (
                    <>
                        <p className="auth-footer">
                            Don&apos;t have an account? <Link to="/register">Register</Link>
                        </p>

                        <p className="auth-footer small">
                            Forgot your password? <Link to="/forgot-password">Reset it</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}