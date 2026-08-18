# TỔNG HỢP THAY ĐỔI QĐ 2062/QĐ-BYT SO VỚI QĐ 1551/QĐ-BYT

> Tài liệu nguồn nghiệp vụ cho module `health-check-sync`.
>
> Căn cứ chính: Quyết định số 2062/QĐ-BYT ngày 07/07/2026 và các phụ lục kèm theo trong file `2026_7_03_QD sua doi QD 1551 (Final).signed.pdf`.

## 1. Kết luận nghiệp vụ quan trọng

QĐ 2062/QĐ-BYT không chỉ sửa một vài trường dữ liệu mà thay thế các Phụ lục 01, 02, 03 của QĐ 1551, đồng thời bổ sung Phụ lục 04 và 05.

Về nghiệp vụ khám sức khỏe định kỳ/sàng lọc, hệ thống cần tổ chức dữ liệu theo 3 nhóm đối tượng:

1. Trẻ dưới 6 tuổi.
2. Người từ 6 đến dưới 18 tuổi.
3. Người từ đủ 18 tuổi trở lên.

Điểm cần phân biệt: “3 mẫu chính” là 3 nhóm biểu mẫu/nghiệp vụ theo độ tuổi. Khi liên thông, dữ liệu vẫn được đóng gói trong Envelope và chứa nhiều hồ sơ XML thành phần (`XML1`, `XML2`, ...). Không được hiểu là chỉ gửi 3 tệp XML.

Các nội dung của QĐ 1551 không bị QĐ 2062 sửa đổi vẫn tiếp tục có hiệu lực.

## 2. Văn bản và hiệu lực

| Nội dung | QĐ 1551 | QĐ 2062 |
|---|---|---|
| Ngày ban hành | 31/05/2026 | 07/07/2026 |
| Quan hệ | Văn bản gốc | Sửa đổi, bổ sung QĐ 1551 |
| Hiệu lực | Theo QĐ 1551 | Có hiệu lực từ ngày ký, ban hành |
| Phạm vi sửa | Hướng dẫn thu thập, cập nhật, kết nối dữ liệu KSK và tạo/cập nhật Sổ sức khỏe điện tử VNeID | Thay thế Phụ lục 01-03; bổ sung Phụ lục 04-05; sửa các mục về phạm vi, chất lượng dữ liệu và chia sẻ dữ liệu |

## 3. Thay đổi cấp chính sách và kiến trúc hệ thống

### 3.1. Bổ sung khái niệm Cổng dữ liệu sức khỏe của Bộ Y tế

Cổng dữ liệu sức khỏe Bộ Y tế là hệ thống để thu thập, tiếp nhận, lưu trữ, cập nhật, đồng bộ, khai thác và chia sẻ dữ liệu sức khỏe người dân. Cổng gồm các thành phần chính:

- Cơ sở dữ liệu sức khỏe cá nhân.
- Phần mềm cập nhật, tiếp nhận, quản lý và theo dõi đồng bộ dữ liệu.
- Báo cáo, thống kê và Dashboard.
- API phục vụ kết nối, liên thông, đồng bộ, chia sẻ dữ liệu.

### 3.2. Chuẩn chất lượng dữ liệu bắt buộc

Dữ liệu đưa lên Cơ sở dữ liệu sức khỏe cá nhân phải bảo đảm:

- **Đúng**: phản ánh chính xác người dân, sự kiện và kết quả khám.
- **Đủ**: có đầy đủ trường bắt buộc theo cấu trúc Bộ Y tế.
- **Sạch**: không trùng, không mâu thuẫn, dùng đúng danh mục chuẩn.
- **Sống**: được cập nhật kịp thời và phản ánh trạng thái hiện tại.

Dữ liệu phải được ký số để bảo đảm tính xác thực và toàn vẹn. Đơn vị cập nhật chịu trách nhiệm pháp lý về tính chính xác, đầy đủ và hợp lệ.

### 3.3. Sổ sức khỏe điện tử

Mỗi người dân được quản lý bằng một Sổ sức khỏe điện tử duy nhất gắn với số định danh cá nhân. Bộ Y tế chia sẻ dữ liệu với Cơ sở dữ liệu quốc gia về dân cư để tạo lập/cập nhật Sổ sức khỏe điện tử trên VNeID.

Danh mục trường thực sự hiển thị trên VNeID được quy định riêng tại Phụ lục 04, không đồng nhất với toàn bộ trường dữ liệu gửi lên cổng.

