import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PropertiesChart from "../components/PropertiesChart";

describe("PropertiesChart", () => {
    it("renders available and sold percentages", () => {
        render(<PropertiesChart available={3} sold={1} />);

        expect(screen.getByText("Available")).toBeInTheDocument();
        expect(screen.getByText("Sold")).toBeInTheDocument();

        expect(screen.getByText("75%")).toBeInTheDocument();
        expect(screen.getByText("25%")).toBeInTheDocument();

        expect(screen.getByText("3 available")).toBeInTheDocument();
        expect(screen.getByText("1 sold")).toBeInTheDocument();
    });

    it("handles zero total", () => {
        render(<PropertiesChart available={0} sold={0} />);

        const percentages = screen.getAllByText("0%");
        expect(percentages.length).toBeGreaterThanOrEqual(2);

        expect(screen.getByText("0 available")).toBeInTheDocument();
        expect(screen.getByText("0 sold")).toBeInTheDocument();
    });
});