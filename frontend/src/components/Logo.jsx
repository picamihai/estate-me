import logo from "../assets/estateme-logo.png";

export default function Logo({ variant = "full", size = "md" }) {
    const sizes = {
        sm: "logo-image-sm",
        md: "logo-image-md",
        lg: "logo-image-lg",
    };

    return (
        <div className={`logo logo-${variant}`}>
            <img
                src={logo}
                alt="EstateMe logo"
                className={`logo-image ${sizes[size] || sizes.md}`}
            />
        </div>
    );
}