## 4. Thay đổi từ 17 mẫu biểu sang 3 nhóm chính

### 4.1. Mô hình cũ

QĐ 1551 và tài liệu triển khai ban đầu tổ chức nhiều mẫu biểu riêng cho các đối tượng/mục đích khám khác nhau. Cách này làm giao diện, mapping và sinh XML phụ thuộc mạnh vào từng mẫu.

### 4.2. Mô hình mới

QĐ 2062 tổ chức phần khám sức khỏe định kỳ/sàng lọc theo ba nhóm tuổi:

| Nhóm | Đối tượng | Nghiệp vụ đặc thù |
|---|---|---|
| Nhóm 1 | Trẻ dưới 6 tuổi | Người giám hộ, tuần thai, sinh non, dinh dưỡng, phát triển tinh thần-vận động, tiêm chủng |
| Nhóm 2 | Từ 6 đến dưới 18 tuổi | Tiền sử, khám thể lực, chuyên khoa, cận lâm sàng, đánh giá sức khỏe theo lứa tuổi |
| Nhóm 3 | Từ đủ 18 tuổi | Khám tổng quát, tiền sử, chuyên khoa, cận lâm sàng, kết luận phân loại sức khỏe |

### 4.3. Quy tắc thiết kế cho module

- Tính nhóm tuổi tại thời điểm khám, không chỉ dựa vào mẫu người dùng chọn.
- Cho phép hiệu chỉnh nhóm khi ngày sinh hoặc giấy tờ được sửa, nhưng phải cảnh báo nếu hồ sơ đã ký/gửi.
- Tách `form_group`/`age_group` khỏi `form_type` cũ để bảo toàn dữ liệu lịch sử.
- Có thể giữ các mẫu in cũ để phục vụ vận hành, nhưng khi liên thông phải chuyển về cấu trúc dữ liệu mới.
- Không xóa dữ liệu trường cũ nếu còn phục vụ báo cáo, in ấn hoặc truy vết.

## 5. Cấu trúc dữ liệu Phụ lục 01

Phụ lục 01 là cấu trúc chỉ tiêu dữ liệu khám sức khỏe định kỳ/sàng lọc. Các nhóm dữ liệu chính gồm:

### I. Thông tin hành chính

Các trường nền tảng:

- Họ tên `HO_TEN`.
- Ngày sinh `NGAY_SINH`.
- Số định danh/CCCD `SO_CCCD`.
- Tuần thai khi sinh `TUAN_THAI`.
- Sinh non `SINH_NON` với mã 0/1.
- Giới tính `GIOI_TINH`.
- Dân tộc `MA_DAN_TOC`.
- Nhóm máu `NHOM_MAU`.
- Địa chỉ hiện tại `DIA_CHI`.
- Mã tỉnh/xã cư trú `MATINH_CU_TRU`, `MAXA_CU_TRU`.
- Người đi cùng/người giám hộ và quan hệ.
- Điện thoại người đi cùng `DIEN_THOAI_NGUOI_DI_CUNG`.

Trẻ dưới 6 tuổi cần hỗ trợ giấy khai sinh khi chưa có CCCD; thông tin người giám hộ/người đi cùng phải được quản lý riêng, không chỉ lưu trong ghi chú.

### II. Tiền sử

- Bản thân có bệnh tiền sử `TSBT_MAC_BENH`.
- Mã bệnh tiền sử bản thân `TSBT_MA_BENH`.
- Gia đình có bệnh tiền sử `TSGD_MAC_BENH`.
- Mã bệnh tiền sử gia đình `TSGD_MA_BENH`.
- Tiền sử tiếp xúc người bệnh lao `TS_TIEP_XUC_LAO`.

Mã bệnh sử dụng ICD-10 hoặc mã triệu chứng/hội chứng theo danh mục Bộ Y tế. Nhiều mã được phân cách bằng dấu chấm phẩy `;`.

### III. Thông tin chung lần khám

- Mã lượt khám `MA_LK`.
- Mã cơ sở KCB `MA_CSKCB`, 5 ký tự.
- Mã cơ sở theo chuẩn GLN `MA_GTIN_CSKCB`, 13 ký tự.
- Đối tượng `DOI_TUONG`, có thể có nhiều mã phân cách bằng `;`.
- Nguồn chi trả `NGUON_CHI_TRA`.
- Loại hình khám chữa bệnh `MA_LOAI_KCB`.
- Ngày khám sức khỏe `NGAY_VAO`.

