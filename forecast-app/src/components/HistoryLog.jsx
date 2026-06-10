export default function HistoryLog({ events }) {
    return (
        <div style={{ 
            marginTop: "16px", 
            background: "var(--card-bg)", 
            backdropFilter: "blur(12px)",
            padding: "24px", 
            borderRadius: "16px", 
            border: "1px solid var(--border)",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
        }}>
            <h3 style={{ color: "var(--accent)", marginTop: 0, fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                📜 Recent Alerts Network Log
            </h3>
            <div style={{ maxHeight: "220px", overflowY: "auto", paddingRight: "5px" }}>
                {events.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", padding: "10px 0" }}>🟢 สัญญาณโครงข่ายทุกสนามปกติ ไม่มีเหตุการณ์ล่ม</p>
                ) : (
                    events.map((e, i) => (
                        <div key={i} style={{ 
                            padding: "10px 12px", 
                            borderBottom: "1px solid rgba(255,255,255,0.02)", 
                            fontSize: "13px", 
                            display: "flex", 
                            alignItems: "center",
                            gap: "14px",
                            background: "rgba(244, 63, 94, 0.02)",
                            margin: "4px 0",
                            borderRadius: "6px"
                        }}>
                            <span style={{ color: "var(--text-muted)", fontFamily: "var(--mono)" }}>[{e.time}]</span>
                            <span style={{ color: "var(--text-h)", fontWeight: "600" }}>🏟️ {e.device}</span>
                            <span style={{ 
                                color: "var(--danger)", 
                                fontWeight: "700", 
                                background: "var(--danger-glow)", 
                                padding: "2px 8px", 
                                borderRadius: "4px",
                                fontSize: "11px" 
                            }}>{e.status}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}