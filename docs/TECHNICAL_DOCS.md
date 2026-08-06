# TÀI LIỆU KỸ THUẬT: HỆ THỐNG QUẢN LÝ BỆNH VIỆN (VIMES HIS)

> [!IMPORTANT]
> Tài liệu kỹ thuật chi tiết về Kiến trúc hệ thống, Luồng dữ liệu và Mô tả từng File:
> [TECHNICAL_ARCHITECTURE_DETAILED.md](file:///C:/Users/Thanhhv/.gemini/antigravity/brain/7576bd31-3d82-4d01-ba2c-d99a46cb93cd/technical_architecture_detailed.md)
>
> 📘 **Hướng dẫn sử dụng dành cho nhân viên VIMES HIS:**
> [USER_MANUAL_DETAILED.md](file:///C:/Users/Thanhhv/.gemini/antigravity/brain/7576bd31-3d82-4d01-ba2c-d99a46cb93cd/user_manual_detailed.md)

## 1. Hướng dẫn Đăng nhập thử nghiệm
Hệ thống sử dụng cơ chế xác thực giả lập (Mock) để demo các kịch bản phân quyền.

*   **Tài khoản Quản trị (Admin):**
    *   Username: `admin`
    *   Password: `password`
    *   **Quyền hạn:** Nhìn thấy tất cả 14 module, có quyền vào hệ thống quản trị, cấu hình danh mục.
*   **Tài khoản Bác sĩ (Doctor):**
    *   Username: `demo`
    *   Password: `password`
    *   **Quyền hạn:** Nhìn thấy 10 module chuyên môn, không xem được module Nhân sự, Tài chính, Dược và Hệ thống.

## 2. Hệ thống Phân quyền (Authorization System)

Hệ thống sử dụng cơ chế RBAC (Role-Based Access Control) để kiểm soát quyền hạn ở 3 cấp độ:

### Cấp độ 1: Hiển thị Module (Module Visibility)
Tệp: `modules/dashboard/Dashboard.tsx`
Logic: Biến `allowedModules` lọc danh sách `MODULE_CARDS` dựa trên thuộc tính `allowedRoles`. 
*Nếu user có role 'admin', hệ thống sẽ bỏ qua bộ lọc và hiển thị toàn bộ.*

### Cấp độ 2: Menu Sidebar (Dynamic Navigation)
Tệp: `stores/useSystemStore.ts` (Hàm `getModuleNav`)
Logic: Khi truy cập vào một module, Sidebar sẽ gọi hàm này để lấy danh sách menu con phù hợp với vai trò của người dùng.
*Ví dụ: Trong module Nội trú, Bác sĩ thấy menu 'Ra y lệnh', Điều dưỡng thấy menu 'Phiếu chăm sóc'.*

### Cấp độ 3: Chức năng chi tiết (Action Permissions)
Tệp: Trực tiếp trong các View
Sử dụng: `const { user } = useSession();`
Logic: Kiểm tra `user.role` để ẩn/hiện hoặc vô hiệu hóa các nút bấm thao tác (Thêm, Sửa, Xóa).

## 3. Danh sách Module & Phân quyền mặc định

| ID Module | Tên Module | Quyền truy cập (Allowed Roles) |
| :--- | :--- | :--- |
| `command-center` | TT Điều hành | admin, director, doctor |
| `reception` | Tiếp Nhận | admin, receptionist, nurse, doctor |
| `clinical` | Khám Bệnh | admin, doctor |
| `inpatient` | Nội Trú | admin, doctor, nurse |
| `surgery` | Phẫu Thuật | admin, doctor, nurse |
| `lab` | Xét Nghiệm | admin, doctor, technician |
| `imaging` | CĐHA & PACS | admin, doctor, technician |
| `pharmacy` | Dược & Kho | admin, pharmacist, accountant |
| `billing` | Viện Phí | admin, accountant, receptionist |
| `insurance` | BHYT | admin, accountant, doctor |
| `telehealth` | Hội Chẩn Xa | admin, doctor |
| `hr` | Nhân sự | admin, hr |
| `reports` | Báo Cáo | admin, doctor, accountant |
| `admin` | Hệ Thống | admin |

---
**Ghi chú:** Mọi thay đổi về cấu trúc quyền vui lòng cập nhật tại mảng `MODULE_CARDS` trong `Dashboard.tsx`.
