# TÀI LIỆU THIẾT KẾ KỸ THUẬT VIMES
## Chức năng: Kê Đơn Thuốc - Module: Khám Bệnh

### 1. Phân tích Module của hệ thống
* **Tên Module:** Khám Bệnh (Examination) - Phần liên thông Dược.
* **Mục đích:** Hoàn thiện khâu điều trị bằng việc chỉ định Dược phẩm (Kê đơn) đúng loại, đúng liều lượng, hướng dẫn bệnh nhân sử dụng thuốc và kết thúc quá trình Khám Bệnh.
* **Các nghiệp vụ chính trong Module:** Kê thuốc Nội trú, Kê thuốc Ngoại trú, Kê đơn BHYT, Kê đơn Thuốc Nhóm Gây Nghiện/Hướng thần.

### 2. Tổng quan Nghiệp vụ
* **Tên nghiệp vụ:** Kê Đơn Thuốc.
* **Mô tả:** Bác sĩ vào tab Kê đơn, tìm kiếm các mặt hàng Thuốc/Vật tư YT trong kho nhà thuốc Bệnh Viện hoặc Kê đơn in giấy tự mua ngoài. Thiết lập số lượng và liều dùng tự động/thủ công.
* **Actor tham gia:** 
  - Bác sĩ phòng khám
  - Dược sĩ (Module duyệt đơn)

### 3. Luồng nghiệp vụ (Workflow)
1. Bác sĩ mở tab Kê Đơn (Pharmacy Order).
2. Ô tìm kiếm gọi API AutoComplete Kho Thuốc (Tốt nhất là lọc theo kho đang còn Tồn).
3. Chọn thuốc -> Điền Số lượng -> Điền Cách Dùng (VD: Sáng: 1 viên, Tối: 1 viên).
4. Áp dụng Mẫu Đơn Thuốc nếu có sẵn (VD: Đơn Viêm Phế Quản chuẩn).
5. Xác nhận & Lưu đơn thuốc. (Tạo phiếu `hms_pharma_order`).
6. Trừ tạm thời (Lock hàng) trong Tồn kho (Để tránh Bác sĩ khác phòng bên cạnh giành kê hết).
7. In Toa Thuốc cho người bệnh đi đóng tiền/tới quầy BHYT lĩnh thuốc.

### 4 & 5. Thiết kế Chức năng Giao diện (UI) và Data Mapping
| STT | Tên Control (UI) | Loại Control | Label Hiển thị | Bảng DB Target | Field Mapping | Bắt buộc |
|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | `txtDrugSearch`| Search Input| Tên Thuốc (Hoạt chất) | N/A | Tìm kho `hms_drug` | Không |
| 2 | `txtQty` | Number Input | Số lượng | `hms_fee_drug` | `hfd_qty` | **Có** |
| 3 | `txtUsage` | TextBox | Liều dùng (Cách dùng) | `hms_fee_drug`| `hfd_usage` | **Có** |

### 6. Danh sách API Backend
| API Name | Method | Route | Input Parameters | Output Response | Mô tả |
|:---|:---:|:---|:---|:---|:---|
| **Lọc Thuốc Kho** | `GET` | `/api/v1/pharmacy/inventory` | Tên SP/Hoạt chất | Danh sách SP & SL Tồn | Có Debounce search |
| **Kê Đơn Bệnh** | `POST` | `/api/v1/exam/prescriptions` | Cụm phiếu Khám (DocNo), Mảng Drug {id, qty, usage} | Lệnh Submit | Đẩy vào kho + Viện phí |

### 7. Business Logic & Các trường hợp đặc biệt
* **Kho BHYT vs Kho Dịch Vụ:** BN thu phí 100% không được kê thuốc thuộc kho Nguồn BHYT 100%. Bác sĩ cần thấy rõ Tag Cờ kho thuốc (Kho Nhà nước - Kho Viện phí - Kho Nội trú).
* **Quản lý Hạn mức BHYT:** Nếu Kê tổng thuốc vượt quá tỷ lệ quy định đối với một ICD-10 cụ thể, Cảnh báo xuất toán BHXH sẽ đỏ lên.
* **Tương tác thuốc (Drug Interactions):** Cảnh báo nếu hai loại thuốc kê sát nhau gây phản ứng dị ứng hoặc triệt tiêu tác dụng. Tích hợp thư viện Tương Tác.

### 8. Database Schema Database liên quan (PostgreSQL)
| Bảng (Table) | Mô tả ngắn gọn | Các trường khóa / Trạng thái quan trọng |
|:---|:---|:---|
| `hms_fee` | Chứa thuốc chung với bill | Loại trừ Record Type = Pharla |
| `hms_pharma_order` | Riêng rẽ phiếu Thuốc của Bác sĩ | `hpo_docno`, `hpo_status` |

### 9. Checklist Công việc Phát triển
- **UI / Frontend**
  - [ ] Bảng Kê thêm/Xoá hàng linh động, phím tắt (Alt+1, Alt+2) để BS không rời tay khỏi bàn phím.
- **Backend / API**
  - [ ] API giữ chỗ Lô / Hạn Sử Dụng thuốc để tránh âm bảng tồn.
- **Database**
  - [ ] Quản lý Hoạt Chất Độc Quyền (Nhóm Thuốc).

### 10. Test Case Cơ bản
1. Bác sĩ tìm thuốc "Panadol", nhìn thấy còn tồn 100 viên. Kê số lượng = 150 viên -> Lỗi Cảnh báo Đỏ (Vượt tồn).
2. Lưu đơn thành công, Hệ thống gửi bill thuốc sang tab Viện Phí tính tiền hợp lệ.
