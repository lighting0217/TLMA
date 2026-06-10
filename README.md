# 📡 TLMA - Real-time Network Ping Monitor  
### (PingInfoView to React Cloud Agent)

**TLMA** คือระบบ **Local Agent สำหรับมอนิเตอร์สถานะเครือข่ายแบบ Real-time** ที่ออกแบบมาเพื่อเชื่อมโยงการทำงานระหว่างซอฟต์แวร์เดสก์ท็อปอย่าง **NirSoft PingInfoView** เข้ากับระบบคลาวด์แอปพลิเคชัน (React + Node.js)

ระบบนี้จะทำหน้าที่ประมวลผลข้อมูลการ Ping, จัดกลุ่มอุปกรณ์แยกตามพื้นที่, แปลงโครงสร้างข้อมูลให้อยู่ในฟอร์แมตมาตรฐาน และส่งต่อขึ้นไปยัง Cloud Backend ผ่านโปรโตคอล WebSockets แบบทันที ช่วยให้หน้าเว็บอัปเดตสถานะได้ตลอดเวลาโดยไม่ต้องกดรีเฟรช

---

## 🚀 Features

### 🔹 Auto-Group Configuration (Step 0)
* **จัดกลุ่มอุปกรณ์อัตโนมัติ:** คัดแยกอุปกรณ์ตามหมายเลข Feed และชื่อสถานที่โดยอัตโนมัติ
* **PowerShell Preprocess:** ใช้สคริปต์ PowerShell ในการประมวลผลและสร้างไฟล์ตารางรายชื่อโฮสต์ (Hosts File) ขึ้นมาใหม่
* **Localization:** รองรับการจัดโครงสร้างข้อมูลและข้อความภาษาไทยอย่างเต็มรูปแบบ

### 🔹 Smart Encoding Support (UTF-16 LE)
* **รองรับภาษาไทย 100%:** แก้ไขปัญหาตัวอักษรเพี้ยน อ่านไม่รู้เรื่อง (Mojibake) ขณะส่งถ่ายข้อมูล
* **ระบบแปลงสลับรหัสไฟล์ (Encoding Conversion):**
  * ข้อมูลนำเข้า/ส่งออกของ PingInfoView ➡️ จัดการด้วยฟอร์แมต `UTF-16 LE`
  * ข้อมูลนำเข้าของ Node.js Agent ➡️ แปลงเป็น `UTF-8 (No BOM)` เพื่อความเข้ากันได้ของระบบ

### 🔹 Automated Ping Execution (Step 1)
* **CLI Automation:** สั่งการโปรแกรม PingInfoView ให้ทำงานผ่าน Command Line Interface
* **Background Running:** รันกระบวนการตรวจสอบสัญญาณอินเทอร์เน็ตอยู่เบื้องหลัง (Background Process) โดยไม่รบกวนผู้ใช้งาน
* **Auto Export:** บันทึกผลลัพธ์การตรวจสอบออกมาเป็นไฟล์ข้อความดิบ (Raw Text) โดยอัตโนมัติเมื่อจบรอบ

### 🔹 Data Parsing Engine (Step 2–3)
* **แยกโครงสร้างข้อมูลอย่างละเอียด (Data Extraction):** สามารถแยกแยะข้อมูลสำคัญได้อย่างแม่นยำ เช่น:
  * กลุ่มของอุปกรณ์ (Group / Feed)
  * ชื่อของอุปกรณ์ (Device Name)
  * หมายเลขไอพี (IP Address)
  * สถานะการเชื่อมต่อ (Status)
  * ความเร็วในการตอบสนอง (Latency / Ping Time)
* **JSON Serialization:** แปลงข้อมูลเครือข่ายทั้งหมดให้อยู่ในรูปแบบโครงสร้าง JSON พร้อมส่งต่อทันที

### 🔹 Real-time WebSocket Sync (Step 4)
* **Socket.io Integration:** ใช้เครือข่าย `socket.io-client` ในการรักษาท่อเชื่อมต่อข้อมูลกับเซิร์ฟเวอร์
* **Interval Sync:** ตั้งเวลาส่งชุดข้อมูลอัปเดตขึ้นระบบคลาวด์ทุกๆ ประมาณ 10 วินาที
* **Live Dashboard:** ส่งตรงข้อมูลเพื่อไปแสดงผลบนหน้าเว็บ React Frontend Dashboard แบบ Real-time


---
## 🧱 System Architecture

ระบบทำงานร่วมกันเป็นขั้นตอน (Data Pipeline) จาก Local Machine ส่งตรงไปยัง Cloud Backend ดังนี้:

* **Input:** `Local Hosts File (UTF-16 LE)` 
* **Step 0:** PowerShell Pre-process ➡️ นำข้อมูลออกเป็นไฟล์ `hosts_generated.txt`
* **Step 1:** โปรแกรม PingInfoView.exe ประมวลผล ➡️ บันทึกผลลัพธ์ลง `raw_ping.txt`
* **Step 2-3:** PowerShell Parser ➡️ แปลงไฟล์และจัดรูปแบบข้อมูลให้อยู่ในรูป `payload.json (UTF-8)`
* **Step 4:** Node.js Socket Client ➡️ ส่งข้อมูลแบบ Real-time ผ่าน WebSockets ไปยังเซิร์ฟเวอร์
* **Cloud Backend:** ประมวลผลบนระบบ Render *(หมายเหตุ: URL ของ API จะถูกเรียกใช้งานผ่าน Environment Variable เพื่อความปลอดภัย)*
* **Output:** React Frontend Dashboard ➡️ แสดงผลอัปเดตสถานะแบบ Real-time (`ONLINE` / `TIMEOUT`)

