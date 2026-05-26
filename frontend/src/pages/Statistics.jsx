import { useEffect, useMemo, useState } from "react";
import {
    Building2,
    CircleDollarSign,
    Home,
    TrendingUp,
    BadgePercent,
    CheckCircle2,
    AlertCircle,
    Activity,
} from "lucide-react";
import { getStats } from "../services/propertyService";
import PropertiesChart from "../components/PropertiesChart";

export default function Statistics() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            const data = await getStats();
            setStats(data);
        } catch (err) {
            setError(err.message || "Failed to load statistics");
        }
    }

    const calculated = useMemo(() => {
        if (!stats) {
            return {
                availabilityRate: 0,
                soldRate: 0,
                portfolioStatus: "No data available",
                portfolioDescription: "Add properties to start seeing portfolio insights.",
                portfolioTone: "neutral",
            };
        }

        const total = Number(stats.total || 0);
        const available = Number(stats.available || 0);
        const sold = Number(stats.sold || 0);

        const availabilityRate =
            total > 0 ? Math.round((available / total) * 100) : 0;

        const soldRate = total > 0 ? Math.round((sold / total) * 100) : 0;

        let portfolioStatus = "Balanced portfolio";
        let portfolioDescription =
            "Your portfolio has a healthy mix of available and sold properties.";
        let portfolioTone = "positive";

        if (total === 0) {
            portfolioStatus = "No properties yet";
            portfolioDescription =
                "Once properties are added, EstateMe will calculate useful portfolio insights here.";
            portfolioTone = "neutral";
        } else if (availabilityRate >= 75) {
            portfolioStatus = "High availability";
            portfolioDescription =
                "Most properties are still available. This is useful for active sales, but you may want to monitor conversion into sold listings.";
            portfolioTone = "warning";
        } else if (soldRate >= 75) {
            portfolioStatus = "Strong sales performance";
            portfolioDescription =
                "A large part of the portfolio is sold, which suggests strong property turnover.";
            portfolioTone = "positive";
        }

        return {
            availabilityRate,
            soldRate,
            portfolioStatus,
            portfolioDescription,
            portfolioTone,
        };
    }, [stats]);

    if (error) {
        return (
            <div className="page-wide">
                <div className="alert alert-error">{error}</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="page-wide">
                <div className="card card-padded">Loading statistics...</div>
            </div>
        );
    }

    const cards = [
        {
            label: "Total Properties",
            value: stats.total,
            icon: Building2,
        },
        {
            label: "Total Value",
            value: `€${Number(stats.totalValue || 0).toLocaleString()}`,
            icon: CircleDollarSign,
        },
        {
            label: "Average Price",
            value: `€${Number(stats.average || 0).toLocaleString()}`,
            icon: TrendingUp,
        },
        {
            label: "Available",
            value: stats.available,
            icon: Home,
        },
    ];

    const insights = [
        {
            label: "Availability Rate",
            value: `${calculated.availabilityRate}%`,
            description: "Percentage of properties that are still available.",
            icon: BadgePercent,
        },
        {
            label: "Sold Rate",
            value: `${calculated.soldRate}%`,
            description: "Percentage of properties marked as sold.",
            icon: CheckCircle2,
        },
        {
            label: "Portfolio Activity",
            value:
                Number(stats.total || 0) > 0
                    ? Number(stats.sold || 0) > 0
                        ? "Active"
                        : "Listing stage"
                    : "Empty",
            description:
                Number(stats.total || 0) > 0
                    ? "The portfolio has active property data to monitor."
                    : "No properties have been added yet.",
            icon: Activity,
        },
    ];

    return (
        <div className="page-wide">
            <div className="page-title-row">
                <div>
                    <h1>Statistics</h1>
                    <p className="text-muted">
                        Overview of portfolio value, availability, and sales performance.
                    </p>
                </div>
            </div>

            <div className="stats-grid">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <article className="stat-card" key={card.label}>
                            <div className="stat-icon">
                                <Icon size={22} />
                            </div>
                            <div>
                                <p>{card.label}</p>
                                <strong>{card.value}</strong>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className="content-grid">
                <div className="card card-padded">
                    <h2>Availability breakdown</h2>
                    <p className="text-muted stats-card-description">
                        Compare available and sold properties in the current portfolio.
                    </p>

                    <PropertiesChart available={stats.available} sold={stats.sold} />
                </div>

                <div className="card card-padded">
                    <h2>Portfolio Summary</h2>
                    <p className="text-muted stats-card-description">
                        Quick overview of the most important portfolio values.
                    </p>

                    <div className="summary-list">
                        <div>
                            <span>Available properties</span>
                            <strong>{stats.available}</strong>
                        </div>
                        <div>
                            <span>Sold properties</span>
                            <strong>{stats.sold}</strong>
                        </div>
                        <div>
                            <span>Total portfolio value</span>
                            <strong>€{Number(stats.totalValue || 0).toLocaleString()}</strong>
                        </div>
                        <div>
                            <span>Average price</span>
                            <strong>€{Number(stats.average || 0).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <section className="statistics-insights-grid">
                {insights.map((insight) => {
                    const Icon = insight.icon;

                    return (
                        <article className="statistics-insight-card" key={insight.label}>
                            <div className="statistics-insight-icon">
                                <Icon size={22} />
                            </div>

                            <div>
                                <p>{insight.label}</p>
                                <strong>{insight.value}</strong>
                                <span>{insight.description}</span>
                            </div>
                        </article>
                    );
                })}
            </section>

            <section className={`portfolio-health ${calculated.portfolioTone}`}>
                <div className="portfolio-health-icon">
                    <AlertCircle size={24} />
                </div>

                <div>
                    <p className="eyebrow">Portfolio Health</p>
                    <h2>{calculated.portfolioStatus}</h2>
                    <p>{calculated.portfolioDescription}</p>
                </div>
            </section>
        </div>
    );
}