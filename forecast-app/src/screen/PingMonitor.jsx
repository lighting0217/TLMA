import React, { useState, useEffect, useRef } from "react";
import PingCard from "../components/PingCard";
import { usePingStats } from "../hooks/usePingStats";
import HistoryLog from "../components/HistoryLog";
import io from "socket.io-client"; 

export default function PingMonitor() {
    const { history, events, updateStats, addEvent } = usePingStats();
    const [groupedNodes, setGroupedNodes] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const prevStatus = useRef({});

    const processIncomingNodes = (parsedNodes) => {
        parsedNodes.forEach(node => {
            updateStats(node);
            if (prevStatus.current[node.ip] === "ONLINE" && node.status === "TIMEOUT") {
                addEvent(node);
                if (Notification.permission === "granted") {
                    new Notification(`Alert: ${node.name} is DOWN!`, { body: `IP: ${node.ip}` });
                }
            }
            prevStatus.current[node.ip] = node.status;
        });

        const grouped = parsedNodes.reduce((acc, node) => {
            if (!acc[node.group]) acc[node.group] = [];
            acc[node.group].push(node);
            return acc;
        }, {});
        setGroupedNodes(grouped);
    };

    const fetchPingDataFromCSV = async () => {
        try {
            const response = await fetch(`/ping_result.csv?t=${new Date().getTime()}`);
            if (!response.ok) return;
            const text = await response.text();
            const blocks = text.split(/={30,}/).filter(b => b.trim() !== "");
            const parsedNodes = blocks.map(block => {
                const getValue = (key) => {
                    const line = block.split('\n').find(l => l.trim().startsWith(key));
                    return line ? line.split(':')[1].trim() : "";
                };
                const desc = getValue("Description");
                const ip = getValue("IP Address");
                const [stadium, device] = desc.includes("#") ? desc.split("#") : ["ทั่วไป", desc];
                const status = getValue("Last Ping Status") === "Succeeded" ? "ONLINE" : "TIMEOUT";
                const ping = getValue("Last Ping Time") || "0";
                return { group: stadium, name: device, ip, status, ping };
            });
            if (parsedNodes.length > 0) processIncomingNodes(parsedNodes);
        } catch (error) { console.error("Error fetching CSV:", error); }
    };

    useEffect(() => {
        if (Notification.permission !== "granted") Notification.requestPermission();
        fetchPingDataFromCSV();
        const socket = io("https://tlma.onrender.com", { transports: ["websocket"] });
        socket.on("server-ping-broadcast", (data) => {
            if (data && Array.isArray(data)) processIncomingNodes(data);
        });
        return () => { socket.disconnect(); };
    }, []);

    const filteredGroupedNodes = Object.entries(groupedNodes).reduce((acc, [stadium, devices]) => {
        const term = searchTerm.toLowerCase().trim();
        const filtered = devices.filter(d =>
            d.name.toLowerCase().includes(term) || d.ip.toLowerCase().includes(term) || stadium.toLowerCase().includes(term)
        );
        if (filtered.length > 0) acc[stadium] = filtered;
        return acc;
    }, {});

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px", padding: "4px" }}>
            {/* 🔍 Search Bar สไตล์ล้ำๆ */}
            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
            
            {/* 🎛️ ปรับกริดให้เหมาะสม กว้างขึ้น ไม่บีบตัวอักษรแตก */}
<div style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    width: "100%"
}}>
    {Object.entries(filteredGroupedNodes).map(([name, devs]) => (
        <div key={name} style={{ width: "100%" }}>
            <PingCard
                stadiumName={name}
                devices={devs}
                history={history}
            />
        </div>
    ))}
</div>
            
            <HistoryLog events={events} />
        </div>
    );
}