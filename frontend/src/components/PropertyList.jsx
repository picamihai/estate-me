import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Plus,
    Eye,
    Pencil,
    Trash2,
    Search,
    RefreshCw,
    Play,
    Square,
} from "lucide-react";
import { io } from "socket.io-client";
import { API_URL } from "../config/api";
import { getAll, getById, remove } from "../services/propertyService";
import { hasPermission } from "../utils/auth";

export default function PropertyList() {
    const [properties, setProperties] = useState([]);
    const [page, setPage] = useState(0);
    const [size] = useState(5);

    const [status, setStatus] = useState("");
    const [location, setLocation] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const [loading, setLoading] = useState(false);
    const [generatorRunning, setGeneratorRunning] = useState(false);
    const [error, setError] = useState("");

    const canCreate = hasPermission("CREATE_PROPERTY");
    const canUpdate = hasPermission("UPDATE_PROPERTY");
    const canDelete = hasPermission("DELETE_PROPERTY");

    useEffect(() => {
        loadProperties();
    }, [page]);

    useEffect(() => {
        const socket = io(API_URL, {
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
            console.log("Connected to property socket");
        });

        socket.on("propertyCreated", (newProperty) => {
            setProperties((currentProperties) => {
                const alreadyExists = currentProperties.some(
                    (property) => property.id === newProperty.id
                );

                if (alreadyExists) {
                    return currentProperties;
                }

                return [newProperty, ...currentProperties].slice(0, size);
            });
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message);
        });

        return () => {
            socket.disconnect();
        };
    }, [size]);

    async function loadProperties() {
        setLoading(true);
        setError("");

        try {
            const query = new URLSearchParams();

            query.set("page", page);
            query.set("size", size);

            if (status) query.set("status", status);
            if (location) query.set("location", location);
            if (minPrice) query.set("minPrice", minPrice);
            if (maxPrice) query.set("maxPrice", maxPrice);

            const hasFilters = status || location || minPrice || maxPrice;

            if (hasFilters) {
                const res = await fetch(`${API_URL}/properties?${query.toString()}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load properties");
                }

                setProperties(data.data || []);
            } else {
                const result = await getAll(page, size);
                setProperties(result.data || []);
            }
        } catch (err) {
            setError(err.message || "Failed to load properties");
        } finally {
            setLoading(false);
        }
    }

    async function handleSearch(e) {
        e.preventDefault();
        setPage(0);
        await loadProperties();
    }

    function clearFilters() {
        setStatus("");
        setLocation("");
        setMinPrice("");
        setMaxPrice("");
        setPage(0);

        setTimeout(() => {
            loadProperties();
        }, 0);
    }

    async function handleDelete(id) {
        setError("");

        try {
            const property = await getById(id);
            const viewingsCount = property?.viewings?.length || 0;

            const message =
                viewingsCount > 0
                    ? `This property has ${viewingsCount} scheduled viewing${
                        viewingsCount === 1 ? "" : "s"
                    }.\n\nDeleting this property will also delete all related viewings.\n\nAre you sure you want to continue?`
                    : "Are you sure you want to delete this property?";

            const confirmed = window.confirm(message);

            if (!confirmed) return;

            await remove(id);
            await loadProperties();
        } catch (err) {
            setError(err.message || "Failed to delete property");
        }
    }

    async function startGenerator() {
        setError("");

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/properties/start-generator`, {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to start generator");
            }

            setGeneratorRunning(true);
        } catch (err) {
            setError(err.message || "Failed to start generator");
        }
    }

    async function stopGenerator() {
        setError("");

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/properties/stop-generator`, {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to stop generator");
            }

            setGeneratorRunning(false);
            await loadProperties();
        } catch (err) {
            setError(err.message || "Failed to stop generator");
        }
    }

    return (
        <div className="page-wide">
            <div className="page-title-row">
                <div>
                    <h1>Properties</h1>
                    <p className="text-muted">
                        Manage property listings, statuses, prices, and locations.
                    </p>
                </div>

                <div className="page-actions">
                    {canCreate && (
                        <Link to="/properties/new" className="btn btn-primary">
                            <Plus size={18} />
                            Add Property
                        </Link>
                    )}
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <section className="card card-padded filters-card">
                <form onSubmit={handleSearch} className="filters-grid">
                    <div className="form-group">
                        <label>Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="">All statuses</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="SOLD">Sold</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Search by city"
                        />
                    </div>

                    <div className="form-group">
                        <label>Min price</label>
                        <input
                            type="number"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Max price</label>
                        <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="500000"
                        />
                    </div>

                    <div className="filter-actions">
                        <button className="btn btn-primary" type="submit">
                            <Search size={18} />
                            Search
                        </button>

                        <button className="btn btn-secondary" type="button" onClick={clearFilters}>
                            <RefreshCw size={18} />
                            Reset
                        </button>
                    </div>
                </form>
            </section>

            {canCreate && (
                <section className="generator-bar">
                    <div>
                        <h3>Property generator</h3>
                        <p className="text-muted">
                            Generate demo properties every few seconds using the backend generator.
                        </p>
                    </div>

                    <div className="page-actions">
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={startGenerator}
                            disabled={generatorRunning}
                        >
                            <Play size={18} />
                            Start
                        </button>

                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={stopGenerator}
                            disabled={!generatorRunning}
                        >
                            <Square size={18} />
                            Stop
                        </button>
                    </div>
                </section>
            )}

            <section className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                        <tr>
                            <th>Title</th>
                            <th>Location</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th className="table-actions">Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5">Loading properties...</td>
                            </tr>
                        ) : properties.length === 0 ? (
                            <tr>
                                <td colSpan="5">No properties found.</td>
                            </tr>
                        ) : (
                            properties.map((property) => (
                                <tr key={property.id}>
                                    <td>
                                        <strong>{property.title}</strong>
                                        {property.description && (
                                            <p className="table-subtitle">{property.description}</p>
                                        )}
                                    </td>

                                    <td>{property.location}</td>

                                    <td>€{Number(property.price).toLocaleString()}</td>

                                    <td>
                      <span
                          className={`status-badge ${
                              property.status === "SOLD" ? "sold" : "available"
                          }`}
                      >
                        {property.status}
                      </span>
                                    </td>

                                    <td>
                                        <div className="row-actions">
                                            <Link
                                                to={`/properties/${property.id}`}
                                                className="icon-button"
                                                title="View"
                                            >
                                                <Eye size={17} />
                                            </Link>

                                            {canUpdate && (
                                                <Link
                                                    to={`/properties/${property.id}/edit`}
                                                    className="icon-button"
                                                    title="Edit"
                                                >
                                                    <Pencil size={17} />
                                                </Link>
                                            )}

                                            {canDelete && (
                                                <button
                                                    className="icon-button danger"
                                                    title="Delete"
                                                    onClick={() => handleDelete(property.id)}
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button
                        className="btn btn-secondary"
                        disabled={page === 0}
                        onClick={() => setPage((value) => Math.max(0, value - 1))}
                    >
                        Previous
                    </button>

                    <span>Page {page + 1}</span>

                    <button
                        className="btn btn-secondary"
                        disabled={properties.length < size}
                        onClick={() => setPage((value) => value + 1)}
                    >
                        Next
                    </button>
                </div>
            </section>
        </div>
    );
}