# TÀI LIỆU THIẾT KẾ & ĐẶC TẢ NGHIỆP VỤ PHÂN HỆ BỆNH ÁN ĐIỆN TỬ (EMR)
**Dự án:** vClinic - Smart Healthcare System  
**Căn cứ pháp lý & kỹ thuật:** 
- Thông tư 54/2017/TT-BYT (Bộ tiêu chí CNTT Y tế mức 6 & 7 - Bệnh viện không giấy tờ)
- Thông tư 46/2018/TT-BYT (Quy định chi tiết về Hồ sơ Bệnh án Điện tử)
- Quyết định 6858/QĐ-BYT (Bộ tiêu chí Đánh giá Chất lượng Bệnh viện Việt Nam)
- Luật Khám bệnh, chữa bệnh số 15/2023/QH15
- Mô hình kiến trúc FPT.eHospital 2.0 EMR
**Vị trí lưu trữ:** `d:/AI/vClinic/modules/emr/docs/`

---

## 1. TỔNG QUAN PHÂN HỆ EMR (ELECTRONIC MEDICAL RECORD)

Hồ sơ Bệnh án điện tử (EMR) là phiên bản số hóa toàn diện của hồ sơ bệnh án y khoa, có giá trị pháp lý tương đương bệnh án giấy theo quy định của Luật Khám bệnh, chữa bệnh và Thông tư 46/2018/TT-BYT của Bộ Y tế.

Phân hệ EMR trong vClinic đóng vai trò trung tâm lưu trữ, quản lý, xử lý, ký số, bàn giao tiếp nhận, mở khóa phiên bản, trích sao bản sao điện tử, hội chẩn chuyên môn và giám định chất lượng trong suốt vòng đời khám chữa bệnh của người bệnh.

---

## 2. QUY TRÌNH NGHIỆP VỤ TRỌNG TÂM

### 2.1. Quy trình Gửi - Nhận & Rà soát Điều kiện Tiếp nhận Bệnh án (Handover & Reception)
1. **Khoa điều trị**: Bệnh nhân ra viện $\rightarrow$ Rà soát đủ danh mục mẫu biểu Bộ Y Tế và 100% chữ ký số hợp lệ (Pre-submission Compliance Audit).
2. **Gửi lưu trữ**: Khoa gửi hồ sơ lên Phòng KHTH / Bộ phận lưu trữ EMR.
3. **Phòng KHTH**: Duyệt tiếp nhận vào Kho EMR (`accepted_by_emr`), cấp số biên bản giao nhận điện tử (`BBGN-2026-xxxx`) hoặc Từ chối trả về khoa kèm lý do cụ thể.

### 2.2. Quy trình Mở khóa & Đề xuất Sửa đổi sau Lưu trữ (Unlock & Amendments)
1. Bác sĩ điều trị lập *Phiếu đề xuất mở khóa sửa đổi* (bổ sung kết quả Giải phẫu bệnh/Vi sinh về muộn hoặc sửa sai sót hành chính).
2. Ban Giám Đốc / Phòng KHTH phê duyệt và cấp thời hạn mở khóa (ví dụ: 4 giờ, 12 giờ, 24 giờ).
3. Bác sĩ cập nhật dữ liệu $\rightarrow$ Hệ thống tự động lưu vết thay đổi (**Version Diff**), nâng phiên bản (**v1.0 $\rightarrow$ v1.1**) và yêu cầu ký số lại tài liệu.

### 2.3. Quy trình Trích sao & Cấp Bản sao Điện tử (Extraction & Public QR Verification)
1. Tiếp nhận yêu cầu trích sao tóm tắt bệnh án, giấy chứng nhận phẫu thuật/thương tích, giấy chứng sinh, giấy báo tử.
2. Trích xuất biểu mẫu số hóa và ký số điện tử của Ban Giám đốc (TSA Timestamp).
3. Đính kèm **Mã QR Code xác thực công cộng** (Public QR Verification Token) để người bệnh và các công ty bảo hiểm quét đối soát tính toàn vẹn.

### 2.4. Quy trình Hội chẩn Chuyên môn & Kiểm thảo Tử vong (Consultation & Death Audit)
1. Lập hội đồng hội chẩn liên khoa/toàn viện hoặc hội đồng kiểm thảo tử vong 24h.
2. Tổ chức họp, ghi nhận ý kiến các chuyên gia và kết luận hướng điều trị.
3. **Ký số tập thể (Multi-sign)** cho tất cả thành viên hội đồng và tự động liên kết biên bản vào cây hồ sơ bệnh án.

### 2.5. Quy trình Giám định & Đánh giá Chất lượng Bệnh án (EMR QA-QC Audit)
1. Phòng KHTH chấm điểm chất lượng bệnh án định kỳ theo Quyết định 6858/QĐ-BYT (4 nhóm tiêu chí: Hành chính, Khám & Chẩn đoán ICD-10, Điều trị & Kháng sinh, Quy chế Ký số & Thời hạn 24h).
2. Tự động xếp loại (Xuất sắc $\ge 90\%$, Tốt $\ge 80\%$, Trung bình $\ge 65\%$, Kém $<65\%$) và phân tích thống kê sai sót phục vụ cải tiến chất lượng.

---

## 3. DANH SÁCH MÀN HÌNH THEO 4 NHÓM NGHIỆP VỤ (BUSINESS DOMAINS)

### 3.0. Dashboard Trung tâm
- **Tổng quan EMR** (`/emr/dashboard`): Giám sát KPIs toàn viện, tỷ lệ bệnh án không giấy tờ, biểu đồ chuyên khoa, audit logs.

