import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { add, getById, update } from "../services/propertyService";

export default function PropertyForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        title: "",
        description: "",
        price: "",
        location: "",
        status: "AVAILABLE",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isEdit) {
            loadProperty();
        }
    }, [id]);

    async function loadProperty() {
        setLoading(true);
        setError("");

        try {
            const property = await getById(id);

            if (!property) {
                throw new Error("Property not found");
            }

            setForm({
                title: property.title || "",
                description: property.description || "",
                price: property.price || "",
                location: property.location || "",
                status: property.status || "AVAILABLE",
            });
        } catch (err) {
            setError(err.message || "Failed to load property");
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload = {
                ...form,
                price: Number(form.price),
            };

            if (isEdit) {
                await update({
                    id,
                    ...payload,
                });
            } else {
                await add(payload);
            }

            navigate("/properties");
        } catch (err) {
            setError(err.message || "Failed to save property");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-narrow">
            <div className="page-title-row">
                <div>
                    <h1>{isEdit ? "Edit Property" : "Add Property"}</h1>
                    <p className="text-muted">
                        {isEdit
                            ? "Update the selected property details."
                            : "Create a new real estate listing."}
                    </p>
                </div>

                <button className="btn btn-secondary" onClick={() => navigate("/properties")}>
                    <ArrowLeft size={18} />
                    Back
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form className="card card-padded form-stack" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Modern family house"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Short description"
                        rows={4}
                    />
                </div>

                <div className="form-grid-2">
                    <div className="form-group">
                        <label htmlFor="price">Price</label>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            value={form.price}
                            onChange={handleChange}
                            placeholder="100000"
                            required
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="location">Location</label>
                        <input
                            id="location"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Groningen"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option value="AVAILABLE">Available</option>
                        <option value="SOLD">Sold</option>
                    </select>
                </div>

                <div className="form-actions">
                    <button className="btn btn-primary" disabled={loading}>
                        <Save size={18} />
                        {loading ? "Saving..." : "Save Property"}
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/properties")}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}