# BẢO CÁO ĐỐI CHIẾU & SO SÁNH: QUYẾT ĐỊNH 2062/QĐ-BYT VÀ QUYẾT ĐỊNH 1551/QĐ-BYT

Báo cáo này đối chiếu chi tiết các thay đổi giữa Quyết định sửa đổi mới **2062/QĐ-BYT (ban hành ngày 07/07/2026)** và Quyết định gốc **1551/QĐ-BYT (ban hành ngày 31/05/2026)** về đặc tả liên thông dữ liệu Khám sức khỏe định kỳ lên hệ thống VNeID.

---

## 1. Bảng đối chiếu thay đổi tổng thể theo phân mục

| Phân mục đối chiếu | Nội dung cũ (QĐ 1551/QĐ-BYT) | Nội dung mới (QĐ 2062/QĐ-BYT) | Loại thay đổi | Mức độ ảnh hưởng | Phạm vi / Module chịu ảnh hưởng |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Số lượng Mẫu biểu liên thông** | Gồm 17 mẫu biểu tương ứng với 17 tệp XML độc lập từ Mẫu 1 đến Mẫu 17. | Rút gọn thành **3 mẫu biểu** theo nhóm tuổi (Dưới 6 tuổi, Từ 6 đến dưới 18 tuổi, Trên 18 tuổi). | **Thay thế** | 🔴 Rất cao | Phân hệ Khám sức khỏe, Lập trình sinh XML liên thông. |
| **Cấu trúc tệp dữ liệu XML** | Mỗi hồ sơ khám sức khỏe đóng gói trong 1 tệp XML duy nhất tùy theo mẫu (Ví dụ: `<MAU_2_KSK>`). | Chuyển đổi sang mô hình **Master-Detail gồm nhiều phân hệ XML (XML1 -> XML12)** nằm trong một phong bì chung. | **Sửa đổi** | 🔴 Rất cao | Module sinh tệp tin XML (`xml-generator.ts`), Cổng API. |
| **Môi trường kết nối cổng** | Chỉ đề cập cổng Sandbox chung của CSDL sức khỏe. | Tách rõ **02 phân hệ môi trường**: Cổng dữ liệu sức khỏe của Bộ Y tế (`csdlksk.vn`) và Trục dữ liệu Bộ Y tế (`emrhub.vn`). | **Thêm mới** | 🟡 Trung bình | Cấu hình Settings, Sync service (`health-check-sync.service.ts`). |
| **Độ chính xác dữ liệu** | Gửi dữ liệu khám thô trực tiếp lên cổng. | Ràng buộc tiêu chuẩn **"Đúng, Đủ, Sạch, Sống"**; kiểm tra logic, danh mục dùng chung trước khi tích hợp. | **Sửa đổi** | 🟡 Trung bình | Logic kiểm tra dữ liệu đầu vào (Validation) trước khi ký số. |
| **Quy trình ký số** | Đề cập chung về ký số của CSKCB. | Quy định chi tiết quy trình ký số tổ chức của CSKCB và ký số của bác sĩ kết luận trực tiếp trên tệp XML con. | **Sửa đổi** | 🟡 Trung bình | Chức năng ký số (`signDocuments` trong `documents.ts`). |
| **Tích hợp dữ liệu BHXH** | Chưa quy định rõ phương án đồng bộ chéo. | Bổ sung Phụ lục 03 đặc tả API đồng bộ dữ liệu từ Bảo hiểm xã hội Việt Nam (VSS) về Cổng dữ liệu Bộ Y tế. | **Thêm mới** | 🟢 Thấp | Module Liên thông bảo hiểm, Module nhận dữ liệu từ BHXH. |
| **Hiển thị ứng dụng VNeID** | Hiển thị toàn bộ trường dữ liệu của 17 mẫu biểu. | Ban hành Phụ lục 04 quy định cụ thể danh mục các trường được chọn lọc để hiển thị lên ứng dụng VNeID của người dân. | **Thêm mới** | 🟢 Thấp | Frontend View hiển thị của VNeID, Báo cáo in ấn. |

---

## 2. So sánh chi tiết cấu trúc trường thông tin (Mẫu Người lớn >= 18 tuổi)

So với Mẫu 2 của Quyết định 1551 cũ, Mẫu 3 mới dành cho người lớn (từ đủ 18 tuổi trở lên) có một số điều chỉnh về tên trường và tính bắt buộc:

* **Sự thay đổi về cấu trúc**: Thay vì gom tất cả các trường thể lực, lâm sàng và CLS vào chung một thẻ phẳng, QĐ 2062 tách nhỏ dữ liệu thành các khối độc lập:
  * `XML1` (Hành chính): Giữ các trường `HO_TEN`, `GIOI_TINH`, `NGAY_SINH`, `SO_CCCD`, `DIA_CHI`, `MATINH_CU_TRU`, `MAXA_CU_TRU`, `DIEN_THOAI`.
  * `XML2` (Lần khám): Chứa `MA_LK`, `MA_CSKCB`, `MA_GTIN_CSKCB`, `DOI_TUONG`, `NGUON_CHI_TRA`, `MA_LOAI_KCB`, `NGAY_VAO`.
  * `XML3` (Dấu hiệu sinh tồn): Tách riêng các trường mạch, huyết áp, nhiệt độ từ thể lực cũ.
  * `XML10` (Khám thể lực): Chứa chiều cao, cân nặng, BMI, phân loại thể lực.
  * `XML11` (Cận lâm sàng): Mảng các chỉ số XN, CĐHA.

* **Trường dữ liệu Thêm mới**:
  * `MA_GTIN_CSKCB` (chuẩn GLN - 13 số): Bắt buộc trong tệp thông tin chung lần khám để xác định pháp nhân quốc tế của bệnh viện.
  * `CKDT_NOI_KHOA_TUAN_HOAN` (và các trường chữ ký bác sỹ khám chuyên khoa): Hỗ trợ ký số điện tử của từng bác sỹ khám chuyên khoa, thay vì chỉ có bác sỹ kết luận ký số như trước đây.

* **Trường dữ liệu Bãi bỏ / Thay thế**:
  * Các trường tiền sử sản phụ khoa rườm rà (như tính chất kinh nguyệt, chu kỳ kinh, lượng kinh, đau bụng kinh, biện pháp tránh thai) ở người lớn đã được tinh giản, chỉ giữ lại các chỉ số tiền sử sản khoa chính (`SAN_KHOA_KHONG_BT`, `MA_BENH_SAN_KHOA_KHONG_BT`).

---

## 3. Đánh giá tác động đến việc tích hợp dữ liệu
Việc QĐ 2062 rút gọn 17 mẫu biểu thành 3 nhóm tuổi giúp đơn giản hóa đáng kể quá trình thiết kế cơ sở dữ liệu trên HIS. Tuy nhiên, việc tách tệp XML liên thông thành cấu trúc Envelope chứa 12-15 XML con đòi hỏi đội phát triển phải xây dựng lại hoàn toàn module tạo file XML (`xml-generator.ts`) từ dạng mẫu đơn phẳng sang cấu trúc cây phân lớp Base64 lồng nhau.
