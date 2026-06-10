import DeviceRow from "./DeviceRow";

export default function PingCard({ stadiumName, devices, history }) {
    const hasFeed = stadiumName.includes(" - ");
    const feedTitle = hasFeed ? stadiumName.split(" - ")[0] : "";
    const cleanStadiumName = hasFeed ? stadiumName.split(" - ")[1] : stadiumName;

    return (
        <div style={{
            background: "var(--card-bg)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 20px -2px rgba(0,0,0,0.3)",
            transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.background = "var(--card-hover)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--card-bg)";
        }}
        >
            {/* ส่วนหัวการ์ด */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "12px" }}>
                {hasFeed && (
                    <span style={{
                        background: "var(--accent-glow)",
                        color: "var(--accent)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "0.5px"
                    }}>
                        {feedTitle}
                    </span>
                )}
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--text-h)", letterSpacing: "-0.3px" }}>
                    🏟️ {cleanStadiumName}
                </h3>
            </div>

            {/* กล่องเก็บรายการอุปกรณ์ */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {devices.map((dev, i) => (
                    <DeviceRow key={i} device={dev} history={history} />
                ))}        
            </div>
        </div>
    );
}