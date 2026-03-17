# 🧪 Test API bằng Postman

## Bước 1: Login để lấy Token

### Request
```
Method: POST
URL: http://localhost:3000/api/v1/auth/login
Headers:
  Content-Type: application/json
```

### Body (raw JSON)
```json
{
    "userId": "admin",
    "password": "Dunghoi1"
}
```

### Response (Success)
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsImdyb3VwSWQiOiJBRE1JTiIsImRlcHRJZCI6IktCIiwiaWF0IjoxNzM3OTY3MjAwLCJleHAiOjE3MzgwNTM2MDB9.abc123...",
    "user": {
        "userId": "admin",
        "name": "Quản trị viên Hệ thống",
        "groupId": "ADMIN",
        "deptId": "KB",
        "roomId": 1,
        ...
    }
}
```

**📋 Copy token từ response này!**

---

## Bước 2: Test Schedule Init với Token

### Request
```
Method: POST
URL: http://localhost:3000/api/v1/schedule/init
Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ QUAN TRỌNG:** Thay `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` bằng token bạn nhận được từ Bước 1!

### Body (raw JSON)
```json
{
    "days": 30
}
```

### Response (Success)
```json
{
    "success": true,
    "message": "Đã khởi tạo xong cho khoa KB",
    "scheduleCount": 120,
    "examSlotCount": 2400
}
```

### Response (Error - No Token)
```json
{
    "success": false,
    "message": "Không tìm thấy token xác thực"
}
```

### Response (Error - Invalid Token)
```json
{
    "success": false,
    "message": "Token không hợp lệ"
}
```

---

## Hướng dẫn Chi tiết trong Postman

### 1. Tạo Request Login

1. Click **"New"** → **"HTTP Request"**
2. Đặt method: **POST**
3. URL: `http://localhost:3000/api/v1/auth/login`
4. Tab **Headers**:
   - Key: `Content-Type`
   - Value: `application/json`
5. Tab **Body**:
   - Chọn **raw**
   - Chọn **JSON** (dropdown bên phải)
   - Paste:
     ```json
     {
         "userId": "admin",
         "password": "Dunghoi1"
     }
     ```
6. Click **Send**
7. **Copy token** từ response

### 2. Tạo Request Schedule Init

1. Click **"New"** → **"HTTP Request"**
2. Đặt method: **POST**
3. URL: `http://localhost:3000/api/v1/schedule/init`
4. Tab **Headers**:
   - Key: `Content-Type`, Value: `application/json`
   - Key: `Authorization`, Value: `Bearer <PASTE_TOKEN_HERE>`
     
     **Ví dụ:**
     ```
     Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsImdyb3VwSWQiOiJBRE1JTiIsImRlcHRJZCI6IktCIiwiaWF0IjoxNzM3OTY3MjAwLCJleHAiOjE3MzgwNTM2MDB9.abc123
     ```
     
5. Tab **Body**:
   - Chọn **raw**
   - Chọn **JSON**
   - Paste:
     ```json
     {
         "days": 30
     }
     ```
6. Click **Send**
7. Xem response

---

## Kiểm tra Kết quả trong Database

Sau khi gọi API thành công, kiểm tra database:

```sql
-- Kiểm tra hms_schedule
SELECT COUNT(*) as total_schedules
FROM hms_schedule 
WHERE hs_deptid = 'KB' 
  AND hs_date >= CURRENT_DATE;

-- Xem chi tiết
SELECT hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time
FROM hms_schedule 
WHERE hs_deptid = 'KB' 
  AND hs_date >= CURRENT_DATE
ORDER BY hs_date, hs_roomid, hs_shift
LIMIT 10;

-- Kiểm tra hms_schedule_exam
SELECT COUNT(*) as total_exam_slots
FROM hms_schedule_exam
WHERE hse_deptid = 'KB'
  AND hse_date >= CURRENT_DATE;
```

---

## Troubleshooting

### Lỗi: "Không tìm thấy token xác thực"

**Nguyên nhân:** Header Authorization không có hoặc sai format

**Giải pháp:**
1. Kiểm tra Header có key `Authorization` không
2. Kiểm tra value phải bắt đầu bằng `Bearer ` (có dấu cách)
3. Kiểm tra token đã paste đúng chưa

### Lỗi: "Token không hợp lệ"

**Nguyên nhân:** Token sai hoặc đã hết hạn (24h)

**Giải pháp:**
1. Login lại để lấy token mới
2. Copy token mới vào Authorization header

### Lỗi: "Token đã hết hạn"

**Nguyên nhân:** Token quá 24 giờ

**Giải pháp:**
1. Login lại để lấy token mới

### Lỗi: Connection refused

**Nguyên nhân:** Backend không chạy

**Giải pháp:**
```bash
cd d:\AI\vClinic\backend
npm run dev
```

---

## Postman Collection (Import vào Postman)

Tạo file `vClinic-API.postman_collection.json`:

```json
{
    "info": {
        "name": "vClinic API",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Auth",
            "item": [
                {
                    "name": "Login",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"userId\": \"admin\",\n    \"password\": \"Dunghoi1\"\n}"
                        },
                        "url": {
                            "raw": "http://localhost:3000/api/v1/auth/login",
                            "protocol": "http",
                            "host": ["localhost"],
                            "port": "3000",
                            "path": ["api", "v1", "auth", "login"]
                        }
                    }
                }
            ]
        },
        {
            "name": "Schedule",
            "item": [
                {
                    "name": "Init Schedule",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            },
                            {
                                "key": "Authorization",
                                "value": "Bearer {{token}}"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"days\": 30\n}"
                        },
                        "url": {
                            "raw": "http://localhost:3000/api/v1/schedule/init",
                            "protocol": "http",
                            "host": ["localhost"],
                            "port": "3000",
                            "path": ["api", "v1", "schedule", "init"]
                        }
                    }
                }
            ]
        }
    ]
}
```

**Cách import:**
1. Mở Postman
2. Click **Import**
3. Chọn file `vClinic-API.postman_collection.json`
4. Click **Import**

**Sử dụng:**
1. Gọi **Auth → Login**
2. Copy token từ response
3. Vào **Schedule → Init Schedule**
4. Thay `{{token}}` bằng token vừa copy
5. Send

---

## Kết quả Mong đợi

### ✅ Thành công

```json
{
    "success": true,
    "message": "Đã khởi tạo xong cho khoa KB",
    "scheduleCount": 120,
    "examSlotCount": 2400
}
```

Database sẽ có:
- ~120 records trong `hms_schedule`
- ~2400 records trong `hms_schedule_exam`

### ❌ Thất bại

Nếu vẫn lỗi, kiểm tra:
1. Backend có chạy không? (`npm run dev`)
2. Token có đúng không?
3. Header Authorization có đúng format không?
4. Database connection có OK không?
