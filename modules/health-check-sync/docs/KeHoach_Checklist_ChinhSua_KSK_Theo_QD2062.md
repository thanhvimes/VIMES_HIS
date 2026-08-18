# KẾ HOẠCH VÀ CHECKLIST CHỈNH SỬA MODULE KSK

## Theo tài liệu `Chinh sua KSK 13-08_V1.pdf` và QĐ 2062/QĐ-BYT

> Tài liệu này chuyển các yêu cầu trong PDF chỉnh sửa thành checklist triển khai cho module `health-check-sync`.
>
> Trạng thái ban đầu: `[ ] Chưa thực hiện`.

## Cập nhật tiến độ thực tế

Sau các đợt triển khai và kiểm thử:

- `[x]` Nguồn chi trả đã chuẩn hóa mã 1, 2, 3, 4, 5, 9 và mapping `NGUON_CHI_TRA`.
- `[x]` Bổ sung `TSBT_NGHIEN_RUOU`, `TSBT_MA_BENH_KHAC` và `NHI_KHOA_LAM_SANG_KHAC`.
- `[x]` Bổ sung validation nguồn chi trả, phân loại sức khỏe, hồ sơ trẻ dưới 6 tuổi.
- `[x]` Chuẩn hóa nhóm tuổi theo ngày sinh và mốc đủ 6/18 tuổi.
- `[x]` Sửa payload API thành `data.file_content`.
- `[x]` Bổ sung checksum RSA-SHA256 có verify bằng public key; loại bỏ chữ ký fallback.
- `[x]` Chặn gửi hồ sơ chưa ký, thiếu XML/chữ ký hoặc đã gửi thành công.
- `[x]` Retry có chọn lọc đối với timeout, lỗi mạng, 5xx, 503, 504, 429.
- `[x]` Đã có 30 test backend liên quan QĐ 2062/sync và 4 test UI contract không cần browser, đều đạt; đã bổ sung test nút mở file XML cục bộ.
- `[x]` Validate lại XML cuối cùng sau chuẩn hóa/ký/Base64 trước khi gửi gateway.
- `[x]` Hồ sơ tạo mới chỉ dùng 3 mẫu QĐ 2062; API chặn form ngoài 1/2/3.
- `[x]` API create/update kiểm tra ngày sinh, nhóm tuổi, nguồn chi trả và phân loại sức khỏe.
- `[x]` Mẫu 3 sinh `TYPE=Adult`; không còn hiển thị lựa chọn giấy KSK người lái xe trong UI 3 mẫu.
- `[x]` Frontend typecheck, build, security check và bundle budget đều đạt.
- `[ ]` Chưa nghiệm thu trực tiếp với Sandbox/Production gateway.
- `[x]` Không xử lý chuyển đổi 17 mẫu cũ theo phạm vi đã thống nhất; chỉ hỗ trợ hồ sơ mới 3 mẫu.
- `[ ]` Chưa hoàn tất test UI end-to-end trên browser thực tế.
- `[ ]` Chưa đối chiếu toàn bộ schema XML với XSD chính thức của cổng.

## 1. Phạm vi yêu cầu từ tài liệu chỉnh sửa

PDF `Chinh sua KSK 13-08_V1.pdf` nêu các nhóm vấn đề sau:

1. Mẫu 1: mã nguồn chi trả cần kiểm tra lại.
2. Mẫu 1: thiếu tiền sử nghiện rượu, bia `TSBT_NGHIEN_RUOU`.
3. Mẫu 1: thiếu tiền sử bệnh khác `TSBT_MA_BENH_KHAC`.
4. Phần câu hỏi khác thiếu tên bệnh đang điều trị; cần xác định cách dùng `TSBT_MA_BENH`.
5. Phần tiền sử thai sản đang sai/tương tự với phần bệnh đang điều trị; cần tách và sửa trường.
6. Mẫu trên 18 tuổi thiếu phần phân loại sức khỏe trong khám lâm sàng.
7. Mẫu 2: trường mã bệnh bản thân đang điều trị thiếu chỉ định bắt buộc và cần kiểm tra lại dữ liệu gửi lên.
8. Nhóm 6-18 tuổi: tiền sử sản phụ khoa đang chỉ hiện cho nữ; yêu cầu sửa để xử lý đúng nghiệp vụ đối tượng nam/nữ và mapping.
9. Nhóm 6-18 tuổi thiếu trường khám lâm sàng khác `NHI_KHOA_LAM_SANG_KHAC`.
10. Phần phân loại sức khỏe cần hiển thị rõ ý nghĩa Loại I, II, III, IV, V.
11. XML gửi lên không đúng mẫu khi chuyển đổi giữa các mẫu biểu.

