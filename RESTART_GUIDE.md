# 🔧 HƯỚNG DẪN RESTART ĐÚNG CÁCH

## Vấn đề hiện tại

Backend vẫn chạy port **3001** mặc dù `.env` đã có `PORT=3000`

**Nguyên nhân:** Nodemon đã cache biến môi trường cũ, cần restart hoàn toàn.

## ✅ Giải pháp

### Bước 1: Stop TẤT CẢ processes

#### Terminal Backend:
1. Nhấn **Ctrl+C** để stop
2. Nếu không stop được, nhấn **Ctrl+C** thêm lần nữa
3. Đợi thấy dòng: `[nodemon] clean exit - waiting for changes before restart`

#### Terminal Frontend:
1. Nhấn **Ctrl+C** để stop
2. Đợi thấy prompt trở lại

### Bước 2: Kill processes (nếu vẫn chạy)

Chạy lệnh này để kill tất cả node processes:

```powershell
# Tìm và kill processes trên port 3000, 3001, 5173
Get-NetTCPConnection -LocalPort 3000,3001,5173 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

Hoặc đơn giản hơn:

```powershell
# Kill tất cả node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Bước 3: Verify ports đã free

```powershell
# Kiểm tra port 3000
netstat -ano | findstr :3000

# Kiểm tra port 5173
netstat -ano | findstr :5173
```

**Kết quả mong đợi:** Không có output (ports đã free)

### Bước 4: Restart Backend

```bash
cd d:\AI\vClinic\backend
npm run dev
```

**Phải thấy:**
```
🚀 vClinic Backend Server
📡 Running on port 3000    ← PHẢI LÀ 3000!
🌐 http://localhost:3000
```

**Nếu vẫn thấy 3001:**
1. Stop lại (Ctrl+C)
2. Xóa cache nodemon:
   ```bash
   rm -rf node_modules/.cache
   ```
3. Restart lại: `npm run dev`

### Bước 5: Restart Frontend

```bash
cd d:\AI\vClinic
npm run dev
```

**Phải thấy:**
```
VITE v6.4.1  ready in 192 ms
➜  Local:   http://localhost:5173/    ← PHẢI LÀ 5173!
```

### Bước 6: Test

1. Mở http://localhost:5173
2. F12 → Console → Chạy:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. Login: admin / Dunghoi1
4. Test "Khởi tạo lịch khám"

## 🔍 Troubleshooting

### Vấn đề 1: Backend vẫn chạy port 3001

**Giải pháp:**
```bash
# Xóa toàn bộ node_modules và reinstall
cd d:\AI\vClinic\backend
rm -rf node_modules
npm install
npm run dev
```

### Vấn đề 2: Port đang được sử dụng

**Error:** `EADDRINUSE: address already in use :::3000`

**Giải pháp:**
```powershell
# Tìm process đang dùng port 3000
netstat -ano | findstr :3000

# Kết quả: TCP  0.0.0.0:3000  0.0.0.0:0  LISTENING  12345
# 12345 là PID

# Kill process đó
taskkill /PID 12345 /F
```

### Vấn đề 3: Frontend vẫn lỗi ECONNREFUSED

**Nguyên nhân:** Backend chưa chạy hoặc chạy sai port

**Kiểm tra:**
```bash
# Test backend trực tiếp
curl http://localhost:3000/api/health
```

**Kết quả mong đợi:**
```json
{
    "status": "OK",
    "message": "vClinic Backend API",
    "version": "1.0.0"
}
```

**Nếu lỗi:** Backend chưa chạy hoặc chạy sai port

## ✅ Checklist

- [ ] Đã stop cả 2 terminals (Ctrl+C)
- [ ] Đã kill tất cả node processes
- [ ] Đã verify ports free (netstat)
- [ ] Backend restart và thấy `port 3000`
- [ ] Frontend restart và thấy `port 5173`
- [ ] Test `curl http://localhost:3000/api/health` thành công
- [ ] Mở http://localhost:5173 thành công
- [ ] Đã clear localStorage
- [ ] Đã login lại
- [ ] Test "Khởi tạo lịch khám" thành công

## 🎯 Kết quả mong đợi

### Backend logs:
```
🚀 vClinic Backend Server
📡 Running on port 3000
[authMiddleware] Authorization header: Bearer eyJ...
✅ Token verified successfully
✅ Đã tạo 667 ca làm việc
```

### Frontend:
- URL: http://localhost:5173
- Click "Khởi tạo lịch khám" → Success!
- Không redirect về login

### Database:
```sql
SELECT COUNT(*) FROM hms_schedule WHERE hs_deptid = 'KB';
-- Kết quả: ~667 rows
```

## 📞 Nếu vẫn không được

Chụp màn hình:
1. Backend terminal (phải thấy port 3000)
2. Frontend terminal (phải thấy port 5173)
3. Browser console (sau khi test)
4. Backend logs (khi click button)

Gửi cho tôi để debug tiếp!
