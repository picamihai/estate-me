import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ForgotPassword from "../pages/ForgotPassword";

describe("ForgotPassword page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockReset();
    });

    it("renders forgot password form", () => {
        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        expect(screen.getByText("Reset your password")).toBeInTheDocument();
        expect(screen.getByLabelText("Username")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Create reset code" })
        ).toBeInTheDocument();
        expect(screen.getByText("Back to login")).toBeInTheDocument();
    });

    it("requests reset code and shows reset form", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                message: "Password reset code created",
                devCode: "654321",
            }),
        });

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "user");
        await user.click(screen.getByRole("button", { name: "Create reset code" }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/auth/forgot-password"),
            expect.objectContaining({
                method: "POST",
            })
        );

        expect(await screen.findByLabelText("Reset code")).toBeInTheDocument();
        expect(screen.getByLabelText("New password")).toBeInTheDocument();
        expect(screen.getByText("654321")).toBeInTheDocument();
    });

    it("resets password successfully", async () => {
        const user = userEvent.setup();

        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Password reset code created",
                    devCode: "654321",
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Password reset successful",
                }),
            });

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "user");
        await user.click(screen.getByRole("button", { name: "Create reset code" }));

        await user.type(await screen.findByLabelText("Reset code"), "654321");
        await user.type(screen.getByLabelText("New password"), "user456");

        const resetButton =
            screen.queryByRole("button", { name: "Reset password" }) ||
            screen.queryByRole("button", { name: "Reset Password" });

        await user.click(resetButton);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        expect(fetch).toHaveBeenLastCalledWith(
            expect.stringContaining("/auth/reset-password"),
            expect.objectContaining({
                method: "POST",
            })
        );

        expect(screen.getByText("Back to login")).toBeInTheDocument();
    });

    it("shows error when reset code request fails", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                error: "User not found",
            }),
        });

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "missing");
        await user.click(screen.getByRole("button", { name: "Create reset code" }));

        expect(await screen.findByText("User not found")).toBeInTheDocument();
    });

    it("shows error when reset password fails", async () => {
        const user = userEvent.setup();

        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Password reset code created",
                    devCode: "654321",
                }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: "Invalid reset code",
                }),
            });

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "user");
        await user.click(screen.getByRole("button", { name: "Create reset code" }));

        await user.type(await screen.findByLabelText("Reset code"), "000000");
        await user.type(screen.getByLabelText("New password"), "user456");

        const resetButton =
            screen.queryByRole("button", { name: "Reset password" }) ||
            screen.queryByRole("button", { name: "Reset Password" });

        await user.click(resetButton);

        expect(await screen.findByText("Invalid reset code")).toBeInTheDocument();
    });

    it("does not continue when request crashes", async () => {
        const user = userEvent.setup();

        fetch.mockRejectedValueOnce(new Error("Network error"));

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText("Username"), "user");
        await user.click(screen.getByRole("button", { name: "Create reset code" }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        expect(screen.queryByLabelText("Reset code")).not.toBeInTheDocument();
    });
});