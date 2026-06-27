const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// ปล่อยให้รับ Request ได้จากทั้งหน้าเว็บ Vercel ของคุณ และให้คอมคุณยิง API ขึ้นมาส่งข้อมูลได้
app.use(cors({
    origin: ["https://tlma-eosin.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"]
}));
app.use(express.json()); // เปิดระบบให้รองรับการรับข้อมูลแบบ JSON

const server = http.createServer(app);

// ตั้งค่าสำหรับ Socket.io รองรับ Vercel และ Localhost
const io = new Server(server, {
    cors: {
        origin: ["https://tlma-eosin.vercel.app", "http://localhost:5173"], 
        methods: ["GET", "POST"]
    }
});

// ตัวแปรตรงกลางสำหรับฝากความทรงจำข้อมูล Ping ล่าสุดไว้บนแรมของเซิร์ฟเวอร์
let globalPingData = [];

// ตัวแปรสำหรับบันทึกเวลาล่าสุดที่ได้รับการอัปเดตจาก Agent (ใช้เช็กเวลา Agent ปิดตัวลง)
let lastAgentSeen = Date.now(); 

// กำหนดตำแหน่งไฟล์ CSV สำหรับตอนรันเทสบนคอมตัวเอง
const localCsvPath = 'C:\\Users\\Wuttikorn\\Documents\\TLF\\forecast-app\\public\\ping_result.csv';

// ฟังก์ชันสำหรับจัดการอัปเดตสเตตในแรมและบันทึกเวลาที่ได้รับข้อมูล
const updatePingDataMemory = (newData) => {
    if (Array.isArray(newData) && newData.length > 0) {
        globalPingData = newData;
        lastAgentSeen = Date.now(); // ประทับตราเวลาล่าสุดที่ระบบได้รับข้อมูลสดๆ
    }
};

const parsePingCSV = () => {
    try {
        if (!fs.existsSync(localCsvPath)) {
            // ถ้ารันบน Render แล้วไม่มีไฟล์นี้ ให้ส่งข้อมูลล่าสุดที่มีคนยิงเข้าแรมไปแสดงแทน
            return globalPingData;
        }

        const text = fs.readFileSync(localCsvPath, 'utf-8');
        const blocks = text.split(/={30,}/).filter(b => b.trim() !== "");

        const parsedNodes = blocks.map(block => {
            const getValue = (key) => {
                const line = block.split('\n').find(l => l.trim().startsWith(key));
                if (line && line.includes(':')) {
                    const parts = line.split(':');
                    return parts.slice(1).join(':').trim(); 
                }
                return "";
            };

            const desc = getValue("Description") || "ทั่วไป#อุปกรณ์";
            const ip = getValue("IP Address") || "0.0.0.0";
            
            const [stadium, device] = desc.includes("#") ? desc.split("#") : ["ทั่วไป", desc];
            const status = getValue("Last Ping Status") === "Succeeded" ? "ONLINE" : "TIMEOUT";
            const ping = getValue("Last Ping Time") || "-";

            return { group: stadium?.trim(), name: device?.trim(), ip, status, ping };
        });

        // บันทึกลงหน่วยความจำกลางพร้อมเก็บเวลา
        updatePingDataMemory(parsedNodes);
        return parsedNodes;
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอ่านไฟล์ CSV:", error);
        return globalPingData;
    }
};

// ==========================================
// [ช่องทางที่ 1] เปิดช่อง API พิเศษสำหรับระบบออนไลน์บน Render (ส่งผ่าน HTTP POST)
app.post('/api/sync-ping', (req, res) => {
    if (Array.isArray(req.body)) {
        // อัปเดตลงหน่วยความจำเซิร์ฟเวอร์
        updatePingDataMemory(req.body);
        
        // ตะโกนส่งสัญญาณพร้อมข้อมูลชุดใหม่ล่าสุดออกไปหาหน้าเว็บ Vercel ทุกเครื่องทันที!
        io.emit('ping-update', globalPingData); 
        
        console.log(`[Cloud Sync via POST] ได้รับข้อมูลใหม่ ${req.body.length} รายการ และกระจายสัญญาณไปหา Frontend แล้ว`);
        return res.status(200).json({ status: "success", message: "Data synced to cloud successfully" });
    }
    return res.status(400).json({ status: "error", message: "Invalid data format" });
});

