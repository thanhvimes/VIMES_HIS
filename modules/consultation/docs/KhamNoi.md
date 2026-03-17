# TÀI LIỆU THIẾT KẾ KỸ THUẬT VIMES
## Chức năng: Khám Nội Khoa - Module: Khám Bệnh

### 1. Phân tích Module của hệ thống
* **Tên Module:** Khám Bệnh (Examination Module).
* **Mục đích:** Là phân hệ chính dành cho Bác sĩ, nơi Bác sĩ tiếp nhận bệnh nhân từ hàng chờ, chẩn đoán bệnh, yêu cầu xét nghiệm (CLS) và kê đơn thuốc (Kê đơn).
* **Các nghiệp vụ chính trong Module:** Khám Nội, Khám Nhi, Khám Mắt, Gọi bệnh nhân, Kê đơn, Chỉ định Cận lâm sàng, Cho nhập viện.

### 2. Tổng quan Nghiệp vụ
* **Tên nghiệp vụ:** Khám Bệnh Lâm Sàng (Khám Nội).
* **Mô tả:** Bác sĩ gọi STT tiếp theo thông qua màn hình Phòng khám, theo dõi các chỉ số sinh tồn (mạch, nhiệt độ, HA do Điều dưỡng đo), nhập liệu bệnh xử lý, chuẩn đoán (Mã ICD10) và kết luận tình trạng.
* **Actor tham gia:** 
  - Bác sĩ phòng khám
  - Điều dưỡng/Trợ lý

### 3. Luồng nghiệp vụ (Workflow)
1. Bước 1: BS thấy STT ở cột "Đang chờ", click "Gọi Khám" để hắt loa báo số ở sảnh. Trạng thái BN chuyển sang `processing`.
2. Bước 2: Bệnh nhân bước vào, BS xem Lịch sử Khám (EMR).
3. Bước 3: Đo sinh hiệu cập nhật (nếu chưa đo ở cửa). Khám lâm sàng và nhập "Triệu chứng", "Bệnh sử".
4. Bước 4: Nếu chỉ đủ kết luận -> Bước 6 (Kết luận đơn thuần).
5. Bước 5: Nếu cần Cận lâm sàng -> Mở form Chỉ Định CLS (Siêu âm, X-Quang, Máu). Chờ BN trả KQ về.
6. Bước 6: Nhập Chuẩn đoán Chính (Chọn bệnh ICD-10). Đánh giá Bệnh BHYT.
7. Bước 7: Kê toa (Phần Mềm tương tác đơn thuốc). Ký điện tử và hoàn tất. Phiếu khám đổi trạng thái sang `completed`.

### 4 & 5. Thiết kế Chức năng Giao diện (UI) và Data Mapping
| STT | Tên Control (UI) | Loại Control | Label Hiển thị | Bảng DB Target | Field Mapping | Bắt buộc |
|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | `txtSymptoms` | TextArea | Triệu chứng lý do | `hms_clinic` | `hc_symptoms` | **Có** |
| 2 | `txtHeartRate` | TextBox | Nhịp tim (l/p) | `hms_clinic` | `hc_pulse` | Không |
| 3 | `txtBloodPress`| TextBox | Huyết áp (mmHg) | `hms_clinic` | `hc_bloodpressure` | Không |
| 4 | `cboICD10` | AutoComplete | Chuẩn đoán chính | `hms_exam` | `he_icd10` | **Có** |
| 5 | `txtConclusion`| TextArea | Kết luận chung | `hms_exam` | `he_conclusion` | **Có** |

### 6. Danh sách API Backend
| API Name | Method | Route | Input Parameters | Output Response | Mô tả |
|:---|:---:|:---|:---|:---|:---|
| **Lấy Hàng Đợi BS** | `GET` | `/api/v1/exam/queue` | `roomId` | `List<ExamPatient>` | BN xếp hàng phòng hiện tại |
| **Bản Ghi Khám bệnh** | `POST`| `/api/v1/exam/clinic-record` | Dữ liệu Sinh hiệu, Bệnh sử, Triệu chứng | `Success` | Lưu lưu vết khám thực tế |
| **Kết luận bệnh án** | `PUT` | `/api/v1/exam/finish` | ID Phiếu Khám, ICD10, Lời dặn | `Success` | Hoàn tất thăm khám, cập nhật status |

### 7. Business Logic & Các trường hợp đặc biệt
* **Call Patient:** Số nhảy trên Màn TV hành lang đồng bộ thời gian thực bằng WebSocket/Socket.io.
* **ICD-10 Constraint:** Bệnh BHYT bắt buộc phải chọn chính xác ICD-10 bằng AutoComplete để quyết toán, không cho nhập tay tự do mã bệnh nếu ko có trong catalog.
* **Bỏ qua khám (Skip):** Nếu gọi 3 lần không vào, cho đẩy STT đó xuống đáy danh sách chờ.

### 8. Database Schema Database liên quan (PostgreSQL)
| Bảng (Table) | Mô tả ngắn gọn | Các trường khóa / Trạng thái quan trọng |
|:---|:---|:---|
| `hms_exam` | Kết luận sau cùng | Update status='C' (Closed), record ngày kết thúc |
| `hms_clinic` | Bản ghi chi tiết 1 lần gặp BS| Ghi Mạch, HA, Thể trạng, Chiều cao, Cân nặng |

### 9. Checklist Công việc Phát triển
- **UI / Frontend**
  - [ ] Màn hình ListView Hàng đợi + Detail Split window (Trái hàng đợi, Phải thông tin nhập liệu).
  - [ ] Tích hợp API ICD-10 Search động (debounce 300ms).
- **Backend / API**
  - [ ] Xử lý Update trạng thái Hàng chờ phòng khám (O -> I -> C).
- **Database**
  - [ ] View thống kê (Phòng này hôm nay hoàn tất bao nhiêu bệnh nhân).

### 10. Test Case Cơ bản
1. Bác sĩ mở giao diện thấy 10 STT. Bấm Gọi số 1. Form khám số 1 mở ra sẵn sàng nhập liệu, trạng thái màu cam (Processing).
2. Lưu chỉ số Huyết áp không hợp lệ (VD chữ thay vì số). Báo lỗi văng.
3. Hoàn tất phiếu mà ko chọn tên bệnh ICD-10 (Với chế độ BHYT). App cảnh báo chặn lưu.
