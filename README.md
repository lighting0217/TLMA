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
* **แยกโครงสร้างข้อมูลอย่างละเอียด (Data Extraction):** สามารถแยกแยะข้อมูลสำคัญได้อย่างแม่นยำ เช่น กลุ่มของอุปกรณ์ (Feed), ชื่ออุปกรณ์, หมายเลขไอพี, สถานะ และความเร็วตอบสนอง (Latency)
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
* **Cloud Backend:** ประมวลผลบนเซิร์ฟเวอร์คลาวด์ *(หมายเหตุ: URL ของ API จะถูกเรียกใช้งานผ่าน Environment Variable เพื่อความปลอดภัย)*
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

---

## 📝 Hosts Configuration Guide

ไฟล์คอนฟิกสำหรับใช้กับระบบมอนิเตอร์:
```text
C:\Users\Wuttikorn\Downloads\Compressed\pinginfoview-x64-v3.25\PingInfoView_hosts.txt
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

### ⚠️ Rules ในการตั้งค่าไฟล์โฮสต์:
- `Feed [number]` = เริ่มกลุ่มใหม่
- ทุกอุปกรณ์หลังคำว่า Feed จะอยู่ในกลุ่มเดียวกันทั้งหมด
- ใช้ช่องว่าง `Space` ในการแยก IP และชื่อสเตเดียม
- ใช้เครื่องหมาย `#` ระบุประเภทอุปกรณ์ปลายทาง (เช่น IPA, IPB, R1, R2)
- ข้อความก่อนเครื่องหมาย `#` จะถูกนำมาใช้เป็นชื่อสนาม

---

## 📦 Prerequisites

- ระบบปฏิบัติการ Windows 7 / 10 / 11
- Node.js (แนะนำเวอร์ชัน LTS)
- PowerShell (ติดมากับระบบ Windows อยู่แล้ว)
- ซอฟต์แวร์ PingInfoView (จากค่าย NirSoft)

### การติดตั้ง Dependencies:
```bash
cd C:\<YOUR_PROJECT_PATH>\backend
npm install socket.io-client
```

---

## 🏃‍♂️ How to Run

1. สร้างไฟล์ชื่อ `ping_agent.bat`
2. นำโค้ด Automation Script ทั้งหมดมาวางลงในไฟล์นี้
3. ดับเบิ้ลคลิกไฟล์ `ping_agent.bat` เพื่อเริ่มรันระบบ

ระบบจะทำงานเป็นลูปวนซ้ำโดยอัตโนมัติตามลำดับ:
`Step 0` ➡️ `Step 1` ➡️ `Step 2` ➡️ `Step 3` ➡️ `Step 4`

### ✅ Success Message เมื่อระบบทำงานสำเร็จ
```text
Cloud Sync Status: Success via WebSockets connection!
```

---

## 📊 JSON Payload Format

ตัวอย่างรูปแบบโครงสร้าง JSON ที่ผ่านการประมวลผลแล้วส่งไปยังระบบคลาวด์:

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

### ❌ ภาษาไทยเพี้ยน อ่านไม่รู้เรื่อง (Mojibake)
* **สาเหตุ:** ไฟล์ตั้งค่าหรือไฟล์ผลลัพธ์ไม่ตรงกับฟอร์แมต UTF-16 LE
* **วิธีแก้:** เปิดไฟล์ดังกล่าวด้วยโปรแกรม Notepad ➡️ เลือก `Save As` ➡️ ตรงหัวข้อ `Encoding` ให้เปลี่ยนเป็น `UTF-16 LE` ก่อนกดบันทึก

### ❌ Cloud Sync Failed / Connection Timeout
* **สาเหตุ:** สัญญาณอินเทอร์เน็ตหน้างานขัดข้อง หรือ เซิร์ฟเวอร์บนคลาวด์ฟรี (เช่น Render Free tier) กำลังเข้าสู่โหมดหลับ (Sleep Mode)
* **วิธีแก้:** รอระบบวนลูปการทำงานรอบใหม่ประมาณ 50–60 วินาที เพื่อรอกระบวนการกระตุ้นให้เซิร์ฟเวอร์ตื่น (Wake up) ระบบจะเชื่อมต่อกลับมาเองโดยอัตโนมัติ

### ❌ ระบบแจ้งว่าหาโฟลเดอร์ไม่เจอ (Path Not Found)
* **สาเหตุ:** ไม่ได้สร้างโฟลเดอร์สำหรับเก็บไฟล์ล็อก หรือการกำหนด Path ในไฟล์สคริปต์ผิดพลาด
* **วิธีแก้:** ตรวจสอบและสร้างโฟลเดอร์ `C:\Test` ขึ้นมาใหม่ในระบบ หรือปรับเปลี่ยนตำแหน่งโครงสร้าง Path ภายในตัว `.bat` สคริปต์ให้ตรงตามสเปกเครื่องคอมพิวเตอร์ที่นำไปรันใช้งานจริง

---

## 📡 Summary

**TLMA** ทำหน้าที่เป็นสะพานเชื่อมต่อ (Bridge) ทางเทคโนโลยีระหว่าง:
* **Desktop Ping Tool** (PingInfoView)
* **Local Processing** (PowerShell + Batch Script)
* **Cloud Backend** (Node.js + Socket.io)
* **Frontend Dashboard** (React)

เพื่อสร้างสรรค์ระบบที่สามารถขับเคลื่อนและมอนิเตอร์สถานะเครือข่ายของสนามแข่งขันในลีกต่างๆ ได้อย่างมีประสิทธิภาพ แม่นยำ และเป็น Real-time ตลอดการแข่งขัน
