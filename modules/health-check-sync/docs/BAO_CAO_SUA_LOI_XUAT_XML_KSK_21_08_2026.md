# BÁO CÁO RÀ SOÁT & SỬA LỖI XUẤT DỮ LIỆU XML KHÁM SỨC KHỎE
**Thời gian:** 21/08/2026  
**Phân hệ:** Khám sức khỏe liên thông VNeID (`health-check-sync`)  
**Căn cứ pháp lý & kỹ thuật:** Quyết định số 2062/QĐ-BYT và Quyết định số 1551/QĐ-BYT của Bộ Y tế.

---

## 1. Tóm tắt vấn đề & Hiện trạng trước khi sửa

Người dùng phản ánh:
- Phân loại sức khỏe xuất ra XML luôn bị cố định là Loại I (`<PHAN_LOAI_SK>1</PHAN_LOAI_SK>`), ngay cả khi chọn Loại II, Loại III, Loại IV hoặc Loại V.
- Các trường dữ liệu khác cũng bị tình trạng sai lệch hoặc rơi vào giá trị mặc định fallback.

---

## 2. Nguyên nhân kỹ thuật (Root Causes)

1. **Lỗi `PHAN_LOAI_SK`**:
   - `tagMap` trong `xml-generator.ts` chỉ tìm kiếm từ khóa `['phan_loai_sk', 'phanloaisk']`.
   - Frontend (`useDynamicFormState.ts` và `useChildFormState.ts`) lưu dữ liệu kết luận dưới key `fitness_class` hoặc `ket_luan_loai_suc_khoe`.
   - Hàm `findValue('PHAN_LOAI_SK', src)` không tìm thấy giá trị nên trả về rỗng `""`.
   - Lệnh `findValue('PHAN_LOAI_SK', src) || '1'` kích hoạt fallback khiến thẻ XML luôn luôn là `1`.

2. **Lỗi `CAC_VAN_DE_SUC_KHOE`**:
   - Frontend lưu vào `cac_van_de_luu_y`. `findValue('CAC_VAN_DE_SUC_KHOE', src)` không có ánh xạ, luôn rơi vào fallback `'Đủ sức khỏe làm việc'`.

3. **Lỗi `KET_LUAN_BENH` & `KHAM_THE_LUC_PL`**:
   - `tagMap` thiếu ánh xạ cho `ket_luan_benh` $\rightarrow$ `diagnosis`, `chandoan`, `ma_benh`.
   - `tagMap` thiếu ánh xạ cho `kham_the_luc_pl` $\rightarrow$ `the_luc_pl`.

4. **Lỗi 10 trường lâm sàng Mẫu 1 (Trẻ dưới 6 tuổi) luôn ra `0`**:
   - Tên trường trong state `useChildFormState` lệch so với thẻ XML:
     - `cam_nho_tut_sau` vs `<CAM_NHO_TUT_VE_SAU>`
     - `vet_sau_mang_bam` vs `<SAU_MANG_BAM_LO>`
     - `dh_suy_ho_hap` vs `<SUY_HO_HAP>`
     - `nghe_tim` vs `<TIENG_TIM>`
     - `khoi_bat_thuong_bung` vs `<KHOI_BAT_THUONG>`
     - `cq_sinh_duc_ngoai` vs `<CO_QUAN_SINH_DUC_NGOAI>`
     - `kham_tu_chi_khop` vs `<TU_CHI_KHOP>`
     - `kich_thuoc_dau` vs `<HINH_DANG_DAU>`
     - `vi_tri_2_mat` vs `<VI_TRI_HAI_MAT>`

5. **Lỗi kiểm tra trạng thái duyệt chuyên khoa người lớn (XML7)**:
   - Hàm `isSpecExamined` so sánh không dấu (`DA_KHAM`, `DA_DUYET`) trong khi frontend gửi có dấu tiếng Việt (`ĐÃ_KHÁM`, `ĐÃ_DUYỆT`, `ĐÃ_KẾT_LUẬN`).