Danh mục `DOI_TUONG` và `NGUON_CHI_TRA` phải dùng đúng mã quy định, không lưu tự do theo tên hiển thị.

### IV-VI. Khám lâm sàng, chuyên khoa và cận lâm sàng

Phụ lục 01 bao phủ các nhóm khám:

- Nội khoa.
- Ngoại khoa.
- Sản phụ khoa.
- Mắt.
- Tai - Mũi - Họng.
- Răng - Hàm - Mặt.
- Da liễu.
- Cơ xương khớp/thần kinh và các chuyên khoa liên quan.
- Cận lâm sàng.

Mỗi chuyên khoa có thể gồm kết quả khám, phân loại kết quả và chữ ký điện tử của bác sĩ khám chuyên khoa. Đây là thay đổi quan trọng so với mô hình chỉ lưu một chữ ký kết luận tổng thể.

Cận lâm sàng cần lưu tối thiểu dịch vụ, tên chỉ số, giá trị, đơn vị đo, mô tả/kết luận và chữ ký bác sĩ cận lâm sàng nếu áp dụng.

### VII. Dấu hiệu sinh tồn

Các chỉ tiêu gồm nhiệt độ, mạch, nhịp thở và đánh giá tương ứng. Cần lưu cả giá trị đo và nhận định, không chỉ lưu một chuỗi mô tả.

### VIII-X. Dinh dưỡng, phát triển và tiêm chủng

Đối với trẻ em, Phụ lục 01 bổ sung/nhấn mạnh:

- Chiều dài/chiều cao và đánh giá theo tuổi/SD.
- Cân nặng và đánh giá theo tuổi/SD.
- Vòng đầu.
- Chu vi vòng cánh tay.
- Bình thường, phù dinh dưỡng, thiếu máu, còi xương, suy dinh dưỡng, thừa cân/béo phì.
- Phát triển tinh thần theo tuổi.
- Phát triển vận động theo tuổi.
- Nguy cơ tự kỷ đối với trẻ 16-30 tháng.
- Tiêm lao, viêm gan B sơ sinh và tiêm chủng theo tuổi.

### XI-XIII. Tư vấn, kết luận và ký số

Các nhóm kết luận gồm:

- Bình thường.
- Có nguy cơ mắc lao do tiền sử tiếp xúc.
- Có vấn đề sức khỏe.
- Ghi rõ vấn đề sức khỏe.
- Hẹn khám lần sau.
- Chuyển cơ sở khám chữa bệnh.
- Phân loại sức khỏe.
- Kết luận bệnh theo ICD-10/mã hội chứng.
- Tình trạng sức khỏe và bệnh tật nếu có.

Chữ ký tối thiểu trong cấu trúc dữ liệu gồm chữ ký người kết luận và chữ ký cơ sở khám bệnh, chữa bệnh. Ngoài ra có thể có chữ ký bác sĩ theo từng chuyên khoa/cận lâm sàng.

## 6. Cấu trúc gói tin và các XML thành phần

### 6.1. Envelope

Gói XML tổng thể có dạng khái quát:

```xml
<KHAMSUCKHOE>
  <THONGTINDONVI>
    <MACSKCB>...</MACSKCB>
  </THONGTINDONVI>
  <THONGTINHOSO>
    <NGAYLAP>...</NGAYLAP>
    <SOLUONGHOSO>...</SOLUONGHOSO>
    <DANHSACHHOSO>
      <HOSO>
        <FILEHOSO>
          <LOAIHOSO>XML1</LOAIHOSO>
          <NOIDUNGFILE>...</NOIDUNGFILE>
        </FILEHOSO>
      </HOSO>
    </DANHSACHHOSO>
    <CHUKYDONVI>...</CHUKYDONVI>
  </THONGTINHOSO>
</KHAMSUCKHOE>
```

### 6.2. XML nghiệp vụ khám sức khỏe

Trong ví dụ truyền tin của quyết định, các hồ sơ thành phần được gắn bằng `LOAIHOSO` như `XML1`, `XML2`, ... và nội dung có thể được thể hiện dưới dạng XML lồng hoặc JSON tùy API/mẫu tin.

Đối với module này, cần coi các nhóm sau là lõi của khám sức khỏe:

