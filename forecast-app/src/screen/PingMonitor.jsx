import React, { useState, useEffect, useRef } from "react";
import PingCard from "../components/PingCard";
import { usePingStats } from "../hooks/usePingStats";
import { CONFIG } from "../config";
import HistoryLog from "../components/HistoryLog";
// ⚡ นำเข้า socket อินสแตนซ์ของคุณ (ปรับเปลี่ยน Path ตามที่คุณประกาศเซ็ตตัวแปรไว้)
// สมมติว่าถูกประกาศไว้ที่ src/config/socket.js หรือใช้ io() โดยตรง
import io from "socket.io-client"; 

const theme = {
    bg: "#020617",
    cardBg: "rgba(30, 41, 59, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    textMain: "#E2E8F0",
    textMuted: "#64748B",
    accent: "#38bdf8",
    success: "#10b981",
    danger: "#ef4444"
};

export default function PingMonitor() {
    const { history, events, updateStats, addEvent } = usePingStats();
    const [groupedNodes, setGroupedNodes] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const prevStatus = useRef({});

    // ⚙️ ฟังก์ชันส่วนกลางสำหรับประมวลผลข้อมูลนิวเคลียสปิง (ใช้ร่วมกันทั้ง CSV และ Socket)
    const processIncomingNodes = (parsedNodes) => {
        parsedNodes.forEach(node => {
            // ส่งไปอัปเดตกราฟ/สถิติย้อนหลังใน Hook
            updateStats(node);

            // ตรวจจับสถานะล่มเพื่อแจ้งเตือนระบบ (DOWN Alert)
            if (prevStatus.current[node.ip] === "ONLINE" && node.status === "TIMEOUT") {
                addEvent(node);
                if (Notification.permission === "granted") {
                    new Notification(`Alert: ${node.name} is DOWN!`, { body: `IP: ${node.ip}` });
                }
            }
            prevStatus.current[node.ip] = node.status;
        });

        // จัดกลุ่มข้อมูลแยกตามรายชื่อสนาม
        const grouped = parsedNodes.reduce((acc, node) => {
            if (!acc[node.group]) acc[node.group] = [];
            acc[node.group].push(node);
            return acc;
        }, {});

        setGroupedNodes(grouped);
        setLoading(false);
    };

    // 1. ดึงข้อมูลจาก CSV (สำหรับทำงานตอนโหลดหน้าเว็บแรกเริ่ม)
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

            if (parsedNodes.length > 0) {
                processIncomingNodes(parsedNodes);
            }
        } catch (error) { console.error("Error fetching local CSV:", error); }
    };

    useEffect(() => {
        if (Notification.permission !== "granted") Notification.requestPermission();
        
        // รันข้อมูลดั้งเดิมจาก CSV ตั้งต้นก่อนหนึ่งรอบ
        fetchPingDataFromCSV();

        // 2. ⚡ เชื่อมต่อระบบท่อส่งข้อมูลผ่าน WebSockets ไปยัง Render Cloud
        const socket = io("https://tlma.onrender.com", { transports: ["websocket"] });

        socket.on("connect", () => {
            console.log("Connected to Backend Socket successfully!");
        });

        // ดักจับ Event ข้อมูลสดที่ส่งมาจากหลังบ้าน (เปลี่ยนชื่อ Event ให้ตรงกับตัวที่หลังบ้านปล่อยมา เช่น 'server-ping-broadcast')
        socket.on("server-ping-broadcast", (data) => {
            console.log("Data received via Socket:", data);
            if (data && Array.isArray(data)) {
                processIncomingNodes(data); // โยนอาเรย์ที่ได้เข้าฟังก์ชันสกัดและอัปเดตหน้าจอทันที!
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // ระบบค้นหา (Filter)
    const filteredGroupedNodes = Object.entries(groupedNodes).reduce((acc, [stadium, devices]) => {
        const term = searchTerm.toLowerCase().trim();
        const filtered = devices.filter(d =>
            d.name.toLowerCase().includes(term) ||
            d.ip.toLowerCase().includes(term) ||
            stadium.toLowerCase().includes(term)
        );
        if (filtered.length > 0) acc[stadium] = filtered;
        return acc;
    }, {});

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาอุปกรณ์ หรือ IP..."
                style={{
                    width: "100%",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    border: theme.border,
                    background: theme.cardBg,
                    color: theme.textMain,
                    outline: "none",
                    boxSizing: "border-box"
                }}
            />
            
            {/* ── GRID CONTAINER ปรับสัดส่วนยืดหดเต็มหน้าจอด้านขวา ── */}
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", 
                gap: "20px",
                width: "100%"
            }}>
                {Object.entries(filteredGroupedNodes).map(([name, devs]) => (
                    <PingCard
                        key={name}
                        stadiumName={name}
                        devices={devs}
                        history={history}
                    />
                ))}
            </div>
            
            <HistoryLog events={events} />
        </div>
    );
}