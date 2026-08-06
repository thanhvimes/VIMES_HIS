# 🎯 VẤN ĐỀ CHÍNH XÁC VÀ GIẢI PHÁP

## 🔴 Vấn đề tìm được:

Từ phân tích code và logs:

1. **Backend đang chạy PORT 3001** (từ log user)
2. **File `.env` có PORT=3000** (đúng)
3. **Frontend proxy target: `http://localhost:3000`** (đúng)
4. **→ MISMATCH! Frontend gọi port 3000, backend nghe port 3001!**

## 🔍 Tại sao xảy ra?

- Backend đã cache biến môi trường cũ (`PORT=3001`)
- Nodemon không tự động reload `.env` khi thay đổi
- → Backend vẫn chạy port 3001 mặc dù `.env` đã sửa thành 3000

## ✅ GIẢI PHÁP CUỐI CÙNG

### Bước 1: Stop TẤT CẢ

```bash
# Trong terminal backend: Ctrl+C
# Trong terminal frontend: Ctrl+C
```

### Bước 2: Verify .env

```bash
cd d:\AI\vClinic\backend
cat .env | findstr PORT
```

**Phải thấy:** `PORT=3000`

**Nếu thấy `PORT=3001`**, sửa lại:
```bash
# Mở .env và sửa dòng đầu tiên thành:
PORT=3000
```

### Bước 3: Clear caches

```bash
# Backend
cd d:\AI\vClinic\backend
rm -rf node_modules/.cache

# Frontend  
cd d:\AI\vClinic
rm -rf node_modules/.vite
rm -rf dist
```

### Bước 4: Restart Backend TRƯỚC

```bash
cd d:\AI\vClinic\backend
npm run dev
```

**QUAN TRỌNG:** Đợi và kiểm tra log, PHẢI THẤY:
```
🚀 vClinic Backend Server
📡 Running on port 3000    ← PHẢI LÀ 3000!
🌐 http://localhost:3000
```

**NẾU VẪN THẤY 3001:**
```bash
# Stop (Ctrl+C)
# Kill tất cả node
Get-Process node | Stop-Process -Force
# Restart
npm run dev
```

### Bước 5: Restart Frontend

**CHỈ SAU KHI** backend đã chạy đúng port 3000:

```bash
cd d:\AI\vClinic
npm run dev
```

**Phải thấy:**
```
VITE v6.4.1  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Bước 6: Test

1. **Đóng TẤT CẢ tabs vClinic**
2. Mở **Incognito window** (Ctrl+Shift+N)
3. Vào http://localhost:5173
4. F12 → Console
5. Login: admin / Dunghoi1
6. **Kiểm tra Console** - phải thấy:
   ```
   [apiClient] ========== REQUEST DEBUG ==========
   [apiClient] Endpoint: /auth/login
   ```

7. Vào "Quản lý đăng ký"
8. Click "Khởi tạo lịch khám"
9. **Kiểm tra Console** - phải thấy:
   ```
   [apiClient] ========== REQUEST DEBUG ==========
   [apiClient] Endpoint: /schedule/init
   [apiClient] localStorage.currentUser exists: true
   [apiClient] Token extracted: eyJ...
   [apiClient] Headers: {
     "Authorization": "Bearer eyJ..."
   }
   ```

10. **Kiểm tra Backend logs** - phải thấy:
    ```
    [authMiddleware] Authorization header: Bearer eyJ...
    ✅ Token verified successfully
    ✅ Đã tạo 667 ca làm việc
    ```

## 🎯 Kết quả mong đợi

### ✅ Nếu thành công:

- Backend: `Running on port 3000`
- Frontend: `Local: http://localhost:5173`
- Console có log `[apiClient]`
- Backend nhận được token
- Schedule init thành công
- Database có dữ liệu mới

### ❌ Nếu vẫn lỗi:

**Lỗi 1: Backend vẫn chạy port 3001**
→ Xóa toàn bộ `node_modules` và reinstall:
```bash
cd d:\AI\vClinic\backend
rm -rf node_modules
npm install
npm run dev
```

**Lỗi 2: Console không có log `[apiClient]`**
→ Frontend chưa load code mới:
```bash
cd d:\AI\vClinic
rm -rf node_modules
npm install
npm run dev
```

**Lỗi 3: ECONNREFUSED**
→ Backend chưa chạy hoặc chạy sai port. Kiểm tra lại Bước 4.

## 📸 Chụp màn hình gửi cho tôi:

1. **Backend terminal** - phải thấy `port 3000`
2. **Frontend terminal** - phải thấy `port 5173`
3. **Browser Console** - sau khi click "Khởi tạo lịch khám"
4. **Backend logs** - khi nhận request

Nếu làm đúng các bước trên, vấn đề SẼ ĐƯỢC GIẢI QUYẾT!