Các yêu cầu trên phải được triển khai theo mô hình QĐ 2062: 3 nhóm tuổi là mô hình nghiệp vụ chính, còn dữ liệu gửi được đóng gói thành Envelope với các XML thành phần.

## 2. Nguyên tắc triển khai

- Không sửa riêng giao diện mà bỏ qua mapping, dữ liệu lưu và XML.
- Mỗi trường phải có đủ 4 lớp: state/form, lưu database/JSONB, mapping XML, validation.
- Không dùng `form_type` cũ làm điều kiện duy nhất. Cần xác định nhóm tuổi theo ngày sinh tại thời điểm khám.
- Vẫn giữ tương thích dữ liệu 17 mẫu cũ trong quá trình chuyển đổi.
- Nếu hồ sơ đã ký hoặc đã gửi, không tự động chuyển đổi và ghi đè dữ liệu/XML.
- Phải kiểm tra XML cuối cùng sau khi đổi mẫu, không chỉ kiểm tra object JSON trên frontend.
- Các trường bắt buộc, trường hiển thị và trường gửi cổng phải được quản lý riêng.

## 3. Checklist tổng thể

| ID | Nhóm | Nội dung | Ưu tiên | Trạng thái |
|---|---|---|---|---|
| KSK-001 | Dữ liệu | Rà soát mã nguồn chi trả | P0 | [ ] |
| KSK-002 | Tiền sử | Bổ sung nghiện rượu, bia | P1 | [ ] |
| KSK-003 | Tiền sử | Bổ sung bệnh khác | P1 | [ ] |
| KSK-004 | Tiền sử | Tách bệnh đang điều trị và tiền sử thai sản | P0 | [ ] |
| KSK-005 | Trẻ em | Sửa tiền sử sản phụ khoa nhóm 6-18 | P1 | [ ] |
| KSK-006 | Trẻ em | Bổ sung khám lâm sàng khác | P1 | [ ] |
| KSK-007 | Kết luận | Bổ sung phân loại sức khỏe người lớn | P0 | [ ] |
| KSK-008 | Kết luận | Hiển thị ý nghĩa Loại I-V | P1 | [ ] |
| KSK-009 | XML | Sửa chuyển đổi mẫu và sinh XML | P0 | [ ] |
| KSK-010 | XML | Kiểm tra mapping mã bệnh và trường bắt buộc | P0 | [ ] |
| KSK-011 | QĐ2062 | Chuẩn hóa 3 nhóm tuổi và tương thích 17 mẫu | P0 | [ ] |
| KSK-012 | QA | Kiểm thử hồi quy và nghiệm thu XML | P0 | [ ] |

## 4. Checklist chi tiết theo yêu cầu

### KSK-001 - Rà soát nguồn chi trả

**Hiện tượng:** PDF yêu cầu xem lại dữ liệu trường Nguồn chi trả ở Mẫu 1.

**Quy tắc QĐ 2062:** `NGUON_CHI_TRA` là trường bắt buộc trong thông tin chung lần khám. Mã hợp lệ:

| Mã | Ý nghĩa |
|---|---|
| 1 | Ngân sách Trung ương |
| 2 | Ngân sách địa phương |
| 3 | Quỹ Bảo hiểm y tế |
| 4 | Người sử dụng lao động |
| 5 | Xã hội hóa |
| 9 | Khác |

