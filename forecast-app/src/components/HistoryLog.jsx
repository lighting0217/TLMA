    import React from "react";

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
                    {!events || events.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: "14px", padding: "10px 0" }}>🟢 สัญญาณโครงข่ายทุกสนามปกติ ไม่มีเหตุการณ์ล่ม</p>
                    ) : (
                        events.map((e, i) => {
                            // 🧠 1. ดักแกะเลข Feed และ ชื่อสนาม จากค่า e.group ที่ส่งเข้ามาข้างใน Object
                            let feed = "XX";
                            let stadium = e.group || "ทั่วไป";

                            if (e.group) {
                                // ดึงตัวเลขหลังคำว่า Feed (รองรับทั้ง Feed 11, feed11, Feed  11)
                                const feedMatch = e.group.match(/feed\s*(\d+)/i);
                                if (feedMatch) {
                                    feed = feedMatch[1];
                                    // ตัดคำว่า Feed XX และเครื่องหมายลบออก เพื่อให้เหลือแค่ชื่อสนามเพียว ๆ
                                    stadium = e.group.replace(/feed\s*\d+/i, "").replace(/^[-\s]+/, "").trim();
                                }
                                
                                // เติมคำว่า "สนาม" ข้างหน้า (ถ้ายังไม่มี)
                                if (stadium && stadium !== "ทั่วไป" && !stadium.startsWith("สนาม")) {
                                    stadium = "สนาม" + stadium;
                                }
                            }

                            // 🧠 2. ชื่ออินเตอร์เฟสดึงจาก e.name (เช่น IPA, IPB, R1, R2)
                            const netInterface = e.name || "Unknown";

                            // 🧠 3. แปลงคำว่า TIMEOUT ให้แสดงผลเป็น Down
                            const displayStatus = e.status === "TIMEOUT" ? "Down" : (e.status || "Down");

                            return (
                                <div key={i} style={{ 
                                    padding: "10px 12px", 
                                    borderBottom: "1px solid rgba(255,255,255,0.02)", 
                                    fontSize: "13px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: "14px", 
                                    background: "rgba(244, 63, 94, 0.02)", 
                                    margin: "4px 0", 
                                    borderRadius: "6px",
                                    flexWrap: "wrap"
                                }}>
                                    {/* 1. แสดงเวลา -> [11:46:42 AM] */}
                                    <span style={{ color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
                                        [{e.time || "00:00:00"}]
                                    </span>

                                    {/* 2. แสดงเลข Feed -> 🏟️ Feed 11 */}
                                    <span style={{ color: "var(--text-h)", fontWeight: "500" }}>
                                        🏟️ Feed {feed}
                                    </span>

                                    {/* 3. แสดงชื่อสนาม -> สนามกีฬากลางจังหวัดนราธิวาส */}
                                    <span style={{ color: "var(--text-h)", fontWeight: "600" }}>
                                        {stadium}
                                    </span>

                                    {/* 4. แสดงสถานะล่ม -> Down (กรอบแดงเรืองแสง) */}
                                    <span style={{ 
                                        color: "var(--danger)", 
                                        fontWeight: "700", 
                                        background: "var(--danger-glow)", 
                                        padding: "2px 8px", 
                                        borderRadius: "4px", 
                                        fontSize: "11px",
                                        textTransform: "uppercase"
                                    }}>
                                        {displayStatus}
                                    </span>

                                    {/* 5. แสดงชื่อ Interface -> IPA */}
                                    <span style={{ color: "var(--accent)", fontWeight: "600" }}>
                                        {netInterface}
                                    </span>

                                    {/* 6. แสดงไอพีแอดเดรส -> IP 192.168.x.x */}
                                    <span style={{ color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
                                        IP {e.ip || "0.0.0.0"}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }