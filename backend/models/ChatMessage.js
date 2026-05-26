const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
    senderId: {
        type: String,
        required: true,
    },
    senderUsername: {
        type: String,
        required: true,
    },
    senderRole: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);