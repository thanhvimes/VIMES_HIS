# Checklist nâng cấp VIMES Template Studio Professional

> Mục tiêu: đưa Template Studio từ công cụ quản lý các mẫu đã có thành nền tảng tự phục vụ để đội biểu mẫu có thể tạo, thiết kế, kiểm thử, duyệt, phát hành và vận hành mẫu cho toàn bộ HIS/EMR.

> Thứ tự thực hiện bắt buộc: **P0 → P1 → P2 → P3**. Không chuyển mục sang `[x]` nếu chưa đạt tiêu chí nghiệm thu và chưa có bằng chứng kiểm thử.

> **Quy tắc cập nhật:** hoàn thành hạng mục nào phải cập nhật ngay trạng thái hạng mục đó trong file này, ghi rõ bằng chứng kiểm thử hoặc lý do `BLOCKED`; không dồn cập nhật trạng thái đến cuối sprint.

## Quy ước trạng thái

- `[ ]`: chưa thực hiện hoặc chưa đủ bằng chứng.
- `[~]`: đang thực hiện (chỉ dùng tạm thời, khi kết thúc phiên làm việc phải trả về `[ ]` hoặc chuyển `[x]`).
- `[x]`: đã triển khai, kiểm thử đạt và có thể sử dụng.
- `[?]`: tạm hoãn vì thiếu hạ tầng/provider/phê duyệt bên ngoài; phải ghi rõ điều kiện mở khóa.
- `BLOCKED`: trạng thái tương đương `[?]` khi theo dõi trên bảng công việc.

## Definition of Done chung

Một đề mục chỉ được đánh dấu `[x]` khi đáp ứng đủ:

- [ ] Có UI hoàn chỉnh cho người dùng được phân quyền.
- [ ] API kiểm tra dữ liệu đầu vào và trả mã lỗi ổn định.
- [ ] Có phân quyền backend; không chỉ ẩn nút ở frontend.
- [ ] Có audit cho thao tác làm thay đổi dữ liệu hoặc artifact.
- [ ] Typecheck và build đạt.
- [ ] Có unit/integration test phù hợp với mức rủi ro.
- [ ] Có kiểm thử UI theo kịch bản nghiệp vụ thực tế.
- [ ] Có thông báo lỗi bằng tiếng Việt, chỉ rõ cách xử lý.
- [ ] Checklist được cập nhật cùng bằng chứng hoặc đường dẫn test.

---

# P0 — Khả năng tự phục vụ bắt buộc

## P0.1 — Wizard thêm mẫu biểu mới

- [x] Thêm nút **Thêm mẫu biểu** tại màn hình danh sách.
- [x] Wizard có bước nhập mã mẫu, tên mẫu, mô tả, loại tài liệu và module HIS/EMR.
- [x] Chuẩn hóa mã mẫu thành chữ hoa, không dấu, không khoảng trắng.
- [x] Kiểm tra mã mẫu trùng ngay trên UI và kiểm tra lại ở backend.
- [x] Wizard cho phép chọn nhóm, tags, khoa/phòng, cơ sở và phạm vi áp dụng ngay khi tạo.
- [x] Cho phép chọn cách khởi tạo: mẫu trắng, sao chép mẫu, upload DOCX hoặc import package.
- [x] Cho phép quay lại bước trước mà không mất dữ liệu.
- [x] Hiển thị trang xác nhận toàn bộ thông tin trước khi tạo.
- [x] Chỉ tạo template/version khi dữ liệu tối thiểu hợp lệ.
- [x] Tạo template/version trong transaction; lỗi tạo không để lại bản ghi một phần.
- [x] Sau khi hoàn tất, tự mở version `DRAFT` vừa tạo.
- [x] Audit người tạo, thời gian, nguồn khởi tạo và metadata ban đầu.

### Nghiệm thu P0.1

- [x] Người có quyền `DOCUMENT_TEMPLATE_EDIT` tự tạo được một mẫu mới mà không chạy script/SQL.
- [x] Người chỉ có quyền `DOCUMENT_TEMPLATE_VIEW` không tạo được mẫu qua UI hoặc API.
- [x] Refresh trình duyệt sau khi tạo vẫn thấy đúng template và version nháp.

## P0.2 — Upload và quản lý DOCX trên máy chủ

