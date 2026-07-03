# คู่มือการติดตั้งระบบ Observability Stack บน Railway (Private Network)

เนื่องจากระบบดีพลอยเมนต์บน Railway รันแบบแยก Container อิสระ และไม่รองรับการแชร์โฟลเดอร์เครื่องโฮสต์ (Host Volume Mount) ทางเราจึงได้ทำโครงสร้างไฟล์ **Dockerfiles** สำหรับรวบรวมไฟล์คอนฟิกทั้งหมดฝังลงในตู้คอนเทนเนอร์เพื่อให้พร้อมสำหรับการรันบน Railway แบบแกะกล่องทันที

---

## 🛠️ โครงสร้างการอ้างอิงของระบบบน Railway

แอปพลิเคชันและบริการย่อยทั้งหมดที่สร้างโดย Railway ภายใต้โปรเจกต์เดียวกัน จะสามารถสื่อสารกันผ่านเครือข่ายส่วนตัว (**Private Network**) และคุยกันผ่านชื่อโดเมนภายในดังนี้:

| บริการ | Domain Name ภายในของ Railway | พอร์ต |
| :--- | :--- | :--- |
| **OTel Collector** | `otel-collector.railway.internal` | `4317` (gRPC) / `4318` (HTTP) |
| **Loki** (Logs) | `loki.railway.internal` | `3100` |
| **Tempo** (Traces) | `tempo.railway.internal` | `3200` |
| **Prometheus** (Metrics) | `prometheus.railway.internal` | `9090` |
| **Grafana** (Dashboard) | `grafana.railway.internal` | `3000` |

---

## 🚀 ขั้นตอนการติดตั้งบน Railway

มี 2 ช่องทางในการสั่งติดตั้งขึ้นระบบของ Railway ดังนี้:

### ช่องทางที่ 1: การดีพลอยอัตโนมัติผ่าน GitHub (แนะนำ)

1. ทำการ Push โฟลเดอร์ `observability-stack` ทั้งหมดขึ้น Git Repository (เช่น GitHub) ของคุณ
2. เข้าไปที่หน้าเว็บ **Railway Dashboard** จากนั้นคลิก **New Project**
3. เลือก **Deploy from GitHub repository** และเลือก Repo ที่คุณสร้างขึ้น
4. ตัว Railway จะตรวจจับไฟล์ `docker-compose.yml` และทำการ **สร้าง Service ขึ้นมาแยกเป็น 5 ตัวย่อยให้คุณโดยอัตโนมัติ** ตามที่ระบุไว้ใน compose
5. **รอการ Compile**: Railway จะเห็นคำสั่ง `build` และจะใช้ `Dockerfile` ของแต่ละโฟลเดอร์ย่อยในการบิลด์อิมเมจของแต่ละบริการขึ้นมาทำงานอย่างถูกต้อง

---

### ช่องทางที่ 2: การตั้งค่าเน็ตเวิร์กและการเชื่อมต่อในฝั่งแอปพลิเคชันของคุณ

หลังจากดีพลอยบน Railway เรียบร้อยแล้ว ให้ตั้งค่า Environment Variables ในโปรเจกต์แอปพลิเคชันอื่นๆ (เช่น `event-log-service`) เพื่อชี้มาหา OTel Collector ดังนี้:

```bash
# ตัวอย่างตั้งค่าในตัวแปรระบบของแอปพลิเคชัน
OTEL_SERVICE_NAME=event-log-service

# ชี้ไปยัง Domain ภายในของ OTel Collector บนเน็ตเวิร์กส่วนตัวของ Railway
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.railway.internal:4318

# กำหนดโปรโตคอลการรับส่ง
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf

# ระบุคุณสมบัติแอป
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production,service.namespace=scc
```

---

## 🔒 ข้อมูลความปลอดภัยเพิ่มเติม

เนื่องจากการคุยผ่านเครือข่ายภายในของ Railway เป็นเครือข่ายส่วนตัวที่ปิดไม่ให้บุคคลภายนอกเข้าถึง (มีเพียงแอปในโปรเจกต์เดียวกันเท่านั้นที่คุยกันได้):
* **ระบบไม่จำเป็นต้องตั้งค่า API Key หรือ Bearer Token** ในเน็ตเวิร์กภายใน ทำให้รันได้สะดวกรวดเร็วและไม่มีภาระการเข้ารหัสที่ซับซ้อน
* สำหรับตัว **Grafana Dashboard** หากต้องการเปิดให้คนในทีมเข้ามาหน้าเว็บเพื่อมอนิเตอร์ ให้เข้าไปเปิดสิทธิ์ **Public Networking (Generate Domain)** เฉพาะที่หน้าตั้งค่าของ Service `grafana` บนหน้าเว็บ Railway Dashboard เท่านั้นครับ
