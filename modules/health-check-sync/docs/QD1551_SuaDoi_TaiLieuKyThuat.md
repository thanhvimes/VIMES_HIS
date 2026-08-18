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

Mỗi hồ sơ khám sức khỏe được đóng gói trong phong bì `<KHAMSUCKHOE>` gồm nhiều phân hệ XML con:

| Mã File | Tên phân hệ | Bắt buộc |
|:---:|:---|:---:|
| `XML1` | Thông tin hành chính | ✅ |
| `XML2` | Thông tin chung về lần khám | ✅ |
| `XML3` | Đánh giá dấu hiệu sinh tồn | ✅ |
| `XML4` | Đánh giá dinh dưỡng | ✅ |
| `XML5` | Tiền sử bệnh | Tùy trường hợp |
| `XML6` | Khám lâm sàng nội khoa | Tùy trường hợp |
| `XML7` | Khám lâm sàng chuyên khoa (Mắt, TMH, RHM...) | Tùy trường hợp |
| `XML8` | Kết luận và tư vấn | ✅ |
| `XML9` | Kết quả xét nghiệm máu | Tùy trường hợp |
| `XML10` | Khám thể lực | Tùy trường hợp |
| `XML11` | Kết quả cận lâm sàng khác | Tùy trường hợp |

---

### Phong bì ngoài (KHAMSUCKHOE Envelope)

```xml
<?xml version="1.0" encoding="utf-8"?>
<KHAMSUCKHOE xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <THONGTINDONVI>
        <MACSKCB>89342</MACSKCB>   <!-- Mã 5 số do BYT cấp -->
    </THONGTINDONVI>
    <THONGTINHOSO>
        <NGAYLAP>20260721</NGAYLAP>
        <SOLUONGHOSO>1</SOLUONGHOSO>
        <DANHSACHHOSO>
            <HOSO>
                <FILEHOSO>
                    <LOAIHOSO>XML1</LOAIHOSO>
                    <NOIDUNGFILE>[Base64 của XML1]</NOIDUNGFILE>
                </FILEHOSO>
                <FILEHOSO>
                    <LOAIHOSO>XML2</LOAIHOSO>
                    <NOIDUNGFILE>[Base64 của XML2]</NOIDUNGFILE>
                </FILEHOSO>
                <FILEHOSO>
                    <LOAIHOSO>XML3</LOAIHOSO>
                    <NOIDUNGFILE>[Base64 của XML3]</NOIDUNGFILE>
                </FILEHOSO>
                <!-- ... tiếp tục XML4, XML8, ... -->
            </HOSO>
        </DANHSACHHOSO>
    </THONGTINHOSO>
    <CHUKYDONVI />
</KHAMSUCKHOE>
```

---

### XML1 - Thông tin hành chính (`THONG_TIN_HANH_CHINH`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<THONG_TIN_HANH_CHINH>
    <HO_TEN>NGUYỄN VĂN A</HO_TEN>
    <GIOI_TINH>1</GIOI_TINH>         <!-- 1: Nam, 2: Nữ -->
    <NGAY_SINH>1990-05-15</NGAY_SINH> <!-- YYYY-MM-DD -->
    <MA_DAN_TOC>01</MA_DAN_TOC>       <!-- 2 ký tự, padStart -->
    <SO_CCCD>038090012345</SO_CCCD>   <!-- Đúng 12 số -->
    <NGAYCAP_CCCD>20150601</NGAYCAP_CCCD>  <!-- YYYYMMDD -->
    <NOICAP_CCCD>Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư</NOICAP_CCCD>
    <DIA_CHI>Số 12 Đường Trần Hưng Đạo, Quận Hoàn Kiếm, Hà Nội</DIA_CHI>
    <MATINH_CU_TRU>01</MATINH_CU_TRU>  <!-- 2-3 ký tự theo danh mục BYT -->
    <MAXA_CU_TRU>00001</MAXA_CU_TRU>   <!-- 5 ký tự theo danh mục BYT -->
    <MA_NGHE_NGHIEP>13</MA_NGHE_NGHIEP> <!-- BẮT BUỘC: 2 ký tự danh mục nghề nghiệp -->
    <DIEN_THOAI>0901234567</DIEN_THOAI>
    <NHOM_MAU>A</NHOM_MAU>
    <!-- Riêng cho Mẫu 1 & 2 (người dưới 18 tuổi): thêm NGUOI_GIAM_HO, SO_CCCD_NGH -->
