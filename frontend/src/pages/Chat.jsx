import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Send } from "lucide-react";
import { API_URL } from "../config/api";
import { getCurrentUser } from "../utils/auth";

export default function Chat() {
    const user = getCurrentUser();

    const socket = useMemo(() => {
        return io(API_URL, {
            transports: ["websocket", "polling"],
        });
    }, []);

    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        socket.on("chatHistory", (history) => {
            setMessages(history || []);
        });

        socket.on("chatMessage", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on("chatError", (payload) => {
            setError(payload?.error || "Chat error");
        });

        return () => {
            socket.off("chatHistory");
            socket.off("chatMessage");
            socket.off("chatError");
            socket.disconnect();
        };
    }, [socket]);

    function handleSend(e) {
        e.preventDefault();

        if (!content.trim()) return;

        socket.emit("chatMessage", {
            senderId: user?.id || "unknown",
            senderUsername: user?.username || "Unknown",
            senderRole: user?.role || "USER",
            content: content.trim(),
        });

        setContent("");
    }

    return (
        <div className="page-chat">
            <div className="page-title-row">
                <div>
                    <h1>Team Chat</h1>
                    <p className="text-muted">
                        Real-time communication between authenticated users.
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="chat-card">
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="empty-note">No messages yet. Start the conversation.</div>
                    ) : (
                        messages.map((message) => {
                            const isOwn = message.senderId === user?.id;

                            return (
                                <div
                                    key={message.id || `${message.createdAt}-${message.content}`}
                                    className={`chat-message ${isOwn ? "own" : ""}`}
                                >
                                    <div className="chat-bubble">
                                        <div className="chat-meta">
                                            <strong>{message.senderUsername || "Unknown"}</strong>
                                            <span>{message.senderRole || "USER"}</span>
                                        </div>

                                        <p>{message.content}</p>

                                        {message.createdAt && (
                                            <small>
                                                {new Date(message.createdAt).toLocaleTimeString()}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <form className="chat-form" onSubmit={handleSend}>
                    <input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write a message..."
                    />

                    <button className="btn btn-primary" type="submit">
                        <Send size={18} />
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}