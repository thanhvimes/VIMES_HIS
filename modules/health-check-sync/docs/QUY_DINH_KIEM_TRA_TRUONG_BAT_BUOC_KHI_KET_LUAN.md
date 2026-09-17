# QUY ĐỊNH VÀ HƯỚNG DẪN KIỂM TRA 17 TRƯỜNG BẮT BUỘC KHI KẾT LUẬN KSK

## 1. Giới thiệu & Căn cứ Pháp lý
Theo các quyết định của Bộ Y tế về việc liên thông dữ liệu Giấy khám sức khỏe lên Cổng Tiếp nhận dữ liệu Hệ thống thông tin Giám định BHYT và VNeID:
- **Quyết định số 2062/QĐ-BYT** ban hành quy chuẩn dữ liệu KSK liên thông.
- **Quyết định số 3176/QĐ-BYT** quy định định dạng và các trường dữ liệu bắt buộc (họ tên viết HOA có dấu, CCCD 12 số, mã định danh người giám hộ đối với trẻ em, mã tỉnh, mã xã...).
- **Quyết định số 1804/QĐ-BYT** quy định mã loại hình KCB và danh mục mã dùng chung.
- File đặc tả kỹ thuật: `modules/health-check-sync/docs/Các trường bắt buộc.xlsx`.

---

## 2. Danh mục 17 trường Bắt buộc Kiểm tra khi Kết luận

| STT | Mã trường trên XML | Tên trường / Ý nghĩa | Kiểu dữ liệu & Độ dài | Quy tắc kiểm tra (Validation Rule) | Ghi chú điều hướng Tab trên UI |
|:---:|:---|:---|:---|:---|:---|
| 1 | `HO_TEN` | Họ và tên người khám | Chuỗi $\le 255$ ký tự | Bắt buộc; **viết IN HOA có dấu** theo QĐ 3176 | Tab Hành chính (`admin`) |
| 2 | `GIOI_TINH` | Giới tính | Số/Mã | Bắt buộc; `1`: Nam, `2`: Nữ | Tab Hành chính (`admin`) |
| 3 | `NGAY_SINH` | Ngày tháng năm sinh | Ngày `YYYY-MM-DD` | Bắt buộc; không được ở tương lai, phù hợp mẫu biểu | Tab Hành chính (`admin`) |
| 4 | `MA_DAN_TOC` | Mã dân tộc | Chuỗi mã 2 ký tự | Bắt buộc; danh mục 54 dân tộc (VD: `01` - Kinh) | Tab Hành chính (`admin`) |
| 5 | `SO_CCCD` | Số định danh / CCCD | Chuỗi 12 số | Bắt buộc đúng 12 chữ số. Với trẻ < 6 tuổi chưa có CCCD thì bắt buộc nhập CCCD 12 số của người giám hộ (`SO_CCCD_NGH`) | Tab Hành chính (`admin`) |
| 6 | `DIA_CHI` | Nơi ở hiện tại | Chuỗi $\le 1024$ ký tự | Bắt buộc nhập đầy đủ số nhà, thôn/xóm | Tab Hành chính (`admin`) |
| 7 | `MATINH_CU_TRU` | Mã Tỉnh/Thành phố cư trú | Chuỗi 2-3 ký tự | Bắt buộc chọn từ danh mục chuẩn | Tab Hành chính (`admin`) |
| 8 | `MAXA_CU_TRU` | Mã Xã/Phường cư trú | Chuỗi 5 ký tự | Bắt buộc chọn từ danh mục chuẩn | Tab Hành chính (`admin`) |
| 9 | `MA_NGHE_NGHIEP` | Mã nghề nghiệp | Chuỗi 2 ký tự | Bắt buộc chọn; đối với trẻ em tự động mặc định `00` | Tab Hành chính (`admin`) |
| 10 | `LY_DO_VV` | Lý do khám sức khỏe | Chuỗi văn bản | Bắt buộc nhập (VD: Khám tuyển dụng, định kỳ...) | Tab Hành chính (`admin`) |
| 11 | `MA_CSKCB` | Mã cơ sở khám chữa bệnh | Chuỗi 5 ký tự | Bắt buộc; fallback từ cấu hình trạm/viện (`37101`) | Cấu hình hệ thống |
| 12 | `MA_GTIN_CSKCB` | Mã định danh GLN đơn vị | Chuỗi 13 ký tự | Bắt buộc; fallback từ cấu hình (`8934285008135`) | Cấu hình hệ thống |
| 13 | `DOI_TUONG` | Mã đối tượng khám KSK | Chuỗi 2 ký tự | Bắt buộc; mã từ `01` đến `16` theo QĐ 2062 | Tab Hành chính (`admin`) |
| 14 | `NGUON_CHI_TRA` | Nguồn chi trả chi phí | Số nguyên | Bắt buộc; chỉ chấp nhận các mã: `1, 2, 3, 4, 5, 9` | Tab Hành chính (`admin`) |
| 15 | `MA_LOAI_KCB` | Mã loại hình KCB | Chuỗi 2 ký tự | Bắt buộc; mặc định `01` theo QĐ 1804 | Tab Tiền sử / KCB (`history`) |
| 16 | `NGAY_VAO` | Ngày vào khám KSK | Ngày `YYYY-MM-DD` | Bắt buộc; ngày bắt đầu chu trình khám | Tab Hành chính (`admin`) |
| 17 | `PHAN_LOAI_SK` | Phân loại sức khỏe kết luận | Mã `1` đến `5` | Người lớn: Bắt buộc chọn Loại I đến Loại V. Trẻ em: Bắt buộc có kết luận thể lực/phát triển | Tab Kết luận (`conclusion`) |

