# TÀI LIỆU THIẾT KẾ KỸ THUẬT VIMES
## Chức năng: Kios Đăng Ký Tự Động - Module: Tiếp Đón

### 1. Phân tích Module của hệ thống
* **Tên Module:** Tiếp đón Bệnh nhân (Reception Module).
* **Mục đích:** Giảm tải cho nhân viên Lễ tân bằng cách cho phép bệnh nhân tự lấy số, tự khai báo thông tin hành chính, và chủ động thanh toán tạm ứng viện phí qua máy Kios.
* **Các nghiệp vụ chính trong Module:** Đăng ký bằng CCCD, Thanh toán VNPAY/MoMo.

### 2. Tổng quan Nghiệp vụ
* **Tên nghiệp vụ:** Đăng ký khám qua Kios.
* **Mô tả:** Bệnh nhân đưa thẻ CCCD vào đầu đọc, khai báo lý do khám (bằng cảm ứng), hệ thống tạo hồ sơ và nhả phiếu in giấy giống với việc làm tại quầy.
* **Actor tham gia:** 
  - Bệnh nhân (Tương tác trực tiếp)

### 3. Luồng nghiệp vụ (Workflow)
1. Bước 1: Máy Kios phát âm thanh chào mừng, yêu cầu Bệnh nhân quét mã QR CCCD hoặc Thẻ BHYT.
2. Bước 2: Hiển thị giao diện màn hình Cảm ứng yêu cầu Xác nhận Thông tin (Khớp CCCD với DB bệnh viện).
3. Bước 3: Cho BN chọn Khoa Cần Khám.
4. Bước 4: Trừ tiền phí ban đầu bằng Quét mã QR VNPay/Momo tĩnh hiện trên máy (API Webhook xác nhận thanh toán).
5. Bước 5: Máy in ra phiếu có số phòng và STT. Cổng Kios gửi API lên Core gọi cấp số tự động.

### 4 & 5. Thiết kế Chức năng Giao diện (UI) và Data Mapping
| STT | Tên Control (UI) | Loại Control | Label Hiển thị | Bảng DB Target | Field Mapping | Bắt buộc |
|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | `btnTouchDept` | Cảm ứng | Chọn Chuyên Khoa | `hms_exam` | `he_deptid` | **Có** |
| 2 | `txtPhoneKios` | Bàn phím ảo | Nhập SĐT | `hms_doc` | `hd_telephone` | **Có** |

### 6. Danh sách API Backend
| API Name | Method | Route | Input Parameters | Output Response | Mô tả |
|:---|:---:|:---|:---|:---|:---|
| **Lấy danh sách Khoa phục vụ Kios** | `GET` | `/api/v1/kios/departments` | `kiosId` | `List<Dept>` | Trả về các khoa đang trống phòng |

### 7. Business Logic & Các trường hợp đặc biệt
* Bệnh nhân BHYT thường sẽ không dùng Kios được vì cần đối soát thẻ vật lý, tuy nhiên Kios Version 2.0 có thể check qua cổng BHXH. Hiện chỉ cho Khám Dịch Vụ.
* Thanh toán Failed nhưng đã tạo phiếu: Rollback (Huỷ hóa đơn / Đưa vào Unpaid bill).

### 8. Database Schema Database liên quan (PostgreSQL)
| Bảng (Table) | Mô tả ngắn gọn | Các trường khóa / Trạng thái quan trọng |
|:---|:---|:---|
| `hms_doc` | Nguồn tạo phiếu | Có thể gắn thêm thuộc tính Source = 'KIOS' để phân biệt vs Lễ tân gõ |

### 9. Checklist Công việc Phát triển
- **UI / Frontend**
  - [ ] Thiết kế Layout Cảm ứng (Nút to, màu rõ, dễ bấm).
- **Backend / API**
  - [ ] Viết API Payment Gateway cho VNPAY.

### 10. Test Case Cơ bản
1. [Happy Path] Bệnh nhân quét CCCD, ấn 3 nút, trả tiền và lấy phiếu khám.
