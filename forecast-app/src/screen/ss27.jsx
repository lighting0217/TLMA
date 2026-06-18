import { useState, useMemo } from "react";
// เปลี่ยน Path ถอย 1 ชั้น (..) เพื่อเข้าไปที่โฟลเดอร์ Data
import { RAW27 } from "../Data/rawdata";
import { MATCH_DETAILS } from "../Data/matchDetails";
import { normalizeLeague, getLeagueKey } from "../Data/utility";

// ── CONSTANTS & UTILITIES (เฉพาะของปี 2026/27) ──
const COLS = [
  { k: "TL1", n: "Thai League 1", colorKey: "leagueTL1" },
  { k: "TL2", n: "Thai League 2", colorKey: "leagueTL2" },
  { k: "TL3", n: "Thai League 3", colorKey: "leagueTL3" },
  { k: "U21", n: "PEA U21", colorKey: "leagueU21" },
  { k: "WOMEN", n: "Women / Others", colorKey: "leagueWomen" },
  { k: "CHANG", n: "FA Cup", colorKey: "leagueFACup" },
  { k: "MUANG", n: "League Cup", colorKey: "leagueLeagueCup" },
];

const KEYS = COLS.map(c => c.k);
const MODE_REG = { TL1: 4, TL2: 4, TL3: 16, U21: 2, WOMEN: 0, CHANG: 8, MUANG: 6 };
const MODE_PO = { TL1: 4, TL2: 1, TL3: 3, U21: 2, WOMEN: 0, CHANG: 8, MUANG: 4 };

const LEAGUE_ORDER = { TL1: 1, TL2: 2, TL3: 3, U21: 4, WOMEN: 5, CHANG: 6, MUANG: 7 };

const CUP_FINALS = {
  "5/6/2027": { MUANG: 1 },
  "19/6/2027": { CHANG: 1 },
};

const getLeagueOrder = (league) => LEAGUE_ORDER[getLeagueKey(league)] ?? 999;

const DATA27 = RAW27.map(([d, t1, t2, t3, p, c, m]) => ({
  d, TL1: t1, TL2: t2, TL3: t3, U21: p, WOMEN: 0, CHANG: c, MUANG: m
}));