6. **Lỗi Cận lâm sàng (XML11) khi nhập trường đơn lẻ**:
   - Nếu không có mảng `paraclinical_items`, các trường xét nghiệm máu/nước tiểu đơn lẻ bị bỏ qua và sinh XML11 rỗng.

7. **Lỗi mã xã cư trú `MAXA_CU_TRU`**:
   - Điều kiện kiểm tra độ dài `maXaVal.length > 5 || maXaVal.length < 5` khiến các mã xã chuẩn 8 chữ số bị ép về `00001`.

---

## 3. Các nội dung đã chỉnh sửa & Hoàn thiện

### 3.1. Nâng cấp `backend/src/controllers/health-check/xml-generator.ts`
- **Mở rộng bảng từ đồng nghĩa `tagMap`** cho tất cả các thẻ trong XML1, XML2, XML7, XML10, XML11, XML12.
- **Tối ưu hàm `findValue`**:
  - So sánh không phân biệt hoa thường, loại bỏ ký tự gạch dưới, khoảng trắng.
  - Bỏ qua các giá trị chuỗi rỗng (`""`) ở cấp cha để tiếp tục tìm kiếm sâu vào các đối tượng lồng nhau (`conclusionData`, `clinicalData.conclusion`, v.v.).
  - Bảo toàn giá trị `0` và `'0'`.
- **Chuẩn hóa `PHAN_LOAI_SK`**: Ánh xạ đầy đủ `fitness_class`, `ket_luan_loai_suc_khoe`, `phan_loai`, đồng thời hỗ trợ chuyển đổi chữ số La Mã `I, II, III, IV, V` sang `1, 2, 3, 4, 5`.
- **Chuẩn hóa `CAC_VAN_DE_SUC_KHOE` & `KET_LUAN_BENH`**: Phản ánh chính xác văn bản người dùng nhập trong form kết luận.
- **Chuẩn hóa kiểm tra trạng thái chuyên khoa**: Khử dấu tiếng Việt trước khi so sánh `DA_KHAM`, `DA_DUYET`.
- **Tự động chuyển đổi các chỉ số CLS đơn lẻ** thành các thẻ `<CHI_TIET_CLS>` với CDATA trong XML11 khi không có mảng `paraclinical_items`.

### 3.2. Cập nhật `backend/src/controllers/health-check/documents.ts`
- Trích xuất an toàn `conclusionData` và `labData` từ `clinicalData.conclusion` và `clinicalData.lab` để tương thích hoàn toàn với cấu trúc của Mẫu 1 (Trẻ dưới 6 tuổi).

### 3.3. Bổ sung bộ kiểm thử tự động `backend/test/health-check-xml-qđ2062.test.ts`
- Thêm các test case kiểm tra:
  - Phân loại sức khỏe từ 1 đến 5 và số La Mã `I` - `V`.
  - Kết luận bệnh tật, ghi chú sức khỏe cần lưu ý.
  - Phân loại khám thể lực và các chỉ số sinh hiệu.
  - Ánh xạ lâm sàng Trẻ em dưới 6 tuổi.
  - Tự động sinh danh sách cận lâm sàng XML11.

---

## 4. Kết quả kiểm thử

Toàn bộ **35/35** test case liên quan đến khám sức khỏe và XML liên thông đã vượt qua thành công (**Pass 100%**):
- `health-check-xml-qđ2062.test.ts`: 12/12 PASS
- `health-check-new-document-validation.test.ts`: 6/6 PASS
- `health-check-sync-payload.test.ts`: 2/2 PASS
- `health-check-sync-retry.test.ts`: 3/3 PASS
- `health-check-sync-validation.test.ts`: 5/5 PASS
- `health-check-xml-validation.test.ts`: 6/6 PASS
- `health-check-checksum.test.ts`: 1/1 PASS
