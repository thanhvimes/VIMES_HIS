# TÀI LIỆU THIẾT KẾ KỸ THUẬT VIMES
## Chức năng: Đăng Ký Chỉ Định Cận Lâm Sàng - Module: Khám Bệnh

### 1. Phân tích Module của hệ thống
* **Tên Module:** Khám Bệnh (Examination)
* **Mục đích:** Bác sĩ yêu cầu bệnh nhân đi làm xét nghiệm, chụp X-Quang, siêu âm nhằm cung cấp số liệu cho kết luận bệnh chính xác.
* **Các nghiệp vụ chính trong Module:** Chỉ định CLS, Hủy chỉ định CLS, Xem kết quả CLS.

### 2. Tổng quan Nghiệp vụ
* **Tên nghiệp vụ:** Chỉ định Cận Lâm Sàng.
* **Mô tả:** Chọn các gói dịch vụ Y tế, gói kỹ thuật phù hợp, gửi lệnh đi Phòng Xét nghiệm (LIS)/Phòng Chẩn đoán (PACS). Hệ thống tính phí tự đẩy qua cổng Viện Phí.
* **Actor tham gia:** 
  - Bác sĩ Lâm sàng

### 3. Luồng nghiệp vụ (Workflow)
1. Trong màn Khám Bệnh, chọn tab **Cận Lâm Sàng**.
2. Tìm kiếm dịch vụ (Siêu âm 4D, Chụp MRI, Máu Thường Quy).
3. Thêm dịch vụ vào giỏ (List chỉ định).
4. Xác nhận lệnh. Bác sĩ ký (xác nhận) CĐ.
5. In phiếu Chỉ định CLS trao cho bệnh nhân.
6. Module Tự động update Bill Viện phí lên quầy thu ngân.
7. Khi khoa CLS làm xong trả kết quả, Bác sĩ nhận popup thông báo và xem chỉ số tại đây.

### 4 & 5. Thiết kế Chức năng Giao diện (UI) và Data Mapping
| STT | Tên Control (UI) | Loại Control | Label Hiển thị | Bảng DB Target | Field Mapping | Bắt buộc |
|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | `inputSearchService`| Ô tìm kiếm | Tìm dịch vụ | N/A | Lọc Catalog | Không |
| 2 | `dgvServiceList` | Danh sách DataGrid | Tên DV, Giá, BHYT | `hms_fee` | `hf_serveid` | **Có** |
| 3 | `txtClinicalSign` | TextArea | Chuẩn đoán lâm sàng | `hms_cls_order` | `ho_diagnostic` | Không |

### 6. Danh sách API Backend
| API Name | Method | Route | Input Parameters | Output Response | Mô tả |
|:---|:---:|:---|:---|:---|:---|
| **Load Danh Mục CLS** | `GET` | `/api/v1/catalogs/services` | Tuỳ chọn Filter (Nhóm Xét nghiệm/Chẩn đoán) | Danh sách Dịch vụ Giá | Bảng giá |
| **Tạo Yêu Cầu CLS** | `POST` | `/api/v1/exam/order-service`| Mảng Service ID, Phiếu khám (DocNo) | Lệnh OK | Tạo Bill tạm & Tạo Lệnh LIS |

### 7. Business Logic & Các trường hợp đặc biệt
* **Ràng buộc BHYT (Cực kỳ quan trọng):** Nếu là thẻ BHYT trái tuyến, giá dịch vụ tự rơi về mức 0% BHYT (Thu tự túc) tuỳ loại thẻ và quy định áp giá bảo hiểm.
* **Đèn cảnh báo Trùng lặp:** Cảnh báo "Bệnh nhân đã được chỉ định Siêu Âm trong 7 ngày gần đây, Bạn có chắc muốn chỉ định chụp lại?".

### 8. Database Schema Database liên quan (PostgreSQL)
| Bảng (Table) | Mô tả ngắn gọn | Các trường khóa / Trạng thái quan trọng |
|:---|:---|:---|
| `hms_fee` | Bảng kê chi phí (Cả THUỐC và CLS) | `hf_docno`, `hf_serveid`, `hf_price`, `hf_status` (P = Paid, N = Not Paid) |
| `hms_cls_result`| Nơi trả kết quả LIS, Chụp ảnh X-Quang | ID Xét nghiệm do Kỹ thuật viên trả về |

### 9. Checklist Công việc Phát triển
- **UI / Frontend**
  - [ ] Hiển thị Bảng giá trực quan khi search, có Checkbox để chọn nhiều.
- **Backend / API**
  - [ ] Viết hàm tính toán giá dịch vụ dựa trên cấp bậc Bảo hiểm và Tuyến BHYT của thẻ.
- **Database**
  - [ ] Ràng buộc Khóa ngoại giữa Danh mục Dịch vụ và Chỉ định.

### 10. Test Case Cơ bản
1. Bác sĩ search "Siêu Âm Mạch Máu" -> Click Checkbox -> Click Cập Nhật. Danh sách hiển thị dịch vụ -> In phiếu thành công -> Bệnh nhân sang phòng Thu ngân thấy hiện phí "Siêu Âm Mạch máu".
