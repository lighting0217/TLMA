import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function PingChart({ data, isOnline }) {
    const maxPoints = 20; 
    let points = data ? [...data] : [];

    // 1. จัดการเคส Offline หรือไม่มีข้อมูลให้เป็นเส้นตรงสีแดงล่างสุด
    if (!isOnline || points.length === 0) {
        points = new Array(maxPoints).fill(0);
    } else if (points.length < maxPoints) {
        // ถ้าข้อมูลยังไม่ครบ 20 จุด ให้เติมจุดแรกย้อนหลังไปให้เต็มกล่อง
        const fillCount = maxPoints - points.length;
        const padding = new Array(fillCount).fill(points[0]);
        points = [...padding, ...points];
    } else {
        points = points.slice(-maxPoints);
    }

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ Recharts เอาไปวาดได้
    const chartData = points.map((val) => ({ v: val }));

    // 🧠 คำนวณหาค่า Ping ที่สูงที่สุดในประวัติชุดนี้ เพื่อเอาไปตั้งเพดานแกน Y ให้กราฟไม่ทะลุจอ
    const maxPingInHistory = Math.max(...points, 10); 
    const yAxisUpperGoal = maxPingInHistory + 10; // บวกเผื่อไว้ 10ms ให้มีช่องไฟด้านบนสวยๆ

    return (
        <div style={{ width: "100%", height: "36px", position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, bottom: 2, left: 0, right: 0 }}>
                    
                    {/* 🎯 แกน Y แบบปลดล็อก: เริ่มที่ 0 ถึงค่าสูงสุดที่ปิงเจอ บังคับให้กราฟขึ้นลงเห็นความสวิงชัดเจน */}
                    <YAxis hide domain={[0, isOnline ? yAxisUpperGoal : 100]} />
                    
                    <Line 
                        type="monotone" /* เส้นโค้งนุ่มนวลตามค่า ms */
                        dataKey="v" 
                        stroke={isOnline ? "#10b981" : "#f43f5e"} /* ออนไลน์เขียว / ออฟไลน์แดง */
                        strokeWidth={2} 
                        dot={false} /* ปิดจุดเพื่อความสะอาดตา */
                        isAnimationActive={false} /* ปิดอนิเมชันเพื่อให้กราฟอัปเดตเรียลไทม์ไม่หน่วงการ์ดจอ */
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}