### 3.1. Nhóm 1: Quản lý Lâm sàng & Điều trị (Clinical Care Management)
- **Hồ sơ Bệnh án** (`/emr/records` & `/emr/records/:id`): Tra cứu hồ sơ đa tiêu chí, không gian làm việc lâm sàng 3 cột (Cây tài liệu BYT + Trình xem Form A4 + Diễn biến & Sinh hiệu).
- **Hội chẩn & Kiểm thảo TV** (`/emr/consultations`): Quản lý hội chẩn chuyên môn liên khoa/toàn viện, ký số tập thể (Multi-sign), kiểm thảo tử vong 24h.
- **Ký số Y khoa** (`/emr/signatures`): Trung tâm ký số đơn lẻ và ký hàng loạt với chứng thư số CA/HSM/TSA.

### 3.2. Nhóm 2: Tiếp nhận & Lưu trữ Bệnh án (Handover & Digital Archiving)
- **Tiếp nhận & Giao nhận HS** (`/emr/handover`): Rà soát điều kiện tiếp nhận hồ sơ ra viện (100% mẫu biểu & chữ ký), duyệt nhập kho EMR, in biên bản giao nhận điện tử.
- **Mở khóa & Sửa đổi HS** (`/emr/unlock-requests`): Lập đề xuất mở khóa bổ sung GPB/vi sinh sau lưu trữ, phê duyệt cấp thời hạn, quản lý phiên bản v1.0 $\rightarrow$ v1.1 và Version Diff.

### 3.3. Nhóm 3: Khai thác & Liên thông Dữ liệu (Extraction & Interoperability)
- **Trích sao & Cấp bản sao QR** (`/emr/copies`): Cấp bản sao điện tử (Tóm tắt BA, Giấy chứng nhận PT/thương tích) có chữ ký số Giám đốc BV và mã QR xác thực công cộng.
- **Khai thác & Mượn HS** (`/emr/access-requests`): Quản lý phiếu mượn hồ sơ phục vụ NCKH/Giám định, duyệt cấp mã Token bảo mật có thời hạn.
- **Liên thông HL7 & XML** (`/emr/interop`): Xuất gói tin XML 4210, QĐ 130 BHYT, chuẩn HL7 CDA R2 và Sổ Sức Khỏe Điện Tử VNeID.

### 3.4. Nhóm 4: Giám sát & Quản trị Hệ thống (Quality Assurance & Governance)
- **Giám định Chất lượng BA** (`/emr/quality-audit`): Chấm điểm chất lượng hồ sơ theo QĐ 6858/QĐ-BYT, xếp loại và thống kê vi phạm cải tiến chất lượng.
- **Danh mục & Cấu hình** (`/emr/settings`): Quản trị danh mục mẫu biểu Bộ Y Tế, cấu hình thời hạn tự động khóa BA 24h.

---

## 4. CẤU TRÚC THƯ MỤC MODULE EMR

```
d:/AI/vClinic/modules/emr/
├── docs/                                # Tài liệu kỹ thuật theo quy định dự án
│   ├── FPT.eHospital2.0_EMR_v1.0_VN.pdf
│   ├── TT_54_2017_TT-BYT.pdf
│   └── EMR_SYSTEM_DESIGN.md
├── types/
│   └── index.ts                         # Định nghĩa dữ liệu TypeScript EMR toàn diện
├── constants.ts                         # Constants, menu, mã biểu BYT, trạng thái, nhãn phân hệ
├── services/
│   └── emrService.ts                    # Service APIs và Mock database nghiệp vụ EMR
├── components/
│   ├── EMRDocumentTree.tsx              # Cây cấu trúc hồ sơ bệnh án phân cấp
│   ├── EMRVitalSignsWidget.tsx          # Biểu đồ theo dõi sinh hiệu Recharts
│   ├── EMRTimelineView.tsx              # Dòng thời gian diễn biến lâm sàng
│   ├── EMRSignatureBadge.tsx            # Dấu niêm phong chữ ký số CA/TSA
│   ├── EMRDocumentRenderer.tsx          # Trình kết xuất form mẫu chuẩn BYT khổ A4
│   ├── EMRExportModal.tsx               # Modal xuất gói tin XML 4210/130 / HL7 CDA
│   ├── EMRComplianceCheckerModal.tsx    # Modal rà soát điều kiện tiếp nhận
│   └── EMRHandoverReceiptModal.tsx      # Modal biên bản giao nhận BAĐT
├── views/
│   ├── EMRDashboardView.tsx             # 1. Màn hình Dashboard EMR
│   ├── EMRListView.tsx                  # 2. Màn hình Danh sách hồ sơ BA
│   ├── EMRDetailWorkspaceView.tsx       # 3. Màn hình Không gian làm việc EMR 3 cột
│   ├── EMRSubmissionHandoverView.tsx    # 4. Màn hình Tiếp nhận & Giao nhận HSBA
│   ├── EMRUnlockAmendmentView.tsx       # 5. Màn hình Mở khóa & Sửa đổi bổ sung
│   ├── EMRExtractionCopiesView.tsx      # 6. Màn hình Trích sao & Cấp bản sao QR
│   ├── EMRConsultationReviewsView.tsx   # 7. Màn hình Hội chẩn & Kiểm thảo tử vong
│   ├── EMRQualityAuditView.tsx          # 8. Màn hình Giám định chất lượng EMR QA-QC
│   ├── EMRDigitalSignatureView.tsx      # 9. Màn hình Trung tâm ký số y khoa
│   ├── EMRAccessApprovalView.tsx        # 10. Màn hình Khai thác & Audit Logs
│   ├── EMRInteroperabilityView.tsx      # 11. Màn hình Liên thông HL7 & XML
│   └── EMRSettingsCatalogView.tsx       # 12. Màn hình Cài đặt & Danh mục mẫu biểu
└── index.tsx                            # Module Root & Routing
```