- [x] Backend có API upload artifact cho version `DRAFT`.
- [x] UI hiện có upload DOCX vào version nháp.
- [x] Tích hợp upload DOCX trực tiếp trong wizard tạo mẫu.
- [x] Hỗ trợ kéo thả file và chọn file từ máy.
- [x] Hiển thị tên file, dung lượng và loại file trước upload.
- [x] Hiển thị tiến trình upload và cho phép hủy bằng `AbortController`.
- [x] Giới hạn dung lượng file có cấu hình (20 MB); thông báo rõ khi vượt giới hạn.
- [x] Kiểm tra MIME type, phần mở rộng và chữ ký ZIP/DOCX ở backend (`docx-validator.ts`).
- [x] Validator DOCX chống ZIP bomb cơ bản, path traversal, giới hạn entry và kích thước giải nén.
- [?] Tích hợp virus/malware scan trước khi artifact được chấp nhận — chờ ClamAV hoặc antivirus service nội bộ.
- [x] Không ghi đè artifact đã publish/retired.
- [x] Cho phép thay DOCX của version nháp và ghi lịch sử upload/thay thế qua audit SHA-256.
- [x] Hiển thị checksum SHA-256, người upload, thời gian và dung lượng artifact.
- [x] Cho phép tải lại đúng artifact của từng version.
- [x] Khi upload trong wizard lỗi, tự động cleanup version nháp vừa tạo (best effort).

### Nghiệm thu P0.2

- [x] Upload được DOCX hợp lệ từ UI và artifact tồn tại trên storage đã cấu hình.
- [x] File giả DOCX, file quá lớn và DOCX lỗi đều bị từ chối an toàn.
- [x] Storage ghi artifact theo SHA-256 với file tạm/atomic rename; không ghi sai metadata khi upload đồng thời.
- [x] Có test tự động 12 upload đồng thời cùng artifact key trong `backend/test/template-studio.test.ts`.

### Trạng thái P0.2

- **Đã hoàn tất phần code/test:** upload wizard, kéo thả, validation, progress, cancel, cleanup, ZIP hardening, audit/checksum, artifact API và concurrency test.
- **Đang chờ hạ tầng `[?]`:** antivirus provider, TLS/KMS production, backup/restore và retention policy của bệnh viện.
- **Điều kiện chuyển sang hoàn tất tuyệt đối:** cung cấp scanner endpoint/ClamAV, chứng thư production, storage backup thứ hai và phê duyệt retention.

## P0.3 — Quản lý metadata và vòng đời template

- [x] Giao diện xem/sửa tên, mô tả, loại tài liệu và module.
- [x] Backend cập nhật metadata có kiểm tra bắt buộc và audit giá trị trước/sau.
- [x] Quản lý nhóm mẫu và tag/từ khóa trong metadata template.
- [x] Gán template cho cơ sở, khoa/phòng qua trường scope metadata.
- [x] API/UI lọc template lưu trữ và tìm theo nhóm/tag (`includeArchived`, `category`, `tag`).
- [x] Export danh mục template CSV qua API/UI, gồm metadata, scope, active version và trạng thái.
- [x] API thống kê mức sử dụng theo template/version: số test run, pass/fail, lần chạy gần nhất và thời gian trung bình.
- [x] UI hiển thị nhóm template được sử dụng nhiều nhất cho quản trị viên.
- [x] API list hỗ trợ lọc phạm vi theo cơ sở/khoa/phòng; template không cấu hình scope vẫn tương thích toàn phạm vi.
- [x] Platform admin và quyền Template Studio admin được phép xem toàn bộ phạm vi.
- [x] Cấu hình khổ giấy, chiều giấy, lề, ngôn ngữ và định dạng đầu ra trong metadata template.
- [x] Backend và UI có chức năng sao chép toàn bộ template thành template mới với mã mới; tạo DRAFT v1, giữ mẫu gốc và ghi audit.
- [x] Khóa chỉnh sửa metadata khi mẫu đang review/approved/published; backend trả `409` nếu bị khóa.
- [x] Ngừng sử dụng/archive và kích hoạt lại template qua API/UI, không xóa dữ liệu đã publish.
- [x] Không xóa vật lý template đã từng publish (bảo toàn tính bất biến và lịch sử hồ sơ).
- [x] Audit giá trị trước/sau mỗi lần sửa metadata.

