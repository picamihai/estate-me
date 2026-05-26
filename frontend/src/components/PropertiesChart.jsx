export default function PropertiesChart({ available = 0, sold = 0 }) {
    const total = available + sold;

    const availablePercent = total > 0 ? Math.round((available / total) * 100) : 0;
    const soldPercent = total > 0 ? Math.round((sold / total) * 100) : 0;

    return (
        <div className="chart-box">
            <div className="chart-bars">
                <div>
                    <div className="bar-label">
                        <span>Available</span>
                        <strong>{availablePercent}%</strong>
                    </div>
                    <div className="bar-track">
                        <div className="bar-fill available" style={{ width: `${availablePercent}%` }} />
                    </div>
                </div>

                <div>
                    <div className="bar-label">
                        <span>Sold</span>
                        <strong>{soldPercent}%</strong>
                    </div>
                    <div className="bar-track">
                        <div className="bar-fill sold" style={{ width: `${soldPercent}%` }} />
                    </div>
                </div>
            </div>

            <div className="chart-legend">
        <span>
          <i className="dot available" />
            {available} available
        </span>

                <span>
          <i className="dot sold" />
                    {sold} sold
        </span>
            </div>
        </div>
    );
}