**Công việc:**

- [ ] Xác định field hiện lưu nguồn chi trả trong state và payload.
- [ ] Chuẩn hóa kiểu dữ liệu thành mã, không gửi nhãn hiển thị.
- [ ] Bổ sung danh mục dùng chung cho cả 3 nhóm tuổi.
- [ ] Kiểm tra giá trị mặc định; không tự động gán mã 1 nếu người dùng chưa chọn.
- [ ] Hiển thị cảnh báo nếu để trống trước khi ký/gửi.
- [ ] Kiểm tra XML/JSON có đúng `NGUON_CHI_TRA` và đúng mã.
- [ ] Kiểm tra đồng bộ lại hồ sơ cũ không làm đổi mã đã lưu.

**Acceptance:** 6 mã hợp lệ được lưu và gửi đúng; giá trị rỗng hoặc mã ngoài danh mục bị chặn trước ký.

### KSK-002 - Tiền sử nghiện rượu, bia

**Trường mới:** `TSBT_NGHIEN_RUOU`.

**Quy tắc:**

- `0`: Không.
- `1`: Có.

**Công việc:**

- [ ] Bổ sung field vào model/state tiền sử.
- [ ] Hiển thị ở phần tiền sử bản thân, không đặt trong ghi chú chung.
- [ ] Dùng radio/select rõ hai giá trị Không/Có.
- [ ] Mapping sang key XML đúng tên chuẩn.
- [ ] Không áp dụng bắt buộc cho nhóm tuổi nếu Phụ lục 01 không đánh dấu bắt buộc; tuy nhiên phải gửi đúng khi có giá trị.
- [ ] Bổ sung dữ liệu vào import/seed nếu có.

**Acceptance:** Có thể lưu, sửa, xem lại và sinh XML đúng `0/1`, không gửi chuỗi “Có/Không”.

### KSK-003 - Tiền sử bệnh khác

**Trường mới:** `TSBT_MA_BENH_KHAC`.

**Quy tắc:** dùng mã ICD-10 hoặc mã triệu chứng/hội chứng theo danh mục Bộ Y tế; nhiều mã phân cách bằng `;`.

**Công việc:**

- [ ] Bổ sung ô “Bệnh khác (ghi rõ)”.
- [ ] Tái sử dụng component chọn ICD-10 nếu phù hợp.
- [ ] Cho phép nhiều mã và chuẩn hóa dấu phân cách thành `;`.
- [ ] Không trộn với `TSBT_MA_BENH` là bệnh đang điều trị.
- [ ] Kiểm tra mã không hợp lệ trước ký.
- [ ] Mapping XML/JSON và preview phải hiển thị đúng.

**Acceptance:** Nhiều mã được lưu theo một format thống nhất; không mất mã khi mở/sửa hồ sơ.

### KSK-004 - Tách “bệnh đang điều trị” và “tiền sử thai sản”

**Hiện tượng:** PDF ghi nhận câu hỏi “Tên bệnh đang điều trị” đang bị dùng/hiển thị sai tương tự phần tiền sử thai sản.

**Công việc:**

- [ ] Xác định rõ `TSBT_MA_BENH` là bệnh bản thân đã/đang mắc hoặc đang điều trị theo ngữ cảnh Phụ lục 01.
- [ ] Tạo field/nhóm dữ liệu riêng cho tiền sử sản khoa/sản phụ khoa.
- [ ] Không bind chung hai field vào một state key.
- [ ] Kiểm tra điều kiện hiển thị theo giới tính và nhóm tuổi.
- [ ] Kiểm tra dữ liệu cũ: migration mapping phải có quy tắc, không tự động chuyển toàn bộ dữ liệu sang sản khoa.
- [ ] Cập nhật label, tooltip và validation để người dùng hiểu đúng.
- [ ] Cập nhật XML mapping của bệnh đang điều trị và tiền sử thai sản độc lập.

