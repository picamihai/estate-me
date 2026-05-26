import { useEffect, useState } from "react";
import {
    getLogs,
    getObservations,
    resolveObservation,
} from "../services/logService";

export default function AdminLogs() {
    const [logs, setLogs] = useState([]);
    const [observations, setObservations] = useState([]);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("logs");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setError("");

        try {
            const [logsData, observationsData] = await Promise.all([
                getLogs(),
                getObservations(),
            ]);

            setLogs(logsData);
            setObservations(observationsData);
        } catch (err) {
            setError(err.message || "Failed to load admin data");
        }
    }

    async function handleResolve(id) {
        try {
            await resolveObservation(id);
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to resolve observation");
        }
    }

    return (
        <div className="page-wide">
            <div className="page-title-row">
                <div>
                    <h1>Admin Logs</h1>
                    <p className="text-muted">
                        Review system activity and suspicious user behavior.
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="tabs">
                <button
                    className={activeTab === "logs" ? "active" : ""}
                    onClick={() => setActiveTab("logs")}
                >
                    Action Logs
                </button>

                <button
                    className={activeTab === "observations" ? "active" : ""}
                    onClick={() => setActiveTab("observations")}
                >
                    Observations
                </button>
            </div>

            {activeTab === "logs" && (
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Role</th>
                                <th>Action</th>
                                <th>Resource</th>
                                <th>IP</th>
                            </tr>
                            </thead>

                            <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6">No logs found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td>{log.username || "Unknown"}</td>
                                        <td>{log.role || "-"}</td>
                                        <td>{log.actionInformation}</td>
                                        <td>{log.resource || "-"}</td>
                                        <td>{log.ipAddress || "-"}</td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "observations" && (
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th>Created</th>
                                <th>User</th>
                                <th>Role</th>
                                <th>Reason</th>
                                <th>Action</th>
                            </tr>
                            </thead>

                            <tbody>
                            {observations.length === 0 ? (
                                <tr>
                                    <td colSpan="5">No active observations.</td>
                                </tr>
                            ) : (
                                observations.map((observation) => (
                                    <tr key={observation.id}>
                                        <td>{new Date(observation.createdAt).toLocaleString()}</td>
                                        <td>{observation.username || "Unknown"}</td>
                                        <td>{observation.role || "-"}</td>
                                        <td>{observation.reason}</td>
                                        <td>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleResolve(observation.id)}
                                            >
                                                Resolve
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}