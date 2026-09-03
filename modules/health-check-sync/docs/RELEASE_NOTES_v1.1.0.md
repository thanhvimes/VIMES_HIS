# VIMES HIS - PHÂN HỆ KHÁM SỨC KHỎE (KSK)
## TÀI LIỆU PHÁT HÀNH PHIÊN BẢN v1.1.0
*Ngày phát hành: 31/08/2026*

---

### 1. TỔNG QUAN PHIÊN BẢN v1.1.0
Phiên bản **v1.1.0** đánh dấu bước nâng cấp toàn diện cho Phân hệ Khám Sức Khỏe (KSK) và Tích hợp HIS Core, đảm bảo tuân thủ 100% quy chuẩn Bộ Y tế (**QĐ 1551/QĐ-BYT** & **QĐ 2062/QĐ-BYT**), nâng cấp giao diện đa bàn khám hiện đại, bảo vệ dữ liệu chống xung đột ghi đè, và tối ưu hóa quy trình tiếp đón - hủy tiếp nhận - nhập hồ sơ HIS.

---

### 2. CÁC TÍNH NĂNG & NÂNG CẤP NỔI BẬT

#### 2.1. Đồng bộ dữ liệu 2 chiều HIS Core <-> KSK VNeID/BHYT
- **Đồng bộ tự động:** Đồng bộ sinh hiệu (Mạch, Huyết áp, Chiều cao, Cân nặng, BMI), tiền sử bệnh, cận lâm sàng (Xét nghiệm & CĐHA) từ HIS Core sang KSK.
- **Đẩy ngược dữ liệu (Pushback):** Tự động đẩy kết quả khám chuyên khoa, phân loại thể lực và kết luận chẩn đoán về `hms_exam`, `hms_disease_hist`, `hms_exm_conclusion`, đóng đợt khám `he_status = 'T'`.
- **Chuẩn hóa XML Liên thông:** Chuẩn hóa cấu trúc Envelope XML (`<SOLUONGHOSO>`, `<DANH_SACH_HOSO>`, Base64 UTF-8) và ánh xạ mã chỉ số CLS chuẩn XML11 từ `hfl_ma_chi_so`.

#### 2.2. Nâng cấp Giao diện Điều hướng Khám Chuyên Khoa (UI/UX)
- **High-Contrast Cards & Sub-tabs:** Phân chia rõ ràng các chuyên khoa (Thể lực, Nội, Ngoại, Mắt, TMH, RHM, Da liễu, Phụ sản, Cận lâm sàng, Kết luận).
- **Trạng thái bàn khám trực quan:** Hiển thị huy hiệu (badge) sắc nét: *Chưa khám*, *Đang khám*, *Đã duyệt*.
- **Nút "Duyệt chuyên khoa" độc lập:** Cho phép từng bác sĩ chuyên khoa ký duyệt kết quả phần khám của mình mà không ảnh hưởng bàn khám khác.

#### 2.3. Cơ chế Deep-Merge & Khóa Bản Ghi Chống Xung Đột
- Áp dụng kỹ thuật `SELECT ... FOR UPDATE` và giải thuật Deep-Merge khi lưu/duyệt hồ sơ.
- Đảm bảo nhiều bác sĩ tại các phòng khám khác nhau (Nội, Mắt, TMH...) khi cùng mở một hồ sơ và lưu ở các thời điểm khác nhau sẽ không bị ghi đè hay mất dữ liệu của nhau.

#### 2.4. Quản lý Gói Khám & Tiếp Đón Nâng Cao
- **Tiếp đón toàn bộ (Bulk Reception):** Tiếp đón hàng loạt nhân viên trong gói khám chỉ với 1 click, tự động tạo hồ sơ HIS và nạp chỉ định `hms_fee`.
- **Nhập hồ sơ HIS vào gói khám (`importHisDocsToContract`):** Cho phép nạp các hồ sơ đã tiếp đón độc lập trên HIS vào hợp đồng KSK công ty và tự động đồng bộ sang KSK VNeID.
- **Hủy tiếp nhận an toàn (`cancelReception`):** Cho phép hủy tiếp đón, dọn sạch hồ sơ và các chỉ định CLS chưa thực hiện, khôi phục trạng thái chờ tiếp nhận.
- **Dọn dẹp hồ sơ rác/mồ côi:** Tự động phát hiện và xử lý các bản ghi nhân viên trỏ tới số hồ sơ không còn tồn tại trên HIS.

#### 2.5. Tự Động Chuẩn Hóa Danh Mục & Trường Dữ Liệu
- **Quốc tịch:** Chuẩn hóa mặc định mã `000` (Việt Nam) đứng đầu danh mục quốc tịch.
- **Đối tượng KSK:** Tự động xác định theo độ tuổi: $\ge 60$ tuổi là Mã 1 (Người cao tuổi), $< 60$ tuổi là Mã 3 (Hộ nghèo/cận nghèo/người lao động).
- **Phân loại thể lực:** Bệnh nhân $\ge 60$ tuổi mặc định xếp tối đa Loại III theo đúng quy chế hội đồng giám định y khoa.

#### 2.6. In Ấn & Mẫu Biểu
- **Phân trang động:** Tự động căn chỉnh và co giãn nội dung thông minh giữa Mẫu 1 (Trẻ em), Mẫu 2 (Học sinh), Mẫu 3 (Người lớn/Lái xe).
- **In Barcode Xét nghiệm:** Tích hợp trực tiếp modal in mã vạch ống nghiệm theo kích thước tiêu chuẩn tem nhiệt.

---

### 3. CẤU TRÚC PHIÊN BẢN & GÓI CẬP NHẬT
- **Phiên bản:** `1.1.0`
- **File nén phát hành:** `releases/vimes-his-v1.1.0.tar.gz`
- **Manifest:** `releases/version.json`
- **Cơ sở dữ liệu Migration:** `backend/migrations/076_fix_hms_exm_registration_exam_remove_hms_fee_insert.sql` (Tự động nâng cấp an toàn).
- **Kiểm thử hồi quy:** 20/20 Test cases PASS (100%), 0 TypeScript errors.
