import { useState } from "react";
import Ss26 from "./screen/ss26";
import Ss27 from "./screen/ss27";
import PingMonitor from "./screen/PingMonitor"; // ⚡ 1. เพิ่มการ Import ตรงนี้
import { Analytics } from "@vercel/analytics/react";

const theme = {
  bg: "#020617",
  sidebarBg: "rgba(15, 23, 42, 0.9)",
  cardBg: "rgba(30, 41, 59, 0.4)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  textMain: "#E2E8F0",
  textMuted: "#64748B",
  accent: "#38bdf8",
  success: "#10b981",
  danger: "#ef4444"
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("ss27");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
<div style={{ 
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden"
}}>
      {/* ── SIDEBAR CONTAINER ── */}
      <aside style={{ width: isCollapsed ? "70px" : "260px", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)", backgroundColor: theme.sidebarBg, backdropFilter: "blur(16px)", borderRight: theme.border, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, zIndex: 100, overflowX: "hidden", padding: "20px 12px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between", marginBottom: "30px", padding: "0 4px" }}>
          {!isCollapsed && <div style={{ fontSize: "0.85rem", fontWeight: 800, letterSpacing: "0.05em", color: theme.accent }}>📊 DASHBOARD</div>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ background: "rgba(255,255,255,0.03)", border: theme.border, color: theme.textMain, borderRadius: "6px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} title={isCollapsed ? "ขยายเมนู" : "ซ่อนเมนู"}>
            {isCollapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* ── TABS NAVIGATION ── */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <button onClick={() => setCurrentScreen("ss27")} style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "flex-start", gap: "12px", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, width: "100%", transition: "0.2s", backgroundColor: currentScreen === "ss27" ? "rgba(56, 189, 248, 0.1)" : "transparent", color: currentScreen === "ss27" ? theme.accent : theme.textMuted }}>
            <span style={{ fontSize: "1.1rem" }}>📅</span>
            {!isCollapsed && <span>Season 2026/27</span>}
          </button>

          <button onClick={() => setCurrentScreen("ss26")} style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "flex-start", gap: "12px", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, width: "100%", transition: "0.2s", backgroundColor: currentScreen === "ss26" ? "rgba(56, 189, 248, 0.1)" : "transparent", color: currentScreen === "ss26" ? theme.accent : theme.textMuted }}>
            <span style={{ fontSize: "1.1rem" }}>⏳</span>
            {!isCollapsed && <span>Season 2025/26</span>}
          </button>

          <button onClick={() => setCurrentScreen("ping")} style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "flex-start", gap: "12px", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, width: "100%", transition: "0.2s", backgroundColor: currentScreen === "ping" ? "rgba(56, 189, 248, 0.1)" : "transparent", color: currentScreen === "ping" ? theme.accent : theme.textMuted }}>
            <span style={{ fontSize: "1.1rem" }}>⚡</span>
            {!isCollapsed && <span>Network Ping</span>}
          </button>
        </nav>

        {!isCollapsed && <div style={{ fontSize: "0.65rem", color: theme.textMuted, textAlign: "center", padding: "8px 0" }}>Thai League Live Feed v2.0</div>}
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main style={{
        flex: 1,
        padding: "4px",
        width: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        {/* ทุกหน้าที่เรียกเข้ามา ควรจะมีโครงสร้างแบบที่รองรับ Grid อยู่แล้ว */}
        {currentScreen === "ss27" && <Ss27 />}
        {currentScreen === "ss26" && <Ss26 />}
        {currentScreen === "ping" && <PingMonitor />}
      </main>

      <Analytics />
      <SpeedInsights />
    </div>
  );
}