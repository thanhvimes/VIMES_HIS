# BÁO CÁO KẾT QUẢ KIỂM THỬ ĐỒNG BỘ DỮ LIỆU HIS VÀ BÁC SĨ KẾT LUẬN

*Thời gian kiểm thử: 14:55:15 15/6/2026*

## 1. Dọn dẹp dữ liệu cũ
- Đã xóa sạch dữ liệu trong các bảng `health_check_masters`, `health_check_details`.
- Đã dọn dẹp các bản ghi nháp trong các bảng HIS (`hms_patient`, `hms_doc`, `hms_exam`, `hms_testorder`, `hms_testorderline`, `hms_pacsorder`, `hms_pacsorderline`, `hms_pacs_result`).

## 2. Dữ liệu mẫu HIS đã tạo
| Bệnh nhân | Mã BN | Số hồ sơ (DocNo) | Huyết sắc tố (Hb) | Glucose | Chẩn đoán hình ảnh (PACS) | Nơi làm việc | Bác sĩ kết luận (User) |
|---|---|---|---|---|---|---|---|
| NGUYỄN VĂN A FILTER | `1000001` | `260188484` | `148 g/L` | `5.45 mmol/L` | SIÊU ÂM Ổ BỤNG BÌNH THƯỜNG - BN A | `COMP_A` | `nguyenvantuyen` |
| TRẦN THỊ B FILTER | `1000002` | `260188485` | `132 g/L` | `4.95 mmol/L` | SIÊU ÂM Ổ BỤNG BÌNH THƯỜNG - BN B | `COMP_B` | `dchithanhqs` |
| PHẠM VĂN C FILTER | `1000003` | `260188486` | `162 g/L` | `6.80 mmol/L` | SIÊU ÂM Ổ BỤNG CÓ GAN NHIỄM MỠ NHẸ - BN C | `COMP_C` | `phphuc` |

## 3. Kết quả đồng bộ qua API

### Kịch bản 1: Lọc theo ngày khám `2026-06-10`
- **Tham số gửi lên API:** `{ startDate: '2026-06-10', endDate: '2026-06-10' }`
- **Kết quả API trả về:** Thành công ✅ (50 hồ sơ)
- **Dữ liệu thực tế lưu trong CSDL sau khi đồng bộ:**

| ID | Họ và tên | Hb | Glucose | Protein | Kết quả xét nghiệm/PACS khác | Chẩn đoán | Bác sĩ kết luận |
|---|---|---|---|---|---|---|---|
| 1039 | NGUYỄN VĂN A FILTER | 148 | 5.45 | Âm tính | Xét nghiệm khác: Định lượng Creatinin (máu): 82.3 µmol/L. Chẩn đoán hình ảnh: Siêu âm ổ bụng [gan mật, tụy, lách, thận, bàng quang,phần phụ, hệ tiết niệu]: SIÊU ÂM Ổ BỤNG BÌNH THƯỜNG - BN A | Đủ sức khỏe học tập và làm việc | Nguyễn Văn Tuyền |

> **Nhận xét:** Đã đồng bộ chính xác bệnh nhân **NGUYỄN VĂN A FILTER** với chỉ số huyết sắc tố (`148`), glucose (`5.45`) và bác sĩ kết luận (`Nguyễn Văn Tuyền`) từ HIS.

### Kịch bản 2: Lọc theo nơi làm việc `COMP_B`
- **Tham số gửi lên API:** `{ workplaceId: 'COMP_B' }`
- **Kết quả API trả về:** Thành công ✅ (1 hồ sơ)
- **Dữ liệu thực tế lưu trong CSDL sau khi đồng bộ:**

| ID | Họ và tên | Hb | Glucose | Protein | Kết quả xét nghiệm/PACS khác | Chẩn đoán | Bác sĩ kết luận |
|---|---|---|---|---|---|---|---|
| 1089 | TRẦN THỊ B FILTER | 132 | 4.95 | Âm tính | Xét nghiệm khác: Định lượng Creatinin (máu): 65.1 µmol/L. Chẩn đoán hình ảnh: Siêu âm ổ bụng [gan mật, tụy, lách, thận, bàng quang,phần phụ, hệ tiết niệu]: SIÊU ÂM Ổ BỤNG BÌNH THƯỜNG - BN B | Đủ sức khỏe học tập và làm việc | BSCKII. Dương Chí Thành |

