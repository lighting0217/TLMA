# TLMA - Real-time Network Ping Monitor  
### (PingInfoView to React Cloud Agent)

TLMA (Total League Monitor Agent) คือระบบ **Local Agent สำหรับมอนิเตอร์สถานะเครือข่ายแบบ Real-time** ที่ออกแบบมาเพื่อเชื่อมระหว่างโปรแกรม Desktop อย่าง **NirSoft PingInfoView** กับระบบคลาวด์แอปพลิเคชัน (React + Node.js)

ระบบนี้ทำหน้าที่ประมวลผลข้อมูล Ping, จัดกลุ่มอุปกรณ์, แปลงโครงสร้างข้อมูล และส่งต่อขึ้น Cloud Backend ผ่าน WebSockets แบบ Real-time โดยไม่ต้องรีเฟรชหน้าเว็บ

---

## 🚀 Features

### 🔹 Auto-Group Configuration (Step 0)
- จัดกลุ่มอุปกรณ์อัตโนมัติตาม Feed และชื่อสนาม
- ใช้ PowerShell ในการ preprocess และสร้างไฟล์ hosts ใหม่
- รองรับโครงสร้างภาษาไทยแบบเต็มรูปแบบ

### 🔹 Smart Encoding Support (UTF-16 LE)
- รองรับภาษาไทย 100%
- แก้ปัญหาตัวอักษรเพี้ยน (mojibake)
- แปลงไฟล์ระหว่าง:
  - PingInfoView → UTF-16 LE
  - Node.js → UTF-8 (No BOM)

### 🔹 Automated Ping Execution (Step 1)
- สั่ง PingInfoView แบบ CLI
- รัน Ping แบบ background
- Export ผลลัพธ์เป็น raw text อัตโนมัติ

### 🔹 Data Parsing Engine (Step 2–3)
- แยกโครงสร้างข้อมูล:
  - Group (Feed)
  - Device Name
  - IP Address
  - Status
  - Latency
- แปลงเป็น JSON พร้อมใช้งาน

### 🔹 Real-time WebSocket Sync (Step 4)
- ส่งข้อมูลผ่าน `socket.io-client`
- อัปเดตทุก ~10 วินาที
- รองรับ Dashboard แบบ Real-time บน React

---

## 🏗️ System Architecture


Local Hosts File (UTF-16 LE)
│
▼
Step 0: PowerShell Pre-process
→ hosts_generated.txt
│
▼
Step 1: PingInfoView.exe
→ raw_ping.txt
│
▼
Step 2–3: PowerShell Parser
→ payload.json (UTF-8)
│
▼
Step 4: Node.js Socket Client
│
▼
Cloud Backend (Render)
https://tlma.onrender.com
│
▼
React Frontend Dashboard
→ Real-time Status Update (ONLINE / TIMEOUT)


---

## 📁 Directory Structure


C:
├── Test
│ ├── hosts_generated.txt
│ ├── raw_ping.txt
│ └── payload.json
│
├── Users\Wuttikorn
│ └── Downloads\Compressed\pinginfoview-x64-v3.25
│ ├── PingInfoView.exe
│ └── PingInfoView_hosts.txt
│
├── Documents\TLF\backend
│ └── node_modules
│ └── socket.io-client
│
└── ping_agent.bat


---

## 📝 Hosts Configuration Guide

ไฟล์:

C:\Users\Wuttikorn\Downloads\Compressed\pinginfoview-x64-v3.25\PingInfoView_hosts.txt


### 🔸 Format ตัวอย่าง


Feed 25 58.137.114.84 เลย ริเวอร์ไซด์ สเตเดียม#IPA
58.137.114.92 เลย ริเวอร์ไซด์ สเตเดียม#IPB
58.137.114.101 เลย ริเวอร์ไซด์ สเตเดียม#R1
58.137.114.102 เลย ริเวอร์ไซด์ สเตเดียม#R2

Feed 20 14.207.198.68 สนามยูนิฟ ฟุตบอลปาร์ค#IPA
14.207.207.36 สนามยูนิฟ ฟุตบอลปาร์ค#IPB
14.207.207.45 สนามยูนิฟ ฟุตบอลปาร์ค#R1
14.207.207.46 สนามยูนิฟ ฟุตบอลปาร์ค#R2


---

### ⚠️ Rules

- `Feed [number]` = เริ่มกลุ่มใหม่
- ทุกอุปกรณ์หลัง Feed จะอยู่ในกลุ่มเดียวกัน
- ใช้ `Space` แยก IP และชื่อ
- ใช้ `#` ระบุอุปกรณ์ (IPA, IPB, R1, R2)
- ข้อความก่อน `#` = ชื่อสนาม

---

## 📦 Prerequisites

- Windows 7 / 10 / 11
- Node.js LTS
- PowerShell (built-in)
- PingInfoView (NirSoft)

ติดตั้ง dependencies:

```bash
cd C:\Users\Wuttikorn\Documents\TLF\backend
npm install socket.io-client
🏃‍♂️ How to Run
สร้างไฟล์ ping_agent.bat
วางโค้ด automation script ลงไป
ดับเบิ้ลคลิกเพื่อเริ่มระบบ

ระบบจะรันวนลูป:

Step 0 → Step 1 → Step 2 → Step 3 → Step 4
✅ Success Message
Cloud Sync Status: Success via WebSockets connection!
📊 JSON Payload Format

ตัวอย่างข้อมูลที่ส่งไป Cloud:

[
  {
    "group": "Feed 25 - เลย ริเวอร์ไซด์ สเตเดียม",
    "name": "IPA",
    "ip": "58.137.114.84",
    "status": "TIMEOUT",
    "ping": "0"
  },
  {
    "group": "Feed 25 - เลย ริเวอร์ไซด์ สเตเดียม",
    "name": "IPB",
    "ip": "58.137.114.92",
    "status": "ONLINE",
    "ping": "15"
  }
]
⚠️ Troubleshooting
❌ ภาษาไทยเพี้ยน

สาเหตุ: ไฟล์ไม่ใช่ UTF-16 LE
วิธีแก้:

เปิดไฟล์ด้วย Notepad
Save As → Encoding: UTF-16 LE
❌ Cloud Sync Failed / Timeout

สาเหตุ:

อินเทอร์เน็ตหลุด
Render instance sleep

วิธีแก้:

รอ 50–60 วินาทีให้ server ตื่น
ลองใหม่รอบถัดไป
❌ หาโฟลเดอร์ไม่เจอ

สาเหตุ:

path ไม่ตรง
ไม่มี C:\Test

วิธีแก้:

สร้างโฟลเดอร์ C:\Test
ตรวจสอบ path ใน .bat script
📡 Summary

TLMA คือระบบ bridge ระหว่าง:

Desktop Ping Tool (PingInfoView)
Local Processing (PowerShell + Batch)
Cloud Backend (Node.js + Socket.io)
Frontend Dashboard (React)

เพื่อให้การ monitor network แบบสนามแข่งขันเป็น Real-time อย่างแท้จริง
