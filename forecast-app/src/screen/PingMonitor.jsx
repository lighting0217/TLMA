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

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "ONLINE", label: "Online" },
  { value: "TIMEOUT", label: "Timeout" },
];

export default function PingMonitor() {
  const { history, events, updateStats, addEvent } = usePingStats();
  const [groupedNodes, setGroupedNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastUpdated, setLastUpdated] = useState("");
  const prevStatus = useRef({});
  const allNodesRef = useRef({});

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const processIncomingNodes = useCallback(
    (parsedNodes) => {
      const normalizedNodes = parsedNodes
        .map(normalizeNode)
        .filter((node) => node !== null);

      if (normalizedNodes.length === 0) return;

      normalizedNodes.forEach((node) => {
        updateStats(node);

        const { isDowntime } = detectStatusChange(prevStatus.current, node);
        if (isDowntime) {
          addEvent(node);
          sendDowntimeNotification(node);
        }

        updatePrevStatusRef(prevStatus, node);
        allNodesRef.current[node.ip] = node;
      });

      cleanupOldStatusEntries(prevStatus, Object.keys(allNodesRef.current));
      setGroupedNodes(groupNodesByStadium(normalizedNodes));
      setLastUpdated(new Date().toLocaleTimeString());
    },
    [updateStats, addEvent]
  );

  const { isConnected } = useWebSocketPing(processIncomingNodes);

  const filteredGroupedNodes = useMemo(() => {
    const groupedBySearch = filterNodesBySearchTerm(groupedNodes, searchTerm);
    if (statusFilter === "ALL") return groupedBySearch;

    return Object.entries(groupedBySearch).reduce((acc, [stadium, devices]) => {
      const filtered = devices.filter((device) => device.status === statusFilter);
      if (filtered.length > 0) acc[stadium] = filtered;
      return acc;
    }, {});
  }, [groupedNodes, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const nodes = Object.values(groupedNodes).flat();
    const total = nodes.length;
    const online = nodes.filter((node) => node.status === "ONLINE").length;
    const timeout = total - online;

    return {
      total,
      online,
      timeout,
      groups: Object.keys(groupedNodes).length,
    };
  }, [groupedNodes]);

  const handleSearchChange = useCallback((e) => setSearchTerm(e.target.value), []);
  const handleClearSearch = useCallback(() => setSearchTerm(""), []);

  return (
    <div className="ping-monitor-root">
      <div className="ping-monitor-header">
        <div className="ping-monitor-heading">
          <h2>Network Ping Dashboard</h2>
          <p>Live overview of device health, outages, and search filters.</p>
        </div>

        <div className="ping-monitor-badges">
          <span
            className={`status-badge ${
              isConnected ? "status-online" : "status-offline"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <span className="status-info">
            Last update: {lastUpdated || "waiting..."}
          </span>
        </div>
      </div>

      <div className="ping-monitor-summary">
        <div className="ping-monitor-stat-card">
          <strong>{stats.total}</strong>
          <span>Total devices</span>
        </div>
        <div className="ping-monitor-stat-card">
          <strong>{stats.online}</strong>
          <span>Online devices</span>
        </div>
        <div className="ping-monitor-stat-card">
          <strong>{stats.timeout}</strong>
          <span>Timeout devices</span>
        </div>
        <div className="ping-monitor-stat-card">
          <strong>{stats.groups}</strong>
          <span>Stadium groups</span>
        </div>
      </div>

      <div className="ping-monitor-controls">
        <div className="search-wrapper">
          <input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="🔍 ค้นหาสนาม, ชื่ออุปกรณ์ หรือ IP Address..."
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-button"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          )}
        </div>

        <div className="filter-group">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-option ${
                statusFilter === option.value ? "active" : ""
              }`}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ping-monitor-cards">
        {Object.entries(filteredGroupedNodes).length === 0 ? (
          <div className="empty-state">
            ไม่มีอุปกรณ์ที่ตรงกับตัวกรองหรือคำค้นหา ปรับฟิลเตอร์หรือค้นหาอีกครั้ง.
          </div>
        ) : (
          Object.entries(filteredGroupedNodes).map(([name, devs]) => (
            <PingCard
              key={name}
              stadiumName={name}
              devices={devs}
              history={history}
            />
          ))
        )}
      </div>

      <HistoryLog events={events} />
    </div>
  );
}
