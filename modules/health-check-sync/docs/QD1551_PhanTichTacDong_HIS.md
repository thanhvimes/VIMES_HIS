# PHÂN TÍCH TÁC ĐỘNG CỦA QUYẾT ĐỊNH SỬA ĐỔI QĐ 1551 ĐỐI VỚI PHẦN MỀM HIS/EMR

Báo cáo phân tích dưới góc nhìn của đội phát triển phần mềm vClinic về những thay đổi cần thực hiện trên toàn hệ thống HIS, EMR, LIS, RIS/PACS để đáp ứng Quyết định sửa đổi **2062/QĐ-BYT**.

---

## 1. Phân tích tác động theo từng Module hệ thống

### Module Tiếp đón (Reception)
* **Chức năng cần sửa**: 
  * Tiếp nhận đoàn khám sức khỏe theo hợp đồng phải hỗ trợ cấu hình phân nhóm đối tượng theo 3 nhóm tuổi mới (Dưới 6 tuổi, 6 - 18 tuổi, Trên 18 tuổi).
* **Chức năng cần bổ sung**:
  * Tích hợp máy quét CCCD chíp gắn đầu đọc hoặc gọi API định danh quốc gia VNeID trực tiếp tại quầy tiếp đón để tự động điền và xác thực các trường: `HO_TEN`, `SO_CCCD`, `NGAY_SINH`, `GIOI_TINH`, `MA_DAN_TOC`, `DIA_CHI` (đảm bảo chuẩn dữ liệu "Sạch").
* **CSDL cần thay đổi**:
  * Bổ sung các cột lưu thông tin người đi cùng trẻ em (`HO_TEN_NGUOI_DI_CUNG`, `SO_CCCD_NGUOI_DI_CUNG`, `MOI_QUAN_HE_VOI_TRE`) vào bảng tiếp đón bệnh nhân nhi.
* **Giao diện cần thay đổi**:
  * Thêm phân vùng nhập liệu thông tin người đi cùng/giám hộ trên màn hình Tiếp đón đoàn KSK.
* **Quy trình cần thay đổi**:
  * Bắt buộc quét CCCD xác thực thông tin đối với tất cả các đối tượng đến khám sức khỏe định kỳ trước khi sinh số hồ sơ (`MA_LK`).

---

### Module Khám bệnh & Khám sức khỏe (Clinical Examination)
* **Chức năng cần sửa**:
  * Chuyển đổi toàn bộ form nhập liệu lâm sàng động (Dynamic Form) từ 17 mẫu biểu cũ sang **3 mẫu biểu chuẩn mới**.
  * Gom các tab khám lâm sàng chuyên khoa thành 1 cấu trúc thống nhất nhưng ẩn hiện thông tin linh hoạt dựa trên giới tính và độ tuổi của đối tượng.
* **Chức năng cần bổ sung**:
  * Bổ sung vùng nhập liệu cho bác sỹ chuyên khoa thực hiện ký số điện tử của riêng mình trên từng phân hệ khám lâm sàng tương ứng (ví dụ: Bác sỹ Tai-Mũi-Họng ký số phần tai-mũi-họng, Bác sỹ Mắt ký số phần mắt).
* **CSDL cần thay đổi**:
  * Cấu trúc JSONB trong bảng `health_check_details` cần được thiết kế lại để lưu trữ kết quả phân loại từ 1 đến 5 (`KHAM_MAT_PL`, `NOI_KHOA_TUAN_HOAN_PL`...) và lưu chuỗi chữ ký số của từng bác sỹ chuyên khoa.
* **Giao diện cần thay đổi**:
  * Thiết kế lại giao diện Form khám sức khỏe 3 nhóm tuổi. Form người lớn hiển thị đầy đủ 9 chuyên khoa lâm sàng kèm ô nhập Phân loại và Nút ký số chuyên khoa của bác sỹ khám.

---

### Module Cận lâm sàng & Quản lý Xét nghiệm (LIS) / PACS
* **Chức năng cần sửa**:
  * Logic ánh xạ chỉ số cận lâm sàng (như Glucose, Ure, Creatinin, Điện tim...) từ bảng kết quả HIS sang tệp XML11.
* **Chức năng cần bổ sung**:
  * Tự động đồng bộ kết quả siêu âm, X-Quang phổi thẳng dạng mô tả kết quả (`MO_TA`) và kết luận (`KET_LUAN`) sang cấu trúc XML4/XML11 tương ứng của hồ sơ sức khỏe.
* **Quy trình cần thay đổi**:
  * Kết quả xét nghiệm, chẩn đoán hình ảnh sau khi được duyệt hoàn thành trên LIS/PACS phải tự động đồng bộ sang bảng trung gian KSK ngay lập tức để ghép vào hồ sơ liên thông mà không cần chờ thao tác thủ công.

---

### Module Chữ ký số & Liên thông cổng (Digital Signature & Portal Sync)
* **Chức năng cần sửa**:
  * Sửa đổi logic ký số trong file `documents.ts`. Hệ thống không chỉ ký số một tệp XML đơn phẳng mà phải thực hiện:
    1. Tạo tệp XML chứa Envelope lớn.
    2. Tạo các tệp XML1 đến XML12 nhỏ bên trong.
    3. Đóng dấu chữ ký số tổ chức của bệnh viện trên Envelope và ký số bác sỹ kết luận trên XML8/XML12.
* **Chức năng cần bổ sung**:
  * Lập trình thuật toán băm Checksum Signature chuẩn mới: `A = SHA256(header)`, `B = SHA256(data)`, `C = A + "." + B`, ký `C` bằng khóa bảo mật RSA-SHA256 của đơn vị.
* **API cần thay đổi**:
  * Thay đổi Endpoint đẩy dữ liệu sang cổng mới: `POST /api/platform/data-sync/push` (Trục dữ liệu Bộ Y tế).
  * Hỗ trợ Header `service-type: 100`.

---

## 2. Kế hoạch thay đổi Cơ sở dữ liệu (Database Schema Changes)

Để đáp ứng cấu trúc mới, hệ thống vClinic cần thực hiện thay đổi schema database trên PostgreSQL:

```sql
-- 1. Bổ sung các cột hành chính và người giám hộ phục vụ trẻ em dưới 6 tuổi
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS guardian_cccd VARCHAR(12);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS guardian_relation VARCHAR(50);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(15);

-- 2. Thêm cột mã GLN cơ sở y tế vào bảng cấu hình settings
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS ma_gtin_cskcb VARCHAR(13);

-- 3. Tạo bảng lưu trữ audit log chữ ký số chuyên khoa của bác sỹ
CREATE TABLE IF NOT EXISTS health_check_specialist_signatures (
    id SERIAL PRIMARY KEY,
    master_id INTEGER REFERENCES health_check_masters(id),
    specialty_code VARCHAR(50) NOT NULL, -- e.g., 'internal', 'eye', 'ent'
    doctor_id VARCHAR(50) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    signature_data TEXT NOT NULL,
    signed_at TIMESTAMP DEFAULT NOW()
);
```
