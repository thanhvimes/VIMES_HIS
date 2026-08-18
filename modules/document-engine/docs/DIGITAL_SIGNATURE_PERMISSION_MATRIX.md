# Permission matrix ký số PDF

| Vai trò | View | Sign | Freestyle | Validate | Placeholder manage | Appearance manage | Audit | Ghi chú |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Bác sĩ ký | ✓ | ✓ | theo policy | ✓ | – | – | – | Chỉ hồ sơ/khoa được phân công |
| Điều dưỡng ký | ✓ | ✓ | theo policy | ✓ | – | – | – | Chỉ biểu mẫu điều dưỡng |
| Nhân viên văn thư | ✓ | – | – | ✓ | – | – | – | Không được ký thay |
| Template Editor | ✓ | – | – | ✓ | ✓ | – | – | Không publish/sign |
| Template Reviewer | ✓ | – | – | ✓ | review | – | – | Không ký tài liệu lâm sàng nếu không có role |
| Security/Audit | ✓ | – | – | ✓ | – | – | ✓ | Xem audit, không ký |
| Hospital Signature Admin | ✓ | theo policy | theo policy | ✓ | ✓ | ✓ | ✓ | Phải có phê duyệt tách biệt |
| System admin | ✓ | không mặc định | không mặc định | ✓ | admin | admin | ✓ | Không tự động có quyền ký nghiệp vụ |

Permission codes:

- `DOCUMENT_SIGNATURE_VIEW`
- `DOCUMENT_SIGNATURE_SIGN`
- `DOCUMENT_SIGNATURE_FREESTYLE`
- `DOCUMENT_SIGNATURE_VALIDATE`
- `DOCUMENT_SIGNATURE_PLACEHOLDER_MANAGE`
- `DOCUMENT_SIGNATURE_APPEARANCE_MANAGE`
- `DOCUMENT_SIGNATURE_AUDIT_VIEW`
- `DOCUMENT_SIGNATURE_ADMIN`

Backend phải kiểm tra thêm signer-role, encounter/department, signing order, document status và certificate policy. RBAC một mình không đủ để cho phép ký bệnh án.

`DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS=true` là mặc định ngoài test. Mọi route ký số mới phải dùng middleware này và test negative permission trước khi merge.
