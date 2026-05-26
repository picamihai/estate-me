const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

const host = window.location.hostname;

export const API_URL = isLocalhost
    ? "https://localhost:3000"
    : `http://${host}:3001`;

export const GRAPHQL_URL = isLocalhost
    ? "https://localhost:3000/graphql"
    : `http://${host}:3001/graphql`;