---

## 📁 Directory Structure

โครงสร้างไดเรกทอรีและการจัดเก็บไฟล์ภายในระบบ (มีการซ่อนข้อมูลผู้ใช้งานจริงเพื่อความปลอดภัย):

```text
C:\
└── Test\
    ├── hosts_generated.txt
    ├── raw_ping.txt
    └── payload.json
    
C:\Users\<YOUR_WINDOWS_USERNAME>\
└── Downloads\
    └── Compressed\
        └── pinginfoview-x64-v3.25\
            ├── PingInfoView.exe
            └── PingInfoView_hosts.txt

C:\<YOUR_PROJECT_PATH>\backend\
└── node_modules\
    └── socket.io-client\
        └── ping_agent.bat
```
## 📝 Hosts Configuration Guide

ไฟล์สำเนาสำหรับใช้งาน:
```text
C:\Users\<YOUR_WINDOWS_USERNAME>\Downloads\Compressed\pinginfoview-x64-v3.25\PingInfoView_hosts.txt
```

### 🔸 Format ตัวอย่าง (Example Format)

```text
Feed 25 192.168.1.XX เลย ริเวอร์ไซด์ สเตเดียม#IPA
192.168.1.XX เลย ริเวอร์ไซด์ สเตเดียม#IPB
192.168.1.XX เลย ริเวอร์ไซด์ สเตเดียม#R1
192.168.1.XX เลย ริเวอร์ไซด์ สเตเดียม#R2

Feed 20 10.0.0.XX สนามยูนิฟ ฟุตบอลปาร์ค#IPA
10.0.0.XX สนามยูนิฟ ฟุตบอลปาร์ค#IPB
10.0.0.XX สนามยูนิฟ ฟุตบอลปาร์ค#R1
10.0.0.XX สนามยูนิฟ ฟุตบอลปาร์ค#R2
```

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
cd C:\<YOUR_PROJECT_PATH>\backend
npm install socket.io-client
```

---

## 🏃‍♂️ How to Run

1. สร้างไฟล์ `ping_agent.bat`
2. วางโค้ด automation script ลงไป
3. ดับเบิ้ลคลิกเพื่อเริ่มระบบ

ระบบจะรันวนลูปตามลำดับ:
`Step 0` ➡️ `Step 1` ➡️ `Step 2` ➡️ `Step 3` ➡️ `Step 4`

### ✅ Success Message
```text
Cloud Sync Status: Success via WebSockets connection!
```

---

## 📊 JSON Payload Format

ตัวอย่างข้อมูลที่ส่งไป Cloud (ซ่อนไอพีจริงเป็นไอพีจำลอง):

```json
[
  {
    "group": "Feed 25 - เลย ริเวอร์ไซด์ สเตเดียม",
    "name": "IPA",
    "ip": "192.168.1.XX",
    "status": "TIMEOUT",
    "ping": "0"
  },
  {
    "group": "Feed 25 - เลย ริเวอร์ไซด์ สเตเดียม",
    "name": "IPB",
    "ip": "192.168.1.XX",
    "status": "ONLINE",
    "ping": "15"
  }
]
```

---

## ⚠️ Troubleshooting

### ❌ ภาษาไทยเพี้ยน
* **สาเหตุ:** ไฟล์ไม่ใช่ UTF-16 LE
* **วิธีแก้:** 
  1. เปิดไฟล์ด้วย Notepad
  2. เลือก `Save As` ➡️ ตรงช่อง `Encoding` ให้เปลี่ยนเป็น `UTF-16 LE`

### ❌ Cloud Sync Failed / Timeout
* **สาเหตุ:** อินเทอร์เน็ตหลุด หรือ เซิร์ฟเวอร์บน Render หลับ (Sleep จาก Free tier)
* **วิธีแก้:** รอประมาณ 50–60 วินาทีเพื่อให้เซิร์ฟเวอร์ตื่น (Wake up) แล้วระบบจะลองใหม่อีกครั้งในรอบถัดไป

### ❌ หาโฟลเดอร์ไม่เจอ
* **สาเหตุ:** ระบุ Path ไม่ตรง หรือยังไม่ได้สร้างโฟลเดอร์สำหรับพักไฟล์ข้อมูล
* **วิธีแก้:** สร้างโฟลเดอร์ `C:\Test` ขึ้นมาใหม่ หรือตรวจสอบตรวจสอบโครงสร้าง Path ภายในตัว `.bat` script อีกครั้ง

---

## 📡 Summary

**TLMA** คือระบบสะพานเชื่อมต่อ (Bridge) ระหว่างเทคโนโลยีต่างๆ ดังนี้:
* **Desktop Ping Tool** (PingInfoView)
* **Local Processing** (PowerShell + Batch Script)
* **Cloud Backend** (Node.js + Socket.io)
* **Frontend Dashboard** (React)

เพื่อขับเคลื่อนระบบมอนิเตอร์สถานะเครือข่ายของสนามแข่งขันแบบ Real-time อย่างแท้จริง
