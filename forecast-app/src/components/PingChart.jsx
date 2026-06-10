import { LineChart, Line } from 'recharts';

export default function PingChart({ data }) {
    const chartData = (data || []).slice(-15).map(val => ({ v: val }));
    
return (
    <LineChart width={160} height={28} data={chartData}> {/* ปรับเพิ่มจาก 100 เป็น 160 */}
        <Line 
            type="basis" 
            dataKey="v" 
            stroke="var(--accent)" 
            strokeWidth={1.8} 
            dot={false} 
            isAnimationActive={false} 
        />
    </LineChart>
);
}