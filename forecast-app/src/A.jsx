import { useState, useMemo } from "react";
import { RAW26, RAW27 } from "./Data/rawdata";

const COLS = [
  { k: "TL1", n: "Thai League 1", c: "#f31717" },
  { k: "TL2", n: "Thai League 2", c: "#574de7" },
  { k: "TL3", n: "Thai League 3", c: "#4ac710" },
  { k: "PEA", n: "PEA U21",       c: "#dad3f3" },
  { k: "CHANG", n: "FA Cup",      c: "#c8ff00" },
  { k: "MUANG", n: "League Cup",  c: "#d60fc6" },
];
const KEYS = COLS.map(c => c.k);

// Historical mode estimates (สำหรับ 2026/27)
const MODE_REG = { TL1: 4, TL2: 4, TL3: 16, PEA: 2, CHANG: 8, MUANG: 6 };
const MODE_PO  = { TL1: 4, TL2: 1, TL3: 3,  PEA: 2, CHANG: 8, MUANG: 4 };

// Cup finals (สำหรับ 2026/27)
const CUP_FINALS = {
  "5/6/2027":  { MUANG: 1 },
  "19/6/2027": { CHANG: 1 },
};

// --- จัดการข้อมูล RAW27 ---
const DATA27 = RAW27.map(([d, t1, t2, t3, p, c, m]) => ({
  d, TL1: t1, TL2: t2, TL3: t3, PEA: p, CHANG: c, MUANG: m
}));

