export default function HistoryLog({ events }) {
    return (
        <div style={{ marginTop: "30px", background: "rgba(30, 41, 59, 0.4)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <h3 style={{ color: "#38bdf8", marginTop: 0 }}>📜 Recent Alerts Log</h3>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {events.length === 0 ? <p style={{ color: "#64748B" }}>ยังไม่มีเหตุการณ์แจ้งเตือน</p> : 
                    events.map((e, i) => (
                        <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #1e293b", fontSize: "0.85rem", display: "flex", gap: "10px" }}>
                            <span style={{ color: "#64748B" }}>[{e.time}]</span>
                            <span style={{ color: "#f8fafc", fontWeight: "bold" }}>{e.device}</span>
                            <span style={{ color: "#ef4444" }}>{e.status}</span>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}