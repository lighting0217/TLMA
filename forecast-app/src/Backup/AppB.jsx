import { useState, useMemo } from "react";

const COLS = [
  { k:"TL1", n:"Thai League 1",  c:"#f31717" },
  { k:"TL2", n:"Thai League 2",  c:"#574de7" },
  { k:"TL3", n:"Thai League 3",  c:"#4ac710" },
  { k:"PEA", n:"PEA U21",        c:"#dad3f3" },
  { k:"CHANG", n:"FA Cup",       c:"#c8ff00" },
  { k:"MUANG", n:"League Cup",   c:"#d60fc6" },
];
const KEYS = COLS.map(c => c.k);

// Historical mode estimates
const MODE_REG = { TL1:4, TL2:4, TL3:16, PEA:2, CHANG:8, MUANG:6 };
// Play-off modes (updated from 2025/26 actual data)
const MODE_PO  = { TL1:4, TL2:1, TL3:3,  PEA:2, CHANG:8, MUANG:4 };

// Cup finals → always 1 match
const CUP_FINALS = {
  "5/6/2027":  { MUANG:1 },
  "19/6/2027": { CHANG:1 },
};

// [date, TL1, TL2, TL3, PEA, CHANG, MUANG]
const RAW = [
  // ══ LEG 1 (4 ก.ย. – 27 ธ.ค. 2026) ══
  ["4/9/2026",  1,1,0,0,0,0],["5/9/2026",  1,1,0,0,0,0],["6/9/2026",  1,1,0,0,0,0],
  ["11/9/2026", 1,1,0,0,0,0],["12/9/2026", 1,1,0,0,0,0],["13/9/2026", 1,1,0,0,0,0],
  // FIFA window 21 ก.ย.–6 ต.ค. → TL1/TL2 หยุด
  ["15/9/2026", 0,1,0,1,0,0],["16/9/2026", 0,1,0,1,0,0],["17/9/2026", 0,1,0,1,0,0],
  ["18/9/2026", 1,0,0,0,0,0],
  ["19/9/2026", 1,1,1,0,0,0],["20/9/2026", 1,1,1,0,0,0],
  ["22/9/2026", 0,0,0,1,0,0],["23/9/2026", 0,0,0,1,0,0],["24/9/2026", 0,0,0,1,0,0],
  ["26/9/2026", 0,0,1,0,0,0],["27/9/2026", 0,0,1,0,0,0],
  ["29/9/2026", 0,0,0,1,0,0],["30/9/2026", 0,0,0,1,0,0],
  ["1/10/2026", 0,0,0,1,0,0],
  ["3/10/2026", 0,0,1,0,0,0],["4/10/2026", 0,0,1,0,0,0],
  ["6/10/2026", 0,0,0,1,0,0],["7/10/2026", 0,0,0,1,0,0],["8/10/2026", 0,0,0,1,0,0],
  // TL1/TL2 กลับมา
  ["9/10/2026", 0,1,0,0,0,0],
  ["10/10/2026",1,1,1,0,0,0],["11/10/2026",1,1,1,0,0,0],
  ["13/10/2026",0,1,0,1,0,0],["14/10/2026",0,1,0,1,0,0],["15/10/2026",0,1,0,1,0,0],
  ["16/10/2026",1,0,0,0,0,0],
  ["17/10/2026",1,1,1,0,0,0],["18/10/2026",1,1,1,0,0,0],
  ["20/10/2026",0,0,0,0,1,0],["21/10/2026",0,0,0,0,1,0],["22/10/2026",0,0,0,0,1,0], // FA R64
  ["23/10/2026",0,1,0,0,0,0],
  ["24/10/2026",1,1,1,0,0,0],["25/10/2026",1,1,1,0,0,0],
  ["27/10/2026",0,0,0,1,0,0],["28/10/2026",0,0,0,1,0,0],["29/10/2026",0,0,0,1,0,0],
  ["30/10/2026",1,1,0,0,0,0],["31/10/2026",1,1,1,0,0,0],
  ["1/11/2026", 1,1,1,0,0,0],
  ["3/11/2026", 0,0,0,1,0,1],["4/11/2026", 0,0,0,1,0,1], // LECPO
  ["5/11/2026", 0,0,0,1,0,0],
  ["6/11/2026", 1,1,0,0,0,0],
  ["7/11/2026", 1,1,1,0,0,0],["8/11/2026", 1,1,1,0,0,0],
  // FIFA window 9-17 พ.ย.
  ["17/11/2026",0,0,1,0,0,0],["18/11/2026",0,0,1,0,0,0],
  ["20/11/2026",1,1,0,0,0,0],
  ["21/11/2026",1,1,1,0,0,0],["22/11/2026",1,1,1,0,0,0],
  ["24/11/2026",0,1,0,1,0,0],["25/11/2026",0,1,0,1,0,0],["26/11/2026",0,1,0,1,0,0],
  ["27/11/2026",1,0,0,0,0,0],
  ["28/11/2026",1,1,1,0,0,0],["29/11/2026",1,1,1,0,0,0],
  ["1/12/2026", 0,0,0,1,0,0],
  ["4/12/2026", 1,1,0,0,0,0],
  ["5/12/2026", 1,1,1,0,0,0],["6/12/2026", 1,1,1,0,0,0],
  ["8/12/2026", 0,0,0,1,0,1],["9/12/2026", 0,0,0,1,0,1],["10/12/2026",0,0,0,1,0,1], // LC32
  ["11/12/2026",0,1,0,0,0,0],
  ["12/12/2026",1,1,1,0,0,0],["13/12/2026",1,1,1,0,0,0],
  ["15/12/2026",1,0,0,0,0,0],["16/12/2026",1,0,0,0,0,0],["17/12/2026",1,0,0,0,0,0],
  ["18/12/2026",0,1,0,0,0,0],
  ["19/12/2026",1,1,1,0,0,0],["20/12/2026",1,1,1,0,0,0],
  ["22/12/2026",0,0,0,1,1,0],["23/12/2026",0,0,0,1,1,0],["24/12/2026",0,0,0,1,1,0], // FA R32
  ["25/12/2026",0,1,0,0,0,0],
  ["26/12/2026",1,1,1,0,0,0],["27/12/2026",1,1,1,0,0,0], // ← Leg1 จบ
  // ══ ASIAN CUP BREAK (TL1 หยุด | Transfer Window 2nd: 7 ม.ค.–5 ก.พ.) ══
  ["8/1/2027",  0,1,0,0,0,0],
  ["9/1/2027",  0,1,1,0,0,0],["10/1/2027", 0,1,1,0,0,0],
  ["12/1/2027", 0,0,0,1,0,0],["13/1/2027", 0,0,0,1,0,0],["14/1/2027", 0,0,0,1,0,0],
  ["15/1/2027", 0,1,0,0,0,0],
  ["16/1/2027", 0,1,1,0,0,0],["17/1/2027", 0,1,1,0,0,0],
  ["19/1/2027", 0,0,0,1,0,0],["20/1/2027", 0,0,0,1,0,0],["21/1/2027", 0,0,0,1,0,0],
  ["22/1/2027", 0,1,0,0,0,0],
  ["23/1/2027", 0,1,1,0,0,0],["24/1/2027", 0,1,1,0,0,0],
  ["26/1/2027", 0,0,0,1,0,0],["27/1/2027", 0,0,0,1,0,0],["28/1/2027", 0,0,0,1,0,0],
  ["29/1/2027", 0,1,0,0,0,0],
  ["30/1/2027", 0,1,1,0,0,0],["31/1/2027", 0,1,1,0,0,0],
  ["2/2/2027",  0,0,0,1,0,0],["3/2/2027",  0,0,0,1,0,0],["4/2/2027",  0,0,0,1,0,0],
  ["5/2/2027",  0,1,0,0,0,0],
  // ══ LEG 2 (6-7 ก.พ. → 29-30 พ.ค.) | Ramadan: 8 ก.พ.–9 มี.ค. ══
  ["6/2/2027",  1,1,1,0,0,0],["7/2/2027",  1,1,1,0,0,0], // ← Leg2 เริ่ม
  ["9/2/2027",  0,0,0,1,0,0],["10/2/2027", 0,0,0,1,0,0],["11/2/2027", 0,0,0,1,0,0],
  ["12/2/2027", 1,0,0,0,0,0],
  ["13/2/2027", 1,1,1,0,0,0],["14/2/2027", 1,1,1,0,0,0],
  ["16/2/2027", 0,1,0,1,0,0],["17/2/2027", 0,1,0,1,0,0],["18/2/2027", 0,1,0,1,0,0],
  ["19/2/2027", 1,0,0,0,0,0],
  ["20/2/2027", 1,1,1,0,0,0],["21/2/2027", 1,1,1,0,0,0],
  ["23/2/2027", 0,0,0,1,0,1],["24/2/2027", 0,0,0,1,0,1],["25/2/2027", 0,0,0,1,0,0],
  ["26/2/2027", 0,1,0,0,0,0],
  ["27/2/2027", 1,1,1,0,0,0],["28/2/2027", 1,1,1,0,0,0],
  // ── มีนาคม 2027 (CONFIRMED) ──
  ["2/3/2027",  0,0,0,1,1,0],["3/3/2027",  0,0,0,1,1,0], // FA Cup R16
  ["4/3/2027",  0,0,0,1,0,0],
  ["5/3/2027",  0,1,0,0,0,0],
  ["6/3/2027",  1,1,1,0,0,0],["7/3/2027",  1,1,1,0,0,0],
  ["9/3/2027",  0,0,0,1,0,0],["10/3/2027", 0,0,0,1,0,0],["11/3/2027", 0,0,0,1,0,0],
  ["12/3/2027", 1,0,0,0,0,0],
  ["13/3/2027", 1,1,1,0,0,0],["14/3/2027", 1,1,1,0,0,0],
  ["16/3/2027", 0,1,0,1,0,0],["17/3/2027", 0,1,0,1,0,0],["18/3/2027", 0,1,0,1,0,0],
  ["19/3/2027", 1,0,0,0,0,0],
  ["20/3/2027", 1,1,1,0,0,0],["21/3/2027", 1,1,1,0,0,0], // ← TL3 LAST ROUND
  // FIFA window 22-30 มี.ค. → ไม่มีแมตช์
  // ── เม.ย. (TL3 CL เริ่ม 10 เม.ย., TL2 regular จบ 25 เม.ย.) ──
  ["2/4/2027",  0,1,0,0,0,0],
  ["3/4/2027",  0,1,1,0,0,0],["4/4/2027",  0,1,1,0,0,0],
  ["7/4/2027",  0,0,0,0,0,1],             // LC SF
  ["10/4/2027", 0,0,1,0,0,0],["11/4/2027",0,0,1,0,0,0],  // TL3 CL เริ่ม
  ["16/4/2027", 1,0,0,0,0,0],
  ["17/4/2027", 1,1,1,0,0,0],["18/4/2027",1,1,1,0,0,0],
  ["20/4/2027", 0,0,0,1,0,0],
  ["21/4/2027", 0,0,0,1,1,0],             // FA Cup SF
  ["22/4/2027", 0,0,0,1,0,0],
  ["23/4/2027", 1,0,0,0,0,0],
  ["24/4/2027", 1,0,1,0,0,0],
  ["25/4/2027", 1,1,1,0,0,0],             // ← TL2 Regular จบ
  ["27/4/2027", 0,0,0,1,0,0],["28/4/2027",0,0,0,1,0,0],["29/4/2027",0,0,0,1,0,0],
  ["30/4/2027", 1,0,0,0,0,0],
  // ── พ.ค. (TL2 Play-off 1-23 พ.ค., TL3 CL ต่อ, TL1 จบ 30 พ.ค.) ──
  ["1/5/2027",  1,1,1,0,0,0],["2/5/2027",  1,1,1,0,0,0],
  ["5/5/2027",  0,0,0,0,0,1],             // LC Final run-up
  ["8/5/2027",  1,1,1,0,0,0],["9/5/2027",  1,1,1,0,0,0],
  ["12/5/2027", 0,0,1,0,1,0],             // TL3 CL + FA Cup
  ["15/5/2027", 1,0,1,0,0,0],
  ["16/5/2027", 1,1,1,0,0,0],
  ["22/5/2027", 1,0,1,0,0,0],
  ["23/5/2027", 1,1,1,0,0,0],
  ["29/5/2027", 0,0,1,0,0,0],
  ["30/5/2027", 1,0,0,0,0,0],             // ← TL1 จบฤดูกาล
  // ── มิ.ย. (LC Final 5 มิ.ย. · FA Cup Final 19 มิ.ย.) ──
  // FIFA window 7-15 มิ.ย. → TL3 ไม่ถูกกระทบ
  ["5/6/2027",  0,0,0,0,0,1],             // 🏆 League Cup FINAL
  ["6/6/2027",  0,0,1,0,0,0],
  ["12/6/2027", 0,0,1,0,0,0],             // TL3 CL
  ["19/6/2027", 0,0,0,0,1,0],             // 🏆 FA Cup FINAL
];

