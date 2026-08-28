#!/bin/bash
# ==============================================================================
# VIMES HIS - Automatic System Updater for Linux (Ubuntu / CentOS)
# File: scripts/update.sh
# ==============================================================================

set -e

# Màu sắc thông báo
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}       VIMES HIS - HỆ THỐNG CẬP NHẬT TỰ ĐỘNG          ${NC}"
echo -e "${BLUE}======================================================${NC}"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$APP_DIR/backups/backup_$BACKUP_TIMESTAMP"
DOWNLOAD_URL=$1
SHA256_EXPECTED=$2

if [ -z "$DOWNLOAD_URL" ]; then
    echo -e "${YELLOW}⚠️ Không có URL truyền vào. Đang kiểm tra file cập nhật local trong thư mục temp_uploads...${NC}"
    LATEST_LOCAL=$(ls -t "$APP_DIR/temp_uploads"/*.tar.gz 2>/dev/null | head -n 1 || true)
    if [ -n "$LATEST_LOCAL" ]; then
        UPDATE_FILE="$LATEST_LOCAL"
        echo -e "${GREEN}Tìm thấy file cập nhật local: $UPDATE_FILE${NC}"
    else
        echo -e "${RED}❌ Lỗi: Vui lòng cung cấp URL tải gói cập nhật hoặc đặt file .tar.gz vào temp_uploads/${NC}"
        echo -e "Cách dùng: ./scripts/update.sh <DOWNLOAD_URL> [SHA256]"
        exit 1
    fi
else
    TEMP_DIR="$APP_DIR/temp_update"
    mkdir -p "$TEMP_DIR"
    UPDATE_FILE="$TEMP_DIR/update_$BACKUP_TIMESTAMP.tar.gz"

    echo -e "${BLUE}[1/5] 📥 Đang tải gói cập nhật từ máy chủ:${NC} $DOWNLOAD_URL"
    curl -f -L -# "$DOWNLOAD_URL" -o "$UPDATE_FILE"
    echo -e "${GREEN}✅ Đã tải xong tệp tin.${NC}"
fi

# Kiểm tra SHA256 nếu có
if [ -n "$SHA256_EXPECTED" ]; then
    echo -e "${BLUE}🔍 Đang kiểm tra mã băm toàn vẹn SHA-256...${NC}"
    CALCULATED_HASH=$(sha256sum "$UPDATE_FILE" | awk '{print $1}')
    if [ "$CALCULATED_HASH" != "$SHA256_EXPECTED" ]; then
        echo -e "${RED}❌ LỖI: Mã băm SHA-256 không khớp! File có thể bị lỗi hoặc bị thay đổi.${NC}"
        echo -e "  Nhận được: $CALCULATED_HASH"
        echo -e "  Kỳ vọng  : $SHA256_EXPECTED"
        rm -f "$UPDATE_FILE"
        exit 1
    fi
    echo -e "${GREEN}✅ Mã băm SHA-256 hợp lệ.${NC}"
fi

# Tạo thư mục sao lưu dự phòng
echo -e "${BLUE}[2/5] 📦 Đang tạo bản sao lưu dự phòng (Backup)...${NC}"
mkdir -p "$BACKUP_DIR"
if [ -d "$APP_DIR/dist" ]; then cp -r "$APP_DIR/dist" "$BACKUP_DIR/"; fi
if [ -d "$APP_DIR/backend/dist" ]; then cp -r "$APP_DIR/backend/dist" "$BACKUP_DIR/"; fi
if [ -d "$APP_DIR/backend/migrations" ]; then cp -r "$APP_DIR/backend/migrations" "$BACKUP_DIR/"; fi
echo -e "${GREEN}✅ Đã sao lưu bản hiện tại vào: $BACKUP_DIR${NC}"

# Giải nén đè bản mới
echo -e "${BLUE}[3/5] 🚀 Đang giải nén và áp dụng bản cập nhật...${NC}"
tar -xzf "$UPDATE_FILE" -C "$APP_DIR"
echo -e "${GREEN}✅ Đã giải nén mã nguồn mới thành công.${NC}"

# Chạy Migration
echo -e "${BLUE}[4/5] 🗄️ Đang kiểm tra và áp dụng Database Migrations mới...${NC}"
cd "$APP_DIR/backend"
if npm run migrate; then
    echo -e "${GREEN}✅ Database Migrations hoàn tất thành công!${NC}"
else
    echo -e "${RED}❌ CẢNH BÁO: Database Migration gặp lỗi. Vui lòng kiểm tra log.${NC}"
fi

# Khởi động lại dịch vụ
echo -e "${BLUE}[5/5] 🔄 Đang khởi động lại dịch vụ hệ thống...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 reload all || pm2 restart all
    echo -e "${GREEN}✅ Đã reload PM2 thành công.${NC}"
elif command -v systemctl &> /dev/null; then
    sudo systemctl restart vimes-his-backend || sudo systemctl restart vimes-his || true
    echo -e "${GREEN}✅ Đã restart dịch vụ qua Systemd.${NC}"
else
    echo -e "${YELLOW}⚠️ Không tìm thấy pm2 hoặc systemctl. Vui lòng restart service thủ công nếu cần.${NC}"
fi

# Dọn dẹp
rm -f "$UPDATE_FILE"

echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}       🎉 CẬP NHẬT HỆ THỐNG VIMES HIS THÀNH CÔNG!     ${NC}"
echo -e "${GREEN}======================================================${NC}"
