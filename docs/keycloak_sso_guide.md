# คู่มือการติดตั้งระบบลงทะเบียนเข้าใช้งานด้วย Keycloak (Keycloak SSO Integration Guide)

คู่มือฉบับนี้อธิบายวิธีการตั้งค่าเชื่อมต่อระบบการระบุตัวตนกลาง (Single Sign-On - SSO) ระหว่าง **Keycloak** และ **Grafana** พร้อมตัวอย่างการสเกลสิทธิ์ผู้ใช้งาน (Role Mapping) เพื่อแยกกลุ่มผู้ดูแลระบบ (Admin) ทีมวิศวกรออกแบบ (Editor) และผู้เข้าชมทั่วไป (Viewer)

---

## 📐 ภาพรวมสถาปัตยกรรมการพิสูจน์ตัวตน (SSO Flow)

```text
  [ User Web Browser ] ---------> [ Grafana (localhost:3000) ]
           |                                  |
           | 1. Redirect to Login             | 2. Verify Authorization Code
           v                                  v
  [ Keycloak Identity Provider ] <------------+
```

---

## 1. การตั้งค่าฝั่ง Keycloak Admin Console

ดำเนินการตั้งค่าในหน้า Keycloak Console ตามหัวข้อย่อยดังต่อไปนี้:

### 1.1 การสร้าง Client สำหรับ Grafana
1. ไปที่เมนู **Clients** ในแถบด้านซ้าย -> กดปุ่ม **Create client**
2. ตั้งค่ารายละเอียดพื้นฐาน:
   * **Client type**: `OpenID Connect`
   * **Client ID**: `grafana`
3. ในแถบตั้งค่าคุณสมบัติ (Capability config):
   * **Client authentication**: เปิดเป็น **`ON`** (หรือ Access Type = `confidential` ในรุ่นเก่า)
   * **Authorization**: ปิด (OFF)
   * **Authentication flow**: ติ๊กเลือกเฉพาะ **`Standard flow`** และ **`Direct access grants`**
4. ในแท็บตั้งค่าทั่วไป (Access settings):
   * **Valid Redirect URIs**: ระบุพาธการส่งกลับของ Grafana
     * ท้องถิ่น (Local): `http://localhost:3000/login/generic_oauth`
     * ระบบจริง (Production): `https://<your-grafana-domain>/login/generic_oauth`
   * **Web Origins**: ใส่ `*` หรือ Domain ของ Grafana
5. กดปุ่ม **Save** จากนั้นไปที่แท็บ **Credentials** แล้วคัดลอกค่า **`Client Secret`** ไปใส่ในไฟล์คีย์ลับระบบ

### 1.2 การระบุสิทธิ์ใช้งานของ Client (Client Roles)
1. เข้าไปที่เมนู Clients ของ `grafana` -> คลิกแท็บ **Roles** ด้านบน
2. กดปุ่ม **Create role**
3. สร้าง Role ที่มีผลต่อ Grafana ดังนี้ (พิมพ์ตัวเล็กทั้งหมด):
   * **`admin`** (สำหรับสิทธิ์ผู้ดูแลระบบสูงสุด)
   * **`editor`** (สำหรับทีมออกแบบสร้าง Dashboard)

### 1.3 การตั้งค่าส่งสิทธิ์ผ่าน Mapper ไปยัง ID Token & UserInfo (⚠️ สำคัญที่สุด)
โดยปกติข้อมูลสิทธิ์จะอยู่เฉพาะใน Access Token ซึ่ง Grafana ไม่สามารถอ่านได้โดยตรง เราจำเป็นต้องบังคับให้ Keycloak แนบข้อมูลเข้าสู่ ID Token ด้วย:
1. ไปที่ Clients ของ `grafana` -> แท็บ **Client Scopes** -> คลิกเปิดสโคปชื่อ **`grafana-dedicated`**
2. คลิกแท็บ **Mappers** ด้านบน
3. หากตารางว่างเปล่า ให้กดปุ่ม **Add mapper** -> เลือก **By configuration** -> เลือกรายการชื่อ **`User Client Role`**
4. กรอกรายละเอียด:
   * **Name**: `client roles`
   * **Token Claim Name**: `resource_access.${client_id}.roles`
   * **Claim JSON Type**: `String`
5. **ตั้งสวิตช์เปิดใช้เป็น ON (เปิด) ทั้งหมด**:
   * **`Add to ID token`** -> **ON** *(จุดที่ห้ามลืม)*
   * **`Add to access token`** -> **ON**
   * **`Add to userinfo`** -> **ON**
6. กดปุ่ม **Save**

