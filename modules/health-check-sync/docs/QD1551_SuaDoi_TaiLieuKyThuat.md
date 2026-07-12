# TÀI LIỆU KỸ THUẬT: KẾT NỐI LIÊN THÔNG DỮ LIỆU KHÁM SỨC KHỎE THEO QUYẾT ĐỊNH SỬA ĐỔI QĐ 1551 (QUYẾT ĐỊNH 2062/QĐ-BYT NĂM 2026)

## 1. Giới thiệu
Tài liệu này đặc tả các yêu cầu kỹ thuật, cấu trúc dữ liệu, chuẩn giao tiếp API và định dạng XML/JSON phục vụ việc thu thập, cập nhật và liên thông dữ liệu khám sức khỏe định kỳ lên Cổng dữ liệu sức khỏe của Bộ Y tế, từ đó đồng bộ tạo lập Sổ sức khỏe điện tử trên ứng dụng định danh quốc gia VNeID. 

Tài liệu được xây dựng dựa trên **Quyết định số 2062/QĐ-BYT ngày 07/07/2026** của Bộ trưởng Bộ Y tế về việc Sửa đổi, bổ sung một số nội dung của Quyết định số 1551/QĐ-BYT.

---

## 2. Phạm vi áp dụng
Áp dụng đối với tất cả các cơ sở khám bệnh, chữa bệnh (CSKCB) có thực hiện khám sức khỏe định kỳ, khám sàng lọc cho người dân, học sinh, sinh viên, người lao động và các đơn vị tham gia kết nối, liên thông dữ liệu với Cổng dữ liệu sức khỏe của Bộ Y tế.

---

## 3. Đối tượng áp dụng
* Các cơ sở khám bệnh, chữa bệnh (công lập và ngoài công lập).
* Sở Y tế các tỉnh, thành phố trực thuộc Trung ương.
* Bảo hiểm xã hội Việt Nam (đơn vị phối hợp đồng bộ dữ liệu).
* Các doanh nghiệp phát triển phần mềm quản lý bệnh viện (HIS), bệnh án điện tử (EMR), quản lý xét nghiệm (LIS) và chẩn đoán hình ảnh (RIS/PACS).

---

## 4. Thuật ngữ và định nghĩa
* **HIS (Hospital Information System)**: Hệ thống thông tin quản lý bệnh viện.
* **EMR (Electronic Medical Record)**: Bệnh án điện tử.
* **LIS (Laboratory Information System)**: Hệ thống thông tin quản lý xét nghiệm.
* **VNeID**: Ứng dụng định danh điện tử quốc gia do Bộ Công an quản lý.
* **Cổng dữ liệu sức khỏe Bộ Y tế**: Hệ thống trung tâm tiếp nhận dữ liệu từ các CSKCB để cập nhật vào Cơ sở dữ liệu sức khỏe cá nhân.
* **GLN (Global Location Number)**: Mã toàn cầu phân định địa điểm cơ sở y tế (13 ký tự).

---

## 5. Các thay đổi của Quyết định sửa đổi (QĐ 2062/QĐ-BYT)
1. **Nội hàm Cổng dữ liệu sức khỏe**: Bổ sung chi tiết vai trò, kiến trúc của Cổng dữ liệu y tế trung tâm của Bộ Y tế.
2. **Chuẩn hóa dữ liệu "Đúng, Đủ, Sạch, Sống"**: Ràng buộc dữ liệu gửi đi phải được ký số tổ chức của CSKCB và tuân thủ quy trình kiểm tra chất lượng chặt chẽ (Phụ lục 5).
3. **Thu gọn mẫu biểu**: Thay vì duy trì 17 cấu trúc XML độc lập cực kỳ phức tạp cho từng mẫu biểu như QĐ 1551 cũ, QĐ 2062 chuẩn hóa thành mô hình **Master-Detail gồm 3 nhóm tuổi chính**:
   * Nhóm 1: Trẻ em dưới 06 tuổi.
   * Nhóm 2: Người từ đủ 06 tuổi đến dưới 18 tuổi.
   * Nhóm 3: Người từ đủ 18 tuổi trở lên.
4. **Tách cấu trúc XML thành các phân hệ nhỏ (XML1 đến XML15)** đóng gói chung trong một phong bì (Envelope) gửi qua API RESTful (JSON).

---

## 6. Yêu cầu nghiệp vụ
* **Xác thực CCCD**: Bắt buộc phải xác thực thông tin định danh người bệnh qua thẻ CCCD/chíp hoặc tài khoản VNeID mức độ 2 khi tiếp đón.
* **Chữ ký số**: Toàn bộ tệp XML dữ liệu gửi lên phải được ký số của bác sĩ kết luận và đóng dấu ký số tổ chức của Cơ sở khám bệnh, chữa bệnh.
* **Thời điểm gửi dữ liệu**: Dữ liệu phải được đẩy lên Cổng dữ liệu sức khỏe ngay sau khi hoàn thành đợt khám hoặc tối muộn vào cuối ngày làm việc.

