import React, { useState, useEffect, useRef } from "react";
import PingCard from "../components/PingCard";
import { usePingStats } from "../hooks/usePingStats";
import { CONFIG } from "../config";
import HistoryLog from "../components/HistoryLog";
// นำเข้า socket.io-client สำหรับดึงข้อมูลสด
import { io } from "socket.io-client"; 

// กำหนด URL สำหรับทดสอบในเครื่องคอมพิวเตอร์ของคุณ
const BACKEND_URL = "http://localhost:3000"; 

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
    const socketRef = useRef(null);

    // ฟังก์ชันจัดการข้อมูลที่ส่งมาจาก Node.js Backend ผ่านท่อ WebSocket
    const handleIncomingPingData = (parsedNodes) => {
        if (!parsedNodes || !Array.isArray(parsedNodes)) {
            console.warn("ข้อมูลที่รับมาไม่ได้อยู่ในรูปแบบ Array:", parsedNodes);
            return;
        }

        parsedNodes.forEach(node => {
            if (!node || !node.ip) return; // ป้องกันข้อมูลแถวที่ไม่สมบูรณ์

            updateStats(node);
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
            if (!node) return acc;
            const groupName = node.group || "ทั่วไป";
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(node);
            return acc;
        }, {});

        setGroupedNodes(grouped);
        setLoading(false);
    };

    // ทำการเชื่อมต่อ WebSocket ทันทีเมื่อเปิดหน้าจอเว็บนี้ขึ้นมา
    useEffect(() => {
        if (Notification.permission !== "granted") Notification.requestPermission();

        // ป้องกันการสลับท่อเชื่อมต่อซ้ำซ้อน
        if (!socketRef.current) {
            socketRef.current = io(BACKEND_URL, {
                transports: ['websocket'],
                autoConnect: true
            });

            // เปิดช่องรับ Event ชื่อ 'ping-update' จากฝั่งหลังบ้าน
            socketRef.current.on("ping-update", (data) => {
                console.log("Data received via Socket:", data);
                handleIncomingPingData(data); 
            });

            socketRef.current.on("connect", () => {
                console.log("Connected to Backend Socket successfully!");
            });
        }

        // สั่งปิดท่อเมื่อผู้ใช้งานปิดหน้าจอเว็บแอปนี้ไปจริงๆ เท่านั้น
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // ระบบค้นหาอุปกรณ์ (Filter) ดั้งเดิมของคุณ
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

    // ส่วนโครงสร้างหน้าจอแสดงผล HTML/JSX ดั้งเดิมทั้งหมดของคุณ
    return (
        <div style={{ padding: "20px", background: theme.bg, minHeight: "100vh" }}>
            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาอุปกรณ์ หรือ IP..."
                style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: theme.border,
                    background: theme.cardBg,
                    color: theme.textMain,
                    outline: "none",
                    marginBottom: "20px"
                }}
            />
            {loading ? (
                <div style={{ color: theme.textMuted, textAlign: "center", padding: "40px" }}>
                    กำลังเชื่อมต่อและโหลดข้อมูล Ping เรียลไทม์...
                </div>
            ) : (
                <div style={{ display: "grid", gap: "20px" }}>
                    {Object.entries(filteredGroupedNodes).map(([name, devs]) => (
                        <PingCard
                            key={name}
                            stadiumName={name}
                            devices={devs}
                            history={history}
                        />
                    ))}
                </div>
            )}
            <HistoryLog events={events} />
        </div>
    );
}
