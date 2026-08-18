# BÁO CÁO CẬP NHẬT ĐỒNG BỘ DỮ LIỆU SINH HIỆU & KHÁM LÂM SÀNG TỪ HIS

## 1. Vấn đề phát hiện
Khi tra cứu hoặc đồng bộ hồ sơ bệnh nhân từ hệ thống HIS sang KSK VNeID (ví dụ: Mã lượt khám / hồ sơ `25316168` - BN **TRẦN VĂN CHIẾM**):
- **Hiện tượng:** Các thông tin về sinh hiệu / thể lực (Nhịp tim, Nhiệt độ, Huyết áp, Nhịp thở, Chiều cao, Cân nặng, BMI), quá trình bệnh lý, tiền sử bệnh và kết luận khám của Bác sĩ chưa được nạp tự động sang biểu mẫu KSK.
- **Nguyên nhân kỹ thuật:**
  1. Trong hàm `getHisPatient` tại `backend/src/controllers/health-check/his-integration.ts`, nhánh tra cứu trực tiếp từ HIS (`source: 'HIS_DIRECT'`) trước đây chỉ truy vấn thông tin hành chính từ bảng `hms_doc` và `hms_patient`, chưa thực hiện truy vấn bảng `hms_exam` (nơi lưu các chỉ số sinh tồn và nội dung khám) và bảng `hms_disease_hist` (nơi lưu tiền sử bệnh bản thân, gia đình, dị ứng thuốc).
  2. Tại hook giao diện `modules/health-check-sync/hooks/useDynamicFormState.ts`, hàm `handleFetchHisData` chưa bổ sung các setters cho `nhietDo`, `nhipTho`, `bmi`, `tsMacBenh`, `tsbtMaBenh`, `tsbtDangDieuTriBenh`, `benhDangDieuTri`, `conclusionDoctorId`.

---

## 2. Các giải pháp và thay đổi đã thực hiện

### 2.1 Backend (`backend/src/controllers/health-check/his-integration.ts`)
1. **Bổ sung truy vấn thông tin địa chỉ từ `hms_doc` & `hms_patient`:**
   - Lấy `matinh_cu_tru` từ `COALESCE(d.hd_provid, p.hp_provid, 0)` (Tỉnh/Thành phố).
   - Lấy `maxa_cu_tru` từ `COALESCE(d.hd_villid, p.hp_villid, 0)` (Phường/Xã).
   - Lấy `address` từ `COALESCE(NULLIF(TRIM(d.hd_dtladdr), ''), NULLIF(TRIM(p.hp_dtladdr), ''), hms_getaddress(d.hd_provid, d.hd_distid, d.hd_villid))` (Địa chỉ chi tiết / Địa chỉ đầy đủ).
   - Tự động làm giàu địa chỉ cho cả hồ sơ KSK đã lưu (`HEALTH_CHECK_MASTER`) và tra cứu trực tiếp (`HIS_DIRECT`).
2. **Bổ sung truy vấn bảng `hms_exam`:**
   - Lấy thông tin thời gian khám chính xác:
     - `to_char(e.he_examdate, 'YYYY-MM-DD')` $\rightarrow$ `exam_date` (ví dụ `2025-08-17`).
     - `to_char(e.he_examdate, 'HH24:MI')` $\rightarrow$ `exam_time` / `gio_kham` (ví dụ `10:16`).
   - Lấy các chỉ số sinh hiệu:
     - `he_pulse`: Nhịp tim / mạch (lần/phút)
     - `he_temperature`: Nhiệt độ (°C)
     - `he_bloodpressure` & `he_bloodpressurex`: Huyết áp (mmHg), ghép thành chuỗi định dạng chuẩn (ví dụ `120/80`).
     - `he_breathinterval`: Nhịp thở (lần/phút).
     - `he_weight`: Cân nặng (kg).
     - `he_height`: Chiều cao (cm).
     - `he_bmi`: Chỉ số khối cơ thể BMI.
   - Lấy dữ liệu khám lâm sàng:
     - `he_examine`: Khám toàn thân.
     - `he_parts`: Khám các bộ phận cơ quan.
     - `he_medical`: Quá trình bệnh lý.
     - `he_prediagnostic`: Chẩn đoán ban đầu.
     - `he_diagnostic` & `he_icd10`: Chẩn đoán xác định / Mã bệnh ICD-10.
     - `he_doctor` & `hms_getusername(he_doctor)`: Mã và tên Bác sĩ khám.
