# BÁO CÁO DÀ SOÁT ĐỐI CHIẾU SQL DỮ LIỆU BÁO CÁO VỚI MÃ NGUỒN GỐC MFC

> **Ngày thực hiện:** 13/09/2026  
> **Cơ sở dữ liệu kiểm thử:** `vimes_ym` (Bệnh viện Yên Mô)  
> **Mã nguồn MFC gốc đối chiếu:** `D:\DEV\Programs_HIS\` (Đặc biệt `HMSReportForms_YenMo`, `HMSReportForm_LaiChau`, `VIMESHospitalActivityReport`)  
> **Tệp mã nguồn Backend đã đối chiếu & hiệu chỉnh:** [backend/src/services/statistics.service.ts](file:///d:/AI/VIMES_HIS/backend/src/services/statistics.service.ts)

---

## 1. Mục đích & Nguyên tắc thực hiện
1. **Zero-Assumption DB Rule:** Không phỏng đoán bất kỳ bảng hoặc trường nào, đã truy vấn đối chiếu thực tế cấu trúc từ `information_schema.columns` trên cơ sở dữ liệu `vimes_ym`.
2. **Khớp chuẩn nghiệp vụ MFC:** Mọi biểu thức điều kiện (`WHERE`), phân loại đối tượng (`hms_object`), phân nhóm viện phí (`hms_fee_group`), chỉ định phẫu thuật thủ thuật (`hms_operation`), tình hình thu dung nội trú (`hms_treatment_record`, `hms_clinical_record`) đều được đối soát 1:1 với các hàm C++ trong MFC.
3. **Cân đối số liệu logic:** Đảm bảo tính toán giữa các cột trong từng hàng và tổng cột khớp 100%.
4. **Hồi quy & Tương thích ngược:** Tất cả API giữ nguyên định dạng schema trả về cho Frontend, vượt qua bộ test suite `hospital-statistics-corrected.test.ts` (9/9 pass) và `npx tsc --noEmit` đạt 0 lỗi.

---

## 2. Kết quả Dà soát & Đối chiếu chi tiết theo từng Báo cáo

### 2.1. Báo cáo 01: Hoạt động Bệnh viện Tổng thể (`getHospitalActivity`)
- **Tệp MFC đối chiếu:**
  - `D:\DEV\Programs_HIS\HMSReportForm_LaiChau\Examination\EMrptExamRoomActivitiesReportDialog.cpp`
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\Treatment\TMTinhhinhthudung.cpp`
- **Các tiêu chí đã đối chiếu & chuẩn hóa:**
  1. **Lượt khám:** Điều kiện `he_status <> 'O' AND hd_admitdept = 'KB' AND he_roomid IS NOT NULL` khớp chuẩn MFC C6.
  2. **Phân loại BHYT / Dịch vụ:** `ho_type IN ('I', 'C')` cho BHYT, `ho_type = 'S'` hoặc không thuộc I, C cho Dịch vụ/Viện phí.
  3. **Vào viện:** `hd_suggestion IN ('A', 'I') AND hd_status = 'T'` đồng bộ chính xác giữa ngoại trú khám bệnh và chỉ tiêu vào viện nội trú.
  4. **Nội trú (Biến động):** Thêm điều kiện lọc bệnh nhân thực nằm nội trú `AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)` cho các chỉ tiêu Ra viện, Tử vong, Đang điều trị và Chuyển viện nội trú, loại trừ bệnh nhân ngoại trú điều trị ban ngày gây lệch số liệu giường.
  5. **Cận lâm sàng:** Tách riêng 3 nhóm chuẩn LIS (`B1`), PACS (`B2`), TDCN (`B3`), loại trừ hoàn toàn Phẫu thuật (`B4`) và Thủ thuật (`B5`).
  6. **Phẫu thuật / Thủ thuật:** Lấy từ `hms_operation` với `ho_status <> 'O' AND SUBSTR(hfl_groupid, 1, 2) IN ('B4', 'B5')`.

---

