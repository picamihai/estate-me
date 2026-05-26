import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout, isLoggedIn } from "../utils/auth";

const TIMEOUT_MS = 30 * 60 * 1000;

export default function SessionTimeout() {
    const navigate = useNavigate();

    useEffect(() => {
        let timeoutId;

        const resetTimer = () => {
            clearTimeout(timeoutId);

            if (!isLoggedIn()) return;

            timeoutId = setTimeout(() => {
                logout();
                alert("You have been logged out due to inactivity.");
                navigate("/");
            }, TIMEOUT_MS);
        };

        const events = [
            "mousemove",
            "keydown",
            "click",
            "scroll",
            "touchstart",
        ];

        events.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer();

        return () => {
            clearTimeout(timeoutId);

            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [navigate]);

    return null;
}