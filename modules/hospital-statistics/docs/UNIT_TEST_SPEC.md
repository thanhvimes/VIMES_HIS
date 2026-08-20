# ĐẶC TẢ VÀ KẾT QUẢ UNIT TEST PHÂN HỆ THỐNG KÊ BỆNH VIỆN

**Module:** `hospital-statistics`  
**File thực thi Unit Test:** `backend/scripts/test_statistics_unit.ts`  
**Lệnh chạy:** `npx ts-node scripts/test_statistics_unit.ts` (tại thư mục `backend/`)  
**Kết quả thực tế:** **10/10 Passed (100%)**

---

## Danh Sách 10 Test Cases Nghiệp Vụ

### 1. UT01 - Báo cáo Hoạt động Bệnh viện Tổng thể (`getHospitalActivity`)
- **Mục tiêu:** Kiểm tra cấu trúc dữ liệu trả về 4 phần chuyên môn: Khám bệnh (Ngoại trú), Điều trị nội trú, Cận lâm sàng (CLS), Phẫu thuật - Thủ thuật (PTTT).
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - `tong_so >= 0`, `so_bhyt >= 0`, `so_dichvu >= 0`.
  - `tong_so >= so_bhyt` (Tổng số lượt khám >= số lượt BHYT).
  - Cận lâm sàng và PTTT trả về danh sách phân loại hợp lệ.

### 2. UT02 - Thống kê theo Phòng khám (`getClinicsStatistics`)
- **Mục tiêu:** Kiểm tra dữ liệu theo từng buồng khám chuyên khoa.
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Danh sách phòng khám không rỗng (`rows.length > 0`).
  - Mỗi phòng có `room_id`, `room_name` (string), và các chỉ số: `tong_luot_kham`, `so_bhyt`, `so_dichvu`, `nhap_vien`, `chuyen_vien`, `cho_ve`, `dang_kham`.

### 3. UT03 - Biến động BN Điều trị nội trú (`getInpatientStatistics`)
- **Mục tiêu:** Kiểm tra chuyển động và cân đối người bệnh nội trú theo khoa phòng.
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Có các khoa lâm sàng với `dept_id`, `dept_name`.
  - Các chỉ số: `dau_ky`, `vao_vien`, `chuyen_den`, `chuyen_di`, `ra_vien`, `tu_vong`, `hien_dien` đều là số không âm.

### 4. UT04 - Thống kê Cận lâm sàng (`getParaclinicalStatistics`)
- **Mục tiêu:** Thống kê theo nhóm kỹ thuật cận lâm sàng (Huyết học, Sinh hóa, X-Quang, CT, Siêu âm...).
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Có `group_id`, `group_name`, `tong_so_bn`, `tong_so_ca`, `ca_bhyt`, `ca_dichvu`.
  - Doanh thu `tong_thanh_tien >= 0`.

### 5. UT05 - Phẫu thuật - Thủ thuật (`getSurgeryStatistics`)
- **Mục tiêu:** Phân loại phẫu thuật thủ thuật theo tính chất chuyên môn.
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Phân tách rõ các loại: `loai_dac_biet`, `loai_1`, `loai_2`, `loai_3`, `thu_thuat`.
  - `tong_so_ca >= loai_dac_biet + loai_1 + loai_2 + loai_3 + thu_thuat`.

### 6. UT06 - Tổng hợp Chi phí theo Khoa phòng (`getDepartmentCostStatistics`)
- **Mục tiêu:** Ma trận tài chính viện phí và phân bổ chi phí theo bộ phận.
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Kiểm tra đầy đủ các mục chi phí: Tiền khám, tiền giường, xét nghiệm, CĐHA, TDCN, PTTT, thuốc, máu, VTYT, chi phí khác.
  - Phân định rõ `tong_cong_chi_phi`, `bhyt_thanh_toan`, `benh_nhan_tra`.

### 7. UT07 - Công suất sử dụng Giường bệnh (`getBedOccupancyStatistics`)
- **Mục tiêu:** Theo dõi số giường kế hoạch, giường thực tế và tỷ lệ lấp đầy giường.
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - `giuong_ke_hoach >= 0`, `giuong_thuc_ke >= 0`, `bn_dang_nam >= 0`.
  - `ty_le_cong_suat` là số thực hợp lệ (không bị `NaN` hoặc lỗi chia cho 0).

### 8. UT08 - Biểu đồ Xu hướng Lượt khám theo ngày (`getDashboardCharts`)
- **Mục tiêu:** Dữ liệu chuỗi thời gian phục vụ vẽ biểu đồ BarChart / AreaChart.
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Có `exam_date`, `label_date` định dạng ngày tháng `DD/MM`.
  - `tong_kham`, `bhyt`, `vien_phi` là số không âm.

### 9. UT09 - Top 10 Bác sĩ có lượt khám nhiều nhất (`getTopDoctors`)
- **Mục tiêu:** Xếp hạng bác sĩ có lượt khám cao nhất phục vụ quản lý nhân lực.
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Giới hạn tối đa 10 bác sĩ (`rows.length <= 10`).
  - Sắp xếp giảm dần theo `total_visits DESC`.
  - `doctor_name` hiển thị đầy đủ từ danh mục người dùng hệ thống.

### 10. UT10 - Kiểm tra Biên & Dữ liệu Rỗng trong Tương lai (Edge Cases)
- **Mục tiêu:** Đảm bảo hệ thống không bị lỗi crash khi người dùng chọn khoảng ngày không có phát sinh dữ liệu (ví dụ chọn ngày trong tương lai).
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Toàn bộ 8 hàm thống kê trả về mảng rỗng `[]` hoặc số lượng `0` an toàn.
  - Không ném ngoại lệ (`Unhandled Exception`).
