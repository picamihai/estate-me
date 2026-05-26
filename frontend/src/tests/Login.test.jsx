import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");

    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

describe("Login page", () => {
    beforeEach(() => {
        localStorage.clear();
        navigateMock.mockClear();
        fetch.mockReset();
    });

    it("shows login form and auth links", () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByLabelText("Username")).toBeInTheDocument();
        expect(screen.getByLabelText("Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();

        expect(screen.getByText("Register")).toBeInTheDocument();
        expect(screen.getByText("Reset it")).toBeInTheDocument();
    });

    it("moves to verification step after valid credentials", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                loginSessionId: "session-1",
                devCode: "123456",
            }),
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "admin");
        await user.type(screen.getByLabelText("Password"), "admin");
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(await screen.findByLabelText("Verification code")).toBeInTheDocument();

        expect(screen.queryByText("Register")).not.toBeInTheDocument();
        expect(screen.queryByText("Reset it")).not.toBeInTheDocument();

        expect(screen.getByText(/Development code:/)).toBeInTheDocument();
        expect(screen.getByText("123456")).toBeInTheDocument();
    });

    it("stores token and navigates after verification", async () => {
        const user = userEvent.setup();

        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    loginSessionId: "session-1",
                    devCode: "123456",
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    token: "jwt-token",
                    user: {
                        username: "admin",
                        role: "ADMIN",
                        permissions: ["CREATE_PROPERTY"],
                    },
                }),
            });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "admin");
        await user.type(screen.getByLabelText("Password"), "admin");
        await user.click(screen.getByRole("button", { name: "Login" }));

        await user.type(await screen.findByLabelText("Verification code"), "123456");
        await user.click(screen.getByRole("button", { name: "Verify and login" }));

        await waitFor(() => {
            expect(localStorage.getItem("token")).toBe("jwt-token");
        });

        expect(JSON.parse(localStorage.getItem("user")).username).toBe("admin");
        expect(navigateMock).toHaveBeenCalledWith("/dashboard");
    });

    it("shows error when login fails", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                error: "Invalid credentials",
            }),
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "admin");
        await user.type(screen.getByLabelText("Password"), "wrong");
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    });

    it("shows error when verification fails", async () => {
        const user = userEvent.setup();

        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    loginSessionId: "session-1",
                    devCode: "123456",
                }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: "Invalid or expired verification code",
                }),
            });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "admin");
        await user.type(screen.getByLabelText("Password"), "admin");
        await user.click(screen.getByRole("button", { name: "Login" }));

        await user.type(await screen.findByLabelText("Verification code"), "000000");
        await user.click(screen.getByRole("button", { name: "Verify and login" }));

        expect(
            await screen.findByText("Invalid or expired verification code")
        ).toBeInTheDocument();

        expect(localStorage.getItem("token")).toBeNull();
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it("can go back from verification to credentials", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                loginSessionId: "session-1",
                devCode: "123456",
            }),
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "admin");
        await user.type(screen.getByLabelText("Password"), "admin");
        await user.click(screen.getByRole("button", { name: "Login" }));

        await screen.findByLabelText("Verification code");

        await user.click(screen.getByRole("button", { name: "Back" }));

        expect(screen.getByLabelText("Username")).toBeInTheDocument();
        expect(screen.getByText("Register")).toBeInTheDocument();
    });
});