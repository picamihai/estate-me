const fs = require("fs");
const https = require("https");
const http = require("http");

const app = require("./app");
const { Server } = require("socket.io");
const { setIo } = require("./socket");
const connectMongo = require("./mongo");
const ChatMessage = require("./models/ChatMessage");

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3000;
const HTTP_PORT = Number(process.env.HTTP_PORT) || 3001;
const PORT = Number(process.env.PORT) || 3001;

function createSocketServer(server) {
  return new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
}

function setupChat(io, emitToAll) {
  io.on("connection", async (socket) => {
    console.log("Client connected:", socket.id);

    try {
      const history = await ChatMessage.find()
          .sort({ createdAt: 1 })
          .limit(50);

      socket.emit("chatHistory", history);
    } catch (error) {
      console.error("Chat history error:", error);
    }

    socket.on("chatMessage", async (messageData) => {
      try {
        if (!messageData || !messageData.content || !messageData.senderId) {
          socket.emit("chatError", { error: "Invalid message" });
          return;
        }

        const savedMessage = await ChatMessage.create({
          senderId: messageData.senderId,
          senderUsername: messageData.senderUsername || "Unknown",
          senderRole: messageData.senderRole || "USER",
          content: String(messageData.content).trim(),
        });

        emitToAll("chatMessage", savedMessage);
      } catch (error) {
        console.error("Chat message error:", error);
        socket.emit("chatError", { error: "Could not send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

connectMongo();

if (IS_PRODUCTION) {
  const server = http.createServer(app);
  const io = createSocketServer(server);

  setIo(io);
  setupChat(io, (...args) => io.emit(...args));

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Production server running on port ${PORT}`);
  });
} else {
  const httpsOptions = {
    key: fs.readFileSync("./certs/key.pem"),
    cert: fs.readFileSync("./certs/cert.pem"),
  };

  const httpsServer = https.createServer(httpsOptions, app);
  const httpServer = http.createServer(app);

  const ioHttps = createSocketServer(httpsServer);
  const ioHttp = createSocketServer(httpServer);

  const emitToAll = (...args) => {
    ioHttps.emit(...args);
    ioHttp.emit(...args);
  };

  setIo({
    emit: emitToAll,
  });

  setupChat(ioHttps, emitToAll);
  setupChat(ioHttp, emitToAll);

  httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
    console.log(`HTTPS server running on https://0.0.0.0:${HTTPS_PORT}`);
  });

  httpServer.listen(HTTP_PORT, "0.0.0.0", () => {
    console.log(`HTTP server running on http://0.0.0.0:${HTTP_PORT}`);
  });
}