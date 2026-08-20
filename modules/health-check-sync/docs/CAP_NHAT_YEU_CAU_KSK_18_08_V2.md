# BÁO CÁO CẬP NHẬT CHỈNH SỬA PHÂN HỆ KHÁM SỨC KHỎE (V2)

**Căn cứ tài liệu:** [`modules/health-check-sync/docs/Chinh sua KSK 18-08-2026_V2.pdf`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/docs/Chinh%20sua%20KSK%2018-08-2026_V2.pdf)

---

## 1. Danh sách các nội dung đã chỉnh sửa & hoàn thiện

### Mục 1 (Trang 1 & Trang 5): Xóa bỏ triệt để dữ liệu mặc định ban đầu (Chống khai khống dữ liệu)
- **Tệp chỉnh sửa:**
  - [`backend/src/controllers/health-check/reception.controller.ts`](file:///d:/AI/VIMES_HIS/backend/src/controllers/health-check/reception.controller.ts): Đặt trường `clinical_exam.gynecology` mặc định là chuỗi rỗng `''` thay vì gán sẵn `'Bình thường'` khi tiếp nhận hồ sơ.
  - [`modules/health-check-sync/hooks/useDynamicFormState.ts`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/hooks/useDynamicFormState.ts): Đảm bảo các giá trị khởi tạo lâm sàng và thể lực đều là chuỗi rỗng `''`.
  - [`modules/health-check-sync/forms/PrintFormMau3.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintFormMau3.tsx): Xóa bỏ toàn bộ các chuỗi fallback gán cứng (`'168'`, `'62'`, `'120/80'`, `'Bình thường, không có rối loạn tâm thần...'`, `'10/10'`, `'5m'`, `'Tiếng tim T1, T2 đều rõ...'`, `'Rì rào phế nang...'`).
  - **Kết quả:** Nếu bác sĩ chưa khám hoặc để trống ô nào, trên bản in sẽ để trống ô đó (hoặc hiển thị `--`), không tự động điền khống bất kỳ kết luận bình thường nào.

### Mục 2 (Trang 2): Gắn nút và Modal "Thêm dịch vụ từ danh mục" tại tab Cận lâm sàng
- **Tệp chỉnh sửa:** [`modules/health-check-sync/forms/tabs/LabTab.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/tabs/LabTab.tsx)
- **Kết quả:**
  - Bổ sung nút bấm **"+ Thêm dịch vụ từ danh mục"** trên thanh công cụ Cận lâm sàng.
  - Xây dựng Modal popup chọn danh mục dịch vụ theo từng nhóm (Xét nghiệm, Chẩn đoán hình ảnh, Thăm dò chức năng), hỗ trợ tìm kiếm nhanh theo mã/tên dịch vụ và nhấp đúp để thêm dịch vụ vào bảng kết quả.

### Mục 3 (Trang 3): Khắc phục vỡ font & mất chữ do màu trên Windows 7
- **Tệp chỉnh sửa:** [`modules/health-check-sync/forms/PrintFormMau3.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintFormMau3.tsx)
- **Kết quả:**
  - Toàn bộ bản in Mẫu 3 được ép sang font chữ có chân hệ thống `font-['Times_New_Roman',Times,serif]`, đảm bảo hiển thị sắc nét trên tất cả phiên bản Windows 7/10/11.
  - Thay thế toàn bộ các class màu xám nhạt (`text-slate-400`, `text-slate-500`) sang màu đen thuần `text-black` (#000000) và viền `border-black` để văn bản không bị mờ nhạt hay mất nét khi in ấn.

### Mục 4 (Trang 4): Sửa lỗi Tiền sử (Bệnh khác ICD-10, Đang điều trị bệnh, Thuốc thai sản)
- **Tệp chỉnh sửa:**
  - [`modules/health-check-sync/hooks/useDynamicFormState.ts`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/hooks/useDynamicFormState.ts):
    - Khôi phục đầy đủ `tsbtMaBenhKhac`, `tsbtThaiSan`, `tsbtMaBenhThaiSan`, `tsbtTenThuocThaiSan`, `tsMacBenh` khi nạp lại dữ liệu hồ sơ.
    - Sửa `handleSubmit` để lưu `ts_mac_benh: tsMacBenh`, `tsbt_dang_dieu_tri_benh: tsMacBenh === 1 ? '1' : '0'`, `benh_dang_dieu_tri: benhDangDieuTri || tenThuoc`.
  - [`modules/health-check-sync/forms/PrintFormMau3.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintFormMau3.tsx):
    - In rõ mã và tên bệnh ICD-10 của mục 22 *Bệnh khác* khi có chọn.
    - In đầy đủ trạng thái đang điều trị bệnh kèm tên thuốc điều trị.
    - In đầy đủ thông tin thuốc thai sản (`tsbt_ten_thuoc_thai_san`).

### Mục 5 (Trang 5): Chèn chữ ký Bác sĩ chuyên khoa hoặc để rộng ô ký tay
- **Tệp chỉnh sửa:** [`modules/health-check-sync/forms/PrintFormMau3.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintFormMau3.tsx)
- **Kết quả:**
  - Hàm `renderDoctorSignCell` tự động tìm và chèn ảnh chữ ký của bác sĩ từng chuyên khoa nếu có trong hệ thống.
  - Thiết lập chiều cao ô `min-h-[65px]` (h-16) để bác sĩ có đủ không gian ký tay trực tiếp lên bản in nếu chưa có chữ ký ảnh.

### Mục 6 (Trang 6): Cận lâm sàng hiển thị theo từng dịch vụ (ô vuông) & Bỏ chữ ký Người kết luận để ký tay
- **Tệp chỉnh sửa:** [`modules/health-check-sync/forms/PrintFormMau3.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintFormMau3.tsx)
- **Kết quả:**
  - Bỏ phân chia 3 nhóm cố định (Xét nghiệm, CĐHA, TDCN), chuyển sang hiển thị từng dịch vụ cận lâm sàng thành từng ô chữ nhật/vuông riêng biệt gồm: Tên dịch vụ, Đơn vị, Kết quả, Mô tả chi tiết, Kết luận / Đánh giá.
  - Ô "NGƯỜI KẾT LUẬN" luôn để trống khoảng cách ký tay (`h-20`) kèm họ tên bác sĩ bên dưới để bác sĩ tự ký tay theo yêu cầu.
