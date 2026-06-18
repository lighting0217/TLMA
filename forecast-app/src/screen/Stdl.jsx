import { useState, useMemo, useRef } from "react";
import data from "../Data/STDTL.json";

const allData = data;

// ใช้ CSS variables ของโปรเจค + inline styles แทน Tailwind
// สีตาม COLS ในโปรเจคหลัก
function mkBadge(hex, alpha = 0.12) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    background: `rgba(${r},${g},${b},${alpha})`,
    color: hex,
    border: `1px solid rgba(${r},${g},${b},0.3)`,
  };
}

// fuzzy match รองรับทั้ง short code ("T1") และ full string ("THAI LEAGUE 1", "PEA U-21 LEAGUE")
function resolveLeague(raw = "") {
  const k = raw.toUpperCase().trim();
  if (k === "T1" || k === "TL1" || k.includes("LEAGUE 1"))
    return { label: "Thai League 1", badge: mkBadge("#f31717") };
  if (k === "T2" || k === "TL2" || k.includes("LEAGUE 2"))
    return { label: "Thai League 2", badge: mkBadge("#574de7") };
  if (k === "T3" || k === "TL3" || k.includes("LEAGUE 3"))
    return { label: "Thai League 3", badge: mkBadge("#4ac710") };
  if (k === "U21" || k.includes("U-21") || k.includes("U21") || k.includes("PEA"))
    return { label: "PEA U-21",      badge: mkBadge("#dad3f3") };
  if (k === "WOMEN" || k.includes("WOMEN") || k.includes("WOMAN"))
    return { label: "Women",         badge: mkBadge("#ff6bdf") };
  if (k === "FA" || k === "CHANG" || k.includes("FA CUP") || k.includes("CHANG"))
    return { label: "FA Cup",        badge: mkBadge("#c8ff00") };
  if (k === "MUANG" || k.includes("MUANG") || k.includes("LEAGUE CUP"))
    return { label: "League Cup",    badge: mkBadge("#d60fc6") };
  return { label: raw || "Spare",    badge: mkBadge("#64748b") };
}

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{
        background: "rgba(251,191,36,0.2)",
        color: "#fde68a",
        fontWeight: 600,
        borderRadius: 3,
        padding: "0 3px",
        border: "1px solid rgba(251,191,36,0.3)",
      }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function IPBadge({ label, value, query }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{
        fontSize: 13,
        color: "var(--text-muted, #64748b)",
        width: 160,
        flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "var(--mono, 'JetBrains Mono', monospace)",
        fontSize: 15,
        color: "#cbd5e1",
        userSelect: "all",
        letterSpacing: "0.03em",
      }}>
        {highlight(value, query)}
      </span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(56,189,248,0.7)",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      margin: "16px 0 8px",
    }}>
      {children}
    </p>
  );
}

function ResultCard({ rec, query }) {
  const { label, badge } = resolveLeague(rec.league);
  return (
    <div style={{
      background: "rgba(15,23,42,0.75)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      display: "flex",
      flexDirection: "column",
      transition: "border-color 0.25s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(56,189,248,0.3)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
    >
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(2,6,23,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 6,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            ...badge,
          }}>
            {label}
          </span>
          {rec.region && (
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              {rec.region}
            </span>
          )}
        </div>
        <h2 style={{ margin: "0 0 3px", fontSize: 19, fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.01em" }}>
          {highlight(rec.club, query)}
        </h2>
        <p style={{ margin: "0 0 5px", fontSize: 15, color: "#94a3b8" }}>
          {highlight(rec.stadium, query)}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
          📍 {rec.location}
        </p>
      </div>

      {/* IPs */}
      <div style={{ padding: "4px 20px 16px", flexGrow: 1 }}>
        <SectionLabel>⚡ Encoder IP</SectionLabel>
        <IPBadge label="Encoder A — Data1"     value={rec.encoderA_data1}    query={query} />
        <IPBadge label="Encoder B — Data1"     value={rec.encoderB_data1}    query={query} />
        <IPBadge label="Encoder A — Data2 NAT" value={rec.encoderA_data2nat} query={query} />
        <IPBadge label="Encoder B — Data2 NAT" value={rec.encoderB_data2nat} query={query} />

        <SectionLabel>⚙️ IP Management</SectionLabel>
        <IPBadge label="Switch 1 (SW1)" value={rec.sw1}    query={query} />
        <IPBadge label="Switch 2 (SW2)" value={rec.sw2}    query={query} />
        <IPBadge label="Router"          value={rec.router} query={query} />
        <IPBadge label="NON1"            value={rec.NON1}   query={query} />
        <IPBadge label="NON2"            value={rec.NON2}   query={query} />
        <IPBadge label="NON3"            value={rec.NON3}   query={query} />

        {rec.note && (
          <p style={{
            marginTop: 12,
            fontSize: 13,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 8,
            padding: "8px 12px",
            lineHeight: 1.6,
          }}>
            📝 {rec.note}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Stdl() {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allData.filter((r) =>
      [r.club, r.stadium, r.location, r.league, r.region,
       r.encoderA_data1, r.encoderB_data1, r.encoderA_data2nat,
       r.encoderB_data2nat, r.sw1, r.sw2, r.router]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div style={{ width: "100%", minHeight: "100vh", paddingBottom: 48 }}>
      {/* Sticky search bar */}
      <div style={{
        background: "rgba(2,6,23,0.88)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
          <h1 style={{
            margin: "0 0 12px",
            fontSize: 16,
            fontWeight: 700,
            color: "#e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            🏟️ Stadium IP Lookup
          </h1>

          {/* Search input */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 12,
              top: "50%", transform: "translateY(-50%)",
              color: "#475569", fontSize: 15, pointerEvents: "none",
            }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา ชื่อทีม, สนาม, IP address..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                paddingLeft: 40,
                paddingRight: 40,
                paddingTop: 12,
                paddingBottom: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(15,23,42,0.7)",
                color: "#f1f5f9",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                style={{
                  position: "absolute", right: 12,
                  top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: "#475569", cursor: "pointer", fontSize: 14,
                  padding: 4, lineHeight: 1,
                }}
              >✕</button>
            )}
          </div>

          {query && (
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(56,189,248,0.8)", fontWeight: 600 }}>
              พบ {results.length} รายการ
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        {!query && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🔎</div>
            <p style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>
              พิมพ์ชื่อทีม, สนาม หรือ IP address เพื่อค้นหา
            </p>
            <p style={{ fontSize: 12, marginTop: 4, color: "#334155" }}>
              ฐานข้อมูลพร้อมใช้งาน {allData.length} รายการ
            </p>
          </div>
        )}

        {query && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>😕</div>
            <p style={{ fontSize: 15, color: "#64748b" }}>
              ไม่พบข้อมูลที่ตรงกับ "<span style={{ color: "#38bdf8" }}>{query}</span>"
            </p>
          </div>
        )}

        <div style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
        }}>
          {results.map((rec, i) => (
            <ResultCard key={i} rec={rec} query={query.trim()} />
          ))}
        </div>
      </div>
    </div>
  );
}