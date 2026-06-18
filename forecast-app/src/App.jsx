import { useState } from "react";
import Ss26 from "./screen/ss26";
import Ss27 from "./screen/ss27";
import PingMonitor from "./screen/PingMonitor";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Stdl from "./screen/Stdl";
import { useFrontendTelemetry } from "./hooks/useFrontendTelemetry";
import { THEMES } from "./utils/themes";

// ── ธีมสำหรับ Stdl ─────────────────────────────────────────────────────────
const STDL_THEMES = [
  { key: "dark", label: "🌙", title: "มืด" },
  { key: "light", label: "☀️", title: "สว่าง" },
  { key: "teal", label: "🌊", title: "เทอร์ควอยซ์" },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem("is_authed") === "true",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [currentScreen, setCurrentScreen] = useState("ss27");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [themeKey, setThemeKey] = useState("dark");
  const theme = THEMES[themeKey];

  const { telemetry } = useFrontendTelemetry();

  const handleLogin = (e) => {
    e.preventDefault();
    const envUsersString = import.meta.env.VITE_ALLOWED_USERS;
    if (!envUsersString) {
      setError("ระบบยังไม่พร้อมใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ");
      return;
    }
    try {
      const allowedUsers = JSON.parse(envUsersString);
      const userMatched = allowedUsers.find(
        (a) => a.user === username && a.pass === password,
      );
      if (userMatched) {
        sessionStorage.setItem("is_authed", "true");
        setIsAuthenticated(true);
        setError("");
      } else {
        setError("Username หรือ Password ไม่ถูกต้อง");
      }
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("ระบบตรวจสอบสิทธิ์มีปัญหา กรุณากรอกโครงสร้าง JSON ให้ถูกต้อง");
    }
  };

  // ── Login wall ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: theme.pageBg,
          color: theme.title,
          fontFamily: "sans-serif",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            padding: "30px",
            background: theme.loginBg,
            backdropFilter: "blur(16px)",
            borderRadius: "12px",
            border: theme.border,
            width: "320px",
            boxSizing: "border-box",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              marginBottom: "24px",
              color: theme.accent,
              fontSize: "1.25rem",
              fontWeight: 800,
            }}
          >
            🔒 จ๊ะเอ๋ ใครเอ่ย
          </h2>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "0.85rem",
                color: theme.label,
              }}
            >
              ชื่ออะไรจ๊ะะ
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: theme.border,
                backgroundColor: theme.loginInputBg,
                color: theme.title,
                outline: "none",
                boxSizing: "border-box",
              }}
              required
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "0.85rem",
                color: theme.label,
              }}
            >
              มีรหัสป่าววว
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: theme.border,
                backgroundColor: theme.loginInputBg,
                color: theme.title,
                outline: "none",
                boxSizing: "border-box",
              }}
              required
            />
          </div>
          {error && (
            <p
              style={{
                color: theme.danger,
                fontSize: "0.8rem",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              ⚠️ {error}
            </p>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: theme.accent,
              color: theme.loginButtonText,
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "0.9rem",
            }}
          >
            จิ้มเบาๆนะเตงงง
          </button>
        </form>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: theme.pageBg,
      }}
    >
      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width: isCollapsed ? "70px" : "220px",
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          backgroundColor: theme.sidebarBg,
          backdropFilter: "blur(16px)",
          borderRight: theme.border,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 100,
          overflowX: "hidden",
          padding: "20px 12px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            marginBottom: "30px",
            padding: "0 4px",
          }}
        >
          {!isCollapsed && (
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                color: theme.accent,
              }}
            >
              📊 DASHBOARD
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: theme.sidebarButtonBg,
              border: theme.border,
              color: theme.title,
              borderRadius: "6px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isCollapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { id: "ss27", icon: "📅", label: "Season 2026/27" },
            { id: "ss26", icon: "⏳", label: "Season 2025/26" },
            { id: "ping", icon: "⚡", label: "Network Ping" },
            { id: "stdl", icon: "🏟️", label: "Stadium IP Lookup" },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setCurrentScreen(id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: "12px",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                width: "100%",
                transition: "0.2s",
                backgroundColor:
                  currentScreen === id ? theme.sidebarActiveBg : "transparent",
                color: currentScreen === id ? theme.accent : theme.label,
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{icon}</span>
              {!isCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Theme Switcher */}
          <div
            style={{
              paddingTop: "12px",
              borderTop: theme.border,
            }}
          >
            {isCollapsed ? null : (
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: theme.label,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                🎨 Appearance
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: isCollapsed ? "column" : "row",
                gap: 6,
                alignItems: "center",
              }}
            >
              {STDL_THEMES.map((th) => {
                const active = th.key === themeKey;

                return (
                  <button
                    key={th.key}
                    onClick={() => setThemeKey(th.key)}
                    title={th.title}
                    style={{
                      flex: isCollapsed ? undefined : 1,
                      padding: isCollapsed ? "6px" : "6px 4px",
                      borderRadius: 7,
                      border: active ? theme.themeActiveBorder : theme.border,
backgroundColor: active
  ? theme.themeActiveBg
  : theme.glassBg,

                      fontWeight: active ? 700 : 500,
                      color: active ? theme.accent : theme.label,
                      cursor: "pointer",
                    }}
                  >
                    <span>{th.label}</span>
                    {!isCollapsed && <span>{th.title}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer telemetry */}
          <div
            style={{
              paddingTop: "12px",
              borderTop: theme.border,
              background: theme.telemetryBg,
            }}
          >
            {!isCollapsed ? (
              <>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: theme.title,
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>📡 Live Traffic:</span>
                  <span style={{ color: theme.accent }}>
                    {telemetry.total.mb} MB
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.65rem",
                    color: theme.label,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Speed/min:</span>
                  <span>{telemetry.perMinute.kb} KB</span>
                </div>

                <div
                  style={{
                    fontSize: "0.65rem",
                    color: theme.label,
                    textAlign: "center",
                    marginTop: "6px",
                    opacity: 0.7,
                  }}
                >
                  Thai League Live Feed v2.0
                </div>
              </>
            ) : (
              <div style={{ fontSize: "0.9rem" }}>📡</div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main
        style={{
          flex: 1,
          padding: "4px",
          width: "100%",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {currentScreen === "ss27" && <Ss27 theme={theme} />}
        {currentScreen === "ss26" && <Ss26 theme={theme} />}
        {currentScreen === "ping" && <PingMonitor theme={theme} />}
        {currentScreen === "stdl" && <Stdl themeKey={themeKey} />}
      </main>

      <Analytics />
      <SpeedInsights />
    </div>
  );
}
