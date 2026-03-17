# TÀI LIỆU THIẾT KẾ KỸ THUẬT VIMES
## Chức năng: Tất Toán & Quyết Toán BHYT - Module: Viện Phí

### 1. Phân tích Module của hệ thống
* **Tên Module:** Quản Lý Viện Phí (Billing System) - Tương tác BHXH.
* **Mục đích:** Khâu phức tạp nhất của phần mềm Bệnh Viện, Quyết toán (Cân đối) tiền giữa ba (3) bên: Nhà Nước (Quỹ BHYT), Bệnh Viện (Đơn vị cung cấp Mức giá gốc), Bệnh Nhân (Người đồng chi trả).
* **Các nghiệp vụ chính trong Module:** Tạo Bảng Kê 130, Tính % Chiết Khấu, Thu phần Chênh Lệch Dịch vụ, Ký điện tử đẩy cổng 130 BYT.

### 2. Tổng quan Nghiệp vụ
* **Tên nghiệp vụ:** Thanh Toán Quyết Toán Ngoại Trú BHYT.
* **Mô tả:** Cuối lộ trình khám, BN cầm sổ đến quầy thu ngân duyệt hồ sơ BHYT. Máy tính hệ thống rà soát 100% Cận Lâm Sàng & Thuốc. Tính toán theo bảng giá BYT. Cấn trừ %, báo BN phải đóng thêm bao nhiêu tiền và Ký chuyển XML BHYT.
* **Actor tham gia:** 
  - Kế toán BHYT (Người chốt hồ sơ cuối cùng)
  - Giám định viên BHYT

### 3. Luồng nghiệp vụ (Workflow)
1. Kế toán quét thẻ / Quét phiếu của người bệnh (Chế độ khám Thẻ - I).
2. Hệ thống load tổng List Chi phí (Đã lọc những loại ko thuộc quyền BHYT chi trả).
3. Hệ thống Gọi Rule Engine Giá: Bóc tách [Giá Bệnh viện Yêu Cầu] - [Giá Base BHYT quy định].
4. Bệnh nhận hưởng thẻ tuyến Huyện mức 80% (VD Mã 4).
   - Quỹ BHYT gánh: 80% giá Base BHYT.
   - Bệnh nhân gánh: 20% giá Base BHYT (Đồng chi trả) + 100% Tiền Chênh dịch vụ Khám (nếu bệnh viện áp phần chênh lệch). 
5. Kế toán lưu và In "Bảng Kê Chi Phí KCB Kèm BHYT Mẫu 01/BV".
6. Yêu cầu BN đóng tiền phần "Đồng chi trả & Chênh". Thu tiền -> Đóng Ticket (Hoàn tất khám BHYT).

### 4 & 5. Thiết kế Chức năng Giao diện (UI) và Data Mapping
| STT | Tên Control (UI) | Loại Control | Label Hiển thị | Bảng DB Target | Field Mapping | Bắt buộc |
|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | `lblTotalFund` | Nhãn báo số | BHYT chi trả (Quỹ duyệt)| N/A | Calculate Output | Đọc |
| 2 | `lblTotalPatient`| Nhãn báo số | BN Cùng chi trả + Dịch vụ| N/A | Calculate Output | Đọc |
| 3 | `btnGenerate130`| Nút Action | Chốt Bảng Kê (Đẩy cổng XML)| `hms_doc` | `hd_status` ('C') | **Có** |

### 6. Danh sách API Backend
| API Name | Method | Route | Input Parameters | Output Response | Mô tả |
|:---|:---:|:---|:---|:---|:---|
| **Tính Tổng BHYT** | `GET` | `/api/v1/billing/insurance-summary/:doc` | Phiếu khám hồ sơ này | Dữ liệu chia 2 cột (Quỹ & BN) | Logic tính toán nặng nhất hệ thống |
| **Đẩy Bảng 130** | `POST` | `/api/v1/billing/submit-130` | Mã Hồ Sơ | XML XML1, XML2, XML3.. | Chuyển đổi Data sang Dạng chuẩn cổng Giám định BYT |

### 7. Business Logic & Các trường hợp đặc biệt
* **Vượt trần (Overlimit):** Tiền BHYT chi trả / ngày / bệnh nhân không được vượt mức Lương Cơ Sở. Tuỳ thuộc theo luật từng thời kỳ mới cài đặt tham số.
* **Lỗi Thuốc Gái BHYT:** Nếu bác sĩ lỡ tay kê thuốc không có trong danh mục được Bộ y tế cấp phép, API Thanh Toán BHYT sẽ Reject lỗi. Bắt bác sĩ đổi toa, BN đền bù phí.
* **Tạm ngưng/Khoá thẻ (Invalid/Revoked Card):** Thẻ bệnh nhân vừa rách hoặc báo huỷ thẻ hôm qua, cổng 130 Check lỗi => Reject về Kế toán. Phá chốt toàn bộ bảng phí và quy sang Thu Tự Túc 100%.

### 8. Database Schema Database liên quan (PostgreSQL)
| Bảng (Table) | Mô tả ngắn gọn | Các trường khóa / Trạng thái quan trọng |
|:---|:---|:---|
| `hms_fee` | Phân tách Giá BHYT và Giá Cùng chi trả | `hf_insprice` (Giá bảo hiểm), `hf_patprice` (Giá BN đóng) |
| `hms_bhyt_xml` | Chứa dữ liệu XML 4210/130 gửi BHXH | Log Lịch sử Gửi, `Status` = "Đã Giám Định", "Bị Xuất toán" |

### 9. Checklist Công việc Phát triển
- **UI / Frontend**
  - [ ] Hiển thị 2 lề Màn hình: Bên trái thông tin thẻ, Bên phải là Phân chia cột Tài Chính (Tiền Quỹ - Tiền Bệnh Nhân).
- **Backend / API**
  - [ ] Thuật toán băm chuẩn dữ liệu HIS thành cấu trúc XML theo đúng Văn bản 130/Bộ Y Tế MỚI NHẤT.
- **Database**
  - [ ] Bảng Map/Ánh xạ danh mục Viện sang Danh mục chuẩn (List 10,000 danh mục) do Bộ YT cấp mã Code.

### 10. Test Case Cơ bản
1. Bệnh nhân tới thanh toán. Hệ thống rà soát 10 dòng chi phí. 10 dòng đều hợp lệ Map giá trị với giá trần BHXH. Tính % tỷ lệ quỹ gánh là `X` đ. In bảng kê 01/BV chính xác và Không có Lỗi XML.