</THONG_TIN_HANH_CHINH>
```

> [!IMPORTANT]
> Trường `MA_NGHE_NGHIEP` (2 ký tự) là **BẮT BUỘC** cho người từ đủ 18 tuổi. Dùng mã `99` nếu không xác định được nghề nghiệp.

---

### XML2 - Thông tin chung về lần khám (`THONG_TIN_CHUNG_VE_LAN_KHAM`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<THONG_TIN_CHUNG_VE_LAN_KHAM>
    <MA_LK>202506180001</MA_LK>              <!-- Mã lượt khám duy nhất -->
    <MA_CSKCB>00001</MA_CSKCB>              <!-- Mã 5 số do BYT cấp (KHÔNG phải GLN 13 số) -->
    <MA_GTIN_CSKCB>8934286056913</MA_GTIN_CSKCB>  <!-- GLN 13 số toàn cầu -->
    <DOI_TUONG>13</DOI_TUONG>               <!-- 13: Người lao động, 14: Khác -->
    <NGUON_CHI_TRA>4</NGUON_CHI_TRA>        <!-- 4: Người sử dụng lao động, 9: Khác -->
    <MA_LOAI_KCB>Bình thường</MA_LOAI_KCB>  <!-- hoặc mã số theo danh mục -->
    <NGAY_VAO>18062026</NGAY_VAO>           <!-- YYYYMMDD[HHMI] - Định dạng YYYYMMDDHHMI -->
    <NGAY_RA>18062026</NGAY_RA>             <!-- BẮT BUỘC: ngày kết thúc đợt khám -->
</THONG_TIN_CHUNG_VE_LAN_KHAM>
```

> [!CAUTION]
> - `MA_CSKCB`: **Phải là mã 5 ký tự** do Bộ Y tế cấp (ví dụ `89342` hoặc `00001`). **Tuyệt đối không** dùng mã GLN 13 số ở đây.
> - `MA_GTIN_CSKCB`: Đây mới là mã GLN 13 số (ví dụ `8934286056913`).
> - `NGAY_RA`: Trường bắt buộc, nếu khám và ra trong ngày thì bằng `NGAY_VAO`.

---

### XML3 - Đánh giá dấu hiệu sinh tồn (`DANH_GIA_DAU_HIEU_SINH_TON`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<DANH_GIA_DAU_HIEU_SINH_TON>
    <NHIET_DO>36.8</NHIET_DO>
    <DGDHST_NHIET_DO>1</DGDHST_NHIET_DO>    <!-- Đánh giá: 1=Bình thường, 2=Bất thường -->
    <MACH>80</MACH>
    <DGDHST_MACH>0</DGDHST_MACH>            <!-- Đánh giá: 0=Bình thường -->
    <NHIP_THO>30</NHIP_THO>
    <DGDHST_NHIP_THO>30</DGDHST_NHIP_THO>  <!-- Đánh giá nhịp thở -->
    <HUYET_AP>120/80</HUYET_AP>             <!-- Tâm thu/Tâm trương -->
</DANH_GIA_DAU_HIEU_SINH_TON>
```

> [!NOTE]
> Các thẻ `DGDHST_*` (Đánh giá dấu hiệu sinh tồn) là thẻ **đánh giá phân loại** đi kèm mỗi chỉ số. Đây là điểm khác biệt so với cấu trúc cũ QĐ 1551.

---

### XML4 - Đánh giá dinh dưỡng (`DANH_GIA_DINH_DUONG`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<DANH_GIA_DINH_DUONG>
    <CHIEU_DAI>0</CHIEU_DAI>                   <!-- Chiều dài nằm (trẻ <2 tuổi) -->
    <CHIEU_DAI_TUOI_SD>1234567890</CHIEU_DAI_TUOI_SD>
    <CHIEU_CAO>165</CHIEU_CAO>                 <!-- Chiều cao đứng (cm) -->
    <CHIEU_CAO_TUOI_SD>...</CHIEU_CAO_TUOI_SD>
    <CAN_NANG>60</CAN_NANG>                    <!-- Cân nặng (kg) -->
    <CAN_NANG_TUOI_SD>...</CAN_NANG_TUOI_SD>
    <BMI>22.0</BMI>
    <BMI_TUOI_SD>...</BMI_TUOI_SD>
    <VONG_DAU>...</VONG_DAU>                   <!-- Vòng đầu (cm) - cho trẻ nhỏ -->
    <VONG_DAU_TUOI_SD>...</VONG_DAU_TUOI_SD>
    <PHAN_LOAI_DD>1</PHAN_LOAI_DD>             <!-- Phân loại dinh dưỡng 1-5 -->
</DANH_GIA_DINH_DUONG>
```

