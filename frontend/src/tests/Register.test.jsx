import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "../pages/Register";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("Register page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
        fetch.mockReset();
    });

    it("renders register form", () => {
        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        expect(screen.getByText("Create an EstateMe account")).toBeInTheDocument();
        expect(screen.getByLabelText("Username")).toBeInTheDocument();
        expect(screen.getByLabelText("Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
        expect(screen.getByText("Login")).toBeInTheDocument();
    });

    it("registers successfully, stores token and user, and redirects", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                token: "new-user-token",
                user: {
                    id: "2",
                    username: "newuser",
                    role: "USER",
                    permissions: ["READ_PROPERTY"],
                },
            }),
        });

        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "newuser");
        await user.type(screen.getByLabelText("Password"), "newpass");
        await user.click(screen.getByRole("button", { name: "Register" }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        expect(localStorage.getItem("token")).toBe("new-user-token");

        const savedUser = JSON.parse(localStorage.getItem("user"));
        expect(savedUser.username).toBe("newuser");
        expect(savedUser.role).toBe("USER");

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("shows error when registration fails", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                error: "Username already exists",
            }),
        });

        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "admin");
        await user.type(screen.getByLabelText("Password"), "admin");
        await user.click(screen.getByRole("button", { name: "Register" }));

        expect(await screen.findByText("Username already exists")).toBeInTheDocument();
        expect(localStorage.getItem("token")).toBeNull();
        expect(localStorage.getItem("user")).toBeNull();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("does not redirect when fetch crashes", async () => {
        const user = userEvent.setup();

        fetch.mockRejectedValueOnce(new Error("Network error"));

        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "newuser");
        await user.type(screen.getByLabelText("Password"), "newpass");
        await user.click(screen.getByRole("button", { name: "Register" }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        expect(localStorage.getItem("token")).toBeNull();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});