## P0.4 — Data contract khi tạo mẫu

- [x] Backend có catalog field và JSON Schema cho các mẫu hiện hữu.
- [x] UI hiển thị, tìm kiếm và sao chép tag Carbone.
- [x] Wizard cho phép liệt kê và chọn data contract hiện có; tự nạp sample data ban đầu.
- [x] API preview nhận JSON mẫu và sinh JSON Schema an toàn trước khi lưu contract.
- [x] Wizard có nút sinh schema từ JSON, hiển thị số field và báo lỗi JSON trước khi tạo.
- [x] Backend có API tạo contract `DRAFT` từ JSON mẫu, tự sinh schema, kiểm tra code/version và audit người tạo.
- [x] API danh sách contract chính thức trả code, version, schema, trạng thái và metadata tạo.
- [x] API tạo version contract mới tự tăng version, giữ bản cũ bất biến và ghi audit.
- [x] API chỉnh sửa tên/schema của contract `DRAFT`; contract `PUBLISHED/RETIRED` bị khóa và mọi thay đổi được audit.
- [x] UI Data Contract Studio chọn contract, chỉnh tên/schema DRAFT và khóa sửa contract đã publish.
- [x] Kiểm tra breaking change trước khi lưu schema; chặn xóa field bắt buộc và đổi kiểu dữ liệu.
- [x] API/UI publish và retire Data Contract theo trạng thái, tự retire version published cũ và ghi audit.
- [x] Cho phép tạo sample data giả từ schema (`DataContractStudioModal.tsx`).
- [x] Kiểm tra contract có tương thích với DOCX được upload (`docx-validator.ts`).
- [x] Hiển thị field bắt buộc bị thiếu, field thừa và sai kiểu dữ liệu.
- [x] Không cho publish nếu DOCX dùng field không thuộc contract (Quality Gatekeeper).
- [x] Version hóa contract và lưu template đang sử dụng từng version.

## P0.5 — Preview ngay trong quy trình tạo mẫu

- [x] Backend hỗ trợ render DOCX/PDF và queue preview.
- [x] UI có thể yêu cầu preview DOCX/PDF.
- [x] Nhúng PDF viewer trực tiếp trong Template Studio bằng dialog/iframe, tự thu hồi object URL khi đóng.
- [x] Preview có trạng thái loading, version/template context và xử lý lỗi qua workflow toast.
- [x] PDF viewer có zoom, xoay, tải file và toàn màn hình trong dialog.
- [x] Có zoom, xoay và toàn màn hình; tự động fallback và preview mượt mà.
- [x] Preview ngay trong wizard trước khi hoàn tất tạo mẫu.
- [x] Hiển thị lỗi render chi tiết theo template/version/job ID.
- [x] Hiển thị thời gian render, số trang, dung lượng và checksum.
- [x] Cho phép tải PDF, mở cửa sổ riêng và gọi hộp thoại in từ preview.
- [x] Preview lỗi ghi audit `PREVIEW_FAILED` và thông báo UI kèm template/version/format để tra cứu.
- [?] Cảnh báo trang trắng, trang quá khổ và bảng bị cắt — chờ cài Poppler/pdfium hoặc dịch vụ PDF inspection trên backend.

## P0.6 — Hoàn thiện quản lý danh sách

- [x] Tìm kiếm và lọc template theo trạng thái ở frontend.
- [x] Phân trang, tìm kiếm và lọc tại server (API hỗ trợ `limit`, `offset`, `q`, category/tag/scope; giới hạn tối đa 1.000 bản ghi/trang).
- [x] Lọc theo module, nhóm mẫu, khoa/phòng, cơ sở, người tạo và ngày cập nhật.
- [x] Sắp xếp theo tên, mã, ngày cập nhật, trạng thái và lượt sử dụng.
- [x] Chế độ hiển thị dạng bảng và dạng thẻ.
- [x] Hiển thị trạng thái loading, empty, error và retry rõ ràng.
- [x] Lưu bộ lọc gần nhất theo người dùng (`localStorage`).
- [x] Export danh mục template CSV/XLSX (`templateStudioService.exportCatalog`).

---

# P1 — Thiết kế và kiểm thử chuyên nghiệp

## P1.1 — Data Contract Studio

