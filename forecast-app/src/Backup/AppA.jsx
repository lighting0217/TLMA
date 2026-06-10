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
  const months = useMemo(()=>{
    const s = new Set(DATA.map(r=>getMonthKey(r.d)));
    return [...s].sort();
  },[]);

  const [active, setActive]     = useState(months[0]);
  const [showInfo, setShowInfo] = useState(true);
  const [showTWL, setShowTWL]   = useState(false);

  const monthStats = useMemo(()=>months.map(m=>{
    const rows = PDATA.filter(r=>getMonthKey(r.d)===m);
    const periods = new Set(rows.map(r=>r.p.period));
    return {
      m, label:ML[m]||m,
      total: rows.reduce((s,r)=>s+r.p.total,0),
      peak:  Math.max(...rows.map(r=>r.p.total)),
      days:  rows.length,
      hasPO: rows.some(r=>r.p.hasPO),
      isAC:  periods.has("asiancup"),
      isL2:  periods.has("leg2") && !periods.has("leg1") && !periods.has("asiancup"),
    };
  }),[months]);

  const rows  = useMemo(()=>PDATA.filter(r=>getMonthKey(r.d)===active),[active]);
  const colTotals = useMemo(()=>{
    const t = Object.fromEntries(KEYS.map(k=>[k,rows.reduce((s,r)=>s+r.p[k],0)]));
    t.total = rows.reduce((s,r)=>s+r.p.total,0);
    return t;
  },[rows]);

  const grandTotal = monthStats.reduce((s,m)=>s+m.total,0);
  const twlBonus   = showTWL ? monthStats.filter(m=>["2027/05","2027/06"].includes(m.m)).reduce((s,m)=>s+m.days*4,0) : 0;

  return (
    <div style={{fontFamily:"'DM Mono','Fira Code',monospace",background:"#060D1F",minHeight:"100vh",padding:"20px",color:"#E2E8F0"}}>

      {/* Header */}
      <div style={{marginBottom:"14px"}}>
        <div style={{fontSize:"0.56rem",color:"#1E3A5F",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:"3px"}}>
          AWN/AIS Play · Season 2026/27 · Draft 14/05/2026
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
          <h1 style={{fontSize:"1.3rem",fontWeight:900,margin:0,background:"linear-gradient(90deg,#ff0000,#2600ff,#12d800)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            📡 Match Count Forecast
          </h1>
          <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
            <button onClick={()=>setShowInfo(s=>!s)} style={{background:"#0F172A",border:"1px solid #1E3A5F",color:"#4c4769",borderRadius:"5px",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:"0.62rem"}}>
              {showInfo?"▲":"▼"} Info
            </button>
            <label style={{display:"flex",alignItems:"center",gap:"5px",color:showTWL?"#FCD34D":"#334155",cursor:"pointer",fontSize:"0.65rem"}}>
              <input type="checkbox" checked={showTWL} onChange={e=>setShowTWL(e.target.checked)} style={{accentColor:"#FCD34D"}}/>
              +TWL พ.ค.–มิ.ย. (~4/วัน)
            </label>
          </div>
        </div>
      </div>

      {/* Season Info */}
      {showInfo && (
        <div style={{background:"#080F22",border:"1px solid #1E293B",borderRadius:"10px",padding:"14px",marginBottom:"12px",fontSize:"0.68rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",gap:"9px",marginBottom:"10px"}}>
            {[
              {c:"#3B82F6",t:"TL1",d:"4 ก.ย. 69 → 30 พ.ค. 70"},
              {c:"#22C55E",t:"TL2",d:"4 ก.ย. 69 → 25 เม.ย. 70 | PO 1-23 พ.ค."},
              {c:"#F59E0B",t:"TL3",d:"19 ก.ย. 69 → 21 มี.ค. 70 | CL PO 10 เม.ย.–12 มิ.ย."},
              {c:"#F97316",t:"Leg 1",d:"4 ก.ย. 69 → 26-27 ธ.ค. 69"},
              {c:"#F59E0B",t:"Asian Cup Break",d:"TL1 หยุด | TW2: 7 ม.ค.–5 ก.พ. 70"},
              {c:"#34D399",t:"Leg 2",d:"6-7 ก.พ. 70 → 29-30 พ.ค. 70"},
              {c:"#FB923C",t:"Ramadan (ยืนยัน)",d:"8 ก.พ. – 9 มี.ค. 70"},
            ].map(x=>(
              <div key={x.t} style={{display:"flex",gap:"7px"}}>
                <div style={{width:"3px",minHeight:"28px",background:x.c,borderRadius:"2px",flexShrink:0,marginTop:"2px"}}/>
                <div>
                  <div style={{fontWeight:800,color:x.c,fontSize:"0.63rem"}}>{x.t}</div>
                  <div style={{color:"#475569",fontSize:"0.58rem",lineHeight:1.4}}>{x.d}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FIFA Windows */}
          <div style={{borderTop:"1px solid #1E293B",paddingTop:"8px",marginBottom:"8px"}}>
            <div style={{fontSize:"0.58rem",color:"#1E3A5F",marginBottom:"5px",textTransform:"uppercase",letterSpacing:"0.1em"}}>FIFA Windows (TL1/TL2 หยุด)</div>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {[
                ["ก.ย./ต.ค. 69","21 ก.ย.–6 ต.ค. (16 วัน)"],
                ["พ.ย. 69","9-17 พ.ย."],
                ["ม.ค./ก.พ. 70","7 ม.ค.–5 ก.พ. (Asian Cup)"],
                ["มี.ค. 70","22-30 มี.ค. → หลัง TL3 จบ"],
                ["มิ.ย. 70","7-15 มิ.ย. (TL3 ยังเตะ)"],
              ].map(([k,v])=>(
                <div key={k} style={{background:"#0F172A",border:"1px solid #1E3A5F30",borderRadius:"4px",padding:"3px 7px",fontSize:"0.58rem"}}>
                  <span style={{color:"#3B82F6",fontWeight:700}}>{k}</span>
                  <span style={{color:"#334155",marginLeft:"5px"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cup structure */}
          <div style={{borderTop:"1px solid #1E293B",paddingTop:"8px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",fontSize:"0.58rem"}}>
              <div>
                <div style={{color:"#EF4444",fontWeight:800,marginBottom:"4px"}}>🏆 FA Cup (CHANG)</div>
                {["FAQ1: 8-9 ก.ย. (qualify, ไม่ broadcast)","FAQ2: 22-23 ก.ย. (qualify)","R64: 20-22 ต.ค.","R32: 22-24 ธ.ค.","R16: 2-3 มี.ค.","SF: 21 เม.ย.","Final: 19 มิ.ย. 🏆"].map((r,i)=>(
                  <div key={i} style={{color:"#475569",marginBottom:"2px"}}>{r}</div>
                ))}
              </div>
              <div>
                <div style={{color:"#64748B",fontWeight:800,marginBottom:"4px"}}>🏆 League Cup (MUANG)</div>
                {["LECQ1: 5-6 ก.ย. (qualify, ไม่ broadcast)","LECQ2: 12-13 ก.ย.","LECPO: 3-4 พ.ย.","LC32: 8-10 ธ.ค.","QF: 23-24 ก.พ.","SF: 7 เม.ย. / 5 พ.ค.","Final: 5 มิ.ย. 🏆"].map((r,i)=>(
                  <div key={i} style={{color:"#475569",marginBottom:"2px"}}>{r}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(82px,1fr))",gap:"5px",marginBottom:"12px"}}>
        {monthStats.map(ms=>{
          const isA  = ms.m===active;
          const col  = ms.hasPO?"#A855F7":ms.total>200?"#F87171":ms.total>100?"#FCD34D":ms.total>40?"#60A5FA":"#64748B";
          const tag  = ms.hasPO?"PO":ms.isAC?"⚽AC":ms.isL2?"L2":"L1";
          const tagC = ms.hasPO?"#A855F7":ms.isAC?"#F59E0B":ms.isL2?"#34D399":"#3B82F6";
          const twl  = showTWL&&["2027/05","2027/06"].includes(ms.m)?ms.days*4:0;
          return (
            <div key={ms.m} onClick={()=>setActive(ms.m)} style={{
              background:isA?"#0F1E3C":"#080F22",
              border:`1px solid ${isA?col+"80":"#111827"}`,
              borderRadius:"8px",padding:"8px 8px 6px",cursor:"pointer",
              boxShadow:isA?`0 0 12px ${col}25`:"none",transition:"all 0.12s"
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2px"}}>
                <span style={{fontSize:"0.55rem",color:isA?"#475569":"#1E293B"}}>{ms.label}</span>
                <span style={{fontSize:"0.5rem",color:tagC,fontWeight:800}}>{tag}</span>
              </div>
              <div style={{fontSize:"1.1rem",fontWeight:900,color:isA?col:"#334155",lineHeight:1}}>{ms.total+twl}</div>
              {twl>0&&<div style={{fontSize:"0.5rem",color:"#92400E"}}>+{twl} TWL</div>}
              <div style={{fontSize:"0.5rem",color:isA?"#334155":"#1E293B",marginTop:"2px"}}>P:{ms.peak}·{ms.days}d</div>
            </div>
          );
        })}
        <div style={{background:"#080F22",border:"1px solid #1E3A5F40",borderRadius:"8px",padding:"8px 8px 6px"}}>
          <div style={{fontSize:"0.55rem",color:"#1E3A5F",marginBottom:"2px"}}>TOTAL</div>
          <div style={{fontSize:"1.1rem",fontWeight:900,color:"#3B82F6",lineHeight:1}}>{grandTotal+twlBonus}</div>
          {twlBonus>0&&<div style={{fontSize:"0.5rem",color:"#92400E"}}>+{twlBonus}</div>}
        </div>
      </div>

      {/* Context banners */}
      {rows.some(r=>r.p.ramadan)&&(
        <div style={{background:"#1C0E00",border:"1px solid #92400E",borderRadius:"6px",padding:"5px 12px",marginBottom:"8px",fontSize:"0.65rem",color:"#FB923C",display:"flex",gap:"8px"}}>
          🌙 <b>Ramadan</b> 8 ก.พ.–9 มี.ค. 2027 · อาจมีการปรับเวลาแมตช์
        </div>
      )}

      {/* Table */}
      <div style={{background:"#080F22",borderRadius:"10px",border:"1px solid #111827",overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:GRID,padding:"7px 10px",borderBottom:"1px solid #111827",background:"#060D1F",position:"sticky",top:0,zIndex:2}}>
          <div style={{fontSize:"0.55rem",color:"#1E3A5F",textTransform:"uppercase",letterSpacing:"0.1em"}}>DATE</div>
          {COLS.map(c=>(
            <div key={c.k} style={{textAlign:"center",fontSize:"0.58rem",color:c.c,fontWeight:800}}>{c.k}</div>
          ))}
          <div style={{textAlign:"center",fontSize:"0.55rem",color:"#1E3A5F",textTransform:"uppercase"}}>TOT</div>
        </div>

        {rows[0]?.p.period==="asiancup"&&(
          <div style={{background:"#1C1400",borderBottom:"1px solid #78350F",padding:"5px 12px"}}>
            <span style={{fontSize:"0.6rem",color:"#F59E0B",fontWeight:800}}>⚽ Asian Cup Break · TL1 หยุด / TL2·TL3·PEA เตะต่อ</span>
          </div>
        )}
        {rows[0]?.p.period==="leg2"&&rows.every(r=>r.p.period==="leg2")&&(
          <div style={{background:"#0A2010",borderBottom:"1px solid #166534",padding:"5px 12px"}}>
            <span style={{fontSize:"0.6rem",color:"#34D399",fontWeight:800}}>▶ LEG 2 · TL1 กลับมา 6-7 ก.พ. 70</span>
          </div>
        )}

        {rows.map(({d,p},i)=>{
          const lv = loadStyle(p.total, p.hasPO, p.isFinal);
          const prev = i>0?rows[i-1].p.period:null;
          const showAC = prev&&prev==="leg1"&&p.period==="asiancup";
          const showL2 = prev&&prev!=="leg2"&&p.period==="leg2";
          const isTL3Last = d==="21/3/2027";
          const isTL1End  = d==="30/5/2027";
          return (
            <div key={d}>
              {showAC&&(<div style={{background:"#1C1400",borderTop:"1px solid #78350F",borderBottom:"1px solid #78350F",padding:"4px 12px"}}><span style={{fontSize:"0.55rem",color:"#F59E0B",fontWeight:800}}>─── ⚽ Asian Cup Break: TL1 หยุด ─── TL2·TL3·PEA เตะต่อ ───</span></div>)}
              {showL2&&(<div style={{background:"#0A2010",borderTop:"1px solid #166534",borderBottom:"1px solid #166534",padding:"4px 12px"}}><span style={{fontSize:"0.55rem",color:"#34D399",fontWeight:800}}>─── ▶ LEG 2 เริ่ม 6-7 ก.พ. 70 ───</span></div>)}
              <div style={{
                display:"grid",gridTemplateColumns:GRID,
                padding:"5px 10px",borderBottom:"1px solid #060D1F",
                background:p.ramadan?"#08060040":lv.row,
                borderLeft:`2px solid ${p.total>0?lv.left:"transparent"}`,
                alignItems:"center"
              }}>
                <div style={{fontSize:"0.68rem",color:p.ramadan?"#78350F":p.isFinal?"#FBBF24":"#475569",display:"flex",alignItems:"center",gap:"3px",flexWrap:"wrap"}}>
                  {p.hasPO&&<span style={{fontSize:"0.48rem",color:"#7C3AED",fontWeight:800}}>PO</span>}
                  {p.isFinal&&<span style={{fontSize:"0.5rem",color:"#FBBF24"}}>🏆</span>}
                  {p.ramadan&&<span style={{fontSize:"0.48rem",color:"#FB923C"}}>🌙</span>}
                  {isTL3Last&&<span style={{fontSize:"0.44rem",color:"#F59E0B"}}>TL3✓</span>}
                  {isTL1End&&<span style={{fontSize:"0.44rem",color:"#3B82F6"}}>TL1✓</span>}
                  {d}
                </div>
                {COLS.map(c=>{
                  const val=p[c.k];
                  const po=val>0&&isPlayoff(d,c.k);
                  return (
                    <div key={c.k} style={{textAlign:"center"}}>
                      {val>0?(
                        <span style={{
                          fontSize:"0.74rem",fontWeight:val===1?400:800,
                          color:po?"#C084FC":p.isFinal?"#FBBF24":val===1?"#334155":c.c,
                          background:po?"#4C1D9518":p.isFinal?"#78350F20":val>1?`${c.c}15`:"transparent",
                          padding:"1px 4px",borderRadius:"3px",
                          display:"inline-block",minWidth:"18px",textAlign:"center"
                        }}>{val}</span>
                      ):(
                        <span style={{color:"#111827",fontSize:"0.4rem"}}>·</span>
                      )}
                    </div>
                  );
                })}
                <div style={{textAlign:"center"}}>
                  {p.total>0?(
                    <span style={{fontSize:"0.82rem",fontWeight:900,color:lv.txt,textShadow:p.total>=20?`0 0 6px ${lv.txt}50`:"none"}}>{p.total}</span>
                  ):(
                    <span style={{color:"#111827",fontSize:"0.4rem"}}>·</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div style={{display:"grid",gridTemplateColumns:GRID,padding:"8px 10px",borderTop:"1px solid #1E3A5F",background:"#0A1628"}}>
          <div style={{fontSize:"0.62rem",fontWeight:700,color:"#334155"}}>TOTAL</div>
          {KEYS.map(k=>(
            <div key={k} style={{textAlign:"center",fontSize:"0.7rem",fontWeight:700,color:colTotals[k]>0?COLS.find(c=>c.k===k).c:"#1E293B"}}>
              {colTotals[k]||""}
            </div>
          ))}
          <div style={{textAlign:"center",fontSize:"1rem",fontWeight:900,color:"#60A5FA"}}>{colTotals.total}</div>
        </div>
      </div>

      <div style={{marginTop:"10px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center",fontSize:"0.6rem",color:"#334155"}}>
        {[["≤3","#64748B","เบา"],["4–9","#60A5FA","กลาง"],["10–19","#FCD34D","หนัก"],["≥20","#F87171","PEAK"]].map(([r,c,l])=>(
          <span key={r} style={{display:"flex",alignItems:"center",gap:"4px"}}>
            <span style={{width:"7px",height:"7px",background:c,borderRadius:"2px",display:"inline-block"}}/>
            {r} = {l}
          </span>
        ))}
        <span style={{color:"#7C3AED"}}>PO</span>=<span style={{color:"#A855F7"}}>Play-off (TL3≈3, TL2≈1)</span>
        <span style={{color:"#FBBF24"}}>🏆</span>=<span style={{color:"#FBBF24"}}>Cup Final (1 คู่)</span>
        <span style={{color:"#FB923C"}}>🌙</span>=<span style={{color:"#78350F"}}>Ramadan</span>
      </div>
    </div>
  );
}