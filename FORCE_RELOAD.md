# 🚨 FORCE RELOAD - Vite chưa load code mới!

## Vấn đề

Console KHÔNG có log `[apiClient]` → Vite chưa reload code mới!

## Giải pháp

### Bước 1: Stop frontend
```bash
# Trong terminal đang chạy npm run dev
# Nhấn Ctrl+C
```

### Bước 2: Xóa Vite cache
```bash
cd d:\AI\vClinic
rm -rf node_modules/.vite
```

### Bước 3: Restart
```bash
npm run dev
```

**Đợi thấy:**
```
VITE v6.4.1  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Bước 4: Hard reload browser
1. **Đóng TẤT CẢ tabs vClinic**
2. **Mở lại** http://localhost:5173
3. **Nhấn Ctrl+Shift+R** (Hard reload)
4. Hoặc F12 → Right-click reload button → "Empty Cache and Hard Reload"

### Bước 5: Test lại
1. Login: admin / Dunghoi1
2. **Xem Console** - BÂY GIỜ PHẢI THẤY:
   ```
   [apiClient] ========== REQUEST DEBUG ==========
   [apiClient] Endpoint: /auth/login
   [apiClient] Method: POST
   ```

3. Vào "Quản lý đăng ký"
4. Click "Khởi tạo lịch khám"
5. **Xem Console** - PHẢI THẤY:
   ```
   [apiClient] ========== REQUEST DEBUG ==========
   [apiClient] Endpoint: /schedule/init
   [apiClient] localStorage.currentUser exists: true
   [apiClient] Token extracted: eyJ...
   [apiClient] Headers: { "Authorization": "Bearer ..." }
   ```

### Bước 6: Chụp màn hình Console

Nếu thấy log `[apiClient]` → Chụp và gửi cho tôi!

## 🎯 Nếu VẪN không thấy log

Thử cách này:

```bash
# Stop frontend
# Xóa toàn bộ node_modules
cd d:\AI\vClinic
rm -rf node_modules
npm install
npm run dev
```

Sau đó test lại!
