const hostname = window.location.hostname;

const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1";

const isPrivateNetworkIp =
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname);

export const API_URL = isLocalhost
    ? "https://localhost:3000"
    : isPrivateNetworkIp
        ? `http://${hostname}:3001`
        : import.meta.env.VITE_API_URL;

export const GRAPHQL_URL = isLocalhost
    ? "https://localhost:3000/graphql"
    : isPrivateNetworkIp
        ? `http://${hostname}:3001/graphql`
        : import.meta.env.VITE_GRAPHQL_URL;

export const SOCKET_URL = isLocalhost
    ? "https://localhost:3000"
    : isPrivateNetworkIp
        ? `http://${hostname}:3001`
        : import.meta.env.VITE_SOCKET_URL;