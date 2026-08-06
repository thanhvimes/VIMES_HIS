# VIMES HIS Document Engine

## Mục tiêu

Document Engine tách biệt nhập liệu lâm sàng khỏi trình bày tài liệu. React và backend nghiệp vụ tiếp tục quản lý dữ liệu có cấu trúc; Carbone nhận JSON snapshot cùng DOCX template để tạo DOCX/PDF.

## Thành phần POC đã triển khai

- `DocumentRenderer`: abstraction không phụ thuộc nhà cung cấp.
- `CarboneRenderer`: gọi Carbone v5 qua HTTP, có timeout và hỗ trợ LibreOffice/OnlyOffice.
- `TemplateRegistry`: chỉ đọc template đã publish trong thư mục được cấu hình; không nhận đường dẫn từ client.
- `POST /api/v1/documents/render`: sinh DOCX hoặc PDF, yêu cầu staff JWT theo middleware mặc định.
- `GET /api/v1/documents/templates`: liệt kê các phiên bản template đã publish.
- Template POC `OUTPATIENT_EXAM@1` và JSON mẫu.
- Bộ khung 5 mẫu: phiếu khám, đơn thuốc, kết quả xét nghiệm, giấy ra viện và tờ điều trị.
- Cache DOCX trong RAM, gộp request trùng đang chạy, concurrency limiter, hàng đợi hữu hạn và metrics.

## Cấu trúc template

```text
backend/templates/documents/
  OUTPATIENT_EXAM/
    v1/
      manifest.json
      sample-data.json
      template.docx
      template-source.html
```

Mỗi phiên bản là bất biến sau khi publish. Khi chỉnh mẫu, sao chép sang `v2`, tăng `version` trong manifest và chỉ publish sau khi kiểm thử.

## Chạy Carbone On-Premise

Khuyến nghị khóa một image version đã được POC thay vì dùng tag `latest` trong production. Ví dụ cho môi trường thử nghiệm:

```powershell
docker run --name vimes-carbone-poc -p 4000:4000 carbone/carbone-ee:full-5.9.0
```

Thiết lập backend:

```env
CARBONE_URL=http://127.0.0.1:4000
CARBONE_TIMEOUT_MS=30000
CARBONE_CONVERTER=L
DOCUMENT_TEMPLATE_DIR=./templates/documents
```

Không công khai cổng Carbone ra Internet. Trong production, chỉ backend VIMES được phép truy cập Carbone qua mạng nội bộ.

## Gọi API POC

```http
POST /api/v1/documents/render
Authorization: Bearer <staff-jwt>
Content-Type: application/json

{
  "templateCode": "OUTPATIENT_EXAM",
  "templateVersion": 1,
  "outputFormat": "pdf",
  "data": { ... nội dung trong sample-data.json ... }
}
```

## Lộ trình tiếp theo

1. POC 5 mẫu thật và lập bộ visual regression test.
2. Thêm migration quản lý metadata, Draft/Approved/Published/Retired và audit log.
3. Tạo `ReportDataContract` theo từng loại tài liệu và mapper từ dữ liệu HIS.
4. Lưu data snapshot, template SHA-256 và PDF SHA-256 cho mỗi lần phát hành.
5. Thêm job queue, retry, idempotency key và giới hạn đồng thời khi render.
6. Nối PDF đầu ra vào quy trình HSM/USB Token; không chỉnh sửa sau khi ký.
7. Lưu tài liệu đã ký trong object storage/document repository có chính sách retention và backup.

## Capacity cho bệnh viện 5.000 lượt/ngày

5.000 lượt/ngày không phải là 5.000 lần render: nếu mỗi lượt tạo 4 tài liệu thì tải danh nghĩa là 20.000 tài liệu/ngày. Average thấp nhưng giờ cao điểm và thao tác in hàng loạt mới quyết định sizing. Thiết kế phải đo ở các kịch bản 10, 20 và 40 request/giây.

Cấu hình khởi điểm cho mỗi backend instance là 8 render đồng thời và tối đa 200 request chờ. Khi hàng đợi đầy hoặc chờ quá 15 giây, API trả 503 cùng `Retry-After` thay vì tiếp tục nhận tải đến khi hết RAM.

Theo dõi runtime tại `GET /api/v1/documents/metrics`. Các chỉ số quan trọng gồm `active`, `queued`, `rejected`, `averageDurationMs` và latency buckets.

Chạy benchmark trên staging:

```powershell
$env:BENCHMARK_TOKEN='<staff-jwt-staging>'
$env:BENCHMARK_REQUESTS='1000'
$env:BENCHMARK_CONCURRENCY='20'
npm run benchmark:documents
```

Không dùng dữ liệu bệnh nhân thật trong benchmark. Mục tiêu ban đầu: không lỗi ở 20 request/giây, p95 dưới 3 giây với mẫu 1-3 trang, queue không tăng liên tục và RAM ổn định sau tối thiểu 30 phút soak test.

### Topology production khởi điểm

Để vừa chịu tải vừa có high availability, không chạy Carbone chung process với VIMES API. Khởi điểm nên có 2 VIMES backend instance và 2 Carbone instance, mỗi Carbone 2-4 vCPU/3-4 GB RAM, đặt sau internal load balancer. Template dùng shared read-only storage hoặc được đóng gói cùng immutable release. Nếu một Carbone lỗi, load balancer loại instance đó mà không làm ngừng HIS.

Không suy sizing chỉ từ 5.000 lượt/ngày. Trên staging tương đương production, chạy ba bài test: spike 5 phút, sustained load 30 phút và soak 4 giờ. Chỉ tăng `DOCUMENT_RENDER_CONCURRENCY` khi CPU/RAM converter còn dư và p95 thực sự giảm; tăng quá cao thường làm LibreOffice tranh chấp tài nguyên và khiến latency xấu hơn.

## Tiêu chí production

- Font tiếng Việt được đóng gói trong image và không thay đổi ngoài quy trình release.
- Carbone/converter được pin version.
- Template không truy cập trực tiếp database.
- Mọi request dùng data contract đã validation ở backend.
- Không ghi dữ liệu bệnh án hoặc token vào log.
- PDF đã ký là bất biến; sửa hồ sơ tạo revision mới.
- Có test tải, test bảng nhiều trang, QR/barcode, ảnh, chữ ký và rollback template.