| Nhóm dữ liệu | Nội dung |
|---|---|
| XML hành chính | Người khám, định danh, người giám hộ, địa chỉ |
| XML lần khám | `MA_LK`, CSKCB, GLN, đối tượng, nguồn chi trả, ngày khám |
| XML tiền sử | Tiền sử bản thân, gia đình, lao |
| XML chuyên khoa | Kết quả, phân loại, chữ ký từng chuyên khoa |
| XML cận lâm sàng | Dịch vụ, chỉ số, giá trị, đơn vị, mô tả, kết luận |
| XML thể lực/sinh hiệu | Sinh hiệu, chiều cao, cân nặng, dinh dưỡng, BMI hoặc đánh giá theo tuổi |
| XML kết luận | Phân loại sức khỏe, bệnh, vấn đề sức khỏe, chữ ký |

Quyết định cũng chứa ví dụ các `XML13`, `XML14`, `XML15` cho các loại dữ liệu y tế khác. Không được đưa các XML này vào luồng KSK nếu hồ sơ không phát sinh nghiệp vụ tương ứng.

## 7. Ký số và checksum

### 7.1. Chữ ký dữ liệu

Thông điệp dữ liệu phải được ký số tổ chức trước khi gửi lên Trục dữ liệu Bộ Y tế. Phản hồi của hệ thống cũng có chữ ký để bên gửi xác thực.

Trong cấu trúc KSK cần phân biệt:

- Chữ ký bác sĩ/người kết luận `CKS_NGUOI_KET_LUAN`.
- Chữ ký cơ sở khám chữa bệnh `CKS_BENH_VIEN`.
- Chữ ký chuyên khoa nếu chỉ tiêu chuyên khoa yêu cầu.
- Chữ ký checksum của bản tin API.

### 7.2. Checksum RSASHA256

Theo Phụ lục 02, checksum được tạo từ `header` và `data`:

1. Chuẩn hóa JSON, loại bỏ khoảng trắng, xuống dòng và tab trước khi hash.
2. Tính SHA-256 cho `header` để tạo giá trị A.
3. Tính SHA-256 cho `data` để tạo giá trị B.
4. Ghép `A + "." + B`.
5. Ký chuỗi ghép bằng RSA-SHA256 với khóa riêng của bên gửi.
6. Viết hoa các giá trị hash theo quy định.

Không được dùng thứ tự key ngẫu nhiên hoặc serialize JSON khác nhau giữa lúc tạo hash và lúc gửi request.

## 8. API và môi trường kết nối

### 8.1. Kiến trúc

- RESTful API.
- HTTPS.
- JSON UTF-8.
- OAuth2/Bearer Token.

### 8.2. Môi trường được nêu trong Phụ lục 02

| Hệ thống | Production | Sandbox |
|---|---|---|
| Cổng dữ liệu sức khỏe BYT - Admin | `https://csdlksk.vn` | `https://sandbox.csdlksk.vn` |
| Trục dữ liệu BYT - Admin | `https://admin.emrhub.vn` | `https://admin-sandbox.emrhub.vn` |
| Trục dữ liệu BYT - API | `https://api.emrhub.vn` | `https://api-sandbox.emrhub.vn` |

### 8.3. API xác thực

```text
POST /api/auth/login
```

Request gồm `username` và `password`. Response thành công cấp `token`, `refresh_token`, `duration` và `role`.

Các lỗi cần xử lý riêng: 400 dữ liệu sai, 401 sai tài khoản/mật khẩu hoặc token, 403 không có quyền, 404 sai endpoint, 500 lỗi service, 504 timeout gateway.

### 8.4. API đẩy dữ liệu KSK

```text
POST /api/platform/data-sync/push
```

Header quan trọng:

- `Authorization: Bearer <token>`.
- `service-type: 100` cho dịch vụ đồng bộ dữ liệu vào Trục dữ liệu BYT.
- `Content-Type: application/json`.

Request gồm `header`, `data` và `signature`. `data.file_content` chứa file XML/JSON đã Base64 theo `data_type` (`xml/base64` hoặc `json/base64`).

Các mã phản hồi cần được lưu lại để truy vết, đặc biệt:

- `CM_SUCCESS`.
- `CM_INVALID_REQUEST`.
- `PS_DS_RSA_SIGNATURE_INVALID`.
- `PS_DS_RSA_SIGNATURE_MISSING`.
- `PS_DS_CA_SIGNATURE_INVALID`.
- `PS_DS_CA_SIGNATURE_MISSING`.
- `PS_DS_VERIFY_SUCCESS`/`PS_DS_VERIFY_FAIL`.
- `PS_DS_SAVE_SUCCESS`/`PS_DS_SAVE_FAIL`.

