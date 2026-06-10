import { useState, useMemo } from "react";
// 🚨 ดึงเฉพาะ RAW26 และปรับ Path ถอยออกไป 1 ชั้นหากล่อง Data
import { RAW26 } from "../Data/rawdata";
import { MATCH_DETAILS } from "../Data/matchDetails";
import { normalizeLeague, getLeagueKey } from "../Data/utility";

// ── CONSTANTS & UTILITIES (เฉพาะของปี 2025/26) ──
const COLS = [
  { k: "TL1", n: "Thai League 1", c: "#f31717" },
  { k: "TL2", n: "Thai League 2", c: "#574de7" },
  { k: "TL3", n: "Thai League 3", c: "#4ac710" },
  { k: "U21", n: "PEA U21", c: "#dad3f3" },
  { k: "WOMEN", n: "Women / Others", c: "#ff6bdf" },
  { k: "CHANG", n: "FA Cup", c: "#c8ff00" },
  { k: "MUANG", n: "League Cup", c: "#d60fc6" },
];

const KEYS = COLS.map(c => c.k);
const LEAGUE_ORDER = { TL1: 1, TL2: 2, TL3: 3, U21: 4, WOMEN: 5, CHANG: 6, MUANG: 7 };
const leagueColor = {
  "THAI LEAGUE 1": "#f31717",
  "THAI LEAGUE 2": "#574de7",
  "THAI LEAGUE 3": "#4ac710",
  "PEA U21": "#dad3f3",
  "WOMEN": "#ff6bdf",
  "FA CUP": "#c8ff00",
  "LEAGUE CUP": "#d60fc6"
};

const getLeagueOrder = (league) => LEAGUE_ORDER[getLeagueKey(league)] ?? 999;

const getLeagueColor = (league) => {
  const normalized = normalizeLeague(league);
  if (normalized.startsWith("THAI LEAGUE 3")) return "#4ac710";
  if (normalized === "WOMEN") return "#ff6bdf";
  return leagueColor[normalized] || "#64748B";
};

function getMonthKey(d) {
  const [, mm, yyyy] = d.split('/');
  return `${yyyy}/${mm.padStart(2, '0')}`;
}

// Map ข้อมูลแมตช์จริงของปี 25/26
const DATA26 = RAW26.map(([d, t1, t2, t3, pea, women, chang, muang]) => ({
  d,
  TL1: t1 || 0,
  TL2: t2 || 0,
  TL3: t3 || 0,
  U21: pea || 0,
  WOMEN: women || 0,
  CHANG: chang || 0,
  MUANG: muang || 0
}));

const PDATA26 = DATA26.map(r => {
  const total = KEYS.reduce((s, k) => s + r[k], 0);
  return {
    ...r,
    p: {
      TL1: r.TL1, TL2: r.TL2, TL3: r.TL3, U21: r.U21, WOMEN: r.WOMEN, CHANG: r.CHANG, MUANG: r.MUANG,
      total,
      hasPO: false,
      period: "regular",
      ramadan: false,
      isFinal: false
    }
  };
});

// ดึงรายชื่อเดือนที่เป็นไปได้ของปี 25/26 มาแสดง Label ตัวย่อภาษาไทย
const ML = {
  "ALL": "รวมทุกเดือน",
  "2025/08": "ส.ค. 68", "2025/09": "ก.ย. 68", "2025/10": "ต.ค. 68", "2025/11": "พ.ย. 68", "2025/12": "ธ.ค. 68",
  "2026/01": "ม.ค. 69", "2026/02": "ก.พ. 69", "2026/03": "มี.ค. 69", "2026/04": "เม.ย. 69", "2026/05": "พ.ค. 69", "2026/06": "มิ.ย. 69",
};

function loadStyle(t, hasPO, isFinal) {
  if (isFinal) return { txt: "#FBBF24", row: "rgba(245,158,11,0.06)", left: "#F59E0B" };
  if (t === 0) return { txt: "#1E293B", row: "transparent", left: "transparent" };
  if (hasPO) return { txt: "#C084FC", row: "rgba(124,58,237,0.06)", left: "#7C3AED" };
  if (t <= 3) return { txt: "#64748B", row: "transparent", left: "#334155" };
  if (t <= 9) return { txt: "#60A5FA", row: "rgba(29,78,216,0.06)", left: "#3B82F6" };
  if (t <= 19) return { txt: "#FCD34D", row: "rgba(217,119,6,0.06)", left: "#D97706" };
  return { txt: "#F87171", row: "rgba(185,28,28,0.06)", left: "#EF4444" };
}

