const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
});

socket.on("propertyCreated", (data) => {
    console.log("NEW PROPERTY RECEIVED:");
    console.log(data);
});

socket.on("disconnect", () => {
    console.log("Disconnected");
});