// src/hooks/useFrontendTelemetry.js
import { useState, useRef, useEffect } from "react";

/**
 * 🧮 ฟังก์ชันแปลงหน่วยข้อมูล (Bytes -> KB -> MB)
 * ล็อกทศนิยมไว้ที่ 2 ตำแหน่งเพื่อความสวยงามสไตล์มอนิเตอร์ NOC
 */
const formatByteUnits = (bytes) => ({
    bytes: bytes,
    kb: (bytes / 1024).toFixed(2),
    mb: (bytes / (1024 * 1024)).toFixed(2)
});

export function useFrontendTelemetry() {
    const telemetryRef = useRef({
        totalFetches: 0,
        totalBytes: 0,
        lastFetchBytes: 0,
        perMinuteFetches: 0,
        perMinuteBytes: 0
    });

    // ปรับโครงสร้าง State ใหม่ให้แยกย่อยเป็นวัตถุที่มีทั้งหน่วย Bytes, KB และ MB
    const [telemetryData, setTelemetryData] = useState({
        totalFetches: 0,
        perMinuteFetches: 0,
        total: formatByteUnits(0),
        perMinute: formatByteUnits(0),
        lastFetch: formatByteUnits(0)
    });

    // ยุบลอจิกการอัปเดตสถานะ State ออกมาเป็นฟังก์ชันกลาง
    const updateTelemetryState = () => {
        setTelemetryData({
            totalFetches: telemetryRef.current.totalFetches,
            perMinuteFetches: telemetryRef.current.perMinuteFetches,
            total: formatByteUnits(telemetryRef.current.totalBytes),
            perMinute: formatByteUnits(telemetryRef.current.perMinuteBytes),
            lastFetch: formatByteUnits(telemetryRef.current.lastFetchBytes)
        });
    };

    const trackFetch = (bytes) => {
        telemetryRef.current.totalFetches += 1;
        telemetryRef.current.perMinuteFetches += 1;
        telemetryRef.current.totalBytes += bytes;
        telemetryRef.current.perMinuteBytes += bytes;
        telemetryRef.current.lastFetchBytes = bytes;

        // อัปเดต UI ทุกๆ 3 รอบการ Fetch
        if (telemetryRef.current.totalFetches % 3 === 0) {
            updateTelemetryState();
        }
    };

    useEffect(() => {
        const tInterval = setInterval(() => {
            const snap = {
                ts: new Date().toISOString(),
                totalFetches: telemetryRef.current.totalFetches,
                totalBytes: telemetryRef.current.totalBytes,
                perMinuteFetches: telemetryRef.current.perMinuteFetches,
                perMinuteBytes: telemetryRef.current.perMinuteBytes,
                lastFetchBytes: telemetryRef.current.lastFetchBytes
            };
            
            try {
                const key = 'tlma_frontend_telemetry';
                const arr = JSON.parse(localStorage.getItem(key) || '[]');
                arr.push(snap);
                if (arr.length > 120) arr.splice(0, arr.length - 120);
                localStorage.setItem(key, JSON.stringify(arr));
            } catch (e) {
                // ignore storage errors
            }
            
            console.log('[Frontend Telemetry]', snap);

            // ล้างค่านับรายนาที
            telemetryRef.current.perMinuteFetches = 0;
            telemetryRef.current.perMinuteBytes = 0;
            
            // อัปเดตหลังจากเคลียร์รอบนาที
            updateTelemetryState();
        }, 60 * 1000);

        return () => clearInterval(tInterval);
    }, []);

    return {
        telemetry: telemetryData,
        trackFetch
    };
}