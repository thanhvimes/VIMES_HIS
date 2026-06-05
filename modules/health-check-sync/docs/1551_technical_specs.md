# Đặc tả Kỹ thuật Chi tiết 17 Mẫu Biểu Khám Sức Khỏe Liên Thông VNeID (QĐ 1551/QĐ-BYT)

*Tài liệu này ghi nhận đặc tả cấu trúc bảng dữ liệu, thiết kế biểu mẫu nhập liệu (Form), định dạng JSON và XML tương ứng cho tất cả 17 mẫu biểu khám sức khỏe định kỳ và chuyên khoa phục vụ liên thông với cổng Sức khỏe điện tử VNeID.*

---

## 1. Thiết Kế Hệ Thống & Cơ Sở Dữ Liệu
Hệ thống sử dụng cơ sở dữ liệu PostgreSQL với mô hình quan hệ Master-Detail kết hợp JSONB lưu trữ lâm sàng động để đáp ứng sự linh hoạt giữa 17 mẫu biểu khác nhau mà không cần tạo 17 bảng vật lý.

### Bảng Master: `health_check_masters`
Lưu trữ thông tin hành chính cốt lõi và trạng thái đồng bộ, ký số của hồ sơ.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Ràng Buộc | Diễn Giải |
| :--- | :--- | :--- | :--- | :--- |
| `id` | SERIAL | PK | Unique | Khóa chính tự tăng |
| `patient_id` | VARCHAR(50) | | Not Null | Mã bệnh nhân nội bộ |
| `patient_name` | VARCHAR(255) | | Not Null | Họ và tên bệnh nhân (in hoa có dấu) |
| `cccd` | VARCHAR(12) | | Not Null | Số CCCD/Định danh công dân |
| `dob` | DATE | | Not Null | Ngày sinh |
| `gender` | VARCHAR(10) | | Not Null | Giới tính (Nam/Nữ) |
| `doc_no` | VARCHAR(100) | | Unique, Not Null | Số hồ sơ liên thông (`MA_LK`) |
| `form_type` | VARCHAR(10) | | Not Null | Mã loại mẫu biểu (`1` đến `17`) |
| `send_status` | VARCHAR(20) | | Default 'unsent' | Trạng thái: `unsent`, `pending`, `success`, `error` |
| `signature_status`| VARCHAR(20) | | Default 'unsigned' | Trạng thái ký: `unsigned`, `signed` |
| `xml_data` | TEXT | | | Dữ liệu XML gốc trước khi ký và gửi |
| `transaction_id` | VARCHAR(100) | | | Mã giao dịch cổng VNeID trả về |
| `error_message` | TEXT | | | Nhật ký lỗi cổng nếu đồng bộ thất bại |
| `created_at` | TIMESTAMP | | Default NOW() | Thời điểm tạo hồ sơ |
| `updated_at` | TIMESTAMP | | Default NOW() | Thời điểm cập nhật cuối |


### Bảng Detail: `health_check_details`
Lưu trữ dữ liệu khám lâm sàng, cận lâm sàng chi tiết dưới dạng JSONB phân loại theo cấu trúc nghiệp vụ.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Ràng Buộc | Diễn Giải |
| :--- | :--- | :--- | :--- | :--- |
| `id` | SERIAL | PK | Unique | Khóa chính detail |
| `master_id` | INTEGER | FK | References masters(id) | Liên kết 1-1 với bảng Master |
| `clinical_data` | JSONB | | Not Null | Kết quả khám thể lực, nội khoa, ngoại khoa, chuyên khoa |
| `lab_data` | JSONB | | | Kết quả xét nghiệm máu, nước tiểu, chẩn đoán hình ảnh |
| `conclusion_data`| JSONB | | Not Null | Phân loại sức khỏe, chẩn đoán ICD-10 và kết luận chung |


---

## MẪU 1: 1. Mẫu giấy khám sức khỏe định kỳ dùng cho người từ đủ 6 tuổi đến dưới 18 tuổi
**Đối tượng áp dụng:** Học sinh từ đủ 6 tuổi đến dưới 18 tuổi (Tiểu học đến THPT)

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 4 | Tuổi | `TUOI` | Số | 3 |  |
| 5 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | CMND / CCCD / HC / Định danh công dân | `SO_CCCD` | Chuỗi | n | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Ngày cấp | `NGAYCAP_CCCD` | Chuỗi | 8 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 8 | Nơi cấp | `NOICAP_CCCD` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 9 | Họ và tên bố, mẹ hoặc người giám hộ | `NGUOI_GIAM_HO` | Chuỗi | 255 | 10 CMND / CCCD / HC / Định danh công dân của bố,mẹ hoặc người giám hộ SO_CCCD_NGH Chuỗi n Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Nơi ở hiện tại | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 12 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 13 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 14 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 15 | Lý do khám sức khỏe | `LY_DO_VV` | Chuỗi | n | Ghi lý do đối tượng đến khám sức khỏe 8 |
| 16 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 17 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân tộc thiểu số và<br>7: Người sống tại vùng có điều kiện kinh tế - xã hội khó<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm non<br>11: Học sinh trong các cơ sở giáo dục phổ thông<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 18 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác II Thông tin chung về lần khám<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 19 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất. |
| 20 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 21 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 22 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Tiền sử bệnh/tật III.1 Tiền sử gia đình 9 23 Có ai trong gia đình mắc các bệnh bẩm sinh hoặc bệnh truyền nhiễm không TSGD_MAC_BENH Số 1 Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 24 | Tên bệnh cụ thể khi trong gia đình có người mắc | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". III.2 Tiền sử bản thân A Sản khoa |
| 25 | Sản khoa | `SAN_KHOA` | Số | 1 | Sản khoa bình thường hay không? Mã “0”: Không Mã “1”: Bình thường<br>0: Không<br>1: Bình thường |
| 26 | Sản khoa không bình thường | `SAN_KHOA_KHONG_BT` | Số | 1 | Mã 1: Đẻ thiếu tháng Mã 2: Đẻ thừa cân Mã 3: Đẻ có can thiệp Mã 4: Đẻ ngạt Mã 5: Mẹ bị bệnh trong thời kỳ mang thai<br>1: Đẻ thiếu tháng<br>2: Đẻ thừa cân<br>3: Đẻ có can thiệp<br>4: Đẻ ngạt<br>5: Mẹ bị bệnh trong thời kỳ mang thai |
| 27 | Tên bệnh gây ra sản khoa không bình thường | `MA_BENH_SAN_KHOA_KHONG_BT` | Chuỗi | 255 | Ghi mã bệnh gây ra sản khoa không bình thường theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". B Tiêm chủng |
| 28 | BCG | `TIEM_CHUNG_BCG` | Số | 2 | Mã “0”: Không được tiêm Mã “1”: Được tiêm Mã “99”: Không nhớ rõ<br>0: Không được tiêm<br>1: Được tiêm<br>99: Không nhớ rõ |
| 29 | Bạch hầu, ho gà, uốn ván | `TIEM_CHUNG_BH_HG_UV` | Số | 2 | Mã “0”: Không được tiêm Mã “1”: Được tiêm Mã “99”: Không nhớ rõ<br>0: Không được tiêm<br>1: Được tiêm<br>99: Không nhớ rõ |
| 30 | Sởi | `TIEM_CHUNG_SOI` | Số | 2 | Mã “0”: Không được tiêm Mã “1”: Được tiêm Mã “99”: Không nhớ rõ 10<br>0: Không được tiêm<br>1: Được tiêm<br>99: Không nhớ rõ |
| 31 | Bại liệt | `TIEM_CHUNG_BAI_LIET` | Số | 2 | Mã “0”: Không được tiêm Mã “1”: Được tiêm Mã “99”: Không nhớ rõ<br>0: Không được tiêm<br>1: Được tiêm<br>99: Không nhớ rõ |
| 32 | Viêm não Nhật Bản B | `TIEM_CHUNG_VNNB_B` | Số | 2 | Mã “0”: Không được tiêm Mã “1”: Được tiêm Mã “99”: Không nhớ rõ<br>0: Không được tiêm<br>1: Được tiêm<br>99: Không nhớ rõ |
| 33 | Viêm gan B | `TIEM_CHUNG_VGB` | Số | 2 | Mã “0”: Không được tiêm Mã “1”: Được tiêm Mã “99”: Không nhớ rõ<br>0: Không được tiêm<br>1: Được tiêm<br>99: Không nhớ rõ |
| 34 | Các loại vắc xin khác | `TIEM_CHUNG_CAC_LOAI_KHAC` | Số | 1 | Mã “0”: Không tiêm loại khác Mã “1”: Có tiêm loại khác<br>1: Có tiêm loại khác |
| 35 | Tên vắc xin khác | `TIEM_CHUNG_VAC_XIN_KHAC` | Chuỗi | 1024 | Tên vắc xin khác được tiêm C Tiền sử bệnh/tật 36 Tiền sử bệnh/tật (Các bệnh bẩm sinh và mãn tính) MA_TSBT Số 1 Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 37 | Cụ thể tên bệnh | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 38 | Hiện tại có đang điều trị bệnh gì không? | `CO_DANG_DIEU_TRI_BENH` | Số | 1 | Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 39 | Cụ thể tên bệnh đang điều trị | `MA_BENH_DANG_DIEU_TRI` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 40 | Thuốc đang sử dụng điều trị | `TEN_THUOC` | Chuỗi | 1024 | Ghi theo hướng dẫn quy định tại Quyết định số 3176/QĐ- BYT IV Khám thể lực |
| 41 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 |  |
| 42 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 43 | Chỉ số BMI | `CHI_SO_BMI` | Chuỗi | 10 |  |
| 44 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 |  |
| 45 | Huyết áp (mmHg) | `HUYET_AP` | Chuỗi | 100 | 11 V Khám lâm sàng A Nhi khoa |
| 46 | Tuần hoàn | `NHI_KHOA_TUAN_HOAN` | Chuỗi | n |  |
| 47 | Hô hấp | `NHI_KHOA_HO_HAP` | Chuỗi | n |  |
| 48 | Tiêu hóa | `NHI_KHOA_TIEU_HOA` | Chuỗi | n |  |
| 49 | Thận-Tiết niệu | `NHI_KHOA_THAN_TIETNIEU` | Chuỗi | n |  |
| 50 | Thần kinh | `NHI_KHOA_THAN_KINH` | Chuỗi | n |  |
| 51 | Tâm thần | `NHI_KHOA_TAM_THAN` | Chuỗi | n |  |
| 52 | Khám lâm sàng khác | `NHI_KHOA_LAM_SANG_KHAC` | Chuỗi | n | B Mắt |
| 53 | Kết quả khám thị lực không kính (mắt phải) | `KHONG_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 54 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 55 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 56 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 57 | Các bệnh về mắt (nếu có) | `BENH_KHAC_MAT` | Chuỗi | n | C Tai - Mũi - Họng |
| 58 | Kết quả khám thính lực tai trái (nói thường) | `TAI_TRAI_NOI_THUONG` | Chuỗi | 5 |  |
| 59 | Kết quả khám thính lực tai trái (nói thầm) | `TAI_TRAI_NOI_THAM` | Chuỗi | 5 |  |
| 60 | Kết quả khám thính lực tai phải (nói thường) | `TAI_PHAI_NOI_THUONG` | Chuỗi | 5 |  |
| 61 | Kết quả khám thính lực tai phải (nói thầm) | `TAI_PHAI_NOI_THAM` | Chuỗi | 5 |  |
| 62 | Các bệnh về tai mũi họng (nếu có) | `BENH_TAI_MUI_HONG` | Chuỗi | n | D Răng - Hàm - Mặt |
| 63 | Kết quả khám hàm trên | `HAM_TREN` | Chuỗi | n |  |
| 64 | Kết quả khám hàm dưới | `HAM_DUOI` | Chuỗi | n | 12 |
| 65 | Các bệnh về răng-hàm- mặt (nếu có) | `BENH_RANG_HAM_MAT` | Chuỗi | n | VI Khám cận lâm sàng |
| 66 | Dịch vụ cận lâm sàng | `MA_DICH_VU` | Chuỗi | 50 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 67 | Tên chỉ số cận lâm sàng | `MA_CHI_SO` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 68 | Ghi giá trị chỉ số cận lâm sàng | `GIA_TRI` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 69 | Đơn vị đo chỉ số cận lâm sàng | `DON_VI_DO` | Chuỗi | 50 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 70 | Mô tả kết quả chỉ số cận lâm sàng | `MO_TA` | Chuỗi | n | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 71 | Kết luận chỉ số cận lâm sàng | `KET_LUAN` | Chuỗi | n | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT VII Kết luận |
| 72 | Phân loại sức khỏe | `PHAN_LOAI_SK` | Số | 1 | Ghi kết luận loại sức khỏe của đối tượng đến khám sức khỏe Mã "1": Loại I : Rất khoẻ Mã "2": Loại II : Khoẻ Mã "3": Loại III : Trung bình Mã "4": Loại IV : Yếu Mã "5": Loại V : Rất yếu<br>1: Loại I : Rất khoẻ<br>2: Loại II : Khoẻ<br>3: Loại III : Trung bình<br>4: Loại IV : Yếu<br>5: Loại V : Rất yếu |
| 73 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 74 | Các vấn đề sức khoẻ cần lưu ý | `CAC_VAN_DE_SUC_KHOE` | Chuỗi | n |  |
| 75 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 76 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `NGUOI_GIAM_HO` / `SO_CCCD_NGH` (Họ tên và định danh bố/mẹ/người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "nhi_khoa_tuan_hoan": "Bình thường",
      "nhi_khoa_ho_hap": "Bình thường",
      "nhi_khoa_tieu_hoa": "Bình thường",
      "nhi_khoa_than_kinh": "Bình thường",
      "khong_kinh_mat_phai": "Bình thường",
      "khong_kinh_mat_trai": "Bình thường",
      "co_kinh_mat_phai": "Bình thường",
      "co_kinh_mat_trai": "Bình thường",
      "benh_khac_mat": "Bình thường",
      "benh_tai_mui_hong": "Bình thường",
      "benh_rang_ham_mat": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_1_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_1_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <GIOI_TINH>1</GIOI_TINH>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <TUOI>1</TUOI>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <SO_CCCD>038095012345</SO_CCCD>
        <NGAYCAP_CCCD>2026-06-03</NGAYCAP_CCCD>
        <NOICAP_CCCD>Sample</NOICAP_CCCD>
        <NGUOI_GIAM_HO>Sample</NGUOI_GIAM_HO>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
        <CHI_SO_BMI>20.7</CHI_SO_BMI>
        <MACH>80</MACH>
        <HUYET_AP>120/80</HUYET_AP>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <NHI_KHOA_TUAN_HOAN>Bình thường</NHI_KHOA_TUAN_HOAN>
        <NHI_KHOA_HO_HAP>Bình thường</NHI_KHOA_HO_HAP>
        <NHI_KHOA_TIEU_HOA>Bình thường</NHI_KHOA_TIEU_HOA>
        <NHI_KHOA_THAN_TIETNIEU>Bình thường</NHI_KHOA_THAN_TIETNIEU>
        <NHI_KHOA_THAN_KINH>Bình thường</NHI_KHOA_THAN_KINH>
        <NHI_KHOA_TAM_THAN>Bình thường</NHI_KHOA_TAM_THAN>
        <NHI_KHOA_LAM_SANG_KHAC>Bình thường</NHI_KHOA_LAM_SANG_KHAC>
        <KHONG_KINH_MAT_PHAI>Bình thường</KHONG_KINH_MAT_PHAI>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <BENH_KHAC_MAT>Bình thường</BENH_KHAC_MAT>
        <BENH_TAI_MUI_HONG>Bình thường</BENH_TAI_MUI_HONG>
        <BENH_RANG_HAM_MAT>Bình thường</BENH_RANG_HAM_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <PHAN_LOAI_SK>1</PHAN_LOAI_SK>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CAC_VAN_DE_SUC_KHOE>Không</CAC_VAN_DE_SUC_KHOE>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_1_KSK>
```

---

## MẪU 2: 2. Mẫu giấy khám sức khỏe định kỳ cho người đủ 18 tuổi trở lên
**Đối tượng áp dụng:** Người lớn từ đủ 18 tuổi trở lên (Khám sức khỏe định kỳ tổng quát)

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 4 | Tuổi | `TUOI` | Số | 3 |  |
| 5 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 6 | CMND / CCCD / HC / Định danh công dân | `SO_CCCD` | Chuỗi | n | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 7 | Ngày cấp | `NGAYCAP_CCCD` | Chuỗi | 8 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 8 | Nơi cấp | `NOICAP_CCCD` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 9 | Nơi ở hiện tại | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 10 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 11 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 12 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 13 | Nghề nghiệp | `MA_NGHE_NGHIEP` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 14 | Nơi công tác, học tập hiện tại | `NOI_CONG_TAC_HIEN_TAI` | Chuỗi | 1024 | Ghi nơi công tác/học tập của đối tượng đến khám sức khỏe |
| 15 | Ngày bắt đầu vào làm việc tại đơn vị hiện nay | `NGAY_BAT_DAU_LAM_VIEC_HIEN_TAI` | Chuỗi | 8 | Thời gian bắt đầu làm việc nơi hiện tại của đối tượng. Ghi ngày, tháng, năm gồm 8 ký tự theo định dạng yyyyMMdd. - yyyy: 04 ký tự năm - MM: 02 ký tự tháng - dd: 02 ký tự ngày<br>yyyy: 04 ký tự năm<br>MM: 02 ký tự tháng<br>dd: 02 ký tự ngày |
| 16 | Nghề, công việc trước đây | `NGHE_CONG_VIEC_TRUOC_DAY` | Chuỗi | n | Liệt kê công việc đã làm trong 10 năm gần đây, tính từ thời điểm gần nhất. 14 |
| 17 | Thời gian làm việc (năm) | `THOI_GIAN_LAM_VIEC_TRUOC_DAY_NAM` | Số | 2 |  |
| 18 | Thời gian làm việc (tháng) | `THOI_GIAN_LAM_VIEC_TRUOC_DAY_THANG` | Số | 2 |  |
| 19 | Từ ngày | `TU_NGAY_LAM_VIEC_TRUOC_DAY` | Chuỗi | 8 | Thời gian bắt đầu làm việc trước đây của đối tượng. Ghi ngày, tháng, năm gồm 8 ký tự theo định dạng yyyyMMdd. - yyyy: 04 ký tự năm - MM: 02 ký tự tháng - dd: 02 ký tự ngày<br>yyyy: 04 ký tự năm<br>MM: 02 ký tự tháng<br>dd: 02 ký tự ngày |
| 20 | Đến ngày | `DEN_NGAY_LAM_VIEC_TRUOC_DAY` | Chuỗi | 8 | Thời gian kết thúc làm việc trước đây của đối tượng. Ghi ngày, tháng, năm gồm 8 ký tự theo định dạng yyyyMMdd. - yyyy: 04 ký tự năm - MM: 02 ký tự tháng - dd: 02 ký tự ngày<br>yyyy: 04 ký tự năm<br>MM: 02 ký tự tháng<br>dd: 02 ký tự ngày |
| 21 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 22 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác 15<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân tộc<br>7: Người sống tại vùng có điều kiện kinh tế<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm non<br>11: Học sinh trong các cơ sở giáo dục phổ<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 23 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác II Thông tin chung về lần khám<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 24 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 25 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 26 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 27 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT III Tiền sử bệnh/tật A Tiền sử gia đình |
| 28 | Tiền sử bệnh, tật của gia đình | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". B Tiền sử bản thân |
| 29 | Tên bệnh tiền sử bản thân | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 30 | Năm phát hiện | `TSBT_NAM_PHAT_HIEN_BENH` | Chuỗi | 4 |  |
| 31 | Tên bệnh nghề nghiệp | `TSBT_MA_BENH_NGHE_NGHIEP` | Chuỗi | 255 | Ghi mã các bệnh nghề nghiệp theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. 16 Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 32 | Năm phát hiện bệnh nghề nghiệp | `TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP` | Chuỗi | 4 | C Tiền sử sản phụ khoa (Đối với nữ) 33 Bắt đầu thấy kinh nguyệt năm bao nhiêu tuổi CO_KINH_NGUYET_NAM_BAO_NHIEU_TUOI Số 2 |
| 34 | Tính chất kinh nguyệt | `TINH_CHAT_KINH_NGUYET` | Số | 1 | Mã “0”: Không đều Mã “1”: Đều<br>1: Đều |
| 35 | Chu kỳ kinh (ngày) | `CHU_KY_KINH` | Số | 2 |  |
| 36 | Lượng kinh (ngày) | `LUONG_KINH` | Số | 2 |  |
| 37 | Đau bụng kinh | `DAU_BUNG_KINH` | Số | 1 | Mã “0”: Không Mã “1”: Có<br>1: Có |
| 38 | Đã lập gia đình | `DA_LAP_GIA_DINH` | Số | 1 | Mã “0”: Chưa Mã “1”: Có<br>1: Có |
| 39 | PARA | `PARA` | Chuỗi | 10 |  |
| 40 | Đã từng mổ sản, phụ khoa chưa? | `DA_TUNG_MO_SAN_PHU_KHOA_CHUA` | Số | 1 | Mã “0”: Chưa Mã “1”: Có<br>0: Chưa<br>1: Có |
| 41 | Số lần mổ sản, phụ khoa | `SO_LAN_MO_SAN_PHU_KHOA` | Số | 1 |  |
| 42 | Ghi rõ mổ sản, phụ khoa | `GHI_RO_MO_SAN_PHU_KHOA` | Chuỗi | 255 |  |
| 43 | Có đang áp dụng BPTT không? | `DANG_AP_DUNG_BPTT_KHONG` | Số | 1 | Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 44 | Ghi rõ BPTT đang sử dụng | `BIEN_PHAP_TRANH_THAI` | Số | 1 | Ghi biện pháp tránh thai theo mã quy định tại Phụ lục Thông tư số 01/2022/TT-BYT ngày 10/01/2022 IV Khám thể lực |
| 45 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 |  |
| 46 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 47 | Chỉ số BMI | `CHI_SO_BMI` | Chuỗi | 10 |  |
| 48 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 |  |
| 49 | Huyết áp (mmHg) | `HUYET_AP` | Chuỗi | 100 |  |
| 50 | Phân loại thể lực | `KHAM_THE_LUC_PL` | Số | 1 | 17 V Khám lâm sàng A Nội khoa |
| 51 | KQ khám tuần hoàn | `NOI_KHOA_TUAN_HOAN` | Chuỗi | n |  |
| 52 | Phân loại KQ khám tuần hoàn | `NOI_KHOA_TUAN_HOAN_PL` | Số | 1 |  |
| 53 | KQ Hô hấp | `NOI_KHOA_HO_HAP` | Chuỗi | n |  |
| 54 | Phân loại KQ khám hô hấp | `NOI_KHOA_HO_HAP_PL` | Số | 1 |  |
| 55 | KQ khám Tiêu hóa | `NOI_KHOA_TIEU_HOA` | Chuỗi | n |  |
| 56 | Phân loại KQ khám tiêu hoá | `NOI_KHOA_TIEU_HOA_PL` | Số | 1 |  |
| 57 | KQ khám Thận - Tiết niệu | `NOI_KHOA_THAN_TIETNIEU` | Chuỗi | n |  |
| 58 | Phân loại KQ khám Thận - Tiết niệu | `NOI_KHOA_THAN_TIETNIEU_PL` | Số | 1 |  |
| 59 | KQ khám Nội tiết | `NOI_KHOA_NOI_TIET` | Chuỗi | n |  |
| 60 | Phân loại khám Nội tiết | `NOI_KHOA_NOI_TIET_PL` | Số | 1 |  |
| 61 | KQ khám cơ - xương - khớp | `NOI_KHOA_CO_XUONG_KHOP` | Chuỗi | n |  |
| 62 | Phân loại KQ khám cơ - xương - khớp | `NOI_KHOA_CO_XUONG_KHOP_PL` | Số | 1 |  |
| 63 | KQ khám thần kinh | `NOI_KHOA_THAN_KINH` | Chuỗi | n |  |
| 64 | Phân loại KQ khám thần kinh | `NOI_KHOA_THAN_KINH_PL` | Số | 1 |  |
| 65 | KQ khám tâm thần | `NOI_KHOA_TAM_THAN` | Chuỗi | n |  |
| 66 | Phân loại KQ khám tâm thần | `NOI_KHOA_TAM_THAN_PL` | Số | 1 | B Ngoại khoa, Da liễu |
| 67 | KQ khám ngoại khoa | `KET_QUA_KHAM_NGOAI_KHOA` | Chuỗi | n |  |
| 68 | Phân loại KQ khám ngoại khoa | `KHAM_NGOAI_KHOA_PL` | Số | 1 |  |
| 69 | KQ khám da liễu | `KET_QUA_KHAM_DA_LIEU` | Chuỗi | n |  |
| 70 | Phân loại KQ khám da liễu | `KHAM_DA_LIEU_PL` | Số | 1 | C Sản phụ khoa 18 |
| 71 | KQ khám sản phụ khoa | `KET_QUA_KHAM_SAN_PHU_KHOA` | Chuỗi | n | Chi tiết nội dung khám theo danh mục tại phụ lục XXV ban hành kèm theo Thông tư số 32/2023/TT-BYT |
| 72 | Phân loại KQ khám sản phụ khoa | `KHAM_SAN_PHU_KHOA_PL` | Số | 1 | E Mắt |
| 73 | Kết quả khám thị lực không kính (mắt phải) | `KHONG_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 74 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 75 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 76 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 77 | Các bệnh về mắt (nếu có) | `BENH_KHAC_MAT` | Chuỗi | n |  |
| 78 | Phân loại KQ khám mắt | `KHAM_MAT_PL` | Số | 1 | F Tai - Mũi - Họng |
| 79 | Kết quả khám thính lực tai trái (nói thường) (m) | `TAI_TRAI_NOI_THUONG` | Chuỗi | 10 |  |
| 80 | Kết quả khám thính lực tai trái (nói thầm) (m) | `TAI_TRAI_NOI_THAM` | Chuỗi | 10 | 81 Kết quả khám thính lực tai phải (nói thường) (m) TAI_PHAI_NOI_THUONG Chuỗi 10 |
| 82 | Kết quả khám thính lực tai phải (nói thầm) (m) | `TAI_PHAI_NOI_THAM` | Chuỗi | 10 |  |
| 83 | Các bệnh về tai mũi họng (nếu có) | `BENH_KHAC_TAI_MUI_HONG` | Chuỗi | n |  |
| 84 | Phân loại KQ khám tai - mũi - họng | `KHAM_TAI_MUI_HONG_PL` | Số | 1 | G Răng - Hàm - Mặt |
| 85 | Kết quả khám hàm trên | `HAM_TREN` | Chuỗi | n |  |
| 86 | Kết quả khám hàm dưới | `HAM_DUOI` | Chuỗi | n |  |
| 87 | Các bệnh về răng-hàm- mặt (nếu có) | `BENH_KHAC_RANG_HAM_MAT` | Chuỗi | n | 19 |
| 88 | Phân loại KQ khám răng - hàm - mặt | `KHAM_RANG_HAM_MAT_PL` | Số | 1 | VI Khám cận lâm sàng |
| 89 | Dịch vụ cận lâm sàng | `MA_DICH_VU` | Chuỗi | 50 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 90 | Tên chỉ số cận lâm sàng | `MA_CHI_SO` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 91 | Ghi giá trị chỉ số cận lâm sàng | `GIA_TRI` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 92 | Đơn vị đo chỉ số cận lâm sàng | `DON_VI_DO` | Chuỗi | 50 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 93 | Mô tả kết quả chỉ số cận lâm sàng | `MO_TA` | Chuỗi | n | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 94 | Kết luận chỉ số cận lâm sàng | `KET_LUAN` | Chuỗi | n | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT VII Kết luận |
| 95 | Phân loại sức khỏe | `PHAN_LOAI_SK` | Số | 1 | Ghi kết luận loại sức khỏe của đối tượng đến khám sức khỏe Mã "1": Loại I : Rất khoẻ Mã "2": Loại II : Khoẻ Mã "3": Loại III : Trung bình Mã "4": Loại IV : Yếu Mã "5": Loại V : Rất yếu<br>1: Loại I : Rất khoẻ<br>2: Loại II : Khoẻ<br>3: Loại III : Trung bình<br>4: Loại IV : Yếu<br>5: Loại V : Rất yếu |
| 96 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 97 | Các bệnh, tật (nếu có) | `CAC_BENH_TAT_NEU_CO` | Chuỗi | n |  |
| 98 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 99 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "kham_the_luc_pl": 1,
      "noi_khoa_tuan_hoan": "Bình thường",
      "noi_khoa_tuan_hoan_pl": 1,
      "noi_khoa_ho_hap": "Bình thường",
      "noi_khoa_ho_hap_pl": 1,
      "noi_khoa_tieu_hoa": "Bình thường",
      "noi_khoa_tieu_hoa_pl": 1,
      "noi_khoa_than_tietnieu_pl": 1,
      "noi_khoa_noi_tiet_pl": 1,
      "noi_khoa_co_xuong_khop": "Bình thường",
      "noi_khoa_co_xuong_khop_pl": 1,
      "noi_khoa_than_kinh": "Bình thường",
      "noi_khoa_than_kinh_pl": 1,
      "noi_khoa_tam_than_pl": 1,
      "kham_ngoai_khoa_pl": 1,
      "kham_da_lieu_pl": 1,
      "kham_san_phu_khoa_pl": 1,
      "khong_kinh_mat_phai": "Bình thường",
      "khong_kinh_mat_trai": "Bình thường",
      "co_kinh_mat_phai": "Bình thường",
      "co_kinh_mat_trai": "Bình thường",
      "benh_khac_mat": "Bình thường",
      "kham_mat_pl": 1,
      "benh_khac_tai_mui_hong": "Bình thường",
      "kham_tai_mui_hong_pl": 1,
      "benh_khac_rang_ham_mat": "Bình thường",
      "kham_rang_ham_mat_pl": 1
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_2_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_2_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <GIOI_TINH>1</GIOI_TINH>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <TUOI>1</TUOI>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <SO_CCCD>038095012345</SO_CCCD>
        <NGAYCAP_CCCD>2026-06-03</NGAYCAP_CCCD>
        <NOICAP_CCCD>Sample</NOICAP_CCCD>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
        <DIEN_THOAI>Sample</DIEN_THOAI>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
        <CHI_SO_BMI>20.7</CHI_SO_BMI>
        <MACH>80</MACH>
        <HUYET_AP>120/80</HUYET_AP>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <NOI_KHOA_TUAN_HOAN>Bình thường</NOI_KHOA_TUAN_HOAN>
        <NOI_KHOA_TUAN_HOAN_PL>Bình thường</NOI_KHOA_TUAN_HOAN_PL>
        <NOI_KHOA_HO_HAP>Bình thường</NOI_KHOA_HO_HAP>
        <NOI_KHOA_HO_HAP_PL>Bình thường</NOI_KHOA_HO_HAP_PL>
        <NOI_KHOA_TIEU_HOA>Bình thường</NOI_KHOA_TIEU_HOA>
        <NOI_KHOA_TIEU_HOA_PL>Bình thường</NOI_KHOA_TIEU_HOA_PL>
        <NOI_KHOA_THAN_TIETNIEU>Bình thường</NOI_KHOA_THAN_TIETNIEU>
        <NOI_KHOA_THAN_TIETNIEU_PL>Bình thường</NOI_KHOA_THAN_TIETNIEU_PL>
        <NOI_KHOA_NOI_TIET>Bình thường</NOI_KHOA_NOI_TIET>
        <NOI_KHOA_NOI_TIET_PL>Bình thường</NOI_KHOA_NOI_TIET_PL>
        <NOI_KHOA_CO_XUONG_KHOP>Bình thường</NOI_KHOA_CO_XUONG_KHOP>
        <NOI_KHOA_CO_XUONG_KHOP_PL>Bình thường</NOI_KHOA_CO_XUONG_KHOP_PL>
        <NOI_KHOA_THAN_KINH>Bình thường</NOI_KHOA_THAN_KINH>
        <NOI_KHOA_THAN_KINH_PL>Bình thường</NOI_KHOA_THAN_KINH_PL>
        <NOI_KHOA_TAM_THAN>Bình thường</NOI_KHOA_TAM_THAN>
        <NOI_KHOA_TAM_THAN_PL>Bình thường</NOI_KHOA_TAM_THAN_PL>
        <KET_QUA_KHAM_NGOAI_KHOA>Bình thường</KET_QUA_KHAM_NGOAI_KHOA>
        <KHAM_NGOAI_KHOA_PL>Bình thường</KHAM_NGOAI_KHOA_PL>
        <KHONG_KINH_MAT_PHAI>Bình thường</KHONG_KINH_MAT_PHAI>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <BENH_KHAC_MAT>Bình thường</BENH_KHAC_MAT>
        <KHAM_MAT_PL>Bình thường</KHAM_MAT_PL>
        <BENH_KHAC_TAI_MUI_HONG>Bình thường</BENH_KHAC_TAI_MUI_HONG>
        <KHAM_TAI_MUI_HONG_PL>Bình thường</KHAM_TAI_MUI_HONG_PL>
        <BENH_KHAC_RANG_HAM_MAT>Bình thường</BENH_KHAC_RANG_HAM_MAT>
        <KHAM_RANG_HAM_MAT_PL>Bình thường</KHAM_RANG_HAM_MAT_PL>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <PHAN_LOAI_SK>1</PHAN_LOAI_SK>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_2_KSK>
```

---

