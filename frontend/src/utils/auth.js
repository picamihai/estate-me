export function getCurrentUser() {
    const raw = localStorage.getItem("user");

    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function getToken() {
    return localStorage.getItem("token");
}

export function hasPermission(permission) {
    const user = getCurrentUser();

    if (!user || !Array.isArray(user.permissions)) {
        return false;
    }

    return user.permissions.includes(permission);
}

export function isLoggedIn() {
    return getCurrentUser() !== null && getToken() !== null;
}

export function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
}