const DATA = RAW.map(([d,t1,t2,t3,p,c,m]) => ({
  d, TL1:t1, TL2:t2, TL3:t3, PEA:p, CHANG:c, MUANG:m
}));

// ── Helpers ───────────────────────────────────────────────────────
function parseDateStr(s) {
  const [dd,mm,yyyy] = s.split('/').map(Number);
  return new Date(yyyy, mm-1, dd);
}
function getMonthKey(d) {
  const [,mm,yyyy] = d.split('/');
  return `${yyyy}/${mm.padStart(2,'0')}`;
}

const D_LEG2   = parseDateStr("6/2/2027");
const D_AC_END = parseDateStr("5/2/2027");
const D_AC_ST  = parseDateStr("28/12/2026");
const D_RAM_S  = parseDateStr("8/2/2027");
const D_RAM_E  = parseDateStr("9/3/2027");

const FIFA_WINDOWS = [
  { s:"21/9/2026", e:"6/10/2026",  label:"FIFA Window · TL1/TL2 หยุด" },
  { s:"9/11/2026", e:"17/11/2026", label:"FIFA Window · TL1/TL2 หยุด" },
  { s:"22/3/2027", e:"30/3/2027",  label:"FIFA Window · ไม่มีแมตช์หลัง 21 มี.ค." },
  { s:"7/6/2027",  e:"15/6/2027",  label:"FIFA Window · TL3 ยังเตะได้" },
];