function parseDateStr(s) {
  const [dd, mm, yyyy] = s.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function getMonthKey(d) {
  const [, mm, yyyy] = d.split('/');
  return `${yyyy}/${mm.padStart(2, '0')}`;
}

const D_LEG2   = parseDateStr("6/2/2027");
const D_AC_END = parseDateStr("5/2/2027");
const D_AC_ST  = parseDateStr("28/12/2026");
const D_RAM_S  = parseDateStr("8/2/2027");
const D_RAM_E  = parseDateStr("9/3/2027");

function isPlayoff(dateStr, league) {
  const d = parseDateStr(dateStr);
  if (league === "TL3" && d >= parseDateStr("10/4/2027")) return true;
  if (league === "TL2" && d >= parseDateStr("1/5/2027"))  return true;
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
  v.total   = KEYS.reduce((s, k) => s + v[k], 0);
  v.hasPO   = hasPO;
  v.period  = periodOf(row.d);
  v.ramadan = d >= D_RAM_S && d <= D_RAM_E;
  v.isFinal = !!finals && Object.keys(finals).length > 0;
  return v;
}

const PDATA27 = DATA27.map(r => ({ ...r, p: predict27(r) }));

// --- จัดการข้อมูล RAW26 ---
// โครงสร้างคอลัมน์ RAW26: [Date, TL1, TL2, TL3, PEA, WOMEN, CHANG, MUANG]
const DATA26 = RAW26.map(([d, t1, t2, t3, pea, , chang, muang]) => ({
  d, TL1: t1 || 0, TL2: t2 || 0, TL3: t3 || 0, PEA: pea || 0, CHANG: chang || 0, MUANG: muang || 0
}));

const PDATA26 = DATA26.map(r => {
  const total = KEYS.reduce((s, k) => s + r[k], 0);
  return {
    ...r,
    p: {
      TL1: r.TL1, TL2: r.TL2, TL3: r.TL3, PEA: r.PEA, CHANG: r.CHANG, MUANG: r.MUANG,
      total,
      hasPO: false,
      period: "regular",
      ramadan: false,
      isFinal: false
    }
  };
});

// รายชื่อเดือนรองรับทั้ง 2 ฤดูกาล
const ML = {
  "ALL": "รวมทุกเดือน",
  // ฤดูกาล 2025/26
  "2025/08": "ส.ค. 68", "2025/09": "ก.ย. 68", "2025/10": "ต.ค. 68", "2025/11": "พ.ย. 68", "2025/12": "ธ.ค. 68",
  "2026/01": "ม.ค. 69", "2026/02": "ก.พ. 69", "2026/03": "มี.ค. 69", "2026/04": "เม.ย. 69", "2026/05": "พ.ค. 69", "2026/06": "มิ.ย. 69",
  // ฤดูกาล 2026/27
  "2026/09": "ก.ย. 69", "2026/10": "ต.ค. 69", "2026/11": "พ.ย. 69", "2026/12": "ธ.ค. 69",
  "2027/01": "ม.ค. 70", "2027/02": "ก.พ. 70", "2027/03": "มี.ค. 70",
  "2027/04": "เม.ย. 70", "2027/05": "พ.ค. 70", "2027/06": "มิ.ย. 70"
};

function loadStyle(t, hasPO, isFinal) {
  if (isFinal) return { txt: "#FBBF24", row: "rgba(245,158,11,0.06)", left: "#F59E0B" };
  if (t === 0)   return { txt: "#1E293B", row: "transparent",  left: "transparent" };
  if (hasPO)   return { txt: "#C084FC", row: "rgba(124,58,237,0.06)", left: "#7C3AED" };
  if (t <= 3)    return { txt: "#64748B", row: "transparent",  left: "#334155" };
  if (t <= 9)    return { txt: "#60A5FA", row: "rgba(29,78,216,0.06)",  left: "#3B82F6" };
  if (t <= 19)   return { txt: "#FCD34D", row: "rgba(217,119,6,0.06)",  left: "#D97706" };
  return         { txt: "#F87171", row: "rgba(185,28,28,0.06)",  left: "#EF4444" };
}

const GRID = "100px repeat(6,1fr) 70px";
const glassCard = { background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" };

export default function ForecastV3() {
  const [season, setSeason] = useState("2026/27");
  const [active, setActive] = useState("ALL");
  const [showInfo, setShowInfo] = useState(true);
  const [showTWL, setShowTWL] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState("ALL");

  // ดึงชุดข้อมูลตามฤดูกาลที่เลือก
  const currentPDATA = useMemo(() => season === "2026/27" ? PDATA27 : PDATA26, [season]);
  const currentDATA  = useMemo(() => season === "2026/27" ? DATA27 : DATA26, [season]);

  const months = useMemo(() => {
    const s = new Set(currentDATA.map(r => getMonthKey(r.d)));
    return [...s].sort();
  }, [currentDATA]);

  const handleSeasonChange = (nextSeason) => {
    setSeason(nextSeason);
    setActive("ALL"); // รีเซ็ตตัวกรองเดือนเมื่อสลับฤดูกาล
  };

  const monthStats = useMemo(() => months.map(m => {
    const rows = currentPDATA.filter(r => getMonthKey(r.d) === m);
    const periods = new Set(rows.map(r => r.p.period));
    const isTWLMonth = season === "2026/27" && showTWL && ["2027/05", "2027/06"].includes(m);
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
      peak:  calcPeak,
      days:  rows.length,
      hasPO: rows.some(r => r.p.hasPO && (selectedLeague === "ALL" || r.p[selectedLeague] > 0)),
      isAC:  periods.has("asiancup"),
      isL2:  periods.has("leg2") && !periods.has("leg1") && !periods.has("asiancup"),
    };
  }), [months, showTWL, selectedLeague, currentPDATA, season]);

  const currentMonthRows = useMemo(() => {
    if (active === "ALL") return currentPDATA;
    return currentPDATA.filter(r => getMonthKey(r.d) === active);
  }, [active, currentPDATA]);

  const filteredRows = useMemo(() => {
    if (selectedLeague === "ALL") return currentMonthRows;
    return currentMonthRows.filter(r => r.p[selectedLeague] > 0);
  }, [currentMonthRows, selectedLeague]);

  const colTotals = useMemo(() => {
    const t = Object.fromEntries(KEYS.map(k => [k, filteredRows.reduce((s, r) => s + r.p[k], 0)]));
    const baseTotal = filteredRows.reduce((s, r) => s + r.p.total, 0);
    
    let twlExtraDays = 0;
    if (showTWL && season === "2026/27") {
      if (active === "ALL") {
        twlExtraDays = currentPDATA.filter(r => ["2027/05", "2027/06"].includes(getMonthKey(r.d))).length;
      } else if (["2027/05", "2027/06"].includes(active)) {
        twlExtraDays = filteredRows.length;
      }
    }
    
    t.total = selectedLeague === "ALL" ? baseTotal + (twlExtraDays * 4) : filteredRows.reduce((s, r) => s + r.p[selectedLeague], 0);
    return t;
  }, [filteredRows, showTWL, active, selectedLeague, currentPDATA, season]);

  const grandTotal = monthStats.reduce((s, m) => s + m.total, 0);
  const maxMonthLoad = Math.max(...monthStats.map(m => m.total), 1);
  const peakDayLoad = useMemo(() => {
    if (filteredRows.length === 0) return 1;
    return Math.max(...filteredRows.map(r => {
      const isTWLMonth = season === "2026/27" && showTWL && ["2027/05", "2027/06"].includes(getMonthKey(r.d));
      return (selectedLeague === "ALL" ? r.p.total : r.p[selectedLeague]) + (isTWLMonth && selectedLeague === "ALL" ? 4 : 0);
    }), 1);
  }, [filteredRows, selectedLeague, showTWL, season]);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#030712", minHeight: "100vh", padding: "24px", color: "#E2E8F0" }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#38bdf8", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
            AWN/AIS Play · Production Control Center
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#fff,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            📡 Match Operations Forecast
          </h1>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* ปุ่มเลือกฤดูกาล */}
          <div style={{ ...glassCard, display: "flex", padding: "2px", background: "rgba(15,23,42,0.8)" }}>
            {["2025/26", "2026/27"].map(s => (
              <button
                key={s}
                onClick={() => handleSeasonChange(s)}
                style={{
                  background: season === s ? "#3b82f6" : "transparent",
                  color: season === s ? "#fff" : "#94a3b8",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "0.2s"
                }}
              >
                Season {s}
              </button>
            ))}
          </div>

          <button onClick={() => setShowInfo(s => !s)} style={{ ...glassCard, padding: "6px 12px", background: "rgba(30,41,59,0.5)", color: "#94a3b8", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
            {showInfo ? "▲ ซ่อนผังข้อมูล" : "▼ แสดงผังข้อมูล"}
          </button>
          
          {season === "2026/27" && (
            <label style={{ ...glassCard, display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: showTWL ? "rgba(245,158,11,0.15)" : "rgba(15,23,42,0.6)", color: showTWL ? "#FCD34D" : "#64748B", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, transition: "0.2s" }}>
              <input type="checkbox" checked={showTWL} onChange={e => setShowTWL(e.target.checked)} style={{ accentColor: "#FCD34D" }} />
              +TWL (พ.ค.–มิ.ย.)
            </label>
          )}
        </div>
      </div>

      {/* ── SEASON STRUCTURAL INFO ── */}
      {showInfo && (
        <div style={{ ...glassCard, padding: "16px", marginBottom: "20px", fontSize: "0.75rem", background: "rgba(10,15,30,0.8)", borderColor: "rgba(56,189,248,0.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "12px", marginBottom: "12px" }}>
            {season === "2026/27" ? (
              <>
                <div><span style={{ color: "#f31717" }}>■</span> Thai League 1: 4 ก.ย. 69 → 30 พ.ค. 70</div>
                <div><span style={{ color: "#574de7" }}>■</span> Thai League 2: 4 ก.ย. 69 → 23 พ.ค. 70</div>
                <div><span style={{ color: "#4ac710" }}>■</span> Thai League 3: 19 ก.ย. 69 → 13 มิ.ย. 70</div>
              </>
            ) : (
              <>
                <div><span style={{ color: "#f31717" }}>■</span> Thai League 1 (2025/26): สถิติจำนวนแมตช์จริงรายวัน</div>
                <div><span style={{ color: "#574de7" }}>■</span> Thai League 2 (2025/26): สถิติจำนวนแมตช์จริงรายวัน</div>
                <div><span style={{ color: "#4ac710" }}>■</span> Thai League 3 (2025/26): รวมรอบแบ่งโซนและรอบแชมป์เปี้ยนส์ลีก</div>
              </>
            )}
          </div>
          <div style={{ color: "#64748B", fontSize: "0.7rem" }}>
            * ระบบทำการจัดสรรแชนแนลถ่ายทอดสดอัตโนมัติตามความหนาแน่นและเงื่อนไขของแต่ละสัปดาห์
          </div>
        </div>
      )}

      {/* ── OPERATIONAL METRICS OVERVIEW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "TOTAL ESTIMATED LOAD", val: `${grandTotal.toLocaleString()} Matches`, c: "#38bdf8" },
          { label: "PEAK DAY CAPACITY", val: `${peakDayLoad} Feeds`, c: "#ef4444" },
          { label: "ACTIVE SEASON PERIOD", val: season, c: "#a78bfa" },
          { label: "FILTER MONTH", val: ML[active], c: "#fb923c" }
        ].map((k, i) => (
          <div key={i} style={{ ...glassCard, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: 700, marginBottom: "4px" }}>{k.label}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: k.c, fontFamily: "monospace" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── MONTH LOAD DISTRIBUTION & NAVIGATION ── */}
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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: m.isAC ? "#f43f5e" : isSel ? "#38bdf8" : "#e2e8f0" }}>
                  <span>{m.label}</span>
                  <span style={{ fontFamily: "monospace" }}>{m.total}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.5rem", color: "#64748B", marginTop: "2px" }}>
                  <span>Peak: {m.peak}</span>
                  <span>{m.days} วัน</span>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, width: `${pct}%`, height: "3px", background: m.isAC ? "#f43f5e" : m.hasPO ? "#a78bfa" : "#3b82f6" }} />
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
            const isDimmed = selectedLeague !== "ALL";

            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: GRID, padding: "8px 18px", background: style.row, borderBottom: "1px solid rgba(255,255,255,0.02)", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 2, bottom: 2, width: "3px", background: style.left }} />
                
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: row.p.ramadan ? "#34d399" : "#94a3b8", display: "flex", alignItems: "center" }}>
                  {row.d} {row.p.ramadan && <span style={{ fontSize: "0.55rem", color: "#059669", marginLeft: "4px" }}>☪</span>}
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

    </div>
  );
}