## MẪU 3: 3. Mẫu sổ khám sức khỏe định kỳ cho lái xe
**Đối tượng áp dụng:** Người học lái xe hoặc nâng hạng giấy phép lái xe

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 4 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 5 | CMND / CCCD / HC / Định danh công dân | `SO_CCCD` | Chuỗi | n | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Ngày cấp | `NGAYCAP_CCCD` | Chuỗi | 8 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Nơi cấp | `NOICAP_CCCD` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 8 | Nơi ở hiện tại | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 9 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 10 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Đề nghị khám sức khỏe để lái xe hạng | `HANG_LAI_XE` | Chuỗi | 10 | Ghi rõ hạng giấy phép lái xe đề nghị và ghi rõ cấp đổi hoặc cấp mới hoặc cấp lại. |
| 12 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 13 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 14 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân tộc thiểu số và<br>7: Người sống tại vùng có điều kiện kinh tế - xã hội<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm non<br>11: Học sinh trong các cơ sở giáo dục phổ thông<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 15 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế 21 dữ liệu Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác II Thông tin chung về cơ sở khám sức khỏe<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 16 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 17 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 18 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 19 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Tiền sử bệnh của đối tượng khám sức khỏe A Tiền sử gia đình |
| 20 | Có ai trong gia đình mắc bệnh không | `TSGD_MAC_BENH` | Số | 1 | Trường hợp trong gia đình có người mắc các bệnh bẩm sinh hoặc bệnh truyền nhiễm, thực hiện ghi: Mã “0”: Không Mã “1”: Có<br>ghi: <br>0: Không<br>1: Có |
| 21 | Tên bệnh cụ thể khi trong gia đình có người mắc | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". B Tiền sử bệnh sử bản thân |
| 22 | Có bệnh hay bị thương trong 5 năm qua | `TS_BENH_THUONG_5_NAM` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 23 | Bệnh thần kinh hoặc bị thương ở đầu | `TS_THAN_KINH_CHAN_THUONG_DAU` | Số | 1 | 1=Có, 0=Không 24 Bệnh mắt hoặc giảm thị lực (trừ trường hợp đeo kính thuốc) TS_BENH_MAT_GIAM_THI_LUC Số 1 1=Có, 0=Không 22 dữ liệu<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 25 | Bệnh tai, giảm sức nghe hoặc thăng bằng | `TS_BENH_TAI_GIAM_NGHE` | Số | 1 | 1=Có, 0=Không 26 Bệnh ở tim hoặc nhồi máu cơ tim, các bệnh tim mạch khác TS_BENH_TIM_MACH Số 1 1=Có, 0=Không 27 Phẫu thuật can thiệp tim - mạch (thay van, bắc cầu nối, tạo hình mạch, máy tạo nhịp, đặt stent mạch, ghép tim) TS_PHAU_THUAT_TIM_MACH Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 28 | Tăng huyết áp | `TS_TANG_HUYET_AP` | Số | 1 | 1=Có, 0=Không |
| 29 | Khó thở | `TS_KHO_THO` | Số | 1 | 1=Có, 0=Không 30 Bệnh phổi, hen, khí phế thũng, viêm phế quản mạn tính TS_BENH_PHOI_HEN Số 1 1=Có, 0=Không<br>1: Có, 0=Không |
| 31 | Bệnh thận, lọc máu | `TS_BENH_THAN_LOC_MAU` | Số | 1 | 1=Có, 0=Không |
| 32 | Đái tháo đường hoặc kiểm soát tăng đường huyết | `TS_DAI_THAO_DUONG` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 33 | Bệnh tâm thần | `TS_BENH_TAM_THAN` | Số | 1 | 1=Có, 0=Không |
| 34 | Mất ý thức, rối loạn ý thức | `TS_MAT_ROI_LOAN_Y_THUC` | Số | 1 | 1=Có, 0=Không 35 Ngất, chóng mặt, mệt mỏi, buồn ngủ hoặc ngất xỉu TS_NGAT_CHONG_MAT Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 36 | Bệnh tiêu hóa | `TS_BENH_TIEU_HOA` | Số | 1 | 1=Có, 0=Không 37 Rối loạn giấc ngủ, ngừng thở khi ngủ, ngủ rũ ban ngày, ngáy to TS_ROI_LOAN_GIAC_NGU Số 1 1=Có, 0=Không<br>1: Có, 0=Không |
| 38 | Tai biến mạch máu não hoặc liệt | `TS_TAI_BIEN_MACH_NAO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 39 | Bệnh hoặc tổn thương cột sống | `TS_BENH_COT_SONG` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 40 | Sử dụng rượu thường xuyên, liên tục | `TS_SU_DUNG_RUOU` | Số | 1 | 1=Có, 0=Không 23 dữ liệu<br>1: Có, 0=Không |
| 41 | Sử dụng ma túy và chất gây nghiện | `TS_SU_DUNG_MA_TUY` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 42 | Tên bệnh cụ thể bản thân (nếu có) | `TS_MA_BENH_BAN_THAN` | Chuỗi | n | C Câu hỏi khác (nếu có): |
| 43 | Có đang điều trị bệnh gì không? | `TS_MAC_BENH` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 45 | Kết quả khám tâm thần | `NOI_KHOA_TAM_THAN` | Chuỗi | n | B Thần kinh |
| 46 | Kết quả khám thần kinh | `NOI_KHOA_THAN_KINH` | Chuỗi | n | C Mắt |
| 47 | Thị lực nhìn xa mắt phải không kính | `KHONG_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 48 | Thị lực nhìn xa mắt trái không kính | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 49 | Thị lực nhìn xa mắt phải có kính | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 50 | Thị lực nhìn xa mắt trái có kính | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 51 | Thị lực nhìn xa hai mắt không kính | `KHONG_KINH_HAI_MAT` | Chuỗi | 5 |  |
| 52 | Thị lực nhìn xa hai mắt có kính | `CO_KINH_HAI_MAT` | Chuỗi | 5 |  |
| 53 | Thị trường ngang hai mắt (mũi - thái dương) | `THI_TRUONG_NGANG_HAIMAT` | Số | 1 | Mã "1": Bình thường Mã "2": Hạn chế<br>1: Bình thường<br>2: Hạn chế |
| 54 | Thị trường đứng (chiều trên - dưới) | `THI_TRUONG_DUNG_HAIMAT` | Số | 1 | Mã "1": Bình thường Mã "2": Hạn chế<br>1: Bình thường<br>2: Hạn chế |
| 55 | Sắc giác | `SAC_GIAC` | Số | 1 | Mã "1": Bình thường Mã "2": Mù màu toàn bộ Mã "3": Mù màu đỏ 24 dữ liệu Mã "4": Mù màu xanh lá cây Mã "5": Mù màu vàng<br>1: Bình thường<br>2: Mù màu toàn bộ<br>3: Mù màu đỏ<br>4: Mù màu xanh lá cây<br>5: Mù màu vàng |
| 56 | Các bệnh về mắt (nếu có) | `BENH_KHAC_MAT` | Chuỗi | n | Ghi các bệnh về mắt (nếu có) D Tai - Mũi - Họng |
| 57 | Thính lực tai trái nói thường (m) | `TAI_TRAI_NOI_THUONG` | Chuỗi | 10 |  |
| 58 | Thính lực tai trái nói thầm (m) | `TAI_TRAI_NOI_THAM` | Chuỗi | 10 |  |
| 59 | Thính lực tai phải nói thường (m) | `TAI_PHAI_NOI_THUONG` | Chuỗi | 10 |  |
| 60 | Thính lực tai phải nói thầm (m) | `TAI_PHAI_NOI_THAM` | Chuỗi | 10 |  |
| 61 | Các bệnh về tai mũi họng (nếu có) | `BENH_KHAC_TAI_MUI_HONG` | Chuỗi | n | E Tim mạch |
| 62 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 |  |
| 63 | Huyết áp (mmHg) | `HUYET_AP` | Chuỗi | 100 | F Hô hấp |
| 64 | Kết quả khám hô hấp | `KQ_LAM_SANG_HO_HAP` | Chuỗi | n | G Cơ xương khớp |
| 65 | Kết quả khám cơ xương khớp | `KQ_CO_XUONG_KHOP` | Chuỗi | n | H Nội tiết |
| 66 | Kết quả khám nội tiết | `NOI_TIET` | Chuỗi | n | V Khám cận lâm sàng A Xét nghiệm ma túy |
| 67 | Kết quả xét nghiệm ma túy | `KQ_XN_MA_TUY` | Chuỗi | n | Ghi kết quả sàng lọc và định tính các loại ma túy: Amphetamin, Marijuana, Morphin, Codein, Heroin B Sản phụ khoa<br>y:  |
| 68 | KQ khám sản phụ khoa | `KET_QUA_KHAM_SAN_PHU_KHOA` | Chuỗi | n | Chi tiết nội dung khám theo danh mục tại phụ lục XXV ban hành kèm theo Thông tư số 32/2023/TT-BYT |
| 69 | Phân loại KQ khám sản phụ khoa | `KHAM_SAN_PHU_KHOA_PL` | Số | 1 | 25 dữ liệu |
| 70 | Kết quả xét nghiệm nồng độ cồn | `KET_QUA_XN_NONG_DO_CON` | Chuỗi | n | C Xét nghiệm khác theo chỉ định bác sĩ 71 Kết quả xét nghiệm nồng độ cồn / huyết học / sinh hóa / X-quang / khác KET_QUA_XN_KHAC Chuỗi n Ghi kết quả xét nghiệm nồng độ cồn trong máu hoặc hơi thở, huyết học, sinh hóa, X-quang, điện não đồ, điện tim... theo chỉ định |
| 72 | Kết luận xét nghiệm khác | `KET_LUAN_XN_KHAC` | Chuỗi | n | Ghi kết luận sau các xét nghiệm khác theo chỉ định VI Kết luận |
| 73 | Kết luận đánh giá tình trạng sức khoẻ | `KET_LUAN_LOAI_SUC_KHOE` | Chuỗi | n | Ghi kết luận loại sức khỏe của đối tượng đến khám sức khỏe |
| 74 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 75 | Kết luận các vấn đề sức khoẻ cần lưu ý | `KET_LUAN_CAC_VAN_DE_SUC_KHOE` | Chuỗi | n | Ghi kết luận các vấn đề sức khỏe của đối tượng đến khám sức khỏe |
| 76 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 77 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `HANG_LAI_XE` (Dropdown danh sách hạng đề nghị B1, B2, C, D, E...)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "ts_than_kinh_chan_thuong_dau": "Bình thường",
      "ts_mat_roi_loan_y_thuc": "Bình thường",
      "ts_benh_tieu_hoa": "Bình thường",
      "noi_khoa_than_kinh": "Bình thường",
      "khong_kinh_mat_phai": "Bình thường",
      "khong_kinh_mat_trai": "Bình thường",
      "co_kinh_mat_phai": "Bình thường",
      "co_kinh_mat_trai": "Bình thường",
      "khong_kinh_hai_mat": "Bình thường",
      "co_kinh_hai_mat": "Bình thường",
      "thi_truong_ngang_haimat": "Bình thường",
      "thi_truong_dung_haimat": "Bình thường",
      "benh_khac_mat": "Bình thường",
      "benh_khac_tai_mui_hong": "Bình thường",
      "kq_lam_sang_ho_hap": "Bình thường",
      "kq_co_xuong_khop": "Bình thường",
      "kham_san_phu_khoa_pl": 1
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_3_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_3_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <GIOI_TINH>1</GIOI_TINH>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <SO_CCCD>038095012345</SO_CCCD>
        <NGAYCAP_CCCD>2026-06-03</NGAYCAP_CCCD>
        <NOICAP_CCCD>Sample</NOICAP_CCCD>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
        <HANG_LAI_XE>Sample</HANG_LAI_XE>
        <DIEN_THOAI>Sample</DIEN_THOAI>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
        <TSGD_MAC_BENH>0</TSGD_MAC_BENH>
        <TSGD_MA_BENH>0</TSGD_MA_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <MACH>80</MACH>
        <HUYET_AP>120/80</HUYET_AP>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <TS_MAT_ROI_LOAN_Y_THUC>Bình thường</TS_MAT_ROI_LOAN_Y_THUC>
        <NOI_KHOA_TAM_THAN>Bình thường</NOI_KHOA_TAM_THAN>
        <NOI_KHOA_THAN_KINH>Bình thường</NOI_KHOA_THAN_KINH>
        <KHONG_KINH_MAT_PHAI>Bình thường</KHONG_KINH_MAT_PHAI>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <KHONG_KINH_HAI_MAT>Bình thường</KHONG_KINH_HAI_MAT>
        <CO_KINH_HAI_MAT>Bình thường</CO_KINH_HAI_MAT>
        <THI_TRUONG_NGANG_HAIMAT>Bình thường</THI_TRUONG_NGANG_HAIMAT>
        <THI_TRUONG_DUNG_HAIMAT>Bình thường</THI_TRUONG_DUNG_HAIMAT>
        <BENH_KHAC_MAT>Bình thường</BENH_KHAC_MAT>
        <BENH_KHAC_TAI_MUI_HONG>Bình thường</BENH_KHAC_TAI_MUI_HONG>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_3_KSK>
```

---

## MẪU 4: 4.  Mẫu sổ khám sức khỏe định kỳ cho nhân viên đường sắt
**Đối tượng áp dụng:** Nhân viên ngành đường sắt trực tiếp chạy tàu

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 4 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 5 | CMND / CCCD / HC / Định danh công dân | `SO_CCCD` | Chuỗi | n | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Ngày cấp | `NGAYCAP_CCCD` | Chuỗi | 8 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Nơi cấp | `NOICAP_CCCD` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT 26 |
| 8 | Nơi ở hiện tại | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 9 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 10 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Chức danh đang làm | `CHUC_DANH` | Chuỗi | 255 | Ghi chức danh đang của đối tượng |
| 12 | Nơi công tác | `NOI_CONG_TAC` | Chuỗi | 255 | Ghi nơi công tác của đối tượng |
| 13 | Tên bệnh tiền sử bản thân | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 14 | Năm phát hiện | `TSBT_NAM_PHAT_HIEN_BENH` | Chuỗi | 4 |  |
| 15 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 16 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 17 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân tộc thiểu<br>7: Người sống tại vùng có điều kiện kinh tế - xã<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm non<br>11: Học sinh trong các cơ sở giáo dục phổ<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 18 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động 27 Mã “5”: Xã hội hóa Mã "9": Khác II Thông tin chung về cơ sở khám sức khỏe<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 19 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 20 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 21 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 22 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Khám lâm sàng A Toàn thân |
| 23 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 |  |
| 24 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 25 | Chỉ số BMI | `CHI_SO_BMI` | Chuỗi | 10 |  |
| 26 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 |  |
| 27 | Huyết áp | `HUYET_AP` | Chuỗi | 100 | B Tâm thần |
| 28 | Kết quả khám tâm thần | `KQ_TAM_THAN` | Chuỗi | n | C Thần kinh |
| 29 | Kết quả khám thần kinh | `KQ_THAN_KINH` | Chuỗi | n | D Tai - Mũi - Họng |
| 30 | Kết quả khám tai mũi họng | `KQ_TAI_MUI_HONG` | Chuỗi | n | E Tim mạch |
| 31 | Kết quả khám tim mạch | `KQ_TIM_MACH` | Chuỗi | n | F Hô hấp |
| 32 | Kết quả khám hô hấp | `KQ_HO_HAP` | Chuỗi | n | G Cơ xương khớp |
| 33 | Kết quả khám cơ xương khớp | `KQ_CO_XUONG_KHOP` | Chuỗi | n | 28 H Nội tiết |
| 34 | Kết quả khám nội tiết | `KQ_NOI_TIET` | Chuỗi | n | I Ngoại khoa - Da liễu |
| 35 | Kết quả khám ngoại khoa | `KQ_NGOAI_KHOA` | Chuỗi | n |  |
| 36 | Kết quả khám da liễu | `KQ_DA_LIEU` | Chuỗi | n | J Tiết niệu - Sinh dục |
| 37 | Kết quả khám tiết niệu | `KQ_TIET_NIEU` | Chuỗi | n |  |
| 38 | Kết quả khám sinh dục | `KQ_SINH_DUC` | Chuỗi | n | K Nội tiết - Chuyển hóa |
| 39 | Kết quả khám nội tiết - chuyển hóa | `KQ_NOI_TIET_CHUYEN_HOA` | Chuỗi | n | IV Khám cận lâm sàng A Xét nghiệm bắt buộc |
| 40 | Kết quả xét nghiệm ma túy | `KET_QUA_XN_MA_TUY` | Chuỗi | n | Ghi kết quả sàng lọc và định tính các loại ma túy: Amphetamin, Marijuana, Morphin, Codein, Heroin<br>y:  |
| 41 | Kết quả xét nghiệm nồng độ cồn | `KET_QUA_XN_NONG_DO_CON` | Chuỗi | n | B Xét nghiệm khác theo chỉ định bác sĩ 42 Kết quả xét nghiệm huyết học / sinh hóa / X-quang / khác KET_QUA_XN_KHAC Chuỗi n Ghi kết quả các xét nghiệm huyết học, sinh hóa, X- quang và các xét nghiệm khác theo chỉ định của bác sĩ khám sức khỏe V Kết luận |
| 43 | Phân loại sức khỏe | `PHAN_LOAI_SK` | Số | 1 | Ghi kết luận loại sức khỏe của đối tượng đến khám sức khỏe Mã "1": Loại I : Rất khoẻ Mã "2": Loại II : Khoẻ Mã "3": Loại III : Trung bình Mã "4": Loại IV : Yếu Mã "5": Loại V : Rất yếu 44 Đủ tiêu chuẩn sức khỏe điều khiển PTGT đường sắt DU_TIEU_CHUAN_DK_PTGT_DUONG_SAT Số 1 Mã "0": Không đủ Mã "1": Đủ 29<br>1: Loại I : Rất khoẻ<br>2: Loại II : Khoẻ<br>3: Loại III : Trung bình<br>4: Loại IV : Yếu<br>5: Loại V : Rất yếu<br>0: Không đủ<br>1: Đủ |
| 45 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". VI Ngày kết luận |
| 46 | Ngày kết luận | `NGAY_KET_LUAN` | Chuỗi | 12 | VII Người kết luận |
| 47 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 48 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `CHUC_DANH` (Nhập chức danh đường sắt)
   - `NOI_CONG_TAC` (Nhập đơn vị công tác)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "kq_than_kinh": "Bình thường",
      "kq_tai_mui_hong": "Bình thường",
      "kq_ho_hap": "Bình thường",
      "kq_co_xuong_khop": "Bình thường",
      "kq_tiet_nieu": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_4_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_4_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <GIOI_TINH>1</GIOI_TINH>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <SO_CCCD>038095012345</SO_CCCD>
        <NGAYCAP_CCCD>2026-06-03</NGAYCAP_CCCD>
        <NOICAP_CCCD>Sample</NOICAP_CCCD>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
        <CHUC_DANH>Sample</CHUC_DANH>
        <NOI_CONG_TAC>Sample</NOI_CONG_TAC>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
        <TSBT_MA_BENH>0</TSBT_MA_BENH>
        <TSBT_NAM_PHAT_HIEN_BENH>0</TSBT_NAM_PHAT_HIEN_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
        <CHI_SO_BMI>20.7</CHI_SO_BMI>
        <MACH>80</MACH>
        <HUYET_AP>120/80</HUYET_AP>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <KQ_TAI_MUI_HONG>Bình thường</KQ_TAI_MUI_HONG>
        <KQ_NGOAI_KHOA>Bình thường</KQ_NGOAI_KHOA>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <PHAN_LOAI_SK>1</PHAN_LOAI_SK>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_4_KSK>
```

---

## MẪU 5: 5.  Mẫu sổ khám sức khỏe định kỳ cho thuyền viên
**Đối tượng áp dụng:** Thuyền viên làm việc trên tàu biển Việt Nam hoặc tàu nước ngoài

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 4 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 5 | Quốc tịch | `QUOC_TICH` | Chuỗi | 100 |  |
| 6 | CMND / CCCD / HC / Định danh công dân | `SO_CCCD` | Chuỗi | n | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Ngày cấp | `NGAYCAP_CCCD` | Chuỗi | 8 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 8 | Nơi cấp | `NOICAP_CCCD` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 9 | Nơi ở hiện tại | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 10 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 12 | Chức danh trên tàu | `CHUC_DANH_TREN_TAU` | Chuỗi | 255 |  |
| 13 | Tên chủ tàu | `TEN_CHU_TAU` | Chuỗi | 255 |  |
| 14 | Địa chỉ chủ tàu | `DIA_CHI_CHU_TAU` | Chuỗi | 1024 |  |
| 15 | Khu vực hoạt động của tàu | `KHU_VUC_HOAT_DONG_TAU` | Số | 1 | Mã "1": Trong nước Mã "2": Quốc tế<br>1: Trong nước<br>2: Quốc tế |
| 16 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT 30 |
| 17 | Lý do khám sức khỏe | `LY_DO_KSK` | Chuỗi | n |  |
| 18 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 19 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân tộc thiểu số<br>7: Người sống tại vùng có điều kiện kinh tế - xã<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm non<br>11: Học sinh trong các cơ sở giáo dục phổ thông<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 20 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác II Thông tin chung về cơ sở khám sức khỏe<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 21 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 22 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 23 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 24 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Tiền sử bệnh/tật A Tiền sử bản thân 31 |
| 25 | Tên bệnh tiền sử bản thân | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 26 | Năm phát hiện | `TSBT_NAM_PHAT_HIEN_BENH` | Chuỗi | 4 | IV Khám thể lực A Thể lực |
| 27 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 |  |
| 28 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 29 | Chỉ số BMI | `CHI_SO_BMI` | Chuỗi | 10 |  |
| 30 | Lực bóp tay thuận (kg) | `LUC_BOP_TAY_THUAN` | Chuỗi | 100 |  |
| 31 | Lực bóp tay không thuận (kg) | `LUC_BOP_TAY_KHONG_THUAN` | Chuỗi | 100 |  |
| 32 | Lực kéo thân (kg) | `LUC_KEO_THAN` | Chuỗi | 100 |  |
| 33 | Vòng ngực trung bình (cm) | `VONG_NGUC_TRUNG_BINH` | Chuỗi | 100 |  |
| 34 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | B Mạch, huyết áp |
| 35 | Mạch | `MACH` | Chuỗi | 100 | Ghi mạch (nhịp tim) của đối tượng đến khám sức khỏe, theo định dạng "số - số" |
| 36 | Huyết áp tâm trương (mmHg) | `HA_TAM_TRUONG` | Chuỗi | 6 | Ghi số đo huyết áp tâm trương của đối tượng khám sức khỏe theo mmHg |
| 37 | Huyết áp tâm thu (mmHg) | `HA_TAM_THU` | Chuỗi | 6 | Ghi số đo huyết áp tâm thu của đối tượng khám sức khỏe theo mmHg |
| 38 | Nhịp tim | `NHIP_TIM` | Chuỗi | 6 | Ghi số đo nhịp tim của đối tượng khám sức khỏe theo lần/phút |
| 39 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | V Khám lâm sàng |
| 40 | Tim mạch | `TIM_MACH` | Chuỗi | n |  |
| 41 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 42 | Hô hấp | `HO_HAP` | Chuỗi | n |  |
| 43 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | 32 |
| 44 | Tiết niệu - sinh dục | `TIET_NIEU_SINH_DUC` | Chuỗi | n |  |
| 45 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 46 | Tiêu hóa | `NOI_KHOA_TIEU_HOA` | Chuỗi | n |  |
| 47 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 48 | Gan - mật | `GAN_MAT` | Chuỗi | n |  |
| 49 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 50 | Nội tiết, dinh dưỡng và chuyển hóa | `NOI_TIET_DINH_DUONG_CHUYEN_HOA` | Chuỗi | n |  |
| 51 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 52 | Máu và cơ quan tạo máu | `MAU_CO_QUAN_TAO_MAU` | Chuỗi | n |  |
| 53 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 54 | Da và tổ chức dưới da | `DA_TO_CHUC_DUOI_DA` | Chuỗi | n |  |
| 55 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 56 | Cơ, xương, khớp | `KQ_CO_XUONG_KHOP` | Chuỗi | n |  |
| 57 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 58 | Thần kinh | `THAN_KINH` | Chuỗi | n |  |
| 59 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 60 | Rối loạn hành vi và tâm thần | `ROI_LOAN_HANH_VI_TAM_THAN` | Chuỗi | n |  |
| 61 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 62 | Các bệnh ngoại khoa | `MA_BENH_NGOAI_KHOA` | Chuỗi | n |  |
| 63 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 64 | Tai, mũi, họng | `KHAM_TAI_MUI_HONG` | Chuỗi | n |  |
| 65 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 66 | Mắt | `KHAM_MAT` | Chuỗi | n |  |
| 67 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 68 | Bệnh khác | `BENH_KHAC` | Chuỗi | n |  |
| 69 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | Thị giác 70 Kết quả khám thị lực nhìn xa (5m) khi không kính (mắt phải) XA_KHONG_KINH_MAT_PHAI Chuỗi 5 33 71 Kết quả khám thị lực nhìn xa (5m) khi không kính (mắt trái) XA_KHONG_KINH_MAT_TRAI Chuỗi 5 72 Kết quả khám thị lực nhìn xa (5m) khi không kính (hai mắt) XA_KHONG_KINH_HAI_MAT Chuỗi 5 73 Kết quả khám thị lực nhìn xa (5m) khi có kính (mắt phải) XA_CO_KINH_MAT_PHAI Chuỗi 5 74 Kết quả khám thị lực nhìn xa (5m) khi có kính (mắt trái) XA_CO_KINH_MAT_TRAI Chuỗi 5 75 Kết quả khám thị lực nhìn xa (5m) khi có kính (hai mắt) XA_CO_KINH_HAI_MAT Chuỗi 5 76 Kết quả khám thị lực nhìn gần khi không kính (mắt phải) GAN_KHONG_KINH_MAT_PHAI Chuỗi 5 77 Kết quả khám thị lực nhìn gần khi không kính (mắt trái) GAN_KHONG_KINH_MAT_TRAI Chuỗi 5 78 Kết quả khám thị lực nhìn gần khi không kính (hai mắt) GAN_KHONG_KINH_HAI_MAT Chuỗi 5 |
| 79 | Kết quả khám thị lực nhìn gần khi có kính (mắt phải) | `GAN_CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 80 | Kết quả khám thị lực nhìn gần khi có kính (mắt trái) | `GAN_CO_KINH_MAT_TRAI` | Chuỗi | 5 | 81 Kết quả khám thị lực nhìn xa gần khi có kính (hai mắt) GAN_CO_KINH_HAI_MAT Chuỗi 5 |
| 82 | Kết quả khám thị trường từng mắt (mắt phải) | `KHAM_MAT_THI_TRUONG_PHAI` | Số | 1 | Mã 0: Hạn chế Mã 1: Bình thường<br>0: Hạn chế<br>1: Bình thường |
| 83 | Kết quả khám thị trường từng mắt (mắt trái) | `KHAM_MAT_THI_TRUONG_TRAI` | Số | 1 | Mã 0: Hạn chế Mã 1: Bình thường<br>0: Hạn chế<br>1: Bình thường |
| 84 | Thị giác mầu | `KHAM_MAT_THI_GIAC_MAU` | Số | 1 | Mã "0": Không thử Mã "1": Bình thường 34 Mã "2": Mù mầu Mã "3": Hạn chế<br>1: Bình thường<br>2: Mù mầu<br>3: Hạn chế |
| 85 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | Thính giác |
| 86 | Kết quả khám thính lực tai trái (nói thường) | `TAI_TRAI_NOI_THUONG` | Chuỗi | 10 |  |
| 87 | Kết quả khám thính lực tai trái (nói thầm) | `TAI_TRAI_NOI_THAM` | Chuỗi | 10 |  |
| 88 | Kết quả khám thính lực tai phải (nói thường) | `TAI_PHAI_NOI_THUONG` | Chuỗi | 10 |  |
| 89 | Kết quả khám thính lực tai phải (nói thầm) | `TAI_PHAI_NOI_THAM` | Chuỗi | 10 | 90 Kết quả thử âm đơn giản và đo sức nghe tai phải tần số 500 Hz (dB) TAI_PHAI_500HZ Chuỗi 10 91 Kết quả thử âm đơn giản và đo sức nghe tai trái tần số 500 Hz (dB) TAI_TRAI_500HZ Chuỗi 10 92 Kết quả thử âm đơn giản và đo sức nghe tai phải tần số 2000 Hz (dB) TAI_PHAI_2000HZ Chuỗi 10 93 Kết quả thử âm đơn giản và đo sức nghe tai trái tần số 2000 Hz (dB) TAI_TRAI_2000HZ Chuỗi 10 94 Kết quả thử âm đơn giản và đo sức nghe tai phải tần số 3000 Hz (dB) TAI_PHAI_3000HZ Chuỗi 10 95 Kết quả thử âm đơn giản và đo sức nghe tai trái tần số 3000 Hz (dB) TAI_TRAI_3000HZ Chuỗi 10 96 Kết quả thử âm đơn giản và đo sức nghe tai phải tần số 4000 Hz (dB) TAI_PHAI_4000HZ Chuỗi 10 97 Kết quả thử âm đơn giản và đo sức nghe tai trái tần số 4000 Hz (dB) TAI_TRAI_4000HZ Chuỗi 10 35 98 Kết quả thử âm đơn giản và đo sức nghe tai phải tần số 6000 Hz (dB) TAI_PHAI_6000HZ Chuỗi 10 99 Kết quả thử âm đơn giản và đo sức nghe tai trái tần số 6000 Hz (dB) TAI_TRAI_6000HZ Chuỗi 10 |
| 100 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | Xét nghiệm máu |
| 101 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 102 | Chỉ số hồng cầu | `CHI_SO_HC` | Chuỗi | 20 |  |
| 103 | Chỉ số bạch cầu | `CHI_SO_BACH_CAU` | Chuỗi | 20 |  |
| 104 | Chỉ số tiểu cầu | `CHI_SO_TIEU_CAU` | Chuỗi | 20 |  |
| 105 | Hemoglobin | `HEMOGLOBIN` | Chuỗi | 20 |  |
| 106 | Công thức BC | `CONG_THUC_BC` | Chuỗi | 255 |  |
| 107 | Thời gian Howell | `THOI_GIAN_HOWELL` | Chuỗi | 20 |  |
| 108 | Đường huyết | `GLYCEMIA` | Chuỗi | 20 |  |
| 109 | Cholesterol | `CHOLESTEROL` | Chuỗi | 20 |  |
| 110 | Triglycerid | `TRIGLYCERID` | Chuỗi | 20 |  |
| 111 | HDL | `HDL` | Chuỗi | 20 |  |
| 112 | LDL | `LDL` | Chuỗi | 20 |  |
| 113 | RPR | `RPR` | Số | 1 | Số 0: Âm tính Số 1: Dương tính Số 9: Không xét nghiệm<br>0: Âm tính<br>1: Dương tính<br>9: Không xét nghiệm |
| 114 | TPHA | `TPHA` | Số | 1 | Số 0: Âm tính Số 1: Dương tính Số 9: Không xét nghiệm<br>0: Âm tính<br>1: Dương tính<br>9: Không xét nghiệm |
| 115 | HBsAg | `HBSAG` | Số | 1 | Số 0: Âm tính Số 1: Dương tính Số 9: Không xét nghiệm<br>0: Âm tính<br>1: Dương tính<br>9: Không xét nghiệm |
| 116 | HBeAg | `HBEAG` | Số | 1 | Số 0: Âm tính Số 1: Dương tính Số 9: Không xét nghiệm<br>0: Âm tính<br>1: Dương tính<br>9: Không xét nghiệm |
| 117 | HCVAb | `HCVAB` | Số | 1 | Số 0: Âm tính Số 1: Dương tính Số 9: Không xét nghiệm 36<br>0: Âm tính<br>1: Dương tính<br>9: Không xét nghiệm |
| 118 | HAVAb | `HAVAB` | Số | 1 | Số 0: Âm tính Số 1: Dương tính Số 9: Không xét nghiệm<br>0: Âm tính<br>1: Dương tính<br>9: Không xét nghiệm |
| 119 | HIV | `HIV` | Số | 1 | Số 0: Âm tính Số 1: Dương tính Số 9: Không xét nghiệm<br>0: Âm tính<br>1: Dương tính<br>9: Không xét nghiệm |
| 120 | Xét nghiệm khác | `XN_KHAC` | Chuỗi | 255 |  |
| 121 | Nồng độ cồn trong máu | `NONG_DO_CON_MAU` | Chuỗi | 20 |  |
| 122 | Narcotic | `NUOC_TIEU_MA_TUY` | Số | 1 |  |
| 123 | Amphetamine | `NUOC_TIEU_AMPHETAMINE` | Số | 1 |  |
| 124 | Đường niệu | `NUOC_TIEU_DUONG` | Chuỗi | 20 |  |
| 125 | Protein niệu | `NUOC_TIEU_PROTEIN` | Chuỗi | 20 |  |
| 126 | Xét nghiệm nước tiểu khác | `NUOC_TIEU_KHAC` | Chuỗi | 255 |  |
| 127 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 128 | Kết quả chụp X.Quang | `KET_QUA_CHAN_DOAN_HINH_ANH` | Chuỗi | n |  |
| 129 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 130 | Kết quả điện tim | `KET_QUA_DIEN_TIM` | Chuỗi | n |  |
| 131 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 132 | Chức năng hô hấp | `CHUC_NANG_HO_HAP` | Chuỗi | n |  |
| 133 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 134 | Kết quả siêu âm ổ bụng | `KET_QUA_SIEU_AM_BUNG` | Chuỗi | n |  |
| 135 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |
| 136 | Thử nghiệm thần kinh - tâm lý | `THAN_KINH_TAM_LY` | Chuỗi | n |  |
| 137 | Khả năng chịu sóng | `KHA_NANG_CHIU_SONG` | Số | 1 | Mã "1": Tốt Mã "2": Trung bình Mã "3": Kém<br>1: Tốt<br>2: Trung bình<br>3: Kém |
| 138 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | VI Kết luận 139 Đánh giá tình trạng sức khỏe và khả năng làm việc trên biển KET_LUAN_LOAI_SUC_KHOE Số 1 Ghi kết luận loại sức khỏe của đối tượng đến khám sức khỏe Mã "0": Không đủ sức khỏe học tập/làm việc Mã "1": Đủ sức khỏe học tập/làm việc 37<br>0: Không đủ sức khỏe học tập/làm việc<br>1: Đủ sức khỏe học tập/làm việc |
| 140 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 141 | Hạn chế | `HAN_CHE` | Số | 1 | 0 = Không 1 = Có<br>1: Có |
| 142 | Nêu rõ những hạn chế | `KET_LUAN_CAC_VAN_DE_SUC_KHOE` | Chuỗi | n |  |
| 143 | Yêu cầu đeo kính | `YEU_CAU_DEO_KINH` | Số | 1 | 0 = Không 1 = Có<br>1: Có |
| 144 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 145 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `VI_TRI_LAM_VIEC` (Dropdown vị trí tàu biển)
   - `BO_PHAN_LAM_VIEC` (Dropdown bộ phận)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "ho_hap": "Bình thường",
      "tiet_nieu_sinh_duc": "Bình thường",
      "noi_khoa_tieu_hoa": "Bình thường",
      "gan_mat": "Bình thường",
      "kq_co_xuong_khop": "Bình thường",
      "than_kinh": "Bình thường",
      "kham_tai_mui_hong": "Bình thường",
      "kham_mat": "Bình thường",
      "gan_co_kinh_mat_phai": "Bình thường",
      "gan_co_kinh_mat_trai": "Bình thường",
      "kham_mat_thi_truong_phai": "Bình thường",
      "kham_mat_thi_truong_trai": "Bình thường",
      "kham_mat_thi_giac_mau": "Bình thường",
      "chuc_nang_ho_hap": "Bình thường",
      "than_kinh_tam_ly": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_5_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_5_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <GIOI_TINH>1</GIOI_TINH>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <QUOC_TICH>Sample</QUOC_TICH>
        <SO_CCCD>038095012345</SO_CCCD>
        <NGAYCAP_CCCD>2026-06-03</NGAYCAP_CCCD>
        <NOICAP_CCCD>Sample</NOICAP_CCCD>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
        <CHUC_DANH_TREN_TAU>Sample</CHUC_DANH_TREN_TAU>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
        <CHI_SO_BMI>20.7</CHI_SO_BMI>
        <MACH>80</MACH>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <NOI_KHOA_TIEU_HOA>Bình thường</NOI_KHOA_TIEU_HOA>
        <GAN_MAT>Bình thường</GAN_MAT>
        <MA_BENH_NGOAI_KHOA>Bình thường</MA_BENH_NGOAI_KHOA>
        <KHAM_TAI_MUI_HONG>Bình thường</KHAM_TAI_MUI_HONG>
        <KHAM_MAT>Bình thường</KHAM_MAT>
        <GAN_CO_KINH_MAT_PHAI>Bình thường</GAN_CO_KINH_MAT_PHAI>
        <GAN_CO_KINH_MAT_TRAI>Bình thường</GAN_CO_KINH_MAT_TRAI>
        <KHAM_MAT_THI_TRUONG_PHAI>Bình thường</KHAM_MAT_THI_TRUONG_PHAI>
        <KHAM_MAT_THI_TRUONG_TRAI>Bình thường</KHAM_MAT_THI_TRUONG_TRAI>
        <KHAM_MAT_THI_GIAC_MAU>Bình thường</KHAM_MAT_THI_GIAC_MAU>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_5_KSK>
```

