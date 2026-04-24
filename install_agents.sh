#!/bin/bash

# 1. Tạo thư mục cấu hình cho Agent
mkdir -p .agent

# 2. Tạo file quy tắc tổng thể (Global Rules)
cat <<EOF > .agent/rules
# HỆ THỐNG TỰ ĐỘNG DI TRÚ VIMES (MFC) -> vCLINIC (REACT)

[CẤU HÌNH HỆ THỐNG]
- Terminal: Always Proceed (Full-Auto)
- File Access: Always Proceed (Full-Auto)
- Strict Mode: OFF

[DANH SÁCH NHÂN SỰ]
1. @Manager (Gemini 3.1 Pro): Chuyên đọc file .cpp, trích xuất logic nghiệp vụ HIS và chia Task JSON.
2. @Developer (Gemini 3 Flash): Nhận Task JSON, viết code React/Node.js và PostgreSQL.
3. @QA (Claude 4.6): Đối chiếu logic giữa code cũ và mới, kiểm tra lỗi GDI/Memory leak.

[QUY TRÌNH TỰ ĐỘNG]
Bước 1: @Manager quét mã nguồn MFC -> Tạo file tasks.json
Bước 2: @Developer đọc tasks.json -> Viết code -> Lưu file
Bước 3: @QA kiểm tra file đã lưu -> Xác nhận hoàn thành hoặc yêu cầu sửa lại.
EOF

# 3. Tạo file template để theo dõi tiến độ
cat <<EOF > migration_status.md
# BÁO CÁO TIẾN ĐỘ DI TRÚ vCLINIC
- Tổng số Module: [Đang phân tích...]
- Đã hoàn thành: 0%
- Trạng thái Agent: Đang chờ lệnh khởi động...
EOF

echo "✅ Đã thiết lập đội ngũ Agent cho dự án vClinic!"