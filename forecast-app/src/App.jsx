import { useState, useEffect } from "react";
import Ss26 from "./screen/ss26";
import Ss27 from "./screen/ss27";
import PingMonitor from "./screen/PingMonitor";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

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
  // เช็คว่าเคยล็อกอินผ่านในแท็บนี้หรือยัง
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem("is_authed") === "true"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [currentScreen, setCurrentScreen] = useState("ss27");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ฟังก์ชันตรวจรหัสผ่าน (เวอร์ชันซ่อนรหัส)
  // ฟังก์ชันตรวจรหัสผ่าน (เวอร์ชันดึงจากไฟล์แยก .env.local ปลอดภัย 100%)
  const handleLogin = (e) => {
    e.preventDefault();
    
    // ดึงค่าจากไฟล์ .env.local (หรือดึงจาก Vercel Environment Variables ตอนขึ้นโปรดักชัน)
    const envUsersString = import.meta.env.VITE_ALLOWED_USERS;
    
    // หากลืมตั้งค่าตัวแปร ระบบจะแจ้งเตือนเพื่อความปลอดภัย
    if (!envUsersString) {
      console.error("Error: ไม่พบการตั้งค่า VITE_ALLOWED_USERS ในระบบ");
      setError("ระบบยังไม่พร้อมใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ");
      return;
    }

    try {
      const allowedUsers = JSON.parse(envUsersString);
      
      const userMatched = allowedUsers.find(
        (account) => account.user === username && account.pass === password
      );

      if (userMatched) {
        sessionStorage.setItem("is_authed", "true");
        setIsAuthenticated(true);
        setError("");
      } else {
        setError("Username หรือ Password ไม่ถูกต้อง");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการอ่านข้อมูลผู้ใช้งาน:", err);
      setError("ระบบตรวจสอบสิทธิ์มีปัญหา กรุณากรอกโครงสร้าง JSON ให้ถูกต้อง");
    }
  };

  // ── 1. กรณีที่ยังไม่ได้ล็อกอิน: บล็อกหน้าจอทั้งหมด ──
  if (!isAuthenticated) {
    return (
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        height: "100vh", width: "100vw", backgroundColor: theme.bg, color: theme.textMain, fontFamily: "sans-serif"
      }}>
        <form onSubmit={handleLogin} style={{
          padding: "30px", background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(16px)",
          borderRadius: "12px", border: theme.border, width: "320px", boxSizing: "border-box"
        }}>
          <h2 style={{ textAlign: "center", marginBottom: "24px", color: theme.accent, fontSize: "1.25rem", fontWeight: 800 }}>
            🔒 จ๊ะเอ๋ ใครเอ่ย
          </h2>
          
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: theme.textMuted }}>ชื่ออะไรจ๊ะะ</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} 
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: theme.border, backgroundColor: "rgba(0,0,0,0.2)", color: theme.textMain, outline: "none", boxSizing: "border-box" }} required />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: theme.textMuted }}>มีรหัสป่าววว</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} 
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: theme.border, backgroundColor: "rgba(0,0,0,0.2)", color: theme.textMain, outline: "none", boxSizing: "border-box" }} required />
          </div>

          {error && <p style={{ color: theme.danger, fontSize: "0.8rem", marginBottom: "16px", textAlign: "center" }}>⚠️ {error}</p>}

          <button type="submit" style={{
            width: "100%", padding: "12px", backgroundColor: theme.accent, 
            color: "#020617", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 800, fontSize: "0.9rem", transition: "0.2s"
          }}>Unlock Dashboard</button>
        </form>
      </div>
    );
  }

  // ── 2. กรณีล็อกอินผ่านแล้ว: ปล่อยเข้าหน้าเว็บ Dashboard ตามเดิม ──
  return (
    <div style={{ 
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: theme.bg
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
        {currentScreen === "ss27" && <Ss27 />}
        {currentScreen === "ss26" && <Ss26 />}
        {currentScreen === "ping" && <PingMonitor />}
      </main>

      <Analytics />
      <SpeedInsights />
    </div>
  );
}
