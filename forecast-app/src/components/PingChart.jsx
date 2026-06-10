import { LineChart, Line } from 'recharts';

export default function PingChart({ data }) {
    const chartData = (data || []).slice(-15).map(val => ({ v: val }));
    
    return (
        <LineChart width={90} height = {28} data={chartData}>
            <Line 
                type="basis" /* เปลี่ยนเป็น basis เพื่อความโค้งมนสมูทแบบแอปเปิ้ลดีไซน์ */
                dataKey="v" 
                stroke="var(--accent)" /* ผูกกับสีหลักของระบบ */
                strokeWidth={1.8} 
                dot={false} 
                isAnimationActive={false} 
            />
        </LineChart>
    );
}