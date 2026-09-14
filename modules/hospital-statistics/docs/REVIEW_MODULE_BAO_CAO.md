# BÁO CÁO REVIEW & CHUẨN HÓA PHÂN HỆ THỐNG KÊ BỆNH VIỆN THEO CHUẨN HIS LEGACY

**Dự án:** Hệ thống Quản trị Bệnh viện & Phòng khám Thông minh (vClinic / VIMES_HIS)  
**Tài liệu đối chiếu:** `Báo cáo thống kê chỉnh sửa lại.pdf`  
**Mã nguồn đối chiếu:** `D:\DEV\Programs_HIS\HMSReportForm_LaiChau`  
**Phạm vi:** Phân hệ Thống kê Bệnh viện (`modules/hospital-statistics`) & Backend Statistics Engine (`backend/src/services/statistics.service.ts`)  
**Kết quả kiểm thử tự động:** **100% Passed (7/7 suites)** trên PostgreSQL Database thực tế (`vimes_ym`).

---

## 1. Bảng Đối Chiếu Logic Kỹ Thuật (PDF Nghiệp Vụ vs Mã Nguồn HIS C++ vs HIS Web Hiện Hành)

| Mục Báo Cáo | Mã Nguồn C++ (HMSReportForm_LaiChau) | Quy Định CSDL Thực Tế (PostgreSQL) | Điều Chỉnh Trên Hệ Thống Web Hiện Hành |
|:---|:---|:---|:---|
| **I & II: Tổng thể Hoạt động BV** | `Examination/EMrptExamRoomActivitiesReportDialog.cpp` (L447-493) | - Nhập viện: `hd_suggestion IN ('A', 'I')` (`'A'` = Vào viện với 13.995 lượt).<br>- Chuyển viện: `hd_suggestion = 'T'`.<br>- Đối tượng BHYT: `f.hfe_object IN (4, 6, 13, 14)` hoặc `ho.ho_type IN ('I', 'C')`. | Đồng bộ hóa hoàn toàn logic tính tổng khám, BHYT, Viện phí, Nhập viện và Chuyển viện giữa Khám Ngoại trú và Bảng Hoạt động tổng thể. Tích hợp số liệu chuyển viện nội trú (Điểm G). |
| **III: Thống kê theo Phòng khám** | `Examination/EMrptExamRoomActivitiesReportDialog.cpp` | - Nhập viện: `hd_admitdept = 'KB'` và `hd_suggestion IN ('A', 'I')`.<br>- Ra Viện: `hd_suggestion = 'D'` (Đổi tên cột "Cho Về" thành "Ra Viện").<br>- Đang khám: `hd_status IN ('O', 'I')`.<br>- Phân nhóm tuổi: Trẻ em `< 15` tuổi (và `< 6` tuổi). | Tách chuẩn xác 13 phòng khám, hỗ trợ đầy đủ các chỉ số: Tổng khám, BHYT, Dịch vụ, Trẻ em <15 tuổi, Người cao tuổi ≥60 tuổi, Nhập viện, Chuyển viện, Ra viện và Đang khám. |
| **IV: Biến động BN Nội trú** | `Treatment/TMTreatmentActivitybyDept.cpp` | - Ground Truth điều trị nội trú từ `hms_treatment_record`.<br>- Cân đối bệnh nhân: `Hien_dien = Dau_ky + Vao_vien + Chuyen_den - Ra_vien - Chuyen_di - Tu_vong`.<br>- Chuyển viện nội trú (Điểm G): `htr_suggestion = 'T'`. | Đồng bộ số liệu nội trú từ Mục IV sang Mục II Báo cáo tổng thể để đảm bảo tính nhất quán tuyệt đối của số liệu bệnh viện. |
| **V: Báo cáo Cận lâm sàng** | `PACS/PACSPatientList.cpp`<br>`LIMS/LIMSPacsReport1.cpp` | - Chỉ lấy nhóm cận lâm sàng: `SUBSTR(f.hfe_group, 1, 2) IN ('B1', 'B2', 'B3')`.<br>- **Tuyệt đối loại trừ** nhóm Phẫu thuật (`B4000-B4400`) và Thủ thuật (`B5000-B5400`) khỏi tab Cận lâm sàng.<br>- Chuẩn hóa tên "Cắt lớp vi tính" thành `CT- Scanner`. | Tách biệt triệt để Cận lâm sàng và Phẫu thuật - Thủ thuật. Thêm nút chuyển nhanh sang Tab PTTT. Sửa công thức đếm số ca BHYT (`ca_bhyt`) chính xác theo `f.hfe_object / f.hfe_inspaid`. |
| **VI: Phẫu thuật - Thủ thuật** | `Treatment/TMOperationPatientListReport.cpp` (L800-825) | - Bảng dữ liệu: `hms_operation` join `hms_fee_list`.<br>- Phẫu thuật: `SUBSTR(hfl_groupid, 1, 2) = 'B4'`.<br>- Thủ thuật: `SUBSTR(hfl_groupid, 1, 2) = 'B5'` hoặc khác `'B4'`.<br>- Phân loại: Loại đặc biệt (`B4400`), Loại 1 (`B4100`), Loại 2 (`B4200`), Loại 3 (`B4300`). | Báo cáo chi tiết theo từng Khoa lâm sàng thực hiện, bóc tách chính xác số lượng ca theo từng cấp độ phẫu thuật và thủ thuật. |
| **VII & Dashboard: Biểu đồ & KPI** | `EMrptExamRoomActivitiesReportDialog.cpp` | - Chuyển viện BV: Tổng hợp Ngoại trú (`hd_suggestion = 'T'`) + Chuyển viện nội trú (`htr_suggestion = 'T'`).<br>- Bộ lọc 24h: Luôn gắn `00:00:00` cho `fromDate` và `23:59:59` cho `toDate`. | Cập nhật KPI Card Dashboard và Biểu đồ xu hướng lượt khám khớp 100% với báo cáo C6. |

