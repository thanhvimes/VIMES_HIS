# BÁO CÁO KỸ THUẬT: XỬ LÝ LỖI LÙI NGÀY SINH & BẢO VỆ DỮ LIỆU ĐỒNG THỜI KSK VNeID

- **Ngày thực hiện:** 22/08/2026
- **Phân hệ:** Khám Sức Khỏe & Liên Thông VNeID (`modules/health-check-sync`)
- **Trạng thái:** ✅ Đã khắc phục triệt để và kiểm thử tự động 100% Passed

---

## I. VẤN ĐỀ 1: LỆCH LÙI 1 NGÀY SINH (OFF-BY-ONE TIMEZONE DISPLAY BUG)

### 1. Hiện tượng ghi nhận thực tế
- Khi Tiếp đón nhập đúng ngày sinh (ví dụ: `02/09/2001` hoặc `27/08/1956` như trường hợp bệnh nhân Dương Đình Giáp), khi mở hồ sơ KSK lên thì trường **Ngày sinh** lại hiển thị lùi 1 ngày thành `01/09/2001` hoặc `26/08/1956`.
- Nếu bác sĩ nhấn Lưu/Duyệt, ngày bị lùi này tiếp tục bị ghi đè vào DB và sinh vào XML liên thông sai lệch.

### 2. Nguyên nhân gốc rễ (Root Cause)
1. **Lệch múi giờ UTC trong hàm chuyển đổi ngày:**
   - Tại `reception.controller.ts`, khi parse ngày sinh của nhân viên từ HIS bằng `parseDateSafely`, hàm trả về đối tượng `Date` tại 00:00:00 giờ địa phương (GMT+7).
   - Khi gọi `dob.toISOString().split('T')[0]`, hàm `.toISOString()` tự động trừ 7 tiếng để về múi giờ UTC (GMT+0) $\rightarrow$ `00:00:00 02/09/2001 GMT+7` biến thành `17:00:00 01/09/2001 UTC`. Lệnh `.split('T')[0]` cắt ra chuỗi `'2001-09-01'` (lùi 1 ngày).
2. **Serialization của driver PostgreSQL (`pg`):**
   - Mặc định node-pg parse kiểu dữ liệu `DATE` (OID 1082) của PostgreSQL thành đối tượng JS `Date`. Khi chuyển qua JSON API, Express gọi `toJSON()` sinh ra chuỗi ISO UTC gây lệch ngày.
   - Khi lưu vào DB, các controller truyền `new Date(dob)` thay vì chuỗi `'YYYY-MM-DD'`, khiến node-pg chuyển thành chuỗi UTC gửi cho PostgreSQL.
3. **Frontend khởi tạo state:**
   - Trong `useDynamicFormState.ts` và `useChildFormState.ts`: `useState(initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '')` tiếp tục bị lùi ngày lần thứ 2.

### 3. Giải pháp đã thực hiện
1. **Cấu hình Type Parser cho PostgreSQL (`backend/src/config/database.ts`):**
   - Đăng ký `types.setTypeParser(1082, (val) => val);` để ép driver `pg` luôn trả về kiểu `DATE` dưới dạng chuỗi `'YYYY-MM-DD'` nguyên bản, không chuyển qua JS `Date` và không bị ảnh hưởng bởi múi giờ.
2. **Xây dựng hàm chuẩn hóa ngày `formatYmdString` (`backend/src/services/health-check-merge.service.ts`):**
   - Chuẩn hóa mọi đầu vào (chuỗi `YYYY-MM-DD`, chuỗi `DD/MM/YYYY`, ISO String, Date object) về chuỗi `'YYYY-MM-DD'` chuẩn lịch địa phương.
   - Áp dụng lưu trực tiếp chuỗi `'YYYY-MM-DD'` cho các câu lệnh INSERT/UPDATE trong `documents.ts`, `reception.controller.ts`, `his-integration.ts`.