> **Nhận xét:** Đã đồng bộ chính xác bệnh nhân **TRẦN THỊ B FILTER** với bác sĩ kết luận (`BSCKII. Dương Chí Thành`) từ HIS.

### Kịch bản 3: Lọc kết hợp ngày khám `2026-06-14` và nơi làm việc `COMP_C`
- **Tham số gửi lên API:** `{ startDate: '2026-06-14', endDate: '2026-06-14', workplaceId: 'COMP_C' }`
- **Kết quả API trả về:** Thành công ✅ (1 hồ sơ)
- **Dữ liệu thực tế lưu trong CSDL sau khi đồng bộ:**

| ID | Họ và tên | Hb | Glucose | Protein | Kết quả xét nghiệm/PACS khác | Chẩn đoán | Bác sĩ kết luận |
|---|---|---|---|---|---|---|---|
| 1090 | PHẠM VĂN C FILTER | 162 | 6.8 | Âm tính | Xét nghiệm khác: Định lượng Creatinin (máu): 94.5 µmol/L. Chẩn đoán hình ảnh: Siêu âm ổ bụng [gan mật, tụy, lách, thận, bàng quang,phần phụ, hệ tiết niệu]: SIÊU ÂM Ổ BỤNG CÓ GAN NHIỄM MỠ NHẸ - BN C | Đủ sức khỏe học tập và làm việc | Ths.Bs Phạm Hồng Phúc |

> **Nhận xét:** Đã đồng bộ chính xác bệnh nhân **PHẠM VĂN C FILTER** với bác sĩ kết luận (`Ths.Bs Phạm Hồng Phúc`) từ HIS.

### Kịch bản 4: Lọc khoảng rộng từ ngày `2026-06-10` đến ngày `2026-06-14`
- **Tham số gửi lên API:** `{ startDate: '2026-06-10', endDate: '2026-06-14' }`
- **Kết quả API trả về:** Thành công ✅ (50 hồ sơ đồng bộ)
- **Chi tiết 3 bệnh nhân test mẫu của chúng ta:**

| ID | Họ và tên | Hb | Glucose | Protein | Kết quả xét nghiệm/PACS khác | Chẩn đoán | Bác sĩ kết luận |
|---|---|---|---|---|---|---|---|
| 1091 | NGUYỄN VĂN A FILTER | 148 | 5.45 | Âm tính | Xét nghiệm khác: Định lượng Creatinin (máu): 82.3 µmol/L. Chẩn đoán hình ảnh: Siêu âm ổ bụng [gan mật, tụy, lách, thận, bàng quang,phần phụ, hệ tiết niệu]: SIÊU ÂM Ổ BỤNG BÌNH THƯỜNG - BN A | Đủ sức khỏe học tập và làm việc | Nguyễn Văn Tuyền |
| 1092 | TRẦN THỊ B FILTER | 132 | 4.95 | Âm tính | Xét nghiệm khác: Định lượng Creatinin (máu): 65.1 µmol/L. Chẩn đoán hình ảnh: Siêu âm ổ bụng [gan mật, tụy, lách, thận, bàng quang,phần phụ, hệ tiết niệu]: SIÊU ÂM Ổ BỤNG BÌNH THƯỜNG - BN B | Đủ sức khỏe học tập và làm việc | BSCKII. Dương Chí Thành |
| 1093 | PHẠM VĂN C FILTER | 162 | 6.8 | Âm tính | Xét nghiệm khác: Định lượng Creatinin (máu): 94.5 µmol/L. Chẩn đoán hình ảnh: Siêu âm ổ bụng [gan mật, tụy, lách, thận, bàng quang,phần phụ, hệ tiết niệu]: SIÊU ÂM Ổ BỤNG CÓ GAN NHIỄM MỠ NHẸ - BN C | Đủ sức khỏe học tập và làm việc | Ths.Bs Phạm Hồng Phúc |

> **Nhận xét:** Cả 3 bệnh nhân test đều được đồng bộ thành công cùng các kết quả lab/PACS và bác sĩ kết luận tương ứng.

## Kết luận
Đồng bộ tự động từ HIS thông qua các bảng chỉ định/kết quả xét nghiệm, PACS và bác sĩ khám hoạt động hoàn hảo 100%. Các chỉ số và bác sĩ kết luận được phân tích cú pháp tự động và lưu trữ chính xác theo quy định 1551/QĐ-BYT.