---

### XML8 - Kết luận và tư vấn (`KET_LUAN`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<KET_LUAN>
    <PHAN_LOAI_SK>1</PHAN_LOAI_SK>    <!-- 1: Rất khỏe → 5: Rất yếu -->
    <KET_LUAN_BENH>Đủ sức khỏe làm việc</KET_LUAN_BENH>
    <CAC_VAN_DE_SUC_KHOE>Không</CAC_VAN_DE_SUC_KHOE>
</KET_LUAN>
```

---

### XML10 - Khám thể lực (`KHAM_THE_LUC`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<KHAM_THE_LUC>
    <CHIEU_CAO>165</CHIEU_CAO>
    <CAN_NANG>60</CAN_NANG>
    <CHI_SO_BMI>22.0</CHI_SO_BMI>
    <MACH>80</MACH>
    <HUYET_AP>120/80</HUYET_AP>
</KHAM_THE_LUC>
```

---

### XML11 - Kết quả cận lâm sàng (`KHAM_CAN_LAM_SANG`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<KHAM_CAN_LAM_SANG>
    <CHI_TIET_CLS>
        <MA_DICH_VU>XN01</MA_DICH_VU>
        <MA_CHI_SO>GLUCOSE</MA_CHI_SO>
        <GIA_TRI>5.4</GIA_TRI>
        <DON_VI_DO>mmol/L</DON_VI_DO>
        <MO_TA>Đường huyết lúc đói</MO_TA>
        <KET_LUAN>Bình thường</KET_LUAN>
    </CHI_TIET_CLS>
</KHAM_CAN_LAM_SANG>
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
        "version": "1.0.6",
        "sender_id": "8934286056913",
        "receiver_id": "emrhub",
        "txn_type": "sync_checkup",
        "msg_id": "emrhub20260721<uuid>",
        "msg_type": "101",
        "ref_msg_id": "<ref_id>",
        "send_datetime": 1718812673000
      },
      "data": {
        "file_content": "CHUỖI_XML_ENVELOPE_ENCODE_BASE64"
      },
      "signature": "CHECKSUM_RSA_SHA256_BASE64"
    }
    ```

> [!NOTE]
> `sender_id` trong `header` dùng **mã GLN 13 số** (`MA_GTIN_CSKCB`), khác với `MA_CSKCB` 5 số trong XML2.

---

## 11. Quy trình ký số & Băm dữ liệu (Checksum Signature)
Để bảo đảm tính toàn vẹn, trước khi truyền tin, client phải tính toán chữ ký checksum:
1. `hashA` = `SHA256(JSON.stringify(header))` (JSON header không có khoảng trắng/xuống dòng).
2. `hashB` = `SHA256(data)` (data là object chứa `file_content` XML Base64 của toàn bộ Envelope; canonicalize object trước khi băm).
3. `message` = `hashA + "." + hashB`.
4. `SIGNATURE` = `RSA-PKCS1-SHA256_Sign(message, PrivateKey)` → mã hóa Base64.

---

## 12. Điều kiện từ chối / Lỗi thường gặp
* **Mã lỗi `CM_SYSTEM_ERROR`**: Lỗi hệ thống cổng (thường do key/auth sai trước khi vào hàng đợi xử lý).
* **Mã lỗi `CM_INVALID_REQUEST`**: JSON Payload sai cấu trúc, thiếu thẻ bắt buộc, hoặc dữ liệu trong XML không hợp lệ theo danh mục (mã tỉnh, xã, nghề nghiệp, v.v.).
* **Mã lỗi `PS_DS_CA_SIGNATURE_INVALID`**: Chữ ký RSA không hợp lệ.
* **Lỗi định danh cư trú**: `MATINH_CU_TRU`, `MAXA_CU_TRU` không khớp với danh mục chuẩn.
* **CCCD không hợp lệ**: CCCD không đúng 12 số hoặc không qua đối chiếu định danh quốc gia.
* **`MA_CSKCB` sai**: Dùng mã 13 số GLN thay vì mã 5 số BYT — Cổng sẽ báo lỗi không tìm thấy cơ sở y tế.
