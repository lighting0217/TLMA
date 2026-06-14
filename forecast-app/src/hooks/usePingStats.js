import { useState, useRef } from 'react';

export const usePingStats = () => {
    const [history, setHistory] = useState({}); // { IP: [ping1, ping2, ...] }
    const [events, setEvents] = useState([]);   // ประวัติการล่ม [ {time, device, ip, status} ]

    const updateStats = (node) => {
        // อัปเดต History (เก็บย้อนหลัง 20 ค่า)
        setHistory(prev => ({
            ...prev,
            [node.ip]: [...(prev[node.ip] || []).slice(-19), parseFloat(node.ping) || 0]
        }));
    };

const addEvent = (node) => {
    // 📥 1. Checkpoint ดูขาเข้า: ดูว่ามีชื่อสนามหรือเลข Feed (เช่น group หรือ stadiumName) แนบมาด้วยไหม
    console.log("📥 [addEvent] ข้อมูลดิบขาเข้า (node):", node);

    const newEvent = { 
        ...node, 
        time: new Date().toLocaleTimeString(), 
        device: node.name, 
        ip: node.ip, 
        status: node.status 
    };

    // 📤 2. Checkpoint ดูขาออก: ดูว่า Object ที่ประกอบร่างเสร็จแล้ว มีโครงสร้างครบถ้วนพร้อมส่งต่อให้ HistoryLog หรือไม่
    console.log("📤 [addEvent] ข้อมูลที่แปลงเสร็จแล้วขาออก (newEvent):", newEvent);

    setEvents(prev => [newEvent, ...prev].slice(0, 50)); 
};

    return { history, events, updateStats, addEvent };
};