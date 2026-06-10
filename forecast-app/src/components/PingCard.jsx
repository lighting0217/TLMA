// src/components/PingCard.jsx
import DeviceRow from "./DeviceRow";

export default function PingCard({ stadiumName, devices, history }) { 
    return (
        <div style={{ background: "rgba(30, 41, 59, 0.4)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ padding: "15px", fontWeight: "bold" }}>🏟️ {stadiumName}</div>
            {devices.map((dev, i) => (
                <DeviceRow
                    key={i}
                    device={dev}
                    history={history}
                />
            ))}        
        </div>
    );
}