import Logo from "../components/Logo";
import {
    Building2,
    BarChart3,
    ShieldCheck,
    MessageCircle,
    CheckCircle2,
    Users,
    TrendingUp,
    Clock,
} from "lucide-react";

export default function Home() {
    const features = [
        {
            icon: Building2,
            title: "Property Management",
            description:
                "Easily organize and manage your listings with a clean, intuitive workspace built for modern real estate teams.",
        },
        {
            icon: BarChart3,
            title: "Statistics",
            description:
                "Get clear insights into your portfolio with smart overviews, pricing trends, and performance highlights.",
        },
        {
            icon: ShieldCheck,
            title: "Role Permissions",
            description:
                "Keep your workflow secure with structured access control designed for teams, managers, and administrators.",
        },
        {
            icon: MessageCircle,
            title: "Real-Time Chat",
            description:
                "Stay connected with your team through fast, seamless communication directly inside the platform.",
        },
    ];

    const highlights = [
        {
            icon: CheckCircle2,
            label: "Centralized listings",
            text: "All property data organized in one reliable workspace.",
        },
        {
            icon: Users,
            label: "Team ready",
            text: "Designed for admins, agents, and internal users.",
        },
        {
            icon: TrendingUp,
            label: "Smarter decisions",
            text: "Use portfolio insights to understand performance faster.",
        },
        {
            icon: Clock,
            label: "Faster workflow",
            text: "Reduce manual work and keep daily operations clear.",
        },
    ];

    return (
        <div className="page-wide">
            <section className="hero-card">
                <div className="hero-logo">
                    <Logo variant="full" size="lg" />
                </div>

                <h1>Manage properties with clarity and control</h1>

                <p className="hero-text">
                    EstateMe is a modern real estate management platform designed to help
                    teams organize listings, monitor performance, and streamline daily
                    operations through one elegant digital workspace.
                </p>
            </section>

            <section className="feature-grid">
                {features.map((feature) => {
                    const Icon = feature.icon;

                    return (
                        <article className="feature-card" key={feature.title}>
                            <div className="feature-icon">
                                <Icon size={22} />
                            </div>

                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </article>
                    );
                })}
            </section>

            <section className="dashboard-highlight">
                <div className="dashboard-highlight-content">
                    <p className="eyebrow">Built for real estate teams</p>
                    <h2>Everything your team needs to manage properties efficiently.</h2>
                    <p>
                        EstateMe brings property operations, team communication, access
                        control, and performance insights into one simple platform. It helps
                        teams work faster, stay organized, and keep important data easy to
                        access.
                    </p>
                </div>

                <div className="highlight-grid">
                    {highlights.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div className="highlight-item" key={item.label}>
                                <div className="highlight-icon">
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h3>{item.label}</h3>
                                    <p>{item.text}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}