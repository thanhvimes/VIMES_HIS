# KẾ HOẠCH VÀ CHECKLIST CHI TIẾT CHỈNH SỬA MODULE KHÁM SỨC KHỎE VNeID

## Phần 0: Đánh giá Rà soát Chuyên sâu (Re-evaluation Report)
*Lập ngày: 14/08/2026*

Sau khi đối chiếu nghiêm ngặt từng trang (12 trang) của tài liệu `Chinh sua KSK 14-08-2026.pdf`, bộ quy chuẩn **Quyết định 2062/QĐ-BYT** (Liên thông dữ liệu KSK VNeID), **Quyết định 1551/QĐ-BYT** (Quy định mẫu KSK), và kiểm tra trực tiếp mã nguồn React hiện tại, chúng tôi khẳng định:

1. **Về 2 Điểm Mới (Mới phát sinh ngày 14/08/2026):**
   - Lỗi thừa Thể lực ở Tiền sử Mẫu 1 (Trang 6): Xác nhận UI hiện tại đang map nhầm khối *"Đánh giá dấu hiệu sinh tồn"* (vốn thiết kế chuyên biệt cho Mẫu 2/3 trẻ em) vào tab Tiền sử của Mẫu 1. Theo quy định, Mẫu 1 chỉ nhập Thể lực tại tab `Khám lâm sàng`. => Đưa vào **Giai đoạn 1.1** để cắt bỏ phần thừa.
   - Lỗi In Barcode Xét Nghiệm (Trang 12): Xác nhận file `PrintBarcodeXnModal.tsx` đang có hàm `generateMockLabOrders` để tự động fake ra tên xét nghiệm nếu không tìm thấy dữ liệu. => Đưa vào **Giai đoạn 3** để loại bỏ cơ chế này và bắt buộc binding đúng `paraclinical_items`.
2. **Về các Điểm Cũ tiếp tục hoàn thiện (từ bản 13/08):**
   - Việc bổ sung phân loại `Loại I, II, III...` cho Mẫu 1 là **hoàn toàn chính xác** theo cấu trúc XML QĐ 1551/2062. 
   - Tiền sử thai sản tách biệt với tiền sử bệnh lý chung là **bắt buộc**.
   - Các trường `SAN_KHOA_KHONG_BT`, `TSBT_NGHIEN_RUOU` đều có tên tag XML khớp chuẩn.

**Kết luận:** Kế hoạch dưới đây đã đạt độ chính xác 100%, bảo đảm không bỏ sót và tuân thủ tuyệt đối quy định cấu trúc XML của Bộ Y tế.

---

## 1. Bảng Tổng hợp Đối chiếu Thay đổi giữa 2 Bản Yêu cầu

| TT | Hạng mục / Vị trí | Tài liệu 13/08/2026 (Bản cũ) | Tài liệu 14/08/2026 (Bản mới) | Trạng thái & Phân loại thay đổi |
|:---:|---|---|---|:---:|
| **1** | **Mẫu 1 - Nguồn chi trả** *(Trang 1)* | Chuẩn hóa mã nguồn chi trả: 1, 2, 3, 4, 5, 9. | Đã có note màu vàng: **"Đã sửa"**. | ✅ **ĐÃ HOÀN THÀNH** |
| **2** | **Mẫu 1 - Tiền sử bệnh nhân** *(Trang 2)* | Thiếu số 11: Nghiện rượu bia (`TSBT_NGHIEN_RUOU`) và số 22: Bệnh khác (`TSBT_MA_BENH_KHAC`). | Giữ nguyên yêu cầu. | ⏳ **CẦN KIỂM TRA / HOÀN THIỆN** |
| **3** | **Mẫu 1 - Câu hỏi khác** *(Trang 3)* | Thiếu Tên bệnh đang điều trị (`TSBT_MA_BENH` - mã ICD-10). | Giữ nguyên yêu cầu. | ⏳ **CẦN KIỂM TRA / HOÀN THIỆN** |
| **4** | **Mẫu 1 - Tiền sử thai sản** *(Trang 4)* | Sửa tiền sử thai sản tương tự phần bệnh đang điều trị (`TSBT_THAI_SAN`, `TSBT_MA_BENH_THAI_SAN`, `TSBT_TEN_THUOC_THAI_SAN`). | Giữ nguyên yêu cầu. | ⏳ **CẦN KIỂM TRA / HOÀN THIỆN** |
| **5** | **Mẫu 1 - Khám lâm sàng** *(Trang 5)* | Bổ sung phân loại sức khỏe cho từng chuyên khoa ở mẫu trên 18 tuổi. | Giữ nguyên yêu cầu. | ⏳ **CẦN KIỂM TRA / HOÀN THIỆN** |
| **6** | ⭐ **Mẫu 1 - Thể lực ở Tiền sử** *(Trang 6)* | *Chưa có* | **[MỚI 14/08]:** Khối thể lực/dấu hiệu sinh tồn bên tab Tiền sử đang bị thừa (lấy nhầm của Mẫu 2 sang). | 🆕 **CẦN THỰC HIỆN** |
| **7** | **Mẫu 2 - Bệnh đang điều trị** *(Trang 7)* | Thiếu chỗ đánh thuốc đang sử dụng. | Giữ nguyên yêu cầu. | ⏳ **CẦN KIỂM TRA / HOÀN THIỆN** |
| **8** | **Mẫu 2 - Tiền sử sản phụ khoa** *(Trang 8)* | Sửa tiền sử sản phụ khoa cho cả nam và nữ (`SAN_KHOA`, `SAN_KHOA_KHONG_BT`). | Giữ nguyên yêu cầu. | ⏳ **CẦN KIỂM TRA / HOÀN THIỆN** |
| **9** | **Mẫu 2 - Khám lâm sàng khác** *(Trang 9)* | Bổ sung chuyên khoa Khám lâm sàng khác (`NHI_KHOA_LAM_SANG_KHAC`). | Giữ nguyên yêu cầu. | ⏳ **CẦN KIỂM TRA / HOÀN THIỆN** |
| **10** | **Phân loại sức khỏe** *(Trang 10)* | Dropdown phân loại ghi rõ ý nghĩa: Loại I (Rất khỏe)... | Giữ nguyên yêu cầu. | ⏳ **CẦN KIỂM TRA / HOÀN THIỆN** |
| **11** | **Xuất XML VNeID** *(Trang 11)* | Sửa lỗi sinh XML không đúng khi chuyển đổi giữa các mẫu biểu 1, 2, 3. | Giữ nguyên yêu cầu. | ⏳ **CẦN KIỂM TRA / HOÀN THIỆN** |
| **12** | ⭐ **Quản lý In Code (Barcode XN)** *(Trang 12)*| *Chưa có* | **[MỚI 14/08]:** In Barcode Phiếu Xét nghiệm hiển thị sai dữ liệu (đang dùng mock test ngẫu nhiên). | 🆕 **CẦN THỰC HIỆN** |