function parseDateStr(s) {
  const [dd, mm, yyyy] = s.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function getMonthKey(d) {
  const [, mm, yyyy] = d.split('/');
  return `${yyyy}/${mm.padStart(2, '0')}`;
}

const D_LEG2 = parseDateStr("6/2/2027");
const D_AC_END = parseDateStr("5/2/2027");
const D_AC_ST = parseDateStr("28/12/2026");
const D_RAM_S = parseDateStr("8/2/2027");
const D_RAM_E = parseDateStr("9/3/2027");

function isPlayoff(dateStr, league) {
  const d = parseDateStr(dateStr);
  if (league === "TL3" && d >= parseDateStr("10/4/2027")) return true;
  if (league === "TL2" && d >= parseDateStr("1/5/2027")) return true;
  return false;
}

function periodOf(dateStr) {
  const d = parseDateStr(dateStr);
  if (d >= D_LEG2) return "leg2";
  if (d >= D_AC_ST && d <= D_AC_END) return "asiancup";
  return "leg1";
}

function predict27(row) {
  const solo1 = row.TL1 && !row.TL2 && !row.TL3;
  const solo2 = row.TL2 && !row.TL1 && !row.TL3;
  const finals = CUP_FINALS[row.d] || {};
  const v = {}; let hasPO = false;

  KEYS.forEach(k => {
    if (!row[k]) { v[k] = 0; return; }
    if (finals[k] !== undefined) { v[k] = finals[k]; return; }
    if ((k === "TL1" && solo1) || (k === "TL2" && solo2)) { v[k] = 1; return; }
    const po = isPlayoff(row.d, k);
    if (po) hasPO = true;
    v[k] = po ? MODE_PO[k] : MODE_REG[k];
  });

  const d = parseDateStr(row.d);
  v.total = KEYS.reduce((s, k) => s + v[k], 0);
  v.hasPO = hasPO;
  v.period = periodOf(row.d);
  v.ramadan = d >= D_RAM_S && d <= D_RAM_E;
  v.isFinal = !!finals && Object.keys(finals).length > 0;
  return v;
}

const PDATA27 = DATA27.map(r => ({ ...r, p: predict27(r) }));

const ML = {
  "ALL": "รวมทุกเดือน",
  "2026/09": "ก.ย. 69", "2026/10": "ต.ค. 69", "2026/11": "พ.ย. 69", "2026/12": "ธ.ค. 69",
  "2027/01": "ม.ค. 70", "2027/02": "ก.พ. 70", "2027/03": "มี.ค. 70", "2027/04": "เม.ย. 70", "2027/05": "พ.ค. 70", "2027/06": "มิ.ย. 70",
};

// 🎨 [REFUGEE FIX] ปรับฟังก์ชันคำนวณสีแถวปฏิทินให้ดึงค่าแบบ Dynamic ผ่านธีมปัจจุบันต้นทาง
function loadStyle(theme, t, hasPO, isFinal) {
  if (isFinal) return { txt: theme?.final || "#FBBF24", row: (theme?.final || "#FBBF24") + "15", left: theme?.final || "#F59E0B" };
  if (t === 0) return { txt: theme?.inputPlaceholder || "#1E293B", row: "transparent", left: "transparent" };
  if (hasPO) return { txt: theme?.playoff || "#a78bfa", row: (theme?.playoff || "#a78bfa") + "15", left: theme?.playoff || "#7C3AED" };
  if (t <= 3) return { txt: theme?.loadLow || "#64748B", row: "transparent", left: theme?.loadLow || "#334155" };
  if (t <= 9) return { txt: theme?.loadMedium || "#60A5FA", row: (theme?.loadMedium || "#60A5FA") + "12", left: theme?.loadMedium || "#3B82F6" };
  if (t <= 19) return { txt: theme?.loadHigh || "#FCD34D", row: (theme?.loadHigh || "#FCD34D") + "12", left: theme?.loadHigh || "#D97706" };
  return { txt: theme?.loadPeak || "#F87171", row: (theme?.loadPeak || "#F87171") + "15", left: theme?.loadPeak || "#EF4444" };
}

// ── COMPONENT ──
export default function Ss27({ theme }) {
  const [active, setActive] = useState("ALL");
  const [showInfo, setShowInfo] = useState(true);
  const [showTWL, setShowTWL] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState("ALL");
  const [selectedMatchDay, setSelectedMatchDay] = useState(null);
  
  const GRID = "100px repeat(7,1fr) 70px";
  
  // ผูกกล่องกระจกฝ้าเข้ากับ Object ชุดธีมหลัก
  const glassCard = { 
    background: theme?.cardBg || "rgba(15,23,42,0.75)", 
    backdropFilter: "blur(12px)", 
    border: `1px solid ${theme?.cardBorder || "rgba(255,255,255,0.05)"}`, 
    borderRadius: "12px" 
  };

  const leagueColor = {
    "THAI LEAGUE 1": theme?.leagueTL1 || "#f31717",
    "THAI LEAGUE 2": theme?.leagueTL2 || "#574de7",
    "THAI LEAGUE 3": theme?.leagueTL3 || "#4ac710",
    "PEA U21": theme?.leagueU21 || "#dad3f3",
    "WOMEN": theme?.leagueWomen || "#ff6bdf",
    "FA CUP": theme?.leagueFACup || "#c8ff00",
    "LEAGUE CUP": theme?.leagueLeagueCup || "#d60fc6",
  };

  const getLeagueColor = (league) => {
    const normalized = normalizeLeague(league);
    if (normalized.startsWith("THAI LEAGUE 3")) return theme?.leagueTL3 || "#4ac710";
    if (normalized === "WOMEN") return theme?.leagueWomen || "#ff6bdf";
    return leagueColor[normalized] || theme?.btnTxt || "#64748B";
  };

  const months = useMemo(() => {
    const s = new Set(DATA27.map(r => getMonthKey(r.d)));
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
    const rows = PDATA27.filter(r => getMonthKey(r.d) === m);
    const periods = new Set(rows.map(r => r.p.period));
    const isTWLMonth = showTWL && ["2027/05", "2027/06"].includes(m);
    const twlExtra = isTWLMonth ? rows.length * 4 : 0;

    const calcTotal = rows.reduce((s, r) => {
      if (selectedLeague === "ALL") return s + r.p.total;
      return s + r.p[selectedLeague];
    }, 0) + (selectedLeague === "ALL" ? twlExtra : 0);

    const calcPeak = Math.max(...rows.map(r => {
      if (selectedLeague === "ALL") return r.p.total;
      return r.p[selectedLeague];
    })) + (isTWLMonth && selectedLeague === "ALL" ? 4 : 0);

    return {
      m, label: ML[m] || m,
      total: calcTotal,
      peak: calcPeak,
      days: rows.length,
      hasPO: rows.some(r => r.p.hasPO && (selectedLeague === "ALL" || r.p[selectedLeague] > 0)),
      isAC: periods.has("asiancup"),
      isL2: periods.has("leg2") && !periods.has("leg1") && !periods.has("asiancup"),
    };
  }), [months, showTWL, selectedLeague]);

  const currentMonthRows = useMemo(() => {
    if (active === "ALL") return PDATA27;
    return PDATA27.filter(r => getMonthKey(r.d) === active);
  }, [active]);

  const filteredRows = useMemo(() => {
    if (selectedLeague === "ALL") return currentMonthRows;
    return currentMonthRows.filter(r => r.p[selectedLeague] > 0);
  }, [currentMonthRows, selectedLeague]);

  const colTotals = useMemo(() => {
    const t = Object.fromEntries(KEYS.map(k => [k, filteredRows.reduce((s, r) => s + r.p[k], 0)]));
    const baseTotal = filteredRows.reduce((s, r) => s + r.p.total, 0);

    let twlExtraDays = 0;
    if (showTWL) {
      if (active === "ALL") {
        twlExtraDays = PDATA27.filter(r => ["2027/05", "2027/06"].includes(getMonthKey(r.d))).length;
      } else if (["2027/05", "2027/06"].includes(active)) {
        twlExtraDays = filteredRows.length;
      }
    }

    t.total = selectedLeague === "ALL" ? baseTotal + (twlExtraDays * 4) : filteredRows.reduce((s, r) => s + r.p[selectedLeague], 0);
    return t;
  }, [filteredRows, showTWL, active, selectedLeague]);

  const grandTotal = monthStats.reduce((s, m) => s + m.total, 0);
  const maxMonthLoad = Math.max(...monthStats.map(m => m.total), 1);
  const peakDayLoad = useMemo(() => {
    if (filteredRows.length === 0) return 1;
    return Math.max(...filteredRows.map(r => {
      const isTWLMonth = showTWL && ["2027/05", "2027/06"].includes(getMonthKey(r.d));
      return (selectedLeague === "ALL" ? r.p.total : r.p[selectedLeague]) + (isTWLMonth && selectedLeague === "ALL" ? 4 : 0);
    }), 1);
  }, [filteredRows, selectedLeague, showTWL]);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: theme?.value || "#E2E8F0" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: theme?.accent || "#38bdf8", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
            AWN/AIS Play · Thai League · IBC
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em", background: `linear-gradient(to right, ${theme?.leagueTL1 || '#f31717'}, ${theme?.leagueTL2 || '#574de7'}, ${theme?.leagueTL3 || '#4ac710'})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            📅 Thai League Calendar 2026/2027
          </h1>
        </div>

        {/* ปุ่มควบคุม */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button onClick={() => setShowInfo(s => !s)} style={{ ...glassCard, padding: "6px 12px", background: theme?.btnBg || "rgba(30,41,59,0.5)", border: `1px solid ${theme?.btnBorder || 'transparent'}`, color: theme?.btnTxt || "#94a3b8", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
            {showInfo ? "▲ ซ่อนผังข้อมูล" : "▼ แสดงผังข้อมูล"}
          </button>

          <label style={{ ...glassCard, display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: showTWL ? theme?.sidebarActiveBg || "rgba(245,158,11,0.15)" : theme?.inputBg || "rgba(15,23,42,0.6)", color: showTWL ? theme?.warning || "#FCD34D" : theme?.btnTxt || "#64748B", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, transition: "0.2s" }}>
            <input type="checkbox" checked={showTWL} onChange={e => setShowTWL(e.target.checked)} style={{ accentColor: theme?.warning || "#FCD34D" }} />
            +TWL (พ.ค.–มิ.ย.)
          </label>
        </div>
      </div>

      {/* ── SEASON STRUCTURAL INFO ── */}
      {showInfo && (
        <div style={{ ...glassCard, padding: "16px", marginBottom: "20px", fontSize: "0.75rem", background: theme?.barBg || "rgba(10,15,30,0.8)", borderColor: theme?.barBorder || "rgba(56,189,248,0.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "12px", marginBottom: "12px" }}>
            <div><span style={{ color: theme?.leagueTL1 || "#f31717" }}>■</span> Thai League 1: 4 ก.ย. 69 → 30 พ.ค. 70</div>
            <div><span style={{ color: theme?.leagueTL2 || "#574de7" }}>■</span> Thai League 2: 4 ก.ย. 69 → 23 พ.ค. 70</div>
            <div><span style={{ color: theme?.leagueTL3 || "#4ac710" }}>■</span> Thai League 3: 19 ก.ย. 69 → 13 มิ.ย. 70</div>
          </div>
          <div style={{ color: theme?.emptyText || "#64748B", fontSize: "0.7rem" }}>
            * ระบบทำนายและประเมินแชนแนลถ่ายทอดสดของ Thai League ฤดูกาล 2026/27
          </div>
        </div>
      )}

      {/* ── METRICS OVERVIEW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "TOTAL ESTIMATED LOAD", val: `${grandTotal.toLocaleString()} Matches`, c: theme?.accent || "#38bdf8" },
          { label: "PEAK DAY CAPACITY", val: `${peakDayLoad} Feeds`, c: theme?.danger || "#ef4444" },
          { label: "ACTIVE SEASON PERIOD", val: "2026/2027", c: theme?.playoff || "#a78bfa" },
          { label: "FILTER MONTH", val: ML[active], c: theme?.warning || "#fb923c" }
        ].map((k, i) => (
          <div key={i} style={{ ...glassCard, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.65rem", color: theme?.label || "#64748B", fontWeight: 700, marginBottom: "4px" }}>{k.label}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: k.c, fontFamily: "monospace" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── TIMELINE TRACKER ── */}
      <div style={{ ...glassCard, padding: "16px", marginBottom: "20px" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "12px", color: theme?.stadium || "#94a3b8" }}>MONTHLY TIMELINE TRACKER</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px" }}>
          <div onClick={() => setActive("ALL")} style={{ background: active === "ALL" ? theme?.themeActiveBg || "rgba(56, 189, 248, 0.12)" : theme?.btnBg || "rgba(30,41,59,0.2)", border: active === "ALL" ? `1px solid ${theme?.accent || "#38bdf8"}` : `1px solid ${theme?.btnBorder || "transparent"}`, padding: "10px", borderRadius: "8px", cursor: "pointer", transition: "0.2s", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: active === "ALL" ? theme?.accent || "#38bdf8" : theme?.btnTxt || "#94a3b8" }}>รวมทุกเดือน</div>
            <div style={{ fontSize: "0.55rem", color: theme?.emptyText || "#64748B", marginTop: "2px" }}>{grandTotal} แมตช์</div>
          </div>

          {monthStats.map(m => {
            const pct = Math.min((m.total / maxMonthLoad) * 100, 100);
            const isSel = active === m.m;
            return (
              <div key={m.m} onClick={() => setActive(m.m)} style={{ background: isSel ? theme?.themeActiveBg || "rgba(56, 189, 248, 0.08)" : theme?.cardBg || "rgba(15,23,42,0.4)", border: isSel ? `1px solid ${theme?.accent || "#38bdf8"}` : `1px solid ${theme?.cardBorder || "rgba(255,255,255,0.03)"}`, padding: "10px", borderRadius: "8px", cursor: "pointer", position: "relative", overflow: "hidden", transition: "0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: m.isAC ? theme?.timelineBarAsianCup || "#f43f5e" : isSel ? theme?.accent || "#38bdf8" : theme?.title || "#e2e8f0" }}>
                  <span>{m.label}</span>
                  <span style={{ fontFamily: "monospace" }}>{m.total}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.5rem", color: theme?.emptyText || "#64748B", marginTop: "2px" }}>
                  <span>Peak: {m.peak}</span>
                  <span>{m.days} วัน</span>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, width: `${pct}%`, height: "3px", background: m.isAC ? theme?.timelineBarAsianCup || "#f43f5e" : m.hasPO ? theme?.timelineBarPlayoff || "#a78bfa" : theme?.timelineBar || "#3b82f6" }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN FORECAST DATA TABLE ── */}
      <div style={{ ...glassCard, overflow: "hidden" }}>

        {/* LEAGUE FILTER CHIPS */}
        <div style={{ display: "flex", gap: "6px", padding: "12px 16px", background: theme?.headerBg || "rgba(2,6,23,0.4)", borderBottom: `1px solid ${theme?.headerBorder || "rgba(255,255,255,0.03)"}`, flexWrap: "wrap" }}>
          <button onClick={() => setSelectedLeague("ALL")} style={{ background: selectedLeague === "ALL" ? theme?.sidebarActiveBg || "#1e293b" : "transparent", border: `1px solid ${theme?.btnBorder || "rgba(255,255,255,0.08)"}`, color: selectedLeague === "ALL" ? theme?.accent || "#38bdf8" : theme?.btnTxt || "#94a3b8", padding: "4px 10px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer" }}>
            แสดงทุกลีก
          </button>
          {COLS.map(c => (
            <button key={c.k} onClick={() => setSelectedLeague(c.k)} style={{ background: selectedLeague === c.k ? theme?.sidebarButtonBg || "rgba(255,255,255,0.05)" : "transparent", border: `1px solid ${theme?.btnBorder || "rgba(255,255,255,0.05)"}`, color: selectedLeague === c.k ? theme[c.colorKey] : theme?.label || "#64748B", padding: "4px 10px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>
              {c.n}
            </button>
          ))}
        </div>

        {/* TABLE HEADERS */}
        <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "10px 18px", background: theme?.tableHeaderBg || "#020617", borderBottom: `1px solid ${theme?.rowBorder || "rgba(255,255,255,0.05)"}`, fontSize: "0.65rem", fontWeight: 800, color: theme?.label || "#64748B", letterSpacing: "0.05em" }}>
          <div>วันที่การแข่งขัน</div>
          {COLS.map(c => (
            <div key={c.k} style={{ textAlign: "center", color: selectedLeague === "ALL" || selectedLeague === c.k ? theme?.stadium || "#94a3b8" : "rgba(148,163,184,0.15)" }}>
              {c.k}
            </div>
          ))}
          <div style={{ textAlign: "center", color: theme?.accent || "#38bdf8" }}>TOTAL</div>
        </div>

        {/* TABLE BODY ROWS */}
        <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
          {filteredRows.map((row, idx) => {
            const style = loadStyle(theme, selectedLeague === "ALL" ? row.p.total : row.p[selectedLeague], row.p.hasPO, row.p.isFinal);

            return (
              <div
                key={idx}
                style={{ display: "grid", gridTemplateColumns: GRID, padding: "8px 18px", background: style.row, borderBottom: `0.5px solid ${theme?.rowBorder || "rgba(255, 255, 255, 0.05)"}`, position: "relative", cursor: "pointer" }}
                onClick={() => {
                  const dayMatches = MATCH_DETAILS[normalizeDate(row.d)] || [];
                  setSelectedMatchDay({
                    date: row.d,
                    matches: dayMatches
                  });
                }}
              >
                <div style={{ position: "absolute", left: 0, top: 2, bottom: 2, width: "3px", background: style.left }} />

                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: row.p.ramadan ? theme?.ramadan || "#34d399" : theme?.stadium || "#94a3b8", display: "flex", alignItems: "center" }}>
                  {row.d}
                </div>

                {COLS.map(c => {
                  const val = row.p[c.k];
                  const activeFilter = selectedLeague === "ALL" || selectedLeague === c.k;
                  return (
                    <div key={c.k} style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 700, color: val > 0 ? theme[c.colorKey] : theme?.loginInputBg || "#1e293b", fontFamily: "monospace", opacity: activeFilter ? 1 : 0.15, alignSelf: "center" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "14px 18px", background: theme?.tableFooterBg || "#020617", borderTop: `1px solid ${theme?.rowBorder || "rgba(255,255,255,0.05)"}`, fontWeight: 900, fontSize: "0.8rem", color: theme?.title || "#fff" }}>
          <div>TOTAL LOAD</div>
          {COLS.map(c => {
            const isDimmed = selectedLeague !== "ALL" && selectedLeague !== c.k;
            return (
              <div key={c.k} style={{ textAlign: "center", color: theme[c.colorKey], fontFamily: "monospace", opacity: isDimmed ? 0.15 : 1, alignSelf: "center" }}>
                {colTotals[c.k] || "0"}
              </div>
            );
          })}
          <div style={{ textAlign: "center", alignSelf: "center" }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: theme?.accent || "#38bdf8", fontFamily: "monospace" }}>{colTotals.total}</div>
          </div>
        </div>

      </div>

      {/* ── METRICS LEGEND ── */}
      <div style={{ marginTop: "12px", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", fontSize: "0.68rem", color: theme?.emptyText || "#4b5563" }}>
        {[["≤3", theme?.loadLow || "#64748B", "โหลดเบา"], ["4–9", theme?.loadMedium || "#60A5FA", "โหลดปานกลาง"], ["10–19", theme?.loadHigh || "#FCD34D", "โหลดหนาแน่น"], ["≥20", theme?.loadPeak || "#F87171", "PEAK LEVEL"]].map(([r, c, l]) => (
          <span key={r} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", background: c, borderRadius: "50%" }} />
            <span style={{ color: theme?.stadium || "#94a3b8", fontWeight: 600 }}>{r}</span>
            <span>{l}</span>
          </span>
        ))}
      </div>

      {/* ── MATCH DETAILS POPUP (MODAL) ── */}
      {selectedMatchDay && (
        <div
          onClick={() => setSelectedMatchDay(null)}
          style={{ position: "fixed", inset: 0, background: theme?.overlayBg || "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center", padding: "24px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(900px, 95vw)", maxHeight: "85vh", overflowY: "auto", background: theme?.modalBg || "#0f172a", border: `1px solid ${theme?.modalBorder || "#334155"}`, borderRadius: "12px", padding: "20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", color: theme?.title }}>
              <h3 style={{ margin: 0 }}>
                📅 {selectedMatchDay.date} • {popupMatches.length} Matches
              </h3>
              <button onClick={() => setSelectedMatchDay(null)} style={{ background: "transparent", border: "none", color: theme?.btnTxt || "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
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
                    style={{ background: theme?.cardBg || "#1e293b", border: `1px solid ${theme?.cardBorder || 'transparent'}`, padding: "12px", borderRadius: "8px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", color: theme?.value }}>
                      <span>⏰ {match.time}</span>
                      <span style={{ background: getLeagueColor(match.league), padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
                        {normalizeLeague(match.league)}
                      </span>
                    </div>
                    <div style={{ marginTop: "6px", fontWeight: 700, color: theme?.title }}>
                      {match.home} vs {match.away}
                    </div>
                    <div style={{ marginTop: "4px", color: theme?.stadium || "#94a3b8", fontSize: "0.8rem" }}>
                      🏟️ {match.stadium}
                    </div>
                  </div>
                ))}

              {popupMatches.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px", color: theme?.emptyText || "#64748b" }}>
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