3. **Cải tiến bộ công cụ định dạng ngày Frontend (`utils/formatters.ts`):**
   - `parseDateSafe`: Phân tích chuỗi `'YYYY-MM-DD'` và `'DD/MM/YYYY'` theo giờ địa phương, không bị lùi giờ theo UTC.
   - `formatDateForInput`: Chuẩn hóa dữ liệu ngày cho các ô `<input type="date">` và `FormDateInput` đảm bảo hiển thị đúng ngày nguyên bản.
   - `formatDate`: Hiển thị `DD/MM/YYYY` chính xác trên tất cả các mẫu in (`PrintFormMau1`, `PrintFormMau2`, `PrintFormMau3`, `PrintForm`, `DocumentList`, `PrintBarcodeForm`, `PrintBarcodeXnModal`).
4. **Cập nhật Hooks & Form State (`useDynamicFormState.ts`, `useChildFormState.ts`):**
   - Thay thế toàn bộ logic `.toISOString().split('T')[0]` bằng `formatDateForInput(dob)`.
   - Cập nhật cả `cccdDate`, `ngayVao` để chống lùi ngày trên tất cả các trường ngày tháng.

---

## II. VẤN ĐỀ 2: ĐỒNG BỘ & BẢO VỆ DỮ LIỆU ĐỒNG THỜI NHIỀU BÀN KHÁM

### 1. Hiện tượng & Nguy cơ
- Khi một bệnh nhân được nhiều bàn khám (Nội, Mắt, RHM, TMH, Cận lâm sàng, v.v.) mở cùng lúc:
  - Nếu bàn A khám xong và Duyệt trước, nhưng bàn B đang mở từ trước (khi chưa có dữ liệu của A) chỉ nhập chuyên khoa của bàn B rồi nhấn Duyệt $\rightarrow$ Dữ liệu của bàn A bị ghi đè mất hết.

### 2. Giải pháp Deep-Merge & Row Locking đã triển khai
1. **Khóa bản ghi FOR UPDATE (`backend/src/controllers/health-check/documents.ts`):**
   - Khi bất kỳ bàn khám nào nhấn Lưu / Duyệt, backend thực hiện transaction và khóa dòng `health_check_details` bằng `SELECT ... FOR UPDATE`.
2. **Deep Merge đa tầng (`backend/src/services/health-check-merge.service.ts`):**
   - **`mergeSpecialtyMetadata`:** Bảo toàn trạng thái `ĐÃ_DUYỆT` / `ĐÃ_KHÁM` của các bàn khám khác.
   - **`mergeClinicalData`:** Giữ nguyên dữ liệu khám lâm sàng, sinh hiệu, tiền sử của các chuyên khoa khác; chỉ cập nhật chuyên khoa đang được lưu.
   - **`mergeLabData`:** Gộp danh sách kết quả xét nghiệm, CĐHA, PACS từ nhiều nguồn.
   - **`mergeConclusionData`:** Bảo toàn kết luận phân loại sức khỏe.
3. **Tái tạo XML VNeID trên dữ liệu tổng hợp hoàn chỉnh:**
   - Sau khi merge, backend sinh lại file XML liên thông với đầy đủ 8 chuyên khoa.

---

## III. KẾT QUẢ KIỂM THỬ (AUTOMATED TESTS)

1. **Test Concurrency 8 Bàn Khám (`backend/test/test-multi-desk-concurrency.ts`):**
   - Mô phỏng 8 bàn khám mở đồng thời và duyệt tuần tự $\rightarrow$ **100% dữ liệu 8 chuyên khoa được bảo toàn, XML sinh ra đầy đủ 8 chuyên khoa.**
2. **Test Timezone & Ngày Sinh (`backend/test/test-date-timezone.ts`):**
   - Kiểm tra ngày sinh `2001-09-02` và `1956-08-27` $\rightarrow$ **100% hiển thị và lưu trữ đúng ngày, không bị lùi 1 ngày.**
3. **Kiểm tra TypeScript (`npm run typecheck`):**
   - Mã nguồn đạt chuẩn không có bất kỳ lỗi biên dịch nào (`tsc --noEmit` exit 0).