### 2.2. Báo cáo 02: Hoạt động Phòng khám (`getClinicsStatistics`)
- **Tệp MFC đối chiếu:**
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\Examination\EMBaocaosolieukhoakhambenh.cpp`
  - `D:\DEV\Programs_HIS\HMSReportForm_LaiChau\Examination\EMrptExamRoomActivitiesReportDialog.cpp`
- **Các tiêu chí đã đối chiếu & chuẩn hóa:**
  1. **Danh sách phòng:** Lấy từ danh mục `hms_roomlist` với `(hrl_deptid = 'KB' OR hrl_type IN (0, 1, 2, 8)) AND hrl_active = 'Y'`.
  2. **Tổng lượt khám:** `COUNT(DISTINCT he_docno) FILTER (WHERE he_status <> 'O')`.
  3. **Ra viện / Cho về:** Khớp `hd_suggestion = 'D' AND hd_status = 'T'`.
  4. **Đang khám:** Khớp trạng thái `he_status = 'P'`.
  5. **Chuyển viện:** Khớp `hd_suggestion = 'T' AND hd_status = 'T'`.
  6. **Nhập viện:** Khớp `hd_suggestion IN ('A', 'I') AND hd_status = 'T'`.

---

### 2.3. Báo cáo 03: Biến động Điều trị Nội trú (`getInpatientStatistics`)
- **Tệp MFC đối chiếu:**
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\Treatment\TMTinhhinhthudung.cpp` (các hàm `GetQueryString()` đến `GetQueryString7()`).
- **Các phát hiện & tinh chỉnh chuẩn hóa theo MFC:**
  1. **Khoa phòng hiển thị:** MFC lọc theo `sd_type = 'DT'` (khoa điều trị nội trú), tránh lẫn các phòng ban hành chính (BGD, Hành chính, Kế hoạch tổng hợp...) vốn không có người bệnh điều trị.
  2. **Đầu kỳ (Cũ):** 
     - Khớp MFC `GetQueryString()`: `htr.htr_admitdate < FromDate AND (htr.htr_status = 'I' OR (htr.htr_status = 'T' AND htr.htr_dischargedate >= FromDate)) AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL)`.
  3. **Vào viện:** 
     - Khớp MFC `GetQueryString1()`: Bệnh nhân tiếp nhận vào khoa ban đầu `(hcr.hcr_admitdept = htr.htr_deptid OR htr.htr_idx = 1) AND htr.htr_status <> 'A' AND htr.htr_admitdate BETWEEN FromDate AND ToDate`.
  4. **Chuyển khoa đến:** 
     - Khớp MFC `GetQueryString2()`: `htr.htr_idx > 1 AND hcr.hcr_admitdept <> htr.htr_deptid AND htr.htr_status <> 'A' AND htr.htr_admitdate BETWEEN FromDate AND ToDate`.
  5. **Chuyển khoa đi:** 
     - Khớp MFC `GetQueryString5()`: `htr.htr_status = 'T' AND htr.htr_suggestion = 'M' AND htr.htr_dischargedate BETWEEN FromDate AND ToDate`.
  6. **Ra viện:** 
     - Khớp MFC `GetQueryString3()`: `htr.htr_status = 'T' AND htr.htr_suggestion NOT IN ('M', 'F') AND (hcr.hcr_result NOT IN ('5', '6') OR hcr.hcr_result IS NULL) AND htr.htr_dischargedate BETWEEN FromDate AND ToDate`.
  7. **Tử vong:** 
     - Khớp MFC `GetQueryString6()`: `htr.htr_status = 'T' AND hcr.hcr_result IN ('5', '6') AND htr.htr_dischargedate BETWEEN FromDate AND ToDate`.
  8. **Hiện diện:**
     - Công thức logic khép kín: `hien_dien = dau_ky + vao_vien + chuyen_den - chuyen_di - ra_vien - tu_vong`.

---

### 2.4. Báo cáo 04: Cận lâm sàng (`getParaclinicalStatistics`)
- **Tệp MFC đối chiếu:**
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\Treatment\TMHoatdongcanlamsang.cpp`
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\HospitalFee\HFSoXn.cpp`
- **Các tiêu chí đã đối chiếu & chuẩn hóa:**
  1. **Phân nhóm dịch vụ:**
     - `B1%`: Toàn bộ các chuyên khoa Xét nghiệm (Huyết học `B1100`, Sinh hóa `B1200`, Nước tiểu `B1300`, Vi sinh `B1500`...).
     - `B2%`: Chẩn đoán hình ảnh (X-quang `B2100`, City-scan `B2200`, MRI `B2300`, Siêu âm màu/đen trắng `B2400`, `B2500`, Nội soi `B2600`, `B2700`...).
     - `B3%`: Thăm dò chức năng (Điện tim `B3300`, Điện não `B3400`, Nội soi/Siêu âm chức năng `B3100`, `B3200`...).
  2. **Chuẩn hóa tên CT-Scanner:** Mã `B2200` hoặc tên có chứa `city-scan`/`32 dãy` được hiển thị chuẩn thành `CT- Scanner`.
  3. **Phân định Ca BHYT & Dịch vụ:** Dựa trên đối tượng thanh toán `hfe_object IN (4, 6, 13, 14)`, `ho_type IN ('I', 'C')` hoặc khoản chi trả bảo hiểm `hfe_inspaid > 0 OR hfe_discount > 0`. Đảm bảo `ca_bhyt + ca_dichvu = tong_so_ca`.

---