app.get('/', (req, res) => {
    res.send('TLMA Backend Server is Active 🚀');
});

// 🔥 กลไกพิเศษ: ตัวตรวจจับข้อมูลค้าง (Stale Data Checker)
setInterval(() => {
    // 1. ขยายเวลาเป็น 120 วินาที เพื่อเผื่อเวลาประมวลผลของ 33 รายการ
    const STALE_TIMEOUT = 120000; 
    const isProduction = process.env.PORT !== undefined && process.env.PORT != "3000";

    if (isProduction && globalPingData.length > 0 && (Date.now() - lastAgentSeen > STALE_TIMEOUT)) {
        // แทนที่จะสั่ง TIMEOUT ทั้งหมดทันที
        // ให้เช็คแค่ว่าถ้าข้อมูลชุดสุดท้าย "เก่าเกินไป" จริงๆ ค่อยปรับ
        console.log(`[Stale Detector] ข้อมูลขาดช่วงเกิน 2 นาที ปรับสถานะ...`);     
        // แปลงข้อมูลในแรมทั้งหมดให้เป็นตัวแดง / TIMEOUT
        globalPingData = globalPingData.map(host => ({
            ...host,
            status: 'TIMEOUT',
            ping: '-'
        }));

        // ส่งแจ้งหน้าจอให้เปลี่ยนสถานะทันที
        io.emit('ping-update', globalPingData);
    }
}, 5000); // วนลูปเช็กทุกๆ 5 วินาที

io.on('connection', (socket) => {
    console.log('มีการเชื่อมต่อเข้ามาใหม่จาก Client:', socket.id);

    // 1. 🔥 ส่งข้อมูลล่าสุดในแรมที่มีอยู่ให้หน้าจอทันทีเมื่อเชื่อมต่อสำเร็จ (แก้ปัญหาเปิดเว็บมาแล้วจอว่างเพื่อรอรอบถัดไป)
    socket.emit('ping-update', globalPingData);

    // 2. [ช่องทางที่ 2] ท่อพิเศษเปิดรับข้อมูลตรงจากคอมพิวเตอร์ผ่าน WebSocket (กรณีรัน Agent แบบ Socket)
    socket.on('client-ping-sync', (data) => {
        if (Array.isArray(data)) {
            updatePingDataMemory(data);
            // สะท้อนยิงต่อออกไปหาหน้าเว็บ Vercel ทุกเครื่องทันทีแบบ Real-time
            io.emit('ping-update', globalPingData);
            console.log(`[Socket Sync] ซิงค์ข้อมูลสดสำเร็จจำนวน ${data.length} รายการ จากคอมพิวเตอร์`);
        }
    });

    // โหมดอ่านไฟล์เครื่องตัวเอง (รันเทสเฉพาะบน localhost พอร์ต 3000 หรือเมื่อไม่มีการตั้งพอร์ตสภาวะแวดล้อม)
    let intervalId = null;
    if (process.env.PORT === undefined || process.env.PORT == "3000") {
        // ดึงข้อมูลครั้งแรกทันทีที่ต่อเสร็จเพื่อความรวดเร็วบน Local
        const initialLocalData = parsePingCSV();
        if (initialLocalData && initialLocalData.length > 0) {
            socket.emit('ping-update', initialLocalData);
        }

        intervalId = setInterval(() => {
            const updatedData = parsePingCSV();
            if (updatedData && updatedData.length > 0) {
                socket.emit('ping-update', updatedData);
            }
        }, 2000);
    }

    socket.on('disconnect', () => {
        if (intervalId) clearInterval(intervalId);
        console.log('Client ตัดการเชื่อมต่อ:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Backend ระบบแชร์ข้อมูล Ping รันสำเร็จที่พอร์ต: ${PORT}`));