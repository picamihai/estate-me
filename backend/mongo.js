const mongoose = require("mongoose");
const { getRequiredEnv } = require("./config/env");

const MONGO_URL = getRequiredEnv("MONGO_URL");

module.exports = async function connectMongo() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};