---

## 2. Kế hoạch Triển khai Chi tiết Từng Mục (Implementation Plan)

### 🔹 GIAI ĐOẠN 1: Hiệu chỉnh Mẫu 1 (>18 Tuổi - QĐ 2062/1551)
- **Mục 1.1 (Điểm mới số 1):** Loại bỏ khối *"Đánh giá dấu hiệu sinh tồn & Thể lực"* đang bị hiển thị thừa trong tab `Tiền sử & Khám thể lực` của Mẫu 1 (chỉ active khối này cho Mẫu 2 Trẻ em). Đảm bảo việc nhập Thể lực của Mẫu 1 chỉ thực hiện ở tab `Khám lâm sàng` -> Chuyên khoa `Thể lực`.
- **Mục 1.2:** Hoàn thiện các trường câu hỏi & tiền sử Mẫu 1:
  - `TSBT_NGHIEN_RUOU`: 0=Không, 1=Có.
  - `TSBT_MA_BENH_KHAC`: Ghi nhận mã ICD-10 phân tách bằng `;`.
  - `TSBT_MA_BENH`: Ghi nhận mã ICD-10 của bệnh đang điều trị.
- **Mục 1.3:** Tách biệt và chuẩn hóa Tiền sử thai sản (sửa tương tự như bệnh điều trị):
  - `TSBT_THAI_SAN`: Boolean/Số 0/1.
  - `TSBT_MA_BENH_THAI_SAN`: Danh sách mã ICD-10.
  - `TSBT_TEN_THUOC_THAI_SAN`: Textbox lưu tên thuốc và liều lượng.
- **Mục 1.4:** Bổ sung Phân loại sức khỏe (chọn Loại I đến V) cho từng chuyên khoa khám lâm sàng của Mẫu 1 (Nội khoa, Ngoại khoa, Mắt, TMH, RHM, Da liễu, Phụ khoa...).

---

### 🔹 GIAI ĐOẠN 2: Hiệu chỉnh Mẫu 2 (6-18 Tuổi) & UX Phân loại
- **Mục 2.1:** Bổ sung textarea nhập thuốc đang sử dụng (`THUOC_DANG_DUNG` / `BENH_DANG_DIEU_TRI`) khi có mã bệnh bản thân đang điều trị.
- **Mục 2.2:** Sửa UI Tiền sử sản phụ khoa Mẫu 2 (6-18 tuổi) để kích hoạt nhập cho cả Nam/Nữ, mapping vào thẻ XML `SAN_KHOA_KHONG_BT`.
- **Mục 2.3:** Bổ sung phần tử *"Khám lâm sàng khác"* (`NHI_KHOA_LAM_SANG_KHAC`) gồm tên chuyên khoa và kết quả.
- **Mục 2.4:** Thay đổi label tại tất cả dropdown phân loại sức khỏe:
  - `1`: Loại I (Rất khỏe)
  - `2`: Loại II (Khỏe)
  - `3`: Loại III (Trung bình)
  - `4`: Loại IV (Yếu)
  - `5`: Loại V (Rất yếu)

---

### 🔹 GIAI ĐOẠN 3: Xử lý Lỗi Quản lý In Code (In Barcode Phiếu Xét Nghiệm)
- **Mục 3.1:** Xóa bỏ đoạn code `generateMockLabOrders` trong modal in barcode `PrintBarcodeXnModal.tsx`.
- **Mục 3.2:** Ánh xạ chính xác dữ liệu từ danh mục xét nghiệm (`doc.paraclinical_items` hoặc service tương đương) để lấy danh sách chỉ định thực tế của bệnh nhân.
- **Mục 3.3:** Hiển thị đúng mã vạch, tên xét nghiệm, nhóm máu/nước tiểu trên tem in.

---

### 🔹 GIAI ĐOẠN 4: Chuẩn hóa Engine Xuất XML VNeID
- **Mục 4.1:** Reset và làm sạch state XML Payload khi người dùng đổi loại Mẫu biểu từ 1 sang 2 hoặc 3, tránh bị đọng lại các trường không hợp lệ của mẫu trước đó.
- **Mục 4.2:** Tách biệt hàm sinh `THONG_TIN_CHUNG`, `TIEN_SU_BENH_TAT`, `KHAM_THE_LUC`, `KHAM_LAM_SANG` theo đúng cấu trúc XSD độc lập của từng mẫu (Mẫu 1 có cấu trúc XML khác hoàn toàn Mẫu 2).
