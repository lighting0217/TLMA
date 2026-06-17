/**
 * Pure data transformation functions
 * Separated for testability and reusability
 */

export const normalizeNode = (node) => {
  if (!node.name || !node.ip) return null;

  let group = "ทั่วไป";
  let name = node.name;

  // Parse stadium#device format
  if (node.name.includes("#")) {
    const [stadiumName, deviceName] = node.name.split("#");
    group = stadiumName.trim();
    name = deviceName.trim();
  } else if (node.group) {
    group = node.group.trim();
  }

  return {
    ip: node.ip,
    name,
    group,
    status: node.status || "UNKNOWN",
    ping: node.ping || "-",
    timestamp: node.timestamp || Date.now(),
  };
};

export const groupNodesByStadium = (nodes) => {
  return nodes.reduce((acc, node) => {
    if (!acc[node.group]) acc[node.group] = [];
    acc[node.group].push(node);
    return acc;
  }, {});
};

export const filterNodesBySearchTerm = (groupedNodes, searchTerm) => {
  if (!searchTerm.trim()) return groupedNodes;

  const term = searchTerm.toLowerCase().trim();
  return Object.entries(groupedNodes).reduce((acc, [stadium, devices]) => {
    const filtered = devices.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.ip.toLowerCase().includes(term) ||
        stadium.toLowerCase().includes(term)
    );
    if (filtered.length > 0) acc[stadium] = filtered;
    return acc;
  }, {});
};

export const detectStatusChange = (prevStatus, currentNode) => {
  const previousState = prevStatus[currentNode.ip];
  const isStatusChanged = previousState && previousState !== currentNode.status;
  const isDowntime = previousState === "ONLINE" && currentNode.status === "TIMEOUT";

  return { isStatusChanged, isDowntime };
};

export const updatePrevStatusRef = (prevStatusRef, node) => {
  prevStatusRef.current[node.ip] = node.status;
};

export const cleanupOldStatusEntries = (prevStatusRef, knownIPs) => {
  // Remove IPs no longer in the system to prevent memory bloat
  const currentIPs = new Set(knownIPs);
  Object.keys(prevStatusRef.current).forEach((ip) => {
    if (!currentIPs.has(ip)) {
      delete prevStatusRef.current[ip];
    }
  });
};