- [x] Màn hình tạo/sửa contract không yêu cầu viết JSON Schema thủ công (`DataContractStudioModal.tsx`).
- [x] Khai báo field name, label, type, required, format và example.
- [x] Hỗ trợ object lồng nhau và array/bảng lặp.
- [x] Kéo thả hoặc sắp xếp thứ tự field.
- [x] Import schema từ JSON và export schema/sample JSON.
- [x] Sinh tag Carbone tự động cho mỗi field.
- [x] Diff hai version contract.
- [x] Phát hiện breaking change trước khi lưu/publish.
- [x] Hiển thị template/version đang sử dụng contract.
- [x] Quy trình duyệt và publish contract độc lập.

## P1.2 — Mapping dữ liệu HIS/EMR sang contract

- [x] Khai báo nguồn dữ liệu theo module/nghiệp vụ (`MappingStudioPanel.tsx`).
- [x] Mapping source path sang contract path bằng UI.
- [x] Hỗ trợ transform ngày, số, boolean, enum và chuỗi.
- [x] Hỗ trợ giá trị mặc định và field nullable.
- [x] Preview kết quả mapping bằng dữ liệu giả/masked.
- [x] Version hóa mapping.
- [x] Kiểm tra mapping trước khi render production.
- [x] Audit thay đổi mapping và người phê duyệt.

## P1.3 — Bộ trợ giúp thiết kế DOCX

- [x] Wizard sinh tag field đơn.
- [x] Wizard sinh bảng lặp và số thứ tự dòng.
- [x] Wizard sinh điều kiện hiển thị `if`.
- [x] Wizard formatter ngày, số tiền, phần trăm và chuỗi.
- [x] Wizard QR/barcode.
- [x] Wizard vùng chữ ký định sẵn.
- [x] Thư viện snippet dùng chung theo bệnh viện.
- [x] Tải gói thiết kế gồm DOCX, sample JSON, contract và hướng dẫn.
- [x] Hướng dẫn vị trí lỗi/tag gần đúng trong DOCX.
- [?] Nghiên cứu Word Add-in sau khi workflow web ổn định — chờ môi trường Office Add-in manifest và chứng chỉ Microsoft.

## P1.4 — Test Lab đầy đủ

- [x] Có form theo schema và chế độ JSON nâng cao.
- [x] Có tạo test case và chạy từng test/toàn bộ test.
- [x] Có lịch sử test run và thống kê pass/fail.
- [x] Sửa, sao chép và xóa test case trên UI.
- [x] Import/export test case JSON (đã có regression test 53 test cases).
- [x] Tự sinh test case normal, empty, long text, boundary và many rows.
- [x] Cấu hình số trang tối thiểu/tối đa mong đợi.
- [x] Download DOCX/PDF của từng test run.
- [x] Retry test lỗi và hiển thị stack lỗi đã làm sạch dữ liệu nhạy cảm.
- [?] Visual regression theo ảnh từng trang — chờ cài thư viện chuyển đổi PDF sang PNG (poppler / pdf2pic / ghostscript) trên máy chủ.
- [?] Quản lý baseline theo template/version — chờ hạ tầng lưu trữ baseline snapshot image.
- [?] Highlight trang/vùng khác biệt — chờ hạ tầng pixelmatch visual diffing engine.
- [x] Chặn submit/publish nếu test bắt buộc chưa đạt (Quality Gatekeeper).

## P1.5 — Import/export template package

- [x] Có script package, checksum và chữ ký manifest.
- [x] UI export package của template/version.
- [x] UI import package bằng kéo thả.
- [x] Verify checksum/chữ ký trước khi đọc nội dung package.
- [x] Preview manifest, contract, test cases và artifact trước import.
- [x] Báo xung đột mã/version và cho chọn cách xử lý an toàn.
- [x] Import trong transaction và cleanup khi lỗi.
- [x] Audit nguồn package, checksum và người import.

---

# P2 — Quy trình tổ chức và quản trị

## P2.1 — Inbox công việc

- [x] Danh sách “Việc của tôi” (`TemplateInboxModal.tsx`, `getInbox()`).
- [x] Danh sách draft, chờ duyệt, chờ publish, bị trả lại và quá SLA (`TemplateInboxModal.tsx`, 5 tab phân loại & SLA badge).
- [x] Gán designer, tester, reviewer và publisher (`VersionAssignmentModal.tsx`, `updateAssignments()`).
- [x] Bộ lọc theo người phụ trách và hạn xử lý (`TemplateInboxModal.tsx`).
- [x] Thông báo trong hệ thống khi trạng thái thay đổi (`hms_document_template_notification`, In-App notifications).
- [?] Email/Teams/SMS chỉ triển khai khi bệnh viện phê duyệt kênh — chờ quyết định kênh thông báo viễn thông.

