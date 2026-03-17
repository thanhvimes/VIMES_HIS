# TÀI LIỆU THIẾT KẾ KỸ THUẬT VIMES
## Chức năng: Tiếp Nhận Cấp Cứu - Module: Tiếp Đón

### 1. Phân tích Module của hệ thống
* **Tên Module:** Tiếp đón Bệnh nhân (Reception Module).
* **Mục đích:** Là điểm chạm đầu tiên của bệnh nhân với bệnh viện. Đối với Cấp cứu, tối ưu hóa quy trình thủ tục để đưa người bệnh vào chạy chữa nhanh nhất.
* **Các nghiệp vụ chính trong Module:** Tiếp nhận nhanh, Ghi nhận sinh hiệu cơ bản ban đầu, Điền thông tin người nhà.

### 2. Tổng quan Nghiệp vụ
* **Tên nghiệp vụ:** Tiếp Nhận Cấp Cứu.
* **Mô tả:** Đăng ký hồ sơ rút gọn, bỏ qua toàn bộ rào cản hành chính. Đẩy bệnh nhân trực tiếp vào khoa Hồi sức Cấp cứu với mức độ rủi ro tử vong cao nhất.
* **Actor tham gia:** 
  - Điều dưỡng cấp cứu
  - Bộ phận Lễ tân / Bảo vệ (người đứng gác)
  - Người nhà bệnh nhân (người báo tin)

### 3. Luồng nghiệp vụ (Workflow)
1. Bước 1: BN được cáng/cấp cứu viên đưa vào. Nhân viên tạo ngay mã Bệnh nhân/Mã đợt khám ảo (hoặc cấp số thứ tự tạm).
2. Bước 2: Bỏ qua việc xác minh BHYT và đóng viện phí.
3. Bước 3: Đẩy dữ liệu ngay sang Module Khám Bệnh - Khoa Cấp cứu. Màn hình điều dưỡng nháy đỏ báo hiệu có bệnh nhân. 
4. Bước 4: Sau khi cấp cứu ổn định, người nhà sẽ quay lại quầy Tiếp đón để Cập nhật thông tin hành chính đầy đủ (Tên thật, CCCD, BHYT).

### 4 & 5. Thiết kế Chức năng Giao diện (UI) và Data Mapping
| STT | Tên Control (UI) | Loại Control | Label Hiển thị | Bảng DB Target | Field Mapping | Bắt buộc |
|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | `txtFakeName` | TextBox | Tên tạm thời (Ví dụ: Vô Danh 1) | `hms_patient` | `hp_surname`, `hp_firstname` | **Có** |
| 2 | `txtReason` | TextBox | Lý do vào viện | `hms_doc` | `hd_conclusion` | **Có** |
| 3 | `chkStatus` | CheckBox | Rất nguy kịch | `hms_doc` | `hd_emergency` ('Y')| Không |

### 6. Danh sách API Backend
| API Name | Method | Route | Input Parameters | Output Response | Mô tả |
|:---|:---:|:---|:---|:---|:---|
| **Tạo BN Cấp cứu** | `POST` | `/api/v1/reception/emergency` | `fakeName, reason` | `{ patientNo, docNo }` | Bypass hoàn toàn các validate của đăng ký thường |

### 7. Business Logic & Các trường hợp đặc biệt
* Không yêu cầu check ID trùng.
* Các chi phí thăm khám ban đầu sẽ được ghi Nợ (Debt).
* Vẫn đảm bảo tạo DB `hms_patient` và `hms_doc` hợp lệ để phòng khám có số tham chiếu kê đơn/cấp thuốc.

### 8. Database Schema Database liên quan (PostgreSQL)
| Bảng (Table) | Mô tả ngắn gọn | Các trường khóa / Trạng thái quan trọng |
|:---|:---|:---|
| `hms_doc` | Đợt đến khám | Trường `hd_emergency` phải = 'Y' |

### 9. Checklist Công việc Phát triển
- **UI / Frontend**
  - [ ] Form Nhập Cấp cứu (Rút gọn chỉ còn Tên, Giới tính, Lý do).
- **Backend / API**
  - [ ] Viết API riêng cho cấp cứu, không qua middlewares check Auth hoặc Validate Identity.
- **Database**
  - [ ] Thiết lập trigger nếu `hd_emergency='Y'` thì cho phép thiếu thông tin địa chỉ/sdt.

### 10. Test Case Cơ bản
1. [Happy Path] Thêm thành công BN cấp cứu với Tên Vô Danh Vụ Tai Nạn, Phân thẳng vào khoa Cấp cứu, hệ thống cấp phát số hồ sơ nhanh trong < 2 giây.
