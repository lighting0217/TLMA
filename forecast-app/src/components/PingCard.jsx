import React, { useState } from "react";
import PingChart from "./PingChart";

export default function PingCard({ stadiumName, devices, history }) {
    // 🔍 State สำหรับควบคุมการเปิด/ปิด Dropdown แสดงกราฟของสนามนี้
    const [isOpen, setIsOpen] = useState(false);

    const hasFeed = stadiumName.includes(" - ");
    const feedTitle = hasFeed ? stadiumName.split(" - ")[0] : "";
    const cleanStadiumName = hasFeed ? stadiumName.split(" - ")[1] : stadiumName;

    return (
        <div style={{
            background: "var(--card-bg)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "14px 20px",
            boxShadow: "0 4px 20px -2px rgba(0,0,0,0.3)",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
        >
            {/* ─── แถวหลัก (Always Visible) ─── */}
            <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px"
            }}>
                
                {/* ฝั่งซ้าย: เลข Feed และ ชื่อสนาม */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 280px" }}>
                    {hasFeed && (
                        <span style={{
                            background: "var(--accent-glow)",
                            color: "var(--accent)",
                            border: "1px solid rgba(56, 189, 248, 0.2)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            whiteSpace: "nowrap"
                        }}>
                            {feedTitle}
                        </span>
                    )}
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text-h)" }}>
                        🏟️ {cleanStadiumName}
                    </h3>
                </div>

                {/* ฝั่งขวา: รายชื่ออุปกรณ์เรียงแนวนอน (เขียว/แดง ตามสถานะปิง) */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {devices.map((dev, i) => {
                        const isOnline = dev.status === "ONLINE";
                        return (
                            <div 
                                key={i} 
                                className={!isOnline ? "status-timeout" : ""}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    fontFamily: "var(--mono)",
                                    backgroundColor: isOnline ? "var(--success-glow)" : "var(--danger-glow)",
                                    color: isOnline ? "var(--success)" : "var(--danger)",
                                    border: isOnline ? "1px solid rgba(16, 185, 129, 0.15)" : "1px solid rgba(244, 63, 94, 0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <span style={{ fontSize: "8px" }}>{isOnline ? "●" : "❌"}</span>
                                <span>{dev.name}</span>
                            </div>
                        );
                    })}

                    {/* ปุ่มกดเปิด/ปิด Dropdown กราฟ */}
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            background: isOpen ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.03)",
                            border: "1px solid var(--border)",
                            color: isOpen ? "var(--accent)" : "var(--text-main)",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            marginLeft: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.2s"
                        }}
                    >
                        <span>{isOpen ? "📊 Hide" : "📊 Graph"}</span>
                        <span style={{ fontSize: "10px" }}>{isOpen ? "▲" : "▼"}</span>
                    </button>
                </div>
            </div>

            {/* ─── กล่อง Dropdown Panel (แสดงข้อมูลเชิงลึกและกราฟย่อยเมื่อกดเปิด) ─── */}
            {isOpen && (
                <div style={{
                    marginTop: "12px",
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    // เพิ่มลูกเล่นให้กล่องค่อยๆ คลี่ลงมาอย่างนุ่มนวล
                    animation: "fadeIn 0.25s ease-out"
                }}>
                    {devices.map((dev, i) => {
                        const isOnline = dev.status === "ONLINE";
                        const historyData = history?.[dev.ip] || [];
                        return (
                            <div key={i} style={{
                                background: "rgba(0, 0, 0, 0.15)",
                                border: "1px solid rgba(255, 255, 255, 0.02)",
                                borderRadius: "10px",
                                padding: "10px 12px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px"
                            }}>
                                {/* หัวแถวย่อยใน Dropdown */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontWeight: "700", fontSize: "13px", color: isOnline ? "var(--success)" : "var(--danger)" }}>
                                        {dev.name}
                                    </span>
                                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "600", color: "var(--text-h)" }}>
                                        {isOnline ? `${dev.ping} ms` : "Offline"}
                                    </span>
                                </div>
                                
                                {/* แสดง IP Address */}
                                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                                    IP: {dev.ip}
                                </div>

                                {/* กล่องวางเส้นกราฟ Sparkline */}
                                <div style={{ 
                                    background: "rgba(255, 255, 255, 0.01)", 
                                    borderRadius: "6px", 
                                    padding: "4px 0",
                                    display: "flex", 
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "30px"
                                }}>
                                    <PingChart data={historyData} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}