const GRID = "100px repeat(7,1fr) 70px";
const glassCard = { background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" };

// ── COMPONENT ──
export default function Ss26() {
  const [active, setActive] = useState("ALL");
  const [showInfo, setShowInfo] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState("ALL");
  const [selectedMatchDay, setSelectedMatchDay] = useState(null);

  const months = useMemo(() => {
    const s = new Set(DATA26.map(r => getMonthKey(r.d)));
    return [...s].sort();
  }, []);

  const normalizeDate = (d) => {
    const [day, month, year] = d.split("/");
    return `${parseInt(day)}/${parseInt(month)}/${year}`;
  };

  const popupMatches = useMemo(() => {
    if (!selectedMatchDay) return [];
    return selectedMatchDay.matches.filter(match => {
      if (selectedLeague === "ALL") return true;
      return getLeagueKey(match.league) === selectedLeague;
    });
  }, [selectedMatchDay, selectedLeague]);

  const monthStats = useMemo(() => months.map(m => {
    const rows = PDATA26.filter(r => getMonthKey(r.d) === m);

    const calcTotal = rows.reduce((s, r) => {
      if (selectedLeague === "ALL") return s + r.p.total;
      return s + r.p[selectedLeague];
    }, 0);

    const calcPeak = Math.max(...rows.map(r => {
      if (selectedLeague === "ALL") return r.p.total;
      return r.p[selectedLeague];
    }));

    return {
      m, label: ML[m] || m,
      total: calcTotal,
      peak: calcPeak,
      days: rows.length,
      hasPO: false,
      isAC: false,
      isL2: false,
    };
  }), [months, selectedLeague]);

  const currentMonthRows = useMemo(() => {
    if (active === "ALL") return PDATA26;
    return PDATA26.filter(r => getMonthKey(r.d) === active);
  }, [active]);

  const filteredRows = useMemo(() => {
    if (selectedLeague === "ALL") return currentMonthRows;
    return currentMonthRows.filter(r => r.p[selectedLeague] > 0);
  }, [currentMonthRows, selectedLeague]);

  const colTotals = useMemo(() => {
    const t = Object.fromEntries(KEYS.map(k => [k, filteredRows.reduce((s, r) => s + r.p[k], 0)]));
    const baseTotal = filteredRows.reduce((s, r) => s + r.p.total, 0);

    t.total = selectedLeague === "ALL" ? baseTotal : filteredRows.reduce((s, r) => s + r.p[selectedLeague], 0);
    return t;
  }, [filteredRows, selectedLeague]);

  const grandTotal = monthStats.reduce((s, m) => s + m.total, 0);
  const maxMonthLoad = Math.max(...monthStats.map(m => m.total), 1);
  const peakDayLoad = useMemo(() => {
    if (filteredRows.length === 0) return 1;
    return Math.max(...filteredRows.map(r => {
      return selectedLeague === "ALL" ? r.p.total : r.p[selectedLeague];
    }), 1);
  }, [filteredRows, selectedLeague]);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#E2E8F0" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#38bdf8", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
            AWN/AIS Play · Thai League · IBC
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em", background: "linear-gradient(to right, #f31717,#574de7,#4ac710)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            📅 Thai League Calendar 2025/2026
          </h1>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button onClick={() => setShowInfo(s => !s)} style={{ ...glassCard, padding: "6px 12px", background: "rgba(30,41,59,0.5)", color: "#94a3b8", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
            {showInfo ? "▲ ซ่อนผังข้อมูล" : "▼ แสดงผังข้อมูล"}
          </button>
        </div>
      </div>

      {/* ── SEASON STRUCTURAL INFO ── */}
      {showInfo && (
        <div style={{ ...glassCard, padding: "16px", marginBottom: "20px", fontSize: "0.75rem", background: "rgba(10,15,30,0.8)", borderColor: "rgba(56,189,248,0.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "12px", marginBottom: "12px" }}>
            <div><span style={{ color: "#f31717" }}>■</span> Thai League 1 (2025/26): สถิติจำนวนแมตช์จริงรายวัน</div>
            <div><span style={{ color: "#574de7" }}>■</span> Thai League 2 (2025/26): สถิติจำนวนแมตช์จริงรายวัน</div>
            <div><span style={{ color: "#4ac710" }}>■</span> Thai League 3 (2025/26): รวมรอบแบ่งโซนและรอบแชมป์เปี้ยนส์ลีก</div>
          </div>
          <div style={{ color: "#64748B", fontSize: "0.7rem" }}>
            * ระบบแสดงแชนแนลถ่ายทอดสดหลักฐานข้อมูลประวัติฤดูกาล 2025/26
          </div>
        </div>
      )}

      {/* ── METRICS OVERVIEW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "TOTAL ACTUAL LOAD", val: `${grandTotal.toLocaleString()} Matches`, c: "#38bdf8" },
          { label: "RECORDED PEAK DAY", val: `${peakDayLoad} Feeds`, c: "#ef4444" },
          { label: "RECORD SEASON PERIOD", val: "2025/2026", c: "#a78bfa" },
          { label: "FILTER MONTH", val: ML[active], c: "#fb923c" }
        ].map((k, i) => (
          <div key={i} style={{ ...glassCard, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: 700, marginBottom: "4px" }}>{k.label}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: k.c, fontFamily: "monospace" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── TIMELINE TRACKER ── */}
      <div style={{ ...glassCard, padding: "16px", marginBottom: "20px" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "12px", color: "#94a3b8" }}>MONTHLY TIMELINE TRACKER</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px" }}>
          <div onClick={() => setActive("ALL")} style={{ background: active === "ALL" ? "rgba(56, 189, 248, 0.12)" : "rgba(30,41,59,0.2)", border: active === "ALL" ? "1px solid #38bdf8" : "1px solid transparent", padding: "10px", borderRadius: "8px", cursor: "pointer", transition: "0.2s", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: active === "ALL" ? "#38bdf8" : "#94a3b8" }}>รวมทุกเดือน</div>
            <div style={{ fontSize: "0.55rem", color: "#64748B", marginTop: "2px" }}>{grandTotal} แมตช์</div>
          </div>

          {monthStats.map(m => {
            const pct = Math.min((m.total / maxMonthLoad) * 100, 100);
            const isSel = active === m.m;
            return (
              <div key={m.m} onClick={() => setActive(m.m)} style={{ background: isSel ? "rgba(56, 189, 248, 0.08)" : "rgba(15,23,42,0.4)", border: isSel ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", cursor: "pointer", position: "relative", overflow: "hidden", transition: "0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: isSel ? "#38bdf8" : "#e2e8f0" }}>
                  <span>{m.label}</span>
                  <span style={{ fontFamily: "monospace" }}>{m.total}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.5rem", color: "#64748B", marginTop: "2px" }}>
                  <span>Peak: {m.peak}</span>
                  <span>{m.days} วัน</span>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, width: `${pct}%`, height: "3px", background: "#3b82f6" }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN FORECAST DATA TABLE ── */}
      <div style={{ ...glassCard, overflow: "hidden" }}>

        {/* LEAGUE FILTER CHIPS */}
        <div style={{ display: "flex", gap: "6px", padding: "12px 16px", background: "rgba(2,6,23,0.4)", borderBottom: "1px solid rgba(255,255,255,0.03)", flexWrap: "wrap" }}>
          <button onClick={() => setSelectedLeague("ALL")} style={{ background: selectedLeague === "ALL" ? "#1e293b" : "transparent", border: "1px solid rgba(255,255,255,0.08)", color: selectedLeague === "ALL" ? "#38bdf8" : "#94a3b8", padding: "4px 10px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer" }}>
            แสดงทุกลีก
          </button>
          {COLS.map(c => (
            <button key={c.k} onClick={() => setSelectedLeague(c.k)} style={{ background: selectedLeague === c.k ? "rgba(255,255,255,0.05)" : "transparent", border: "1px solid rgba(255,255,255,0.05)", color: selectedLeague === c.k ? c.c : "#64748B", padding: "4px 10px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>
              {c.n}
            </button>
          ))}
        </div>

        {/* TABLE HEADERS */}
        <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "10px 18px", background: "#020617", fontSize: "0.65rem", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
          <div>วันที่การแข่งขัน</div>
          {COLS.map(c => (
            <div key={c.k} style={{ textAlign: "center", color: selectedLeague === "ALL" || selectedLeague === c.k ? "#94a3b8" : "rgba(148,163,184,0.15)" }}>
              {c.k}
            </div>
          ))}
          <div style={{ textAlign: "center", color: "#38bdf8" }}>TOTAL</div>
        </div>

        {/* TABLE BODY ROWS */}
        <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
          {filteredRows.map((row, idx) => {
            const style = loadStyle(selectedLeague === "ALL" ? row.p.total : row.p[selectedLeague], row.p.hasPO, row.p.isFinal);

            return (
              <div
                key={idx}
                style={{ display: "grid", gridTemplateColumns: GRID, padding: "8px 18px", background: style.row, borderBottom: "0.5px solid rgba(255, 255, 255, 0.05)", position: "relative", cursor: "pointer" }}
                onClick={() => {
                  const dayMatches = MATCH_DETAILS[normalizeDate(row.d)] || [];
                  setSelectedMatchDay({
                    date: row.d,
                    matches: dayMatches
                  });
                }}
              >
                <div style={{ position: "absolute", left: 0, top: 2, bottom: 2, width: "3px", background: style.left }} />

                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", display: "flex", alignItems: "center" }}>
                  {row.d}
                </div>

                {COLS.map(c => {
                  const val = row.p[c.k];
                  const activeFilter = selectedLeague === "ALL" || selectedLeague === c.k;
                  return (
                    <div key={c.k} style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 700, color: val > 0 ? c.c : "#1e293b", fontFamily: "monospace", opacity: activeFilter ? 1 : 0.15, alignSelf: "center" }}>
                      {val || "0"}
                    </div>
                  );
                })}

                <div style={{ textAlign: "center", alignSelf: "center" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 900, color: style.txt, fontFamily: "monospace" }}>
                    {selectedLeague === "ALL" ? row.p.total : row.p[selectedLeague]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* TABLE FOOTER TOTALS */}
        <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "14px 18px", background: "#020617", borderTop: "1px solid rgba(255,255,255,0.05)", fontWeight: 900, fontSize: "0.8rem" }}>
          <div>TOTAL LOAD</div>
          {COLS.map(c => {
            const isDimmed = selectedLeague !== "ALL" && selectedLeague !== c.k;
            return (
              <div key={c.k} style={{ textAlign: "center", color: c.c, fontFamily: "monospace", opacity: isDimmed ? 0.15 : 1, alignSelf: "center" }}>
                {colTotals[c.k] || "0"}
              </div>
            );
          })}
          <div style={{ textAlign: "center", alignSelf: "center" }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#38bdf8", fontFamily: "monospace" }}>{colTotals.total}</div>
          </div>
        </div>

      </div>

      {/* ── METRICS LEGEND ── */}
      <div style={{ marginTop: "12px", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", fontSize: "0.68rem", color: "#4b5563" }}>
        {[["≤3", "#64748B", "โหลดเบา"], ["4–9", "#60A5FA", "โหลดปานกลาง"], ["10–19", "#FCD34D", "โหลดหนาแน่น"], ["≥20", "#F87171", "PEAK LEVEL"]].map(([r, c, l]) => (
          <span key={r} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", background: c, borderRadius: "50%" }} />
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>{r}</span>
            <span>{l}</span>
          </span>
        ))}
      </div>

      {/* ── MATCH DETAILS POPUP ── */}
      {selectedMatchDay && (
        <div
          onClick={() => setSelectedMatchDay(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center", padding: "24px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(900px, 95vw)", maxHeight: "85vh", overflowY: "auto", background: "#0f172a", border: "1px solid #334155", borderRadius: "12px", padding: "20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>
                📅 {selectedMatchDay.date} • {popupMatches.length} Matches
              </h3>
              <button onClick={() => setSelectedMatchDay(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[...popupMatches]
                .sort((a, b) => {
                  const timeCompare = a.time.localeCompare(b.time);
                  if (timeCompare !== 0) return timeCompare;
                  return getLeagueOrder(a.league) - getLeagueOrder(b.league);
                })
                .map((match, idx) => (
                  <div
                    key={idx}
                    // ✅ แก้ไขปัญหา Scope Bug ของ style.row ให้กลับมาใช้สีพื้นหลังเข้มปกติเมื่อเอาเมาส์ออก
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#1e293b"; }}
                    style={{ background: "#1e293b", padding: "12px", borderRadius: "8px", transition: "0.2s" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>⏰ {match.time}</span>
                      <span style={{ background: getLeagueColor(match.league), padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
                        {normalizeLeague(match.league)}
                      </span>
                    </div>
                    <div style={{ marginTop: "6px", fontWeight: 700 }}>
                      {match.home} vs {match.away}
                    </div>
                    <div style={{ marginTop: "4px", color: "#94a3b8", fontSize: "0.8rem" }}>
                      🏟️ {match.stadium}
                    </div>
                  </div>
                ))}

              {popupMatches.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                  ไม่มีแมตช์ของลีกที่เลือก
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}