---

## 7. Yêu cầu dữ liệu
Dữ liệu liên thông phải tuân thủ nghiêm ngặt định dạng XML, được mã hóa Base64 và đóng gói trong body JSON gửi qua giao thức HTTPS.

### Cấu trúc phong bì dữ liệu (XML Envelope)
Mỗi đợt gửi hồ sơ khám sức khỏe sẽ được bọc ngoài bởi thẻ `<KHAMSUCKHOE>` chứa thông tin đơn vị `<THONGTINDONVI>`, thông tin đợt gửi `<THONGTINHOSO>`, danh sách các hồ sơ chi tiết `<DANHSACHHOSO>` và vùng chữ ký số `<CHUKYDONVI>`.

---

## 8. Danh mục trường dữ liệu (Nhóm người từ đủ 18 tuổi trở lên)

Dưới đây là đặc tả các trường thông tin chính phục vụ việc lập trình CSDL và ánh xạ từ HIS sang tệp XML liên thông VNeID cho đối tượng người lớn:

| STT | Tên trường thông tin | Mã chỉ tiêu XML | Kiểu dữ liệu | Kích thước | Bắt buộc | Quy tắc kiểm tra / Giá trị hợp lệ | Mapping từ HIS |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | X | Chữ in hoa có dấu, khớp với CCCD | `hms_patient.hp_surname` + `hp_firstname` |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | X | 1: Nam, 2: Nữ | `hms_patient.hp_sex` |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | X | Định dạng: YYYY-MM-DD | `hms_patient.hp_birthdate` |
| 4 | Số CCCD/Định danh | `SO_CCCD` | Chuỗi | 12 | X | Đúng 12 số | `hms_patient.hp_patientid` / `hp_sin` |
| 5 | Ngày cấp CCCD | `NGAYCAP_CCCD` | Chuỗi | 8 | | Định dạng: YYYYMMDD | `hms_exm_employee.hee_cardid_date` |
| 6 | Nơi cấp CCCD | `NOICAP_CCCD` | Chuỗi | 1024 | | Chuỗi ký tự tự do | `hms_exm_employee.hee_cardid_place` |
| 7 | Nơi ở hiện tại | `DIA_CHI` | Chuỗi | 1024 | X | Ghi rõ số nhà, thôn xóm, xã, huyện, tỉnh | `hms_patient.hp_dtladdr` |
| 8 | Mã Tỉnh cư trú | `MATINH_CU_TRU` | Chuỗi | 3 | X | Theo danh mục Tỉnh của Bộ Xây dựng/BYT | `hms_patient.hp_provid` |
| 9 | Mã Xã cư trú | `MAXA_CU_TRU` | Chuỗi | 5 | X | Theo danh mục Xã của Bộ Xây dựng/BYT | `hms_patient.hp_villid` |
| 10 | Nghề nghiệp | `MA_NGHE_NGHIEP`| Chuỗi | 2 | X | Theo danh mục nghề nghiệp của Bộ Y tế | `hms_exm_employee.hee_jobcode` |
| 11 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | | Đúng định dạng số điện thoại Việt Nam | `hms_patient.hp_phone` |
| 12 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | | A, B, O, AB | `hms_clinical.blood_group` |
| 13 | Lượt khám | `MA_LK` | Chuỗi | 100 | X | Mã duy nhất của đợt khám sức khỏe | `hms_doc.hd_docno` |
| 14 | Mã cơ sở khám chữa bệnh| `MA_CSKCB` | Chuỗi | 5 | X | Mã 5 số do Bộ Y tế cấp | Cấu hình hệ thống |
| 15 | Mã GLN cơ sở | `MA_GTIN_CSKCB` | Chuỗi | 13 | X | Mã số 13 số theo chuẩn GLN toàn cầu | Cấu hình hệ thống |
| 16 | Ngày khám | `NGAY_VAO` | Chuỗi | 12 | X | Định dạng: YYYYMMDDHHMI | `hms_doc.hd_admitdate` |
| 17 | Chiều cao | `CHIEU_CAO` | Số | 10 | X | Đơn vị: cm (giá trị > 0) | `hms_exam.he_height` |
| 18 | Cân nặng | `CAN_NANG` | Chuỗi | 6 | X | Đơn vị: kg | `hms_exam.he_weight` |
| 19 | Chỉ số BMI | `CHI_SO_BMI` | Chuỗi | 10 | X | Tự động tính: Cân nặng / (Chiều cao/100)^2 | `hms_exam.he_bmi` |
| 20 | Mạch | `MACH` | Chuỗi | 100 | X | Đơn vị: lần/phút | `hms_exam.he_pulse` |
| 21 | Huyết áp | `HUYET_AP` | Chuỗi | 100 | X | Định dạng: Huyết áp tâm thu/Huyết áp tâm trương| `hms_exam.he_bloodpressure` |
| 22 | Khám Nội khoa | `NOI_KHOA_TUAN_HOAN`| Chuỗi | n | | Nhận xét chuyên khoa tuần hoàn | `hms_examview.he_tuanhoan` |
| 23 | Khám Mắt | `KHAM_MAT_PL` | Số | 1 | | Phân loại từ 1 đến 5 | `hms_examview.he_mat_pl` |
| 24 | Phân loại sức khỏe | `PHAN_LOAI_SK` | Số | 1 | X | Phân loại từ 1 đến 5 (1: Rất khỏe -> 5: Rất yếu) | `hms_clinical.fitness_class` |
| 25 | Kết luận bệnh chính | `KET_LUAN_BENH` | Chuỗi | 255 | X | Chẩn đoán dạng text kèm mã ICD-10 | `hms_doc.hd_diagnostic` |