function getFIFAWindow(dateStr) {
  const d = parseDateStr(dateStr);
  for (const w of FIFA_WINDOWS) {
    if (d >= parseDateStr(w.s) && d <= parseDateStr(w.e)) return w.label;
  }
  return null;
}

function periodOf(dateStr) {
  const d = parseDateStr(dateStr);
  if (d >= D_LEG2) return "leg2";
  if (d >= D_AC_ST && d <= D_AC_END) return "asiancup";
  return "leg1";
}

function isPlayoff(dateStr, league) {
  const d = parseDateStr(dateStr);
  if (league==="TL3" && d >= parseDateStr("10/4/2027")) return true;
  if (league==="TL2" && d >= parseDateStr("1/5/2027"))  return true;
  return false;
}

function predict(row) {
  const solo1 = row.TL1 && !row.TL2 && !row.TL3;
  const solo2 = row.TL2 && !row.TL1 && !row.TL3;
  const finals = CUP_FINALS[row.d] || {};
  const v = {}; let hasPO = false;

  KEYS.forEach(k => {
    if (!row[k]) { v[k]=0; return; }
    if (finals[k] !== undefined) { v[k]=finals[k]; return; }
    if ((k==="TL1"&&solo1)||(k==="TL2"&&solo2)) { v[k]=1; return; }
    const po = isPlayoff(row.d, k);
    if (po) hasPO = true;
    v[k] = po ? MODE_PO[k] : MODE_REG[k];
  });

  const d = parseDateStr(row.d);
  v.total   = KEYS.reduce((s,k)=>s+v[k],0);
  v.hasPO   = hasPO;
  v.period  = periodOf(row.d);
  v.ramadan = d >= D_RAM_S && d <= D_RAM_E;
  v.isFinal = !!finals && Object.keys(finals).length > 0;
  return v;
}