---

## MẪU 6: 6.  Mẫu Sổ Khám Sức Khỏe Định Kỳ Cho Trẻ 0 – Dưới 2 tháng
**Đối tượng áp dụng:** Trẻ em định kỳ từ 0 – Dưới 2 tháng

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 2 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 3 | Sinh non | `SINH_NON` | Số | 2 | 0: Không 1: Có 99: Không có thông tin<br>0: Không<br>1: Có<br>99: Không có thông tin |
| 4 | Tuần thai khi sinh | `TUAN_THAI_KHI_SINH` | Số | 2 | Ghi tuần thai khi sinh. 99: Không có thông tin<br>99: Không có thông tin |
| 5 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 6 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 7 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 8 | Nơi ở | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT 38 dữ liệu tối đa |
| 9 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 10 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 11 | Họ tên người đi cùng trẻ | `HO_TEN_NGUOI_DI_CUNG` | Chuỗi | 255 | 12 CMND / CCCD / HC / Định danh công dân người đi cùng trẻ SO_CCCD_NGUOI_DI_CUNG Chuỗi n |
| 13 | Mối quan hệ với trẻ | `MOI_QUAN_HE_VOI_TRE` | Số | 1 | 1=Cha, 2=Mẹ, 3=Ông/Bà, 4=Anh/Chị, 5=Họ hàng, 9=Khác<br>9: Khác |
| 14 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 15 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân tộc<br>7: Người sống tại vùng có điều kiện kinh<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm non<br>11: Học sinh trong các cơ sở giáo dục phổ<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 16 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác 39 dữ liệu tối đa II Thông tin chung về cơ sở khám sức khỏe<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 17 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 18 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 19 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 20 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT III Tiền sử mẹ |
| 21 | PARA (số lần sinh) | `PARA` | Chuỗi | 10 |  |
| 22 | Bất thường trong thai kỳ trước | `BAT_THUONG_THAI_KY_TRUOC` | Chuỗi | 1024 |  |
| 23 | Bệnh lý trong thai kỳ | `BENH_LY_TRONG_THAI_KY` | Chuỗi | 1024 |  |
| 24 | Thuốc uống trong lúc mang thai | `THUOC_UONG_TRONG_THAI_KY` | Chuỗi | 1024 |  |
| 25 | Bệnh lý mẹ sàng lọc trước sinh | `BENH_LY_ME_SANG_LOC_TRUOC_SINH` | Chuỗi | 1024 | IV Tiền sử của trẻ |
| 26 | Kiểu sinh | `KIEU_SINH` | Số | 1 | Ghi thông tin về kiểu sinh theo mã: Mã “1”: Sinh thường Mã “2”: Sinh mổ<br>1: Sinh thường<br>2: Sinh mổ |
| 27 | Tình trạng của trẻ sau sinh | `TINH_TRANG_TRE_SAU_SINH` | Số | 1 | 1=Da kề da và nằm với mẹ đến khi ra viện, 2=Điều trị tại Khoa sơ sinh<br>2: Điều trị tại Khoa sơ sinh |
| 28 | Bệnh lý của trẻ sau sinh | `BENH_LY_TRE_SAU_SINH` | Chuỗi | 1024 | Ghi rõ bệnh lý của trẻ sau sinh (nếu có) |
| 29 | Sàng lọc sơ sinh | `SANG_LOC_SO_SINH` | Số | 2 | Ghi thông tin về sàng lọc sơ sinh theo mã: Mã “1”: Máu gót chân Mã “2”: Thính lực Mã "3": Tim bẩm sinh Mã “99”: Không có thông tin<br>1: Máu gót chân<br>2: Thính lực<br>3: Tim bẩm sinh<br>99: Không có thông tin |
| 30 | Dinh dưỡng | `DINH_DUONG` | Số | 1 | 1=Bú mẹ hoàn toàn, 2=Bú mẹ + sữa công thức, 3=Sữa công thức hoàn toàn 40 dữ liệu tối đa<br>3: Sữa công thức hoàn toàn |
| 31 | Tiền sử tiếp xúc với người bệnh lao | `TIEN_SU_TIEP_XUC_LAO` | Số | 1 | Đối tượng có tiếp xúc với người bệnh lao không? Mã “0”: Không Mã “1”: Có V Đánh giá dấu hiệu sinh tồn<br>0: Không<br>1: Có |
| 32 | Nhiệt độ (°C) | `NHIET_DO` | Chuỗi | 10 | Ghi nhiệt độ của trẻ tính theo độ C |
| 33 | Đánh giá dấu hiệu sinh tồn qua nhiệt độ | `DGDHST_NHIET_DO` | Số | 1 | Mã 1: Bình thường Mã 2: Sốt Mã 3: Hạ thân nhiệt<br>1: Bình thường<br>2: Sốt<br>3: Hạ thân nhiệt |
| 34 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 | Ghi mạch (nhịp tim) của đối tượng đến khám sức khỏe, theo định dạng "số - số". |
| 35 | Đánh giá dấu hiệu sinh tồn qua mạch | `DGDHST_MACH` | Số | 1 | Mã 1: Bình thường Mã 2: Nhanh<br>1: Bình thường<br>2: Nhanh |
| 36 | Nhịp thở (lần/phút) | `NHIP_THO` | Chuỗi | 10 |  |
| 37 | Đánh giá dấu hiệu sinh tồn qua nhịp thở | `DGDHST_NHIP_THO` | Số | 1 | Mã 1: Bình thường Mã 2: Thở nhanh Mã 3: Thở chậm VI Đánh giá dinh dưỡng<br>1: Bình thường<br>2: Thở nhanh<br>3: Thở chậm |
| 38 | Chiều dài (cm) | `CHIEU_DAI` | Số | 10 |  |
| 39 | Chiều dài / Tuổi (SD) | `CHIEU_DAI_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD chiều dài theo tuổi |
| 40 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 41 | Cân nặng / Tuổi (SD) | `CAN_NANG_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD cân nặng theo tuổi |
| 42 | Vòng đầu (cm) | `VONG_DAU` | Số | 10 |  |
| 43 | Đánh giá vòng đầu | `DG_VONG_DAU` | Số | 1 | Mã 1: Bình thường Mã 2: Đầu to Mã 3: Đầu nhỏ VII Đánh giá phát triển tinh thần - vận động<br>1: Bình thường<br>2: Đầu to<br>3: Đầu nhỏ |
| 44 | Vận động tay chân đồng đều 2 bên khi nằm | `VAN_DONG_TAY_CHAN_DONG_DEU` | Số | 1 | 1=Có, 0=Không 45 Trẻ quay đầu hướng về âm thanh như tiếng chuông, tiếng nhạc, lời nói của bố mẹ QUAY_DAU_HUONG_AM_THANH Số 1 1=Có, 0=Không 41 dữ liệu tối đa<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 46 | Bắt đầu có thể phát ra tiếng ê, a, gừ | `PHAT_RA_TIENG_E_A_GU` | Số | 1 | 1=Có, 0=Không 47 Nhìn theo khuôn mặt của bố/mẹ/người chăm sóc với khoảng cách 30cm NHIN_THEO_KHUON_MAT_30CM Số 1 1=Có, 0=Không VIII Đánh giá tiêm chủng<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 48 | Viêm gan B mũi 1 (sơ sinh) | `TIEM_CHUNG_VGB_SS_MUI1` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 49 | Lao (BCG) sơ sinh | `TIEM_CHUNG_BCG_SS` | Số | 1 | 1=Có, 0=Không |
| 50 | Tư vấn tiêm chủng | `TU_VAN_TIEM_CHUNG` | Chuỗi | n | IX Khám lâm sàng A Toàn trạng |
| 51 | Trẻ mở mắt tự nhiên | `MO_MAT_TU_NHIEN` | Số | 1 | 1=Có, 0=Không |
| 52 | Màu sắc da | `MAU_SAC_DA` | Số | 1 | 1=Hồng hào, 2=Nhợt, 3=Tím, 4=Vàng, 5=Sạm da |
| 53 | Sang thương da | `SANG_THUONG_DA` | Số | 1 | 0=Không, 1=Xuất huyết, 2=Bóng nước, 9=Khác |
| 54 | Mô tả sang thương da | `MO_TA_SANG_THUONG_DA` | Chuỗi | n | B Đầu - Cổ |
| 55 | Thóp | `THOP` | Số | 1 | 1=Bình thường, 2=Rộng, 3=Hẹp, 4=Thóp phồng |
| 56 | Hình dạng đầu | `HINH_DANG_DAU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 57 | Vận động cổ | `VAN_DONG_CO` | Số | 1 | 1=Bình thường, 2=Giới hạn |
| 58 | Khối bất thường ở đầu - cổ | `KHOI_BAT_THUONG_DAU_CO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 59 | Mô tả khối bất thường đầu - cổ | `MO_TA_KHOI_BAT_THUONG_DAU_CO` | Chuỗi | n | C Mắt |
| 60 | Vị trí 2 mắt | `VI_TRI_HAI_MAT` | Số | 1 | 1=Bình thường, 2=Hai mắt xa nhau |
| 61 | Mí mắt và kết mạc | `MI_MAT_KET_MAC` | Số | 1 | 1=Bình thường, 2=Sưng/đỏ, 3=Chảy ghèn/mủ |
| 62 | Đồng tử (kích thước, phản xạ) | `DONG_TU` | Số | 1 | 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình thường |
| 63 | Phản xạ Red reflex | `PHAN_XA_RED_REFLEX` | Số | 1 | 1=Bình thường, 2=Bất thường bên phải, 3=Bất thường bên trái |
| 64 | Mô tả bất thường mắt | `MO_TA_BAT_THUONG_MAT` | Chuỗi | n | D Tai 42 dữ liệu tối đa |
| 65 | Vị trí tai | `VI_TRI_TAI` | Số | 1 | 1=Bình thường, 2=Tai đóng thấp |
| 66 | Số lượng tai | `SO_LUONG_TAI` | Số | 1 | 1=Đủ 2 bên, 0=Bất thường |
| 67 | Tai bất thường bên | `TAI_BAT_THUONG_BEN` | Chuỗi | 10 | Ghi bên tai bất thường: Trái / Phải |
| 68 | Khối sưng sau tai | `KHOI_SUNG_SAU_TAI` | Số | 1 | 1=Có, 0=Không |
| 69 | Chảy mủ / nước tai | `CHAY_MU_NUOC_TAI` | Số | 1 | 1=Có, 0=Không |
| 70 | Mô tả bất thường tai | `MO_TA_BAT_THUONG_TAI` | Chuỗi | n | E Mũi |
| 71 | Hình dạng mũi | `HINH_DANG_MUI` | Số | 1 | 1=Bình thường, 2=Mũi to/dày, 3=Bất sản xương mũi F Miệng |
| 72 | Hình dạng miệng | `HINH_DANG_MIENG` | Số | 1 | 1=Bình thường, 2=Sứt môi/chẻ vòm |
| 73 | Răng sữa sơ sinh | `RANG_SUA_SO_SINH` | Số | 1 | 1=Có, 0=Không |
| 74 | Hình dạng lưỡi | `HINH_DANG_LUOI` | Số | 1 | 1=Bình thường, 2=Lưỡi to bè |
| 75 | Dính thắng lưỡi | `DINH_THANG_LUOI` | Số | 1 | 1=Có, 0=Không |
| 76 | Nấm miệng | `NAM_MIENG` | Số | 1 | 1=Có, 0=Không |
| 77 | Cằm nhỏ tụt về sau | `CAM_NHO_TUT_VE_SAU` | Số | 1 | 1=Có, 0=Không |
| 78 | Mô tả bất thường miệng | `MO_TA_BAT_THUONG_MIENG` | Chuỗi | n | G Hô hấp |
| 79 | Nhịp thở không đều / cơn ngưng thở | `NHIP_THO_KHONG_DEU_NGUNG_THO` | Số | 1 | Có nhịp thở không đều hoặc cơn ngưng thở >5 giây. 1=Có, 0=Không<br>1: Có, 0=Không |
| 80 | Thở rút lõm lồng ngực | `THO_RUT_LOM_LONG_NGUC` | Số | 1 | 1=Có, 0=Không |
| 81 | Tiếng thở bất thường | `TIENG_THO_BAT_THUONG` | Số | 1 | 1=Có, 0=Không |
| 82 | Nghe phổi | `NGHE_PHOI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 83 | Mô tả bất thường hô hấp | `MO_TA_BAT_THUONG_HO_HAP` | Chuỗi | n | H Tim mạch |
| 84 | SpO2 (%) | `SPO2` | Chuỗi | 10 | Đo độ bão hòa oxy (SpO2). Kết quả: Bình thường / Dưới 95% |
| 85 | Vị trí mỏm tim | `VI_TRI_MOM_TIM` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 86 | Ổ đập bất thường | `O_DAP_BAT_THUONG` | Số | 1 | 1=Có, 0=Không |
| 87 | Mạch ngoại vi (mạch quay - bẹn) | `MACH_NGOAI_VI` | Số | 1 | 1=Bắt rõ, 2=Mạch nhẹ, 3=Không bắt được 43 dữ liệu tối đa<br>1: Bắt rõ, 2=Mạch nhẹ, 3=Không bắt được |
| 88 | Tiếng tim | `TIENG_TIM` | Số | 1 | 1=Đều/rõ/không âm thổi, 2=Không đều, 3=Tiếng tim bất thường, 4=Âm thổi, 5=Rung miêu<br>1: Đều/rõ/không âm thổi, 2=Không đều,<br>3: Tiếng tim bất thường, 4=Âm thổi, 5=Rung |
| 89 | Mô tả bất thường tim mạch | `MO_TA_BAT_THUONG_TIM_MACH` | Chuỗi | n | I Bụng và cơ quan sinh dục |
| 90 | Hình dáng bụng và rốn | `HINH_DANG_BUNG_RON` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 91 | Gan lách to | `GAN_LACH_TO` | Số | 1 | 1=Có, 0=Không |
| 92 | Khối bất thường ở bụng | `KHOI_BAT_THUONG_BUNG` | Số | 1 | 1=Có, 0=Không |
| 93 | Lỗ hậu môn | `LO_HAU_MON` | Số | 1 | 1=Có (bình thường), 0=Không (bất thường) |
| 94 | Cơ quan sinh dục nam | `CO_QUAN_SINH_DUC_NAM` | Số | 1 | Bất thường: thoát vị bẹn / tinh hoàn ẩn / lỗ tiểu đóng thấp. 1=Có, 0=Không<br>1: Có, 0=Không |
| 95 | Cơ quan sinh dục nữ | `CO_QUAN_SINH_DUC_NU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 96 | Mô tả bất thường bụng và sinh dục | `MO_TA_BAT_THUONG_BUNG_SINH_DUC` | Chuỗi | n | J Lưng và cột sống |
| 97 | Hình dạng cột sống | `HINH_DANG_COT_SONG` | Số | 1 | 1=Toàn vẹn/cân đối, 2=Hở cột sống, 3=Vẹo cột sống K Cơ xương và thần kinh |
| 98 | Vận động không đối xứng | `VAN_DONG_KHONG_DOI_XUNG` | Số | 1 | 1=Có, 0=Không |
| 99 | Phản xạ bú | `PHAN_XA_BU` | Số | 1 | 1=Có, 0=Không |
| 100 | Phản xạ nắm | `PHAN_XA_NAM` | Số | 1 | 1=Có, 0=Không |
| 101 | Phản xạ Moro | `PHAN_XA_MORO` | Số | 1 | 1=Có, 0=Không |
| 102 | Trương lực cơ | `TRUONG_LUC_CO` | Số | 1 | 1=Bình thường, 2=Tăng, 3=Giảm |
| 103 | Khớp háng | `KHOP_HANG` | Số | 1 | 1=Bình thường, 2=Trật khớp háng |
| 104 | Mô tả bất thường cơ xương - thần kinh | `MO_TA_BAT_THUONG_CO_XUONG_THAN_KINH` | Chuỗi | n | X Kết luận và tư vấn Kết luận sức khỏe |
| 105 | Bình thường | `BINH_THUONG` | Số | 1 | 1=Có, 0=Không |
| 106 | Có nguy cơ mắc lao (tiền sử tiếp xúc) | `NGUY_CO_MAC_LAO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 107 | Có vấn đề về sức khỏe | `VAN_DE_SUC_KHOE` | Số | 1 | 1=Có, 0=Không 44 dữ liệu tối đa |
| 108 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 109 | Ghi rõ vấn đề sức khỏe | `GHI_RO_VAN_DE_SUC_KHOE` | Chuỗi | n | Ghi rõ các vấn đề sức khỏe phát hiện được (nếu có) |
| 110 | Tư vấn và hẹn khám lần sau | `TU_VAN_HEN_KHAM_LAN_SAU` | Chuỗi | n | Ghi nội dung tư vấn và ngày hẹn khám lần kế tiếp cho trẻ |
| 111 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 112 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `SINH_NON` (Chọn Có/Không)
   - `TUAN_THAI_KHI_SINH` (Số tuần thai)
   - `HO_TEN_NGUOI_DI_CUNG` / `SO_CCCD_NGUOI_DI_CUNG` (Thông tin người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "tinh_trang_tre_sau_sinh": "Bình thường",
      "mo_mat_tu_nhien": "Bình thường",
      "vi_tri_hai_mat": "Bình thường",
      "mi_mat_ket_mac": "Bình thường",
      "mo_ta_bat_thuong_mat": "Bình thường",
      "rang_sua_so_sinh": "Bình thường",
      "mo_ta_bat_thuong_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_co_xuong_than_kinh": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_6_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_6_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <SINH_NON>1</SINH_NON>
        <TUAN_THAI_KHI_SINH>1</TUAN_THAI_KHI_SINH>
        <GIOI_TINH>1</GIOI_TINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
        <HO_TEN_NGUOI_DI_CUNG>Sample</HO_TEN_NGUOI_DI_CUNG>
        <MOI_QUAN_HE_VOI_TRE>1</MOI_QUAN_HE_VOI_TRE>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <MACH>80</MACH>
        <CAN_NANG>60</CAN_NANG>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <TINH_TRANG_TRE_SAU_SINH>Bình thường</TINH_TRANG_TRE_SAU_SINH>
        <MO_MAT_TU_NHIEN>Bình thường</MO_MAT_TU_NHIEN>
        <VI_TRI_HAI_MAT>Bình thường</VI_TRI_HAI_MAT>
        <MI_MAT_KET_MAC>Bình thường</MI_MAT_KET_MAC>
        <MO_TA_BAT_THUONG_MAT>Bình thường</MO_TA_BAT_THUONG_MAT>
        <RANG_SUA_SO_SINH>Bình thường</RANG_SUA_SO_SINH>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_6_KSK>
```

---

## MẪU 7: 7.  Mẫu Sổ Khám Sức Khỏe Định Kỳ Cho Trẻ 2 – 3 tháng
**Đối tượng áp dụng:** Trẻ em định kỳ từ 2 – 3 tháng

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Sinh non | `SINH_NON` | Số | 2 | 0: Không 1: Có 99: Không có thông tin<br>0: Không<br>1: Có<br>99: Không có thông tin |
| 4 | Tuần thai khi sinh | `TUAN_THAI_KHI_SINH` | Số | 2 | Ghi tuần thai khi sinh. 99: Không có thông tin<br>99: Không có thông tin |
| 5 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính 45 Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân<br>7: Người sống tại vùng có điều kiện<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm<br>11: Học sinh trong các cơ sở giáo dục<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 8 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 9 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 10 | Nơi ở | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 12 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 13 | Họ tên người đi cùng trẻ | `HO_TEN_NGUOI_DI_CUNG` | Chuỗi | 255 | 14 CMND / CCCD / HC / Định danh công dân người đi cùng trẻ SO_CCCD_NGUOI_DI_CUNG Chuỗi n Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 15 | Mối quan hệ với trẻ | `MOI_QUAN_HE_VOI_TRE` | Số | 1 | 1=Cha, 2=Mẹ, 3=Ông/Bà, 4=Anh/Chị, 5=Họ hàng, 9=Khác<br>1: Cha, 2=Mẹ, 3=Ông/Bà, 4=Anh/Chị, 5=Họ<br>9: Khác |
| 16 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT A Tiền sử |
| 17 | Tên bệnh tiền sử bản thân | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. 46 Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 18 | Tên bệnh cụ thể khi trong gia đình có người mắc | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 19 | Tiền sử tiếp xúc với người bệnh lao | `TIEN_SU_TIEP_XUC_LAO` | Số | 1 | 1=Có, 0=Không II Thông tin chung về cơ sở khám sức khỏe<br>1: Có, 0=Không |
| 20 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 21 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. |
| 22 | Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN | `MA_GTIN_CSKCB` | Chuỗi | 13 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 23 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Đánh giá dấu hiệu sinh tồn |
| 24 | Nhiệt độ (°C) | `NHIET_DO` | Chuỗi | 10 | Ghi nhiệt độ của trẻ tính theo độ C |
| 25 | Đánh giá dấu hiệu sinh tồn qua nhiệt độ | `DGDHST_NHIET_DO` | Số | 1 | Mã 0: Không bình thường Mã 1: Bình thường<br>0: Không bình thường<br>1: Bình thường |
| 26 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 | Ghi mạch (nhịp tim) của đối tượng đến khám sức khỏe, theo định dạng "số - số". |
| 27 | Đánh giá dấu hiệu sinh tồn qua mạch | `DGDHST_MACH` | Số | 1 | Mã 0: Không bình thường Mã 1: Bình thường<br>0: Không bình thường<br>1: Bình thường |
| 28 | Nhịp thở (lần/phút) | `NHIP_THO` | Chuỗi | 10 |  |
| 29 | Đánh giá dấu hiệu sinh tồn qua nhịp thở | `DGDHST_NHIP_THO` | Số | 1 | Mã 0: Không bình thường Mã 1: Bình thường IV Đánh giá dinh dưỡng<br>0: Không bình thường<br>1: Bình thường |
| 30 | Chiều dài (cm) | `CHIEU_DAI` | Số | 10 | Ghi chiều dài của trẻ (cm) |
| 31 | Chiều dài / Tuổi (SD) | `CHIEU_DAI_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD chiều dài theo tuổi 47 |
| 32 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 | Ghi cân nặng của đối tượng đến khám sức khỏe (kg) |
| 33 | Cân nặng / Tuổi (SD) | `CAN_NANG_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD cân nặng theo tuổi |
| 34 | Chu vi vòng cánh tay (mm) | `CHU_VI_VONG_CANH_TAY` | Số | 10 | Ghi chu vi vòng cánh tay giữa của trẻ (mm) — chỉ số phát hiện suy dinh dưỡng cấp |
| 35 | Vòng đầu (cm) | `VONG_DAU` | Số | 10 | Ghi chu vi vòng đầu của trẻ (cm) |
| 36 | Phù dinh dưỡng | `PHU_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 37 | Dấu hiệu thiếu máu | `DAU_HIEU_THIEU_MAU` | Số | 1 | 1=Có, 0=Không |
| 38 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG` | Số | 1 | 1=Có, 0=Không |
| 39 | Suy dinh dưỡng | `SUY_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 40 | Thừa cân / béo phì | `THUA_CAN_BEO_PHI` | Số | 1 | 1=Có, 0=Không V Đánh giá phát triển tinh thần - vận động 41 Phát ra tiếng khàn khàn, gừ gừ PHAT_RA_TIENG_KHAN_GU Số 1 1=Có, 0=Không<br>1: Có, 0=Không |
| 42 | Cười mỉm | `CUOI_MIM` | Số | 1 | 1=Có, 0=Không |
| 43 | Nhấc được đầu khi nằm sấp | `NHAC_DAU_KHI_NAM_SAP` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 44 | Ngoan / yên khi được vỗ về, hát ru, đung đưa | `NGOAN_KHI_DUOC_VO_VE` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 45 | Mắt nhìn theo đồ vật chuyển động | `MAT_NHIN_THEO_DO_VAT` | Số | 1 | 1=Có, 0=Không VI Đánh giá tiêm chủng<br>1: Có, 0=Không |
| 46 | Viêm gan B mũi 1 (sơ sinh) | `TIEM_CHUNG_VGB_SS_MUI1` | Số | 1 | 1=Có, 0=Không |
| 47 | Lao (BCG) sơ sinh | `TIEM_CHUNG_BCG_SS` | Số | 1 | 1=Có, 0=Không 48 Bạch hầu - Ho gà - Uốn ván - Viêm gan B - Hib mũi 1 (5 trong 1) TIEM_CHUNG_5_TRONG_1_MUI1 Số 1 1=Có, 0=Không<br>1: Có, 0=Không |
| 49 | Uống vắc xin bại liệt lần 1 | `UONG_VAC_XIN_BAI_LIET_LAN1` | Số | 1 | 1=Có, 0=Không |
| 50 | Tư vấn tiêm chủng | `TU_VAN_TIEM_CHUNG` | Chuỗi | n | Ghi nội dung tư vấn về tiêm chủng cho người đi cùng trẻ (nếu có) VII Khám lâm sàng A Da |
| 51 | Lòng bàn tay | `LONG_BAN_TAY` | Số | 1 | 1=Không nhợt (bình thường), 2=Nhợt |
| 52 | Các lỗ rò trên da | `LO_RO_TREN_DA` | Số | 1 | Rò luân nhĩ (trước tai), rò xoang bì (vùng cùng cụt / dọc cột sống). 1=Có, 0=Không<br>1: Có, 0=Không |
| 53 | Vàng da kéo dài | `VANG_DA_KEO_DAI` | Số | 1 | 1=Có, 0=Không 48 |
| 54 | Mô tả bất thường da | `MO_TA_BAT_THUONG_DA` | Chuỗi | n | Ghi mô tả bất thường về da (nếu có) B Đầu - Cổ |
| 55 | Thóp | `THOP` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 56 | Kích thước và hình dạng đầu | `KICH_THUOC_HINH_DANG_DAU` | Số | 1 | 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình thường |
| 57 | Khối bất thường vùng đầu - cổ | `KHOI_BAT_THUONG_DAU_CO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 58 | Mô tả khối bất thường đầu - cổ | `MO_TA_KHOI_BAT_THUONG_DAU_CO` | Chuỗi | n | Ghi mô tả khối bất thường (nếu có) C Mắt KHAM_MAT |
| 59 | Mí mắt và kết mạc | `MI_MAT_KET_MAC` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 60 | Rung giật nhãn cầu / lác / vận động mắt bất thường | `RUNG_GIAT_NHAN_CAU_LAC` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 61 | Đồng tử (kích thước, phản xạ) | `DONG_TU` | Số | 1 | 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình thường |
| 62 | Mô tả bất thường mắt | `MO_TA_BAT_THUONG_MAT` | Chuỗi | n | Ghi mô tả bất thường vùng mắt (nếu có) D Tai |
| 63 | Đáp ứng với âm thanh | `DAP_UNG_AM_THANH` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 64 | Khối sưng sau tai | `KHOI_SUNG_SAU_TAI` | Số | 1 | 1=Có, 0=Không |
| 65 | Chảy mủ / nước tai | `CHAY_MU_NUOC_TAI` | Số | 1 | 1=Có, 0=Không |
| 66 | Mô tả bất thường tai | `MO_TA_BAT_THUONG_TAI` | Chuỗi | n | Ghi mô tả bất thường vùng tai (nếu có) E Miệng |
| 67 | Khám miệng | `KHAM_MIENG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 68 | Mô tả bất thường miệng | `MO_TA_BAT_THUONG_MIENG` | Chuỗi | 1024 | Ghi mô tả bất thường vùng miệng (nếu có) F Hô hấp |
| 69 | Dấu hiệu suy hô hấp | `DAU_HIEU_SUY_HO_HAP` | Số | 1 | 1=Có, 0=Không |
| 70 | Tiếng thở bất thường | `TIENG_THO_BAT_THUONG` | Số | 1 | 1=Có, 0=Không |
| 71 | Nghe phổi | `NGHE_PHOI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 72 | Mô tả bất thường hô hấp | `MO_TA_BAT_THUONG_HO_HAP` | Chuỗi | n | Ghi mô tả bất thường khi khám hô hấp (nếu có) G Tim mạch |
| 73 | Vị trí mỏm tim | `VI_TRI_MOM_TIM` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 74 | Mạch ngoại vi (mạch quay - bẹn) | `MACH_NGOAI_VI` | Số | 1 | 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình thường |
| 75 | Nghe tim (rối loạn nhịp tim, tiếng thổi) | `NGHE_TIM` | Số | 1 | 1=Có bất thường, 0=Không 49<br>1: Có bất thường, 0=Không |
| 76 | Mô tả bất thường tim mạch | `MO_TA_BAT_THUONG_TIM_MACH` | Chuỗi | n | Ghi mô tả bất thường khi khám tim mạch (nếu có) H Bụng và cơ quan sinh dục |
| 77 | Hình dáng bụng và rốn | `HINH_DANG_BUNG_RON` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 78 | Gan lách to | `GAN_LACH_TO` | Số | 1 | 1=Có, 0=Không |
| 79 | Khối bất thường ở bụng | `KHOI_BAT_THUONG_BUNG` | Số | 1 | 1=Có, 0=Không |
| 80 | Cơ quan sinh dục nam | `CO_QUAN_SINH_DUC_NAM` | Số | 1 | Bất thường: thoát vị bẹn / tinh hoàn ẩn. 1=Có, 0=Không<br>ng: thoát vị bẹn / tinh hoàn ẩn. 1=Có,<br>0: Không |
| 81 | Cơ quan sinh dục nữ | `CO_QUAN_SINH_DUC_NU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 82 | Mô tả bất thường bụng và sinh dục | `MO_TA_BAT_THUONG_BUNG_SINH_DUC` | Chuỗi | n | Ghi mô tả bất thường (nếu có) I Cơ xương và thần kinh |
| 83 | Vận động không đối xứng | `VAN_DONG_KHONG_DOI_XUNG` | Số | 1 | 1=Có, 0=Không |
| 84 | Phản xạ cơ | `PHAN_XA_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 85 | Trương lực cơ bất thường | `TRUONG_LUC_CO_BAT_THUONG` | Số | 1 | 1=Có, 0=Không |
| 86 | Khớp háng | `KHOP_HANG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 87 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG_LAM_SANG` | Số | 1 | 1=Có, 0=Không |
| 88 | Mô tả bất thường cơ xương - thần kinh | `MO_TA_BAT_THUONG_CO_XUONG_THAN_KINH` | Chuỗi | n | Ghi mô tả bất thường (nếu có) VIII Kết luận và tư vấn Kết luận sức khỏe |
| 89 | Bình thường | `BINH_THUONG` | Số | 1 | 1=Có, 0=Không |
| 90 | Có nguy cơ mắc lao (tiền sử tiếp xúc) | `NGUY_CO_MAC_LAO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 91 | Có vấn đề về sức khỏe | `VAN_DE_SUC_KHOE` | Số | 1 | 1=Có, 0=Không |
| 92 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 93 | Ghi rõ vấn đề sức khỏe | `GHI_RO_VAN_DE_SUC_KHOE` | Chuỗi | n | Ghi rõ các vấn đề sức khỏe phát hiện được (nếu có) |
| 94 | Tư vấn và hẹn khám lần sau | `TU_VAN_HEN_KHAM_LAN_SAU` | Chuỗi | n | Ghi nội dung tư vấn và ngày hẹn khám lần kế tiếp cho trẻ |
| 95 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 96 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n | 50 |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `SINH_NON` (Chọn Có/Không)
   - `TUAN_THAI_KHI_SINH` (Số tuần thai)
   - `HO_TEN_NGUOI_DI_CUNG` / `SO_CCCD_NGUOI_DI_CUNG` (Thông tin người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "mat_nhin_theo_do_vat": "Bình thường",
      "mi_mat_ket_mac": "Bình thường",
      "mo_ta_bat_thuong_mat": "Bình thường",
      "dau_hieu_suy_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_co_xuong_than_kinh": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_7_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_7_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <SINH_NON>1</SINH_NON>
        <TUAN_THAI_KHI_SINH>1</TUAN_THAI_KHI_SINH>
        <GIOI_TINH>1</GIOI_TINH>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
        <TSBT_MA_BENH>0</TSBT_MA_BENH>
        <TSGD_MA_BENH>0</TSGD_MA_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <MACH>80</MACH>
        <CAN_NANG>60</CAN_NANG>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <MAT_NHIN_THEO_DO_VAT>Bình thường</MAT_NHIN_THEO_DO_VAT>
        <MI_MAT_KET_MAC>Bình thường</MI_MAT_KET_MAC>
        <MO_TA_BAT_THUONG_MAT>Bình thường</MO_TA_BAT_THUONG_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_7_KSK>
```

