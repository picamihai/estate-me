import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

function createLocalStorageMock() {
    let store = {};

    return {
        getItem: vi.fn((key) => store[key] || null),

        setItem: vi.fn((key, value) => {
            store[key] = String(value);
        }),

        removeItem: vi.fn((key) => {
            delete store[key];
        }),

        clear: vi.fn(() => {
            store = {};
        }),
    };
}

beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(window, "localStorage", {
        value: createLocalStorageMock(),
        writable: true,
        configurable: true,
    });

    Object.defineProperty(globalThis, "localStorage", {
        value: window.localStorage,
        writable: true,
        configurable: true,
    });

    globalThis.fetch = vi.fn();
});