# TÀI LIỆU THIẾT KẾ KỸ THUẬT VIMES
## Chức năng: Thu Viện Phí - Module: Viện Phí

### 1. Phân tích Module của hệ thống
* **Tên Module:** Quản Lý Viện Phí (Billing / Finance).
* **Mục đích:** Là mắt xích đảm bảo dòng tiền cho cơ sở Y tế. Quản lý toàn bộ chi tiêu của bệnh nhân (Khám bệnh, Siêu âm, Thuốc, Tạm ứng, Viện phí, BHYT thanh toán).
* **Các nghiệp vụ chính trong Module:** Thu Tạm Ưứng, Thu Chi Phí CLS, Thanh Toán BHYT, Hoàn trả (Refund), Thống kê hóa đơn VAT.

### 2. Tổng quan Nghiệp vụ
* **Tên nghiệp vụ:** Thu Tiền Viện Phí (VND / QRCode / Momo).
* **Mô tả:** Thu ngân Quét mã phiếu của bệnh nhân sau khi Bác sĩ xác nhận Chỉ định Cận Lâm Sàng hoặc Thuốc Dịch Vụ, sau đó xác nhận giao dịch bằng tiền tương ứng.
* **Actor tham gia:** 
  - Kế toán / Thu ngân
  - Bệnh nhân (Đóng tiền)

### 3. Luồng nghiệp vụ (Workflow)
1. Thu ngân quét `Mã Bệnh Nhân (hp_patientno)` hoặc `Mã Phiếu/Số HS (hd_docno)`.
2. Hệ thống tải toàn bộ các khoản phát sinh (Giá trị dịch vụ cần cấn trừ).
    - Ví dụ: Siêu Âm: 200k, Công khám: 150k. Tổng: 350k. BHYT gánh 0k (Vì đang khám thẻ DV). Bệnh nhân gánh 350k.
3. Thu ngân ấn chọn Hình Thức đóng (Tiền mặt / Chuyển khoản / Quẹt máy POS).
4. Click Xác nhận Thu & In Hoá Đơn / Biên lai thu phí.
5. Record thanh toán lưu DB. Gửi cờ "Duyệt" về Khoa Lâm Sàng. BN có thể bắt đầu đi Xét nghiệm (Khoa Xét nghiệm từ chối nhận nếu bệnh nhân chưa đóng mộc "Đã Thu Tiền").

### 4 & 5. Thiết kế Chức năng Giao diện (UI) và Data Mapping
| STT | Tên Control (UI) | Loại Control | Label Hiển thị | Bảng DB Target | Field Mapping | Bắt buộc |
|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | `txtSearch` | TextBox | Số hồ sơ (Enter để quét) | N/A | Truy vấn `hms_fee` | Không |
| 2 | `dgvUnpaid` | Danh sách | Các khoản chưa thu | `hms_fee` | Lọc `hf_status='N'` | **Có** |
| 3 | `lblTotal` | Nhãn số | Tổng phải thu | Sum(`hf_price`) | Runtime | Có |
| 4 | `cboPayType` | ComboBox | HT Thanh toán | `hms_invoice` | `hi_payment_type` | **Có** |

### 6. Danh sách API Backend
| API Name | Method | Route | Input Parameters | Output Response | Mô tả |
|:---|:---:|:---|:---|:---|:---|
| **Lấy Hóa đơn chờ** | `GET` | `/api/v1/billing/unpaid/:docNo` | Số Phiếu Khám | Mảng các mục phí | Lấy ra công khám & thuốc chưa trả |
| **Xác nhận Thanh toán**| `POST`| `/api/v1/billing/pay` | `docNo`, Danh sách ID thu, HTTT (Tiền mặt..) | Lập Hoá Đơn `hi_invoice_id` | Thay đổi Status Fee -> Paid |

### 7. Business Logic & Các trường hợp đặc biệt
* **Hoàn Ứng (Refund/Deposit):** Nếu Khám nội trú, BN đóng dư tạm ứng (Đóng 5Tr, xài hết 4.1Tr), bước "Tất Toán" sẽ hoàn lại 900k tiền mặt thay vì tính phí.
* **Lỗi huỷ dịch vụ:** BN đã đóng tiền Siêu Âm nhưng siêu âm hỏng hoặc BN bỏ về. Thu ngân phải click "Huỷ & Trả Dịch Vụ" nhập Mật Khẩu xác nhận -> API đảo ngược phiếu, xuất tiền trả lại BN (In phiếu Hoàn đỏ).

### 8. Database Schema Database liên quan (PostgreSQL)
| Bảng (Table) | Mô tả ngắn gọn | Các trường khóa / Trạng thái quan trọng |
|:---|:---|:---|
| `hms_fee` | Dịch vụ đơn lẻ | Update `hf_status` = 'P' (Paid), gắn `hf_invoiceid` |
| `hms_invoice` | Bìa hóa đơn mẹ | `hi_invoiceid`, `hi_total_amount`, `hi_payment_method`, `hi_created_by` |

### 9. Checklist Công việc Phát triển
- **UI / Frontend**
  - [ ] Màn thu ngân màu sắc tài chính (Xanh lá / Đỏ) phân định nợ hay là thu.
  - [ ] Hiển thị API QR Code Tĩnh của MOMO / VietQR tự động fill số tiền.
- **Backend / API**
  - [ ] Tích hợp API Hook VietQR để Auto-confirm báo tiếng "Ting" khi nhận tiền bank.
- **Database**
  - [ ] Lưu cực kỳ kỹ Audit Trail (Ai thu, giờ nào, máy nào).

### 10. Test Case Cơ bản
1. [Happy Path] Quét mã bill, hiện số tiền 350.000đ. Nhận đủ tiền mặt bấm F8 thanh toán. Hoá đơn in ra, màn hình xoá data và chờ quét phiếu tiếp theo.
2. [Lỗi Logic] BN quẹt thiếu 500Đ -> Cảnh báo hoặc Không sáng nút Thanh Toán.
