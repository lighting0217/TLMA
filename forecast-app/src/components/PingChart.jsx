import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function PingChart({ data, isOnline }) {
    // กำหนดให้มี 20 จุดข้อมูลบนหน้าจอ เพื่อความละเอียดและยาวสะใจชนขอบพอดี
    const maxPoints = 20; 
    let points = data ? [...data] : [];

    // 🧠 ระบบอัจฉริยะ Auto-Padding: บังคับให้กราฟยาวเต็มขอบตลอดเวลา ไม่ว่าจะพึ่งเปิดเว็บบอร์ดหรือกำลัง Offline
    if (!isOnline || points.length === 0) {
        // ถ้า Offline หรือไม่มีข้อมูล ให้ทำเป็นเส้น Flatline (ราบเรียบขนานก้นกล่อง) ยาวเต็มขอบพาดผ่านสายตา
        points = new Array(maxPoints).fill(0);
    } else if (points.length < maxPoints) {
        // ถ้าพึ่งเปิดหน้าเว็บ ข้อมูลยังไม่ครบ 20 จุด ให้เติมจุดแรกย้อนหลังไปในอดีตจนเต็มขอบซ้าย
        const fillCount = maxPoints - points.length;
        const padding = new Array(fillCount).fill(points[0]);
        points = [...padding, ...points];
    } else {
        // ถ้าข้อมูลไหลมาเยอะแล้ว ให้ตัดเอาเฉพาะ 20 ค่าล่าสุดมาแสดงผล
        points = points.slice(-maxPoints);
    }

    const chartData = points.map((val) => ({ v: val }));

    return (
        <div style={{ width: "100%", height: "32px", position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                    {/* ตั้งค่าแกน Y ให้สมดุล: ถ้าออฟไลน์ให้เส้นอยู่ล่างสุดพอดิบพอดี ไม่ลอยเคว้งคว้าง */}
                    <YAxis hide domain={isOnline ? ['auto', 'auto'] : [0, 100]} />
                    <Line 
                        type="monotone" 
                        dataKey="v" 
                        stroke={isOnline ? "#10b981" : "#f43f5e"} /* ออนไลน์ไฟเขียววิ่ง / ออฟไลน์เส้นนิ่งสีแดง */
                        strokeWidth={2} 
                        dot={false} /* ปิดจุดกลมทิ้งไป เพื่อให้เส้นยาวเรียบเนียนสไตล์ Enterprise */
                        isAnimationActive={false} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}