const PDATA = DATA.map(r => ({...r, p:predict(r)}));

const ML = {
  "2026/09":"ก.ย. 69","2026/10":"ต.ค. 69","2026/11":"พ.ย. 69","2026/12":"ธ.ค. 69",
  "2027/01":"ม.ค. 70","2027/02":"ก.พ. 70","2027/03":"มี.ค. 70",
  "2027/04":"เม.ย. 70","2027/05":"พ.ค. 70","2027/06":"มิ.ย. 70"
};

function loadStyle(t, hasPO, isFinal) {
  if (isFinal) return { txt:"#FBBF24", row:"#78350F20", left:"#F59E0B" };
  if (t===0)   return { txt:"#1E293B", row:"transparent",  left:"transparent" };
  if (hasPO)   return { txt:"#C084FC", row:"#4C1D9510",    left:"#7C3AED" };
  if (t<=3)    return { txt:"#64748B", row:"transparent",  left:"#334155" };
  if (t<=9)    return { txt:"#60A5FA", row:"#1D4ED810",    left:"#3B82F6" };
  if (t<=19)   return { txt:"#FCD34D", row:"#D9770610",    left:"#D97706" };
  return         { txt:"#F87171", row:"#B91C1C10",    left:"#EF4444" };
}

const GRID = "88px repeat(6,1fr) 52px";

