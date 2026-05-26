import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Building2,
    MapPin,
    Pencil,
    Trash2,
    Wallet,
} from "lucide-react";
import { getById, remove } from "../services/propertyService";
import { hasPermission } from "../utils/auth";

export default function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [property, setProperty] = useState(null);
    const [error, setError] = useState("");

    const canUpdate = hasPermission("UPDATE_PROPERTY");
    const canDelete = hasPermission("DELETE_PROPERTY");

    useEffect(() => {
        loadProperty();
    }, [id]);

    async function loadProperty() {
        setError("");

        try {
            const data = await getById(id);

            if (!data) {
                throw new Error("Property not found");
            }

            setProperty(data);
        } catch (err) {
            setError(err.message || "Failed to load property");
        }
    }

    async function handleDelete() {
        const confirmed = window.confirm("Are you sure you want to delete this property?");
        if (!confirmed) return;

        try {
            await remove(id);
            navigate("/properties");
        } catch (err) {
            setError(err.message || "Failed to delete property");
        }
    }

    if (error) {
        return (
            <div className="page-narrow">
                <div className="alert alert-error">{error}</div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="page-narrow">
                <div className="card card-padded">Loading property...</div>
            </div>
        );
    }

    return (
        <div className="page-narrow">
            <div className="page-title-row">
                <div>
                    <h1>{property.title}</h1>
                    <p className="text-muted">Property details and current status.</p>
                </div>

                <button className="btn btn-secondary" onClick={() => navigate("/properties")}>
                    <ArrowLeft size={18} />
                    Back
                </button>
            </div>

            <div className="detail-card">
                <div className="detail-header">
                    <div className="detail-icon">
                        <Building2 size={30} />
                    </div>

                    <div>
                        <h2>{property.title}</h2>
                        <span
                            className={`status-badge ${
                                property.status === "SOLD" ? "sold" : "available"
                            }`}
                        >
              {property.status}
            </span>
                    </div>
                </div>

                <p className="detail-description">
                    {property.description || "No description provided."}
                </p>

                <div className="detail-grid">
                    <div>
                        <MapPin size={20} />
                        <span>Location</span>
                        <strong>{property.location}</strong>
                    </div>

                    <div>
                        <Wallet size={20} />
                        <span>Price</span>
                        <strong>€{Number(property.price).toLocaleString()}</strong>
                    </div>
                </div>

                <div className="detail-actions">
                    {canUpdate && (
                        <Link to={`/properties/${property.id}/edit`} className="btn btn-primary">
                            <Pencil size={18} />
                            Edit
                        </Link>
                    )}

                    {canDelete && (
                        <button className="btn btn-danger" onClick={handleDelete}>
                            <Trash2 size={18} />
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}