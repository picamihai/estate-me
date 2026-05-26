import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Statistics from "../pages/Statistics";
import { getStats } from "../services/propertyService";

vi.mock("../services/propertyService", () => ({
    getStats: vi.fn(),
}));

describe("Statistics page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders statistics data", async () => {
        getStats.mockResolvedValue({
            total: 4,
            totalValue: 800000,
            average: 200000,
            available: 3,
            sold: 1,
        });

        render(<Statistics />);

        expect(screen.getByText("Loading statistics...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Total Properties")).toBeInTheDocument();
        });

        expect(screen.getAllByText("€800,000").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("€200,000").length).toBeGreaterThanOrEqual(1);

        expect(screen.getByText("Availability Rate")).toBeInTheDocument();
        expect(screen.getAllByText("75%").length).toBeGreaterThanOrEqual(1);

        expect(screen.getByText("Sold Rate")).toBeInTheDocument();
        expect(screen.getAllByText("25%").length).toBeGreaterThanOrEqual(1);

        expect(screen.getByText("High availability")).toBeInTheDocument();
    });

    it("renders error state", async () => {
        getStats.mockRejectedValue(new Error("Failed to load statistics"));

        render(<Statistics />);

        expect(
            await screen.findByText("Failed to load statistics")
        ).toBeInTheDocument();
    });
});