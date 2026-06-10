# 📡 TLMA — Real-time Network Ping Monitor
### (PingInfoView to React Cloud Agent)

![Project Status](https://shields.io)
![Environment](https://shields.io)
![Backend](https://shields.io)
![Frontend](https://shields.io)


**TLMA** คือระบบ **Local Agent สำหรับมอนิเตอร์สถานะเครือข่ายแบบ Real-time** ที่ออกแบบมาเพื่อเชื่อมโยงการทำงานระหว่างซอฟต์แวร์เดสก์ท็อปอย่าง **NirSoft PingInfoView** เข้ากับระบบคลาวด์แอปพลิเคชัน (React + Node.js) 

ระบบนี้จะทำหน้าที่ประมวลผลข้อมูลการ Ping, จัดกลุ่มอุปกรณ์แยกตามพื้นที่/สนามแข่งขัน, แปลงโครงสร้างข้อมูลให้อยู่ในฟอร์แมตมาตรฐาน และส่งต่อขึ้นไปยัง Cloud Backend ผ่านโปรโตคอล WebSockets แบบทันที ช่วยให้หน้าเว็บอัปเดตสถานะได้ตลอดเวลาโดยไม่ต้องกดรีเฟรช

---

## 📌 คุณสมบัติเด่น (Features)

* **🔹 Auto-Group Configuration (Step 0):** คัดแยกอุปกรณ์ตามหมายเลข Feed และชื่อสถานที่โดยอัตโนมัติ โดยใช้สคริปต์ PowerShell ในการประมวลผลและสร้างไฟล์ตารางรายชื่อโฮสต์ (`Hosts File`) ขึ้นมาใหม่
* **🔹 Smart Encoding Support (UTF-16 LE):** รองรับภาษาไทย 100% แก้ไขปัญหาตัวอักษรเพี้ยน อ่านไม่รู้เรื่อง (*Mojibake*) โดยแปลงข้อมูลเข้า/ออกของ PingInfoView (`UTF-16 LE`) ให้เป็น `UTF-8 (No BOM)` สำหรับ Node.js Agent
* **🔹 Automated Ping Execution (Step 1):** สั่งการโปรแกรม PingInfoView ให้ทำงานผ่าน Command Line Interface (CLI) รันกระบวนการอยู่เบื้องหลัง (*Background Process*) และ Auto Export ผลลัพธ์เป็น Raw Text ทันทีเมื่อจบรอบ
* **🔹 Data Parsing Engine (Step 2–3):** แยกแยะข้อมูลสำคัญได้อย่างแม่นยำ เช่น กลุ่มของอุปกรณ์ (Feed), ชื่ออุปกรณ์, หมายเลขไอพี, Status และความเร็วตอบสนอง (Latency) ก่อนจะทำ *JSON Serialization* เพื่อส่งต่อ
* **🔹 Real-time WebSocket Sync (Step 4):** ใช้ `socket.io-client` ในการรักษาท่อเชื่อมต่อข้อมูลกับเซิร์ฟเวอร์ และตั้งเวลา Sync ชุดข้อมูลอัปเดตขึ้นระบบคลาวด์ทุกๆ ~10 วินาที เพื่อแสดงผลบน React Frontend Dashboard

---

## 🧱 สถาปัตยกรรมระบบ (System Architecture)

ระบบทำงานร่วมกันเป็นขั้นตอน (Data Pipeline) จาก Local Machine ส่งตรงไปยัง Cloud Backend ดังนี้:

```text
[ Local Hosts File ] ──(Step 0: PowerShell Pre-process)──> [ hosts_generated.txt ]
                                                                     │
                                                          (Step 1: PingInfoView.exe)
                                                                     │
                                                                     ▼
[ payload.json ] <──(Step 2-3: PowerShell Parser)─────────── [ raw_ping.txt ]
       │
 (Step 4: Node.js Socket Client)
       │
       ▼
[ Cloud Backend Server ] ──────────────────────────────────> [ React Frontend Dashboard ]
  (Secure API via Env)                                         (Real-time ONLINE/TIMEOUT)
```

---

## 📁 โครงสร้างไดเรกทอรี (Directory Structure)

โครงสร้างโฟลเดอร์และการจัดเก็บไฟล์ภายในระบบ (ทำการปกปิดข้อมูลผู้ใช้งานและ Path ส่วนตัวเพื่อความปลอดภัย):

```text
C:\
└── Test\
    ├── hosts_generated.txt      # ไฟล์โฮสต์ที่ผ่านการ Pre-process (UTF-16 LE)
    ├── raw_ping.txt             # ไฟล์ผลลัพธ์ดิบจาก PingInfoView
    └── payload.json             # ไฟล์ผลลัพธ์สุดท้ายในรูปแบบ JSON (UTF-8)
    
C:\Users\<YOUR_WINDOWS_USERNAME>\
└── Downloads\
    └── pinginfoview-x64-vX.XX\  # โฟลเดอร์โปรแกรม PingInfoView
        ├── PingInfoView.exe
        └── PingInfoView_hosts.txt

C:\<YOUR_PROJECT_PATH>\backend\
└── node_modules\
    └── socket.io-client\
        └── ping_agent.bat       # สคริปต์หลักสำหรับรันระบบ Automation
```

---

## 📝 คู่มือการตั้งค่าโฮสต์ (Hosts Configuration Guide)

ตำแหน่งไฟล์คอนฟิกสำหรับใช้กับระบบมอนิเตอร์:
```text
C:\Users\<YOUR_WINDOWS_USERNAME>\Downloads\pinginfoview-x64-vX.XX\PingInfoView_hosts.txt
```

### 🔸 ตัวอย่างรูปแบบการตั้งค่า (Example Format)

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

### ⚠️ กฎสำคัญในการตั้งค่า (Configuration Rules)

* **`Feed [number]`** — ใช้สำหรับระบุการเริ่มต้นกลุ่มใหม่
* **การจัดกลุ่ม** — อุปกรณ์ทั้งหมดที่อยู่ถัดจากบรรทัด Feed จะถูกจัดเข้ากลุ่มเดียวกันโดยอัตโนมัติ
* **การแบ่งเว้นวรรค** — ใช้ช่องว่าง (`Space`) ในการคั่นแยกหมายเลข IP ออกจากชื่อสถานที่/สนามแข่งขัน
* **การแท็กตัวอุปกรณ์** — ใช้เครื่องหมาย `#` เพื่อระบุประเภทอุปกรณ์ปลายทาง (เช่น `#IPA`, `#IPB`, `#R1`, `#R2`)
* **ชื่อสนาม** — ข้อความทั้งหมดที่อยู่ก่อนหน้าเครื่องหมาย `#` จะถูกดึงไปแสดงผลเป็นชื่อสนามบนหน้าแดชบอร์ด

---

## 📦 สิ่งที่จำเป็นต้องมี (Prerequisites)

* **OS:** ระบบปฏิบัติการ Windows 7 / 10 / 11
* **Runtime:** Node.js (แนะนำเวอร์ชัน LTS)
* **Shell:** PowerShell (มีติดตั้งมาพร้อมกับ Windows อยู่แล้ว)
* **Software:** ซอฟต์แวร์ PingInfoView (โดย NirSoft)

### การติดตั้ง Dependencies
```bash
cd C:\<YOUR_PROJECT_PATH>\backend
npm install socket.io-client
```

---

## 🏃‍♂️ วิธีการใช้งาน (How to Run)

1. สร้างไฟล์ชื่อ `ping_agent.bat`
2. คัดลอกโค้ดสคริปต์ Automation ทั้งหมดมาวางลงในไฟล์นี้
3. ดับเบิ้ลคลิกไฟล์ `ping_agent.bat` เพื่อเริ่มต้นการทำงานของระบบ

> 🔄 **ลูปการทำงาน:** ระบบจะทำงานวนซ้ำต่อเนื่องโดยอัตโนมัติตามลำดับขั้นตอน: `Step 0` ➡️ `Step 1` ➡️ `Step 2` ➡️ `Step 3` ➡️ `Step 4`

### ✅ ข้อความแจ้งเตือนเมื่อเชื่อมต่อสำเร็จ
```text
Cloud Sync Status: Success via WebSockets connection!
```

---

## 📊 โครงสร้างข้อมูล JSON (JSON Payload Format)

ตัวอย่างรูปแบบโครงสร้างข้อมูล JSON ที่ระบบ Agent ประมวลผลและส่งขึ้นไปยัง Cloud Server (มีการซ่อนข้อมูล IP จริงเพื่อความปลอดภัย):

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

## 🔒 ข้อควรระวังด้านความปลอดภัย (Security Notes)

* **Environment Variables:** ห้ามทำการ Hardcode ค่า URL ของ Cloud Server หรือ Socket Endpoint ลงในตัวสคริปต์หลักโดยเด็ดขาด ให้ระบุผ่านไฟล์ `.env` เสมอ
* **Network Privacy:** เนื่องจากไฟล์ตารางรายชื่อโฮสต์มีการระบุหมายเลข IP จริงภายในเครือข่ายหน้างาน โปรดตรวจสอบให้แน่ใจว่าไฟล์ประมวลผลภายในจะไม่ถูกเผยแพร่สู่ภายนอก

### 🙈 การตั้งค่าไฟล์ `.gitignore` ที่แนะนำ
เพื่อป้องกันไม่ให้ Git อัปโหลดข้อมูลเครือข่ายภายในและข้อมูลส่วนบุคคลขึ้น Public Repository ควรเพิ่มโฟลเดอร์และไฟล์เหล่านี้ในระบบของคุณ:
```text
# Node dependencies
node_modules/

# Local Environment Variables
.env
.env.local

# Local Log & Processing Files
C:/Test/hosts_generated.txt
C:/Test/raw_ping.txt
C:/Test/payload.json
```

---

## ⚠️ การแก้ไขปัญหาเบื้องต้น (Troubleshooting)

### ❌ ตัวอักษรภาษาไทยเพี้ยน อ่านไม่รู้เรื่อง (Mojibake)
* **สาเหตุ:** ไฟล์คอนฟิกหรือไฟล์ข้อความดิบไม่อยู่ในฟอร์แมต `UTF-16 LE`
* **วิธีแก้:** เปิดไฟล์ที่มีปัญหาด้วยโปรแกรม Notepad ➡️ เลือก `Save As` ➡️ ในหัวข้อ `Encoding` ให้เปลี่ยนเป็น `UTF-16 LE` ก่อนกดบันทึก

### ❌ Cloud Sync Failed / Connection Timeout
* **สาเหตุ:** สัญญาณอินเทอร์เน็ตหน้างานขัดข้อง หรือ Cloud Server (เช่น Render Free tier) กำลังอยู่ในโหมดจำศีล (Sleep Mode)
* **วิธีแก้:** ไม่ต้องดำเนินการใดๆ ระบบจะวนลูปทำงานรอบใหม่ทุกๆ 50-60 วินาที เพื่อกระตุ้นเซิร์ฟเวอร์ให้ตื่น (Wake up) และเชื่อมต่อกลับมาใหม่โดยอัตโนมัติ

### ❌ ระบบแจ้งเตือนไม่พบโฟลเดอร์ (Path Not Found)
* **สาเหตุ:** ไม่ได้สร้างโฟลเดอร์สำหรับพักข้อมูล หรือระบุตำแหน่ง Path ในสคริปต์ไม่ตรงกับเครื่องที่ใช้งานจริง
* **วิธีแก้:** ตรวจสอบและสร้างโฟลเดอร์ `C:\Test` ขึ้นมาใหม่ หรือแก้ไขตำแหน่ง Path ภายในไฟล์ `.bat` ให้ตรงกับสภาพแวดล้อมของเครื่องคอมพิวเตอร์ที่ใช้รันระบบ

---

## 📈 แผนการพัฒนาต่อยอด (Future Enhancements)
* [ ] เปลี่ยนรูปแบบการทำงานของ Batch/PowerShell บนเครื่อง Local ให้รันในฐานะ **Windows Service** เบื้องหลังอย่างถาวรโดยไม่ต้องเปิดหน้าต่าง Command Prompt ค้างไว้
* [ ] พัฒนาระบบสำรองข้อมูลในเครื่องแบบ Local Cache กรณีเครือข่ายอินเทอร์เน็ตหน้างานหลุด เพื่อให้ระบบสามารถส่งข้อมูลย้อนหลัง (Bulk Sync) ได้เมื่อเน็ตกลับมาใช้งานได้ปกติ

---

## 📡 บทสรุป (Summary)

**TLMA** ทำหน้าที่เป็นสะพานเชื่อมต่อ (Bridge) ทางเทคโนโลยีที่ผสานการทำงานร่วมกันระหว่าง:
`Desktop Tool (PingInfoView)` ➡️ `Local Scripting (PowerShell + Batch)` ➡️ `Cloud Agent (Node.js + Socket.io)` ➡️ `Frontend (React)` 

เพื่อสร้างระบบมอนิเตอร์เครือข่ายสำหรับลิงก์สัญญาณและการถ่ายทอดสดตามสนามแข่งขันต่างๆ ได้อย่างแม่นยำ เสถียร และแสดงผลแบบ Real-time ตลอดช่วงเวลาการแข่งขัน
