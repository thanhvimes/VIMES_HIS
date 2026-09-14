# ĐẶC TẢ VÀ KẾT QUẢ UNIT TEST PHÂN HỆ THỐNG KÊ BỆNH VIỆN

**Module:** `hospital-statistics`  
**File thực thi Unit Test:** `backend/test/hospital-statistics-corrected.test.ts`  
**Lệnh chạy:** `node --test -r ts-node/register test/hospital-statistics-corrected.test.ts` (tại thư mục `backend/`)  
**Kết quả thực tế:** **7/7 Test Cases Passed (100%)**

---

## Danh Sách Chi Tiết Các Kịch Bản Kiểm Thử Tự Động

### 1. TC01 - Báo cáo Hoạt động BV Tổng thể (`getHospitalActivity`)
- **Mục tiêu:** Kiểm tra cấu trúc dữ liệu trả về 4 phần chuyên môn: Khám bệnh (Ngoại trú), Điều trị nội trú, Cận lâm sàng (CLS), Phẫu thuật - Thủ thuật (PTTT).
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - `examination`: `tong_so >= 0`, `so_bhyt >= 0`, `nhap_vien >= 0`, `chuyen_vien >= 0`.
  - `inpatient`: `vao_vien >= 0`, `ra_vien >= 0`, `tu_vong >= 0`, `dang_dieu_tri >= 0`, `chuyen_vien_noi_tru >= 0`.
  - Khớp logic C6: `tong_so = so_bhyt + so_dichvu`.
  - Không lẫn nhóm phẫu thuật `B4%` và thủ thuật `B5%` trong mảng `paraclinical`.

### 2. TC02 - Thống kê theo Phòng khám (`getClinicsStatistics`)
- **Mục tiêu:** Kiểm tra dữ liệu theo từng buồng khám chuyên khoa chuẩn C6.
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Danh sách phòng khám có `room_id`, `room_name`, `tong_luot_kham`, `so_bhyt`, `so_dichvu`.
  - Có các chỉ số chuyển biến: `nhap_vien`, `chuyen_vien`, `cho_ve` (hiển thị giao diện là **Ra Viện** theo yêu cầu PDF), và `dang_kham`.
  - Cân đối: `tong_luot_kham >= so_bhyt`.

### 3. TC03 - Biến động BN Điều trị nội trú (`getInpatientStatistics`)
- **Mục tiêu:** Kiểm tra chuyển động và cân đối người bệnh nội trú theo từng khoa lâm sàng (Ground Truth).
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Mỗi khoa có: `dau_ky`, `vao_vien`, `chuyen_den`, `chuyen_di`, `ra_vien`, `tu_vong`, `hien_dien`.
  - Đảm bảo công thức cân đối bệnh nhân nội trú: `hien_dien = dau_ky + vao_vien + chuyen_den - ra_vien - chuyen_di - tu_vong`.

### 4. TC04 - Báo cáo Cận lâm sàng (`getParaclinicalStatistics`)
- **Mục tiêu:** Thống kê theo nhóm kỹ thuật CLS (Huyết học, Sinh hóa, X-Quang, CT- Scanner, Siêu âm, Nội soi, TDCN...).
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Tuyệt đối không chứa nhóm `B4` (phẫu thuật) hay `B5` (thủ thuật).
  - Tên nhóm "Cắt lớp vi tính" đã được chuẩn hóa hiển thị thành `CT- Scanner`.
  - Chỉ số `ca_bhyt` được tính chính xác từ `hfe_object / hfe_inspaid`, không bị bằng 0 sai lệch.

### 5. TC05 - Báo cáo Phẫu thuật - Thủ thuật (`getSurgeryStatistics`)
- **Mục tiêu:** Phân loại ca mổ và thủ thuật theo phân nhóm và khoa phòng thực hiện (khớp Báo cáo mục 1 nhóm C nội trú).
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Phân tách rõ ràng: `loai_dac_biet`, `loai_1`, `loai_2`, `loai_3`, `thu_thuat`.
  - Không gặp lỗi cột CSDL, sử dụng phân loại từ `hfl_groupid` và `hfl_name`.

### 6. TC06 - Bộ lọc thời gian chuẩn 24 giờ (`formatDateRange`)
- **Mục tiêu:** Đảm bảo khi người dùng chọn ngày từ `YYYY-MM-DD` đến `YYYY-MM-DD`, query luôn bao quát từ `00:00:00` đến `23:59:59`.
- **Tiêu chuẩn nghiệm thu (Assertions):**
  - Đảm bảo dữ liệu phát sinh trong mọi giờ trong ngày (kể cả ca trực đêm 23:30) đều được thống kê đầy đủ.

---

## Lệnh Chạy Kiểm Thử Định Kỳ

```bash
cd backend
node --test -r ts-node/register test/hospital-statistics-corrected.test.ts
```

