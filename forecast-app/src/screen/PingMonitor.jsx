import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import PingCard from "../components/PingCard";
import { usePingStats } from "../hooks/usePingStats";
import HistoryLog from "../components/HistoryLog";
import { useWebSocketPing } from "../hooks/useWebSocketPing";
import {
  normalizeNode,
  groupNodesByStadium,
  filterNodesBySearchTerm,
  detectStatusChange,
  updatePrevStatusRef,
  cleanupOldStatusEntries,
} from "../utils/nodeProcessor";
import {
  requestNotificationPermission,
  sendDowntimeNotification,
} from "../utils/notifications";

export default function PingMonitor() {
  const { history, events, updateStats, addEvent } = usePingStats();
  const [groupedNodes, setGroupedNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const prevStatus = useRef({});
  const allNodesRef = useRef({});

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Core data processing pipeline
  const processIncomingNodes = useCallback((parsedNodes) => {
    // Step 1: Normalize all nodes to consistent format
    const normalizedNodes = parsedNodes
      .map(normalizeNode)
      .filter((node) => node !== null);

    if (normalizedNodes.length === 0) return;

    // Step 2: Process each node - update stats and check for alerts
    normalizedNodes.forEach((node) => {
      // Update stats in usePingStats hook
      updateStats(node);

      // Step 3: Detect status changes and trigger alerts
      const { isDowntime } = detectStatusChange(prevStatus.current, node);

      if (isDowntime) {
        addEvent(node);
        sendDowntimeNotification(node);
      }

      // Update tracking reference
      updatePrevStatusRef(prevStatus, node);

      // Cache node for cleanup
      allNodesRef.current[node.ip] = node;
    });

    // Clean up stale entries to prevent memory bloat
    const allIPs = Object.keys(allNodesRef.current);
    cleanupOldStatusEntries(prevStatus, allIPs);

    // Step 4: Group nodes by stadium
    const grouped = groupNodesByStadium(normalizedNodes);
    setGroupedNodes(grouped);
  }, [updateStats, addEvent]);

  // Fetch initial data from CSV file
  const fetchPingDataFromCSV = useCallback(async () => {
    try {
      // Add cache-busting query param
      const response = await fetch(
        `/ping_result.csv?t=${new Date().getTime()}`
      );
      if (!response.ok) return;

      const text = await response.text();
      const blocks = text
        .split(/={30,}/)
        .filter((b) => b.trim() !== "");

      const parsedNodes = blocks.map((block) => {
        const getValue = (key) => {
          const line = block
            .split("\n")
            .find((l) => l.trim().startsWith(key));
          return line ? line.split(":")[1].trim() : "";
        };

        const desc = getValue("Description");
        const ip = getValue("IP Address");
        const isSuccessful =
          getValue("Last Ping Status") === "Succeeded";
        const ping = getValue("Last Ping Time") || "-";

        return {
          name: desc,
          ip,
          status: isSuccessful ? "ONLINE" : "TIMEOUT",
          ping,
        };
      });

      if (parsedNodes.length > 0) {
        processIncomingNodes(parsedNodes);
      }
    } catch (error) {
      console.error("Error fetching CSV:", error);
    }
  }, [processIncomingNodes]);

  // Initialize WebSocket connection
  useWebSocketPing(processIncomingNodes);

  // Fetch initial CSV data on component mount
  useEffect(() => {
    fetchPingDataFromCSV();
  }, [fetchPingDataFromCSV]);

  // Memoize filtered nodes to prevent unnecessary re-renders
  const filteredGroupedNodes = useMemo(() => {
    return filterNodesBySearchTerm(groupedNodes, searchTerm);
  }, [groupedNodes, searchTerm]);

  // Memoize search handler
  const handleSearchChange = useCallback(
    (e) => setSearchTerm(e.target.value),
    []
  );

  const handleSearchFocus = useCallback((e) => {
    e.target.style.borderColor = "var(--accent)";
  }, []);

  const handleSearchBlur = useCallback((e) => {
    e.target.style.borderColor = "var(--border)";
  }, []);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "4px",
      }}
    >
      {/* 🔍 Search Bar */}
      <input
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        placeholder="🔍 ค้นหาสนาม, ชื่ออุปกรณ์ หรือ IP Address..."
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          color: "var(--text-h)",
          fontSize: "14px",
          outline: "none",
          boxSizing: "border-box",
          transition: "all 0.3s ease",
        }}
      />

      {/* 📊 Cards grouped by stadium */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          width: "100%",
        }}
      >
        {Object.entries(filteredGroupedNodes).map(([name, devs]) => (
          <PingCard
            key={name}
            stadiumName={name}
            devices={devs}
            history={history}
          />
        ))}
      </div>

      {/* 📋 Event History */}
      <HistoryLog events={events} />
    </div>
  );
}