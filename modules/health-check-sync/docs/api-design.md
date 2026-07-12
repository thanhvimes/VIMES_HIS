# THIẾT KẾ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API DESIGN)

Tài liệu này đặc tả chi tiết giao diện lập trình ứng dụng (API) để kết nối, liên thông dữ liệu khám sức khỏe từ hệ thống vClinic HIS lên Cổng dữ liệu sức khỏe của Bộ Y tế theo quy định tại Quyết định 2062/QĐ-BYT.

---

## 1. Danh sách API Liên thông

### 1.1. Xác thực tài khoản (Authentication)
Dùng để xác thực cơ sở khám bệnh, chữa bệnh và cấp token giao dịch.

* **URL**: `POST /api/auth/login`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "username": "tên_đăng_nhập_liên_thông",
    "password": "mật_khẩu_liên_thông"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "header": {
      "version": "1.0.0",
      "success": true,
      "send_datetime": 1718812673000,
      "res_datetime": 1718812674000,
      "res_code": "CM_SUCCESS",
      "res_msg": "Đăng nhập thành công"
    },
    "data": {
      "token": "bearer_jwt_token_string",
      "refresh_token": "refresh_token_string",
      "duration": 86400,
      "role": "facility"
    }
  }
  ```

---

### 1.2. Đẩy hồ sơ liên thông (Data Sync Push)
Dùng để đẩy tệp dữ liệu XML khám sức khỏe đã đóng gói Envelope lên cổng.

* **URL**: `POST /api/platform/data-sync/push`
* **Headers**:
  * `Authorization`: `Bearer {token}`
  * `service-type`: `100` (Khám sức khỏe liên thông)
  * `Content-Type`: `application/json`
* **Request Body**:
  ```json
  {
    "header": {
      "version": "1.0.0",
      "sender_id": "MÃ_CSKCB_13_SỐ_GLN",
      "receiver_id": "TDLBYT",
      "txn_type": "sync_checkup",
      "msg_id": "SENDERID_YYMMDD_UUIDV4",
      "msg_type": "101",
      "data_type": "xml/base64",
      "send_datetime": 1718812673000
    },
    "data": {
      "file_content": "CHUỖI_XML_BASE64_MÃ_HÓA"
    },
    "signature": "CHUỖI_CHECKSUM_RSA_SHA256_BASE64"
  }
  ```
* **Response (200 OK - Thành công)**:
  ```json
  {
    "header": {
      "version": "1.0.0",
      "sender_id": "TDLBYT",
      "receiver_id": "MÃ_CSKCB_13_SỐ_GLN",
      "txn_id": "MÃ_GIAO_DỊCH_CỔNG",
      "txn_type": "sync_checkup",
      "res_code": "CM_SUCCESS",
      "res_msg": "Đồng bộ thành công và lưu trữ file hoàn tất"
    }
  }
  ```

---

## 2. Giải thuật băm Checksum Signature RSA-SHA256 kép

Để bảo đảm tính toàn vẹn thông điệp truyền tin qua API, client phải tính toán chữ ký `signature` gửi kèm theo quy chế sau:

1. **Chuẩn bị bản tin Header**: Lấy JSON object `header`, loại bỏ tất cả khoảng trắng ngoài, ký tự xuống dòng (`\n`, `\r`) và tab.
2. **Tính toán giá trị A**:
   $$\text{A} = \text{Uppercase}(\text{SHA256}(\text{header\_json\_string}))$$
3. **Tính toán giá trị B**: Lấy JSON object `data` (chứa `file_content`), loại bỏ khoảng trắng/xuống dòng và tính hash:
   $$\text{B} = \text{Uppercase}(\text{SHA256}(\text{data\_json\_string}))$$
4. **Tạo chuỗi liên kết C**:
   $$\text{C} = \text{A} + "." + \text{B}$$
5. **Ký số tạo Checksum Signature**: Ký chuỗi `C` bằng cặp khóa RSA-SHA256 (Private Key được cấp cho CSKCB):
   $$\text{CHECKSUM SIGNATURE} = \text{Uppercase}(\text{RSASHA256}(\text{C, Private\_Key\_CSKCB}))$$

---

## 3. Bản tin XML nội dung (Base64 file_content)

Nội dung XML gửi đi được mã hóa Base64 lồng trong trường `data.file_content`. Cấu trúc XML chuẩn hóa theo nhóm tuổi được mô tả tại tài liệu [mapping.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/mapping.md).
