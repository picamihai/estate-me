const express = require("express");
const cors = require("cors");

const propertyRoutes = require("./routes/propertyRoutes");
const graphql = require("./graphql/schema");
const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
].filter(Boolean);

function isAllowedDevOrigin(origin) {
    if (!origin) return true;

    return (
        /^http:\/\/192\.168\.\d+\.\d+:5173$/.test(origin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+:5173$/.test(origin) ||
        /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:5173$/.test(origin)
    );
}

app.use(
    cors({
        origin: (origin, callback) => {
            if (allowedOrigins.includes(origin) || isAllowedDevOrigin(origin)) {
                return callback(null, true);
            }

            console.log("CORS blocked origin:", origin);
            return callback(null, false);
        },
        credentials: true,
    })
);

app.use(express.json());

app.use("/properties", propertyRoutes);
app.use("/graphql", graphql);
app.use("/auth", authRoutes);
app.use("/logs", logRoutes);

module.exports = app;