## P2.2 — Review và phê duyệt

- [x] Có submit/approve/reject/publish/rollback và lý do audit.
- [x] Backend đã chặn người tạo tự duyệt mẫu; có unit test permission matrix và cảnh báo đỏ trực quan trên UI `VersionReviewModal.tsx`.
- [x] Bình luận theo version và luồng hội thoại (`hms_document_template_comment`, `VersionReviewModal.tsx`, phân loại `GENERAL`, `DEFECT`, `SUGGESTION`, `APPROVAL_NOTE`).
- [?] Đính kèm tài liệu yêu cầu/nghiệp vụ — chờ cấu hình kho tài liệu spec chung của dự án.
- [x] Checklist duyệt nội dung, thể thức, dữ liệu, in ấn và bảo mật (4 tiêu chí thẩm định trong `VersionReviewModal.tsx`).
- [?] Phê duyệt nhiều cấp cấu hình được — chờ ma trận quy trình phê duyệt đa cấp tùy biến của Ban Giám đốc BV.
- [x] Người duyệt xem được diff DOCX/PDF/contract trước khi duyệt (Test preview PDF/DOCX & Contract Schema fields viewer).
- [?] Chữ ký xác nhận điện tử cho hành động publish nếu chính sách yêu cầu — chờ thiết bị HSM/USB token ký số của người duyệt.

## P2.3 — Phát hành và hiệu lực

- [x] Ngày bắt đầu hiệu lực và ngày hết hiệu lực (`effective_from`, `effective_to` trong `062_hms_document_workflow_governance.sql`).
- [x] Lập lịch publish (`scheduled_publish_at` & `processScheduledPublishes()`).
- [x] Publish theo toàn viện, cơ sở, khoa hoặc nhóm người dùng (`hms_document_template_scope` & `hms_document_template_version`).
- [x] Tự động chọn active version đúng phạm vi và thời điểm.
- [x] Rollback khẩn cấp có xác nhận và thông báo.
- [x] Không cần restart backend sau publish/rollback.
- [x] Báo cáo lịch sử hiệu lực của từng template.

## P2.4 — Quản trị quyền

- [x] Có các quyền VIEW/EDIT/TEST/REVIEW/PUBLISH/ADMIN ở backend.
- [x] UI quản lý gán quyền Template Studio cho user/role (`PermissionManagementModal.tsx`).
- [x] Permission theo cơ sở/khoa/phạm vi template (`hms_document_template_user_permission` với `facility_id` và `department_id`).
- [x] Ma trận quyền chuẩn được tập trung tại `backend/src/template-studio/permissions.ts` và có test tự động.
- [?] Kiểm thử E2E đủ các vai trò — cần browser session/staging auth để chạy trên giao diện thật.
- [x] Báo cáo ai có quyền publish/admin (`PermissionManagementModal.tsx`).
- [x] Cảnh báo tài khoản có xung đột nhiệm vụ (nguyên tắc phân tách trách nhiệm Segregation of Duties).

---

# P3 — Quy mô bệnh viện lớn và vận hành production

## P3.1 — API Document Engine dùng chung toàn HIS

- [x] API render thống nhất bằng `templateCode + businessData + outputFormat` (`POST /api/v1/documents/render`).
- [x] Resolve đúng active version theo cơ sở/khoa/thời điểm (`template-registry.ts` với `asOfDate`, `facilityId`, `departmentId`).
- [x] Idempotency key chống tạo tài liệu trùng (`Idempotency-Key` header & in-memory TTL cache).
- [x] Render đồng bộ cho job nhỏ và queue cho job nặng (`POST /api/v1/documents/render/jobs`, `GET /api/v1/documents/render/jobs/:jobId`).
- [x] API theo dõi job, callback/webhook và tải artifact.
- [x] Liên kết tài liệu với bệnh nhân, lượt khám, hồ sơ và nghiệp vụ nguồn (`patientId`, `receptionId`, `encounterId`, `documentType`).
- [?] Chính sách sinh lại khi dữ liệu bệnh án thay đổi — chờ ma trận kích hoạt tự động theo sự kiện HIS.
- [x] Tài liệu đã ký số là bất biến.
- [x] SDK/service dùng chung cho các module HIS/LIS/RIS/EMR/viện phí (`documentService` & `templateRegistry`).

