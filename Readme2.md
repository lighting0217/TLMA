# 📡 TLMA — Real-time Network Ping Monitor
### (PingInfoView to React Cloud Agent)

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Environment](https://img.shields.io/badge/environment-Windows%20%7C%20PowerShell-blue)
![Backend](https://img.shields.io/badge/backend-Node.js%20%7C%20Socket.io-green)
![Frontend](https://img.shields.io/badge/frontend-React-informational)

**TLMA** คือระบบ **Local Agent สำหรับมอนิเตอร์สถานะเครือข่ายแบบ Real-time** ที่ออกแบบมาเพื่อเชื่อมโยงการทำงานระหว่างซอฟต์แวร์เดสก์ท็อปอย่าง **NirSoft PingInfoView** เข้ากับระบบคลาวด์แอปพลิเคชัน (React + Node.js) 

ระบบนี้จะทำหน้าที่ประมวลผลข้อมูลการ Ping, จัดกลุ่มอุปกรณ์แยกตามพื้นที่/สนามแข่งขัน, แปลงโครงสร้างข้อมูลให้อยู่ในฟอร์แมตมาตรฐาน และส่งต่อขึ้นไปยัง Cloud Backend ผ่านโปรโตคอล WebSockets แบบทันที ช่วยให้หน้าเว็บอัปเดตสถานะได้ตลอดเวลาโดยไม่ต้องกดรีเฟรช

---

## 📌 คุณสมบัติเด่น (Features)

* **🔹 Auto-Group Configuration (Step 0):** คัดแยกอุปกรณ์ตามหมายเลข Feed และชื่อสถานที่โดยอัตโนมัติ โดยใช้สคริปต์ PowerShell ในการประมวลผลและสร้างไฟล์ตารางรายชื่อโฮสต์ (`Hosts File`) ขึ้นมาใหม่
* **🔹 Smart Encoding Support (UTF-16 LE):** รองรับภาษาไทย 100% แก้ไขปัญหาตัวอักษรเพี้ยน อ่านไม่รู้เรื่อง (*Mojibake*) โดยแปลงข้อมูลเข้า/ออกของ PingInfoView (`UTF-16 LE`) ให้เป็น `UTF-8 (No BOM)` สำหรับ Node.js Agent
* **🔹 Automated Ping Execution (Step 1):** สั่งการโปรแกรม PingInfoView ให้ทำงานผ่าน Command Line Interface (CLI) รันกระบวนการอยู่เบื้องหลัง (*Background Process*) และ Auto Export ผลลัพธ์เป็น Raw Text ทันทีเมื่อจบรอบ
* **🔹 Data Parsing Engine (Step 2–3):** แยกแยะข้อมูลสำคัญได้อย่างแม่นยำ เช่น กลุ่มของอุปกรณ์ (Feed), ชื่ออุปกรณ์, หมายเลขไอพี, สถานะ และความเร็วตอบสนอง (Latency) ก่อนจะทำ *JSON Serialization* เพื่อส่งต่อ
* **🔹 Real-time WebSocket Sync (Step 4):** ใช้ `socket.io-client` ในการรักษาท่อเชื่อมต่อข้อมูลกับเซิร์ฟเวอร์ และตั้งเวลา Sync ชุดข้อมูลอัปเดตขึ้นระบบคลาวด์ทุกๆ ~10 วินาที เพื่อแสดงผลบน React Frontend Dashboard

---

## 🧱 สถาปัตยกรรมระบบ (System Architecture)

ระบบทำงานร่วมกันเป็นขั้นตอน (Data Pipeline) จาก Local Machine ส่งตรงไปยัง Cloud Backend ดังนี้:

```text
[ Local Hosts File ] ──(Step 0: PowerShell)──> [ hosts_generated.txt ]
                                                        │
                                             (Step 1: PingInfoView.exe)
                                                        │
                                                        ▼
[ payload.json ] <──(Step 2-3: Parser Script)── [ raw_ping.txt ]
       │
 (Step 4: Node.js Socket Client)
       │
       ▼
[ Cloud Backend Server ] ─────────────────────> [ React Frontend Dashboard ]
  (Secure API via Env)                            (Real-time ONLINE/TIMEOUT)
📁 โครงสร้างไดเรกทอรี (Directory Structure)
โครงสร้างโฟลเดอร์และการจัดเก็บไฟล์ภายในระบบ (ทำการปกปิดข้อมูลผู้ใช้งานและ Path ส่วนตัวเพื่อความปลอดภัย):

Plaintext
C:\
└── Test\
    ├── hosts_generated.txt      # ไฟล์โฮสต์ที่ผ่านการ Pre-process
    ├── raw_ping.txt             # ไฟล์ผลลัพธ์ดิบจาก PingInfoView
    └── payload.json             # ไฟล์ผลลัพธ์สุดท้ายในรูปแบบ JSON
    
C:\Users\<YOUR_WINDOWS_USERNAME>\
└── Downloads\
    └── pinginfoview-x64-vX.XX\  # โฟลเดอร์โปรแกรม PingInfoView
        ├── PingInfoView.exe
        └── PingInfoView_hosts.txt

C:\<YOUR_PROJECT_PATH>\backend\
└── node_modules\
    └── socket.io-client\
        └── ping_agent.bat       # สคริปต์หลักสำหรับรันระบบ Automation
📝 คู่มือการตั้งค่าโฮสต์ (Hosts Configuration Guide)
ตำแหน่งไฟล์คอนฟิกสำหรับใช้กับระบบมอนิเตอร์:
C:\Users\<YOUR_WINDOWS_USERNAME>\Downloads\pinginfoview-x64-vX.XX\PingInfoView_hosts.txt

🔸 ตัวอย่างรูปแบบการตั้งค่า (Example Format)
Plaintext
Feed 25 192.168.1.XX เลย ริเวอร์ไซด์ สเตเดียม#IPA
192.168.1.XX เลย ริเวอร์ไซด์ สเตเดียม#IPB
192.168.1.XX เลย ริเวอร์ไซด์ สเตเดียม#R1
192.168.1.XX เลย ริเวอร์ไซด์ สเตเดียม#R2

Feed 20 10.0.0.XX สนามยูนิฟ ฟุตบอลปาร์ค#IPA
10.0.0.XX สนามยูนิฟ ฟุตบอลปาร์ค#IPB
10.0.0.XX สนามยูนิฟ ฟุตบอลปาร์ค#R1
10.0.0.XX สนามยูนิฟ ฟุตบอลปาร์ค#R2
⚠️ กฎสำคัญในการตั้งค่า (Configuration Rules):
Feed [number] = ใช้สำหรับเริ่มต้นกลุ่มใหม่

อุปกรณ์ทั้งหมดที่อยู่ถัดจากบรรทัด Feed จะถูกจัดเข้าอยู่ในกลุ่มเดียวกันโดยอัตโนมัติ

ใช้ช่องว่าง (Space) ในการแยกหมายเลข IP และชื่อสถานที่/สนามแข่งขัน

ใช้เครื่องหมาย # เพื่อระบุประเภทอุปกรณ์ปลายทาง (เช่น #IPA, #IPB, #R1, #R2)

ข้อความที่อยู่ก่อนหน้าเครื่องหมาย # จะถูกดึงไปใช้เป็นชื่อสนามบนแดชบอร์ด

📦 สิ่งที่จำเป็นต้องมี (Prerequisites)
ระบบปฏิบัติการ Windows 7 / 10 / 11

Node.js (แนะนำเวอร์ชัน LTS)

PowerShell (มีติดตั้งมาพร้อมกับ Windows อยู่แล้ว)

ซอฟต์แวร์ PingInfoView (โดย NirSoft)

การติดตั้ง Dependencies:
Bash
cd C:\<YOUR_PROJECT_PATH>\backend
npm install socket.io-client
🏃‍♂️ วิธีการใช้งาน (How to Run)
สร้างไฟล์ชื่อ ping_agent.bat

คัดลอกโค้ดสคริปต์ Automation ทั้งหมดมาวางลงในไฟล์นี้

ดับเบิ้ลคลิกไฟล์ ping_agent.bat เพื่อเริ่มต้นการทำงานของระบบ

🔄 ลูปการทำงาน: ระบบจะทำงานวนซ้ำต่อเนื่องโดยอัตโนมัติตามลำดับขั้นตอน: Step 0 ➡️ Step 1 ➡️ Step 2 ➡️ Step 3 ➡️ Step 4

✅ ข้อความแจ้งเตือนเมื่อเชื่อมต่อสำเร็จ
Plaintext
Cloud Sync Status: Success via WebSockets connection!
📊 โครงสร้างข้อมูล JSON (JSON Payload Format)
ตัวอย่างรูปแบบโครงสร้างข้อมูล JSON ที่ระบบ Agent ประมวลผลและส่งขึ้นไปยัง Cloud Server:

JSON
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
⚠️ การแก้ไขปัญหาเบื้องต้น (Troubleshooting)
❌ ตัวอักษรภาษาไทยเพี้ยน อ่านไม่รู้เรื่อง (Mojibake)
สาเหตุ: ไฟล์คอนฟิกหรือไฟล์ข้อความดิบไม่อยู่ในฟอร์แมต UTF-16 LE

วิธีแก้: เปิดไฟล์ที่มีปัญหาด้วยโปรแกรม Notepad ➡️ เลือก Save As ➡️ ในหัวข้อ Encoding ให้เปลี่ยนเป็น UTF-16 LE ก่อนกดบันทึก

❌ Cloud Sync Failed / Connection Timeout
สาเหตุ: สัญญาณอินเทอร์เน็ตขัดข้อง หรือ Cloud Server (เช่น Render Free tier) กำลังอยู่ในโหมดหลับ (Sleep Mode)

วิธีแก้: ระบบจะวนลูปทำงานรอบใหม่ทุกๆ 50-60 วินาที เพื่อกระตุ้นให้เซิร์ฟเวอร์ตื่น (Wake up) และจะทำการเชื่อมต่อใหม่อีกครั้งโดยอัตโนมัติ

❌ ระบบแจ้งเตือนไม่พบโฟลเดอร์ (Path Not Found)
สาเหตุ: ไม่ได้สร้างโฟลเดอร์สำหรับเก็บล็อก หรือระบุตำแหน่ง Path ในสคริปต์ไม่ตรงกับเครื่องที่ใช้งานจริง

วิธีแก้: ตรวจสอบและสร้างโฟลเดอร์ C:\Test ขึ้นมาใหม่ หรือแก้ไขตำแหน่ง Path ภายในไฟล์ .bat ให้ตรงกับสภาพแวดล้อมของเครื่องคอมพิวเตอร์นั้นๆ

📡 บทสรุป (Summary)
TLMA ทำหน้าที่เป็นสะพานเชื่อมต่อ (Bridge) ทางเทคโนโลยีที่ผสานการทำงานร่วมกันระหว่าง:
Desktop Tool (PingInfoView) ➡️ Local Scripting (PowerShell + Batch) ➡️ Cloud Agent (Node.js + Socket.io) ➡️ Frontend (React) เพื่อสร้างระบบมอนิเตอร์เครือข่ายสำหรับลิงก์และสัญญาณการถ่ายทอดสดตามสนามต่างๆ ได้อย่างแม่นยำ เสถียร และเป็น Real-time ตลอดช่วงเวลาการแข่งขัน


---

### 🛠️ สิ่งที่ปรับปรุงเพิ่มเติม:
1. **จัดสัดส่วนและไฮไลท์คำสำคัญ:** ใช้ตัวหนา (`**...**`) สลับกับสไตล์โค้ดสั้น (`คำ`) เพื่อแยกคำสั่ง ชื่อโปรแกรม และชื่อไฟล์ออกจากเนื้อหาปกติ ทำให้คนอ่านสามารถกวาดสายตาหาข้อมูลที่ต้องการได้ใน 2 วินาที
2. **Text-based Flowchart ในส่วน Architecture:** ปรับแผนภาพขั้นตอนข้อมูลใหม่ให้มีทิศทางของลูกศรที่ชัดเจน ไล่ลำดับจากบนลงล่างและซ้ายไปขวาตามลำดับการรันสคริปต์จริง
3. **Data Masking ระดับสูงขึ้น:** เปลี่ยนเวอร์ชันของซอฟต์แวร์ที่เจาะจงให้เป็นตัวแปรทั่วไป เช่น `vX.XX`