**Acceptance:** Nhập bệnh đang điều trị không làm thay đổi tiền sử thai sản và ngược lại; XML chứa đúng nhóm dữ liệu.

### KSK-005 - Tiền sử sản phụ khoa nhóm 6-18 tuổi

**Hiện tượng:** PDF yêu cầu sửa phần tiền sử sản phụ khoa đang xử lý không đúng nam/nữ.

**Nguyên tắc:** không được làm mất dữ liệu đã có; việc hiển thị phải phù hợp giới tính sinh học trong hồ sơ và quy định trường của QĐ 2062.

**Công việc:**

- [ ] Kiểm tra logic hiện tại đang dùng `formType` hay `gender` để hiển thị.
- [ ] Xác định rõ trường nào áp dụng cho nữ, trường nào là thông tin chung.
- [ ] Với nam: ẩn các câu hỏi không áp dụng nhưng không xóa dữ liệu cũ.
- [ ] Với nữ: hiển thị đầy đủ nhóm tiền sử sản phụ khoa cần thiết.
- [ ] Khi đổi giới tính hoặc đổi nhóm tuổi, cảnh báo trước khi thay đổi field hiển thị.
- [ ] Kiểm tra mapping XML không gửi các trường không áp dụng nếu đặc tả yêu cầu loại bỏ.
- [ ] Bổ sung test nam, nữ và dữ liệu lịch sử.

**Acceptance:** Hồ sơ nam không bị yêu cầu nhập trường sản khoa không áp dụng; hồ sơ nữ có đủ trường; dữ liệu và XML ổn định khi đổi mẫu.

### KSK-006 - Bổ sung khám lâm sàng khác nhóm 6-18

**Trường:** `NHI_KHOA_LAM_SANG_KHAC`.

**Công việc:**

- [ ] Bổ sung field vào nhóm khám lâm sàng của nhóm 6-18.
- [ ] Xác định kiểu dữ liệu và giới hạn độ dài theo mapping QĐ 2062.
- [ ] Thêm vào tab khám phù hợp, không đặt nhầm trong tiền sử.
- [ ] Lưu cùng clinical data.
- [ ] Hiển thị trong màn hình xem lại/in nếu thuộc trường nghiệp vụ cần hiển thị.
- [ ] Mapping vào XML thành phần tương ứng.
- [ ] Không ghi đè khi đồng bộ LIS/PACS.

**Acceptance:** Nhóm 6-18 nhập được, lưu được, xem lại được và XML không bỏ mất trường.

### KSK-007 - Bổ sung phân loại sức khỏe cho người từ 18 tuổi

**Hiện tượng:** mẫu trên 18 tuổi thiếu phần phân loại sức khỏe trong khám lâm sàng.

**Công việc:**

- [ ] Bổ sung lựa chọn phân loại sức khỏe I-V ở phần kết luận/khám lâm sàng người lớn.
- [ ] Phân biệt phân loại từng chuyên khoa và phân loại sức khỏe chung.
- [ ] Không tự động lấy phân loại chuyên khoa cuối cùng làm phân loại chung.
- [ ] Bổ sung validation trường `PHAN_LOAI_SK` trước ký.
- [ ] Nếu có bệnh/kết luận bất thường, yêu cầu nhập mã bệnh hoặc vấn đề sức khỏe theo quy định nghiệp vụ.
- [ ] Mapping đúng vào XML kết luận.
- [ ] Hiển thị trên bản in và XML preview.

**Acceptance:** Người lớn không thể ký hồ sơ thiếu phân loại chung; phân loại được lưu/gửi là một trong I-V.

### KSK-008 - Hiển thị ý nghĩa Loại I-V

**Danh mục hiển thị:**

| Loại | Ý nghĩa |
|---|---|
| I | Rất khỏe |
| II | Khỏe |
| III | Trung bình |
| IV | Yếu |
| V | Rất yếu |

**Công việc:**

