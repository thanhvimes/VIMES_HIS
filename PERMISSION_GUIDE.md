# 🔐 HƯỚNG DẪN PHÂN QUYỀN MODULE

> **Ghi chú:** Tài liệu này hướng dẫn cách quản lý phân quyền truy cập các module trong hệ thống vClinic

---

## 📋 TỔNG QUAN

Hệ thống phân quyền dựa trên **Role-Based Access Control (RBAC)**, mỗi user được gán 1 role và chỉ thấy các module được phép.

### File cấu hình chính:
- **Frontend:** [`modules/dashboard/Dashboard.tsx`](./modules/dashboard/Dashboard.tsx) - Cấu hình module cards
- **Backend:** [`contexts/SessionContext.tsx`](./contexts/SessionContext.tsx) - Mapping groupId → role

---

## 👥 CÁC ROLE TRONG HỆ THỐNG

| Role | Mô tả | GroupId (DB) |
|------|-------|--------------|
| `admin` | Quản trị viên - Toàn quyền | `M` |
| `doctor` | Bác sĩ | `D` |
| `nurse` | Điều dưỡng | `N` |
| `receptionist` | Lễ tân / Tiếp nhận | Mặc định (nếu không match) |
| `technician` | Kỹ thuật viên (XN, CĐHA) | Chưa map |
| `accountant` | Kế toán | Chưa map |
| `pharmacist` | Dược sĩ | Chưa map |
| `hr` | Nhân sự | Chưa map |
| `director` | Giám đốc | Chưa map |

---

## 🎯 TRẠNG THÁI HIỆN TẠI

### Module "Đăng ký Online" (TẠMTHỜI)

**File:** `modules/dashboard/Dashboard.tsx` - Dòng 46

```typescript
allowedRoles: ['admin', 'receptionist', 'doctor', 'nurse', 'technician', 'accountant', 'pharmacist', 'hr', 'director']
```

**Trạng thái:** ✅ **MỞ CHO TẤT CẢ** (để test)

**Lý do:** Cho phép tất cả user test module Online Booking trước khi triển khai chính thức

---

## 🔧 CÁCH ĐIỀU CHỈNH PHÂN QUYỀN

### Bước 1: Mở file Dashboard.tsx

```bash
# Mở file
code d:\AI\vClinic\modules\dashboard\Dashboard.tsx
```

### Bước 2: Tìm module cần điều chỉnh

Tìm trong mảng `MODULE_CARDS` (khoảng dòng 41-60):

```typescript
const MODULE_CARDS: ModuleCardConfig[] = [
    { 
        id: 'online-booking', 
        title: 'Đăng ký Online', 
        // ...
        allowedRoles: ['admin', 'receptionist', 'doctor'], // ← Chỉnh ở đây
    },
    // ... các module khác
];
```

### Bước 3: Sửa allowedRoles

**Ví dụ 1: Chỉ cho admin và receptionist**
```typescript
allowedRoles: ['admin', 'receptionist']
```

**Ví dụ 2: Cho tất cả trừ hr và accountant**
```typescript
allowedRoles: ['admin', 'doctor', 'nurse', 'receptionist', 'technician', 'pharmacist', 'director']
```

**Ví dụ 3: Chỉ admin**
```typescript
allowedRoles: ['admin']
```

### Bước 4: Lưu file và test

```bash
# Nếu đang chạy dev server, tự động reload
# Nếu production, cần build lại:
npm run build
```

---

## 📝 PHÂN QUYỀN ĐỀ XUẤT CHO CÁC MODULE

### Module "Đăng ký Online"
**Đề xuất:** `['admin', 'receptionist', 'doctor']`

**Lý do:**
- `admin`: Quản trị hệ thống
- `receptionist`: Người duyệt và quản lý lịch hẹn
- `doctor`: Bác sĩ xem lịch hẹn của mình

---

### Module "Tiếp Nhận & Điều Phối"
**Đề xuất:** `['admin', 'receptionist', 'nurse']`

**Lý do:**
- Lễ tân tiếp nhận bệnh nhân
- Điều dưỡng hỗ trợ phân luồng

---

### Module "Khám Bệnh (EMR)"
**Đề xuất:** `['admin', 'doctor']`

**Lý do:**
- Chỉ bác sĩ được khám và ghi hồ sơ bệnh án

---

### Module "Xét Nghiệm (LIS)"
**Đề xuất:** `['admin', 'doctor', 'technician']`

**Lý do:**
- Bác sĩ chỉ định và xem kết quả
- Kỹ thuật viên thực hiện xét nghiệm

---

### Module "Dược & Kho"
**Đề xuất:** `['admin', 'pharmacist', 'accountant']`

**Lý do:**
- Dược sĩ quản lý thuốc
- Kế toán theo dõi tồn kho

---

### Module "Viện Phí"
**Đề xuất:** `['admin', 'accountant', 'receptionist']`

**Lý do:**
- Kế toán quản lý thu chi
- Lễ tân thu tiền tại quầy

---

### Module "Báo Cáo Thống Kê"
**Đề xuất:** `['admin', 'director', 'accountant']`