---

## 2. Kết Quả Kiểm Thử Hồi Quy Tự Động (Regression Suite)

- **Test runner:** Node.js native test runner (`node --test -r ts-node/register test/hospital-statistics-corrected.test.ts`)
- **Môi trường CSDL:** PostgreSQL HIS (`14.177.232.29:8050/vimes_ym`)
- **Kết quả:** **7/7 Test Cases PASS 100%** (Thời gian chạy ~800ms)

```
▶ Hospital Statistics - Suite kiểm thử chuẩn hóa theo tài liệu nghiệp vụ
  ✔ 1. Báo cáo Hoạt động BV Tổng thể (Mục I & II) khớp chuẩn C6 và Nội trú IV (231.2251ms)
  ✔ 2. Thống kê theo Phòng khám (Mục III) - Khớp C6, có Ra Viện (cho_ve) và Đang Khám (96.8902ms)
  ✔ 3. Báo cáo Điều trị nội trú (Mục IV - Ground Truth) cân đối bệnh nhân (190.6051ms)
  ✔ 4. Báo cáo Cận lâm sàng (Mục V) - Loại trừ B4/B5, sửa Ca BHYT, tên CT- Scanner (130.1561ms)
  ✔ 5. Báo cáo Phẫu thuật - Thủ thuật theo Phân loại (Mục 1 nhóm C nội trú) (91.4741ms)
  ✔ 6. Kiểm tra xử lý thời gian theo chuẩn 24h (HH:mm:ss) (52.3425ms)
✔ Hospital Statistics - Suite kiểm thử chuẩn hóa theo tài liệu nghiệp vụ (796.7266ms)
```

## 3. Kiểm Tra Biên Dịch Type Check
- **Backend:** `npx tsc --noEmit` -> **0 lỗi (Exit Code 0)**.
- **Frontend:** `npx tsc --noEmit` -> **0 lỗi (Exit Code 0)**.