Không coi HTTP 200 là đồng bộ thành công nếu `res_code` trong payload thất bại.

## 9. Phương án đồng bộ dữ liệu từ BHXH

Phụ lục 03 quy định phương án đồng bộ dữ liệu từ BHXH Việt Nam lên Trục dữ liệu BYT:

```text
POST /api/platform/resource-sync/push
```

Luồng này dùng API và khóa riêng/công khai riêng của BHXH, không được trộn với luồng gửi hồ sơ KSK của cơ sở KCB. Module `health-check-sync` chỉ cần tích hợp nếu phạm vi dự án được mở rộng sang nhận/gửi dữ liệu BHXH.

## 10. Danh mục trường hiển thị trên VNeID - Phụ lục 04

Phụ lục 04 đánh dấu các trường được hiển thị trên VNeID cho ba cột:

- Trẻ dưới 6 tuổi.
- Người từ 6 đến dưới 18 tuổi.
- Người từ 18 tuổi trở lên.

Các nhóm thông tin hiển thị gồm hành chính, tiền sử, lần khám, chuyên khoa, cận lâm sàng, dấu hiệu sinh tồn, dinh dưỡng, phát triển trẻ em, tiêm chủng, tư vấn, kết luận và chữ ký.

Vì vậy frontend cần phân biệt:

- Trường bắt buộc để tạo hồ sơ.
- Trường bắt buộc để ký/gửi.
- Trường được hiển thị trên VNeID.
- Trường chỉ phục vụ nội bộ/in ấn/audit.

## 11. Quy trình nghiệp vụ Phụ lục 05

### Bước 1 - Đăng ký và lập kế hoạch

- Người dân chưa có Sổ sức khỏe điện tử đăng ký khởi tạo trên VNeID.
- Người đã có Sổ sức khỏe điện tử đăng ký nhu cầu khám định kỳ trên VNeID.
- Địa phương lập kế hoạch khám dựa trên đăng ký và nguồn thông tin liên quan.

### Bước 2 - Tiếp đón và thu thập hành chính

Cơ sở KCB xác thực qua CCCD, tài khoản định danh điện tử VNeID hoặc giấy khai sinh đối với trẻ chưa có CCCD. Cơ sở KCB chịu trách nhiệm xác thực thông tin.

### Bước 3 - Khám và thu thập kết quả

Thu thập thông tin theo nhóm tuổi, gồm tiền sử, khám lâm sàng, chuyên khoa, cận lâm sàng, sinh hiệu, dinh dưỡng, phát triển và tiêm chủng khi phù hợp.

### Bước 4 - Kiểm tra và ký số

Kiểm tra Đúng - Đủ - Sạch - Sống; chuẩn hóa danh mục; ký số dữ liệu; lưu người ký, thời điểm ký và trạng thái ký.

### Bước 5 - Gửi và theo dõi đồng bộ

Gửi dữ liệu qua API, nhận trạng thái xác thực/lưu trữ, cập nhật mã giao dịch, lưu response và cho phép xử lý lại lỗi theo mã lỗi.

### Bước 6 - Chia sẻ lên VNeID

Bộ Y tế chia sẻ dữ liệu với Cơ sở dữ liệu quốc gia về dân cư và dữ liệu được hiển thị theo danh mục Phụ lục 04.

## 12. Yêu cầu thay đổi đối với module hiện tại

### 12.1. Mô hình dữ liệu

Nên bổ sung/chuẩn hóa:

- `age_group`: `UNDER_6`, `AGE_6_TO_UNDER_18`, `ADULT_18_PLUS`.
- `form_type_legacy`: lưu mẫu cũ nếu cần tương thích.
- `ma_lk` duy nhất cho một lượt khám.
- `ma_cskcb` và `ma_gtin_cskcb` tách riêng.
- Thông tin người giám hộ/người đi cùng dạng trường có cấu trúc.
- Kết quả và chữ ký theo từng chuyên khoa.
- Trạng thái kiểm tra dữ liệu trước ký.
- Trạng thái chữ ký người kết luận, cơ sở KCB và checksum API.
- `msg_id`, `txn_id`, `ref_msg_id`, `res_code`, `res_msg`.
- Số lần retry, thời điểm retry cuối và response gốc.

