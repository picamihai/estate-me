import { API_URL } from "../config/api";

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
    };
}

export async function getLogs() {
    const res = await fetch(`${API_URL}/logs`, {
        headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to load logs");
    }

    return data;
}

export async function getObservations() {
    const res = await fetch(`${API_URL}/logs/observations`, {
        headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to load observations");
    }

    return data;
}

export async function resolveObservation(id) {
    const res = await fetch(`${API_URL}/logs/observations/${id}/resolve`, {
        method: "PUT",
        headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to resolve observation");
    }

    return data;
}