3. **Bổ sung truy vấn bảng `hms_disease_hist`:**
   - `hdh_owner`: Tiền sử bản thân (tự động nạp vào `tsbt_ma_benh` và `benh_dang_dieu_tri`).
   - `hdh_family`: Tiền sử gia đình (`tsgd_ma_benh`).
   - `hdh_drugallergy`: Dị ứng thuốc (`di_ung_thuoc`).
4. **Tự động xác định Mẫu KSK theo độ tuổi:**
   - Dựa trên `dob` (ngày sinh) của bệnh nhân:
     - Dưới 6 tuổi $\rightarrow$ Mẫu 1 (`1`)
     - Từ 6 đến dưới 18 tuổi $\rightarrow$ Mẫu 2 (`2`)
     - Từ đủ 18 tuổi trở lên $\rightarrow$ Mẫu 3 (`3`)

### 2.2 Frontend (`modules/health-check-sync/hooks/useDynamicFormState.ts` & `useChildFormState.ts`)
- **Tự động nhận diện và chuyển đổi Mẫu biểu áp dụng (`formType`) theo độ tuổi:**
  - Kết nối callback `onChangeFormType` xuyên suốt từ `HealthCheckSyncView` $\rightarrow$ `DynamicForm` / `ChildForm` $\rightarrow$ `useDynamicFormState` / `useChildFormState`.
  - Khi đồng bộ bệnh nhân từ HIS hoặc khi ngày sinh (`dob`) thay đổi:
    - Nếu tuổi $< 6$ tuổi $\rightarrow$ Tự động chuyển **Mẫu 1 (Trẻ em dưới 06 tuổi)**.
    - Nếu $6 \le \text{tuổi} < 18$ $\rightarrow$ Tự động chuyển **Mẫu 2 (Người từ đủ 06 tuổi đến dưới 18 tuổi)**.
    - Nếu $\text{tuổi} \ge 18$ (như BN sinh năm 1947 - 78 tuổi) $\rightarrow$ Tự động chuyển **Mẫu 3 (Người từ đủ 18 tuổi trở lên)**.
- **Nạp đầy đủ dữ liệu hành chính, địa chỉ và sinh hiệu vào State:**
  - `setAddress`, `setMaTinhCuTru`, `setMaXaCuTru` (tự động kích hoạt tải danh sách phường/xã theo tỉnh và chọn đúng xã từ HIS).
  - `setNgayVao` (ngày khám: `17/08/2025`), `setGioKham` (giờ khám: `10:16` lấy từ `he_examdate`).
  - `setHeight`, `setWeight`, `setBp`, `setPulse`, `setNhietDo`, `setNhipTho`, `setBmi`.
  - `setTsMacBenh`, `setTsbtMaBenh`, `setTsgdMacBenh`, `setTsgdMaBenh`, `setTsbtDangDieuTriBenh`, `setBenhDangDieuTri`.
  - `setInternalExam`, `setNoiKhoaTuanHoan`, `setNoiKhoaHoHap`, `setDiagnosis`, `setConclusionDoctorId`.

---

## 3. Kết quả kiểm tra xác thực với Mã HS `25316168` (BN: TRẦN VĂN CHIẾM)
- **Hành chính:** Nam, Sinh ngày 14/11/1947 (78 tuổi) $\rightarrow$ Tự động chuyển Mẫu 3 (KSK Người lớn).
- **Sinh hiệu:**
  - Nhịp tim: `70` lần/phút
  - Nhiệt độ: `37` °C
  - Huyết áp: `120/80` mmHg
  - Nhịp thở: `19` lần/phút
  - Cân nặng: `50` kg
  - Chiều cao: `146` cm
  - BMI: `23.46`
- **Tiền sử & Quá trình bệnh:**
  - Tiền sử bản thân: `"Điều tri COPD /hen quản lý tại bv phổi 02 năm - suy tim- rung nhĩ"`
  - Dị ứng thuốc: `"Đo CNHH tháng 7/2025"`
  - Quá trình bệnh lý: `"Bệnh nhân điều trị COPD-Suy tim nay tái khám điều trị tiếp"`
- **Khám lâm sàng & Kết luận:**
  - Bác sĩ khám: `BSCKI. Quách Thị Tuyết` (`qttuyet`)
  - Chẩn đoán: `[J44.9] Bệnh phổi tắc nghẽn mãn tính, không phân loại`
- **Kiểm tra biên dịch:** Frontend & Backend đều vượt qua TypeCheck với **0 lỗi**.
