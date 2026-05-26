import { describe, expect, it, beforeEach } from "vitest";
import {
    getCurrentUser,
    getToken,
    hasPermission,
    isLoggedIn,
    logout,
} from "../utils/auth";

describe("auth utils", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("returns null user when no user is stored", () => {
        expect(getCurrentUser()).toBeNull();
    });

    it("returns parsed current user", () => {
        localStorage.setItem(
            "user",
            JSON.stringify({
                username: "admin",
                role: "ADMIN",
                permissions: ["CREATE_PROPERTY"],
            })
        );

        expect(getCurrentUser()).toEqual({
            username: "admin",
            role: "ADMIN",
            permissions: ["CREATE_PROPERTY"],
        });
    });

    it("returns null for invalid stored user JSON", () => {
        localStorage.setItem("user", "{bad json");

        expect(getCurrentUser()).toBeNull();
    });

    it("returns token from localStorage", () => {
        localStorage.setItem("token", "abc123");

        expect(getToken()).toBe("abc123");
    });

    it("detects login state", () => {
        expect(isLoggedIn()).toBe(false);

        localStorage.setItem("token", "abc123");
        localStorage.setItem(
            "user",
            JSON.stringify({
                username: "admin",
                permissions: [],
            })
        );

        expect(isLoggedIn()).toBe(true);
    });

    it("checks permissions", () => {
        localStorage.setItem(
            "user",
            JSON.stringify({
                username: "admin",
                permissions: ["CREATE_PROPERTY"],
            })
        );

        expect(hasPermission("CREATE_PROPERTY")).toBe(true);
        expect(hasPermission("DELETE_PROPERTY")).toBe(false);
    });

    it("returns false permissions when user has no permissions array", () => {
        localStorage.setItem(
            "user",
            JSON.stringify({
                username: "admin",
            })
        );

        expect(hasPermission("CREATE_PROPERTY")).toBe(false);
    });

    it("logout clears auth storage", () => {
        localStorage.setItem("token", "abc123");
        localStorage.setItem("user", JSON.stringify({ username: "admin" }));

        logout();

        expect(localStorage.getItem("token")).toBeNull();
        expect(localStorage.getItem("user")).toBeNull();
    });
});