---

## 3. Cơ chế Chặn & Báo lỗi Tại Các Tầng (Multi-tier Enforcement)

### 3.1. Tại Tầng Giao diện Người dùng (Frontend):
1. **Tại các Tab Kết luận (`ConclusionTab.tsx`, `ChildConclusionTab.tsx`):**
   - Khi Bác sĩ nhấn nút **Duyệt kết luận** hoặc **Ký số Bác sĩ kết luận**:
   - Hệ thống tự động kích hoạt bộ validator `validateMandatoryPortalFields`.
   - Nếu phát hiện thiếu/sai bất kỳ trường nào:
     - Dừng ngay thao tác, ngăn không cho gửi request lưu/ký.
     - Hiển thị Toast cảnh báo chi tiết: `Thiếu thông tin bắt buộc khi kết luận: [Tên trường lỗi]`.
     - Tự động chuyển Active Tab (`setActiveTab`) về tab chứa trường bị thiếu (Hành chính, Tiền sử hoặc Kết luận) để Bác sĩ hoặc nhân viên y tế bổ sung ngay lập tức.
2. **Tại Hook quản lý Form State (`useDynamicFormState.ts`, `useChildFormState.ts`):**
   - Kiểm tra chặt chẽ trong `handleSubmit` khi cờ `isSigning = true` (Khóa & Ký số).

### 3.2. Tại Tầng Xử lý Nghiệp vụ & Dịch vụ (Backend):
1. **Tại Controller `documents.ts` (`updateDocument`):**
   - Kiểm tra `validateMandatoryPortalFields` khi hồ sơ được cập nhật kèm yêu cầu ký duyệt (`isSigning = true`).
   - Nếu thiếu trường, trả về mã lỗi `HTTP 400 Bad Request` kèm danh sách chi tiết các trường bị lỗi.
2. **Tại Cổng Ký số 2 cấp độ (`getTwoTierSignStep1Hash` & `applyTwoTierSignStep1`):**
   - Trước khi băm chuỗi SHA-256 để tạo chữ ký số Bác sĩ kết luận (`CKS_NGUOI_KET_LUAN`), Backend truy vấn kiểm tra toàn bộ 17 trường.
   - Ngăn chặn hoàn toàn việc ký khống trên hồ sơ chưa điền đủ thông tin hợp lệ.
3. **Tại Dịch vụ Tự động Đồng bộ Cổng (`health-check-sync.service.ts` - `sendDocumentsToVNeID`):**
   - Trước khi gửi lên Cổng Giám định BHYT / Cổng KSK Bộ Y tế, hệ thống rà soát lần cuối 17 trường.
   - Nếu không hợp lệ $\rightarrow$ đánh dấu `send_status = 'Error'`, ghi log rõ ràng tên các trường thiếu để phục vụ tra cứu.

---

## 4. Kết quả Kiểm thử & Biên dịch (Verification)
- **Unit Tests:** `backend/test/health-check-mandatory-fields.test.ts` đạt **8/8 test cases PASS 100%**.
- **End-to-End Integration Tests:** `backend/test/health-check-mandatory-fields-e2e.test.ts` đạt **4/4 test cases PASS 100%** trên môi trường dữ liệu thực tế (Kiểm tra chặn kết luận, chặn lấy hash SHA-256, chặn dán CKS Bác sĩ khi thiếu thông tin và duyệt ký thành công khi đủ 17 trường).
- **Regression Tests:** `backend/test/health-check-child-form1.test.ts`, `backend/test/health-check-two-tier-signer.test.ts`, `backend/test/health-check-new-document-validation.test.ts` đạt **13/13 test cases PASS 100%**.
- **Biên dịch:**
  - Backend: `npx tsc --noEmit` đạt 0 lỗi biên dịch.
  - Frontend: `npm run build` (Vite) đóng gói production thành công 100%.