**Lý do:**
- Giám đốc xem báo cáo tổng quan
- Kế toán xem báo cáo tài chính

---

### Module "Hệ Thống"
**Đề xuất:** `['admin']`

**Lý do:**
- Chỉ admin được cấu hình hệ thống

---

## 🔄 CẬP NHẬT MAPPING GROUPID → ROLE

Nếu cần map thêm groupId từ database, sửa file `contexts/SessionContext.tsx`:

### Vị trí: Dòng 77 và 112

**Hiện tại:**
```typescript
role: info.groupId === 'M' ? 'admin' : 
      info.groupId === 'D' ? 'doctor' : 
      info.groupId === 'N' ? 'nurse' : 
      'receptionist'
```

**Đề xuất mở rộng:**
```typescript
role: info.groupId === 'M' ? 'admin' : 
      info.groupId === 'D' ? 'doctor' : 
      info.groupId === 'N' ? 'nurse' : 
      info.groupId === 'R' ? 'receptionist' :
      info.groupId === 'T' ? 'technician' :
      info.groupId === 'A' ? 'accountant' :
      info.groupId === 'P' ? 'pharmacist' :
      info.groupId === 'H' ? 'hr' :
      info.groupId === 'DIR' ? 'director' :
      'receptionist' // Default
```

**Lưu ý:** Cần kiểm tra bảng `sys_user_group` trong database để biết chính xác các groupId

---

## 🗄️ KIỂM TRA GROUPID TRONG DATABASE

```sql
-- Xem tất cả user groups
SELECT * FROM sys_user_group;

-- Xem group của user cụ thể
SELECT u.user_id, u.user_name, ug.group_id, ug.group_name
FROM sys_user u
LEFT JOIN sys_user_group ug ON u.group_id = ug.group_id
WHERE u.user_id = 'your_user_id';
```

---

## 🧪 KIỂM TRA PHÂN QUYỀN

### Cách 1: Kiểm tra trong Console (F12)

```javascript
// Xem thông tin user hiện tại
JSON.parse(localStorage.getItem('userInfo'))

// Xem role đã được map
JSON.parse(localStorage.getItem('currentUser')).role

// Xem modules được phép
// (Cần xem trong React DevTools)
```

### Cách 2: Test với nhiều user

1. Đăng nhập bằng user có role khác nhau
2. Kiểm tra xem module có hiển thị không
3. Ghi chú lại kết quả

---

## 📊 BẢNG PHÂN QUYỀN ĐỀ XUẤT

| Module | Admin | Doctor | Nurse | Receptionist | Technician | Accountant | Pharmacist | HR | Director |
|--------|-------|--------|-------|--------------|------------|------------|------------|----|----|
| **Đăng ký Online** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tiếp Nhận** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Khám Bệnh** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Nội Trú** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Phẫu Thuật** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Xét Nghiệm** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CĐHA** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Dược** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Vật tư** | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Viện Phí** | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Bảo Hiểm** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Nhân Sự** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Báo Cáo** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Hệ Thống** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔒 BẢO MẬT

### Lưu ý quan trọng:

1. **Frontend chỉ là UI:** Phân quyền trên frontend chỉ ẩn/hiện module, KHÔNG phải bảo mật thực sự

2. **Backend phải kiểm tra:** Mỗi API endpoint phải kiểm tra quyền của user

3. **Middleware bảo mật:** Cần implement middleware kiểm tra role trước khi xử lý request

**Ví dụ backend middleware:**
```javascript
// backend/src/middleware/auth.middleware.js
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};

// Sử dụng:
router.get('/bookings', checkRole(['admin', 'receptionist']), getBookings);
```

---

## 📝 TODO - PHÂN QUYỀN CHI TIẾT HƠN

- [ ] Implement permission-based access (ngoài role-based)
- [ ] Thêm phân quyền theo department (khoa/phòng)
- [ ] Phân quyền theo chức năng cụ thể (view/edit/delete)
- [ ] Audit log cho các thao tác quan trọng
- [ ] UI quản lý phân quyền cho admin

---

## 🔄 KHÔI PHỤC PHÂN QUYỀN SAU KHI TEST

Khi đã test xong module Online Booking, nhớ khôi phục lại phân quyền:

### File: `modules/dashboard/Dashboard.tsx` - Dòng 46

**Từ (hiện tại - test):**
```typescript
allowedRoles: ['admin', 'receptionist', 'doctor', 'nurse', 'technician', 'accountant', 'pharmacist', 'hr', 'director']
```

**Về (production):**
```typescript
allowedRoles: ['admin', 'receptionist', 'doctor']
```

Xóa comment `// TEMP: Open to all roles for testing`

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề về phân quyền:

1. Kiểm tra role của user: `localStorage.getItem('currentUser')`
2. Kiểm tra groupId trong database: `SELECT * FROM sys_user WHERE user_id = 'xxx'`
3. Kiểm tra mapping trong `SessionContext.tsx`
4. Kiểm tra allowedRoles trong `Dashboard.tsx`

---

**Cập nhật lần cuối:** 2026-01-21

**Trạng thái:** Module Online Booking đang mở cho tất cả roles (TESTING)