---

## MẪU 8: 8.  Mẫu Sổ Khám Sức Khỏe Định Kỳ Cho Trẻ 4 – 6 tháng
**Đối tượng áp dụng:** Trẻ em định kỳ từ 4 – 6 tháng

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Sinh non | `SINH_NON` | Số | 2 | 0: Không 1: Có 99: Không có thông tin<br>0: Không<br>1: Có<br>99: Không có thông tin |
| 4 | Tuần thai khi sinh | `TUAN_THAI_KHI_SINH` | Số | 2 | Ghi tuần thai khi sinh. 99: Không có thông tin<br>99: Không có thông tin |
| 5 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 8 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên 51 Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân<br>7: Người sống tại vùng có điều kiện<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm<br>11: Học sinh trong các cơ sở giáo dục<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 9 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 10 | Nơi ở | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 12 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 13 | Họ tên người đi cùng trẻ | `HO_TEN_NGUOI_DI_CUNG` | Chuỗi | 255 | 14 CMND / CCCD / HC / Định danh công dân người đi cùng trẻ SO_CCCD_NGUOI_DI_CUNG Chuỗi n |
| 15 | Mối quan hệ với trẻ | `MOI_QUAN_HE_VOI_TRE` | Số | 1 | 1=Cha, 2=Mẹ, 3=Ông/Bà, 4=Anh/Chị, 5=Họ hàng, 9=Khác<br>9: Khác |
| 16 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT A Tiền sử |
| 17 | Tên bệnh tiền sử bản thân | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 18 | Tên bệnh cụ thể khi trong gia đình có người mắc | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 19 | Tiền sử tiếp xúc với người bệnh lao | `TIEN_SU_TIEP_XUC_LAO` | Số | 1 | 1=Có, 0=Không II Thông tin chung về cơ sở khám sức khỏe 52<br>1: Có, 0=Không |
| 20 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 21 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. |
| 22 | Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN | `MA_GTIN_CSKCB` | Chuỗi | 13 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 23 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Đánh giá dấu hiệu sinh tồn |
| 24 | Nhiệt độ (°C) | `NHIET_DO` | Chuỗi | 10 | Ghi nhiệt độ của trẻ tính theo độ C |
| 25 | Đánh giá dấu hiệu sinh tồn qua nhiệt độ | `DGDHST_NHIET_DO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 26 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 | Ghi mạch (nhịp tim) của đối tượng đến khám sức khỏe, theo định dạng "số - số". |
| 27 | Đánh giá dấu hiệu sinh tồn qua mạch | `DGDHST_MACH` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 28 | Nhịp thở | `NHIP_THO` | Chuỗi | 10 | Ghi nhịp thở (lần/phút) |
| 29 | Đánh giá dấu hiệu sinh tồn qua nhịp thở | `DGDHST_NHIP_THO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường IV Đánh giá dinh dưỡng<br>1: Bình thường<br>2: Không bình thường |
| 30 | Chiều dài (cm) | `CHIEU_DAI` | Số | 10 | Ghi chiều dài của trẻ (cm) |
| 31 | Chiều dài / Tuổi (SD) | `CHIEU_DAI_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD chiều dài theo tuổi |
| 32 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 | Ghi cân nặng của đối tượng đến khám sức khỏe (kg) |
| 33 | Cân nặng / Tuổi (SD) | `CAN_NANG_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD cân nặng theo tuổi |
| 34 | Chu vi vòng cánh tay (mm) | `CHU_VI_VONG_CANH_TAY` | Số | 10 |  |
| 35 | Vòng đầu (cm) | `VONG_DAU` | Số | 10 |  |
| 36 | Phù dinh dưỡng | `PHU_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 37 | Dấu hiệu thiếu máu | `DAU_HIEU_THIEU_MAU` | Số | 1 | 1=Có, 0=Không |
| 38 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG` | Số | 1 | 1=Có, 0=Không |
| 39 | Suy dinh dưỡng | `SUY_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 40 | Thừa cân / béo phì | `THUA_CAN_BEO_PHI` | Số | 1 | 1=Có, 0=Không V Đánh giá phát triển tinh thần - vận động 53 |
| 41 | Mắt nhìn theo đồ chơi/người di chuyển | `NHIN_THEO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 42 | Biểu hiện thích thú với mọi người | `BIEU_HIEN_THICH_THU` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 43 | Cười/mỉm cười thể hiện sự thích thú | `CUOI_MIM_CUOI` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 44 | Phát ra âm thanh khi vui/không thoải mái | `PHAT_AM_THANH` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 45 | Giữ đầu thẳng khi đỡ ngực/tư thế ngồi | `GIU_DAU_THANG` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 46 | Quay đầu về phía âm thanh/tiếng cha mẹ | `QUAY_DAU_HUONG_AM_THANH` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 47 | Phát âm thanh khi có người nói chuyện | `PHAT_AM_THANH_KHI_NOI` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 48 | Nhìn đồ vật/đưa tay về phía đồ vật | `NHIN_DO_VAT` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 49 | Cầm nắm được đồ vật | `CAM_NAM_DO_VAT` | Số | 1 | 1=Có, 0=Không |
| 50 | Ngồi khi được giữ | `NGOI_KHI_DUOC_GIU` | Số | 1 | 1=Có, 0=Không |
| 51 | Biết lẫy | `BIET_LAY` | Số | 1 | 1=Có, 0=Không VI Đánh giá tiêm chủng |
| 52 | Viêm gan B mũi 1 (sơ sinh) | `TIEM_CHUNG_VGB_SS_MUI1` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 53 | Lao BCG (sơ sinh) | `TIEM_CHUNG_BCG_SS` | Số | 1 | 1=Có, 0=Không |
| 54 | Vắc xin 5 trong 1 mũi 1 | `TIEM_CHUNG_5IN1_MUI1` | Số | 1 | 1=Có, 0=Không |
| 55 | Vắc xin 5 trong 1 mũi 2 | `TIEM_CHUNG_5IN1_MUI2` | Số | 1 | 1=Có, 0=Không |
| 56 | Vắc xin 5 trong 1 mũi 3 | `TIEM_CHUNG_5IN1_MUI3` | Số | 1 | 1=Có, 0=Không |
| 57 | Uống vắc xin bại liệt lần 1 | `TIEM_CHUNG_BAI_LIET_L1` | Số | 1 | 1=Có, 0=Không |
| 58 | Uống vắc xin bại liệt lần 2 | `TIEM_CHUNG_BAI_LIET_L2` | Số | 1 | 1=Có, 0=Không |
| 59 | Uống vắc xin bại liệt lần 3 | `TIEM_CHUNG_BAI_LIET_L3` | Số | 1 | 1=Có, 0=Không |
| 60 | Tiêm vắc xin bại liệt IPV | `TIEM_CHUNG_BAI_LIET_IPV` | Số | 1 | 1=Có, 0=Không |
| 61 | Tư vấn tiêm chủng | `TU_VAN_TIEM_CHUNG` | Chuỗi | n | VII Khám lâm sàng A Da |
| 62 | Màu sắc da | `MAU_SAC_DA` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 63 | Lòng bàn tay | `LONG_BAN_TAY` | Số | 1 | 1=Bình thường (không nhợt), 0=Không bình thường (Nhợt)<br>1: Bình thường (không nhợt), 0=Không bình |
| 64 | Mô tả bất thường da | `MO_TA_BAT_THUONG_DA` | Chuỗi | n | 54 B Đầu - cổ B.1 Khám đầu - cổ |
| 65 | Thóp | `THOP` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 66 | Kích thước và hình dạng đầu | `HINH_DANG_DAU` | Số | 1 | 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình thường |
| 67 | Khối bất thường đầu cổ | `KHOI_BAT_THUONG_DAU_CO` | Số | 1 | 0=Không, 1=Có |
| 68 | Mô tả khối bất thường đầu cổ | `MO_TA_KHOI_BAT_THUONG_DAU_CO` | Chuỗi | n | B.2 Khám mắt |
| 69 | Mí mắt và kết mạc | `MI_MAT_KET_MAC` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 70 | Rung giật nhãn cầu/lác/vận động mắt | `KHAM_MAT` | Số | 1 | 0=Không, 1=Có bất thường<br>0: Không, 1=Có bất thường |
| 71 | Đồng tử | `DONG_TU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 72 | Mô tả bất thường mắt | `MO_TA_BAT_THUONG_MAT` | Chuỗi | n | B.3 Khám tai |
| 73 | Màng nhĩ | `MANG_NHI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 74 | Đáp ứng với âm thanh | `DAP_UNG_AM_THANH` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 75 | Khối sưng sau tai | `KHOI_SUNG_SAU_TAI` | Số | 1 | 0=Không, 1=Có |
| 76 | Chảy mủ/nước tai | `CHAY_MU_NUOC_TAI` | Số | 1 | 0=Không, 1=Có |
| 77 | Mô tả bất thường tai | `MO_TA_BAT_THUONG_TAI` | Chuỗi | n | B.4 Khám miệng |
| 78 | Khám miệng | `HINH_DANG_MIENG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 79 | Mô tả bất thường miệng | `MO_TA_BAT_THUONG_MIENG` | Chuỗi | n | B.5 Hô hấp |
| 80 | Dấu hiệu suy hô hấp | `SUY_HO_HAP` | Số | 1 | 0=Không, 1=Có |
| 81 | Tiếng thở bất thường | `TIENG_THO_BAT_THUONG` | Số | 1 | 0=Không, 1=Có |
| 82 | Nghe phổi | `NGHE_PHOI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 83 | Mô tả bất thường hô hấp | `MO_TA_BAT_THUONG_HO_HAP` | Chuỗi | n | B.6 Tim mạch |
| 84 | Vị trí mỏm tim | `VI_TRI_MOM_TIM` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 85 | Mạch ngoại vi | `MACH_NGOAI_VI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 86 | Nghe tim | `TIENG_TIM` | Số | 1 | 0=Không bất thường, 1=Có bất thường |
| 87 | Mô tả bất thường tim mạch | `MO_TA_BAT_THUONG_TIM_MACH` | Chuỗi | n | B.7 Bụng và cơ quan sinh dục |
| 88 | Hình dáng bụng, rốn | `HINH_DANG_BUNG_RON` | Số | 1 | 1=Bình thường, 0=Không bình thường 55 |
| 89 | Gan, lách to | `GAN_LACH_TO` | Số | 1 | 0=Không, 1=Có |
| 90 | Khối bất thường bụng | `KHOI_BAT_THUONG_BUNG` | Số | 1 | 0=Không, 1=Có |
| 91 | Cơ quan sinh dục nam | `CO_QUAN_SINH_DUC_NAM` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 92 | Cơ quan sinh dục nữ | `CO_QUAN_SINH_DUC_NU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 93 | Mô tả bất thường bụng sinh dục | `MO_TA_BAT_THUONG_BUNG_SINH_DUC` | Chuỗi | n | B.8 Cơ xương và thần kinh |
| 94 | Vận động không đối xứng | `VAN_DONG_KHONG_DOI_XUNG` | Số | 1 | 0=Không, 1=Có |
| 95 | Phản xạ cơ | `PHAN_XA_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 96 | Trương lực cơ bất thường | `TRUONG_LUC_CO` | Số | 1 | 0=Không, 1=Có |
| 97 | Khớp háng | `KHOP_HANG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 98 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG` | Số | 1 | 0=Không, 1=Có |
| 99 | Mô tả bất thường cơ xương thần kinh | `MO_TA_BAT_THUONG_CO_XUONG_THAN_KINH` | Chuỗi | n | VIII Kết luận và tư vấn Kết luận sức khỏe |
| 100 | Bình thường | `BINH_THUONG` | Số | 1 | 1=Có, 0=Không |
| 101 | Có nguy cơ mắc lao (tiền sử tiếp xúc) | `NGUY_CO_MAC_LAO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 102 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 103 | Có vấn đề về sức khỏe | `VAN_DE_SUC_KHOE` | Số | 1 | 1=Có, 0=Không |
| 104 | Ghi rõ vấn đề sức khỏe | `GHI_RO_VAN_DE_SUC_KHOE` | Chuỗi | n |  |
| 105 | Tư vấn và hẹn khám lần sau | `TU_VAN_HEN_KHAM_LAN_SAU` | Chuỗi | n |  |
| 106 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 107 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `SINH_NON` (Chọn Có/Không)
   - `TUAN_THAI_KHI_SINH` (Số tuần thai)
   - `HO_TEN_NGUOI_DI_CUNG` / `SO_CCCD_NGUOI_DI_CUNG` (Thông tin người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "mi_mat_ket_mac": "Bình thường",
      "kham_mat": "Bình thường",
      "mo_ta_bat_thuong_mat": "Bình thường",
      "suy_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_co_xuong_than_kinh": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_8_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_8_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <SINH_NON>1</SINH_NON>
        <TUAN_THAI_KHI_SINH>1</TUAN_THAI_KHI_SINH>
        <GIOI_TINH>1</GIOI_TINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
        <TSBT_MA_BENH>0</TSBT_MA_BENH>
        <TSGD_MA_BENH>0</TSGD_MA_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <MACH>80</MACH>
        <CAN_NANG>60</CAN_NANG>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <MI_MAT_KET_MAC>Bình thường</MI_MAT_KET_MAC>
        <KHAM_MAT>Bình thường</KHAM_MAT>
        <MO_TA_BAT_THUONG_MAT>Bình thường</MO_TA_BAT_THUONG_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_8_KSK>
```

---

## MẪU 9: 9.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 7 – 9 tháng
**Đối tượng áp dụng:** Trẻ em định kỳ từ 9.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 7 – 9 tháng

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Sinh non | `SINH_NON` | Số | 2 | 0: Không 1: Có 99: Không có thông tin<br>0: Không<br>1: Có<br>99: Không có thông tin |
| 4 | Tuần thai khi sinh | `TUAN_THAI_KHI_SINH` | Số | 2 | Ghi tuần thai khi sinh. 99: Không có thông tin<br>99: Không có thông tin |
| 5 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 8 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân<br>7: Người sống tại vùng có điều kiện<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm<br>11: Học sinh trong các cơ sở giáo dục<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 9 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương 57 Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 10 | Nơi ở | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 12 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 13 | Họ tên người đi cùng trẻ | `HO_TEN_NGUOI_DI_CUNG` | Chuỗi | 255 | 14 CMND / CCCD / HC / Định danh công dân người đi cùng trẻ SO_CCCD_NGUOI_DI_CUNG Chuỗi n |
| 15 | Mối quan hệ với trẻ | `MOI_QUAN_HE_VOI_TRE` | Số | 1 | 1=Cha, 2=Mẹ, 3=Ông/Bà, 4=Anh/Chị, 5=Họ hàng, 9=Khác<br>9: Khác |
| 16 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT A Tiền sử |
| 17 | Tên bệnh tiền sử bản thân | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 18 | Tên bệnh cụ thể khi trong gia đình có người mắc | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 19 | Tiền sử tiếp xúc với người bệnh lao | `TIEN_SU_TIEP_XUC_LAO` | Số | 1 | 1=Có, 0=Không II Thông tin chung về cơ sở khám sức khỏe<br>1: Có, 0=Không |
| 20 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 21 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 58 |
| 22 | Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN | `MA_GTIN_CSKCB` | Chuỗi | 13 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 23 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Đánh giá dấu hiệu sinh tồn |
| 24 | Nhiệt độ (°C) | `NHIET_DO` | Chuỗi | 10 | Ghi nhiệt độ của trẻ tính theo độ C |
| 25 | Đánh giá dấu hiệu sinh tồn qua nhiệt độ | `DGDHST_NHIET_DO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 26 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 | Ghi mạch (nhịp tim) của đối tượng đến khám sức khỏe, theo định dạng "số - số". |
| 27 | Đánh giá dấu hiệu sinh tồn qua mạch | `DGDHST_MACH` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 28 | Nhịp thở | `NHIP_THO` | Chuỗi | 10 | Ghi nhịp thở (lần/phút) |
| 29 | Đánh giá dấu hiệu sinh tồn qua nhịp thở | `DGDHST_NHIP_THO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường IV Đánh giá dinh dưỡng<br>1: Bình thường<br>2: Không bình thường |
| 30 | Chiều dài (cm) | `CHIEU_DAI` | Số | 10 | Ghi chiều dài của trẻ (cm) |
| 31 | Chiều dài / Tuổi (SD) | `CHIEU_DAI_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD chiều dài theo tuổi |
| 32 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 | Ghi cân nặng của đối tượng đến khám sức khỏe (kg) |
| 33 | Cân nặng / Tuổi (SD) | `CAN_NANG_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD cân nặng theo tuổi |
| 34 | Chu vi vòng cánh tay (mm) | `CHU_VI_VONG_CANH_TAY` | Số | 10 | Ghi chu vi vòng cánh tay giữa của trẻ (mm) — chỉ số phát hiện suy dinh dưỡng cấp |
| 35 | Vòng đầu (cm) | `VONG_DAU` | Số | 10 | Ghi chu vi vòng đầu của trẻ (cm) |
| 36 | Phù dinh dưỡng | `PHU_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 37 | Dấu hiệu thiếu máu | `DAU_HIEU_THIEU_MAU` | Số | 1 | 1=Có, 0=Không |
| 38 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG` | Số | 1 | 1=Có, 0=Không |
| 39 | Suy dinh dưỡng | `SUY_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 40 | Thừa cân / béo phì | `THUA_CAN_BEO_PHI` | Số | 1 | 1=Có, 0=Không V Đánh giá phát triển tinh thần - vận động |
| 41 | Bập bẹ chuỗi âm thanh khác nhau | `BAP_BE_CHUOI_AM_THANH` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 42 | Phát ra âm thanh hoặc cử chỉ để thu hút sự chú ý | `PHAT_AM_THANH_CU_CHI` | Số | 1 | 1=Có, 0=Không 59<br>1: Có, 0=Không |
| 43 | Chơi các trò chơi tương tác với người chăm sóc | `CHOI_TRO_CHOI_TUONG_TAC` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 44 | Quay đầu về phía tiếng gọi hoặc người nói chuyện | `QUAY_DAU_TIENG_GOI` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 45 | Biết nhìn theo đồ vật bị giấu đi | `NHIN_THEO_DO_VAT_BI_GIAU` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 46 | Nhận biết được lạ - quen | `NHAN_BIET_LA_QUEN` | Số | 1 | 1=Có, 0=Không |
| 47 | Ngồi được không cần hỗ trợ | `NGOI_KHONG_HO_TRO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 48 | Dùng ngón cái đối diện các ngón còn lại để túm đồ vật | `DUNG_NGON_CAI_TUM_DO_VAT` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 49 | Đứng khi được xốc nách | `DUNG_KHI_XOC_NACH` | Số | 1 | 1=Có, 0=Không VI Đánh giá tiêm chủng |
| 50 | Viêm gan B mũi 1 (sơ sinh) | `TIEM_CHUNG_VGB_SS_MUI1` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 51 | Lao BCG (sơ sinh) | `TIEM_CHUNG_BCG_SS` | Số | 1 | 1=Có, 0=Không |
| 52 | Vắc xin 5 trong 1 mũi 1 | `TIEM_CHUNG_5IN1_MUI1` | Số | 1 | 1=Có, 0=Không |
| 53 | Vắc xin 5 trong 1 mũi 2 | `TIEM_CHUNG_5IN1_MUI2` | Số | 1 | 1=Có, 0=Không |
| 54 | Vắc xin 5 trong 1 mũi 3 | `TIEM_CHUNG_5IN1_MUI3` | Số | 1 | 1=Có, 0=Không |
| 55 | Uống vắc xin bại liệt lần 1 | `TIEM_CHUNG_BAI_LIET_L1` | Số | 1 | 1=Có, 0=Không |
| 56 | Uống vắc xin bại liệt lần 2 | `TIEM_CHUNG_BAI_LIET_L2` | Số | 1 | 1=Có, 0=Không |
| 57 | Uống vắc xin bại liệt lần 3 | `TIEM_CHUNG_BAI_LIET_L3` | Số | 1 | 1=Có, 0=Không |
| 58 | Tiêm vắc xin bại liệt IPV | `TIEM_CHUNG_BAI_LIET_IPV` | Số | 1 | 1=Có, 0=Không |
| 59 | Vắc xin Sởi đơn (9 tháng) | `TIEM_CHUNG_SOI_DON` | Số | 1 | 1=Có, 0=Không |
| 60 | Tư vấn tiêm chủng | `TU_VAN_TIEM_CHUNG` | Chuỗi | n | VII Khám lâm sàng A Da |
| 61 | Màu sắc da | `MAU_SAC_DA` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 62 | Lòng bàn tay | `LONG_BAN_TAY` | Số | 1 | 1=Không nhợt (bình thường), 2=Nhợt |
| 63 | Mô tả bất thường da | `MO_TA_BAT_THUONG_DA` | Chuỗi | n | B Đầu - cổ B.1 Khám đầu - cổ |
| 64 | Thóp | `THOP` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 65 | Kích thước và hình dạng đầu | `HINH_DANG_DAU` | Số | 1 | 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình thường |
| 66 | Khối bất thường đầu cổ | `KHOI_BAT_THUONG_DAU_CO` | Số | 1 | 0=Không, 1=Có 60 |
| 67 | Mô tả khối bất thường đầu cổ | `MO_TA_KHOI_BAT_THUONG_DAU_CO` | Chuỗi | n | B.2 Khám mắt |
| 68 | Mí mắt và kết mạc | `MI_MAT_KET_MAC` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 69 | Rung giật nhãn cầu/lác/vận động mắt | `KHAM_MAT` | Số | 1 | 0=Không, 1=Có bất thường<br>0: Không, 1=Có bất thường |
| 70 | Đồng tử | `DONG_TU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 71 | Mô tả bất thường mắt | `MO_TA_BAT_THUONG_MAT` | Chuỗi | n | B.3 Khám tai |
| 72 | Tai và Màng nhĩ | `TAI_MANG_NHI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 73 | Khối sưng sau tai | `KHOI_SUNG_SAU_TAI` | Số | 1 | 0=Không, 1=Có |
| 74 | Chảy mủ/nước tai | `CHAY_MU_NUOC_TAI` | Số | 1 | 0=Không, 1=Có |
| 75 | Mô tả bất thường tai | `MO_TA_BAT_THUONG_TAI` | Chuỗi | n | B.4 Khám mũi họng |
| 76 | Khám mũi họng | `HINH_DANG_MUI_HONG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 77 | Mô tả bất thường mũi họng | `MO_TA_BAT_THUONG_MUI_HONG` | Chuỗi | n | B.5 Khám miệng |
| 78 | Khám miệng | `HINH_DANG_MIENG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 79 | Mô tả bất thường miệng | `MO_TA_BAT_THUONG_MIENG` | Chuỗi | n | B.6 Hô hấp |
| 80 | Dấu hiệu suy hô hấp | `SUY_HO_HAP` | Số | 1 | 0=Không, 1=Có |
| 81 | Tiếng thở bất thường | `TIENG_THO_BAT_THUONG` | Số | 1 | 0=Không, 1=Có |
| 82 | Nghe phổi | `NGHE_PHOI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 83 | Mô tả bất thường hô hấp | `MO_TA_BAT_THUONG_HO_HAP` | Chuỗi | n | B.7 Tim mạch |
| 84 | Vị trí mỏm tim | `VI_TRI_MOM_TIM` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 85 | Mạch ngoại vi | `MACH_NGOAI_VI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 86 | Nghe tim | `TIENG_TIM` | Số | 1 | 0=Không bất thường, 1=Có bất thường |
| 87 | Mô tả bất thường tim mạch | `MO_TA_BAT_THUONG_TIM_MACH` | Chuỗi | n | B.8 Bụng và cơ quan sinh dục |
| 88 | Hình dáng bụng, rốn | `HINH_DANG_BUNG_RON` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 89 | Gan, lách to | `GAN_LACH_TO` | Số | 1 | 0=Không, 1=Có |
| 90 | Khối bất thường bụng | `KHOI_BAT_THUONG_BUNG` | Số | 1 | 0=Không, 1=Có |
| 91 | Cơ quan sinh dục ngoài | `CO_QUAN_SINH_DUC_NGOAI` | Số | 1 | 1=Bình thường, 0=Không bình thường 61 |
| 92 | Mô tả bất thường bụng sinh dục | `MO_TA_BAT_THUONG_BUNG_SINH_DUC` | Chuỗi | n | B.9 Cơ xương và thần kinh |
| 93 | Vận động không đối xứng | `VAN_DONG_KHONG_DOI_XUNG` | Số | 1 | 0=Không, 1=Có |
| 94 | Trương lực cơ bất thường | `TRUONG_LUC_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 95 | Phản xạ cơ | `PHAN_XA_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 96 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG_THAN_KINH` | Số | 1 | 0=Không, 1=Có |
| 97 | Mô tả bất thường cơ xương thần kinh | `MO_TA_BAT_THUONG_CO_XUONG_THAN_KINH` | Chuỗi | n | VIII Kết luận và tư vấn Kết luận sức khỏe |
| 98 | Bình thường | `BINH_THUONG` | Số | 1 | 1=Có, 0=Không |
| 99 | Có nguy cơ mắc lao (tiền sử tiếp xúc) | `NGUY_CO_MAC_LAO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 100 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 101 | Có vấn đề về sức khỏe | `VAN_DE_SUC_KHOE` | Số | 1 | 1=Có, 0=Không |
| 102 | Ghi rõ vấn đề sức khỏe | `GHI_RO_VAN_DE_SUC_KHOE` | Chuỗi | n | Ghi rõ các vấn đề sức khỏe (nếu có) |
| 103 | Tư vấn và hẹn khám lần sau | `TU_VAN_HEN_KHAM_LAN_SAU` | Chuỗi | n | Ghi nội dung tư vấn và lịch hẹn khám |
| 104 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 105 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `SINH_NON` (Chọn Có/Không)
   - `TUAN_THAI_KHI_SINH` (Số tuần thai)
   - `HO_TEN_NGUOI_DI_CUNG` / `SO_CCCD_NGUOI_DI_CUNG` (Thông tin người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "mi_mat_ket_mac": "Bình thường",
      "kham_mat": "Bình thường",
      "mo_ta_bat_thuong_mat": "Bình thường",
      "suy_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_ho_hap": "Bình thường",
      "dau_hieu_coi_xuong_than_kinh": "Bình thường",
      "mo_ta_bat_thuong_co_xuong_than_kinh": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_9_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_9_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <SINH_NON>1</SINH_NON>
        <TUAN_THAI_KHI_SINH>1</TUAN_THAI_KHI_SINH>
        <GIOI_TINH>1</GIOI_TINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
        <TSBT_MA_BENH>0</TSBT_MA_BENH>
        <TSGD_MA_BENH>0</TSGD_MA_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <MACH>80</MACH>
        <CAN_NANG>60</CAN_NANG>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <MI_MAT_KET_MAC>Bình thường</MI_MAT_KET_MAC>
        <KHAM_MAT>Bình thường</KHAM_MAT>
        <MO_TA_BAT_THUONG_MAT>Bình thường</MO_TA_BAT_THUONG_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_9_KSK>
```

---

## MẪU 10: 10.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 10 – 12 tháng
**Đối tượng áp dụng:** Trẻ em định kỳ từ 10.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 10 – 12 tháng

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT 62 |
| 2 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Sinh non | `SINH_NON` | Số | 2 | 0: Không 1: Có 99: Không có thông tin<br>0: Không<br>1: Có<br>99: Không có thông tin |
| 4 | Tuần thai khi sinh | `TUAN_THAI_KHI_SINH` | Số | 2 | Ghi tuần thai khi sinh. 99: Không có thông tin<br>99: Không có thông tin |
| 5 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 8 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân<br>7: Người sống tại vùng có điều kiện<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm<br>11: Học sinh trong các cơ sở giáo dục<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 9 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 10 | Nơi ở | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT 63 |
| 11 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 12 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 13 | Họ tên người đi cùng trẻ | `HO_TEN_NGUOI_DI_CUNG` | Chuỗi | 255 | 14 CMND / CCCD / HC / Định danh công dân người đi cùng trẻ SO_CCCD_NGUOI_DI_CUNG Chuỗi n |
| 15 | Mối quan hệ với trẻ | `MOI_QUAN_HE_VOI_TRE` | Số | 1 | 1=Cha, 2=Mẹ, 3=Ông/Bà, 4=Anh/Chị, 5=Họ hàng, 9=Khác<br>9: Khác |
| 16 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT A Tiền sử |
| 17 | Tên bệnh tiền sử bản thân | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 18 | Tên bệnh cụ thể khi trong gia đình có người mắc | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 19 | Tiền sử tiếp xúc với người bệnh lao | `TIEN_SU_TIEP_XUC_LAO` | Số | 1 | 1=Có, 0=Không II Thông tin chung về cơ sở khám sức khỏe<br>1: Có, 0=Không |
| 20 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 21 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. |
| 22 | Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN | `MA_GTIN_CSKCB` | Chuỗi | 13 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 23 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT 64 III Đánh giá dấu hiệu sinh tồn |
| 24 | Nhiệt độ (°C) | `NHIET_DO` | Chuỗi | 10 | Ghi nhiệt độ của trẻ tính theo độ C |
| 25 | Đánh giá dấu hiệu sinh tồn qua nhiệt độ | `DGDHST_NHIET_DO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 26 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 | Ghi mạch (nhịp tim) của đối tượng đến khám sức khỏe, theo định dạng "số - số". |
| 27 | Đánh giá dấu hiệu sinh tồn qua mạch | `DGDHST_MACH` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 28 | Nhịp thở | `NHIP_THO` | Chuỗi | 10 | Ghi nhịp thở (lần/phút) |
| 29 | Đánh giá dấu hiệu sinh tồn qua nhịp thở | `DGDHST_NHIP_THO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường IV Đánh giá dinh dưỡng<br>1: Bình thường<br>2: Không bình thường |
| 30 | Chiều dài (cm) | `CHIEU_DAI` | Số | 10 | Ghi chiều dài của trẻ (cm) |
| 31 | Chiều dài / Tuổi (SD) | `CHIEU_DAI_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD chiều dài theo tuổi |
| 32 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 | Ghi cân nặng của đối tượng đến khám sức khỏe (kg) |
| 33 | Cân nặng / Tuổi (SD) | `CAN_NANG_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD cân nặng theo tuổi |
| 34 | Chu vi vòng cánh tay (mm) | `CHU_VI_VONG_CANH_TAY` | Số | 10 | Ghi chu vi vòng cánh tay giữa của trẻ (mm) — chỉ số phát hiện suy dinh dưỡng cấp |
| 35 | Vòng đầu (cm) | `VONG_DAU` | Số | 10 | Ghi chu vi vòng đầu của trẻ (cm) |
| 36 | Phù dinh dưỡng | `PHU_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 37 | Dấu hiệu thiếu máu | `DAU_HIEU_THIEU_MAU` | Số | 1 | 1=Có, 0=Không |
| 38 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG` | Số | 1 | 1=Có, 0=Không |
| 39 | Suy dinh dưỡng | `SUY_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 40 | Thừa cân / béo phì | `THUA_CAN_BEO_PHI` | Số | 1 | 1=Có, 0=Không V Đánh giá phát triển tinh thần - vận động 41 Đáp ứng, quay về phía người gọi tên trẻ DAP_UNG_GOI_TEN Số 1 1=Có, 0=Không<br>1: Có, 0=Không |
| 42 | Hiểu một số câu hỏi đơn giản, quen thuộc | `HIEU_CAU_HOI_DON_GIAN` | Số | 1 | 1=Có, 0=Không 65 43 Bập bẹ được một số từ gồm cả nguyên âm và phụ âm BAP_BE_TU_NGUYEN_PHU_AM Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 44 | Bắt chước được một vài động tác | `BAT_CHUOC_DONG_TAC` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 45 | Nhìn được đồ vật theo hướng tay của cha mẹ chỉ | `NHIN_THEO_HUONG_TAY` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 46 | Lo lắng khi bị tách khỏi bố mẹ/người chăm sóc | `LO_LANG_TACH_BO_ME` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 47 | Đứng vịn được, biết đứng lên khi được kéo tay | `DUNG_VIN_DUNG_LEN` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 48 | Có thể di chuyển hoặc lết bằng mông | `DI_CHUYEN_LET_BANG_MONG` | Số | 1 | 1=Có, 0=Không VI Đánh giá tiêm chủng 49 Viêm gan B mũi 1 (sơ sinh) TIEM_CHUNG_VGB_SS_MUI1 Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 50 | Lao BCG (sơ sinh) | `TIEM_CHUNG_BCG_SS` | Số | 1 | 1=Có, 0=Không |
| 51 | Vắc xin 5 trong 1 mũi 1 | `TIEM_CHUNG_5IN1_MUI1` | Số | 1 | 1=Có, 0=Không |
| 52 | Vắc xin 5 trong 1 mũi 2 | `TIEM_CHUNG_5IN1_MUI2` | Số | 1 | 1=Có, 0=Không |
| 53 | Vắc xin 5 trong 1 mũi 3 | `TIEM_CHUNG_5IN1_MUI3` | Số | 1 | 1=Có, 0=Không |
| 54 | Uống vắc xin bại liệt lần 1 | `TIEM_CHUNG_BAI_LIET_L1` | Số | 1 | 1=Có, 0=Không |
| 55 | Uống vắc xin bại liệt lần 2 | `TIEM_CHUNG_BAI_LIET_L2` | Số | 1 | 1=Có, 0=Không |
| 56 | Uống vắc xin bại liệt lần 3 | `TIEM_CHUNG_BAI_LIET_L3` | Số | 1 | 1=Có, 0=Không |
| 57 | Tiêm vắc xin bại liệt IPV | `TIEM_CHUNG_BAI_LIET_IPV` | Số | 1 | 1=Có, 0=Không |
| 58 | Vắc xin Sởi đơn (9 tháng) | `TIEM_CHUNG_SOI_DON` | Số | 1 | 1=Có, 0=Không |
| 59 | Viêm não Nhật Bản mũi 1 | `TIEM_CHUNG_VNNB_MUI1` | Số | 1 | 1=Có, 0=Không |
| 60 | Viêm não Nhật Bản mũi 2 | `TIEM_CHUNG_VNNB_MUI2` | Số | 1 | 1=Có, 0=Không |
| 61 | Vắc xin khác (ghi rõ) | `TIEM_CHUNG_KHAC` | Chuỗi | 255 |  |
| 62 | Tư vấn tiêm chủng | `TU_VAN_TIEM_CHUNG` | Chuỗi | n | VII Khám lâm sàng A Da |
| 63 | Màu sắc da | `MAU_SAC_DA` | Số | 1 | 1=Bình thường, 0=Không bình thường 66 |
| 64 | Lòng bàn tay | `LONG_BAN_TAY` | Số | 1 | 1=Không nhợt (bình thường), 2=Nhợt |
| 65 | Mô tả bất thường da | `MO_TA_BAT_THUONG_DA` | Chuỗi | n | B Đầu - cổ B.1 Khám đầu - cổ |
| 66 | Thóp | `THOP` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 67 | Kích thước và hình dạng đầu | `HINH_DANG_DAU` | Số | 1 | 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình thường |
| 68 | Khối bất thường đầu cổ | `KHOI_BAT_THUONG_DAU_CO` | Số | 1 | 0=Không, 1=Có |
| 69 | Mô tả khối bất thường đầu cổ | `MO_TA_KHOI_BAT_THUONG_DAU_CO` | Chuỗi | n | B.2 Khám mắt |
| 70 | Mí mắt và kết mạc | `MI_MAT_KET_MAC` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 71 | Rung giật nhãn cầu/lác/vận động mắt | `KHAM_MAT` | Số | 1 | 0=Không, 1=Có bất thường<br>0: Không, 1=Có bất thường |
| 72 | Đồng tử | `DONG_TU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 73 | Mô tả bất thường mắt | `MO_TA_BAT_THUONG_MAT` | Chuỗi | n | B.3 Khám tai |
| 74 | Tai và Màng nhĩ | `TAI_MANG_NHI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 75 | Khối sưng sau tai | `KHOI_SUNG_SAU_TAI` | Số | 1 | 0=Không, 1=Có |
| 76 | Chảy mủ/nước tai | `CHAY_MU_NUOC_TAI` | Số | 1 | 0=Không, 1=Có |
| 77 | Mô tả bất thường tai | `MO_TA_BAT_THUONG_TAI` | Chuỗi | n | B.4 Khám mũi họng |
| 78 | Khám mũi họng | `HINH_DANG_MUI_HONG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 79 | Mô tả bất thường mũi họng | `MO_TA_BAT_THUONG_MUI_HONG` | Chuỗi | n | B.5 Khám miệng |
| 80 | Khám miệng | `HINH_DANG_MIENG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 81 | Mô tả bất thường miệng | `MO_TA_BAT_THUONG_MIENG` | Chuỗi | n | B.6 Hô hấp |
| 82 | Dấu hiệu suy hô hấp | `SUY_HO_HAP` | Số | 1 | 0=Không, 1=Có |
| 83 | Tiếng thở bất thường | `TIENG_THO_BAT_THUONG` | Số | 1 | 0=Không, 1=Có 67 |
| 84 | Nghe phổi | `NGHE_PHOI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 85 | Mô tả bất thường hô hấp | `MO_TA_BAT_THUONG_HO_HAP` | Chuỗi | n | B.7 Tim mạch |
| 86 | Vị trí mỏm tim | `VI_TRI_MOM_TIM` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 87 | Mạch ngoại vi | `MACH_NGOAI_VI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 88 | Nghe tim | `TIENG_TIM` | Số | 1 | 0=Không bất thường, 1=Có bất thường |
| 89 | Mô tả bất thường tim mạch | `MO_TA_BAT_THUONG_TIM_MACH` | Chuỗi | n | B.8 Bụng và cơ quan sinh dục |
| 90 | Hình dáng bụng, rốn | `HINH_DANG_BUNG_RON` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 91 | Gan, lách to | `GAN_LACH_TO` | Số | 1 | 0=Không, 1=Có |
| 92 | Khối bất thường bụng | `KHOI_BAT_THUONG_BUNG` | Số | 1 | 0=Không, 1=Có |
| 93 | Cơ quan sinh dục ngoài | `CO_QUAN_SINH_DUC_NGOAI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 94 | Mô tả bất thường bụng sinh dục | `MO_TA_BAT_THUONG_BUNG_SINH_DUC` | Chuỗi | n | B.9 Cơ xương và thần kinh |
| 95 | Vận động không đối xứng | `VAN_DONG_KHONG_DOI_XUNG` | Số | 1 | 0=Không, 1=Có |
| 96 | Trương lực cơ bất thường | `TRUONG_LUC_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 97 | Phản xạ cơ | `PHAN_XA_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 98 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG_THAN_KINH` | Số | 1 | 0=Không, 1=Có |
| 99 | Mô tả bất thường cơ xương thần kinh | `MO_TA_BAT_THUONG_CO_XUONG_THAN_KINH` | Chuỗi | n | VIII Kết luận và tư vấn Kết luận sức khỏe |
| 100 | Bình thường | `BINH_THUONG` | Số | 1 | 1=Có, 0=Không |
| 101 | Có nguy cơ mắc lao (tiền sử tiếp xúc) | `NGUY_CO_MAC_LAO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 102 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". 68 |
| 103 | Có vấn đề về sức khỏe | `VAN_DE_SUC_KHOE` | Số | 1 | 1=Có, 0=Không |
| 104 | Ghi rõ vấn đề sức khỏe | `GHI_RO_VAN_DE_SUC_KHOE` | Chuỗi | n | Ghi rõ các vấn đề sức khỏe (nếu có) |
| 105 | Tư vấn và hẹn khám lần sau | `TU_VAN_HEN_KHAM_LAN_SAU` | Chuỗi | n | Ghi nội dung tư vấn và lịch hẹn khám |
| 106 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 107 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `SINH_NON` (Chọn Có/Không)
   - `TUAN_THAI_KHI_SINH` (Số tuần thai)
   - `HO_TEN_NGUOI_DI_CUNG` / `SO_CCCD_NGUOI_DI_CUNG` (Thông tin người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "mi_mat_ket_mac": "Bình thường",
      "kham_mat": "Bình thường",
      "mo_ta_bat_thuong_mat": "Bình thường",
      "suy_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_ho_hap": "Bình thường",
      "dau_hieu_coi_xuong_than_kinh": "Bình thường",
      "mo_ta_bat_thuong_co_xuong_than_kinh": "Bình thường"
    },
    "extra": {
      "lo_lang_tach_bo_me": "Sample_Value"
    }
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_10_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_10_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <SINH_NON>1</SINH_NON>
        <TUAN_THAI_KHI_SINH>1</TUAN_THAI_KHI_SINH>
        <GIOI_TINH>1</GIOI_TINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
        <TSBT_MA_BENH>0</TSBT_MA_BENH>
        <TSGD_MA_BENH>0</TSGD_MA_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <MACH>80</MACH>
        <CAN_NANG>60</CAN_NANG>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <MI_MAT_KET_MAC>Bình thường</MI_MAT_KET_MAC>
        <KHAM_MAT>Bình thường</KHAM_MAT>
        <MO_TA_BAT_THUONG_MAT>Bình thường</MO_TA_BAT_THUONG_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_10_KSK>
```

---

## MẪU 11: 11.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 13 – 18 tháng
**Đối tượng áp dụng:** Trẻ em định kỳ từ 11.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 13 – 18 tháng

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Sinh non | `SINH_NON` | Số | 2 | 0: Không 1: Có 99: Không có thông tin<br>0: Không<br>1: Có<br>99: Không có thông tin |
| 4 | Tuần thai khi sinh | `TUAN_THAI_KHI_SINH` | Số | 2 | Ghi tuần thai khi sinh. 99: Không có thông tin<br>99: Không có thông tin |
| 5 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 8 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có 69 điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng<br>7: Người sống tại vùng có<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo<br>11: Học sinh trong các cơ sở<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 9 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 10 | Nơi ở | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 12 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 13 | Họ tên người đi cùng trẻ | `HO_TEN_NGUOI_DI_CUNG` | Chuỗi | 255 |  |
| 14 | CMND / CCCD / HC / Định danh công dân người đi cùng trẻ | `SO_CCCD_NGUOI_DI_CUNG` | Chuỗi | n |  |
| 15 | Mối quan hệ với trẻ | `MOI_QUAN_HE_VOI_TRE` | Số | 1 | 1=Cha, 2=Mẹ, 3=Ông/Bà, 4=Anh/Chị, 5=Họ hàng, 9=Khác<br>4: Anh/Chị, 5=Họ hàng, 9=Khác |
| 16 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT A Tiền sử |
| 17 | Tên bệnh tiền sử bản thân | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". 70 |
| 18 | Tên bệnh cụ thể khi trong gia đình có người mắc | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 19 | Tiền sử tiếp xúc với người bệnh lao | `TIEN_SU_TIEP_XUC_LAO` | Số | 1 | 1=Có, 0=Không II Thông tin chung về cơ sở khám sức khỏe |
| 20 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 21 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. |
| 22 | Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN | `MA_GTIN_CSKCB` | Chuỗi | 13 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 23 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Đánh giá dấu hiệu sinh tồn |
| 24 | Nhiệt độ (°C) | `NHIET_DO` | Chuỗi | 10 | Ghi nhiệt độ của trẻ tính theo độ C |
| 25 | Đánh giá dấu hiệu sinh tồn qua nhiệt độ | `DGDHST_NHIET_DO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 26 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 | Ghi mạch (nhịp tim) của đối tượng đến khám sức khỏe, theo định dạng "số - số". |
| 27 | Đánh giá dấu hiệu sinh tồn qua mạch | `DGDHST_MACH` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>2: Không bình thường |
| 28 | Nhịp thở | `NHIP_THO` | Chuỗi | 10 | Ghi nhịp thở (lần/phút) |
| 29 | Đánh giá dấu hiệu sinh tồn qua nhịp thở | `DGDHST_NHIP_THO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường IV Đánh giá dinh dưỡng<br>1: Bình thường<br>2: Không bình thường |
| 30 | Chiều dài (cm) | `CHIEU_DAI` | Số | 10 | Ghi chiều dài của trẻ (cm) |
| 31 | Chiều dài / Tuổi (SD) | `CHIEU_DAI_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD chiều dài theo tuổi 71 |
| 32 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 | Ghi cân nặng của đối tượng đến khám sức khỏe (kg) |
| 33 | Cân nặng / Tuổi (SD) | `CAN_NANG_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD cân nặng theo tuổi 34 Chu vi vòng cánh tay (mm) CHU_VI_VONG_CANH_TAY Số 10 Ghi chu vi vòng cánh tay giữa của trẻ (mm) — chỉ số phát hiện suy dinh dưỡng cấp |
| 35 | Vòng đầu (cm) | `VONG_DAU` | Số | 10 | Ghi chu vi vòng đầu của trẻ (cm) |
| 36 | Phù dinh dưỡng | `PHU_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 37 | Dấu hiệu thiếu máu | `DAU_HIEU_THIEU_MAU` | Số | 1 | 1=Có, 0=Không |
| 38 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG` | Số | 1 | 1=Có, 0=Không |
| 39 | Suy dinh dưỡng | `SUY_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 40 | Thừa cân / béo phì | `THUA_CAN_BEO_PHI` | Số | 1 | 1=Có, 0=Không V Đánh giá phát triển tinh thần - vận động 41 Nói được từ 5-20 từ đơn có nghĩa, có chủ đích (VD: bố, mẹ, bà, xe, chó). Phát âm có thể chưa rõ ràng NOI_DUOC_CO_CHU_DICH Số 1 1=Có, 0=Không<br>VD: bố, mẹ, bà, xe, chó).<br>1: Có, 0=Không |
| 42 | Biết dùng tay để cầm và ăn thức ăn cứng | `TU_CAM_AN_DO_CUNG` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 43 | Sợ hãi khi tiếp xúc với người lạ hoặc đến nơi lạ | `SO_NGUOI_LA_NOI_LA` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 44 | Bắt chước được tiếng nói và cử chỉ của người khác | `BAT_CHUOC_GIONG_CU_CHI` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 45 | Biết tìm đến bố mẹ/người chăm sóc thân thiết khi buồn, sợ hãi | `TIM_NGUOI_THAN_KHI_SO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 46 | Thể hiện sự hứng thú với trẻ khác: nhìn, lại gần, cười, chơi cùng,… | `HUNG_THU_VOI_TRE_KHAC` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 47 | Tự cởi mũ/dép mà không cần bố mẹ trợ giúp | `TU_COI_MU_DEP` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 48 | Biết bò/dò dẫm đi lên được 3-4 bậc cầu thang, tam cấp | `BO_LEN_BAC_THANG` | Số | 1 | 1=Có, 0=Không 49 Làm được các yêu cầu đơn giản bằng lời nói không có chỉ dẫn (lấy được đồ vật/đồ chơi quen thuộc theo yêu cầu) LAM_THEO_YEU_CAU_DON_GIAN Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 50 | Dùng ngón trỏ để chỉ cho người khác biết thứ mình muốn | `CHI_BANG_NGON_TRO` | Số | 1 | 1=Có, 0=Không 72<br>1: Có, 0=Không |
| 51 | Trả lời hoặc quay đầu về phía người gọi tên trẻ | `PHAN_UNG_KHI_GOI_TEN` | Số | 1 | 1=Có, 0=Không 52 Đi được khi có người dắt, bám vào thành tủ, giường để di chuyển (trẻ <15 tháng); đi mà không cần trợ giúp (biết đi) (trẻ 18 tháng) DI_CO_HOAC_KHONG_TRO_GIUP Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 53 | Cố gắng ngồi xổm để nhặt đồ chơi dưới sàn | `NGOI_XOM_NHAT_DO_CHOI` | Số | 1 | 1=Có, 0=Không VI Đánh giá tiêm chủng<br>1: Có, 0=Không |
| 54 | Viêm gan B mũi 1 (sơ sinh) | `TIEM_CHUNG_VGB_SS_MUI1` | Số | 1 | 1=Có, 0=Không |
| 55 | Lao BCG (sơ sinh) | `TIEM_CHUNG_BCG_SS` | Số | 1 | 1=Có, 0=Không |
| 56 | Vắc xin 5 trong 1 mũi 1 | `TIEM_CHUNG_5IN1_MUI1` | Số | 1 | 1=Có, 0=Không |
| 57 | Vắc xin 5 trong 1 mũi 2 | `TIEM_CHUNG_5IN1_MUI2` | Số | 1 | 1=Có, 0=Không |
| 58 | Vắc xin 5 trong 1 mũi 3 | `TIEM_CHUNG_5IN1_MUI3` | Số | 1 | 1=Có, 0=Không |
| 59 | Uống vắc xin bại liệt lần 1 | `TIEM_CHUNG_BAI_LIET_L1` | Số | 1 | 1=Có, 0=Không |
| 60 | Uống vắc xin bại liệt lần 2 | `TIEM_CHUNG_BAI_LIET_L2` | Số | 1 | 1=Có, 0=Không |
| 61 | Uống vắc xin bại liệt lần 3 | `TIEM_CHUNG_BAI_LIET_L3` | Số | 1 | 1=Có, 0=Không |
| 62 | Tiêm vắc xin bại liệt IPV | `TIEM_CHUNG_BAI_LIET_IPV` | Số | 1 | 1=Có, 0=Không |
| 63 | Vắc xin Sởi đơn (9 tháng) | `TIEM_CHUNG_SOI_DON` | Số | 1 | 1=Có, 0=Không |
| 64 | Viêm não Nhật Bản mũi 1 | `TIEM_CHUNG_VNNB_MUI1` | Số | 1 | 1=Có, 0=Không |
| 65 | Viêm não Nhật Bản mũi 2 | `TIEM_CHUNG_VNNB_MUI2` | Số | 1 | 1=Có, 0=Không |
| 66 | Vắc xin 5 trong 1 mũi 4 (18 tháng) | `TIEM_CHUNG_5IN1_MUI4` | Số | 1 | 1=Có, 0=Không |
| 67 | Sởi- Rubella | `TIEM_CHUNG_SOI_RUBELLA` | Số | 1 | 1=Có, 0=Không |
| 68 | Vắc xin khác (ghi rõ) | `TIEM_CHUNG_KHAC` | Chuỗi | 255 |  |
| 69 | Tư vấn tiêm chủng | `TU_VAN_TIEM_CHUNG` | Chuỗi | n | VII Khám lâm sàng A Da 70 Màu sắc da MAU_SAC_DA Số 1 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình |
| 71 | Lòng bàn tay | `LONG_BAN_TAY` | Số | 1 | 1=Không nhợt (bình thường), 2=Nhợt 73<br>2: Nhợt |
| 72 | Mô tả bất thường da | `MO_TA_BAT_THUONG_DA` | Chuỗi | n | B Đầu - cổ B.1 Khám đầu - cổ 73 Thóp THOP Số 1 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình |
| 74 | Kích thước và hình dạng đầu | `HINH_DANG_DAU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 75 | Khối bất thường đầu cổ | `KHOI_BAT_THUONG_DAU_CO` | Số | 1 | 0=Không, 1=Có |
| 76 | Mô tả khối bất thường đầu cổ | `MO_TA_KHOI_BAT_THUONG_DAU_CO` | Chuỗi | n | B.2 Khám mắt 77 Mí mắt và kết mạc MI_MAT_KET_MAC Số 1 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình |
| 78 | Rung giật nhãn cầu/lác/vận động mắt | `KHAM_MAT` | Số | 1 | 0=Không, 1=Có bất thường |
| 79 | Đồng tử | `DONG_TU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 80 | Mô tả bất thường mắt | `MO_TA_BAT_THUONG_MAT` | Chuỗi | n | B.3 Khám tai |
| 81 | Tai và Màng nhĩ | `TAI_MANG_NHI` | Số | 1 | 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình |
| 82 | Khối sưng sau tai | `KHOI_SUNG_SAU_TAI` | Số | 1 | 0=Không, 1=Có |
| 83 | Chảy mủ/nước tai | `CHAY_MU_NUOC_TAI` | Số | 1 | 0=Không, 1=Có |
| 84 | Mô tả bất thường tai | `MO_TA_BAT_THUONG_TAI` | Chuỗi | n | B.4 Khám mũi họng 85 Khám mũi họng HINH_DANG_MUI_HONG Số 1 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình |
| 86 | Mô tả bất thường mũi họng | `MO_TA_BAT_THUONG_MUI_HONG` | Chuỗi | 1024 | B.5 Khám miệng 87 Khám miệng HINH_DANG_MIENG Số 1 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình |
| 88 | Mô tả bất thường miệng | `MO_TA_BAT_THUONG_MIENG` | Chuỗi | 1024 | C Hô hấp |
| 89 | Dấu hiệu suy hô hấp | `SUY_HO_HAP` | Số | 1 | 0=Không, 1=Có 74 |
| 90 | Tiếng thở bất thường | `TIENG_THO_BAT_THUONG` | Số | 1 | 0=Không, 1=Có |
| 91 | Nghe phổi | `NGHE_PHOI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 92 | Mô tả bất thường hô hấp | `MO_TA_BAT_THUONG_HO_HAP` | Chuỗi | 1024 | D Tim mạch 93 Vị trí mỏm tim VI_TRI_MOM_TIM Số 1 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình |
| 94 | Mạch ngoại vi | `MACH_NGOAI_VI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 95 | Nghe tim | `TIENG_TIM` | Số | 1 | 0=Không bất thường, 1=Có bất thường |
| 96 | Mô tả bất thường tim mạch | `MO_TA_BAT_THUONG_TIM_MACH` | Chuỗi | n | E Bụng và cơ quan sinh dục 97 Hình dáng bụng, rốn HINH_DANG_BUNG_RON Số 1 1=Bình thường, 0=Không bình thường<br>1: Bình thường, 0=Không bình |
| 98 | Gan, lách to | `GAN_LACH_TO` | Số | 1 | 0=Không, 1=Có |
| 99 | Khối bất thường bụng | `KHOI_BAT_THUONG_BUNG` | Số | 1 | 0=Không, 1=Có |
| 100 | Cơ quan sinh dục ngoài | `CO_QUAN_SINH_DUC_NGOAI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 101 | Mô tả bất thường bụng sinh dục | `MO_TA_BAT_THUONG_BUNG_SINH_DUC` | Chuỗi | n | F Cơ xương và thần kinh |
| 102 | Vận động không đối xứng | `VAN_DONG_KHONG_DOI_XUNG` | Số | 1 | 0=Không, 1=Có |
| 103 | Trương lực cơ bất thường | `TRUONG_LUC_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 104 | Phản xạ cơ | `PHAN_XA_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 105 | Kiểm tra lưng | `KIEM_TRA_LUNG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 106 | Khám tứ chi và khớp | `TU_CHI_KHOP` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 107 | Quan sát dáng đi | `QUAN_SAT_DANG_DI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 108 | Mô tả bất thường cơ xương thần kinh | `MO_TA_BAT_THUONG_CO_XUONG_THAN_KINH` | Chuỗi | n | VIII Kết luận và tư vấn 75 Kết luận sức khỏe |
| 109 | Bình thường | `BINH_THUONG` | Số | 1 | 1=Có, 0=Không |
| 110 | Có nguy cơ mắc lao (tiền sử tiếp xúc) | `NGUY_CO_MAC_LAO` | Số | 1 | 1=Có, 0=Không |
| 111 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 112 | Có vấn đề về sức khỏe | `VAN_DE_SUC_KHOE` | Số | 1 | 1=Có, 0=Không |
| 113 | Ghi rõ vấn đề sức khỏe | `GHI_RO_VAN_DE_SUC_KHOE` | Chuỗi | n | Ghi rõ các vấn đề sức khỏe (nếu có) |
| 114 | Tư vấn và hẹn khám lần sau | `TU_VAN_HEN_KHAM_LAN_SAU` | Chuỗi | n | Ghi nội dung tư vấn và lịch hẹn khám |
| 115 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 116 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `SINH_NON` (Chọn Có/Không)
   - `TUAN_THAI_KHI_SINH` (Số tuần thai)
   - `HO_TEN_NGUOI_DI_CUNG` / `SO_CCCD_NGUOI_DI_CUNG` (Thông tin người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "kham_mat": "Bình thường",
      "mo_ta_bat_thuong_mat": "Bình thường",
      "suy_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_co_xuong_than_kinh": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_11_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_11_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <SINH_NON>1</SINH_NON>
        <TUAN_THAI_KHI_SINH>1</TUAN_THAI_KHI_SINH>
        <GIOI_TINH>1</GIOI_TINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
        <TSBT_MA_BENH>0</TSBT_MA_BENH>
        <TSGD_MA_BENH>0</TSGD_MA_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <MACH>80</MACH>
        <CAN_NANG>60</CAN_NANG>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <KHAM_MAT>Bình thường</KHAM_MAT>
        <MO_TA_BAT_THUONG_MAT>Bình thường</MO_TA_BAT_THUONG_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_11_KSK>
```

---

## MẪU 12: 12.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 19 – dưới 24 tháng
**Đối tượng áp dụng:** Trẻ em định kỳ từ 12.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 19 – dưới 24 tháng

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Sinh non | `SINH_NON` | Số | 2 | 0: Không 1: Có 99: Không có thông tin<br>0: Không<br>1: Có<br>99: Không có thông tin |
| 4 | Tuần thai khi sinh | `TUAN_THAI_KHI_SINH` | Số | 2 | Ghi tuần thai khi sinh. 99: Không có thông tin<br>99: Không có thông tin |
| 5 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT 76 |
| 7 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 8 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào<br>7: Người sống tại vùng có điều kiện<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục<br>11: Học sinh trong các cơ sở giáo<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 9 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 10 | Nơi ở | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 12 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 13 | Họ tên người đi cùng trẻ | `HO_TEN_NGUOI_DI_CUNG` | Chuỗi | 255 |  |
| 14 | CMND / CCCD / HC / Định danh công dân người đi cùng trẻ | `SO_CCCD_NGUOI_DI_CUNG` | Chuỗi | n |  |
| 15 | Mối quan hệ với trẻ | `MOI_QUAN_HE_VOI_TRE` | Số | 1 | 1=Cha, 2=Mẹ, 3=Ông/Bà, 4=Anh/Chị, 5=Họ hàng, 9=Khác 77<br>5: Họ hàng, 9=Khác |
| 16 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT A Tiền sử 17 Tên bệnh tiền sử bản thân TSBT_MA_BENH Chuỗi 255 Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 18 | Tên bệnh cụ thể khi trong gia đình có người mắc | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 19 | Tiền sử tiếp xúc với người bệnh lao | `TIEN_SU_TIEP_XUC_LAO` | Số | 1 | 1=Có, 0=Không II Thông tin chung về cơ sở khám sức khỏe<br>1: Có, 0=Không |
| 20 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 21 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. |
| 22 | Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN | `MA_GTIN_CSKCB` | Chuỗi | 13 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 23 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Đánh giá dấu hiệu sinh tồn |
| 24 | Nhiệt độ (°C) | `NHIET_DO` | Chuỗi | 10 | Ghi nhiệt độ của trẻ tính theo độ C |
| 25 | Đánh giá dấu hiệu sinh tồn qua nhiệt độ | `DGDHST_NHIET_DO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 26 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 | Ghi mạch (nhịp tim) của đối tượng đến khám sức khỏe, theo định dạng "số - số". |
| 27 | Đánh giá dấu hiệu sinh tồn qua mạch | `DGDHST_MACH` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 28 | Nhịp thở | `NHIP_THO` | Chuỗi | 10 | Ghi nhịp thở (lần/phút) 78 |
| 29 | Đánh giá dấu hiệu sinh tồn qua nhịp thở | `DGDHST_NHIP_THO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường IV Đánh giá dinh dưỡng<br>1: Bình thường<br>2: Không bình thường |
| 30 | Chiều dài (cm) | `CHIEU_DAI` | Số | 10 | Ghi chiều dài của trẻ (cm) |
| 31 | Chiều dài / Tuổi (SD) | `CHIEU_DAI_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD chiều dài theo tuổi |
| 32 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 | Ghi cân nặng của đối tượng đến khám sức khỏe (kg) |
| 33 | Cân nặng / Tuổi (SD) | `CAN_NANG_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD cân nặng theo tuổi 34 Chu vi vòng cánh tay (mm) CHU_VI_VONG_CANH_TAY Số 10 Ghi chu vi vòng cánh tay giữa của trẻ (mm) — chỉ số phát hiện suy dinh dưỡng cấp |
| 35 | Vòng đầu (cm) | `VONG_DAU` | Số | 10 | Ghi chu vi vòng đầu của trẻ (cm) |
| 36 | Phù dinh dưỡng | `PHU_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 37 | Dấu hiệu thiếu máu | `DAU_HIEU_THIEU_MAU` | Số | 1 | 1=Có, 0=Không |
| 38 | Dấu hiệu còi xương | `DAU_HIEU_COI_XUONG` | Số | 1 | 1=Có, 0=Không |
| 39 | Suy dinh dưỡng | `SUY_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 40 | Thừa cân / béo phì | `THUA_CAN_BEO_PHI` | Số | 1 | 1=Có, 0=Không V Đánh giá phát triển tinh thần - vận động 41 Chỉ được một vài bộ phận trên cơ thể CHI_BO_PHAN_CO_THE Số 1 1=Có, 0=Không<br>1: Có, 0=Không |
| 42 | Ăn bằng thìa mà ít rơi vãi | `AN_THIA_IT_ROI_VAI` | Số | 1 | 1=Có, 0=Không |
| 43 | Biết hợp tác với bố mẹ trong các hoạt động hàng ngày | `HOP_TAC_HOAT_DONG_HANG_NGAY` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 44 | Trẻ bắt đầu tập chạy | `BAT_DAU_TAP_CHAY` | Số | 1 | 1=Có, 0=Không 45 Nói được một vài từ ghép (2 từ) có ý nghĩa, có chủ đích (uống nước, ăn cơm, đi chơi) NOI_TU_GHEP_2_TU Số 1 1=Có, 0=Không 46 Làm được yêu cầu 1 hoặc 2 hành động liên tiếp theo yêu cầu của người khác LAM_THEO_YEU_CAU_1_2_BUOC Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 47 | Đi lùi 2 bước mà không cần trợ giúp | `DI_LUI_2_BUOC` | Số | 1 | 1=Có, 0=Không 79<br>1: Có, 0=Không |
| 48 | Biết cho đồ vật vào hộp hoặc lọ có miệng nhỏ | `CHO_DO_VAT_VAO_HOP` | Số | 1 | 1=Có, 0=Không VI Đánh giá tiêm chủng<br>1: Có, 0=Không |
| 49 | Viêm gan B mũi 1 (sơ sinh) | `TIEM_CHUNG_VGB_SS_MUI1` | Số | 1 | 1=Có, 0=Không |
| 50 | Lao BCG (sơ sinh) | `TIEM_CHUNG_BCG_SS` | Số | 1 | 1=Có, 0=Không |
| 51 | Vắc xin 5 trong 1 mũi 1 | `TIEM_CHUNG_5IN1_MUI1` | Số | 1 | 1=Có, 0=Không |
| 52 | Vắc xin 5 trong 1 mũi 2 | `TIEM_CHUNG_5IN1_MUI2` | Số | 1 | 1=Có, 0=Không |
| 53 | Vắc xin 5 trong 1 mũi 3 | `TIEM_CHUNG_5IN1_MUI3` | Số | 1 | 1=Có, 0=Không |
| 54 | Uống vắc xin bại liệt lần 1 | `TIEM_CHUNG_BAI_LIET_L1` | Số | 1 | 1=Có, 0=Không |
| 55 | Uống vắc xin bại liệt lần 2 | `TIEM_CHUNG_BAI_LIET_L2` | Số | 1 | 1=Có, 0=Không |
| 56 | Uống vắc xin bại liệt lần 3 | `TIEM_CHUNG_BAI_LIET_L3` | Số | 1 | 1=Có, 0=Không |
| 57 | Tiêm vắc xin bại liệt IPV | `TIEM_CHUNG_BAI_LIET_IPV` | Số | 1 | 1=Có, 0=Không |
| 58 | Vắc xin Sởi đơn (9 tháng) | `TIEM_CHUNG_SOI_DON` | Số | 1 | 1=Có, 0=Không |
| 59 | Viêm não Nhật Bản mũi 1 | `TIEM_CHUNG_VNNB_MUI1` | Số | 1 | 1=Có, 0=Không |
| 60 | Viêm não Nhật Bản mũi 2 | `TIEM_CHUNG_VNNB_MUI2` | Số | 1 | 1=Có, 0=Không |
| 61 | Vắc xin 5 trong 1 mũi 4 (18 tháng) | `TIEM_CHUNG_5IN1_MUI4` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 62 | Sởi- Rubella | `TIEM_CHUNG_SOI_RUBELLA` | Số | 1 | 1=Có, 0=Không |
| 63 | Vắc xin khác (ghi rõ) | `TIEM_CHUNG_KHAC` | Chuỗi | 255 |  |
| 64 | Tư vấn tiêm chủng | `TU_VAN_TIEM_CHUNG` | Chuỗi | n | VII Khám lâm sàng A Da |
| 65 | Màu sắc da | `MAU_SAC_DA` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 66 | Lòng bàn tay | `LONG_BAN_TAY` | Số | 1 | 1=Không nhợt (bình thường), 2=Nhợt |
| 67 | Mô tả bất thường da | `MO_TA_BAT_THUONG_DA` | Chuỗi | n | B Đầu - cổ B.1 Khám đầu - cổ |
| 68 | Thóp | `THOP` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 69 | Kích thước và hình dạng đầu | `HINH_DANG_DAU` | Số | 1 | 1=Bình thường, 0=Không bình thường 80 |
| 70 | Khối bất thường đầu cổ | `KHOI_BAT_THUONG_DAU_CO` | Số | 1 | 0=Không, 1=Có |
| 71 | Mô tả khối bất thường đầu cổ | `MO_TA_KHOI_BAT_THUONG_DAU_CO` | Chuỗi | n | B.2 Khám mắt |
| 72 | Mí mắt và kết mạc | `MI_MAT_KET_MAC` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 73 | Rung giật nhãn cầu/lác/vận động mắt | `KHAM_MAT` | Số | 1 | 0=Không, 1=Có bất thường<br>0: Không, 1=Có bất thường |
| 74 | Đồng tử | `DONG_TU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 75 | Mô tả bất thường mắt | `MO_TA_BAT_THUONG_MAT` | Chuỗi | n | B.3 Khám tai |
| 76 | Tai và Màng nhĩ | `TAI_MANG_NHI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 77 | Khối sưng sau tai | `KHOI_SUNG_SAU_TAI` | Số | 1 | 0=Không, 1=Có |
| 78 | Chảy mủ/nước tai | `CHAY_MU_NUOC_TAI` | Số | 1 | 0=Không, 1=Có |
| 79 | Mô tả bất thường tai | `MO_TA_BAT_THUONG_TAI` | Chuỗi | n | B.4 Khám mũi họng |
| 80 | Khám mũi họng | `HINH_DANG_MUI_HONG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 81 | Mô tả bất thường mũi họng | `MO_TA_BAT_THUONG_MUI_HONG` | Chuỗi | n | B.5 Khám miệng |
| 82 | Khám miệng | `HINH_DANG_MIENG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 83 | Mô tả bất thường miệng | `MO_TA_BAT_THUONG_MIENG` | Chuỗi | n | C Hô hấp |
| 84 | Dấu hiệu suy hô hấp | `SUY_HO_HAP` | Số | 1 | 0=Không, 1=Có |
| 85 | Tiếng thở bất thường | `TIENG_THO_BAT_THUONG` | Số | 1 | 0=Không, 1=Có |
| 86 | Nghe phổi | `NGHE_PHOI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 87 | Mô tả bất thường hô hấp | `MO_TA_BAT_THUONG_HO_HAP` | Chuỗi | n | D Tim mạch |
| 88 | Vị trí mỏm tim | `VI_TRI_MOM_TIM` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 89 | Mạch ngoại vi | `MACH_NGOAI_VI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 90 | Nghe tim | `TIENG_TIM` | Số | 1 | 0=Không bất thường, 1=Có bất thường 81 |
| 91 | Mô tả bất thường tim mạch | `MO_TA_BAT_THUONG_TIM_MACH` | Chuỗi | n | E Bụng và cơ quan sinh dục |
| 92 | Hình dáng bụng, rốn | `HINH_DANG_BUNG_RON` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 93 | Gan, lách to | `GAN_LACH_TO` | Số | 1 | 0=Không, 1=Có |
| 94 | Khối bất thường bụng | `KHOI_BAT_THUONG_BUNG` | Số | 1 | 0=Không, 1=Có |
| 95 | Cơ quan sinh dục ngoài | `CO_QUAN_SINH_DUC_NGOAI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 96 | Mô tả bất thường bụng sinh dục | `MO_TA_BAT_THUONG_BUNG_SINH_DUC` | Chuỗi | n | F Cơ xương và thần kinh |
| 97 | Vận động không đối xứng | `VAN_DONG_KHONG_DOI_XUNG` | Số | 1 | 0=Không, 1=Có |
| 98 | Trương lực cơ bất thường | `TRUONG_LUC_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 99 | Phản xạ cơ | `PHAN_XA_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 100 | Kiểm tra lưng | `KIEM_TRA_LUNG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 101 | Khám tứ chi và khớp | `TU_CHI_KHOP` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 102 | Quan sát dáng đi | `QUAN_SAT_DANG_DI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 103 | Mô tả bất thường cơ xương thần kinh | `MO_TA_BAT_THUONG_CO_XUONG_THAN_KINH` | Chuỗi | n | VIII Kết luận và tư vấn Kết luận sức khỏe |
| 104 | Bình thường | `BINH_THUONG` | Số | 1 | 1=Có, 0=Không |
| 105 | Có nguy cơ mắc lao (tiền sử tiếp xúc) | `NGUY_CO_MAC_LAO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 106 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 107 | Có vấn đề về sức khỏe | `VAN_DE_SUC_KHOE` | Số | 1 | 1=Có, 0=Không |
| 108 | Ghi rõ vấn đề sức khỏe | `GHI_RO_VAN_DE_SUC_KHOE` | Chuỗi | n | Ghi rõ các vấn đề sức khỏe (nếu có) |
| 109 | Tư vấn và hẹn khám lần sau | `TU_VAN_HEN_KHAM_LAN_SAU` | Chuỗi | n | Ghi nội dung tư vấn và lịch hẹn khám |
| 110 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n | 82 |
| 111 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `SINH_NON` (Chọn Có/Không)
   - `TUAN_THAI_KHI_SINH` (Số tuần thai)
   - `HO_TEN_NGUOI_DI_CUNG` / `SO_CCCD_NGUOI_DI_CUNG` (Thông tin người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "mi_mat_ket_mac": "Bình thường",
      "kham_mat": "Bình thường",
      "mo_ta_bat_thuong_mat": "Bình thường",
      "suy_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_co_xuong_than_kinh": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_12_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_12_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <SINH_NON>1</SINH_NON>
        <TUAN_THAI_KHI_SINH>1</TUAN_THAI_KHI_SINH>
        <GIOI_TINH>1</GIOI_TINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
        <TSGD_MA_BENH>0</TSGD_MA_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <MACH>80</MACH>
        <CAN_NANG>60</CAN_NANG>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <MI_MAT_KET_MAC>Bình thường</MI_MAT_KET_MAC>
        <KHAM_MAT>Bình thường</KHAM_MAT>
        <MO_TA_BAT_THUONG_MAT>Bình thường</MO_TA_BAT_THUONG_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_12_KSK>
```

---

## MẪU 13: 13.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 2 – dưới 6 tuổi
**Đối tượng áp dụng:** Trẻ em định kỳ từ 13.  Mẫu sổ khám sức khỏe định kỳ cho trẻ 2 – dưới 6 tuổi

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Sinh non | `SINH_NON` | Số | 2 | 0: Không 1: Có 99: Không có thông tin<br>0: Không<br>1: Có<br>99: Không có thông tin |
| 4 | Tuần thai khi sinh | `TUAN_THAI_KHI_SINH` | Số | 2 | Ghi tuần thai khi sinh. 99: Không có thông tin<br>99: Không có thông tin |
| 5 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 7 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 8 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non 83 Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng<br>7: Người sống tại vùng có điều<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục<br>11: Học sinh trong các cơ sở<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 9 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 10 | Nơi ở | `DIA_CHI` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Mã Tỉnh | `MATINH_CU_TRU` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 12 | Mã Xã | `MAXA_CU_TRU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 13 | Họ tên người đi cùng trẻ | `HO_TEN_NGUOI_DI_CUNG` | Chuỗi | 255 |  |
| 14 | CMND / CCCD / HC / Định danh công dân người đi cùng trẻ | `SO_CCCD_NGUOI_DI_CUNG` | Chuỗi | n |  |
| 15 | Mối quan hệ với trẻ | `MOI_QUAN_HE_VOI_TRE` | Số | 1 | 1=Cha, 2=Mẹ, 3=Ông/Bà, 4=Anh/Chị, 5=Họ hàng, 9=Khác<br>4: Anh/Chị, 5=Họ hàng, 9=Khác |
| 16 | Điện thoại | `DIEN_THOAI` | Chuỗi | 15 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT A Tiền sử |
| 17 | Tên bệnh tiền sử bản thân | `TSBT_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử bản thân theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 18 | Tên bệnh cụ thể khi trong gia đình có người mắc | `TSGD_MA_BENH` | Chuỗi | 255 | Ghi mã các bệnh tiền sử gia đình theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". 84 |
| 19 | Tiền sử tiếp xúc với người bệnh lao | `TIEN_SU_TIEP_XUC_LAO` | Số | 1 | 1=Có, 0=Không II Thông tin chung về cơ sở khám sức khỏe |
| 20 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 21 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. |
| 22 | Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN | `MA_GTIN_CSKCB` | Chuỗi | 13 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 23 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Đánh giá dấu hiệu sinh tồn |
| 24 | Nhiệt độ (°C) | `NHIET_DO` | Chuỗi | 10 | Ghi nhiệt độ của trẻ tính theo độ C |
| 25 | Đánh giá dấu hiệu sinh tồn qua nhiệt độ | `DGDHST_NHIET_DO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 26 | Mạch (lần/phút) | `MACH` | Chuỗi | 100 | Ghi mạch (nhịp tim) của đối tượng đến khám sức khỏe, theo định dạng "số - số". |
| 27 | Đánh giá dấu hiệu sinh tồn qua mạch | `DGDHST_MACH` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường<br>1: Bình thường<br>2: Không bình thường |
| 28 | Nhịp thở | `NHIP_THO` | Chuỗi | 10 | Ghi nhịp thở (lần/phút) |
| 29 | Đánh giá dấu hiệu sinh tồn qua nhịp thở | `DGDHST_NHIP_THO` | Số | 1 | Mã 1: Bình thường Mã 2: Không bình thường IV Đánh giá dinh dưỡng<br>1: Bình thường<br>2: Không bình thường |
| 30 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 | Ghi chiều cao của trẻ (cm) |
| 31 | Chiều cao/Tuổi SD | `CHIEU_CAO_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD chiều cao theo tuổi |
| 32 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 | Ghi cân nặng của đối tượng đến khám sức khỏe (kg) |
| 33 | Cân nặng/Tuổi SD | `CAN_NANG_TUOI_SD` | Chuỗi | 10 | Ghi chỉ số SD cân nặng theo tuổi |
| 34 | Phù dinh dưỡng | `PHU_DINH_DUONG` | Số | 1 | 1=Có, 0=Không |
| 35 | Suy dinh dưỡng | `SUY_DINH_DUONG` | Số | 1 | 1=Có, 0=Không 85 |
| 36 | Thừa cân / béo phì | `THUA_CAN_BEO_PHI` | Số | 1 | 1=Có, 0=Không V Đánh giá phát triển tinh thần - vận động A Trẻ từ 2 đến dưới 3 tuổi 37 Thực hiện được 2-3 yêu cầu liên tiếp (VD: lấy dép và đội mũ/cởi mũ, cởi giày và cất dép lên kệ) LAM_THEO_YEU_CAU_2_3_BUOC Số 1 1=Có, 0=Không<br>VD: lấy dép và đội mũ/cởi mũ, cởi<br>1: Có, 0=Không |
| 38 | Nhận biết các hình, đồ vật, bộ phận cơ thể theo yêu cầu | `NHAN_BIET_HINH_VAT` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 39 | Nói được câu khoảng 4-5 từ; Biết nói tên, tuổi của trẻ | `NOI_CAU_4_5_TU_TEN_TUOI` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 40 | Chơi các trò chơi bắt chước (chơi nấu ăn, cho búp bê ăn,...) | `CHOI_TRO_CHOI_BAT_CHUOC` | Số | 1 | 1=Có, 0=Không 41 Vịn cầu thang để bước lên các bậc, nhảy bật lên phía trước bằng cả 2 chân VIN_CAU_THANG_VA_NHAY_BAT Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 42 | Đứng một chân khoảng 1 giây mà không cần vịn | `DUNG_MOT_CHAN_1_GIAY` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 43 | Cầm được bút vẽ đường thẳng, hình tròn; tô màu; cầm kéo cắt giấy | `CAM_BUT_VE_VA_CAT_GIAY` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 44 | Mở được nắp chai nước, vặn nắm cửa. Lật, mở từng trang sách | `MO_NAP_VAN_CUA_LAT_SACH` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 45 | Trẻ có thể dùng muỗng, thìa để tự ăn | `TU_XUC_AN_BANG_THIA` | Số | 1 | 1=Có, 0=Không |
| 46 | Tập trung nghe nhạc hoặc nghe đọc truyện trong thời gian từ 5-10 phút | `TAP_TRUNG_NGHE_5_10_PHUT` | Số | 1 | 1=Có, 0=Không B Trẻ từ 3 đến dưới 4 tuổi 47 Thực hiện được yêu cầu làm 3 hoạt động không liên quan (VD: cất đồ chơi vào thùng; đội mũ; đưa đồ vật cho bố mẹ) LAM_3_YEU_CAU_KHONG_LIEN_QUAN Số 1 1=Có, 0=Không 48 Nói được câu dài, bắt đầu thích kể chuyện (VD: Con đi chơi công viên; Con muốn ôm mẹ) NOI_CAU_DAI_KE_CHUYEN Số 1 1=Có, 0=Không 49 Hỏi và trả lời được nhiều câu hỏi (VD: Tại sao? Con muốn đi đâu? Con muốn ăn gì?) HOI_VA_TRA_LOI_CAU_HOI Số 1 1=Có, 0=Không 86<br>1: Có, 0=Không<br>VD: cất đồ<br>1: Có, 0=Không<br>VD: Con đi chơi công viên;<br>1: Có, 0=Không<br>VD: Tại sao? Con muốn đi đâu?<br>1: Có, 0=Không |
| 50 | Biết so sánh và đưa ra sự khác biệt (to hơn- nhỏ hơn; đẹp hơn- xấu hơn) | `SO_SANH_SU_KHAC_BIET` | Số | 1 | 1=Có, 0=Không 51 Đứng yên bằng 1 chân khoảng 5 giây; tự tin lên xuống cầu thang bằng 2 chân, nhảy lò cò DUNG_1_CHAN_5_GIAY_NHAY_LO_CO Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>1: Có, 0=Không |
| 52 | Có thể cài hoặc mở khuy áo, kéo khoá kéo, rửa tay | `CAI_CUC_KEO_KHOA_RUA_TAY` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 53 | Có thể cầm kéo, nặn, tô màu theo hình | `CAM_KEO_NAN_TO_MAU_THEO_HINH` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 54 | Trẻ tự ăn uống bằng thìa/ muỗng; có thể tự lấy thức ăn không làm rơi vãi | `TU_AN_UONG_KHONG_ROI_VAI` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 55 | Tự mặc và cởi quần áo không cần hỗ trợ | `TU_MAC_COI_QUAN_AO` | Số | 1 | 1=Có, 0=Không 56 Nói đúng được các thông tin của bản thân: tên, tuổi, tên bố mẹ; số điện thoại NOI_THONG_TIN_CA_NHAN Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>n: tên, tuổi, tên bố mẹ; số điện<br>1: Có, 0=Không |
| 57 | Thể hiện cảm xúc rõ ràng và biết an ủi ngưới khác khi họ buồn, lo lắng | `THE_HIEN_CAM_XUC_AN_UI` | Số | 1 | 1=Có, 0=Không C Trẻ từ 4 đến dưới 5 tuổi 58 Có thể đếm to hoặc đếm bằng ngón tay khi được hỏi (VD: có bao nhiêu quả táo trên bàn) DEM_TO_HOAC_DEM_NGON_TAY Số 1 1=Có, 0=Không<br>1: Có, 0=Không<br>VD: có bao nhiêu<br>1: Có, 0=Không |
| 59 | Nói những câu hoàn chỉnh | `NOI_CAU_HOAN_CHINH` | Số | 1 | 1=Có, 0=Không |
| 60 | Biết ném và bắt bóng | `NEM_VA_BAT_BONG` | Số | 1 | 1=Có, 0=Không |
| 61 | Có thể nhảy lò cò bằng 1 chân | `NHAY_LO_CO_1_CHAN` | Số | 1 | 1=Có, 0=Không |
| 62 | Tự mặc và cởi quần áo không cần hỗ trợ nhiều | `TU_MAC_COI_QUAN_AO_IT_HO_TRO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 63 | Hầu như luôn vâng lời người lớn | `HAU_NHU_VANG_LOI_NGUOI_LON` | Số | 1 | 1=Có, 0=Không |
| 64 | Có thể tách rời bố mẹ hoặc người chăm sóc | `TACH_ROI_BO_ME` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 65 | Kể lại được câu chuyện khi được nghe nhiều lần | `KE_LAI_CHUYEN_NGHE_NHIEU_LAN` | Số | 1 | 1=Có, 0=Không D Trẻ từ 5 đến dưới 6 tuổi<br>1: Có, 0=Không |
| 66 | Biết họ tên đầy đủ, tuổi, giới tính, địa chỉ nhà | `BIET_THONG_TIN_DAY_DU` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 67 | Nói rõ ràng, sử dụng câu dài và kể lại sự việc chi tiết | `NOI_RO_RANG_KE_CHI_TIET` | Số | 1 | 1=Có, 0=Không 87<br>1: Có, 0=Không |
| 68 | Hiểu và làm theo nhiều hướng dẫn liên tiếp (4-5 bước) | `LAM_THEO_YEU_CAU_4_5_BUOC` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 69 | Nhận biết chữ cái, con số; có thể viết tên mình | `BIET_CHU_SO_VIET_TEN` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 70 | Đếm được đến 20 trở lên | `DEM_DEN_20_TRO_LEN` | Số | 1 | 1=Có, 0=Không |
| 71 | Vẽ người với nhiều chi tiết (tay, chân, quần áo, tóc...) | `VE_NGUOI_NHIEU_CHI_TIET` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 72 | Biết tự chăm sóc bản thân: mặc quần áo, đánh răng, buộc dây giày | `TU_CHAM_SOC_BAN_THAN` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 73 | Vận động: chạy nhanh, nhảy xa, ném - bắt bóng tốt, đi thăng bằng | `VAN_DONG_PHUC_TAP_TOT` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 74 | Biết chơi trò chơi tập thể, tuân thủ luật lệ, chờ đến lượt | `CHOI_TAP_THE_TUAN_THU_LUAT` | Số | 1 | 1=Có, 0=Không VI Đánh giá tiêm chủng<br>1: Có, 0=Không |
| 75 | Bạch hầu - Ho gà - Uốn ván- Bại liệt (nhắc lại) | `TIEM_CHUNG_BHUB` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 76 | Sởi - Quai bị- Rubella (nhắc lại) | `TIEM_CHUNG_SQR` | Số | 1 | 1=Có, 0=Không |
| 77 | Viêm gan B (nhắc lại) | `TIEM_CHUNG_VGB` | Số | 1 | 1=Có, 0=Không |
| 78 | Viêm não Nhật Bản B (nhắc lại) | `TIEM_CHUNG_VNNBB` | Số | 1 | 1=Có, 0=Không |
| 79 | Thuỷ đậu | `TIEM_CHUNG_THUY_DAU` | Số | 1 | 1=Có, 0=Không |
| 80 | Cúm mùa | `TIEM_CHUNG_CUM_MUA` | Số | 1 | 1=Có, 0=Không |
| 81 | Vắc xin khác (ghi rõ) | `TIEM_CHUNG_KHAC` | Chuỗi | 255 |  |
| 82 | Tư vấn tiêm chủng | `TU_VAN_TIEM_CHUNG` | Chuỗi | 1024 | VII Khám lâm sàng A Da |
| 83 | Màu sắc da | `MAU_SAC_DA` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 84 | Lòng bàn tay | `LONG_BAN_TAY` | Số | 1 | 1=Không nhợt (bình thường), 2=Nhợt Bất thường về da |
| 85 | Chàm | `CHAM` | Số | 1 | 1=Có, 0=Không |
| 86 | Ghẻ | `GHE` | Số | 1 | 1=Có, 0=Không |
| 87 | Nấm | `NAM` | Số | 1 | 1=Có, 0=Không 88 |
| 88 | Bướu máu | `BUOU_MAU` | Số | 1 | 1=Có, 0=Không |
| 89 | Dấu xuất huyết | `DAU_XUAT_HUYET` | Số | 1 | 1=Có, 0=Không |
| 90 | Mô tả bất thường da | `MO_TA_BAT_THUONG_DA` | Chuỗi | 1024 | B Đầu - cổ B.1 Khám đầu - cổ |
| 91 | Tóc | `TOC` | Số | 1 | 1=Bình thường, 0=Rụng tóc |
| 92 | Kích thước và hình dạng đầu | `HINH_DANG_DAU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 93 | Khối bất thường đầu cổ | `KHOI_BAT_THUONG_DAU_CO` | Số | 1 | 0=Không, 1=Có |
| 94 | Mô tả khối bất thường đầu cổ | `MO_TA_KHOI_BAT_THUONG_DAU_CO` | Chuỗi | 1024 | B.2 Khám mắt |
| 95 | Mí mắt và kết mạc | `MI_MAT_KET_MAC` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 96 | Lác mắt | `LAC_MAT` | Số | 1 | 0=Không, 1=Có |
| 97 | Không nhìn theo đồ vật | `KHONG_NHIN_THEO_DO_VAT` | Số | 1 | 0=Không, 1=Có |
| 98 | Đồng tử | `DONG_TU` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 99 | Mô tả bất thường mắt | `MO_TA_BAT_THUONG_MAT` | Chuỗi | n | B.3 Khám tai |
| 100 | Tai và màng nhĩ | `TAI_MANG_NHI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 101 | Đáp ứng với âm thanh | `DAP_UNG_AM_THANH` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 102 | Khối sưng sau tai | `KHOI_SUNG_SAU_TAI` | Số | 1 | 0=Không, 1=Có |
| 103 | Chảy mủ/nước tai | `CHAY_MU_NUOC_TAI` | Số | 1 | 0=Không, 1=Có |
| 104 | Mô tả bất thường tai | `MO_TA_BAT_THUONG_TAI` | Chuỗi | n | B.4 Khám mũi họng |
| 105 | Chảy nước mũi | `CHAY_NUOC_MUI` | Số | 1 | 0=Không, 1=Có |
| 106 | Nghẹt mũi | `NGHET_MUI` | Số | 1 | 0=Không, 1=Có |
| 107 | Họng | `HONG` | Số | 1 | 1=Bình thường, 0=Không bình thường 89 |
| 108 | Mô tả bất thường mũi họng | `MO_TA_BAT_THUONG_MUI_HONG` | Chuỗi | n | B.5 Bất thường răng miệng |
| 109 | Nấm miệng | `NAM_MIENG` | Số | 1 | 0=Không, 1=Có |
| 110 | Vết sâu, mảng bám, lỗ trên răng | `SAU_MANG_BAM_LO` | Số | 1 | 0=Không, 1=Có |
| 111 | Vết loét ở niêm mặc miệng | `LOET_NIEM_MAC` | Số | 1 | 0=Không, 1=Có |
| 112 | Mô tả bất thường miệng | `MO_TA_BAT_THUONG_MIENG` | Chuỗi | n | C Hô hấp |
| 113 | Dấu hiệu suy hô hấp | `SUY_HO_HAP` | Số | 1 | 0=Không, 1=Có |
| 114 | Tiếng thở bất thường | `TIENG_THO_BAT_THUONG` | Số | 1 | 0=Không, 1=Có |
| 115 | Nghe phổi | `NGHE_PHOI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 116 | Mô tả bất thường hô hấp | `MO_TA_BAT_THUONG_HO_HAP` | Chuỗi | n | D Tim mạch |
| 117 | Vị trí mỏm tim | `VI_TRI_MOM_TIM` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 118 | Mạch ngoại vi | `MACH_NGOAI_VI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 119 | Nghe tim | `TIENG_TIM` | Số | 1 | 0=Không bất thường, 1=Có bất thường |
| 120 | Mô tả bất thường tim mạch | `MO_TA_BAT_THUONG_TIM_MACH` | Chuỗi | n | E Bụng và cơ quan sinh dục |
| 121 | Hình dáng bụng, rốn | `HINH_DANG_BUNG_RON` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 122 | Gan, lách to | `GAN_LACH_TO` | Số | 1 | 0=Không, 1=Có |
| 123 | Khối bất thường bụng | `KHOI_BAT_THUONG_BUNG` | Số | 1 | 0=Không, 1=Có |
| 124 | Táo bón | `TAO_BON` | Số | 1 | 0=Không, 1=Có |
| 125 | Tiêu chảy kéo dài | `TIEU_CHAY_KEO_DAI` | Số | 1 | 0=Không, 1=Có |
| 126 | Cơ quan sinh dục ngoài | `CO_QUAN_SINH_DUC_NGOAI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 127 | Mô tả bất thường bụng sinh dục | `MO_TA_BAT_THUONG_BUNG_SINH_DUC` | Chuỗi | n | F Cơ xương và thần kinh 90 |
| 128 | Vận động không đối xứng | `VAN_DONG_KHONG_DOI_XUNG` | Số | 1 | 0=Không, 1=Có |
| 129 | Trương lực cơ bất thường | `TRUONG_LUC_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 130 | Phản xạ cơ | `PHAN_XA_CO` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 131 | Kiểm tra lưng | `KIEM_TRA_LUNG` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 132 | Khám tứ chi và khớp | `TU_CHI_KHOP` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 133 | Quan sát dáng đi | `QUAN_SAT_DANG_DI` | Số | 1 | 1=Bình thường, 0=Không bình thường |
| 134 | Mô tả bất thường cơ xương thần kinh | `MO_TA_BAT_THUONG_CO_XUONG_THAN_KINH` | Chuỗi | n | VIII Kết luận và tư vấn Kết luận sức khỏe |
| 135 | Bình thường | `BINH_THUONG` | Số | 1 | 1=Có, 0=Không |
| 136 | Có nguy cơ mắc lao (tiền sử tiếp xúc) | `NGUY_CO_MAC_LAO` | Số | 1 | 1=Có, 0=Không<br>1: Có, 0=Không |
| 137 | Kết luận bệnh | `KET_LUAN_BENH` | Chuỗi | 255 | Ghi mã bệnh theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". |
| 138 | Có vấn đề về sức khỏe | `VAN_DE_SUC_KHOE` | Số | 1 | 1=Có, 0=Không |
| 139 | Ghi rõ vấn đề sức khỏe | `GHI_RO_VAN_DE_SUC_KHOE` | Chuỗi | n | Ghi rõ các vấn đề sức khỏe (nếu có) |
| 140 | Tư vấn và hẹn khám lần sau | `TU_VAN_HEN_KHAM_LAN_SAU` | Chuỗi | n | Ghi nội dung tư vấn và lịch hẹn khám |
| 141 | Chữ ký số người kết luận | `CKS_NGUOI_KET_LUAN` | Chuỗi | n |  |
| 142 | Chữ ký số CSKB | `CKS_BENH_VIEN` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `SINH_NON` (Chọn Có/Không)
   - `TUAN_THAI_KHI_SINH` (Số tuần thai)
   - `HO_TEN_NGUOI_DI_CUNG` / `SO_CCCD_NGUOI_DI_CUNG` (Thông tin người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "noi_ro_rang_ke_chi_tiet": "Bình thường",
      "mi_mat_ket_mac": "Bình thường",
      "lac_mat": "Bình thường",
      "mo_ta_bat_thuong_mat": "Bình thường",
      "suy_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_ho_hap": "Bình thường",
      "mo_ta_bat_thuong_co_xuong_than_kinh": "Bình thường"
    },
    "extra": {
      "tach_roi_bo_me": "Sample_Value"
    }
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_13_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_13_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <SINH_NON>1</SINH_NON>
        <TUAN_THAI_KHI_SINH>1</TUAN_THAI_KHI_SINH>
        <GIOI_TINH>1</GIOI_TINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <DIA_CHI>Sample</DIA_CHI>
        <MATINH_CU_TRU>Sample</MATINH_CU_TRU>
        <MAXA_CU_TRU>Sample</MAXA_CU_TRU>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
        <TSBT_MA_BENH>0</TSBT_MA_BENH>
        <TSGD_MA_BENH>0</TSGD_MA_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <MACH>80</MACH>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU>Bình thường</MATINH_CU_TRU>
        <NOI_RO_RANG_KE_CHI_TIET>Bình thường</NOI_RO_RANG_KE_CHI_TIET>
        <MI_MAT_KET_MAC>Bình thường</MI_MAT_KET_MAC>
        <LAC_MAT>Bình thường</LAC_MAT>
        <MO_TA_BAT_THUONG_MAT>Bình thường</MO_TA_BAT_THUONG_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
        <KET_LUAN_BENH>Đủ sức khỏe</KET_LUAN_BENH>
        <CKS_NGUOI_KET_LUAN>Base64SignatureText</CKS_NGUOI_KET_LUAN>
        <CKS_BENH_VIEN>Base64SignatureText</CKS_BENH_VIEN>
    </KET_LUAN>
</MAU_13_KSK>
```

---

## MẪU 14: 14.  Mẫu sổ khám sức khỏe định kỳ cho học sinh từ 3 tháng - Dưới 6T
**Đối tượng áp dụng:** Học sinh định kỳ cấp học từ 3 tháng - Dưới 6T

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 4 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 5 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 6 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân<br>7: Người sống tại vùng có điều kiện<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm<br>11: Học sinh trong các cơ sở giáo dục<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 7 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 8 | Họ tên bố hoặc người giám hộ | `HO_TEN_NGH_BO` | Chuỗi | 255 | 92 9 CMND / CCCD / HC / Định danh công dân bố hoặc người giám hộ SO_CCCD_NGH_BO Chuỗi n |
| 10 | Nghề nghiệp của bố hoặc người giám hộ | `MA_NGHE_NGHIEP_NGH_BO` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 11 | Điện thoại của bố hoặc người giám hộ | `DIEN_THOAI_NGH_BO` | Chuỗi | 15 |  |
| 12 | Nơi ở hiện tại của bố hoặc người giám hộ | `DIA_CHI_NGH_BO` | Chuỗi | 1024 |  |
| 13 | Mã Tỉnh của bố hoặc người giám hộ | `MATINH_CU_TRU_NGH_BO` | Chuỗi | 3 |  |
| 14 | Mã Xã của bố hoặc người giám hộ | `MAXA_CU_TRU_NGH_BO` | Chuỗi | 5 |  |
| 15 | Họ tên mẹ hoặc người giám hộ | `HO_TEN_NGH_ME` | Chuỗi | 255 | 16 CMND / CCCD / HC / Định danh công dân mẹ hoặc người giám hộ SO_CCCD_NGH_ME Chuỗi n |
| 17 | Nghề nghiệp của mẹ hoặc người giám hộ | `MA_NGHE_NGHIEP_NGH_ME` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 18 | Điện thoại của mẹ hoặc người giám hộ | `DIEN_THOAI_NGH_ME` | Chuỗi | 15 |  |
| 19 | Nơi ở hiện tại của mẹ hoặc người giám hộ | `DIA_CHI_NGH_ME` | Chuỗi | 1024 |  |
| 20 | Mã Tỉnh của mẹ hoặc người giám hộ | `MATINH_CU_TRU_NGH_ME` | Chuỗi | 3 |  |
| 21 | Mã Xã của mẹ hoặc người giám hộ | `MAXA_CU_TRU_NGH_ME` | Chuỗi | 5 |  |
| 22 | Con thứ mấy | `CON_THU_MAY` | Số | 2 |  |
| 23 | Tổng số con trong gia đình | `TONG_SO_CON` | Số | 2 | A Tiền sử sức khỏe bản thân A.1 Sản khoa |
| 24 | Sản khoa | `SAN_KHOA` | Số | 1 | Mã “0”: Không Mã “1”: Bình thường<br>1: Bình thường |
| 25 | Tên bệnh gây ra sản khoa không bình thường | `BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG` | Số | 1 | Mã "1": Đẻ thiếu tháng Mã "2": Đẻ thừa tháng 93 Mã "3": Đẻ có can thiệp Mã "4": Đẻ ngạt<br>1: Đẻ thiếu tháng<br>2: Đẻ thừa tháng<br>3: Đẻ có can thiệp<br>4: Đẻ ngạt |
| 26 | Mẹ bị bệnh trong thời kỳ mang thai | `ME_BI_BENH_TRONG_THOI_KY_MANG_THAI` | Số | 1 | Mã "0": Không Mã "1": Có<br>0: Không<br>1: Có |
| 27 | Ghi rõ tên bệnh của mẹ trong thời kỳ mang thai | `BENH_TRONG_THOI_KY_MANG_THAI` | Chuỗi | 255 | Ghi các bệnh của mẹ trong thời kỳ mang thai theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy "";""." A.2 Tiền sử bệnh/tật |
| 28 | Tiền sử bệnh/tật | `MA_BENH` | Số | 1 | Mã “0”: Không bệnh Mã “1”: Hen Mã “2”: Động kinh Mã “3”: Dị ứng Mã “4”: Tim bẩm sinh A.3 Tiêm chủng<br>0: Không bệnh<br>1: Hen<br>2: Động kinh<br>3: Dị ứng<br>4: Tim bẩm sinh |
| 29 | BCG | `TIEM_CHUNG_BCG` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 30 | Vắc xin bạch hầu, ho gà, uốn ván mũi 1 | `TIEM_CHUNG_BH_HG_UV_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 31 | Vắc xin bạch hầu, ho gà, uốn ván mũi 2 | `TIEM_CHUNG_BH_HG_UV_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 32 | Vắc xin bạch hầu, ho gà, uốn ván mũi 3 | `TIEM_CHUNG_BH_HG_UV_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 33 | Vắc xin bại liệt lần 1 | `TIEM_CHUNG_BAI_LIET_L1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 34 | Vắc xin bại liệt lần 2 | `TIEM_CHUNG_BAI_LIET_L2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 35 | Vắc xin bại liệt lần 3 | `TIEM_CHUNG_BAI_LIET_L3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 39 | Vắc xin Sởi | `TIEM_CHUNG_SOI` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 40 | Vắc xin viêm não Nhật Bản mũi 1 | `TIEM_CHUNG_VNNB_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ 94<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 41 | Vắc xin viêm não Nhật Bản mũi 2 | `TIEM_CHUNG_VNNB_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 42 | Vắc xin viêm não Nhật Bản mũi 3 | `TIEM_CHUNG_VNNB_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 43 | Vắc xin khác (ghi rõ) | `TIEM_CHUNG_KHAC` | Chuỗi | 255 | Ghi rõ tên vắc xin khác (nếu có) |
| 44 | Hiện tại có đang điều trị bệnh gì không? | `CO_DANG_DIEU_TRI_BENH` | Số | 1 | Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 45 | Cụ thể tên bệnh đang điều trị | `MA_BENH_DANG_DIEU_TRI` | Chuỗi | 255 | Ghi mã các bệnh đang điều trị theo mã ICD- |
| 46 | Thuốc đang sử dụng điều trị | `TEN_THUOC` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 47 | Thay đổi địa chỉ Nơi ở (nếu có) | `DIA_CHI_THAY_DOI` | Chuỗi | 1024 |  |
| 48 | Thay đổi điện thoại (nếu có) | `DIEN_THOAI_THAY_DOI` | Chuỗi | 15 | II Thông tin chung về cơ sở khám sức khỏe |
| 49 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 50 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 51 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 52 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT III Theo dõi sức khỏe A Dành cho học sinh <24 tháng tuổi |
| 53 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 54 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 |  |
| 55 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 | 95 |
| 56 | Đánh giá tình trạng dinh dưỡng | `DANH_GIA_DINH_DUONG` | Số | 1 | Mã “1”: Bình thường Mã “2”: Suy dinh dưỡng Mã “3”: Thừa cân béo phì B Dành cho học sinh >=<br>1: Bình thường<br>2: Suy dinh dưỡng<br>3: Thừa cân béo phì |
| 57 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 58 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 |  |
| 59 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 60 | Đánh giá tình trạng dinh dưỡng | `DANH_GIA_DINH_DUONG` | Số | 1 | Mã “1”: Bình thường Mã “2”: Suy dinh dưỡng Mã “3”: Thừa cân béo phì<br>1: Bình thường<br>2: Suy dinh dưỡng<br>3: Thừa cân béo phì |
| 61 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | C Dành cho học sinh >= |
| 62 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ-BYT |
| 63 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 |  |
| 64 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 65 | Đánh giá tình trạng dinh dưỡng | `DANH_GIA_DINH_DUONG` | Số | 1 | Mã “1”: Bình thường Mã “2”: Suy dinh dưỡng Mã “3”: Thừa cân béo phì Huyết áp<br>1: Bình thường<br>2: Suy dinh dưỡng<br>3: Thừa cân béo phì |
| 66 | Tâm trương | `HA_TAM_TRUONG` | Chuỗi | 6 | Ghi số đo huyết áp tâm trương của đối tượng khám sức khỏe theo mmHg |
| 67 | Tâm thu | `HA_TAM_THU` | Chuỗi | 6 | Ghi số đo huyết áp tâm thu của đối tượng khám sức khỏe theo mmHg |
| 68 | Nhịp tim | `NHIP_TIM` | Chuỗi | 6 | Ghi số đo nhịp tim của đối tượng khám sức khỏe theo lần/phút Thị lực |
| 69 | Kết quả khám thị lực không kính (mắt phải) | `KHONG_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 70 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 71 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 | 96 |
| 72 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 73 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | Theo dõi diễn biến bất thường về sức khỏe |
| 74 | Ngày có diễn biến bất thường | `NGAY_DIEN_BIEN_BAT_THUONG` | Chuỗi | 12 |  |
| 75 | Chẩn đoán ban đầu | `MA_BENH_CHUAN_DOAN_BAN_DAU` | Chuỗi | 255 | Ghi mã bệnh được chẩn đoán ban đầu theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";". Xử trí |
| 76 | Xử trí tại trường | `XU_TRI_TAI_TRUONG` | Chuỗi | n | Ghi nội dung xử trí tại trường |
| 77 | Chuyển đến | `CHUYEN_DEN` | Chuỗi | 1024 | Ghi nơi chuyển đến IV Khám sức khỏe theo chuyên khoa A Nhi khoa |
| 78 | Tuần hoàn | `NHI_KHOA_TUAN_HOAN` | Chuỗi | n | Ghi kết quả khám nhi khoa tuần hoàn |
| 79 | Hô hấp | `NHI_KHOA_HO_HAP` | Chuỗi | n | Ghi kết quả khám nhi khoa hô hấp |
| 80 | Tiêu hóa | `NHI_KHOA_TIEU_HOA` | Chuỗi | n | Ghi kết quả khám nhi khoa tiêu hóa |
| 81 | Thận-Tiết niệu | `NHI_KHOA_THAN_TIETNIEU` | Chuỗi | n | Ghi kết quả khám nhi khoa thận - tiết niệu |
| 82 | Thần kinh - Tâm thần | `NHI_KHOA_THAN_KINH_TAM_THAN` | Chuỗi | n | Ghi kết quả khám nhi khoa thần kinh - tâm thần |
| 83 | Khám lâm sàng khác | `NHI_KHOA_KHAC` | Số | 1 | Đối tượng đến khám sức khỏe có thực hiện khám lâm sàng khác không? Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 84 | Tên loại khám lâm sàng khác | `TEN_LOAI_KHAM_NHI_KHOA_KHAC` | Chuỗi | 1024 | Ghi tên khám nhi khoa khác |
| 85 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | B Khám mắt |
| 86 | Kết quả khám thị lực không kính (mắt phải) | `KHONG_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 87 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 | 97 |
| 88 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 89 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 90 | Các bệnh về mắt (nếu có) | `BENH_KHAC_MAT` | Chuỗi | n |  |
| 91 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | C Tai - Mũi - Họng |
| 92 | Kết quả khám thính lực tai trái (nói thường) | `TAI_TRAI_NOI_THUONG` | Chuỗi | 5 |  |
| 93 | Kết quả khám thính lực tai trái (nói thầm) | `TAI_TRAI_NOI_THAM` | Chuỗi | 5 |  |
| 94 | Kết quả khám thính lực tai phải (nói thường) | `TAI_PHAI_NOI_THUONG` | Chuỗi | 5 |  |
| 95 | Kết quả khám thính lực tai phải (nói thầm) | `TAI_PHAI_NOI_THAM` | Chuỗi | 5 |  |
| 96 | Các bệnh về tai mũi họng (nếu có) | `BENH_KHAC_TAI_MUI_HONG` | Chuỗi | n |  |
| 97 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | D Răng - Hàm - Mặt |
| 98 | Kết quả khám hàm trên | `HAM_TREN` | Chuỗi | n |  |
| 99 | Kết quả khám hàm dưới | `HAM_DUOI` | Chuỗi | n |  |
| 100 | Các bệnh về răng-hàm- mặt (nếu có) | `BENH_KHAC_RANG_HAM_MAT` | Chuỗi | n |  |
| 101 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | E Cơ xương khớp |
| 102 | Cơ xương khớp | `CO_XUONG_KHOP` | Số | 1 | Mã “0”: Không Mã “1”: Bình thường<br>1: Bình thường |
| 103 | Cong cột sống | `CONG_COT_SONG` | Số | 1 | Mã "1": Gù Mã "2": Ưỡn<br>2: Ưỡn |
| 104 | Vẹo cột sống | `VEO_COT_SONG` | Số | 1 | Mã "1": Hình chữ S Mã "2": Hình chữ C<br>2: Hình chữ C |
| 105 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `NGUOI_GIAM_HO` / `SO_CCCD_NGH` (Họ tên và định danh bố/mẹ/người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "matinh_cu_tru_ngh_me": "Bình thường",
      "khong_kinh_mat_phai": "Bình thường",
      "khong_kinh_mat_trai": "Bình thường",
      "co_kinh_mat_phai": "Bình thường",
      "co_kinh_mat_trai": "Bình thường",
      "nhi_khoa_tuan_hoan": "Bình thường",
      "nhi_khoa_ho_hap": "Bình thường",
      "nhi_khoa_tieu_hoa": "Bình thường",
      "nhi_khoa_than_kinh_tam_than": "Bình thường",
      "benh_khac_mat": "Bình thường",
      "benh_khac_tai_mui_hong": "Bình thường",
      "benh_khac_rang_ham_mat": "Bình thường",
      "co_xuong_khop": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_14_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_14_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <GIOI_TINH>1</GIOI_TINH>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <HO_TEN_NGH_BO>Sample</HO_TEN_NGH_BO>
        <MA_NGHE_NGHIEP_NGH_BO>Sample</MA_NGHE_NGHIEP_NGH_BO>
        <DIEN_THOAI_NGH_BO>Sample</DIEN_THOAI_NGH_BO>
        <DIA_CHI_NGH_BO>Sample</DIA_CHI_NGH_BO>
        <MATINH_CU_TRU_NGH_BO>Sample</MATINH_CU_TRU_NGH_BO>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU_NGH_BO>Bình thường</MATINH_CU_TRU_NGH_BO>
        <MATINH_CU_TRU_NGH_ME>Bình thường</MATINH_CU_TRU_NGH_ME>
        <KHONG_KINH_MAT_PHAI>Bình thường</KHONG_KINH_MAT_PHAI>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <NHI_KHOA_TUAN_HOAN>Bình thường</NHI_KHOA_TUAN_HOAN>
        <NHI_KHOA_HO_HAP>Bình thường</NHI_KHOA_HO_HAP>
        <NHI_KHOA_TIEU_HOA>Bình thường</NHI_KHOA_TIEU_HOA>
        <NHI_KHOA_THAN_TIETNIEU>Bình thường</NHI_KHOA_THAN_TIETNIEU>
        <NHI_KHOA_THAN_KINH_TAM_THAN>Bình thường</NHI_KHOA_THAN_KINH_TAM_THAN>
        <NHI_KHOA_KHAC>Bình thường</NHI_KHOA_KHAC>
        <TEN_LOAI_KHAM_NHI_KHOA_KHAC>Bình thường</TEN_LOAI_KHAM_NHI_KHOA_KHAC>
        <KHONG_KINH_MAT_PHAI>Bình thường</KHONG_KINH_MAT_PHAI>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <BENH_KHAC_MAT>Bình thường</BENH_KHAC_MAT>
        <BENH_KHAC_TAI_MUI_HONG>Bình thường</BENH_KHAC_TAI_MUI_HONG>
        <BENH_KHAC_RANG_HAM_MAT>Bình thường</BENH_KHAC_RANG_HAM_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
    </KET_LUAN>
</MAU_14_KSK>
```

---

## MẪU 15: 15.  Mẫu sổ khám sức khỏe định kỳ cho học sinh từ lớp 1 – lớp 5
**Đối tượng áp dụng:** Học sinh định kỳ cấp học từ lớp 1 – lớp 5

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 4 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 5 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 6 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân tộc<br>7: Người sống tại vùng có điều kiện kinh tế<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm non<br>11: Học sinh trong các cơ sở giáo dục phổ<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 7 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác 99<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 8 | Họ tên bố hoặc người giám hộ | `HO_TEN_NGH_BO` | Chuỗi | 255 | 9 CMND / CCCD / HC / Định danh công dân bố hoặc người giám hộ SO_CCCD_NGH_BO Chuỗi n |
| 10 | Nghề nghiệp của bố hoặc người giám hộ | `MA_NGHE_NGHIEP_NGH_BO` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 11 | Điện thoại của bố hoặc người giám hộ | `DIEN_THOAI_NGH_BO` | Chuỗi | 15 |  |
| 12 | Nơi ở hiện tại của bố hoặc người giám hộ | `DIA_CHI_NGH_BO` | Chuỗi | 1024 |  |
| 13 | Mã Tỉnh của bố hoặc người giám hộ | `MATINH_CU_TRU_NGH_BO` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 14 | Mã Xã của bố hoặc người giám hộ | `MAXA_CU_TRU_NGH_BO` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 15 | Họ tên mẹ hoặc người giám hộ | `HO_TEN_NGH_ME` | Chuỗi | 255 | 16 CMND / CCCD / HC / Định danh công dân mẹ hoặc người giám hộ SO_CCCD_NGH_ME Chuỗi n |
| 17 | Nghề nghiệp của mẹ hoặc người giám hộ | `MA_NGHE_NGHIEP_NGH_ME` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 18 | Điện thoại của mẹ hoặc người giám hộ | `DIEN_THOAI_NGH_ME` | Chuỗi | 15 |  |
| 19 | Nơi ở hiện tại của mẹ hoặc người giám hộ | `DIA_CHI_NGH_ME` | Chuỗi | 1024 |  |
| 20 | Mã Tỉnh của mẹ hoặc người giám hộ | `MATINH_CU_TRU_NGH_ME` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 21 | Mã Xã của mẹ hoặc người giám hộ | `MAXA_CU_TRU_NGH_ME` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 22 | Con thứ mấy | `CON_THU_MAY` | Số | 2 | Con thứ mấy trong gia đình |
| 23 | Tổng số con trong gia đình | `TONG_SO_CON` | Số | 2 | Tổng số con trong gia đình A Tiền sử sức khỏe bản thân A.1 Sản khoa 100 |
| 24 | Sản khoa | `SAN_KHOA` | Số | 1 | Mã “0”: Không Mã “1”: Bình thường 25 Tên bệnh gây ra sản khoa không bình thường BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG Số 1 Mã "1": Đẻ thiếu tháng Mã "2": Đẻ thừa tháng Mã "3": Đẻ có can thiệp Mã "4": Đẻ ngạt<br>1: Bình thường<br>1: Đẻ thiếu tháng<br>2: Đẻ thừa tháng<br>3: Đẻ có can thiệp<br>4: Đẻ ngạt |
| 26 | Mẹ bị bệnh trong thời kỳ mang thai | `ME_BI_BENH_TRONG_THOI_KY_MANG_THAI` | Số | 1 | Mã "0": Không Mã "1": Có 27 Ghi rõ tên bệnh của mẹ trong thời kỳ mang thai BENH_TRONG_THOI_KY_MANG_THAI Chuỗi 255 Ghi mã các bệnh của mẹ trong thời kỳ mang thai theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";" A.2 Tiền sử bệnh/tật<br>0: Không<br>1: Có |
| 28 | Tiền sử bệnh/tật | `MA_BENH` | Số | 1 | Mã “0”: Không bệnh Mã “1”: Hen Mã “2”: Động kinh Mã “3”: Dị ứng Mã “4”: Tim bẩm sinh A.3 Tiêm chủng<br>0: Không bệnh<br>1: Hen<br>2: Động kinh<br>3: Dị ứng<br>4: Tim bẩm sinh |
| 29 | BCG | `TIEM_CHUNG_BCG` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 30 | Vắc xin bạch hầu, ho gà, uốn ván mũi 1 | `TIEM_CHUNG_BH_HG_UV_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 31 | Vắc xin bạch hầu, ho gà, uốn ván mũi 2 | `TIEM_CHUNG_BH_HG_UV_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 32 | Vắc xin bạch hầu, ho gà, uốn ván mũi 3 | `TIEM_CHUNG_BH_HG_UV_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 33 | Vắc xin bại liệt lần 1 | `TIEM_CHUNG_BAI_LIET_L1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 34 | Vắc xin bại liệt lần 2 | `TIEM_CHUNG_BAI_LIET_L2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 35 | Vắc xin bại liệt lần 3 | `TIEM_CHUNG_BAI_LIET_L3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 36 | Vắc xin Viêm gan B mũi 1 | `TIEM_CHUNG_VGB_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 37 | Vắc xin Viêm gan B mũi 2 | `TIEM_CHUNG_VGB_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 38 | Vắc xin Viêm gan B mũi 3 | `TIEM_CHUNG_VGB_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 39 | Vắc xin Sởi | `TIEM_CHUNG_SOI` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ 101 |
| 40 | Vắc xin viêm não Nhật Bản mũi 1 | `TIEM_CHUNG_VNNB_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 41 | Vắc xin viêm não Nhật Bản mũi 2 | `TIEM_CHUNG_VNNB_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 42 | Vắc xin viêm não Nhật Bản mũi 3 | `TIEM_CHUNG_VNNB_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 43 | Vắc xin khác (ghi rõ) | `TIEM_CHUNG_KHAC` | Chuỗi | 255 | Ghi rõ tên vắc xin khác (nếu có) |
| 44 | Hiện tại có đang điều trị bệnh gì không? | `CO_DANG_DIEU_TRI_BENH` | Số | 1 | Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 45 | Cụ thể tên bệnh đang điều trị | `MA_BENH_DANG_DIEU_TRI` | Chuỗi | 255 | Ghi mã các bệnh đang điều trị theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";" |
| 46 | Thuốc đang sử dụng điều trị | `TEN_THUOC` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 47 | Thay đổi địa chỉ Nơi ở (nếu có) | `DIA_CHI_THAY_DOI` | Chuỗi | 1024 |  |
| 48 | Thay đổi điện thoại (nếu có) | `DIEN_THOAI_THAY_DOI` | Chuỗi | 15 | II Thông tin chung về cơ sở khám sức khỏe |
| 49 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 50 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 51 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 52 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT III Theo dõi sức khỏe Sức khoẻ theo dõi 2 lần, lần 1 đầu năm học, lần 2 đầu học kỳ II và theo dõi từ lớp 1 tới lớp 5. Lần I sẽ theo dõi về thể lực, huyết áp, nhịp tim, thị lực. Lần II chỉ theo dõi thể lực. |
| 53 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 54 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 | 102 |
| 55 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 56 | Chỉ số BMI | `CHI_SO_BMI` | Chuỗi | 10 | Huyết áp |
| 57 | Tâm trương | `HA_TAM_TRUONG` | Chuỗi | 6 | Ghi số đo huyết áp tâm trương của đối tượng khám sức khỏe theo mmHg |
| 58 | Tâm thu | `HA_TAM_THU` | Chuỗi | 6 | Ghi số đo huyết áp tâm thu của đối tượng khám sức khỏe theo mmHg |
| 59 | Nhịp tim | `NHIP_TIM` | Chuỗi | 6 | Ghi số đo nhịp tim của đối tượng khám sức khỏe theo lần/phút Thị lực 60 Kết quả khám thị lực không kính (mắt phải) KHONG_KINH_MAT_PHAI Chuỗi 5 |
| 61 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 62 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 63 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 | Các bệnh về mắt (nếu có) BENH_KHAC_MAT Chuỗi n |
| 64 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | Theo dõi diễn biến bất thường về sức khỏe |
| 65 | Ngày có diễn biến bất thường | `NGAY_DIEN_BIEN_BAT_THUONG` | Chuỗi | 12 |  |
| 66 | Chẩn đoán ban đầu | `MA_BENH_CHAN_DOAN_BAN_DAU` | Chuỗi | 255 | Ghi mã bệnh được chẩn đoán ban đầu theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";" Xử trí |
| 67 | Xử trí tại trường | `XU_TRI_TAI_TRUONG` | Chuỗi | n | Ghi nội dung xử trí tại trường |
| 68 | Chuyển đến | `CHUYEN_DEN` | Chuỗi | 1024 | Ghi nơi chuyển đến 103 IV Khám sức khỏe theo chuyên khoa A Nhi khoa |
| 69 | Tuần hoàn | `NHI_KHOA_TUAN_HOAN` | Chuỗi | n | Ghi kết quả khám nhi khoa tuần hoàn |
| 70 | Hô hấp | `NHI_KHOA_HO_HAP` | Chuỗi | n | Ghi kết quả khám nhi khoa hô hấp |
| 71 | Tiêu hóa | `NHI_KHOA_TIEU_HOA` | Chuỗi | n | Ghi kết quả khám nhi khoa tiêu hóa |
| 72 | Thận-Tiết niệu | `NHI_KHOA_THAN_TIETNIEU` | Chuỗi | n | Ghi kết quả khám nhi khoa thận - tiết niệu |
| 73 | Thần kinh - Tâm thần | `NHI_KHOA_THAN_KINH_TAM_THAN` | Chuỗi | n | Ghi kết quả khám nhi khoa thần kinh - tâm thần |
| 74 | Khám lâm sàng khác | `NHI_KHOA_KHAC` | Số | 1 | Đối tượng đến khám sức khỏe có thực hiện khám lâm sàng khác không? Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 75 | Tên loại khám lâm sàng khác | `TEN_LOAI_KHAM_NHI_KHOA_KHAC` | Chuỗi | 1024 | Ghi tên khám nhi khoa khác |
| 76 | Kết quả khám lâm sàng khác | `KET_QUA_KHAM_NHI_KHOA_KHAC` | Chuỗi | n | Ghi kết quả khám nhi khoa khác |
| 77 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | B Khám mắt 78 Kết quả khám thị lực không kính (mắt phải) KHONG_KINH_MAT_PHAI Chuỗi 5 |
| 79 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 80 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 81 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 82 | Các bệnh về mắt (nếu có) | `BENH_KHAC_MAT` | Chuỗi | n |  |
| 83 | Kết luận về mắt | `KET_LUAN_MAT` | Chuỗi | n | Ghi kết luận về mắt |
| 84 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | C Tai - Mũi - Họng 85 Kết quả khám thính lực tai trái (nói thường) TAI_TRAI_NOI_THUONG Chuỗi 5 Ghi kết quả khám thính lực tai trái khi nói thường 104 |
| 86 | Kết quả khám thính lực tai trái (nói thầm) | `TAI_TRAI_NOI_THAM` | Chuỗi | 5 | Ghi kết quả khám thính lực tai trái khi nói thầm 87 Kết quả khám thính lực tai phải (nói thường) TAI_PHAI_NOI_THUONG Chuỗi 5 Ghi kết quả khám thính lực tai phải khi nói thường 88 Kết quả khám thính lực tai phải (nói thầm) TAI_PHAI_NOI_THAM Chuỗi 5 Ghi kết quả khám thính lực tai phải khi nói thầm |
| 89 | Các bệnh về tai mũi họng (nếu có) | `BENH_KHAC_TAI_MUI_HONG` | Chuỗi | n | Ghi các bệnh về tai mũi họng (nếu có) |
| 90 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | D Răng - Hàm - Mặt |
| 91 | Kết quả khám hàm trên | `HAM_TREN` | Chuỗi | n | Ghi kết quả khám hàm trên |
| 92 | Kết quả khám hàm dưới | `HAM_DUOI` | Chuỗi | n | Ghi kết quả khám hàm dưới |
| 93 | Các bệnh về răng- hàm-mặt (nếu có) | `BENH_KHAC_RANG_HAM_MAT` | Chuỗi | n | Ghi các bệnh về răng hàm mặt (nếu có) |
| 94 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | E Cơ xương khớp |
| 95 | Cơ xương khớp | `CO_XUONG_KHOP` | Số | 1 | Cơ xương khớp bình thường hay không? Mã “0”: Không Mã “1”: Bình thường<br>0: Không<br>1: Bình thường |
| 96 | Cong cột sống | `CONG_COT_SONG` | Số | 1 | Mã "1": Gù Mã "2": Ưỡn<br>2: Ưỡn |
| 97 | Vẹo cột sống | `VEO_COT_SONG` | Số | 1 | Mã "1": Hình chữ S Mã "2": Hình chữ C<br>2: Hình chữ C |
| 98 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `NGUOI_GIAM_HO` / `SO_CCCD_NGH` (Họ tên và định danh bố/mẹ/người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "matinh_cu_tru_ngh_me": "Bình thường",
      "khong_kinh_mat_trai": "Bình thường",
      "co_kinh_mat_phai": "Bình thường",
      "co_kinh_mat_trai": "Bình thường",
      "nhi_khoa_tuan_hoan": "Bình thường",
      "nhi_khoa_ho_hap": "Bình thường",
      "nhi_khoa_tieu_hoa": "Bình thường",
      "nhi_khoa_than_kinh_tam_than": "Bình thường",
      "benh_khac_mat": "Bình thường",
      "ket_luan_mat": "Bình thường",
      "benh_khac_tai_mui_hong": "Bình thường",
      "benh_khac_rang_ham_mat": "Bình thường",
      "co_xuong_khop": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_15_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_15_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <GIOI_TINH>1</GIOI_TINH>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <HO_TEN_NGH_BO>Sample</HO_TEN_NGH_BO>
        <MA_NGHE_NGHIEP_NGH_BO>Sample</MA_NGHE_NGHIEP_NGH_BO>
        <DIEN_THOAI_NGH_BO>Sample</DIEN_THOAI_NGH_BO>
        <DIA_CHI_NGH_BO>Sample</DIA_CHI_NGH_BO>
        <MATINH_CU_TRU_NGH_BO>Sample</MATINH_CU_TRU_NGH_BO>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
        <CHI_SO_BMI>20.7</CHI_SO_BMI>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU_NGH_BO>Bình thường</MATINH_CU_TRU_NGH_BO>
        <MATINH_CU_TRU_NGH_ME>Bình thường</MATINH_CU_TRU_NGH_ME>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <NHI_KHOA_TUAN_HOAN>Bình thường</NHI_KHOA_TUAN_HOAN>
        <NHI_KHOA_HO_HAP>Bình thường</NHI_KHOA_HO_HAP>
        <NHI_KHOA_TIEU_HOA>Bình thường</NHI_KHOA_TIEU_HOA>
        <NHI_KHOA_THAN_TIETNIEU>Bình thường</NHI_KHOA_THAN_TIETNIEU>
        <NHI_KHOA_THAN_KINH_TAM_THAN>Bình thường</NHI_KHOA_THAN_KINH_TAM_THAN>
        <NHI_KHOA_KHAC>Bình thường</NHI_KHOA_KHAC>
        <TEN_LOAI_KHAM_NHI_KHOA_KHAC>Bình thường</TEN_LOAI_KHAM_NHI_KHOA_KHAC>
        <KET_QUA_KHAM_NHI_KHOA_KHAC>Bình thường</KET_QUA_KHAM_NHI_KHOA_KHAC>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <BENH_KHAC_MAT>Bình thường</BENH_KHAC_MAT>
        <KET_LUAN_MAT>Bình thường</KET_LUAN_MAT>
        <BENH_KHAC_TAI_MUI_HONG>Bình thường</BENH_KHAC_TAI_MUI_HONG>
        <BENH_KHAC_RANG_HAM_MAT>Bình thường</BENH_KHAC_RANG_HAM_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
    </KET_LUAN>
</MAU_15_KSK>
```

---

## MẪU 16: 16.  Mẫu sổ khám sức khỏe định kỳ cho học sinh từ lớp 6 – lớp 9
**Đối tượng áp dụng:** Học sinh định kỳ cấp học từ lớp 6 – lớp 9

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 4 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 5 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 6 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân tộc<br>7: Người sống tại vùng có điều kiện kinh tế<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm non<br>11: Học sinh trong các cơ sở giáo dục phổ<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 7 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 8 | Họ tên bố hoặc người giám hộ | `HO_TEN_NGH_BO` | Chuỗi | 255 |  |
| 9 | CMND / CCCD / HC / Định danh công dân | `SO_CCCD_NGH_BO` | Chuỗi | n | 106 bố hoặc người giám hộ |
| 10 | Nghề nghiệp của bố hoặc người giám hộ | `MA_NGHE_NGHIEP_NGH_BO` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 11 | Điện thoại của bố hoặc người giám hộ | `DIEN_THOAI_NGH_BO` | Chuỗi | 15 |  |
| 12 | Nơi ở hiện tại của bố hoặc người giám hộ | `DIA_CHI_NGH_BO` | Chuỗi | 1024 |  |
| 13 | Mã Tỉnh của bố hoặc người giám hộ | `MATINH_CU_TRU_NGH_BO` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 14 | Mã Xã của bố hoặc người giám hộ | `MAXA_CU_TRU_NGH_BO` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 15 | Họ tên mẹ hoặc người giám hộ | `HO_TEN_NGH_ME` | Chuỗi | 255 | 16 CMND / CCCD / HC / Định danh công dân mẹ hoặc người giám hộ SO_CCCD_NGH_ME Chuỗi n |
| 17 | Nghề nghiệp của mẹ hoặc người giám hộ | `MA_NGHE_NGHIEP_NGH_ME` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 18 | Điện thoại của mẹ hoặc người giám hộ | `DIEN_THOAI_NGH_ME` | Chuỗi | 15 |  |
| 19 | Nơi ở hiện tại của mẹ hoặc người giám hộ | `DIA_CHI_NGH_ME` | Chuỗi | 1024 |  |
| 20 | Mã Tỉnh của mẹ hoặc người giám hộ | `MATINH_CU_TRU_NGH_ME` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 21 | Mã Xã của mẹ hoặc người giám hộ | `MAXA_CU_TRU_NGH_ME` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 22 | Con thứ mấy | `CON_THU_MAY` | Số | 2 |  |
| 23 | Tổng số con trong gia đình | `TONG_SO_CON` | Số | 2 | A Tiền sử sức khỏe bản thân A.1 Sản khoa |
| 24 | Sản khoa | `SAN_KHOA` | Số | 1 | Sản khoa bình thường hay không? Mã “0”: Không Mã “1”: Bình thường 107 25 Tên bệnh gây ra sản khoa không bình thường BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG Số 1 Mã "1": Đẻ thiếu tháng Mã "2": Đẻ thừa tháng Mã "3": Đẻ có can thiệp Mã "4": Đẻ ngạt<br>0: Không<br>1: Bình thường<br>1: Đẻ thiếu tháng<br>2: Đẻ thừa tháng<br>3: Đẻ có can thiệp<br>4: Đẻ ngạt |
| 26 | Mẹ bị bệnh trong thời kỳ mang thai | `ME_BI_BENH_TRONG_THOI_KY_MANG_THAI` | Số | 1 | Mẹ bị bệnh trong thời kỳ mang thai không? Mã "0": Không Mã "1": Có 27 Ghi rõ tên bệnh của mẹ trong thời kỳ mang thai BENH_TRONG_THOI_KY_MANG_THAI Chuỗi 255 Ghi mã các bệnh của mẹ trong thời kỳ mang thai theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";" A.2 Tiền sử bệnh/tật<br>0: Không<br>1: Có |
| 28 | Tiền sử bệnh/tật | `MA_BENH` | Số | 1 | Ghi thông tin về tiền sử bệnh/tật đối tượng: Mã “0”: Không bệnh Mã “1”: Hen Mã “2”: Động kinh Mã “3”: Dị ứng Mã “4”: Tim bẩm sinh A.3 Tiêm chủng<br>ng: <br>0: Không bệnh<br>1: Hen<br>2: Động kinh<br>3: Dị ứng<br>4: Tim bẩm sinh |
| 29 | BCG | `TIEM_CHUNG_BCG` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 30 | Vắc xin bạch hầu, ho gà, uốn ván mũi 1 | `TIEM_CHUNG_BH_HG_UV_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 31 | Vắc xin bạch hầu, ho gà, uốn ván mũi 2 | `TIEM_CHUNG_BH_HG_UV_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 32 | Vắc xin bạch hầu, ho gà, uốn ván mũi 3 | `TIEM_CHUNG_BH_HG_UV_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 33 | Vắc xin bại liệt lần 1 | `TIEM_CHUNG_BAI_LIET_L1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 34 | Vắc xin bại liệt lần 2 | `TIEM_CHUNG_BAI_LIET_L2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 35 | Vắc xin bại liệt lần 3 | `TIEM_CHUNG_BAI_LIET_L3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 36 | Vắc xin Viêm gan B mũi 1 | `TIEM_CHUNG_VGB_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 37 | Vắc xin Viêm gan B mũi 2 | `TIEM_CHUNG_VGB_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 38 | Vắc xin Viêm gan B mũi 3 | `TIEM_CHUNG_VGB_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 39 | Vắc xin Sởi | `TIEM_CHUNG_SOI` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ 108 |
| 40 | Vắc xin viêm não Nhật Bản mũi 1 | `TIEM_CHUNG_VNNB_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 41 | Vắc xin viêm não Nhật Bản mũi 2 | `TIEM_CHUNG_VNNB_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 42 | Vắc xin viêm não Nhật Bản mũi 3 | `TIEM_CHUNG_VNNB_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 43 | Vắc xin khác (ghi rõ) | `TIEM_CHUNG_KHAC` | Chuỗi | 255 | Ghi rõ tên vắc xin khác (nếu có) |
| 44 | Hiện tại có đang điều trị bệnh gì không? | `CO_DANG_DIEU_TRI_BENH` | Số | 1 | Ghi thông tin về tiền sử điều trị bệnh đối tượng: Mã “0”: Không Mã “1”: Có<br>ng: <br>0: Không<br>1: Có |
| 45 | Cụ thể tên bệnh đang điều trị | `MA_BENH_DANG_DIEU_TRI` | Chuỗi | 255 | Ghi mã bệnh đang điều trị theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";" |
| 46 | Thuốc đang sử dụng điều trị | `TEN_THUOC` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 47 | Thay đổi địa chỉ Nơi ở (nếu có) | `DIA_CHI_THAY_DOI` | Chuỗi | 1024 |  |
| 48 | Thay đổi điện thoại (nếu có) | `DIEN_THOAI_THAY_DOI` | Chuỗi | 15 | II Thông tin chung về cơ sở khám sức khỏe |
| 49 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 50 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 51 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 52 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT III Theo dõi sức khỏe Sức khoẻ theo dõi 2 lần, lần 1 đầu năm học, lần 2 đầu học kỳ II và theo dõi từ lớp 1 tới lớp 5. Lần I sẽ theo dõi về thể lực, huyết áp, nhịp tim, thị lực. Lần II chỉ theo dõi thể lực. |
| 53 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT 109 |
| 54 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 |  |
| 55 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 56 | Chỉ số BMI | `CHI_SO_BMI` | Chuỗi | 10 | Huyết áp |
| 57 | Tâm trương | `HA_TAM_TRUONG` | Chuỗi | 6 | Ghi số đo huyết áp tâm trương của đối tượng khám sức khỏe theo mmHg |
| 58 | Tâm thu | `HA_TAM_THU` | Chuỗi | 6 | Ghi số đo huyết áp tâm thu của đối tượng khám sức khỏe theo mmHg |
| 59 | Nhịp tim | `NHIP_TIM` | Chuỗi | 6 | Ghi số đo nhịp tim của đối tượng khám sức khỏe theo lần/phút Thị lực 60 Kết quả khám thị lực không kính (mắt phải) KHONG_KINH_MAT_PHAI Chuỗi 5 |
| 61 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 62 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 63 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 64 | Các bệnh về mắt (nếu có) | `BENH_KHAC_MAT` | Chuỗi | n | Theo dõi diễn biến bất thường về sức khỏe |
| 65 | Ngày có diễn biến bất thường | `NGAY_DIEN_BIEN_BAT_THUONG` | Chuỗi | 12 |  |
| 66 | Chẩn đoán ban đầu | `MA_BENH_CHAN_DOAN_BAN_DAU` | Chuỗi | 255 | Ghi mã bệnh được chẩn đoán ban đầu theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";" Xử trí |
| 67 | Xử trí tại trường | `XU_TRI_TAI_TRUONG` | Chuỗi | n | Ghi nội dung xử trí tại trường |
| 68 | Chuyển đến | `CHUYEN_DEN` | Chuỗi | 1024 | Ghi nơi chuyển đến IV Khám sức khỏe theo chuyên khoa 110 A Nhi khoa |
| 69 | Tuần hoàn | `NHI_KHOA_TUAN_HOAN` | Chuỗi | n | Ghi kết quả khám nhi khoa tuần hoàn |
| 70 | Hô hấp | `NHI_KHOA_HO_HAP` | Chuỗi | n | Ghi kết quả khám nhi khoa hô hấp |
| 71 | Tiêu hóa | `NHI_KHOA_TIEU_HOA` | Chuỗi | n | Ghi kết quả khám nhi khoa tiêu hóa |
| 72 | Thận-Tiết niệu | `NHI_KHOA_THAN_TIETNIEU` | Chuỗi | n | Ghi kết quả khám nhi khoa thận - tiết niệu |
| 73 | Thần kinh - Tâm thần | `NHI_KHOA_THAN_KINH_TAM_THAN` | Chuỗi | n | Ghi kết quả khám nhi khoa thần kinh - tâm thần |
| 74 | Khám lâm sàng khác | `NHI_KHOA_KHAC` | Số | 1 | Đối tượng đến khám sức khỏe có thực hiện khám lâm sàng khác không? Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 75 | Tên loại khám lâm sàng khác | `TEN_LOAI_KHAM_NHI_KHOA_KHAC` | Chuỗi | 1024 | Ghi tên khám nhi khoa khác |
| 76 | Kết quả khám lâm sàng khác | `KET_QUA_KHAM_NHI_KHOA_KHAC` | Chuỗi | n | Ghi kết quả khám nhi khoa khác |
| 77 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | B Khám mắt 78 Kết quả khám thị lực không kính (mắt phải) KHONG_KINH_MAT_PHAI Chuỗi 5 |
| 79 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 80 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 81 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 82 | Các bệnh về mắt (nếu có) | `BENH_KHAC_MAT` | Chuỗi | n |  |
| 83 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | C Tai - Mũi - Họng 84 Kết quả khám thính lực tai trái (nói thường) TAI_TRAI_NOI_THUONG Chuỗi 5 Ghi kết quả khám thính lực tai trái khi nói thường |
| 85 | Kết quả khám thính lực tai trái (nói thầm) | `TAI_TRAI_NOI_THAM` | Chuỗi | 5 | Ghi kết quả khám thính lực tai trái khi nói thầm 111 86 Kết quả khám thính lực tai phải (nói thường) TAI_PHAI_NOI_THUONG Chuỗi 5 Ghi kết quả khám thính lực tai phải khi nói thường 87 Kết quả khám thính lực tai phải (nói thầm) TAI_PHAI_NOI_THAM Chuỗi 5 Ghi kết quả khám thính lực tai phải khi nói thầm |
| 88 | Các bệnh về tai mũi họng (nếu có) | `BENH_KHAC_TAI_MUI_HONG` | Chuỗi | n | Ghi các bệnh về tai mũi họng (nếu có) |
| 89 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | D Răng - Hàm - Mặt |
| 90 | Kết quả khám hàm trên | `HAM_TREN` | Chuỗi | n | Ghi kết quả khám hàm trên |
| 91 | Kết quả khám hàm dưới | `HAM_DUOI` | Chuỗi | n | Ghi kết quả khám hàm dưới |
| 92 | Các bệnh về răng- hàm-mặt (nếu có) | `BENH_KHAC_RANG_HAM_MAT` | Chuỗi | n | Ghi các bệnh về răng hàm mặt (nếu có) |
| 93 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | E Cơ xương khớp |
| 94 | Cơ xương khớp | `CO_XUONG_KHOP` | Số | 1 | Cơ xương khớp bình thường hay không? Mã “0”: Không Mã “1”: Bình thường<br>0: Không<br>1: Bình thường |
| 95 | Cong cột sống | `CONG_COT_SONG` | Số | 1 | Mã "1": Gù Mã "2": Ưỡn<br>2: Ưỡn |
| 96 | Vẹo cột sống | `VEO_COT_SONG` | Số | 1 | Mã "1": Hình chữ S Mã "2": Hình chữ C<br>2: Hình chữ C |
| 97 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n |  |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `NGUOI_GIAM_HO` / `SO_CCCD_NGH` (Họ tên và định danh bố/mẹ/người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "matinh_cu_tru_ngh_me": "Bình thường",
      "khong_kinh_mat_trai": "Bình thường",
      "co_kinh_mat_phai": "Bình thường",
      "co_kinh_mat_trai": "Bình thường",
      "benh_khac_mat": "Bình thường",
      "nhi_khoa_tuan_hoan": "Bình thường",
      "nhi_khoa_ho_hap": "Bình thường",
      "nhi_khoa_tieu_hoa": "Bình thường",
      "nhi_khoa_than_kinh_tam_than": "Bình thường",
      "benh_khac_tai_mui_hong": "Bình thường",
      "benh_khac_rang_ham_mat": "Bình thường",
      "co_xuong_khop": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_16_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_16_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <GIOI_TINH>1</GIOI_TINH>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <HO_TEN_NGH_BO>Sample</HO_TEN_NGH_BO>
        <SO_CCCD_NGH_BO>Sample</SO_CCCD_NGH_BO>
        <MA_NGHE_NGHIEP_NGH_BO>Sample</MA_NGHE_NGHIEP_NGH_BO>
        <DIEN_THOAI_NGH_BO>Sample</DIEN_THOAI_NGH_BO>
        <DIA_CHI_NGH_BO>Sample</DIA_CHI_NGH_BO>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
        <CHI_SO_BMI>20.7</CHI_SO_BMI>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU_NGH_BO>Bình thường</MATINH_CU_TRU_NGH_BO>
        <MATINH_CU_TRU_NGH_ME>Bình thường</MATINH_CU_TRU_NGH_ME>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <BENH_KHAC_MAT>Bình thường</BENH_KHAC_MAT>
        <NHI_KHOA_TUAN_HOAN>Bình thường</NHI_KHOA_TUAN_HOAN>
        <NHI_KHOA_HO_HAP>Bình thường</NHI_KHOA_HO_HAP>
        <NHI_KHOA_TIEU_HOA>Bình thường</NHI_KHOA_TIEU_HOA>
        <NHI_KHOA_THAN_TIETNIEU>Bình thường</NHI_KHOA_THAN_TIETNIEU>
        <NHI_KHOA_THAN_KINH_TAM_THAN>Bình thường</NHI_KHOA_THAN_KINH_TAM_THAN>
        <NHI_KHOA_KHAC>Bình thường</NHI_KHOA_KHAC>
        <TEN_LOAI_KHAM_NHI_KHOA_KHAC>Bình thường</TEN_LOAI_KHAM_NHI_KHOA_KHAC>
        <KET_QUA_KHAM_NHI_KHOA_KHAC>Bình thường</KET_QUA_KHAM_NHI_KHOA_KHAC>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <BENH_KHAC_MAT>Bình thường</BENH_KHAC_MAT>
        <BENH_KHAC_TAI_MUI_HONG>Bình thường</BENH_KHAC_TAI_MUI_HONG>
        <BENH_KHAC_RANG_HAM_MAT>Bình thường</BENH_KHAC_RANG_HAM_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
    </KET_LUAN>
</MAU_16_KSK>
```

---

## MẪU 17: 17.  Mẫu sổ khám sức khỏe định kỳ cho học sinh từ lớp 10 – lớp 12
**Đối tượng áp dụng:** Học sinh định kỳ cấp học từ lớp 10 – lớp 12

### A. Bảng Trường Dữ Liệu Chi Tiết
| TT | Tên Trường | Mã XML/JSON | Kiểu Dữ Liệu | Kích Thước | Diễn Giải / Danh mục lựa chọn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Họ và tên | `HO_TEN` | Chuỗi | 255 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 2 | Giới tính | `GIOI_TINH` | Số | 1 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 3 | Ngày sinh | `NGAY_SINH` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 4 | Dân tộc | `MA_DAN_TOC` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 5 | Nhóm máu | `NHOM_MAU` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 6 | Đối tượng khám định kỳ | `DOI_TUONG` | Số | 2 | Mã "1": Người cao tuổi Mã "2": Người khuyết tật Mã "3": Người thuộc hộ nghèo, cận nghèo Mã "4": Người có công Mã "5": Người mắc bệnh mạn tính Mã "6": Người sống tại vùng đồng bào dân tộc thiểu số và miền núi Mã "7": Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn Mã "8": Người sống tại xã đảo Mã "9": Người sống tại đặc khu Mã "10": Trẻ em trong cơ sở giáo dục mầm non Mã "11": Học sinh trong các cơ sở giáo dục phổ thông Mã "12": Sinh viên Mã "13": Người lao động Mã "14": Các đối tượng khác<br>1: Người cao tuổi<br>2: Người khuyết tật<br>3: Người thuộc hộ nghèo, cận nghèo<br>4: Người có công<br>5: Người mắc bệnh mạn tính<br>6: Người sống tại vùng đồng bào dân tộc<br>7: Người sống tại vùng có điều kiện kinh tế<br>8: Người sống tại xã đảo<br>9: Người sống tại đặc khu<br>10: Trẻ em trong cơ sở giáo dục mầm non<br>11: Học sinh trong các cơ sở giáo dục phổ<br>12: Sinh viên<br>13: Người lao động<br>14: Các đối tượng khác |
| 7 | Nguồn kinh phí khám | `NGUON_KINH_PHI` | Số | 1 | Mã "1": Ngân sách Trung ương Mã "2": Ngân sách Địa phương Mã "3": Quỹ Bảo hiểm y tế Mã "4": Người sử dụng lao động Mã “5”: Xã hội hóa Mã "9": Khác<br>1: Ngân sách Trung ương<br>2: Ngân sách Địa phương<br>3: Quỹ Bảo hiểm y tế<br>4: Người sử dụng lao động<br>5: Xã hội hóa<br>9: Khác |
| 8 | Họ tên bố hoặc người giám hộ | `HO_TEN_NGH_BO` | Chuỗi | 255 | 9 CMND / CCCD / HC / Định danh công dân bố hoặc người giám hộ SO_CCCD_NGH_BO Chuỗi n 113 |
| 10 | Nghề nghiệp của bố hoặc người giám hộ | `MA_NGHE_NGHIEP_NGH_BO` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 11 | Điện thoại của bố hoặc người giám hộ | `DIEN_THOAI_NGH_BO` | Chuỗi | 15 |  |
| 12 | Nơi ở hiện tại của bố hoặc người giám hộ | `DIA_CHI_NGH_BO` | Chuỗi | 1024 |  |
| 13 | Mã Tỉnh của bố hoặc người giám hộ | `MATINH_CU_TRU_NGH_BO` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 14 | Mã Xã của bố hoặc người giám hộ | `MAXA_CU_TRU_NGH_BO` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 15 | Họ tên mẹ hoặc người giám hộ | `HO_TEN_NGH_ME` | Chuỗi | 255 | 16 CMND / CCCD / HC / Định danh công dân mẹ hoặc người giám hộ SO_CCCD_NGH_ME Chuỗi n |
| 17 | Nghề nghiệp của mẹ hoặc người giám hộ | `MA_NGHE_NGHIEP_NGH_ME` | Chuỗi | 2 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 18 | Điện thoại của mẹ hoặc người giám hộ | `DIEN_THOAI_NGH_ME` | Chuỗi | 15 |  |
| 19 | Nơi ở hiện tại của mẹ hoặc người giám hộ | `DIA_CHI_NGH_ME` | Chuỗi | 1024 |  |
| 20 | Mã Tỉnh của mẹ hoặc người giám hộ | `MATINH_CU_TRU_NGH_ME` | Chuỗi | 3 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 21 | Mã Xã của mẹ hoặc người giám hộ | `MAXA_CU_TRU_NGH_ME` | Chuỗi | 5 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 22 | Con thứ mấy | `CON_THU_MAY` | Số | 2 |  |
| 23 | Tổng số con trong gia đình | `TONG_SO_CON` | Số | 2 | A Tiền sử sức khỏe bản thân A.1 Sản khoa |
| 24 | Sản khoa | `SAN_KHOA` | Số | 1 | Sản khoa bình thường hay không? Mã “0”: Không Mã “1”: Bình thường 25 Tên bệnh gây ra sản khoa không bình thường BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG Số 1 Mã "1": Đẻ thiếu tháng Mã "2": Đẻ thừa tháng Mã "3": Đẻ có can thiệp Mã "4": Đẻ ngạt 114<br>0: Không<br>1: Bình thường<br>1: Đẻ thiếu tháng<br>2: Đẻ thừa tháng<br>3: Đẻ có can thiệp<br>4: Đẻ ngạt |
| 26 | Mẹ bị bệnh trong thời kỳ mang thai | `ME_BI_BENH_TRONG_THOI_KY_MANG_THAI` | Số | 1 | Mẹ bị bệnh trong thời kỳ mang thai không? Mã "0": Không Mã "1": Có 27 Ghi rõ tên bệnh của mẹ trong thời kỳ mang thai BENH_TRONG_THOI_KY_MANG_THAI Chuỗi 255 Ghi mã các bệnh của mẹ trong thời kỳ mang thai theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";" A.2 Tiền sử bệnh/tật<br>0: Không<br>1: Có |
| 28 | Tiền sử bệnh/tật | `MA_BENH` | Số | 1 | Ghi thông tin về tiền sử bệnh/tật đối tượng: Mã “0”: Không bệnh Mã “1”: Hen Mã “2”: Động kinh Mã “3”: Dị ứng Mã “4”: Tim bẩm sinh A.3 Tiêm chủng<br>ng: <br>0: Không bệnh<br>1: Hen<br>2: Động kinh<br>3: Dị ứng<br>4: Tim bẩm sinh |
| 29 | BCG | `TIEM_CHUNG_BCG` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 30 | Vắc xin bạch hầu, ho gà, uốn ván mũi 1 | `TIEM_CHUNG_BH_HG_UV_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 31 | Vắc xin bạch hầu, ho gà, uốn ván mũi 2 | `TIEM_CHUNG_BH_HG_UV_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 32 | Vắc xin bạch hầu, ho gà, uốn ván mũi 3 | `TIEM_CHUNG_BH_HG_UV_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 33 | Vắc xin bại liệt lần 1 | `TIEM_CHUNG_BAI_LIET_L1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 34 | Vắc xin bại liệt lần 2 | `TIEM_CHUNG_BAI_LIET_L2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 35 | Vắc xin bại liệt lần 3 | `TIEM_CHUNG_BAI_LIET_L3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 36 | Vắc xin Viêm gan B mũi 1 | `TIEM_CHUNG_VGB_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 37 | Vắc xin Viêm gan B mũi 2 | `TIEM_CHUNG_VGB_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 38 | Vắc xin Viêm gan B mũi 3 | `TIEM_CHUNG_VGB_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 39 | Vắc xin Sởi | `TIEM_CHUNG_SOI` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ |
| 40 | Vắc xin viêm não Nhật Bản mũi 1 | `TIEM_CHUNG_VNNB_MUI1` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 41 | Vắc xin viêm não Nhật Bản mũi 2 | `TIEM_CHUNG_VNNB_MUI2` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ 115<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 42 | Vắc xin viêm não Nhật Bản mũi 3 | `TIEM_CHUNG_VNNB_MUI3` | Số | 2 | 1=Có, 0=Không, 99 = Không nhớ rõ<br>1: Có, 0=Không, 99 = Không nhớ rõ |
| 43 | Vắc xin khác (ghi rõ) | `TIEM_CHUNG_KHAC` | Chuỗi | 255 | Ghi rõ tên vắc xin khác (nếu có) |
| 44 | Hiện tại có đang điều trị bệnh gì không? | `CO_DANG_DIEU_TRI_BENH` | Số | 1 | Ghi thông tin về tiền sử điều trị bệnh đối tượng: Mã “0”: Không Mã “1”: Có<br>ng: <br>0: Không<br>1: Có |
| 45 | Cụ thể tên bệnh đang điều trị | `MA_BENH_DANG_DIEU_TRI` | Chuỗi | 255 | Ghi mã bệnh đang điều trị theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";" |
| 46 | Thuốc đang sử dụng điều trị | `TEN_THUOC` | Chuỗi | 1024 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 47 | Thay đổi địa chỉ Nơi ở (nếu có) | `DIA_CHI_THAY_DOI` | Chuỗi | 1024 |  |
| 48 | Thay đổi điện thoại (nếu có) | `DIEN_THOAI_THAY_DOI` | Chuỗi | 15 | II Thông tin chung về cơ sở khám sức khỏe |
| 49 | Lượt khám | `MA_LK` | Chuỗi | 100 | Là mã đợt điều trị duy nhất |
| 50 | Mã cơ sở khám bệnh, chữa bệnh | `MA_CSKCB` | Chuỗi | 5 | Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 05 ký tự. 51 Mã cơ sở khám bệnh, chữa bệnh theo chuẩn GLN MA_GTIN_CSKCB Chuỗi 13 Ghi mã cơ sở khám bệnh, chữa bệnh nơi đối tượng đến khám sức khỏe do cơ quan có thẩm quyền cấp, gồm 13 ký tự. |
| 52 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT III Theo dõi sức khỏe Sức khoẻ theo dõi 2 lần, lần 1 đầu năm học, lần 2 đầu học kỳ II và theo dõi từ lớp 1 tới lớp 5. Lần I sẽ theo dõi về thể lực, huyết áp, nhịp tim, thị lực. Lần II chỉ theo dõi thể lực. |
| 53 | Ngày khám sức khỏe | `NGAY_VAO` | Chuỗi | 12 | Ghi theo hướng dẫn tại Quyết định số 3176/QĐ- BYT |
| 54 | Chiều cao (cm) | `CHIEU_CAO` | Số | 10 | Ghi số đo chiều cao của đối tượng tính theo cm, biểu thị đầy đủ cả số thập phân, dấu thập phân là dấu chấm “.”, ghi đến 2 chữ số sau dấu thập phân. 116 |
| 55 | Cân nặng (kg) | `CAN_NANG` | Chuỗi | 10 |  |
| 56 | Chỉ số BMI | `CHI_SO_BMI` | Chuỗi | 10 | Huyết áp |
| 57 | Tâm trương | `HA_TAM_TRUONG` | Chuỗi | 6 | Ghi số đo huyết áp tâm trương của đối tượng khám sức khỏe theo mmHg |
| 58 | Tâm thu | `HA_TAM_THU` | Chuỗi | 6 | Ghi số đo huyết áp tâm thu của đối tượng khám sức khỏe theo mmHg |
| 59 | Nhịp tim | `NHIP_TIM` | Chuỗi | 6 | Ghi số đo nhịp tim của đối tượng khám sức khỏe theo lần/phút Thị lực 60 Kết quả khám thị lực không kính (mắt phải) KHONG_KINH_MAT_PHAI Chuỗi 5 |
| 61 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 62 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 63 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 64 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | Theo dõi diễn biến bất thường về sức khỏe |
| 65 | Ngày có diễn biến bất thường | `NGAY_DIEN_BIEN_BAT_THUONG` | Chuỗi | 12 |  |
| 66 | Chẩn đoán ban đầu | `MA_BENH_CHAN_DOAN_BAN_DAU` | Chuỗi | 255 | Ghi mã bệnh được chẩn đoán ban đầu theo mã ICD-10 do Bộ trưởng Bộ Y tế ban hành hoặc mã của triệu chứng, hội chứng. Lưu ý: - Trường hợp có nhiều mã thì được phân cách bằng dấu chấm phẩy ";" Xử trí |
| 67 | Xử trí tại trường | `XU_TRI_TAI_TRUONG` | Chuỗi | n | Ghi nội dung xử trí tại trường |
| 68 | Chuyển đến | `CHUYEN_DEN` | Chuỗi | 1024 | Ghi nơi chuyển đến IV Khám sức khỏe theo chuyên khoa A Nhi khoa 117 |
| 69 | Tuần hoàn | `NHI_KHOA_TUAN_HOAN` | Chuỗi | n | Ghi kết quả khám nhi khoa tuần hoàn |
| 70 | Hô hấp | `NHI_KHOA_HO_HAP` | Chuỗi | n | Ghi kết quả khám nhi khoa hô hấp |
| 71 | Tiêu hóa | `NHI_KHOA_TIEU_HOA` | Chuỗi | n | Ghi kết quả khám nhi khoa tiêu hóa |
| 72 | Thận-Tiết niệu | `NHI_KHOA_THAN_TIETNIEU` | Chuỗi | n | Ghi kết quả khám nhi khoa thận - tiết niệu |
| 73 | Thần kinh - Tâm thần | `NHI_KHOA_THAN_KINH_TAM_THAN` | Chuỗi | n | Ghi kết quả khám nhi khoa thần kinh - tâm thần |
| 74 | Khám lâm sàng khác | `NHI_KHOA_KHAC` | Số | 1 | Đối tượng đến khám sức khỏe có thực hiện khám lâm sàng khác không? Mã “0”: Không Mã “1”: Có<br>0: Không<br>1: Có |
| 75 | Tên loại khám lâm sàng khác | `TEN_LOAI_KHAM_NHI_KHOA_KHAC` | Chuỗi | 1024 | Ghi tên khám nhi khoa khác |
| 76 | Kết quả khám lâm sàng khác | `KET_QUA_KHAM_NHI_KHOA_KHAC` | Chuỗi | n | Ghi kết quả khám nhi khoa khác |
| 77 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | B Khám mắt 78 Kết quả khám thị lực không kính (mắt phải) KHONG_KINH_MAT_PHAI Chuỗi 5 |
| 79 | Kết quả khám thị lực không kính (mắt trái) | `KHONG_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 80 | Kết quả khám thị lực có kính (mắt phải) | `CO_KINH_MAT_PHAI` | Chuỗi | 5 |  |
| 81 | Kết quả khám thị lực có kính (mắt trái) | `CO_KINH_MAT_TRAI` | Chuỗi | 5 |  |
| 82 | Các bệnh về mắt (nếu có) | `BENH_KHAC_MAT` | Chuỗi | n |  |
| 83 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | C Tai - Mũi - Họng 84 Kết quả khám thính lực tai trái (nói thường) TAI_TRAI_NOI_THUONG Chuỗi 5 Ghi kết quả khám thính lực tai trái khi nói thường |
| 85 | Kết quả khám thính lực tai trái (nói thầm) | `TAI_TRAI_NOI_THAM` | Chuỗi | 5 | Ghi kết quả khám thính lực tai trái khi nói thầm 86 Kết quả khám thính lực tai phải (nói thường) TAI_PHAI_NOI_THUONG Chuỗi 5 Ghi kết quả khám thính lực tai phải khi nói thường 118 87 Kết quả khám thính lực tai phải (nói thầm) TAI_PHAI_NOI_THAM Chuỗi 5 Ghi kết quả khám thính lực tai phải khi nói thầm |
| 88 | Các bệnh về tai mũi họng (nếu có) | `BENH_KHAC_TAI_MUI_HONG` | Chuỗi | n | Ghi các bệnh về tai mũi họng (nếu có) |
| 89 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | D Răng - Hàm - Mặt |
| 90 | Kết quả khám hàm trên | `HAM_TREN` | Chuỗi | n | Ghi kết quả khám hàm trên |
| 91 | Kết quả khám hàm dưới | `HAM_DUOI` | Chuỗi | n | Ghi kết quả khám hàm dưới |
| 92 | Các bệnh về răng- hàm-mặt (nếu có) | `BENH_KHAC_RANG_HAM_MAT` | Chuỗi | n | Ghi các bệnh về răng hàm mặt (nếu có) |
| 93 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | E Cơ xương khớp |
| 94 | Cơ xương khớp | `CO_XUONG_KHOP` | Số | 1 | Cơ xương khớp bình thường hay không? Mã “0”: Không Mã “1”: Bình thường<br>0: Không<br>1: Bình thường |
| 95 | Cong cột sống | `CONG_COT_SONG` | Số | 1 | Mã "1": Gù Mã "2": Ưỡn<br>2: Ưỡn |
| 96 | Vẹo cột sống | `VEO_COT_SONG` | Số | 1 | Mã "1": Hình chữ S Mã "2": Hình chữ C<br>2: Hình chữ C |
| 97 | Chữ ký số người khám | `CKS_NGUOI_KHAM` | Chuỗi | n | 119 BỘ Y TẾ CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc |

### B. Thiết Kế Biểu Mẫu Nhập Liệu (UI Form Design)
Form nhập liệu được chia làm các phân hệ trực quan:
1. **Thông tin Hành chính**: Tự động điền từ hồ sơ bệnh nhân. Các trường như CCCD, Địa chỉ, Điện thoại, Dân tộc cho phép chỉnh sửa nếu có sai lệch.
2. **Trường đặc thù của Mẫu biểu**: Cần hiển thị nổi bật ở khu vực thông tin hành chính:
   - `NGUOI_GIAM_HO` / `SO_CCCD_NGH` (Họ tên và định danh bố/mẹ/người giám hộ)
3. **Tiền sử bản thân & Gia đình**: Sử dụng cấu trúc Switch (Có/Không). Khi chọn 'Có', hiển thị ô nhập mã bệnh ICD-10 có hỗ trợ tìm kiếm nhanh.
4. **Khám Thể lực**: Tự động tính toán chỉ số `CHI_SO_BMI` dựa trên `CHIEU_CAO` (cm) và `CAN_NANG` (kg). Huyết áp nhập theo chuỗi định dạng chuẩn `Systolic/Diastolic` (Ví dụ: `120/80`).
5. **Khám Lâm sàng chuyên khoa**: Mỗi chuyên khoa (Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt,...) gồm 2 ô nhập: Nhận xét lâm sàng (Textarea) và Đánh giá phân loại sức khỏe chuyên khoa (Dropdown từ loại 1 đến 5).
6. **Khám Cận lâm sàng**: Bảng lưới động cho phép nhập nhiều kết quả xét nghiệm/siêu âm/X-quang với mã chỉ số (`MA_CHI_SO`), giá trị (`GIA_TRI`), đơn vị (`DON_VI_DO`) và kết luận bệnh.
7. **Kết luận & Chữ ký số**: Phân loại sức khỏe chung (Loại I đến V), chẩn đoán bệnh chính (mã ICD-10) và vùng nhấn nút thực hiện ký số bác sĩ kết luận và ký số đóng dấu bệnh viện.

### C. Đặc Tả Định Dạng JSON Lưu Trữ
Dữ liệu khám chi tiết được đóng gói vào trường `clinical_data`, `lab_data`, `conclusion_data` của bảng detail:
```json
{
  "clinical_data": {
    "physical": {
      "height": 170,
      "weight": 60,
      "bmi": "20.7",
      "pulse": 80,
      "blood_pressure": "120/80"
    },
    "specialist": {
      "matinh_cu_tru_ngh_me": "Bình thường",
      "khong_kinh_mat_trai": "Bình thường",
      "co_kinh_mat_phai": "Bình thường",
      "co_kinh_mat_trai": "Bình thường",
      "nhi_khoa_tuan_hoan": "Bình thường",
      "nhi_khoa_ho_hap": "Bình thường",
      "nhi_khoa_tieu_hoa": "Bình thường",
      "nhi_khoa_than_kinh_tam_than": "Bình thường",
      "benh_khac_mat": "Bình thường",
      "benh_khac_tai_mui_hong": "Bình thường",
      "benh_khac_rang_ham_mat": "Bình thường",
      "co_xuong_khop": "Bình thường"
    },
    "extra": {}
  },
  "lab_data": {
    "tests": [
      {
        "ma_dich_vu": "XN01",
        "ma_chi_so": "GLUCOSE",
        "gia_tri": "5.4",
        "don_vi_do": "mmol/L",
        "mo_ta": "Đường huyết đói",
        "ket_luan": "Bình thường"
      }
    ]
  },
  "conclusion_data": {
    "phan_loai_sk": 1,
    "ket_luan_benh": "Đủ sức khỏe",
    "cac_van_de_luu_y": "Không"
  }
}
```

### D. Đặc Tả Cấu Trúc XML Liên Thông
Tài liệu XML dùng để gửi dữ liệu lên cổng BHXH / VNeID giám định tương ứng với `<MAU_17_KSK>`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<MAU_17_KSK>
    <THONG_TIN_HANH_CHINH>
        <HO_TEN>NGUYỄN VĂN A</HO_TEN>
        <GIOI_TINH>1</GIOI_TINH>
        <NGAY_SINH>2026-06-03</NGAY_SINH>
        <MA_DAN_TOC>Sample</MA_DAN_TOC>
        <NHOM_MAU>Sample</NHOM_MAU>
        <DOI_TUONG>1</DOI_TUONG>
        <NGUON_KINH_PHI>1</NGUON_KINH_PHI>
        <HO_TEN_NGH_BO>Sample</HO_TEN_NGH_BO>
        <MA_NGHE_NGHIEP_NGH_BO>Sample</MA_NGHE_NGHIEP_NGH_BO>
        <DIEN_THOAI_NGH_BO>Sample</DIEN_THOAI_NGH_BO>
        <DIA_CHI_NGH_BO>Sample</DIA_CHI_NGH_BO>
        <MATINH_CU_TRU_NGH_BO>Sample</MATINH_CU_TRU_NGH_BO>
    </THONG_TIN_HANH_CHINH>
    <TIEN_SU_BENH>
    </TIEN_SU_BENH>
    <KHAM_THE_LUC>
        <CHIEU_CAO>170</CHIEU_CAO>
        <CAN_NANG>60</CAN_NANG>
        <CHI_SO_BMI>20.7</CHI_SO_BMI>
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>
        <MATINH_CU_TRU_NGH_BO>Bình thường</MATINH_CU_TRU_NGH_BO>
        <MATINH_CU_TRU_NGH_ME>Bình thường</MATINH_CU_TRU_NGH_ME>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <NHI_KHOA_TUAN_HOAN>Bình thường</NHI_KHOA_TUAN_HOAN>
        <NHI_KHOA_HO_HAP>Bình thường</NHI_KHOA_HO_HAP>
        <NHI_KHOA_TIEU_HOA>Bình thường</NHI_KHOA_TIEU_HOA>
        <NHI_KHOA_THAN_TIETNIEU>Bình thường</NHI_KHOA_THAN_TIETNIEU>
        <NHI_KHOA_THAN_KINH_TAM_THAN>Bình thường</NHI_KHOA_THAN_KINH_TAM_THAN>
        <NHI_KHOA_KHAC>Bình thường</NHI_KHOA_KHAC>
        <TEN_LOAI_KHAM_NHI_KHOA_KHAC>Bình thường</TEN_LOAI_KHAM_NHI_KHOA_KHAC>
        <KET_QUA_KHAM_NHI_KHOA_KHAC>Bình thường</KET_QUA_KHAM_NHI_KHOA_KHAC>
        <KHONG_KINH_MAT_TRAI>Bình thường</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>Bình thường</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>Bình thường</CO_KINH_MAT_TRAI>
        <BENH_KHAC_MAT>Bình thường</BENH_KHAC_MAT>
        <BENH_KHAC_TAI_MUI_HONG>Bình thường</BENH_KHAC_TAI_MUI_HONG>
        <BENH_KHAC_RANG_HAM_MAT>Bình thường</BENH_KHAC_RANG_HAM_MAT>
    </KHAM_LAM_SANG>
    <KET_LUAN>
    </KET_LUAN>
</MAU_17_KSK>
```

---