export default function Forecast() {
  const months = useMemo(() => {
    const s = new Set(DATA.map((r) => getMonthKey(r.d)));
    return [...s].sort();
  }, []);

  const [active, setActive] = useState(months[0]);

  const monthStats = useMemo(
    () =>
      months.map((m) => {
        const rows = PDATA.filter((r) => getMonthKey(r.d) === m);

        return {
          m,
          label: ML[m] || m,
          total: rows.reduce((s, r) => s + r.p.total, 0),
          peak: Math.max(...rows.map((r) => r.p.total)),
          days: rows.length,
          hasPO: rows.some((r) => r.p.hasPO),
        };
      }),
    [months]
  );

  const rows = useMemo(
    () => PDATA.filter((r) => getMonthKey(r.d) === active),
    [active]
  );

  const grandTotal = monthStats.reduce((s, m) => s + m.total, 0);

  const peakDay = Math.max(...PDATA.map((r) => r.p.total));

  const activeDays = PDATA.length;

  const poDays = PDATA.filter((r) => r.p.hasPO).length;

  const colTotals = useMemo(() => {
    const t = Object.fromEntries(
      KEYS.map((k) => [k, rows.reduce((s, r) => s + r.p[k], 0)])
    );

    t.total = rows.reduce((s, r) => s + r.p.total, 0);

    return t;
  }, [rows]);

  const maxMonth = Math.max(...monthStats.map((m) => m.total));

  const glass = {
    background: "rgba(15,23,42,.65)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,.05)",
    borderRadius: 20,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 28,
        color: "#E2E8F0",
        fontFamily: "Inter, sans-serif",
        background: `
        radial-gradient(circle at top left,#2563eb22,transparent 30%),
        radial-gradient(circle at top right,#7c3aed22,transparent 30%),
        radial-gradient(circle at bottom,#16a34a22,transparent 40%),
        #030712
      `,
      }}
    >
      {/* HERO */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "2.8rem",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            MATCH OPERATIONS
          </div>

          <div
            style={{
              marginTop: 8,
              color: "#64748B",
              fontSize: ".95rem",
            }}
          >
            Thai Football Ecosystem 2026/27
          </div>
        </div>

        <div
          style={{
            ...glass,
            padding: "14px 20px",
          }}
        >
          <div
            style={{
              color: "#64748B",
              fontSize: ".7rem",
            }}
          >
            SEASON FORECAST
          </div>

          <div
            style={{
              fontWeight: 700,
            }}
          >
            Draft 14/05/2026
          </div>
        </div>
      </div>

      {/* KPI */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            title: "TOTAL MATCHES",
            value: grandTotal,
            color: "#60A5FA",
          },
          {
            title: "PEAK DAY",
            value: peakDay,
            color: "#F87171",
          },
          {
            title: "ACTIVE DAYS",
            value: activeDays,
            color: "#34D399",
          },
          {
            title: "PLAYOFF DAYS",
            value: poDays,
            color: "#C084FC",
          },
        ].map((kpi) => (
          <div
            key={kpi.title}
            style={{
              ...glass,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: ".72rem",
                color: "#64748B",
                marginBottom: 8,
              }}
            >
              {kpi.title}
            </div>

            <div
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                color: kpi.color,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* MONTH LOAD */}

      <div
        style={{
          ...glass,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            marginBottom: 18,
            fontWeight: 800,
            fontSize: ".9rem",
            color: "#CBD5E1",
          }}
        >
          MONTHLY LOAD DISTRIBUTION
        </div>

        {monthStats.map((m) => (
          <div
            key={m.m}
            onClick={() => setActive(m.m)}
            style={{
              marginBottom: 12,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span>{m.label}</span>

              <span
                style={{
                  fontFamily: "JetBrains Mono",
                }}
              >
                {m.total}
              </span>
            </div>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                overflow: "hidden",
                background: "#111827",
              }}
            >
              <div
                style={{
                  width: `${(m.total / maxMonth) * 100}%`,
                  height: "100%",
                  background:
                    m.m === active
                      ? "linear-gradient(90deg,#60A5FA,#A855F7)"
                      : "#334155",
                  transition: ".3s",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* DAILY MATRIX */}

      <div
        style={{
          ...glass,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            fontWeight: 800,
          }}
        >
          DAILY OPERATIONS MATRIX
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "110px repeat(6,1fr) 90px",
            padding: "12px 18px",
            background: "#020617",
            color: "#64748B",
            fontSize: ".75rem",
            fontWeight: 700,
          }}
        >
          <div>DATE</div>

          {COLS.map((c) => (
            <div key={c.k} style={{ textAlign: "center" }}>
              {c.k}
            </div>
          ))}

          <div style={{ textAlign: "center" }}>TOTAL</div>
        </div>

        {rows.map(({ d, p }) => {
          const percent = Math.min((p.total / peakDay) * 100, 100);

          return (
            <div
              key={d}
              style={{
                display: "grid",
                gridTemplateColumns: "110px repeat(6,1fr) 90px",
                padding: "10px 18px",
                borderBottom: "0.5px solid rgba(255, 253, 255, 0.3)",
                alignItems: "center",
              }}
            >
              <div>{d}</div>

              {COLS.map((c) => (
                <div
                  key={c.k}
                  style={{
                    textAlign: "center",
                    color: p[c.k] > 0 ? c.c : "#1E293B",
                    fontWeight: 700,
                  }}
                >
                  {p[c.k] || "·"}
                </div>
              ))}

              <div>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: 900,
                    color:
                      p.total >= 20
                        ? "#F87171"
                        : p.total >= 10
                        ? "#FCD34D"
                        : "#60A5FA",
                  }}
                >
                  {p.total}
                </div>

                <div
                  style={{
                    height: 4,
                    background: "#111827",
                    borderRadius: 999,
                    overflow: "hidden",
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg,#3B82F6,#F59E0B,#EF4444)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "110px repeat(6,1fr) 90px",
            padding: "16px 18px",
            background: "#020617",
            fontWeight: 900,
          }}
        >
          <div>TOTAL</div>

          {KEYS.map((k) => (
            <div
              key={k}
              style={{
                textAlign: "center",
              }}
            >
              {colTotals[k]}
            </div>
          ))}

          <div
            style={{
              textAlign: "center",
              color: "#60A5FA",
              fontSize: "1.1rem",
            }}
          >
            {colTotals.total}
          </div>
        </div>
      </div>
    </div>
  );
}