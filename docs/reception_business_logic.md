# Tài liệu Nghiệp vụ Module Tiếp đón (Reception) - vClinic

Tài liệu này tổng hợp toàn bộ các quy tắc nghiệp vụ (Business Rules) và luồng xử lý (Workflows) được chuyển đổi từ hệ thống VIMES (C++) sang vClinic (Node.js/PostgreSQL). Đây là cơ sở để xây dựng bộ Unit Test.

---

## 1. Luồng Đăng ký mới (Registration - ADD_PATIENT)

### Nghiệp vụ chính:
Khi một bệnh nhân mới đến khám lần đầu, hệ thống thực hiện chuỗi khởi tạo dữ liệu đồng nhất.

### Các rào cản/Kiểm tra (Business Rules):
- **Bắt buộc:** Phải có Họ tên, Giới tính, Năm sinh/Ngày sinh và Phòng khám chỉ định.
- **Thẻ BHYT:** Nếu có số thẻ, phải kiểm tra xem thẻ này có đang được sử dụng ở một hồ sơ "Đang điều trị" của bệnh nhân khác hay không.
- **Số thứ tự (Queue):** Số thứ tự (`he_receptno`) phải được cấp tự động theo phòng khám và theo ngày. Không được trùng số trong cùng một ngày/phòng.

### Dữ liệu khởi tạo:
1.  **hms_patient:** Lưu thông tin hành chính. `hp_midname` mặc định để trống (ghép vào `hp_surname`).
2.  **hms_doc:** Tạo đợt khám mới (Document). `hd_status` = 'O' (Outpatient).
3.  **hms_card:** Nếu là BHYT, lưu thông tin thẻ và đánh dấu `hc_active` = 'Y'.
4.  **hms_exam:** Tạo phiếu khám đầu tiên. `he_receptidx` = 1. `he_status` = 'O'.

---

## 2. Luồng Đăng ký khám lại/Thêm đợt khám (ADD_DOC)

### Nghiệp vụ chính:
Bệnh nhân cũ (đã có mã BN) đến khám một đợt mới.

### Quy tắc:
- Không tạo lại `hms_patient`, chỉ cập nhật thông tin hành chính nếu có thay đổi.
- Tạo mới `hms_doc` và `hms_exam`.
- Kiểm tra nếu bệnh nhân đang có một đợt khám "Chưa kết thúc" (Open Document), hệ thống có thể đưa ra cảnh báo (Warning).

---

## 3. Luồng Đăng ký khám thêm phòng (ADD_EXAM)

### Nghiệp vụ chính:
Bệnh nhân đang trong đợt khám, được chỉ định khám thêm một phòng chuyên khoa khác.

### Quy tắc:
- Sử dụng lại `hd_docno` hiện tại.
- Tạo mới `hms_exam` với `he_receptidx` tự tăng (2, 3...).
- `he_receptno` vẫn phải cấp mới theo phòng khám đó.

---

## 4. Nghiệp vụ Bảo hiểm Y tế (BHYT)

### Logic tính toán:
- **Đúng tuyến/Trái tuyến:** 
    - Nếu mã cơ sở đăng ký (`hc_regcode`) trùng với mã bệnh viện hiện tại -> Đúng tuyến.
    - Nếu có giấy chuyển viện (`hd_reexam` = 'Y') -> Đúng tuyến.
    - Trường hợp Cấp cứu (`hd_emergency` = 'Y') -> Đúng tuyến.
    - Còn lại -> Trái tuyến.
- **Tỷ lệ hưởng:**
    - Đúng tuyến: Thường là 80%, 95% hoặc 100% tùy mã đối tượng.
    - Trái tuyến (Ngoại trú): 40% của tỷ lệ đúng tuyến (Ví dụ: 80% * 40% = 32%).
- **Thẻ cũ/Thẻ mới:** Khi cập nhật thẻ mới, thẻ cũ phải được set `hc_active` = 'N'.

---

## 5. Luồng Cập nhật thông tin (Update)

### Quy tắc ràng buộc:
- **Đổi phòng khám:** Nếu chỉnh sửa `he_roomid`, hệ thống PHẢI tính toán lại `he_receptno` cho phòng mới. Số cũ sẽ bị bỏ trống hoặc để lại vết.
- **Trạng thái phiếu:** Chỉ cho phép sửa phòng khám/loại hình khám khi phiếu khám đang ở trạng thái 'O' (Chờ khám). Nếu đã chuyển sang 'I' (Đang khám) hoặc 'C' (Đã khám), các trường này sẽ bị khóa (ReadOnly).
- **Hành chính:** Cho phép cập nhật Địa chỉ, SĐT, Nghề nghiệp bất cứ lúc nào.

---

## 6. Luồng Xóa Tiếp đón (Delete/Cancel)

### Điều kiện tiên quyết (Safety Checks):
Hệ thống KHÔNG cho phép xóa nếu vi phạm một trong các điều kiện sau:
1.  **Đã thu tiền:** Tồn tại hóa đơn (`hms_fee_invoice`) liên quan đến đợt khám này.
2.  **Đã thực hiện dịch vụ:** Đã có chỉ định cận lâm sàng (Xét nghiệm, CĐHA) trong `pcms_order`.
3.  **Đã có diễn biến:** Bác sĩ đã nhập kết quả khám hoặc đơn thuốc.

### Logic dọn dẹp:
- Xóa phiếu khám (`hms_exam`).
- Nếu đó là phiếu khám duy nhất của đợt đó, xóa luôn hồ sơ (`hms_doc`).
- Nếu là đợt khám duy nhất của bệnh nhân mới tạo, có thể xóa luôn `hms_patient` (tùy cấu hình hệ thống).

---

## 7. Các Case Test mẫu (Unit Test Scenarios)

| ID | Case | Mong đợi (Expected) |
|:--- |:--- |:--- |
| **UT01** | Đăng ký BN mới (Dịch vụ) | Tạo đủ 3 bản ghi (Patient, Doc, Exam), STT cấp đúng. |
| **UT02** | Đăng ký BHYT Trái tuyến | `hd_insline` = 'Y', tỷ lệ hưởng (`hd_disrate`) tính đúng 48/32%. |
| **UT03** | Đăng ký BHYT Cấp cứu | Dù mã cơ sở khác nhưng `hd_emergency`='Y' thì vẫn tính Đúng tuyến. |
| **UT04** | Cập nhật đổi phòng khám | `he_receptno` thay đổi theo dãy số của phòng mới. |
| **UT05** | Xóa tiếp đón đã nộp tiền | API trả về lỗi 400 và thông báo không được phép xóa. |
| **UT06** | Đăng ký trùng phòng trong ngày | Store Procedure trả về lỗi "Phiếu khám đã tồn tại". |
| **UT07** | BN cũ thêm lượt khám mới | `hp_patientno` giữ nguyên, `hd_docno` và `he_docno` sinh mới. |
| **UT08** | Sửa họ tên bệnh nhân | Họ tên được chuẩn hóa (Upper case), Midname xử lý đúng logic ghép chuỗi. |

---

## 8. Tham chiếu bảng dữ liệu

- **hms_patient:** Thông tin hành chính gốc.
- **hms_doc:** Thông tin lượt khám (Đối tượng, BHYT, Tuyến).
- **hms_card:** Chi tiết các thẻ BHYT bệnh nhân từng sử dụng.
- **hms_exam:** Chi tiết phiếu khám (Phòng, STT, Chẩn đoán sơ bộ).
