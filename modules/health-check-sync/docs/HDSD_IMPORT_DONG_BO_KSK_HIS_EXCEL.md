# HƯỚNG DẪN SỬ DỤNG CÔNG CỤ IMPORT SỐ HỒ SƠ & ĐỒNG BỘ HÀNG LOẠT TỪ HIS

## 1. Giới thiệu chức năng
Chức năng **Import từ HIS (Excel)** cho phép quản trị viên / nhân viên y tế tải lên danh sách **Số hồ sơ (HIS Doc No)** từ file Excel (`.xlsx`, `.xls`, `.csv`) để hệ thống tự động quét và kéo toàn bộ dữ liệu khám của bệnh nhân từ cơ sở dữ liệu HIS sang phân hệ **Khám Sức Khỏe VNeID** mà không cần nhập liệu thủ công từng hồ sơ.

---

## 2. Quy trình dữ liệu tự động đồng bộ
Với mỗi Số hồ sơ (`doc_no`) trong file Excel, hệ thống thực hiện đồng bộ toàn diện:
1. **Thông tin Hành chính:** Truy vấn từ bảng `hms_doc` và `hms_patient` (Họ và tên, CCCD, ngày cấp, nơi cấp, ngày sinh, giới tính, số điện thoại, địa chỉ chi tiết, mã tỉnh/xã cư trú, ngày vào khám).
2. **Chỉ số Sinh tồn & Thể lực:** Truy vấn từ bảng `hms_exam` (Mạch, nhiệt độ, huyết áp tâm thu/tâm trương, nhịp thở, chiều cao, cân nặng, BMI, nội dung khám thể lực).
3. **Khám Chuyên khoa:** Truy vấn từ `hms_exam` và `hms_exm_conclusion` (Khám Nội khoa, Tuần hoàn, Hô hấp, Tiêu hóa, Thận - Tiết niệu, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt, Da liễu, Phụ khoa, Thần kinh, Tâm thần).
4. **Tiền sử Bệnh tật & Dị ứng:** Truy vấn từ bảng `hms_disease_hist` (Tiền sử bản thân, gia đình, dị ứng thuốc).
5. **Chỉ định & Kết quả Cận lâm sàng (CLS):** Tự động truy vấn từ hệ thống Xét nghiệm LIMS (`hms_testorder`, `hms_testorderline`) và Chẩn đoán hình ảnh PACS (`hms_pacsorder`, `hms_pacsorderline`).
6. **Kết luận & Phân loại Sức khỏe:** Lấy phân loại sức khỏe (loại 1 đến 5) và chẩn đoán kết luận từ `hms_exm_conclusion`.
7. **Tự động gán Mẫu biểu KSK:**
   - Dưới 6 tuổi: **Mẫu 1** (Trẻ em)
   - Từ 6 đến dưới 18 tuổi: **Mẫu 2** (Học sinh / Vị thành niên)
   - Từ 18 tuổi trở lên: **Mẫu 3** (Người lớn / Định kỳ)
8. **Tự động sinh XML:** Sinh payload XML chuẩn QĐ 1551/2062 sẵn sàng cho việc ký số và gửi cổng giám định liên thông VNeID.

---

## 3. Cấu trúc File Excel
File Excel tải lên chỉ cần chứa cột **Số hồ sơ**. Hệ thống có bộ nhận diện thông minh linh hoạt (Flexible Mapping) tự động bắt các tiêu đề cột sau:
- `Số hồ sơ`, `Mã hồ sơ`, `Số HS`, `doc_no`, `DocNo`, `Doc No`, `Số tiếp đón`, `Mã đợt khám`, `hd_docno`.

*File mẫu chuẩn đã được tạo sẵn tại:* [`mau_import_dong_bo_ksk_his.xlsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/docs/mau_import_dong_bo_ksk_his.xlsx)

---

## 4. Các bước thao tác trên phần mềm

1. **Bước 1:** Đăng nhập vào phân hệ **Liên thông KSK VNeID** $\rightarrow$ Vào mục **Quy trình liên thông** $\rightarrow$ Chọn **Danh sách hồ sơ**.
2. **Bước 2:** Nhấn nút **Import từ HIS (Excel)** trên thanh công cụ phía trên bảng danh sách.
3. **Bước 3:** 
   - Nhấn **Chọn file Excel** và chọn file danh sách (ví dụ: `mau_ksk_his.xlsx`).
   - (Tùy chọn) Bấm **Tải file mẫu Excel** nếu muốn lấy mẫu chuẩn.
4. **Bước 4:** Kiểm tra bảng **Xem trước dữ liệu** (hệ thống sẽ hiển thị số lượng hồ sơ hợp lệ và lọc cảnh báo dòng lỗi/trùng lặp).
5. **Bước 5:** Tích chọn tùy chọn *Ghi đè & Cập nhật lại nếu hồ sơ đã tồn tại* (nếu muốn làm mới dữ liệu cho các hồ sơ chưa ký).
6. **Bước 6:** Nhấn nút **Bắt đầu đồng bộ**.
7. **Bước 7:** Theo dõi **Thanh tiến độ thời gian thực** và **Nhật ký xử lý chi tiết** (Console log).
8. **Bước 8:** Sau khi hoàn tất, nhấn **Đóng & Tải lại danh sách** để xem các hồ sơ vừa được kéo về.
