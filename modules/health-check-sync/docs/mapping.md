# ĐẶC TẢ MAPPING TRƯỜNG DỮ LIỆU 3 NHÓM TUỔI (QĐ 2062/QĐ-BYT)

Tài liệu này đặc tả chi tiết danh mục trường dữ liệu và quy tắc kiểm tra (validation), mapping từ hệ thống HIS sang tệp tin liên thông XML cho 3 nhóm tuổi chính theo Quyết định 2062/QĐ-BYT.

---

## 1. Bảng Mapping chung Phụ lục 04 (VNeID)

Bảng dưới đây so sánh các trường thông tin hiển thị trên VNeID đối với 3 nhóm đối tượng:
1. **Trẻ dưới 6 tuổi** (Nhóm 1)
2. **Người từ 6 - dưới 18 tuổi** (Nhóm 2)
3. **Người từ đủ 18 tuổi trở lên** (Nhóm 3)

| TT | Tên trường thông tin | Mã trường XML | Kiểu | Trẻ < 6T | 6T - 18T | Trên 18T | Quy tắc kiểm tra / Giá trị hợp lệ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | X | X | X | Chữ hoa có dấu. |
| 2 | Giới tính | `GIOI_TINH` | Số | X | X | X | 1: Nam, 2: Nữ. |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | X | X | X | Định dạng: YYYY-MM-DD |
| 4 | Mã định danh (CCCD) | `SO_CCCD` | Chuỗi | X | X | X | Đúng 12 số định danh công dân. |
| 5 | Dân tộc | `MA_DAN_TOC` | Chuỗi | X | X | X | Danh mục Dân tộc Bộ Y tế (2 số). |
| 6 | Địa chỉ nơi ở | `DIA_CHI` | Chuỗi | X | X | X | Ghi chi tiết nơi cư trú. |
| 7 | Mã Tỉnh cư trú | `MATINH_CU_TRU` | Chuỗi | X | X | X | Danh mục tỉnh Bộ Xây dựng (3 số). |
| 8 | Mã Xã cư trú | `MAXA_CU_TRU` | Chuỗi | X | X | X | Danh mục xã Bộ Xây dựng (5 số). |
| 9 | Điện thoại liên hệ | `DIEN_THOAI` | Chuỗi | | X | X | Số điện thoại hợp lệ. |
| 10 | Họ tên người giám hộ | `NGUOI_GIAM_HO` | Chuỗi | X | X | | Bắt buộc đối với trẻ em. |
| 11 | CCCD người giám hộ | `SO_CCCD_NGH` | Chuỗi | X | X | | Bắt buộc đối với trẻ em. |
| 12 | Nhóm máu | `NHOM_MAU` | Chuỗi | X | X | X | A, B, O, AB, Rh+, Rh- |
| 13 | Đối tượng | `DOI_TUONG` | Chuỗi | X | X | X | Danh mục đối tượng từ 1 đến 16. |
| 14 | Nguồn chi trả | `NGUON_CHI_TRA` | Số | X | X | X | 1: NS Trung ương -> 9: Khác |
| 15 | Lượt khám | `MA_LK` | Chuỗi | X | X | X | Mã duy nhất của đợt khám. |
| 16 | Mã cơ sở KCB | `MA_CSKCB` | Chuỗi | X | X | X | Mã 5 số đăng ký của CSKCB. |
| 17 | Mã GLN cơ sở | `MA_GTIN_CSKCB` | Chuỗi | X | X | X | Mã GLN 13 số toàn cầu của CSKCB. |
| 18 | Ngày khám | `NGAY_VAO` | Chuỗi | X | X | X | Định dạng: YYYYMMDDHHMI |

---

## 2. Đặc tả dữ liệu chuyên sâu từng thẻ XML

### XML1: Thông tin hành chính
* **Thành phần**: Họ tên, Ngày sinh, Giới tính, Dân tộc, Số định danh CCCD, Địa chỉ, Mã tỉnh/xã, Người giám hộ (nếu có).
* **Quy tắc kiểm tra**:
  * Trẻ em dưới 6 tuổi bắt buộc phải có `NGUOI_GIAM_HO` và `SO_CCCD_NGH`.
  * Số định danh `SO_CCCD` của người giám hộ phải đúng định dạng 12 số.

### XML3: Đánh giá dấu hiệu sinh tồn
* **Thành phần**: Nhiệt độ (`NHIET_DO`), Mạch (`MACH`), Nhịp thở (`NHIP_THO`), Huyết áp (`HUYET_AP`).
* **Quy tắc kiểm tra**:
  * `HUYET_AP` phải có định dạng dạng chuỗi chứa dấu gạch chéo `/` ngăn cách huyết áp tâm thu và tâm trương (ví dụ: `120/80`).

### XML10: Khám thể lực
* **Thành phần**: Chiều cao (`CHIEU_CAO`), Cân nặng (`CAN_NANG`), BMI (`CHI_SO_BMI`), Phân loại thể lực (`KHAM_THE_LUC_PL`).
* **Quy tắc kiểm tra**:
  * `CHI_SO_BMI` phải khớp với công thức tính: $\text{BMI} = \text{Cân nặng (kg)} / (\text{Chiều cao (m)})^2$ làm tròn 1 chữ số thập phân.

### XML11: Khám cận lâm sàng (LIS/PACS)
* **Thành phần**: Mảng dịch vụ y tế, bao gồm: Mã dịch vụ (`MA_DICH_VU`), Mã chỉ số xét nghiệm (`MA_CHI_SO`), Giá trị đo (`GIA_TRI`), Đơn vị đo (`DON_VI_DO`), Mô tả kết quả X-quang/Siêu âm (`MO_TA`), Kết luận chuyên khoa (`KET_LUAN`).
* **Quy tắc kiểm tra**:
  * `MA_DICH_VU` phải thuộc danh mục dịch vụ kỹ thuật được Bộ Y tế phê duyệt.
