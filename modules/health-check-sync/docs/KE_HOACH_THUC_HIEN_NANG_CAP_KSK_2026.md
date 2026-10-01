# KẾ HOẠCH NÂNG CẤP & TỐI ƯU HÓA PHÂN HỆ KHÁM SỨC KHỎE (VIMES HIS)
## Module `health-check-sync` — Tháng 09/2026

Kế hoạch này triển khai chi tiết 3 đề xuất nâng cấp đã được thống nhất sau đợt review toàn diện phân hệ Khám sức khỏe & Liên thông VNeID (`health-check-sync`):
1. **Cảnh báo chéo lâm sàng (Clinical Cross-Check & Soft Warning)**: Đối chiếu tự động giữa Chỉ số sinh tồn (BMI, Huyết áp, Nhịp tim), Kết quả 9 chuyên khoa với Phân loại sức khỏe chung (Loại I - V).
2. **Tối ưu kiến trúc & Tách nhỏ Component lớn (Code Splitting / Modularization)**: Phân rã các component nguyên khối (`ContractManagement.tsx` ~202KB, `PatientReception.tsx` ~135KB, `LabTab.tsx` ~132KB) thành các sub-components / modals độc lập.
3. **Thanh tiến trình thời gian thực (Real-time Progress Indicator)**: Cải tiến trải nghiệm người dùng với thanh % tiến độ trực quan khi xử lý các tác vụ tải nặng (Đồng bộ CLS đoàn, Gửi cổng hàng loạt, Tiếp đón hợp đồng).

---

## 1. YÊU CẦU NGHIỆP VỤ & LƯU Ý THIẾT KẾ

> [!IMPORTANT]
> **Nguyên tắc "Cảnh báo Mềm" (Soft Warning) trong nghiệp vụ Khám sức khỏe:**
> Khi chỉ số sinh tồn hoặc chuyên khoa của bệnh nhân có bất thường (ví dụ: Huyết áp 165/100 mmHg hoặc BMI 32 - Béo phì) nhưng Bác sĩ kết luận chọn **Loại I**, hệ thống sẽ:
> - Hiển thị **Banner cảnh báo màu cam (Amber Warning)** nổi bật ngay trên giao diện `ConclusionTab`.
> - Khi bấm **Duyệt / Ký số**, hệ thống hiển thị hộp thoại xác nhận nhắc nhở bác sĩ kiểm tra lại hoặc bổ sung lý do ngoại lệ.
> - Bác sĩ **vẫn có toàn quyền xác nhận tiếp tục** (không khóa cứng chặn lưu), đảm bảo tính linh hoạt tối đa theo đánh giá lâm sàng thực tế của bác sĩ.

> [!NOTE]
> **Chiến lược Phân rã Code (Refactoring Strategy):**
> Quá trình tách nhỏ `ContractManagement.tsx` và `PatientReception.tsx` sẽ được thực hiện theo từng modal độc lập, giữ nguyên 100% contracts/props/state interface cũ, đảm bảo `npx tsc --noEmit` đạt 0 lỗi sau mỗi giai đoạn và không gây ảnh hưởng đến luồng người dùng đang sử dụng.

---

## 2. PHÂN TÍCH THAY ĐỔI THEO TỪNG GIAI ĐOẠN

### GIAI ĐOẠN 1: CẢNH BÁO CHÉO LÂM SÀNG (CLINICAL CROSS-CHECK & SOFT WARNING)

#### 1. Tạo mới `modules/health-check-sync/utils/clinicalCrossCheck.ts`
- Xây dựng helper độc lập thẩm định tính tương thích giữa Dấu hiệu sinh tồn, Khám thể lực, 9 chuyên khoa lâm sàng và Phân loại sức khỏe:
  * **Huyết áp:**
    - Tăng HA Độ 2 ($HA_{tâm thu} \ge 160$ hoặc $HA_{tâm trương} \ge 100$ mmHg) $\rightarrow$ Không thể đạt Loại I hoặc Loại II.
    - Tăng HA Độ 1 ($HA_{tâm thu} \ge 140$ hoặc $HA_{tâm trương} \ge 90$ mmHg) $\rightarrow$ Không thể đạt Loại I.
    - Hạ HA ($HA_{tâm thu} < 90$ mmHg) $\rightarrow$ Khuyến nghị theo dõi tim mạch.
  * **Chỉ số BMI (Chuẩn Châu Á - WPRO / Bộ Y tế):**
    - BMI $\ge 30.0$ (Béo phì độ II/III) hoặc BMI $< 16.0$ (Gầy độ III) $\rightarrow$ Khuyến nghị không xếp Loại I.
    - BMI $\ge 25.0$ (Béo phì độ I) hoặc BMI $16.0 - 18.4$ (Gầy độ I/II) $\rightarrow$ Cảnh báo nếu phân loại Loại I.
  * **Nhịp tim / Mạch:**
    - Mạch $> 100$ lần/phút (nhịp nhanh) hoặc $< 50$ lần/phút (nhịp chậm khi nghỉ) $\rightarrow$ Cảnh báo lưu ý chuyên khoa Tim mạch.
  * **Chuyên khoa lâm sàng:**
    - Nếu có bất kỳ chuyên khoa nào (Nội, Mắt, TMH, RHM...) phân loại $\ge$ Loại III mà Kết luận chung lại chọn Loại I $\rightarrow$ Cảnh báo không tương thích (Mismatch).
