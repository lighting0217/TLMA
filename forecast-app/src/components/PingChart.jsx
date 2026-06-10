import { LineChart, Line } from 'recharts';

export default function PingChart({ data }) {
    // จำกัดข้อมูลไม่ให้กราฟดูแน่นเกินไป (แสดงแค่ 10-15 ค่าล่าสุด)
    const chartData = (data || []).slice(-15).map(val => ({ v: val }));
    
    return (
        <LineChart width={100} height={30} data={chartData}>
            <Line 
                type="monotone" 
                dataKey="v" 
                stroke="#38bdf8" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false} 
            />
        </LineChart>
    );
}