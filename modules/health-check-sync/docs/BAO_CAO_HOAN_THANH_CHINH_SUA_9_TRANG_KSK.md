# BÁO CÁO HOÀN THÀNH CHỈNH SỬA MODULE KHÁM SỨC KHỎE THEO YÊU CẦU 9 TRANG (QĐ 1551 & QĐ 2062)

## 1. Tổng quan công việc
Thực hiện rà soát toàn diện, sửa lỗi và đồng bộ hóa các trường dữ liệu, giao diện, luồng import Excel, sinh XML liên thông VNeID và mẫu in ấn theo tài liệu yêu cầu 9 trang.

---

## 2. Chi tiết thực hiện theo 9 trang yêu cầu

### Trang 1: Sửa đổi Tiền sử Mẫu 3 (Người lớn) & Khắc phục lỗi chọn rượu bia
- **Vấn đề:** 
  - Thứ tự 20 chỉ tiêu tiền sử chưa khớp hoàn toàn với cổng Sở Y Tế.
  - Mục 11 *Nghiện rượu, bia* (`TSBT_NGHIEN_RUOU`) bị ràng buộc nhầm với *Sử dụng rượu thường xuyên, liên tục* (`tsSuDungRuou`).
  - Thiếu mục 22 *Bệnh khác (ghi rõ)* (`TSBT_MA_BENH_KHAC`).
- **Xử lý:**
  - Chuyển *Nghiện rượu, bia* lên vị trí số 11 (`tsbtNghienRuou`). Tách độc lập hoàn toàn trạng thái click của mục này với *Sử dụng rượu thường xuyên* (mục 20).
  - Đẩy các mục cũ lên 1 số (12 đến 21).
  - Đưa *Bệnh khác (ghi rõ)* lên thành mục 22 (`tsbtMaBenhKhac`).
  - Mục 23: *Tiền sử thai sản đối với nữ* (`tsbtThaiSan`, `tsbtMaBenhThaiSan`, `tsbtTenThuocThaiSan`).

### Trang 2: Ẩn phần Tiền sử Sản phụ khoa ở Mẫu 3
- **Vấn đề:** Mẫu 3 người lớn đang hiển thị cả khối `II.3. Tiền sử Sản phụ khoa` (kinh nguyệt, PARA, BPTT...) gây thừa thãi vì Mẫu 3 đã có mục 23 Thai sản.
- **Xử lý:** Ẩn hoàn toàn khối `II.3` khi `formType === '3'`.

### Trang 3: Bổ sung trường "Tình trạng sức khỏe; mắc các bệnh, tật (nếu có)" ở Kết luận Mẫu 3
- **Vấn đề:** Thiếu trường `CAC_BENH_TAT_NEU_CO` (Mục 121 QĐ 1551/2062) tại tab Kết luận và XML liên thông.
- **Xử lý:**
  - Bổ sung trường `cac_benh_tat_neu_co` vào bảng `health_check_masters` (Migration `068_update_health_check_vneid_fields.sql`).
  - Bổ sung state `cacBenhTatNeuCo`, `setCacBenhTatNeuCo` vào `useDynamicFormState.ts` và `DynamicFormContext.tsx`.
  - Thêm ô nhập tại `ConclusionTab.tsx`.
  - Ánh xạ thẻ `<CAC_BENH_TAT_NEU_CO>` trong XML12 tại `xml-generator.ts`.

### Trang 4: Sửa lỗi Import Excel mất số 0 đầu ở mã Tỉnh/Xã
- **Vấn đề:** Khi import file Excel danh sách nhân viên công ty, các cột mã Tỉnh (`MATINH_CU_TRU`), mã Xã (`MAXA_CU_TRU`) bị hàm `parseInt` cắt mất số 0 dẫn đầu (ví dụ: `01` -> `1`, `00001` -> `1`).
- **Xử lý:**
  - Bổ sung cột `hee_prov_code VARCHAR(20)`, `hee_vill_code VARCHAR(20)` vào bảng `hms_exm_employee`.
  - Sửa `ContractManagement.tsx` và `employees.controller.ts` để lưu trữ và xử lý mã dưới dạng chuỗi nguyên bản (giữ nguyên tiền tố số 0).
  - Cập nhật `reception.controller.ts` để khi tiếp đón tự động lấy đúng mã chuỗi có số 0 vào `matinh_cu_tru`, `maxa_cu_tru`.

### Trang 5: Sửa XML generator bị Fallback & Xóa dữ liệu CDATA giả lập Cận lâm sàng
- **Vấn đề:** 
  - XML liên thông bị fallback về "Bình thường" do lệch alias field giữa form state và XML generator.
  - Mục Cận lâm sàng không có kết quả nhưng tự động sinh CDATA giả lập Huyết sắc tố 130 g/L.
- **Xử lý:**
  - Mở rộng toàn diện bảng alias `tagMap` trong `findValue()` của `xml-generator.ts`.
  - Xóa bỏ hoàn toàn khối `CHI_TIET_CLS` hardcoded fake fallback. Nếu không có kết quả thì sinh `<DANH_SACH_CLS></DANH_SACH_CLS>` rỗng đúng chuẩn.

