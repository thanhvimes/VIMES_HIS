# HƯỚNG DẪN KỸ THUẬT: QUY TRÌNH XỬ LÝ CHỮ KÝ SỐ 2 CẤP ĐỘ (XML / JSON)
*Theo quy định của Bộ Y tế & Cổng liên thông VNeID (Quyết định 2062/QĐ-BYT & Thông tư 32/2023/TT-BYT)*

---

## 1. Cấu Trúc Khối Chữ Ký Trong File XML

Vị trí khối chữ ký đặt ở cuối tệp XML Envelope (`<KHAMSUCKHOE>`):
```xml
<CHUKYDONVI>
    <CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>
    <CKS_BENH_VIEN></CKS_BENH_VIEN>
</CHUKYDONVI>
```

---

## 2. Quy Trình Ký Số 2 Bước Chi Tiết

### Bước 1: Ký `CKS_NGUOI_KET_LUAN` (Bác sĩ kết luận)
1. **Chuẩn bị XML:** Để trống cả 2 thẻ `<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>` và `<CKS_BENH_VIEN></CKS_BENH_VIEN>`.
2. **Băm dữ liệu:** Băm toàn bộ nội dung file XML bằng thuật toán **SHA-256** chuẩn XML Signature.
3. **Ký số:** Bác sĩ sử dụng USB Token hoặc chứng thư số cá nhân ký lên chuỗi băm (RSA-SHA256).
4. **Mã hóa:** Mã hóa chữ ký thu được sang định dạng **Base64**.
5. **Chèn vào XML:** Dán nội dung Base64 vào thẻ `<CKS_NGUOI_KET_LUAN>`:
   ```xml
   <CKS_NGUOI_KET_LUAN>Base64_XML_signature_Doctor</CKS_NGUOI_KET_LUAN>
   ```

### Bước 2: Ký `CKS_BENH_VIEN` (Cơ sở khám chữa bệnh)
1. **Chuẩn bị XML:** Lấy file XML đã chèn `CKS_NGUOI_KET_LUAN` từ Bước 1, thẻ `<CKS_BENH_VIEN></CKS_BENH_VIEN>` vẫn để trống.
2. **Băm dữ liệu:** Băm toàn bộ nội dung file đã có CKS Bác sĩ bằng thuật toán **SHA-256**.
3. **Ký số:** Cơ sở y tế sử dụng chứng thư số tổ chức (USB Token máy trạm hoặc HSM Cloud CA) ký lên chuỗi băm.
4. **Mã hóa & Hoàn tất:** Mã hóa chữ ký thu được sang **Base64** và chèn vào thẻ `<CKS_BENH_VIEN>`:
   ```xml
   <CKS_BENH_VIEN>Base64_XML_signature_Hospital</CKS_BENH_VIEN>
   ```

> **Ghi chú:** Khi file XML đã chứa đủ cả 2 chữ ký số hợp lệ và không rỗng, quá trình ký số chính thức hoàn thành và tệp tin đủ điều kiện gửi lên Cổng Giám định / Tiếp nhận dữ liệu KSK.

---

## 3. Danh Sách API Endpoints Hỗ Trợ Ký Số 2 Bước

| Phương thức | Đường dẫn API | Mô tả |
| :--- | :--- | :--- |
| `GET` / `POST` | `/api/health-check-sync/documents/:id/two-tier-sign/step1-hash` | Lấy chuỗi băm SHA-256 (Hex & Base64) Bước 1 cho Bác sĩ ký |
| `POST` | `/api/health-check-sync/documents/:id/two-tier-sign/step1-apply` | Dán Base64 CKS Bác sĩ vào thẻ `<CKS_NGUOI_KET_LUAN>` |
| `GET` / `POST` | `/api/health-check-sync/documents/:id/two-tier-sign/step2-hash` | Lấy chuỗi băm SHA-256 (Hex & Base64) Bước 2 cho CSKCB ký |
| `POST` | `/api/health-check-sync/documents/:id/two-tier-sign/step2-apply` | Dán Base64 CKS CSKCB vào thẻ `<CKS_BENH_VIEN>` và chốt hồ sơ |
| `POST` | `/api/health-check-sync/documents/sign` | Ký số hàng loạt qua HSM Server tự động cho Bước 2 |

---

## 4. Tích Hợp Tự Động Ký HSM Trên Worker Đồng Bộ
Nếu hệ thống cấu hình tài khoản HSM cơ sở y tế (`settings.hsm_username` & `settings.hsm_password`):
1. Hồ sơ sau khi Bác sĩ hoàn thành kết luận & ký số Bước 1 (`CKS_NGUOI_KET_LUAN`).
2. Khi người dùng nhấn gửi cổng hoặc worker tự động chạy:
   - Hệ thống tự động kiểm tra `isFullySigned()`.
   - Nhận diện thẻ `<CKS_BENH_VIEN>` chưa có chữ ký $\rightarrow$ tự động trích xuất băm Bước 2 và ký HSM đơn vị.
   - Dán `<CKS_BENH_VIEN>` và đẩy trực tiếp lên Gateway tiếp nhận.