### 2.5. Báo cáo 05: Phẫu thuật - Thủ thuật (`getSurgeryStatistics`)
- **Tệp MFC đối chiếu:**
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\Treatment\TMOperationPatientListReport.cpp`
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\Treatment\TMThongKePTTT.cpp`
- **Các phát hiện & tinh chỉnh chuẩn hóa theo MFC:**
  1. **Khoa thực hiện (Performing Department):**
     - Trong MFC: Thống kê dựa trên khoa trực tiếp thực hiện phẫu thuật/thủ thuật: `COALESCE(ho_pdeptid, ho_deptid)`. Sửa câu lệnh dùng `COALESCE(ho_pdeptid, ho_deptid)` để ghi nhận chính xác công sức các khoa chuyên khoa (Răng hàm mặt, Tai mũi họng, Ngoại tổng hợp, Đông y...).
  2. **Bao phủ toàn viện:** Loại bỏ ràng buộc cứng `ho_depttype = 'I'` để tính toán đầy đủ cả phẫu thuật nội trú và thủ thuật ngoại trú theo chuẩn của biểu mẫu `TMThongKePTTT` (`TotalI` + `TotalE`).
  3. **Phân loại cấp độ theo mã `hfl_groupid` và `hms_fee_group`:**
     - **Đặc biệt:** `hfl_groupid LIKE 'B44%' OR hfl_name ILIKE '%đặc biệt%'`
     - **Loại 1:** `hfl_groupid LIKE 'B41%' AND hfl_groupid NOT LIKE 'B44%'`
     - **Loại 2:** `hfl_groupid LIKE 'B42%'`
     - **Loại 3:** `hfl_groupid LIKE 'B43%'`
     - **Thủ thuật:** `SUBSTR(hfl_groupid, 1, 2) = 'B5'`

---

### 2.6. Báo cáo 06: Tổng hợp Chi phí theo Khoa phòng (`getDepartmentCostStatistics`)
- **Tệp MFC đối chiếu:**
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\HospitalFee\HFDetailedlistofpatientcostinpatienttreatment.cpp`
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\HospitalFee\HFGeneralTreatmentServiceCostReport.cpp`
- **Các phát hiện & tinh chỉnh chuẩn hóa theo MFC:**
  1. **Phát hiện mã Máu `A2000`:** Trong cơ sở dữ liệu `vimes_ym`, chi phí máu và chế phẩm máu được lưu dưới nhóm `A2000` (ngoài mã `A4`).
     - Câu lệnh cũ chỉ quét `SUBSTR(f.hfe_group, 1, 2) = 'A4'`.
     - Đã tinh chỉnh thành: `SUBSTR(f.hfe_group, 1, 2) IN ('A2', 'A4')`.
  2. **Loại trừ tiền Máu khỏi Tiền Thuốc:**
     - Tinh chỉnh: `SUBSTR(f.hfe_group, 1, 1) = 'A' AND SUBSTR(f.hfe_group, 1, 2) NOT IN ('A2', 'A4', 'A9')` đảm bảo chi phí máu `A2000` không bị tính trùng sang tiền thuốc.
  3. **Tiền Giường & Tiền Khám:** Sử dụng `SUBSTR(f.hfe_group, 1, 1) = 'C'` và `SUBSTR(f.hfe_group, 1, 1) = 'D'` để bao hàm toàn diện tất cả các phân nhóm giường/khám phụ nếu có.
  4. **Cân đối tài chính:** Đảm bảo `tong_cong_chi_phi = SUM(10 nhóm thành phần) = bhyt_thanh_toan + benh_nhan_tra` đạt độ chính xác số học tuyệt đối.

---

### 2.7. Báo cáo 07: Công suất Giường bệnh (`getBedOccupancyStatistics`)
- **Tệp MFC đối chiếu:**
  - `D:\DEV\Programs_HIS\VIMESHospitalActivityReport\BCTINHHINHSDGIUONG.cpp`
  - `D:\DEV\Programs_HIS\HMSReportForms_YenMo\HospitalFee\HFGiuongtonghop.cpp`
- **Các tiêu chí đã đối chiếu & chuẩn hóa:**
  1. **Khoa điều trị nội trú:** Lọc theo `sd.sd_type = 'DT'`, loại bỏ các phòng ban gián tiếp/hành chính.
  2. **Số giường thực kê:** Quét trực tiếp danh mục giường bệnh hoạt động `hms_bedlist WHERE hbl_active = 'Y'`. Với database `vimes_ym`, `sd_planned_bed` ở `sys_dept` đang bằng 0 nên hệ thống tự động fallback lấy giường thực kê từ `hms_bedlist` để tính toán tỷ lệ công suất chính xác.
  3. **Bệnh nhân đang nằm:** Đếm bệnh nhân nội trú đang hiện diện `htr_status = 'I' AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)`.

---

## 3. Kết quả Kiểm thử Tự động (Regression Verification)
- **Suite:** `backend/test/hospital-statistics-corrected.test.ts`
- **Tổng số bài test:** 9 bài kiểm thử bao phủ toàn bộ 8 báo cáo và các điều kiện lọc 24h.
- **Kết quả:** **9/9 PASS 100%** (Thời gian chạy ~1.3 giây trên database thực tế).
- **Kiểm tra biên dịch Typescript:**
  - Backend: `npx tsc --noEmit` -> **0 lỗi**
  - Frontend: `npx tsc --noEmit` -> **0 lỗi**
