// src/components/DeviceRow.jsx
import PingChart from "./PingChart";

export default function DeviceRow({ device, history = {} }) { // 1. ใส่ = {} ป้องกันกรณี history เป็น undefined
    const isOnline = device.status === "ONLINE";
    const historyData = history?.[device.ip] || []; 

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "10px 20px", alignItems: "center" }}>
            <div style={{ color: isOnline ? "#E2E8F0" : "#ef4444" }}>{device.name}</div>
            <div style={{ color: "#64748B", fontSize: "0.75rem" }}>{device.ip}</div>
            <div><PingChart data={historyData} /></div>
            <div style={{ fontWeight: 700 }}>{isOnline ? `${device.ping} ms` : "—"}</div>
            
            {/* Status Badge */}
            <div style={{ textAlign: "right" }}>
                <span className={!isOnline ? "status-timeout" : ""} style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    backgroundColor: isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    color: isOnline ? "#10b981" : "#ef4444",
                    border: isOnline ? "1px solid #10b981" : "1px solid #ef4444"
                }}>
                    {isOnline ? "● ONLINE" : "❌ TIMEOUT"}
                </span>
            </div>
        </div>
    );
}