- [ ] Hiển thị nhãn đầy đủ cạnh select/radio.
- [ ] Dùng cùng danh mục ở form, preview, bản in và danh sách.
- [ ] Lưu mã số, không lưu nhãn tự do.
- [ ] Có thể hiển thị tooltip giải thích nhưng không thay đổi ý nghĩa pháp lý.
- [ ] Kiểm tra dữ liệu cũ đang lưu `1..5`, `I..V` hay text; xây dựng normalize một lần.

**Acceptance:** Người dùng nhìn thấy cả mã và ý nghĩa; XML gửi mã quy định, không gửi chuỗi mô tả thay cho mã.

### KSK-009 - Sửa chuyển đổi mẫu và sinh XML

**Hiện tượng:** XML gửi lên không đúng mẫu khi chuyển đổi giữa các mẫu biểu.

**Nguyên nhân cần điều tra:** module hiện còn điều kiện theo 17 mẫu (`form_type`) ở nhiều component; chuyển mẫu có nguy cơ giữ state cũ, thiếu field mới hoặc dùng sai mapping.

**Công việc frontend/state:**

- [ ] Lập bảng chuyển đổi 17 mẫu cũ → 3 nhóm tuổi QĐ 2062.
- [ ] Xác định field dùng chung, field chỉ nhóm 1, nhóm 2, nhóm 3.
- [ ] Khi đổi mẫu, giữ dữ liệu dùng chung và reset có kiểm soát field không áp dụng.
- [ ] Không dùng `formType` cũ để quyết định toàn bộ cấu trúc XML mới.
- [ ] Gắn `age_group` và schema version vào payload nội bộ.

**Công việc XML:**

- [ ] Sinh Envelope theo cấu trúc QĐ 2062.
- [ ] Đảm bảo `MA_LK`, `MA_CSKCB`, `MA_GTIN_CSKCB`, `NGAY_VAO` lấy từ cùng một hồ sơ.
- [ ] Đảm bảo `LOAIHOSO` và nội dung file thành phần khớp nhau.
- [ ] Không gửi field của mẫu cũ vào XML nhóm tuổi nếu không có trong mapping.
- [ ] Đảm bảo chữ ký được tạo sau khi chuyển đổi và validation hoàn tất.
- [ ] Hash/checksum phải tính trên payload cuối cùng sau encode Base64.
- [ ] Lưu XML trước ký và XML sau ký để audit.

**Acceptance:** Với cùng một hồ sơ, chuyển từ mẫu cũ sang nhóm tuổi mới không làm XML sai schema, sai nhóm tuổi, mất dữ liệu chung hoặc lẫn trường mẫu khác.

### KSK-010 - Mã bệnh bản thân đang điều trị và chỉ định bắt buộc

**Hiện tượng:** Mẫu 2 thiếu chỉ định “đang sử dụng” và cần kiểm tra dữ liệu gửi.

**Công việc:**

- [ ] Bổ sung ngữ nghĩa đầy đủ cho câu hỏi: mã bệnh bản thân đã/đang mắc, đang điều trị, thuốc đang sử dụng nếu đặc tả có yêu cầu.
- [ ] Không dùng một field `TSBT_MA_BENH` cho nhiều câu hỏi có nghĩa khác nhau nếu XML phân biệt.
- [ ] Thêm cờ có/không và nội dung chi tiết tương ứng khi cần.
- [ ] Nếu chọn “Có bệnh đang điều trị”, bắt buộc mã ICD-10 hợp lệ.
- [ ] Nếu chọn “Không”, không gửi mã bệnh rác từ dữ liệu cũ.
- [ ] Kiểm tra payload thực tế bằng XML preview và log request.

**Acceptance:** Dữ liệu “có/không”, mã bệnh và thông tin đang điều trị được phân biệt; không gửi dữ liệu mâu thuẫn.

### KSK-011 - Chuẩn hóa 3 nhóm tuổi và tương thích 17 mẫu

**Công việc kiến trúc:**

