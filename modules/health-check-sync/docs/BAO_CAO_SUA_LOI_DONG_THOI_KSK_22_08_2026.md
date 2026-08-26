# BÁO CÁO KHẮC PHỤC LỖI MẤT DỮ LIỆU ĐỒNG THỜI NHIỀU BÀN KHÁM KSK VNeID
**Ngày thực hiện:** 22/08/2026  
**Phân hệ:** Khám sức khỏe liên thông VNeID (`modules/health-check-sync`)

---

## 1. Hiện tượng lỗi
- Khi nhiều bàn khám chuyên khoa (Nội khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt, Ngoại khoa, Da liễu, Sản phụ khoa, Cận lâm sàng...) cùng mở hồ sơ của một bệnh nhân để nhập liệu.
- Một bàn khám (ví dụ Bàn Nội) đã nhập và bấm Duyệt xong.
- Một bàn khám khác (ví dụ Bàn Mắt) trước đó đã mở form với dữ liệu cũ chưa có Nội, sau đó nhập phần Mắt và bấm Duyệt.
- **Hậu quả:** Dữ liệu khám Nội khoa bị xóa sạch (bị ghi đè bởi dữ liệu rỗng từ máy Bàn Mắt). Bàn nào duyệt sau cùng thì chỉ giữ lại dữ liệu của bàn đó.

---

## 2. Nguyên nhân kỹ thuật
1. **Frontend:** Khi một chuyên khoa bấm "Duyệt", component gọi `handleSubmit()`, đóng gói toàn bộ state trong bộ nhớ React của bàn khám đó (bao gồm các chuyên khoa khác đang có giá trị rỗng hoặc `CHUA_KHAM`) và gửi `PUT /api/health-check/documents/:id`.
2. **Backend:** Hàm `updateDocument` và `createDocument` (khi cập nhật master) thực hiện `UPDATE health_check_details SET clinical_data = $1, lab_data = $2, conclusion_data = $3` thô bạo (hard overwrite) toàn bộ JSONB mà không có cơ chế Deep Merge với dữ liệu hiện có trong Database.
3. **Cache giao diện:** Khi nhấn "Khám/Sửa" từ danh sách, giao diện dùng trực tiếp object trong state React thay vì gọi `getDocument(id)` để lấy dữ liệu mới nhất.

---

## 3. Giải pháp đã triển khai

### A. Backend (`backend/src/services/health-check-merge.service.ts` & `documents.ts`)
1. **Khóa bản ghi bằng Transaction (`FOR UPDATE`):** Đảm bảo an toàn luồng khi nhiều request đồng thời gửi lên cùng một lúc.
2. **Hợp nhất chuyên sâu (`Deep Merge`):**
   - **`mergeSpecialtyMetadata`:** Bảo lưu trạng thái `ĐÃ_DUYỆT` / `ĐANG_KHÁM` và thông tin bác sĩ của các chuyên khoa đã khám trước đó; cập nhật chuyên khoa vừa được duyệt.
   - **`mergeClinicalData`:** Không bao giờ ghi đè chuỗi rỗng lên các kết quả lâm sàng, tiền sử hoặc thể lực đã có trong DB.
   - **`mergeLabData`:** Trộn mảng chỉ định cận lâm sàng `paraclinical_items` theo mã dịch vụ và giữ lại kết quả xét nghiệm/CĐHA từ LIMS/PACS.
   - **`mergeConclusionData`:** Trộn kết luận chung và phân loại sức khỏe.
3. **Tái tạo XML liên thông trên dữ liệu đã Merge:** Đảm bảo XML VNeID luôn đầy đủ 100% kết quả của tất cả các bàn khám.

### B. Frontend (`HealthCheckSyncView.tsx` & `DynamicForm.tsx`)
1. **Lấy dữ liệu mới nhất khi mở khám:** `onEdit(doc)` gọi `healthCheckService.getDocument(doc.id)` trực tiếp từ server.
2. **Cập nhật dữ liệu tức thì sau khi lưu:** Sau khi lưu thành công, tự động nạp lại dữ liệu đã merge từ backend.
3. **Nút Làm mới (F5) trên Header form:** Cho phép bác sĩ chủ động bấm nút làm mới dữ liệu từ các bàn khám khác mà không làm mất trạng thái form.

---

## 4. Kết quả kiểm thử thực nghiệm (Empirical Tests)
- Đã xây dựng bộ kịch bản kiểm thử thực nghiệm đa bàn khám tại [test-multi-desk-concurrency.ts](file:///d:/AI/VIMES_HIS/backend/test/test-multi-desk-concurrency.ts) và [health-check-merge.test.ts](file:///d:/AI/VIMES_HIS/backend/test/health-check-merge.test.ts):
  1. **Kịch bản 8 Bàn khám cùng mở từ đầu và duyệt lần lượt:** Cả 8 bàn khám (Thể lực, Nội khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt, Ngoại khoa, Da liễu, Cận lâm sàng, Kết luận) dù mang state ban đầu chưa có các bàn khác, khi duyệt xong đều được hợp nhất 100% dữ liệu, không mất bất kỳ trường nào.
  2. **Kịch bản Bác sĩ sửa lại 1 chuyên khoa đã duyệt:** Bác sĩ Nội khoa mở lại và sửa tim mạch -> Chỉ cập nhật đúng tim mạch, dữ liệu 7 chuyên khoa còn lại giữ nguyên vẹn 100%.
  3. **Kịch bản sinh XML VNeID:** File XML sinh ra chứa đầy đủ thẻ liên thông của tất cả các chuyên khoa đã khám.
- **Tổng cộng:** 30/30 test cases của phân hệ KSK đều Pass 100% (`duration: 2.6s`).
- Typecheck TypeScript frontend và backend: `0 errors` (exit code 0).
