# HƯỚNG DẪN QUẢN LÝ NHẬT KÝ THAO TÁC & QUY TRÌNH HỦY KÝ SỐ KẾT QUẢ (RIS/PACS AUDIT TRAIL)

## 1. Giới thiệu
Tài liệu hướng dẫn sử dụng tính năng **Nhật ký thao tác lâm sàng & Quản lý vòng đời ký số / Hủy ký số** trong phân hệ Chẩn đoán hình ảnh (RIS/PACS) thuộc hệ thống VIMES HIS.

Hệ thống cho phép:
- Ghi nhận minh bạch Bác sĩ nào trả kết quả, ký số ca chụp nào.
- Cho phép Bác sĩ / Trưởng khoa hủy chữ ký số khi phát hiện sai sót hoặc cần bổ sung kết quả theo hội chẩn lâm sàng.
- Bắt buộc nhập **Lý do hủy ký số** và lưu vết kiểm toán (Audit Trail) phục vụ tra cứu trách nhiệm khi có sự cố y khoa.
- Xuất báo cáo nhật ký ra định dạng CSV/Excel theo chuẩn lưu trữ bệnh án điện tử của Bộ Y Tế.

---

## 2. Quy trình Trả Kết Quả & Ký Số (Sign & Approve)
1. Bác sĩ mở ca chụp từ **Danh sách ca chụp** hoặc **Quản lý công việc**.
2. Nhập mô tả tổn thương (`findings`), kết luận chẩn đoán (`impression`), lời khuyên (`recommendation`).
3. Bấm **"Duyệt & Ký (F9)"**:
   - Hệ thống chuyển trạng thái ca chụp sang **ĐÃ KÝ (`SIGNED`)**.
   - Tự động ghi nhật ký `SIGN_REPORT` vào bảng `pacs_audit_log` (Gồm tên BS, Mã BN, Tên BN, Mã chỉ định, Kết luận, Thời gian, Địa chỉ IP).

---

## 3. Quy trình Hủy Ký Số & Mở Khóa Kết Quả (Revoke Signature)
Khi ca chụp đã ký nhưng cần chỉnh sửa lại:
1. Mở ca chụp đã ký.
2. Trên thanh công cụ, bấm nút **"Hủy Ký"** (màu đỏ cạnh badge *ĐÃ KÝ*).
3. Modal cảnh báo hiện ra:
   - Hiển thị thông tin Bệnh nhân và Mã ca chụp.
   - **Bắt buộc nhập Lý do hủy ký số** (ví dụ: *"Bổ sung mô tả quai động mạch chủ theo yêu cầu hội chẩn"*).
4. Bấm **"Xác Nhận Hủy Ký Số"**:
   - Hệ thống thu hồi chữ ký số, chuyển trạng thái ca chụp từ `SIGNED` về `DRAFT` (Bản nháp).
   - Mở khóa toàn bộ các ô nhập mô tả, kết luận để Bác sĩ chỉnh sửa lại.
   - Ghi nhận sự kiện `REVOKE_SIGNATURE` vào `pacs_audit_log` với lý do hủy chi tiết.

---

## 4. Màn hình Nhật Ký Bảo Mật & Kiểm Toán (`/imaging-results/audit-logs`)
Truy cập qua menu **Hệ Thống & Bảo Mật $\rightarrow$ Nhật Ký Bảo Mật**:
- **Bộ lọc sự kiện:**
  - 🟢 Bác Sĩ Ký Báo Cáo / Trả KQ (`SIGN_REPORT`)
  - 🔴 Bác Sĩ Hủy Ký Số & Mở Khóa (`REVOKE_SIGNATURE`)
  - 🟡 Bác Sĩ Lưu Nháp Kết Quả (`SAVE_DRAFT`)
  - 🔵 Mở Xem Ảnh DICOM 3D (`VIEW_STUDY`)
  - ⚪ Đăng Nhập Hệ Thống (`LOGIN`)
- **Tìm kiếm đa năng:** Tìm nhanh theo Tên Bác sĩ, Tên Bệnh nhân, Mã BN, Mã chỉ định, Lý do hủy/sửa, Địa chỉ IP.
- **Xuất Báo Cáo:** Bấm nút **"Xuất Báo Cáo"** để tải file `.csv` phục vụ báo cáo kiểm toán bệnh viện.
