# BÁO CÁO REVIEW VÀ KIỂM THỬ PHÂN HỆ THỐNG KÊ BỆNH VIỆN (vClinic)

**Dự án:** Hệ thống Quản trị Bệnh viện & Phòng khám Thông minh (vClinic)  
**Thời gian hoàn thành kiểm thử:** 14/08/2026  
**Phạm vi:** Phân hệ Thống kê Bệnh viện (`modules/hospital-statistics`) & Backend Statistics Engine (`backend/src/services/statistics.service.ts`)

---

## 1. Kết Quả Kiểm Thử Toàn Bộ 9/9 Báo Cáo Trên CSDL Thực Tế

Toàn bộ 9 câu truy vấn nghiệp vụ của phân hệ Thống kê Bệnh viện đã được kiểm tra trực tiếp trên PostgreSQL HIS Database, xử lý thành công **100% (9/9 Passed)**:

| STT | Báo cáo / Chức năng | Endpoint API | Trạng thái | Thời gian thực thi | Kết quả dữ liệu ghi nhận |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | **Báo cáo Hoạt động BV Tổng thể** | `GET /statistics/hospital-activity` | ✅ PASSED | **~600ms** | Tổng khám: **182.879** lượt (BHYT: 101.221, Viện phí: 81.658, Chuyển viện: 1.604). |
| **2** | **Thống kê theo Phòng khám** | `GET /statistics/clinics` | ✅ PASSED | **~3.0s** *(Đã tối ưu CTE)* | Chi tiết 13 phòng khám (Phòng Cấp cứu, Khám Nội 01, Nội 02, Ngoại, Sản, Nhi, RHM, YHCT...). |
| **3** | **Biến động BN Điều trị nội trú** | `GET /statistics/inpatient` | ✅ PASSED | **35ms** | Theo dõi cân đối BN theo 6 khoa phòng chuyên môn. |
| **4** | **Báo cáo Cận lâm sàng** | `GET /statistics/paraclinical` | ✅ PASSED | **~1.6s** | Thống kê 10 nhóm cận lâm sàng (Huyết học, Sinh hóa, Vi sinh, X-Quang, Siêu âm, Nội soi...). |
| **5** | **Phẫu thuật - Thủ thuật (PTTT)** | `GET /statistics/surgery` | ✅ PASSED | **~770ms** | Phân loại ca PTTT: Đặc biệt, Loại I, Loại II, Loại III, Thủ thuật. |
| **6** | **Tổng hợp Chi phí Khoa phòng** | `GET /statistics/department-costs` | ✅ PASSED | **~9.5s** | Ma trận viện phí 174.100 lượt BN, doanh thu khám, tiền giường, XN, CĐHA, thuốc, máu, VTYT. |
| **7** | **Công suất Giường bệnh** | `GET /statistics/bed-occupancy` | ✅ PASSED | **33ms** | Giường kế hoạch, giường thực tế và tỷ lệ lấp đầy giường theo khoa. |
| **8** | **Biểu đồ Xu hướng Lượt khám** | `GET /statistics/dashboard-charts` | ✅ PASSED | **~410ms** | 2.013 điểm dữ liệu theo ngày phục vụ render BarChart / AreaChart. |
| **9** | **Top 10 Bác sĩ Khám Nhiều Nhất** | `GET /statistics/top-doctors` | ✅ PASSED | **115ms** | Danh sách Top 10 bác sĩ kèm họ tên đầy đủ và số lượt khám. |

---

## 2. Chi Tiết Các Tối Ưu & Sửa Lỗi Đã Thực Hiện

### 1. Chuẩn hóa Column Schema & Table Joins
- **Lỗi cột `he_suggestion`:** Đổi thành `hd_suggestion` trên bảng `hms_doc` (`'I'` = Nhập viện, `'T'` = Chuyển viện, `'D'` = Cho về).
- **Lỗi cột `sd_active`:** Đổi thành `sd_isactive` trên bảng `sys_dept`.
- **Lỗi danh mục giường:** Thay thế truy vấn trực tiếp bảng `sys_dept` bằng `LEFT JOIN` với bảng danh mục giường `hms_bedlist` để tính `giuong_thuc_ke` và `giuong_ke_hoach`.
- **Lỗi chi phí cận lâm sàng:** Join chính xác `pcms_order` với `pcms_order_line (ol.hfe_cost)`.
- **Lỗi phân loại PTTT:** Phân loại dựa trên mã nhóm chuẩn `hfl_groupid IN ('B4001', 'B4002', 'B4003', 'B4004', 'B5000')` và tên dịch vụ.

### 2. Tối ưu Hiệu năng Truy vấn (Performance Optimization)
- **Áp dụng CTE Subquery Aggregation cho Báo cáo Phòng khám (`getClinicsStatistics`):** Gom nhóm số liệu theo phòng khám trước khi kết nối danh mục phòng, giảm thời gian xử lý từ 6.5s xuống 3.0s.
- **Tối ưu hóa Báo cáo Chi phí Khoa phòng (`getDepartmentCostStatistics`):** Loại bỏ câu truy vấn con lồng nhau `SELECT sd_name FROM sys_dept` trên từng dòng trong 174.000 bản ghi, chuyển sang join bảng ở lớp ngoài sau khi GROUP BY.

---

## 3. Cấu Trúc Giao Diện & Trải Nghiệm Người Dùng (Frontend UI/UX)

- **Bộ lọc dùng chung (`CommonFilter.tsx`):**
  - Hỗ trợ chọn ngày/giờ chi tiết (`datetime-local`).
  - Phím tắt nhanh: *Hôm nay, Hôm qua, Tuần này, Tháng này*.
  - Xuất file Excel tự động định dạng tên file theo ngày (`XLSX`).
  - Hỗ trợ in ấn trực tiếp (`window.print()`).
- **Khả năng hiển thị số liệu an toàn:**
  - Định dạng tiền tệ và số lượng chuẩn Việt Nam (`toLocaleString()`).
  - Xử lý giá trị null/undefined, trạng thái đang tải (`loading spinner`) và khi không có dữ liệu (`Empty state`).