- [ ] Tạo bộ constant cho 3 nhóm tuổi theo QĐ 2062.
- [ ] Tạo hàm xác định nhóm tuổi từ ngày sinh và ngày khám.
- [ ] Giữ `form_type` cũ để tương thích hồ sơ lịch sử.
- [ ] Bổ sung `age_group`/`schema_version` vào dữ liệu mới.
- [ ] Tạo mapping legacy → QĐ 2062 một chiều, có log.
- [ ] Không cho đổi nhóm tuổi ngầm sau khi hồ sơ đã ký/gửi.
- [ ] Cập nhật dashboard/list/filter để hiển thị nhóm tuổi bên cạnh mẫu cũ.
- [ ] Cập nhật tên form, print và XML preview để tránh người dùng hiểu “Mẫu 1/2/3” là XML1/XML2/XML3.

**Acceptance:** Hồ sơ cũ vẫn mở/in được; hồ sơ mới dùng 3 nhóm tuổi; XML mới không phụ thuộc sai vào số mẫu cũ.

### KSK-012 - Kiểm thử và nghiệm thu

#### Kiểm thử đơn vị

- [ ] Mã nguồn chi trả: đủ 1,2,3,4,5,9; chặn mã khác.
- [ ] `TSBT_NGHIEN_RUOU`: đúng 0/1.
- [ ] Bệnh khác: nhiều mã ICD-10 phân cách `;`.
- [ ] Phân loại sức khỏe: đúng mã 1-5 và nhãn I-V.
- [ ] Xác định nhóm tuổi tại mốc 6 và 18 tuổi.
- [ ] Chuyển mẫu không làm mất field dùng chung.

#### Kiểm thử giao diện

- [ ] Mẫu 1 có đủ tiền sử nghiện rượu/bia và bệnh khác.
- [ ] Bệnh đang điều trị không bị hiển thị nhầm trong tiền sử thai sản.
- [ ] Nam/nữ nhóm 6-18 hiển thị đúng phần sản phụ khoa.
- [ ] Nhóm 6-18 có khám lâm sàng khác.
- [ ] Người lớn có phân loại sức khỏe.
- [ ] Loại I-V hiển thị rõ ý nghĩa.

#### Kiểm thử dữ liệu/XML

- [ ] Tạo hồ sơ mới cho cả 3 nhóm tuổi.
- [ ] Chuyển đổi giữa các mẫu cũ.
- [ ] Mở và lưu lại hồ sơ đã có dữ liệu.
- [ ] Kiểm tra XML thành phần và Envelope.
- [ ] Kiểm tra `LOAIHOSO`, `MA_LK`, mã CSKCB, GLN, ngày khám.
- [ ] Kiểm tra không gửi field không áp dụng.
- [ ] Kiểm tra XML sau ký và checksum.

#### Kiểm thử trạng thái

- [ ] Hồ sơ nháp cho phép sửa.
- [ ] Hồ sơ đã ký cảnh báo và không cho sửa trái quy trình.
- [ ] Hồ sơ đã gửi không bị đổi XML khi đồng bộ lại.
- [ ] Gửi lỗi validation hiển thị lỗi cụ thể.
- [ ] Gửi lỗi chữ ký/checksum lưu được response.

#### Kiểm thử hồi quy

- [ ] Trẻ dưới 6 tuổi.
- [ ] Học sinh 6-18 tuổi nam.
- [ ] Học sinh 6-18 tuổi nữ.
- [ ] Người lớn nam.
- [ ] Người lớn nữ.
- [ ] Hồ sơ có LIS/PACS.
- [ ] Hồ sơ không có LIS/PACS.
- [ ] Hồ sơ đã ký/gửi từ phiên bản cũ.

## 5. Ma trận file dự kiến cần rà soát

