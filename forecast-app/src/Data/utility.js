export const normalizeLeague = (league) => {
  if (!league) return "";

  const l = league.toUpperCase().trim();

  if (l.includes("THAI LEAGUE 1")) return "THAI LEAGUE 1";
  if (l.includes("THAI LEAGUE 2")) return "THAI LEAGUE 2";
  if (l.includes("THAI LEAGUE 3")) return "THAI LEAGUE 3";
  if (l.includes("PEA")) return "PEA U21";
  if (l.includes("WOMEN")) return "WOMEN";
  
  // 🏆 🛠️ ดักจับชื่อสปอนเซอร์จาก matchDetails.js (CHANG FA CUP / MUANGTHAI CUP)
  if (l.includes("FA CUP") || l.includes("CHANG")) return "FA CUP";
  if (l.includes("LEAGUE CUP") || l.includes("MUANG")) return "LEAGUE CUP";

  return league;
};

export const getLeagueKey = (league) => {
  const normalized = normalizeLeague(league);

  switch (normalized) {
    case "THAI LEAGUE 1":
      return "TL1";
    case "THAI LEAGUE 2":
      return "TL2";
    case "THAI LEAGUE 3":
      return "TL3";
    case "PEA U21":
      return "U21";
    case "WOMEN":
      return "WOMEN";
    case "FA CUP":
      return "CHANG";
    case "LEAGUE CUP":
      return "MUANG";
    default:
      return null;
  }
};