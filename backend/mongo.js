const mongoose = require("mongoose");

async function connectMongo() {
    const mongoUrl = process.env.MONGO_URL;

    if (!mongoUrl) {
        console.error("MongoDB connection failed: MONGO_URL is missing");
        return;
    }

    try {
        console.log("Connecting to MongoDB...");

        await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
    }
}

module.exports = connectMongo;