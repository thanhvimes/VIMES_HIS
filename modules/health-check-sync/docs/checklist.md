# QĐ 2062/QĐ-BYT Implementation Checklist

Tài liệu này theo dõi chi tiết từng hạng mục công việc cần thực hiện để nâng cấp module liên thông Khám sức khỏe VNeID đáp ứng Quyết định 2062/QĐ-BYT (Sửa đổi QĐ 1551).

---

## Danh sách công việc chi tiết

| ID | Tên công việc | Mô tả chi tiết | Module liên quan | File cần tạo/cập nhật | Điều kiện hoàn thành (DoD) | Phụ thuộc | Độ ưu tiên | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: | :---: | :---: |
| **TSK-001** | Thiết lập database schema | Nâng cấp database PostgreSQL, thêm các trường hành chính trẻ em, GLN settings, bảng chữ ký chuyên khoa. | Database | `database-design.md`, các script SQL | Các lệnh SQL chạy thành công trên DB Sandbox, schema được cập nhật. | Không | Cao (High) | `[x]` |
| **TSK-002** | Đặc tả mapping trường dữ liệu | Thiết lập bảng so khớp trường dữ liệu (mapping) của 3 nhóm tuổi mới. | Nghiệp vụ | `mapping.md` | Bảng mapping đầy đủ 3 nhóm tuổi với kiểu dữ liệu, độ dài và thuộc tính bắt buộc. | TSK-001 | Cao (High) | `[x]` |
| **TSK-003** | Thiết kế API & Checksum | Đặc tả API xác thực, API đẩy dữ liệu và thuật toán băm Checksum Signature RSA-SHA256 kép. | Backend | `api-design.md` | Cấu trúc payload JSON/XML và giải thuật băm được mô tả chính xác kèm code ví dụ. | TSK-002 | Cao (High) | `[x]` |
| **TSK-004** | Thiết lập Sơ đồ quy trình | Xây dựng sơ đồ luồng dữ liệu và quy trình nghiệp vụ tổng thể của module KSK mới. | Nghiệp vụ | `workflow.md` | Sơ đồ Mermaid biểu diễn chính xác các bước trong quy trình. | Không | Trung bình | `[x]` |
| **TSK-005** | Thiết kế Giao diện lâm sàng | Cấu hình UI Dynamic Form lâm sàng cho 3 nhóm tuổi mới và nút ký số bác sỹ chuyên khoa. | Frontend | `DynamicForm.tsx` (Spec) | Mô tả đầy đủ layout giao diện và logic ẩn/hiển thị các trường lâm sàng theo nhóm tuổi. | TSK-002 | Cao (High) | `[x]` |
| **TSK-006** | Xây dựng Kế hoạch kiểm thử | Thiết lập các kịch bản kiểm thử (Test Cases), phương án test Sandbox liên thông. | QA / Test | `testing-plan.md` | Danh sách testcases bao phủ toàn bộ các kịch bản thành công và thất bại. | TSK-003 | Trung bình | `[x]` |
| **TSK-007** | Xây dựng Kế hoạch phát hành | Lập kế hoạch đóng gói, nâng cấp DB và phương án rollback khi gặp lỗi. | DevOps | `release-plan.md` | Tài liệu phát hành hoàn thiện kèm các bước deploy cụ thể. | TSK-006 | Thấp | `[x]` |

---

*Lưu ý: Bảng checklist này đã được hoàn thành 100%.*
