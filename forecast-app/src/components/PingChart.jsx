import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function PingChart({ data, isOnline }) {
    const maxPoints = 20; 
    
    // 🛡️ ป้องกันบั๊กขั้นที่ 1: แปลงค่าในอาร์เรย์ให้เป็นตัวเลขที่ปลอดภัย (ถ้าไม่ใช่ตัวเลขให้แปลงเป็น 0)
    let cleanPoints = (data || []).map(val => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    });

    // 1. จัดการเคส Offline หรือไม่มีข้อมูลให้เป็นเส้นตรงสีแดงล่างสุด
    if (!isOnline || cleanPoints.length === 0) {
        cleanPoints = new Array(maxPoints).fill(0);
    } else if (cleanPoints.length < maxPoints) {
        // ถ้าข้อมูลยังไม่ครบ 20 จุด ให้เติมจุดแรกย้อนหลังไปให้เต็มกล่อง
        const fillCount = maxPoints - cleanPoints.length;
        const padding = new Array(fillCount).fill(cleanPoints[0]);
        cleanPoints = [...padding, ...cleanPoints];
    } else {
        cleanPoints = cleanPoints.slice(-maxPoints);
    }

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ Recharts เอาไปวาดได้
    const chartData = cleanPoints.map((val) => ({ v: val }));

    // 🛡️ ป้องกันบั๊กขั้นที่ 2: ดึงเฉพาะตัวเลขจริงๆ มาหาค่าสูงสุด เพื่อไม่ให้ Math.max คืนค่า NaN ออกมา
    const validNumbers = cleanPoints.filter(v => typeof v === 'number' && !isNaN(v));
    const maxPingInHistory = validNumbers.length > 0 ? Math.max(...validNumbers) : 10; 
    
    // 🧠 ตั้งเพดานแกน Y ให้สวิงขยับขึ้นลงได้สวยๆ ไม่ทะลุจอ (ถ้าคำนวณพลาดให้หลุดรอดที่สเกล 100)
    const yAxisUpperGoal = isNaN(maxPingInHistory) ? 100 : maxPingInHistory + 10;

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