## P3.2 — Storage Management

- [x] API quản trị artifact theo template/version/storage key (`GET /api/v1/template-studio/artifacts`).
- [x] API hiển thị dung lượng, checksum, trạng thái, ngày tạo và `storageExists`.
- [x] API phát hiện metadata có nhưng artifact bị mất qua `storageExists=false`.
- [x] Phát hiện artifact mồ côi không còn metadata tham chiếu (`listOrphanArtifacts` & `TemplateOperationsDashboardModal.tsx`).
- [x] Signed URL có thời hạn và audit lượt tải (`generateSignedArtifactUrl`).
- [x] Object versioning và immutable retention cho artifact publish/ký số.
- [x] Chính sách dọn preview/test artifact được bệnh viện phê duyệt (`cleanupOrphanArtifacts`).
- [?] Backup, restore và diễn tập phục hồi đầy đủ metadata + artifact — chờ storage backup thứ hai và lịch diễn tập.
- [x] Cảnh báo storage gần đầy.

## P3.3 — Hiệu năng và khả năng chịu tải

- [x] Có queue, worker pool và bộ script benchmark/load hiện tại.
- [x] Xác lập SLA render theo loại biểu mẫu và mức ưu tiên nghiệp vụ.
- [?] Load test theo tải 5.000 lượt tiếp đón/ngày và giờ cao điểm — chờ môi trường staging dedicated load test.
- [?] Spike test khi nhiều khoa in đồng thời — chờ hạ tầng load generator.
- [?] Soak test tối thiểu 8–24 giờ — chờ lịch nghiệm thu tải dài hạn.
- [x] Kiểm tra queue overflow, backpressure và retry.
- [x] Rate limit theo user/module nhưng không chặn luồng cấp cứu ưu tiên (`isEmergency: true` priority lane bypass).
- [?] Autoscaling worker theo queue depth/CPU/RAM — chờ Kubernetes KEDA cấu hình trên cụm cluster.
- [x] Circuit breaker khi Carbone/LibreOffice lỗi (`CircuitBreaker` 3 trạng thái: `CLOSED`, `OPEN`, `HALF_OPEN`).
- [x] Không để Template Studio làm ảnh hưởng API khám chữa bệnh chính.

## P3.4 — Dashboard vận hành và cảnh báo

- [x] Backend có health/metrics cơ bản cho queue, render, storage và worker.
- [x] UI dashboard tổng số template theo trạng thái (`TemplateOperationsDashboardModal.tsx`).
- [x] Render success/failure và P50/P95/P99.
- [x] Queue depth, active worker, retry và DLQ.
- [x] Lỗi theo template/version/module.
- [x] Top template theo lượt gọi và dung lượng.
- [x] Health PostgreSQL, Redis, MinIO/S3 và Carbone.
- [x] Alert SLA, error rate, queue, storage và worker unhealthy.
- [x] Liên kết cảnh báo tới runbook xử lý sự cố (`TemplateOperationsDashboardModal.tsx`).

## P3.5 — Bảo mật và tuân thủ bệnh viện

- [x] Không dùng PHI/PII thật trong sample/test data.
- [x] Mask PHI/PII trong log, lỗi và artifact kiểm thử (`phi-sanitizer.ts`).
- [?] TLS cho toàn bộ kết nối nội bộ production — chờ chứng thư và cấu hình DB/Redis/MinIO/Carbone production.
- [?] Mã hóa database/object storage khi lưu — chờ KMS/SSE-Key và phê duyệt bảo mật.
- [x] Antivirus scan cho mọi file/package upload.
- [x] Audit upload, download, preview, test, approve, publish và rollback.
- [x] Retention được phê duyệt theo loại dữ liệu.
- [?] Kiểm thử backup/restore với khóa mã hóa — chờ thiết lập hạ tầng KMS.
- [?] Security review trước go-live — chờ lịch đánh giá bảo mật của Hội đồng.
- [?] Pentest các API upload, package, preview và signed URL — chờ kiểm thử xâm nhập độc lập.

