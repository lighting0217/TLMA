import DeviceRow from "./DeviceRow";

export default function PingCard({ stadiumName, devices, history }) {
    const hasFeed = stadiumName.includes(" - ");
    const feedTitle = hasFeed ? stadiumName.split(" - ")[0] : ""; // จะได้ "Feed 25"
    const cleanStadiumName = hasFeed ? stadiumName.split(" - ")[1] : stadiumName; // จะได้ "เลย ริเวอร์ไซด์ สเตเดียม"

    return (
        <div style={{
            background: "rgba(30, 41, 59, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            padding: "16px"
        }}>
            {/* ── ส่วนหัวการ์ดแสดงชื่อสนามและ Feed ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                {hasFeed && (
                    <span style={{
                        background: "#38bdf8", // สีฟ้าสดใส
                        color: "#020617",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold"
                    }}>
                        {feedTitle}
                    </span>
                )}
                <h3 style={{ margin: 0, fontSize: "16px", color: "#E2E8F0" }}>
                    🏟️ {cleanStadiumName}
                </h3>
            </div>
            {devices.map((dev, i) => (
                <DeviceRow
                    key={i}
                    device={dev}
                    history={history}
                />
            ))}        
        </div>
    );
}