---

## 9. Cấu trúc tệp tin liên thông XML (XML Schema)
Tệp tin XML chi tiết gửi đi phải tuân thủ phân lớp các thẻ con (`FILEHOSO`):
* `XML1`: Thông tin hành chính.
* `XML2`: Thông tin chung về lần khám.
* `XML3`: Đánh giá dấu hiệu sinh tồn.
* `XML4`: Đánh giá dinh dưỡng.
* `XML7`: Kết quả khám lâm sàng chuyên khoa.
* `XML8`: Kết luận và tư vấn.

### Ví dụ XML1 (Thông tin hành chính):
```xml
<THONG_TIN_HANH_CHINH>
    <HO_TEN>NGUYỄN VĂN A</HO_TEN>
    <GIOI_TINH>1</GIOI_TINH>
    <NGAY_SINH>1990-05-15</NGAY_SINH>
    <SO_CCCD>038090012345</SO_CCCD>
    <DIA_CHI>Số 12 Đường Trần Hưng Đạo, Quận Hoàn Kiếm, Hà Nội</DIA_CHI>
    <MATINH_CU_TRU>01</MATINH_CU_TRU>
    <MAXA_CU_TRU>00001</MAXA_CU_TRU>
    <DIEN_THOAI>0901234567</DIEN_THOAI>
</THONG_TIN_HANH_CHINH>
```

---

## 10. Quy định về API kết nối
Dữ liệu được đẩy lên cổng y tế thông qua giao thức API RESTful.

* **API Xác thực**:
  * **Endpoint**: `POST /api/auth/login`
  * **Payload**: `{ "username": "...", "password": "..." }`
  * **Response**: Trả về `token` (Bearer Token) và thời gian hết hạn.
* **API Đẩy dữ liệu**:
  * **Endpoint**: `POST /api/platform/data-sync/push`
  * **Headers**:
    * `Authorization`: `Bearer {token}`
    * `service-type`: `100` (Khám sức khỏe liên thông)
  * **Payload**:
    ```json
    {
      "header": {
        "version": "1.0.0",
        "sender_id": "MÃ_CSKCB_13_SỐ",
        "receiver_id": "TDLBYT",
        "txn_type": "sync_checkup",
        "msg_id": "MÃ_GIAO_DỊCH_DUY_NHẤT",
        "msg_type": "101",
        "data_type": "xml/base64",
        "send_datetime": 1718812673000
      },
      "data": {
        "file_content": "CHUỖI_XML_GỐC_ENCODE_BASE64"
      },
      "signature": "CHECKSUM_RSA_SHA256_BASE64"
    }
    ```

---

## 11. Quy trình ký số & Băm dữ liệu (Checksum Signature)
Để bảo đảm tính toàn vẹn, trước khi truyền tin, client phải tính toán chữ ký checksum:
1. `A` = `Uppercase(SHA256(header))` (Loại bỏ khoảng trắng, xuống dòng của JSON header trước khi hash).
2. `B` = `Uppercase(SHA256(data))` (Data là object chứa chuỗi XML Base64).
3. `C` = `A + "." + B`.
4. `CHECKSUM SIGNATURE` = `Uppercase(RSASHA256(C, Private_Key_CSKCB))`.

---

## 12. Điều kiện từ chối/Lỗi thường gặp
* **Mã lỗi `PS_DS_CA_SIGNATURE_INVALID`**: Chữ ký số tổ chức của CSKCB trên file XML không hợp lệ hoặc bị sửa đổi sau khi ký.
* **Mã lỗi `CM_INVALID_REQUEST`**: JSON Payload sai cấu trúc hoặc thiếu các thẻ bắt buộc trong header.
* **Lỗi định danh định cư**: Mã Tỉnh (`MATINH_CU_TRU`), Mã Xã (`MAXA_CU_TRU`) không khớp với danh mục quy chuẩn của Bộ Xây dựng hoặc không tồn tại.
* **CCCD không hợp lệ**: CCCD không đúng 12 số hoặc không qua được bước đối chiếu định danh quốc gia.
