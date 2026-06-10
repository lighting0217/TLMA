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
        const newEvent = { time: new Date().toLocaleTimeString(), device: node.name, ip: node.ip, status: node.status };
        setEvents(prev => [newEvent, ...prev].slice(0, 50)); // เก็บ 50 เหตุการณ์ล่าสุด
    };

    return { history, events, updateStats, addEvent };
};