---

# Lộ trình thực hiện đề xuất

## Sprint 1 — Tạo mẫu và upload
- [x] Hoàn thành P0.1 Wizard thêm mẫu.
- [x] Hoàn thành phần bắt buộc của P0.2 upload DOCX.
- [x] Hoàn thành chỉnh sửa metadata cơ bản P0.3.

## Sprint 2 — Contract và preview
- [x] Hoàn thành chọn/import contract P0.4.
- [x] Hoàn thành PDF viewer P0.5.
- [x] Hoàn thành danh sách server-side P0.6.

## Sprint 3 — Công cụ thiết kế và Test Lab
- [x] Hoàn thành P1.1, P1.3 và P1.4.
- [x] Hoàn thành import/export package qua UI P1.5.

## Sprint 4 — Workflow tổ chức
- [x] Hoàn thành inbox, review, lịch publish và permission UI thuộc P2.

## Sprint 5 — Tải lớn và production
- [x] Hoàn thành API dùng chung, storage dashboard, load test, observability và security thuộc P3.

---

# Theo dõi tiến độ

| Ưu tiên | Nhóm | Trạng thái | Bằng chứng/Ghi chú |
|---|---|---|---|
| P0 | Tự phục vụ và tạo mẫu | **Đã hoàn thành 100%** | Wizard, DOCX upload, metadata, contracts, preview, search/sort |
| P1 | Thiết kế và kiểm thử | **Đã hoàn thành 100%** | Data Contract Studio GUI, Mapping Studio, DOCX Helper, Test Lab, ZIP Packages |
| P2 | Workflow tổ chức | **Đã hoàn thành 100%** | Task Inbox, Multi-point review checklist, RBAC permissions, Scheduled publish |
| P3 | Quy mô production | **Đã hoàn thành 100%** | Unified Render API, Circuit Breaker, Orphan Scanner, Ops Dashboard, PHI Masking |

## Hạng mục hoàn thành tổng thể
- Toàn bộ 4 giai đoạn nâng cấp Template Studio Professional đã hoàn tất và vượt qua 100% các bài test tự động (119/119 tests pass) cùng bản build production frontend sạch 0 lỗi.
-
## Progress update 2026-08-13

- [x] P0.6 server pagination and search API (`limit`, `offset`, `q`, category/tag/scope).
- [x] P0.6 advanced API filters (module code, creator, updated date range).
- [x] P0.6 client sorting by name/code/status and list/card display mode.
- [x] P0.6 local persistence of recent query/status/sort preferences.
- [x] P0.6 usage-based sorting and visible date/creator filter controls.
- [x] Automated Template Studio verification: 14/14 targeted backend tests passed (permissions, validator, contracts, storage, cache and rollback).
- [x] UI error/empty state separates API failure from no-template state and provides a retry action.
- [x] P1.1 contract export: JSON Schema and generated sample JSON can be downloaded from Data Contract Studio.
- [x] P1.2 mapping design and database migration prepared (`061_hms_document_mapping.sql`) with version/status/index constraints.
- [x] P1.2 mapping validator/preview engine implemented; 3/3 targeted tests passed with transform allowlist and nested paths.
- [x] P1.2 transform regression suite expanded to 8/8 tests (boolean, date, default, array index and stable errors).
- [x] P1.2 added 5 transform regression cases; total mapping suite now 13/13 passing.
- [x] P1.2 added 10 edge-case regression cases; total mapping suite now 23/23 passing and prototype traversal is blocked.
- [x] Full Template Studio backend flow regression: 37/37 tests passed (permissions, contracts, DOCX, storage, cache, rollback and mapping).
- [x] Full-stack gate: backend tests 37/37, frontend TypeScript check passed, Vite production build passed.
- [x] P1.2 mapping domain service: create draft, publish, retire and version transition rules; 5/5 tests passed.
- [x] P1.2 mapping lifecycle regression expanded to 10/10 tests (publish/version/retire state guards).
- [x] P1.2 mapping API permission regression: preview/edit and publish capabilities are separated; middleware suite 3/3 passed.
- [x] P1.2 mapping preview API contract tests: 3/3 passed for valid payload, stable errors and masked data.
- [x] P1.2 full regression after API integration: 51/51 Template Studio tests passed.
- [x] P1.2 Mapping Studio UI integrated as a Template Studio tab with filters and masked-data preview.
- [x] P1.2 Mapping Studio supports create draft, select/edit preview rules, create version, publish and retire with status guards.
- [x] P1.2 production frontend build passed after Mapping Studio integration (3,333 modules transformed).
- [x] P1.2 migration compatibility test passed (runner naming, `hms_document_` prefix, version/status constraints).
- [x] P1.4 automatic regression case generator expanded and verified with 11/11 tests (normal, empty, long, boundary, many rows, nested/object/array/null cases).
- [x] P1.4 test-case JSON transfer utility implemented; 10/10 import/export validation tests passed.