### 12.2. Trạng thái hồ sơ đề xuất

```text
DRAFT
→ CLINICAL_IN_PROGRESS
→ WAITING_PARACLINICAL
→ READY_FOR_CONCLUSION
→ CONCLUDED
→ SIGNED_BY_DOCTOR
→ SIGNED_BY_FACILITY
→ QUEUED
→ SENT
→ PORTAL_VERIFIED
→ PORTAL_SAVED
```

Nhánh lỗi:

```text
VALIDATION_ERROR
SIGNATURE_ERROR
AUTH_ERROR
PORTAL_REJECTED
TIMEOUT_RETRYABLE
SEND_ERROR
```

Hồ sơ đã `PORTAL_SAVED` không được sửa trực tiếp. Nếu nghiệp vụ cho phép điều chỉnh, phải có quy trình bản ghi thay thế/hủy/đính chính theo quy định của cổng.

### 12.3. Validation tối thiểu

- Xác định đúng nhóm tuổi tại ngày khám.
- Kiểm tra CCCD/định danh và giấy khai sinh theo đối tượng.
- Trẻ dưới 6 tuổi phải có thông tin người giám hộ/người đi cùng theo trường bắt buộc tương ứng.
- `MA_CSKCB` đúng 5 ký tự; `MA_GTIN_CSKCB` đúng 13 ký tự.
- `MA_LK` không trùng.
- Mã bệnh và danh mục dùng chung hợp lệ.
- Số đo có đơn vị, phạm vi và nhận định phù hợp.
- Cận lâm sàng có mã dịch vụ, kết quả và trạng thái hoàn tất.
- Kết luận phân loại sức khỏe hợp lệ.
- Có đủ chữ ký trước khi cho phép gửi production.
- Checksum được tính trên đúng payload cuối cùng.

## 13. Những điểm cần sửa trong tài liệu cũ của module

1. Không mô tả QĐ 2062 như một quyết định mới hoàn toàn độc lập; đây là quyết định sửa đổi/bổ sung QĐ 1551.
2. Thay cách viết “17 mẫu chuyển thành 3 XML” bằng “17 mẫu nghiệp vụ cũ được quy hoạch thành 3 nhóm tuổi; dữ liệu liên thông vẫn gồm nhiều XML thành phần trong Envelope”.
3. Cập nhật các endpoint/môi trường theo Phụ lục 02, không hard-code một URL duy nhất.
4. Bổ sung Phụ lục 04 vào mapping để phân biệt trường gửi và trường hiển thị VNeID.
5. Bổ sung Phụ lục 05 vào workflow thực tế.
6. Tách luồng KSK khỏi luồng đồng bộ dữ liệu BHXH tại Phụ lục 03.
7. Không ghi trạng thái hoàn thành 100% nếu mới hoàn thành đặc tả mà chưa có bằng chứng kiểm thử sandbox, ký số, checksum và response cổng.

## 14. Quy tắc dùng tài liệu này cho các lần làm việc sau

Khi chỉnh sửa module, ưu tiên theo thứ tự nguồn:

1. PDF QĐ 2062 đã ký trong thư mục `docs`.
2. QĐ 1551 và các phụ lục gốc cho những nội dung QĐ 2062 không sửa.
3. Tài liệu này để chuyển hóa yêu cầu pháp lý thành yêu cầu phần mềm.
4. Các tài liệu cũ khác chỉ dùng tham khảo và phải đối chiếu lại nếu mâu thuẫn.

Mọi thay đổi code liên quan đến form, mapping, XML, ký số, API hoặc trạng thái đồng bộ cần ghi rõ đang đáp ứng mục nào của tài liệu này.

## 15. Tài liệu nguồn liên quan

- [Quyết định 2062/QĐ-BYT bản PDF](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/2026_7_03_QD%20sua%20doi%20QD%201551%20(Final).signed.pdf)
- [QĐ1551 technical specs](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/1551_technical_specs.md)
- [QD1551 sửa đổi tài liệu kỹ thuật](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/QD1551_SuaDoi_TaiLieuKyThuat.md)
- [Mapping hiện tại](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/mapping.md)
- [Workflow hiện tại](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/workflow.md)
- [Thiết kế API hiện tại](/D:/AI/VIMES_HIS/modules/health-check-sync/docs/api-design.md)
