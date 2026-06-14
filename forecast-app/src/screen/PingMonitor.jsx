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

    // 🎯 ตัวประมวลผลข้อมูล: แกะฟอร์แมต จัดกลุ่มสนาม และทำระบบแจ้งเตือน Alert
    const processIncomingNodes = (parsedNodes) => {
        const normalizedNodes = parsedNodes.map(node => {
            // ถ้ารายการไหนมีเครื่องหมาย # ให้ทำการหั่นแบ่งสนามทันที
            if (node.name && node.name.includes("#")) {
                const [stadiumName, deviceName] = node.name.split("#");
                return {
                    ...node,
                    group: stadiumName.trim(),
                    name: deviceName.trim()
                };
            }
            // ถ้าไม่มี # แต่มี group อยู่แล้ว ให้ใช้ค่าเดิม หรือตกไปอยู่กลุ่มทั่วไป
            return {
                ...node,
                group: node.group ? node.group.trim() : "ทั่วไป"
            };
        });

        // นำข้อมูลที่จัดฟอร์แมตแล้วไปอัปเดตสถานะและแจ้งเตือน Alert
        normalizedNodes.forEach(node => {
            updateStats(node);
            
            // 🚨 จังหวะที่สถานะเปลี่ยนจาก ONLINE เป็น TIMEOUT (สัญญาณล่ม)
// 🚨 จังหวะที่สถานะเปลี่ยนจาก ONLINE เป็น TIMEOUT (สัญญาณล่ม)
if (prevStatus.current[node.ip] === "ONLINE" && node.status === "TIMEOUT") {
    
    // 🔥 ส่ง node ตัวเดิมที่มีข้อมูลดิบครบๆ เข้าไปตรงๆ เลย ไม่ต้องเอามาต่อสตริงเองแล้ว!
    addEvent(node);

    // 🔔 ถอด Logic มาจัดการสำหรับ Notification มุมขวาล่างให้สวยงามล้อไปกับระบบ
    let groupText = node.group.replace(/^[-\s]+/, "").trim(); 
    let feed = "XX";
    let stadium = groupText;

    const feedMatch = groupText.match(/feed\s*(\d+)/i);
    if (feedMatch) {
        feed = feedMatch[1]; 
        stadium = groupText.replace(/feed\s*\d+/i, "").replace(/^[-\s]+/, "").trim(); 
    }

    if (stadium && stadium !== "ทั่วไป" && !stadium.startsWith("สนาม")) {
        stadium = "สนาม" + stadium;
    }

    if (Notification.permission === "granted") {
        new Notification(`🏟️ Feed ${feed} ${stadium} Down!`, { 
            body: `🔴 Device: ${node.name} | IP: ${node.ip}`
        });
    }
}
            prevStatus.current[node.ip] = node.status;
        });

        // 🧠 จัดกลุ่มสนามแบบ Dynamic
        const grouped = normalizedNodes.reduce((acc, node) => {
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
                const ping = getValue("Last Ping Time") || "-";
                return { group: stadium, name: device, ip, status, ping };
            });
            if (parsedNodes.length > 0) processIncomingNodes(parsedNodes);
        } catch (error) { console.error("Error fetching CSV:", error); }
    };

    useEffect(() => {
        if (Notification.permission !== "granted") Notification.requestPermission();
        
        fetchPingDataFromCSV();

        const socket = io("https://tlma.onrender.com", { transports: ["websocket"] });
        
        socket.on("ping-update", (data) => {
            if (data && Array.isArray(data)) {
                processIncomingNodes(data);
            }
        });

        return () => { 
            socket.off("ping-update");
            socket.disconnect(); 
        };
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
            {/* 🔍 Search Bar */}
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
            
            {/* 📊 การ์ดแสดงผลแยกตามกลุ่มสนาม */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
                {Object.entries(filteredGroupedNodes).map(([name, devs]) => (
                    <PingCard key={name} stadiumName={name} devices={devs} history={history} />
                ))}
            </div>
            
            <HistoryLog events={events} />
        </div>
    );
}