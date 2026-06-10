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
app.use(express.json()); // เปิดระบบให้รองรับการรับข้อมูลแบบ JSON (สำหรับยิงขึ้นคลาวด์)

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

// กำหนดตำแหน่งไฟล์ CSV สำหรับตอนรันเทสบนคอมตัวเอง (ถ้าขึ้นคลาวด์ Render มันจะสลับไปโหมดรับค่าจาก API แทนอัตโนมัติ)
const localCsvPath = 'C:\\Users\\Wuttikorn\\Documents\\TLF\\forecast-app\\public\\ping_result.csv';

const parsePingCSV = () => {
    try {
        if (!fs.existsSync(localCsvPath)) {
            // ถ้ารันบน Render แล้วไม่มีไฟล์นี้ ให้ส่งข้อมูลล่าสุดที่มีคนยิงผ่าน API เข้ามาไปแสดงแทน
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
            const ping = getValue("Last Ping Time") || "0";

            return { group: stadium?.trim(), name: device?.trim(), ip, status, ping };
        });

        // บันทึกลงหน่วยความจำกลาง
        globalPingData = parsedNodes;
        return parsedNodes;
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอ่านไฟล์ CSV:", error);
        return globalPingData;
    }
};

// ==========================================
// [เพิ่มช่องทางนี้เข้ามา] เปิดช่อง API พิเศษสำหรับระบบออนไลน์บน Render
// เพื่อให้คุณเขียนสคริปต์ส่ง (POST) ข้อมูลจากคอมขึ้นไปฝากกระจายข่าวบน Cloud ได้
app.post('/api/sync-ping', (req, res) => {
    if (Array.isArray(req.body)) {
        globalPingData = req.body;
        
        // [เพิ่มบรรทัดนี้] ตะโกนส่งสัญญาณพร้อมข้อมูลชุดใหม่ล่าสุดออกไปหาหน้าเว็บ Vercel ทุกเครื่องทันที!
        io.emit('ping-update', globalPingData); 
        
        console.log(`[Cloud Sync] ได้รับข้อมูลใหม่ 9 รายการ และกระจายสัญญาณไปหา Frontend แล้ว`);
        return res.status(200).json({ status: "success", message: "Data synced to cloud successfully" });
    }
    return res.status(400).json({ status: "error", message: "Invalid data format" });
});



app.get('/', (req, res) => {
    res.send('TLMA Backend Server is Active 🚀');
});
// ==========================================

io.on('connection', (socket) => {
    console.log('Frontend เชื่อมต่อเข้ามาแล้ว:', socket.id);

    // 1. ส่งข้อมูลล่าสุดให้ทันทีที่ต่อเข้ามา
    socket.emit('ping-update', globalPingData.length > 0 ? globalPingData : parsePingCSV());

    // 2. ตั้งเวลาลูปให้อ่านไฟล์ (จะทำงานได้ต่อเนื่องเฉพาะตอนรันหลังบ้านบนคอมตัวเอง)
    const intervalId = setInterval(() => {
        const updatedData = parsePingCSV();
        if (updatedData && updatedData.length > 0) {
            socket.emit('ping-update', updatedData);
        }
    }, 2000); 

    socket.on('disconnect', () => {
        clearInterval(intervalId);
        console.log('Frontend ตัดการเชื่อมต่อ');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Backend ระบบแชร์ข้อมูล Ping รันสำเร็จที่พอร์ต: ${PORT}`));
