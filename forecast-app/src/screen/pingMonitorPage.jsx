import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import PingCard from "../components/PingCard";
import { usePingStats } from "../hooks/usePingStats";
import HistoryLog from "../components/HistoryLog";
import { useWebSocketPing } from "../hooks/useWebSocketPing";
import { useFrontendTelemetry } from "../hooks/useFrontendTelemetry";
import { STATUS_OPTIONS } from "../utils/constants";
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
export default function PingMonitor({ theme }) {
  const { history, events, updateStats, addEvent } = usePingStats();
  const [groupedNodes, setGroupedNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastUpdated, setLastUpdated] = useState("");
  
  const prevStatus = useRef({});
  const allNodesRef = useRef({});
  
  const { telemetry } = useFrontendTelemetry();

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
    <div className="ping-monitor-root" style={{ color: theme?.title }}>
      <div className="ping-monitor-header">
        <div className="ping-monitor-heading">
          <h2>📡 Network Monitor</h2>
          <p style={{ color: theme?.stadium }}>
            Lastmile network Status Monitor
          </p>
        </div>

        <div className="ping-monitor-badges">
          {/* 🎯 [FIXED] ย้ายสไตล์กลับเข้ามาอยู่ใน Attribute และแสดงข้อความสถานะให้ถูกต้อง */}
          <span
            className={`status-badge ${
              isConnected ? "status-online" : "status-offline"
            }`}
            style={{
              background: isConnected
                ? (theme?.online || "#22c55e") + "20"
                : (theme?.offline || "#ef4444") + "20",
              color: isConnected ? theme?.online : theme?.offline,
              padding: "4px 8px",
              borderRadius: "6px",
              fontWeight: "bold"
            }}
          >
            {isConnected ? "● Connected" : "○ Disconnected"}
          </span>
          <span className="status-info" style={{ color: theme?.stadium }}>
            Last update: {lastUpdated || "waiting..."}
          </span>
        </div>
      </div>

      <div className="ping-monitor-summary">
        <div className="ping-monitor-stat-card" style={{ background: theme?.cardBg, border: `1px solid ${theme?.cardBorder}` }}>
          <strong>{stats.total}</strong>
          <span style={{ color: theme?.label }}>อุปกรณ์ทั้งหมด</span>
        </div>
        <div className="ping-monitor-stat-card" style={{ background: theme?.cardBg, border: `1px solid ${theme?.cardBorder}` }}>
          <strong style={{ color: theme?.success }}>{stats.online}</strong>
          <span style={{ color: theme?.label }}>ออนไลน์</span>
        </div>
        <div className="ping-monitor-stat-card" style={{ background: theme?.cardBg, border: `1px solid ${theme?.cardBorder}` }}>
          <strong style={{ color: theme?.danger }}>{stats.timeout}</strong>
          <span style={{ color: theme?.label }}>ขาดการเชื่อมต่อ</span>
        </div>
        <div className="ping-monitor-stat-card" style={{ background: theme?.cardBg, border: `1px solid ${theme?.cardBorder}` }}>
          <strong>{stats.groups}</strong>
          <span style={{ color: theme?.label }}>สนามทั้งหมด</span>        
        </div>
      </div>

      {/* 🎯 [TELEMETRY PANEL] ผูกสีเข้ากับ Theme Object เรียบร้อย สลับธีมแล้วสีจะเปลี่ยนตาม */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '16px 0' }}>
        <div style={{ fontSize: 12, color: theme?.telemetryText || theme?.label, textAlign: 'left', lineHeight: '1.4' }}>
          📡 <strong>Fetches:</strong> {telemetry?.totalFetches || 0} ครั้ง | 
          💾 <strong>Total Data:</strong> {telemetry?.total?.mb || 0} MB | 
          ⚡ <strong>Last File:</strong> {telemetry?.lastFetch?.kb || 0} KB <br/>
          ⏱️ <strong>Traffic/min:</strong> {telemetry?.perMinute?.kb || 0} KB ({telemetry?.perMinute?.mb || 0} MB)
        </div>
        <button 
          onClick={() => {
            try {
              const key = 'tlma_frontend_telemetry';
              const arr = JSON.parse(localStorage.getItem(key) || '[]');
              const w = window.open('', '_blank');
              if (w) {
                w.document.open();
                w.document.write(`<pre style="font-family: monospace; padding: 20px;">${JSON.stringify(arr.slice(-50), null, 2)}</pre>`);
                w.document.close();
              } else {
                console.warn('Popup blocked by browser');
                alert("Please allow pop-ups to view raw logs.");
              }
            } catch (e) { 
              console.warn('Cannot show telemetry', e); 
            }
          }} 
          style={{ 
            fontSize: 12, 
            padding: '8px 12px', 
            borderRadius: 8, 
            cursor: 'pointer', 
            background: theme?.btnBg || 'transparent', 
            border: `1px solid ${theme?.btnBorder || theme?.cardBorder}`, 
            color: theme?.btnTxt || theme?.value 
          }}
        >
          View Raw Logs
        </button>
      </div>

      <div className="ping-monitor-controls">
        <div className="search-wrapper">
          <input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="🔍 ค้นหาสนาม, ชื่ออุปกรณ์ หรือ IP Address..."
            style={{
              background: theme?.inputBg,
              border: `1px solid ${theme?.inputBorder}`,
              color: theme?.inputColor,
            }}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-button"
              onClick={handleClearSearch}
              style={{ color: theme?.accent }}
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
              style={{
                background: statusFilter === option.value ? theme?.btnActive : theme?.btnBg,
                borderColor: statusFilter === option.value ? theme?.btnActiveBorder : theme?.btnBorder,
                color: statusFilter === option.value ? theme?.btnActiveTxt : theme?.btnTxt,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ping-monitor-cards">
        {Object.entries(filteredGroupedNodes).length === 0 ? (
          <div className="empty-state" style={{ color: theme?.emptyText, background: theme?.cardBg, border: `1px solid ${theme?.cardBorder}`, padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
            ไม่มีอุปกรณ์ที่ตรงกับตัวกรองหรือคำค้นหา ปรับฟิลเตอร์หรือค้นหาอีกครั้ง.
          </div>
        ) : (
          Object.entries(filteredGroupedNodes).map(([name, devs]) => (
            <PingCard
              key={name}
              stadiumName={name}
              devices={devs}
              history={history}
              theme={theme} // ส่งผ่าน theme ไปยังการ์ดย่อย
            />
          ))
        )}
      </div>

      <HistoryLog events={events} theme={theme} />
    </div>
  );
}