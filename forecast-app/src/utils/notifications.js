/**
 * Notification utilities
 * Handles all alerting logic separated from data processing
 */

export const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch (error) {
      console.warn("Notification permission denied:", error);
    }
  }
};

export const parseStadiumInfo = (groupText) => {
  let feed = "XX";
  let stadium = groupText.replace(/^[-\s]+/, "").trim();

  const feedMatch = stadium.match(/feed\s*(\d+)/i);
  if (feedMatch) {
    feed = feedMatch[1];
    stadium = stadium.replace(/feed\s*\d+/i, "").replace(/^[-\s]+/, "").trim();
  }

  if (stadium && stadium !== "ทั่วไป" && !stadium.startsWith("สนาม")) {
    stadium = "สนาม" + stadium;
  }

  return { feed, stadium };
};

export const sendDowntimeNotification = (node) => {
  if (Notification.permission !== "granted") return;

  const { feed, stadium } = parseStadiumInfo(node.group);

  try {
    new Notification(`🏟️ Feed ${feed} ${stadium} Down!`, {
      body: `🔴 Device: ${node.name} | IP: ${node.ip}`,
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23ff4444'/></svg>",
    });
  } catch (error) {
    console.warn("Failed to send notification:", error);
  }
};
