import PingChart from "./PingChart";

export default function DeviceRow({ device, history = {} }) {
    const isOnline = device.status === "ONLINE";
    const historyData = history?.[device.ip] || []; 

    return (
        <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr 1.2fr", 
            padding: "10px 14px", 
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.01)",
            borderRadius: "8px",
            border: "1px solid transparent",
            transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.03)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
            e.currentTarget.style.borderColor = "transparent";
        }}
        >
            {/* Device Name */}
            <div style={{ 
                color: isOnline ? "var(--text-h)" : "var(--danger)", 
                fontWeight: "500",
                fontSize: "14px"
            }}>
                {device.name}
            </div>

            {/* IP Address */}
            <div style={{ 
                color: "var(--text-muted)", 
                fontFamily: "var(--mono)", 
                fontSize: "12px" 
            }}>
                {device.ip}
            </div>

            {/* Sparkline Chart */}
            <div style={{ display: "flex", alignItems: "center" }}>
                <PingChart data={historyData} />
            </div>

            {/* Ping Value */}
            <div style={{ 
                fontFamily: "var(--mono)", 
                fontWeight: "600", 
                fontSize: "13px",
                color: isOnline ? "var(--text-main)" : "var(--text-muted)"
            }}>
                {isOnline ? `${device.ping} ms` : "—"}
            </div>
            
            {/* Glow Badge Status */}
            <div style={{ textAlign: "right" }}>
                <span className={!isOnline ? "status-timeout" : ""} style={{
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.5px",
                    display: "inline-inline-block",
                    backgroundColor: isOnline ? "var(--success-glow)" : "var(--danger-glow)",
                    color: isOnline ? "var(--success)" : "var(--danger)",
                    border: isOnline ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(244, 63, 94, 0.2)",
                    transition: "all 0.3s ease"
                }}>
                    {isOnline ? "● ONLINE" : "❌ TIMEOUT"}
                </span>
            </div>
        </div>
    );
}