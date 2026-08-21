# Project Rules and Guidelines

## Quy tắc tổ chức tài liệu (Documentation Organization Rule)
- Tất cả các tài liệu kỹ thuật, tài liệu thiết kế, hướng dẫn sử dụng, tài liệu triển khai của từng phân hệ (module) **phải được lưu trữ tại thư mục tài liệu của chính module đó** (ví dụ: `d:/AI/VIMES_HIS/modules/<module-name>/docs/` hoặc `d:/AI/VIMES_HIS/modules/<module-name>/doc/`).
- Tuyệt đối **không tạo hoặc lưu trữ trực tiếp các tài liệu này ở thư mục gốc** của dự án (`d:/AI/VIMES_HIS/`), ngoại trừ các tài liệu chung toàn dự án (như `README.md`, `CONTRIBUTING.md`, v.v.).
- Khi tạo mới bất kỳ tài liệu nào cho một module, hãy tự động xác định thư mục đích chính xác theo cấu trúc thư mục của dự án và lưu trữ tại đó.

## Quy tắc Quản lý Cấu trúc Cơ sở Dữ liệu (Database Migration Rule)
- Tuyệt đối **KHÔNG** chỉnh sửa cấu trúc Database trực tiếp trên cơ sở dữ liệu production hoặc thêm trực tiếp vào file mã nguồn (như server.ts).
- Khi thêm/sửa bảng, trường dữ liệu, hoặc stored procedure, **BẮT BUỘC** phải tạo một file SQL mới theo định dạng <Số_Thứ_Tự>_<Mô_tả>.sql và đặt vào thư mục  backend/migrations/.
- Phải đảm bảo nội dung file SQL là an toàn (tự bảo vệ/Idempotent):
  - Luôn dùng: `CREATE TABLE IF NOT EXISTS ...`
  - Luôn dùng: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
  - Luôn dùng: `CREATE INDEX IF NOT EXISTS ...` (hoặc bọc trong `DO $$ BEGIN IF NOT EXISTS ... END $$`)
  - Không chứa lệnh `DROP` nguy hiểm nếu không có chỉ định.
- Backend sẽ tự động đọc thư mục này và quét các script mới chưa chạy để tiến hành nâng cấp tự động (có bao gồm cơ chế tự phục hồi nếu cột/bảng đã tồn tại).

## Quy tắc Sử dụng Reusable UI Components
- **Combobox / Searchable Autocomplete:**
  - Đối với tất cả các thao tác chọn lựa dữ liệu có số lượng lớn hoặc cần tìm kiếm nhanh (như danh mục dịch vụ kỹ thuật, danh mục thuốc, khoa phòng, mã bệnh ICD-10, địa bàn hành chính, người dùng...), **BẮT BUỘC** phải tái sử dụng component chuẩn đã xây dựng tại `d:\AI\vClinic\components\ui\Combobox.tsx`.
  - Component này hỗ trợ đầy đủ: Multi-column view, lọc bỏ dấu tiếng Việt (`removeVietnameseTones`), highlight từ khóa tìm kiếm, React Portal chống tràn khung modal/table, và điều hướng bàn phím Enter / Mũi tên.
  - Tuyệt đối **KHÔNG** sử dụng thẻ `<select>` đơn thuần cho danh sách dài khiến người dùng phải cuộn chuột tìm kiếm, và không tự code lại logic autocomplete riêng lẻ.