### Trang 6: Sửa tiêu đề và nội dung Mẫu in Mẫu 3 KSK định kỳ
- **Vấn đề:** Bấm "In" hồ sơ Mẫu 3 KSK định kỳ bị hiển thị tiêu đề và cấu trúc của Giấy KSK Lái xe.
- **Xử lý:**
  - Trong `PrintFormMau3.tsx`, thêm cơ chế phân biệt `isDriver` (`form_type === 'driver'` hoặc có cờ lái xe) với KSK Người lớn thông thường.
  - Nếu là KSK Người lớn Mẫu 3: Tiêu đề là **GIẤY KHÁM SỨC KHỎE** *(Dành cho người từ đủ 18 tuổi trở lên theo Thông tư số 32/2023/TT-BYT & QĐ 2062/QĐ-BYT)*.
  - Tiêu đề mục I: **I. THÔNG TIN CỦA NGƯỜI ĐƯỢC KHÁM SỨC KHỎE** (hiển thị Nghề nghiệp/Nơi công tác thay cho Hạng lái xe).
  - Tiêu đề mục II: **II. TIỀN SỬ BỆNH TẬT** (Bảng 22 chỉ tiêu + thai sản).
  - Tiêu đề mục VI: **VI. KẾT LUẬN** (Phân loại sức khỏe Loại I - V, Các bệnh tật nếu có, Tình trạng sức khỏe bệnh tật nếu có theo Mục 121, Quản lý bệnh, Các vấn đề lưu ý).

### Trang 7: Mẫu 2 (6-18 tuổi) - Bổ sung mục 36-39 Thuốc đang sử dụng & Bệnh đang điều trị
- **Vấn đề:** Thiếu các trường nhập và gửi lên cổng: Mục 36 (Bệnh 5 năm qua), Mục 37 (Hiện tại mắc bệnh gì), Mục 38 (Đang điều trị bệnh gì không), Mục 39 (Tên bệnh và thuốc đang sử dụng).
- **Xử lý:**
  - Thêm cột `tsbt_dang_dieu_tri_benh`, `benh_dang_dieu_tri` vào Database.
  - Cập nhật form Mẫu 2 trong `HistoryTab.tsx` đủ 4 mục 36-39.
  - Ánh xạ thẻ `<BENH_DANG_DIEU_TRI>` trong XML1.

### Trang 8: Mẫu 2 (6-18 tuổi) - Chuẩn hóa Tiền sử Sản phụ khoa (Mục 26-28 QĐ 1551)
- **Vấn đề:** Mẫu 2 đang hiển thị các trường sản phụ khoa người lớn (PARA, BPTT, mổ đẻ...).
- **Xử lý:** Thay thế bằng đúng 3 trường chuẩn QĐ 1551 cho nữ 6-18 tuổi:
  - 26. `SAN_KHOA`: Đã dậy thì / có kinh nguyệt chưa (0 - Chưa, 1 - Có).
  - 27. `SAN_KHOA_KHONG_BT`: Bất thường sản phụ khoa (0 - Bình thường, 1 - Bất thường).
  - 28. `MA_BENH_SAN_KHOA_KHONG_BT`: Cụ thể mã bệnh ICD-10 bất thường.

### Trang 9: Mẫu 2 (6-18 tuổi) - Bổ sung ô nhập "Khám lâm sàng khác"
- **Vấn đề:** Thiếu ô nhập `NHI_KHOA_LAM_SANG_KHAC`.
- **Xử lý:**
  - Thêm trường `nhi_khoa_lam_sang_khac` vào Database và XML generator.
  - Bổ sung ô nhập vào `InternalMedTab.tsx` (và `HistoryTab.tsx`) khi `formType === '2'`.

---

## 3. Danh sách tệp đã tạo & chỉnh sửa

### Database Migration:
- `backend/migrations/068_update_health_check_vneid_fields.sql`

### Backend Controllers:
- `backend/src/controllers/health-check/xml-generator.ts`
- `backend/src/controllers/health-check/employees.controller.ts`
- `backend/src/controllers/health-check/reception.controller.ts`

### Frontend Module:
- `modules/health-check-sync/hooks/useDynamicFormState.ts`
- `modules/health-check-sync/forms/DynamicFormContext.tsx`
- `modules/health-check-sync/forms/tabs/HistoryTab.tsx`
- `modules/health-check-sync/forms/tabs/ConclusionTab.tsx`
- `modules/health-check-sync/forms/tabs/exam/InternalMedTab.tsx`
- `modules/health-check-sync/components/ContractManagement.tsx`
- `modules/health-check-sync/forms/PrintFormMau3.tsx`

---

## 4. Kết quả kiểm tra
- **Frontend Typecheck (`npm run typecheck`):** Passed (Exit code 0).
- **Backend Typecheck (`npm run typecheck`):** Passed (Exit code 0).