- Trả về danh sách cảnh báo chi tiết kèm mức độ nghiêm trọng (`warning` | `info`) và gợi ý phân loại chuẩn.

#### 2. Cập nhật `modules/health-check-sync/forms/tabs/ConclusionTab.tsx`
- Nhúng `useMemo` tính toán kết quả từ `clinicalCrossCheck`.
- Hiển thị khối giao diện **"Lưu ý Lâm sàng & Đối chiếu Sinh hiệu"** với thiết kế viền bo tròn, màu vàng cam thanh lịch (Amber banner) ngay phía trên bộ chọn Phân loại sức khỏe.
- Khi người dùng bấm nút **Duyệt** hoặc **Ký số**, nếu tồn tại cảnh báo nghiêm trọng, hiển thị hộp thoại xác nhận nhẹ nhàng:
  > *"Phát hiện một số chỉ số sinh tồn hoặc chuyên khoa vượt ngưỡng sinh lý bình thường (ví dụ: Huyết áp 165/105 mmHg, BMI 31.2) nhưng đang phân loại sức khỏe Loại I. Bác sĩ có muốn tiếp tục xác nhận không?"*
  - Nếu Bác sĩ chọn "Tiếp tục" $\rightarrow$ Tiến hành Duyệt / Ký số bình thường.

---

### GIAI ĐOẠN 2: CODE SPLITTING & PHÂN RÃ COMPONENT NGUYÊN KHỐI

Tách các Modal con và khối logic lớn ra khỏi 3 component trọng điểm:

#### Phân rã `ContractManagement.tsx` (~202KB, 3247 dòng):
- Tạo thư mục mới: `modules/health-check-sync/components/contracts/modals/`
- **`ContractFormModal.tsx`**: Chứa Modal Tạo mới / Chỉnh sửa hợp đồng, thiết lập phòng khám mặc định, công khám, đối tượng.
- **`ContractServicesModal.tsx`**: Chứa Modal Tìm kiếm & Thêm danh mục dịch vụ kỹ thuật vào gói khám hợp đồng, cấu hình giới tính, độ tuổi áp dụng.
- **`EmployeeEditModal.tsx`**: Chứa Modal Thêm / Chỉnh sửa thông tin nhân viên, CCCD, địa bàn hành chính, nguồn chi trả.
- **`ContractSyncClsModal.tsx`**: Chứa Modal cấu hình đồng bộ kết quả CLS theo đoàn (chế độ chỉ đồng bộ hồ sơ thiếu hoặc làm mới toàn bộ).
- Cập nhật `ContractManagement.tsx`: Import và tích hợp 4 sub-modals trên, giảm dung lượng file chính từ ~202KB xuống còn dưới ~90KB, tách bạch rõ ràng state và lifecycle.

#### Phân rã `PatientReception.tsx` (~135KB, 2337 dòng):
- Tạo thư mục mới: `modules/health-check-sync/components/reception/modals/`
- **`ReceptionEditEmployeeModal.tsx`**: Tách modal cập nhật thông tin nhân viên tại bàn tiếp đón.
- **`ReceptionSlipModal.tsx`**: Tách modal xem trước và in Phiếu tiếp đón / Phiếu hướng dẫn quy trình khám.
- Cập nhật `PatientReception.tsx`: Tích hợp các sub-modals, tối ưu logic tìm kiếm quét CCCD chip.

---

### GIAI ĐOẠN 3: THANH TIẾN TRÌNH THỜI GIAN THỰC (REAL-TIME PROGRESS INDICATOR)