### 1.4 การมอบสิทธิ์ให้ผู้ใช้งาน (User Assignment)
1. ไปที่เมนู **Users** ในแถบซ้ายสุด -> ค้นหายูสเซอร์ที่ต้องการและกดเข้าหน้ารายละเอียด
2. คลิกแท็บ **Role mapping** ด้านบน
3. กดปุ่ม **Assign role**
4. เปลี่ยนตัวเลือกฟิลเตอร์ด้านบนจาก *Filter by realm roles* เป็น **`Filter by client`**
5. ติ๊กถูกหน้าสิทธิ์ **`admin`** ของ client `grafana`
6. กดปุ่ม **Assign**

---

## 2. การตั้งค่าฝั่ง Grafana Stack

ในโครงการของเรา ได้ย้ายการตั้งค่าความลับทั้งหมดไปไว้ในไฟล์ส่วนตัวเรียบร้อยแล้ว:

### 2.1 เพิ่มตัวแปรลงในไฟล์ `.env`
เปิดไฟล์ [`.env`](file:///Users/ekachai/Downloads/2026_project/observability-stack/.env) และระบุค่าของเซิร์ฟเวอร์คีย์คล็อกของคุณ:

```env
# ข้อมูลการยืนยันตัวตน Keycloak Client
KEYCLOAK_OAUTH_CLIENT_SECRET=รหัส_Client_Secret_ที่ได้จากหัวข้อ_1.1
KEYCLOAK_OAUTH_BASE_URL=https://<your-keycloak-domain>/realms/<realm-name>
```

### 2.2 โครงสร้างตัวแปรใน `docker-compose.yml`
ในหน้าบริการ `grafana` จะถูกสั่งให้อ่านค่าจาก `.env` นำไปแปลงเป็นตัวแปรตั้งค่าระบบอัตโนมัติ:

```yaml
      GF_AUTH_GENERIC_OAUTH_ENABLED: "true"
      GF_AUTH_GENERIC_OAUTH_NAME: "Keycloak"
      GF_AUTH_GENERIC_OAUTH_ALLOW_SIGN_UP: "true"
      GF_AUTH_GENERIC_OAUTH_CLIENT_ID: "grafana"
      GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET: ${KEYCLOAK_OAUTH_CLIENT_SECRET}
      GF_AUTH_GENERIC_OAUTH_SCOPES: "openid profile email"
      GF_AUTH_GENERIC_OAUTH_AUTH_URL: ${KEYCLOAK_OAUTH_BASE_URL}/protocol/openid-connect/auth
      GF_AUTH_GENERIC_OAUTH_TOKEN_URL: ${KEYCLOAK_OAUTH_BASE_URL}/protocol/openid-connect/token
      GF_AUTH_GENERIC_OAUTH_API_URL: ${KEYCLOAK_OAUTH_BASE_URL}/protocol/openid-connect/userinfo
      # สคริปต์สแกนหาคำระบุสิทธิ์ตามโครงสร้าง JSON จาก ID Token
      GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH: "contains(resource_access.grafana.roles[*], 'admin') && 'Admin' || contains(resource_access.grafana.roles[*], 'editor') && 'Editor' || 'Viewer'"
```

---

## 🛠️ การแก้ไขปัญหาเบื้องต้น (Troubleshooting)

### ปัญหาที่ 1: ตั้งสิทธิ์ใน Keycloak แล้ว แต่เข้ามาใน Grafana ยังเป็น Viewer
* **สาเหตุ**: คุกกี้เซสชันของเบราว์เซอร์ยังคงจดจำตัวตนเดิมอยู่
* **วิธีแก้ไข**: กดล็อกเอาต์ออกจาก Grafana -> ล้างคุกกี้เบราว์เซอร์ หรือเปิดใช้งานด้วย **โหมดหน้าต่างส่วนตัว (Incognito Window)** แล้วล็อกอินเข้าไปทดสอบใหม่อีกครั้ง

### ปัญหาที่ 2: ต้องการแกะดูโครงสร้างของ Token
* **วิธีตรวจสอบ**: เปิดดู JWT ด้วยเว็บไซต์ [jwt.io](https://jwt.io/)
* **Access Token**: จะต้องมีหัวข้อ `"typ": "Bearer"`
* **ID Token**: จะต้องมีหัวข้อ `"aud": "grafana"` และจะต้องพบบล็อกข้อมูลด้านล่างนี้อยู่ใน Token ทั้งสองใบ:
  ```json
  "resource_access": {
    "grafana": {
      "roles": [
        "admin"
      ]
    }
  }
  ```
