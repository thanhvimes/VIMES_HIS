# BÁO CÁO HOÀN THIỆN BIỂU MẪU IN MẪU 1 (KHÁM SỨC KHỎE TRẺ EM DƯỚI 06 TUỔI)
*Theo Quyết định 2062/QĐ-BYT & Quyết định 1551/QĐ-BYT*
*Ngày thực hiện: 27/08/2026*

---

## 1. Mục tiêu và Phạm vi
Rà soát toàn diện và chuẩn hóa biểu mẫu in A4 của **Mẫu in số 1** ([`PrintFormMau1.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintFormMau1.tsx)) thuộc phân hệ Khám sức khỏe VNeID (`health-check-sync`), đảm bảo đầy đủ và chính xác tất cả các trường dữ liệu, khắc phục triệt để các lỗi lệch giá trị (value mismatch) và bổ sung phân hệ Cận lâm sàng, Kết luận phân loại sức khỏe.

---

## 2. Chi tiết Các Hạng mục Đã Khắc phục & Hoàn thiện

### 2.1. Thông tin Hành chính (Trang 1/3)
- **Bổ sung các trường thiếu sót:**
  - `Cân nặng lúc sinh` (`extra.can_nang_luc_sinh`) và `Tuần thai khi sinh` (`extra.tuan_thai_khi_sinh`).
  - `Họ tên người giám hộ` (`extra.nguoi_giam_ho`) và `Số định danh/CCCD người giám hộ` (`extra.so_cccd_ngh`).
  - `Con thứ mấy` (`extra.con_thu_may`) và `Tổng số con` (`extra.tong_so_con`).
  - `Vòng ngực` (`extra.vong_nguc`).
- **Chuẩn hóa danh mục hiển thị:**
  - `Nguồn chi trả`: Chuyển đổi mã số (`1`, `2`, `3`, `9`) sang nhãn chuẩn (*"3 - Quỹ Bảo hiểm y tế"*, *"Ngân sách Địa phương"*...).
  - `Đối tượng`: Chuyển đổi mã số (`10`, `11`...) sang nhãn chuẩn (*"10 - Trẻ em trong cơ sở giáo dục mầm non"*...).
  - `Dân tộc`: Chuẩn hóa mapping mã `'01'` sang *"Kinh"* và hiển thị đúng tên dân tộc.
  - `Mối quan hệ với trẻ`: Nhận diện linh hoạt không phân biệt chữ hoa/thường cho *"Cha/Bố"*, *"Mẹ"*, *"Ông/bà"*, *"Anh/chị"*, *"Họ hàng"*, *"Khác"*.

### 2.2. Tiền sử (Trang 1/3)
- Bổ sung `Tiền sử nghiện rượu, bia` (`extra.tsbt_nghien_ruou`).
- Bổ sung `Tiền sử bệnh khác (mã ICD-10)` (`extra.tsbt_ma_benh_khac`) kèm tên bệnh chuẩn từ từ điển ICD-10.

### 2.3. Dấu hiệu Sinh tồn & Đánh giá Dinh dưỡng (Trang 1/3)
- Bổ sung trích xuất đa nguồn cho Nhiệt độ, Mạch, Nhịp thở, Huyết áp, Chiều cao, Cân nặng, BMI.
- Đánh giá dinh dưỡng: Chiều dài/tuổi (SD), Cân nặng/tuổi (SD), Vòng đầu, Chu vi vòng cánh tay, Vòng ngực và 5 dấu hiệu dinh dưỡng (Phù, Thiếu máu, Còi xương, Suy dinh dưỡng, Thừa cân/béo phì).

### 2.4. Đánh giá Phát triển Tinh thần - Vận động & Tiêm chủng (Trang 2/3)
- Bảng đánh giá 3 chỉ tiêu phát triển tinh thần - vận động theo độ tuổi.
- Bảng kiểm tra sổ tiêm chủng 3 chỉ tiêu (Lao sơ sinh, Viêm gan B mũi 1 sơ sinh, Tiêm chủng đầy đủ theo tuổi).

### 2.5. Khám Lâm sàng Chuyên khoa (Trang 2/3 & 3/3)
- **Khắc phục lỗi lệch giá trị (Value Mismatch):**
  - Đồng bộ tất cả các trường chọn (`1`/`0` vs `'2'`) trong form nhập liệu [`ChildClinicalTab.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/mau1-child/tabs/ChildClinicalTab.tsx) sang biểu mẫu in, đảm bảo các kết quả Bất thường/Bình thường được đánh dấu `x` chính xác 100%.
  - Sửa lỗi map ngược màu sắc da (Vàng da / Tím tái).
  - Hiển thị nhận xét quan sát toàn trạng thực tế của bác sĩ (`extra.lam_sang_quan_sat`).

### 2.6. Khám Cận Lâm Sàng (Trang 3/3 - MỚI BỔ SUNG)
- Bổ sung bảng Xét nghiệm máu & Sinh hóa (9 chỉ số: Huyết sắc tố, Đường máu, Hồng cầu, Bạch cầu, Tiểu cầu, Ure, Creatinin, AST, ALT).
- Bổ sung Phân tích nước tiểu (Đường, Protein) và danh sách kết quả chỉ định CLS/CĐHA khác từ HIS (`paraclinical_items`).

### 2.7. Kết Luận & Tư Vấn (Trang 3/3)
- Bổ sung khối Phân loại sức khỏe (Loại I đến Loại V).
- Bổ sung Chẩn đoán bệnh tật / dị tật phát hiện theo mã ICD-10 (`conclusion.diagnosis`).
- Các vấn đề sức khỏe cần lưu ý và hướng dẫn chăm sóc (`conclusion.cac_van_de_luu_y`).
- Quản lý và tư vấn hẹn khám / chuyển tuyến chuyên khoa.
- Khối chữ ký Bác sĩ kết luận / Ký số điện tử (SIGNED DIGITALLY) và con dấu.

---

## 3. Các Tệp Mã Nguồn Đã Chỉnh Sửa
1. [`modules/health-check-sync/forms/PrintFormMau1.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintFormMau1.tsx): Toàn bộ biểu mẫu in 3 trang A4 chuẩn.
2. [`modules/health-check-sync/forms/PrintForm.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintForm.tsx): Truyền `doctors`, `icd10Names`, `COMMON_ICD10` vào `<PrintFormMau1 />`.