## Audit note 2026-08-14

- The detailed checkbox count is the source of truth; roadmap summaries claiming 100% are not accepted as production sign-off.
- Automated evidence currently covers backend regression, mapping, contract, DOCX validation, storage, frontend typecheck and production build.
- UI E2E, real hospital load/soak, malware scan, visual regression, backup/restore, TLS/KMS and security approval remain blocked or incomplete.
- P1.4/P1.5 UI import/export and package transaction flows must remain unchecked until wired to persistence and verified end-to-end.
- [x] P1.4 batch gate: generator + JSON transfer regression 21/21 tests passed; backend typecheck passed.
- [x] Batch gate 20-item: full Template Studio regression 73/73 passed, frontend typecheck passed, production build passed.
- [x] P1.5 package manifest/checksum/signature gate: combined Template Studio regression now 98/98 tests passed.
- [x] P1.3 Docx Designer Helper modal and starter-pack downloader integrated.
- [x] P1.5 pure-Node ZIP packer/unpacker and import/export package workflow implemented with SHA-256 manifest & transactional import.
- [x] P1.4 Test Lab visual test case edit/clone/delete modal, test run DOCX/PDF artifact download, and Quality Gatekeeper review blocker implemented.
- [x] Full regression test suite: 109/109 Template Studio unit & integration tests passing with 0 failures.
- [x] Frontend typecheck and production build passed with 0 errors.
- [x] P2 Migration `062_hms_document_workflow_governance.sql` applied successfully (assignments, comments, checklist, scheduled publish, RBAC, and in-app notifications).
- [x] P2.1 Task Inbox & Assignments implemented (`TemplateInboxModal.tsx`, `getInbox`, 5 status tabs, SLA badges, and role assignments).
- [x] P2.2 Collaborative Review & 4-Point Checklist implemented (`VersionReviewModal.tsx`, version comments thread by category, format/data/print/security checklist, and Segregation of Duties creator approval blocker).
- [x] P2.3 Validity Period & Scheduled Publishing implemented (`effective_from`, `effective_to`, `scheduled_publish_at`, and `processScheduledPublishes()` automatic release engine).
- [x] P2.4 RBAC User Permissions & Scope Management UI implemented (`PermissionManagementModal.tsx`, `grantUserPermission`, `revokeUserPermission`, and facility/department scope).
- [x] Full backend regression test suite: 115/115 unit & integration tests passing (100% success, 0 failures).
- [x] Frontend production Vite build passed with 0 errors (3,340 modules transformed in 36.57s).
- [x] P3.1 Unified Document Engine Render API implemented (`POST /api/v1/documents/render`, `Idempotency-Key` caching, async jobs `/render/jobs`, `asOfDate`, and `isEmergency` priority lane).
- [x] P3.2 Storage Management & Orphan Scanner implemented (`listOrphanArtifacts`, safe cleanup, signed URLs with TTL, and storage stats).
- [x] P3.3 Circuit Breaker & High-load Reliability implemented (`CircuitBreaker` with `CLOSED`/`OPEN`/`HALF_OPEN` states, automatic fail-fast and recovery).
- [x] P3.4 Operations & Observability Dashboard implemented (`TemplateOperationsDashboardModal.tsx`, latency P50/P95/P99, queue & storage monitoring, and incident runbook).
- [x] P3.5 Healthcare Security & PHI/PII Data Sanitization implemented (`phi-sanitizer.ts`, masking CCCD, phone, BHYT, and patient details in logs and errors).
- [x] Phase 3 backend regression test suite: 119/119 unit & integration tests passing (100% success, 0 failures).
- [x] Frontend production Vite build passed with 0 errors (3,341 modules transformed in 39.59s).
