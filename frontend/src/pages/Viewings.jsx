import { useEffect, useMemo, useState } from "react";
import {
    Calendar,
    UserRound,
    Building2,
    Plus,
    Pencil,
    Trash2,
    X,
    Check,
    Ban,
    CheckCircle2,
} from "lucide-react";
import {
    addViewing,
    approveViewing,
    completeViewing,
    deleteViewing,
    getAll,
    getViewings,
    rejectViewing,
    requestViewing,
    updateViewing,
} from "../services/propertyService";
import { getCurrentUser } from "../utils/auth";

export default function Viewings() {
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.role === "ADMIN";

    const [properties, setProperties] = useState([]);
    const [viewings, setViewings] = useState([]);

    const [propertyId, setPropertyId] = useState("");
    const [client, setClient] = useState(currentUser?.username || "");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const propertyMap = useMemo(() => {
        const map = {};

        properties.forEach((property) => {
            map[property.id] = property;
        });

        return map;
    }, [properties]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError("");

        try {
            const [propertiesResult, viewingsResult] = await Promise.all([
                getAll(0, 100),
                getViewings(),
            ]);

            setProperties(propertiesResult.data || []);
            setViewings(viewingsResult || []);
        } catch (err) {
            setError(err.message || "Failed to load viewings");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!propertyId) {
            setError("Please select a property.");
            return;
        }

        if (!client.trim()) {
            setError("Please enter the client name.");
            return;
        }

        if (!date || !time) {
            setError("Please select both date and time.");
            return;
        }

        setSaving(true);

        try {
            const viewingDate = `${date} ${time}`;

            if (editingId) {
                await updateViewing({
                    id: editingId,
                    propertyId,
                    client: client.trim(),
                    date: viewingDate,
                });

                setSuccess("Viewing updated successfully.");
            } else if (isAdmin) {
                await addViewing({
                    propertyId,
                    client: client.trim(),
                    date: viewingDate,
                });

                setSuccess("Viewing added and approved successfully.");
            } else {
                await requestViewing({
                    propertyId,
                    client: client.trim(),
                    date: viewingDate,
                });

                setSuccess("Viewing request sent successfully. It is waiting for admin approval.");
            }

            resetForm();
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to save viewing");
        } finally {
            setSaving(false);
        }
    }

    function resetForm() {
        setPropertyId("");
        setClient(isAdmin ? "" : currentUser?.username || "");
        setDate("");
        setTime("");
        setEditingId(null);
    }

    function startEdit(viewing) {
        if (!isAdmin) return;

        const parsed = splitViewingDate(viewing.date);

        setEditingId(viewing.id);
        setPropertyId(viewing.propertyId);
        setClient(viewing.client || "");
        setDate(parsed.date);
        setTime(parsed.time);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    async function handleDelete(id) {
        if (!isAdmin) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this viewing?"
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            await deleteViewing(id);
            setSuccess("Viewing deleted successfully.");

            if (editingId === id) {
                resetForm();
            }

            await loadData();
        } catch (err) {
            setError(err.message || "Failed to delete viewing");
        }
    }

    async function handleApprove(id) {
        if (!isAdmin) return;

        setError("");
        setSuccess("");

        try {
            await approveViewing(id);
            setSuccess("Viewing approved successfully.");
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to approve viewing");
        }
    }

    async function handleReject(id) {
        if (!isAdmin) return;

        setError("");
        setSuccess("");

        try {
            await rejectViewing(id);
            setSuccess("Viewing rejected successfully.");
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to reject viewing");
        }
    }

    async function handleComplete(id) {
        if (!isAdmin) return;

        setError("");
        setSuccess("");

        try {
            await completeViewing(id);
            setSuccess("Viewing marked as completed.");
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to complete viewing");
        }
    }

    function splitViewingDate(value) {
        if (!value) {
            return {
                date: "",
                time: "",
            };
        }

        if (value.includes(" ")) {
            const [datePart, timePart] = value.split(" ");

            return {
                date: datePart || "",
                time: timePart ? timePart.slice(0, 5) : "",
            };
        }

        if (value.includes("T")) {
            const [datePart, timePart] = value.split("T");

            return {
                date: datePart || "",
                time: timePart ? timePart.slice(0, 5) : "",
            };
        }

        return {
            date: "",
            time: "",
        };
    }

    function formatViewingDate(value) {
        if (!value) return "-";

        const normalized = value.includes("T") ? value : value.replace(" ", "T");
        const parsed = new Date(normalized);

        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return parsed.toLocaleString();
    }

    function getStatusClass(status) {
        if (status === "APPROVED") return "approved";
        if (status === "REJECTED") return "rejected";
        if (status === "COMPLETED") return "completed";
        return "pending";
    }

    const formTitle = editingId
        ? "Edit Viewing"
        : isAdmin
            ? "Add Approved Viewing"
            : "Request Viewing";

    const formDescription = isAdmin
        ? "Create an approved viewing or manage requests from users."
        : "Select a property and request a viewing. An admin will review your request.";

    return (
        <div className="page-wide">
            <div className="page-title-row">
                <div>
                    <h1>Viewings</h1>
                    <p className="text-muted">
                        {isAdmin
                            ? "Review, approve, reject, complete, edit, and delete property viewings."
                            : "Request property viewings and track approval status for all requests."}
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <section className="viewings-layout">
                <form className="card card-padded form-stack" onSubmit={handleSubmit}>
                    <div className="viewing-form-title">
                        <div>
                            <h2>{formTitle}</h2>
                            <p className="text-muted form-intro">{formDescription}</p>
                        </div>

                        {editingId && (
                            <button
                                type="button"
                                className="icon-button"
                                onClick={resetForm}
                                title="Cancel editing"
                            >
                                <X size={17} />
                            </button>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="property">Property</label>
                        <select
                            id="property"
                            value={propertyId}
                            onChange={(e) => setPropertyId(e.target.value)}
                            required
                        >
                            <option value="">Select a property</option>

                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.title} — {property.location} — €
                                    {Number(property.price).toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="client">Client name</label>
                        <input
                            id="client"
                            type="text"
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            placeholder="Example: John Smith"
                            required
                            disabled={!isAdmin}
                        />

                        {!isAdmin && (
                            <p className="field-note">
                                Your username is used as the requester for this viewing.
                            </p>
                        )}
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label htmlFor="date">Date</label>
                            <input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="time">Time</label>
                            <input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button className="btn btn-primary" disabled={saving}>
                            <Plus size={18} />
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Update Viewing"
                                    : isAdmin
                                        ? "Add Viewing"
                                        : "Request Viewing"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="card viewings-side-card">
                    <div className="viewings-side-header">
                        <h2>Available Properties</h2>
                        <p className="text-muted">Choose from the current property list.</p>
                    </div>

                    <div className="property-mini-list">
                        {properties.length === 0 ? (
                            <div className="empty-note">No properties available.</div>
                        ) : (
                            properties.map((property) => (
                                <button
                                    type="button"
                                    key={property.id}
                                    className={`property-mini-item ${
                                        propertyId === property.id ? "selected" : ""
                                    }`}
                                    onClick={() => setPropertyId(property.id)}
                                >
                  <span className="property-mini-icon">
                    <Building2 size={18} />
                  </span>

                                    <span>
                    <strong>{property.title}</strong>
                    <small>
                      {property.location} · €
                        {Number(property.price).toLocaleString()}
                    </small>
                  </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section className="card viewings-table-card">
                <div className="viewings-side-header">
                    <h2>All Viewing Requests</h2>
                    <p className="text-muted">
                        {isAdmin
                            ? "Approve, reject, complete, edit, or remove viewing requests."
                            : "View all scheduled requests and track their approval status."}
                    </p>
                </div>

                <div className="table-wrapper">
                    <table>
                        <thead>
                        <tr>
                            <th>Property</th>
                            <th>Client</th>
                            <th>Requested By</th>
                            <th>Date and Time</th>
                            <th>Status</th>
                            {isAdmin && <th className="table-actions">Actions</th>}
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={isAdmin ? "6" : "5"}>Loading viewings...</td>
                            </tr>
                        ) : viewings.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? "6" : "5"}>No viewings found.</td>
                            </tr>
                        ) : (
                            viewings.map((viewing) => {
                                const property = propertyMap[viewing.propertyId];

                                return (
                                    <tr key={viewing.id}>
                                        <td>
                        <span className="cell-with-icon">
                          <Building2 size={17} />
                            {property ? property.title : "Unknown property"}
                        </span>

                                            {property && (
                                                <p className="table-subtitle">{property.location}</p>
                                            )}
                                        </td>

                                        <td>
                        <span className="cell-with-icon">
                          <UserRound size={17} />
                            {viewing.client}
                        </span>
                                        </td>

                                        <td>{viewing.requestedByUsername || "Admin"}</td>

                                        <td>
                        <span className="cell-with-icon">
                          <Calendar size={17} />
                            {formatViewingDate(viewing.date)}
                        </span>
                                        </td>

                                        <td>
                        <span
                            className={`status-badge ${getStatusClass(
                                viewing.status
                            )}`}
                        >
                          {viewing.status || "PENDING"}
                        </span>
                                        </td>

                                        {isAdmin && (
                                            <td>
                                                <div className="row-actions">
                                                    {viewing.status === "PENDING" && (
                                                        <>
                                                            <button
                                                                className="icon-button success"
                                                                title="Approve"
                                                                onClick={() => handleApprove(viewing.id)}
                                                            >
                                                                <Check size={17} />
                                                            </button>

                                                            <button
                                                                className="icon-button danger"
                                                                title="Reject"
                                                                onClick={() => handleReject(viewing.id)}
                                                            >
                                                                <Ban size={17} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {viewing.status === "APPROVED" && (
                                                        <button
                                                            className="icon-button success"
                                                            title="Mark completed"
                                                            onClick={() => handleComplete(viewing.id)}
                                                        >
                                                            <CheckCircle2 size={17} />
                                                        </button>
                                                    )}

                                                    <button
                                                        className="icon-button"
                                                        title="Edit viewing"
                                                        onClick={() => startEdit(viewing)}
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        className="icon-button danger"
                                                        title="Delete viewing"
                                                        onClick={() => handleDelete(viewing.id)}
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}