#### 1. Tạo mới `TaskProgressModal.tsx` (`modules/health-check-sync/components/modals/TaskProgressModal.tsx`)
- Reusable UI component hiển thị thanh tiến trình hiện đại:
  * Thanh Progress Bar chuyển động mượt mà (% từ 0% đến 100%).
  * Chỉ số đếm trực quan: Tổng số, Đã hoàn thành (xanh lá), Thất bại / Lỗi (đỏ).
  * Danh sách chi tiết hồ sơ đang xử lý (cuộn tự động).
  * Nút "Đóng" (khi hoàn thành) hoặc "Dừng lại".

#### 2. Cập nhật `HealthCheckSyncView.tsx`
- Áp dụng `TaskProgressModal` cho tác vụ **"Gửi Cổng hàng loạt"**:
  * Chia danh sách các hồ sơ đã chọn thành các batch 5 hồ sơ.
  * Hiển thị tiến trình gửi cổng đồng thời lên Cổng Bộ Y Tế & Cổng Sở Y Tế.
  * Cập nhật tức thời kết quả phản hồi của từng hồ sơ.

#### 3. Cập nhật `ContractManagement.tsx`
- Áp dụng `TaskProgressModal` cho tác vụ:
  * **"Đồng bộ CLS theo Hợp đồng"**: Hiển thị số nhân viên đã được kiểm tra và ghép kết quả xét nghiệm/PACS từ HIS Core.
  * **"Tiếp đón toàn bộ nhân viên"**: Hiển thị tiến độ khởi tạo hồ sơ `hms_doc` trên HIS theo từng đợt.

---

## 3. KẾ HOẠCH KIỂM THỬ (VERIFICATION PLAN)

### 3.1. Kiểm thử Tự động (Automated Tests)
1. **Kiểm tra biên dịch tĩnh TypeScript (Bắt buộc 0 lỗi):**
   ```bash
   # Kiểm tra Backend
   cd d:\AI\VIMES_HIS\backend && npx tsc --noEmit
   
   # Kiểm tra Frontend
   cd d:\AI\VIMES_HIS && npx tsc --noEmit
   ```
2. **Kiểm thử Unit Test cho bộ cảnh báo chéo lâm sàng mới:**
   - Tạo test suite mới `backend/test/health-check-clinical-cross-check.test.ts` kiểm tra các ca biên:
     * Huyết áp 165/100 $\rightarrow$ Phát hiện cảnh báo khi phân loại Loại I.
     * BMI 33.5 $\rightarrow$ Phát hiện cảnh báo khi phân loại Loại I.
     * Mắt phân loại Loại IV $\rightarrow$ Cảnh báo không tương thích khi kết luận chung Loại I.
     * Chỉ số bình thường $\rightarrow$ Không có cảnh báo.
3. **Chạy hồi quy toàn bộ test suite KSK hiện có:**
   ```bash
   cd d:\AI\VIMES_HIS\backend && node --test -r ts-node/register test/health-check-mandatory-fields.test.ts
   cd d:\AI\VIMES_HIS\backend && node --test -r ts-node/register test/health-check-xml-qđ2062.test.ts
   cd d:\AI\VIMES_HIS\backend && node --test -r ts-node/register test/health-check-two-tier-signer.test.ts
   cd d:\AI\VIMES_HIS\backend && node --test -r ts-node/register test/health-check-pushback-conclusion.test.ts
   ```

### 3.2. Kiểm thử Thực tế (Manual Verification)
1. **Kiểm thử Giao diện Cảnh báo lâm sàng trên `ConclusionTab`:**
   - Mở 1 hồ sơ KSK người lớn, nhập Huyết áp `170/100`, BMI `32`.
   - Chuyển sang tab Kết luận, chọn Phân loại sức khỏe `Loại I`.
   - Xác nhận Banner cảnh báo màu vàng cam hiển thị rõ ràng, giải thích cụ thể lý do.
   - Bấm nút Duyệt kết luận $\rightarrow$ Xác nhận xuất hiện hộp thoại xác nhận Soft Warning, cho phép bác sĩ bấm "Tiếp tục duyệt" hoặc "Hủy để xem lại".
2. **Kiểm thử Tính năng Phân rã Component:**
   - Mở màn hình Quản lý hợp đồng: Thử tạo mới hợp đồng, thêm dịch vụ vào gói khám, sửa thông tin nhân viên, cấu hình đồng bộ CLS. Đảm bảo mọi tính năng hoạt động trơn tru như trước.
3. **Kiểm thử Thanh Tiến trình Thời gian thực:**
   - Chọn 10 hồ sơ KSK và bấm "Gửi cổng liên thông".
   - Quan sát Modal hiển thị thanh tiến trình % tăng dần từ 0% đến 100%, ghi nhận rõ số hồ sơ thành công/lỗi.