| Khu vực | File dự kiến |
|---|---|
| Điều phối form | `forms/DynamicForm.tsx`, `hooks/useDynamicFormState.ts` |
| Form trẻ em | `forms/mau1-child/ChildForm.tsx`, `forms/mau1-child/hooks/useChildFormState.ts`, các tab trong `forms/mau1-child/tabs` |
| Hành chính/tiền sử | `forms/tabs/AdminTab.tsx`, `forms/tabs/HistoryTab.tsx` |
| Khám lâm sàng | `forms/tabs/exam/ExamContainer.tsx` và các tab chuyên khoa |
| Kết luận | `forms/tabs/ConclusionTab.tsx` |
| Cận lâm sàng | `forms/tabs/LabTab.tsx` |
| In/preview | `forms/PrintForm.tsx`, `components/modals/XmlPreviewModal.tsx` |
| Danh sách/lọc | `views/HealthCheckSyncView.tsx`, `components/DocumentList.tsx`, `components/Dashboard.tsx` |
| Cấu hình/mapping | `constants.ts`, `models/HealthCheckSettings.ts` và service/backend tương ứng |
| Ký XML | `utils/efySigner.ts`, backend signing/XML service |

Đây là danh sách rà soát frontend trong module; phần sinh XML, API và lưu database ở thư mục backend/service gốc phải được đối chiếu thêm khi triển khai KSK-009 và KSK-010.

## 6. Thứ tự triển khai đề xuất

### Giai đoạn 1 - Chốt nghiệp vụ và schema

- [ ] Chốt mapping từng yêu cầu PDF với trường QĐ 2062.
- [ ] Chốt 3 nhóm tuổi và mapping 17 mẫu cũ.
- [ ] Chốt field tách riêng cho bệnh đang điều trị, tiền sử bệnh khác, sản khoa.
- [ ] Chốt schema/version XML.

### Giai đoạn 2 - Sửa state và giao diện

- [ ] Sửa nguồn chi trả.
- [ ] Bổ sung tiền sử.
- [ ] Sửa nhóm 6-18.
- [ ] Bổ sung phân loại người lớn.
- [ ] Chuẩn hóa hiển thị Loại I-V.

### Giai đoạn 3 - Sửa mapping và XML

- [ ] Sửa mapping dữ liệu.
- [ ] Sửa chuyển đổi mẫu.
- [ ] Sinh Envelope/XML theo QĐ 2062.
- [ ] Bổ sung validation trước ký.
- [ ] Kiểm tra chữ ký/checksum.

### Giai đoạn 4 - Kiểm thử và nghiệm thu

- [ ] Chạy unit test.
- [ ] Chạy test hồ sơ 3 nhóm tuổi.
- [ ] Chạy test chuyển mẫu.
- [ ] Chạy test ký/gửi sandbox.
- [ ] Đối chiếu response cổng.
- [ ] Lập biên bản nghiệm thu từng yêu cầu PDF.

## 7. Tiêu chí hoàn thành chung

Chỉ đánh dấu hoàn thành khi thỏa mãn toàn bộ:

- [ ] Yêu cầu PDF đã có mã task và bằng chứng kiểm thử.
- [ ] Dữ liệu hiển thị, lưu trữ và XML mapping nhất quán.
- [ ] Ba nhóm tuổi QĐ 2062 hoạt động đúng.
- [ ] Dữ liệu 17 mẫu lịch sử không bị mất.
- [ ] XML không sai khi chuyển đổi mẫu.
- [ ] Hồ sơ đủ điều kiện mới được ký/gửi.
- [ ] Response API và mã giao dịch được lưu audit.
- [ ] Có test hồi quy cho trẻ em, 6-18 và người lớn.
- [ ] Có người nghiệp vụ xác nhận các trường tiền sử, sản khoa và phân loại sức khỏe.

## 8. Tài liệu nguồn

- [PDF yêu cầu chỉnh sửa KSK 13-08 V1](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/Chinh%20sua%20KSK%2013-08_V1.pdf)
- [Tổng hợp thay đổi QĐ 2062 so với QĐ 1551](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/QD2062_TongHopThayDoi_QD1551.md)
- [Mapping hiện tại](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/mapping.md)
- [Workflow hiện tại](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/workflow.md)
- [Kế hoạch kiểm thử hiện tại](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/testing-plan.md)
