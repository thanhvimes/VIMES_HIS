# 🔍 DEBUG TEST - Tìm vấn đề chính xác

## Đã thêm logging vào apiClient

Tôi đã thêm logging chi tiết vào `apiClient.ts` để theo dõi:
1. localStorage có `currentUser` không?
2. Token có được extract không?
3. Authorization header có được thêm vào không?

## 📋 Làm theo các bước sau:

### Bước 1: Restart frontend

```bash
# Stop frontend (Ctrl+C)
cd d:\AI\vClinic
npm run dev
```

**Đợi Vite compile xong!**

### Bước 2: Mở vClinic

1. Mở http://localhost:5173
2. **Mở DevTools (F12)**
3. **Chọn tab Console**
4. **Clear console** (click icon Clear hoặc Ctrl+L)

### Bước 3: Login

1. Login: admin / Dunghoi1
2. **Xem Console** - phải thấy:
   ```
   [apiClient] ========== REQUEST DEBUG ==========
   [apiClient] Endpoint: /auth/login
   [apiClient] Method: POST
   [apiClient] localStorage.currentUser exists: false
   [apiClient] Token extracted: NULL
   ```

3. **Sau khi login thành công**, chạy lệnh này trong Console:
   ```javascript
   const user = localStorage.getItem('currentUser');
   console.log('=== CHECK AFTER LOGIN ===');
   console.log('currentUser exists:', !!user);
   if (user) {
       const p = JSON.parse(user);
       console.log('Has token:', !!p.token);
       console.log('Token:', p.token ? p.token.substring(0, 50) : 'N/A');
   }
   ```

4. **Chụp màn hình Console** và gửi cho tôi!

### Bước 4: Test Schedule Init

1. Vào "Quản lý đăng ký"
2. **Clear Console** (Ctrl+L)
3. Click "Khởi tạo lịch khám"
4. **Xem Console ngay lập tức** - phải thấy:
   ```
   [apiClient] ========== REQUEST DEBUG ==========
   [apiClient] Endpoint: /schedule/init
   [apiClient] Method: POST
   [apiClient] localStorage.currentUser exists: true/false ???
   [apiClient] Token extracted: eyJ.../NULL ???
   [apiClient] Headers: { ... }
   ```

5. **QUAN TRỌNG:** Chụp màn hình Console với đầy đủ output!

### Bước 5: Gửi kết quả

Gửi cho tôi 2 ảnh chụp màn hình:
1. **Console sau khi login** (Bước 3)
2. **Console khi click "Khởi tạo lịch khám"** (Bước 4)

## 🎯 Những gì tôi cần thấy:

### Nếu `localStorage.currentUser exists: true` VÀ `Token extracted: eyJ...`

→ apiClient hoạt động đúng, vấn đề ở chỗ khác!

### Nếu `localStorage.currentUser exists: false` HOẶC `Token extracted: NULL`

→ Vấn đề là authService không lưu token đúng cách!

### Nếu có token nhưng Headers không có Authorization

→ Vấn đề là logic spread operator trong defaultHeaders!

## 📸 Ví dụ output mong đợi:

```
[apiClient] ========== REQUEST DEBUG ==========
[apiClient] Endpoint: /schedule/init
[apiClient] Method: POST
[apiClient] localStorage.currentUser exists: true
[apiClient] Token extracted: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOi...
[apiClient] Headers: {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
[apiClient] ========================================
[API Request] POST /api/v1/schedule/init
```

**Nếu thấy output như trên** → Token đang được gửi! Backend phải nhận được!

**Nếu không thấy Authorization trong Headers** → Đó là vấn đề!

## 🚨 Lưu ý

- **Phải clear console** trước mỗi test để dễ đọc
- **Phải chụp màn hình đầy đủ** console output
- **Đừng skip bất kỳ bước nào**

Làm xong gửi ảnh cho tôi, tôi sẽ biết chính xác vấn đề ở đâu!
