# Báo cáo Cập nhật Báo cáo Công suất Sử dụng Giường bệnh

## 1. Yêu cầu xử lý
1. **Tiêu đề phụ:** Bỏ dòng hardcode `Theo dõi công suất khai thác theo 562 Giường kế hoạch (QĐ 49/QĐ-BVĐKT)...` do không có thông tin dựa vào quyết định này, thay thế bằng tên chung chung chuẩn mực y tế bệnh viện.
2. **Lọc khoa phòng:** Chỉ lấy các khoa nào đang hoạt động (`sys_dept.sd_isactive = 'Y'`) vào báo cáo công suất giường bệnh, loại bỏ các khoa tạm ngưng, khoa dã chiến hoặc ẩn khỏi danh sách.
3. **Thu hồi Migration 152:** Người dùng xác nhận trường trạng thái hoạt động thực tế của bảng `sys_dept` là `sd_isactive` (đã có sẵn), không cần thủ tục tạo/đồng bộ thêm `sd_active`.

## 2. Các nội dung đã thực hiện
### 2.1 Cập nhật Frontend (`modules/hospital-statistics/views/BedOccupancyView.tsx`)
- Thay thế dòng mô tả phụ cố định sang nội dung chuẩn mực:
  - **Trước:** `Theo dõi công suất khai thác theo 562 Giường kế hoạch (QĐ 49/QĐ-BVĐKT) và tách nguồn bệnh nhân nội trú BHYT, Viện phí, Ngoại trú`
  - **Sau:** `Theo dõi công suất sử dụng giường bệnh theo chỉ tiêu kế hoạch giao và phân bổ bệnh nhân nội trú BHYT, Viện phí, Ngoại trú`
- Bỏ chuỗi tên trường kỹ thuật `(sd_bednumber)` tại thẻ KPI Giường Kế Hoạch (Sở Giao), chỉ hiển thị nhãn thân thiện với người dùng: `Chỉ tiêu Sở giao`.

### 2.2 Xóa bỏ Migration 152
- Đã xóa tệp migration `backend/migrations/152_sync_sys_dept_active_status.sql`.
- Đã dọn dẹp bản ghi lịch sử `152_sync_sys_dept_active_status.sql` trong bảng quản lý `sys_migrations`.

### 2.3 Cập nhật Backend Service (`src/services/statistics.service.ts` & `backend/src/services/statistics.service.ts`)
- Sử dụng trực tiếp trường chuẩn `sd_isactive` có sẵn trong database HIS:
  ```sql
  WHERE sd.sd_type = 'DT' 
    AND COALESCE(sd.sd_isactive, 'Y') = 'Y'
    AND (COALESCE(sd.sd_bednumber, 0) > 0 OR COALESCE(b.giuong_ke_hoach, 0) > 0 OR t.bn_dang_nam > 0 OR t.bn_ngoai_tru > 0)
  ORDER BY COALESCE(sd.sd_bednumber, 0) DESC, sd.sd_id
  ```
- Đồng thời cập nhật bộ lọc `COALESCE(sd.sd_isactive, 'Y') = 'Y'` tại `getDepartmentBedStatus` (Bản tin giao ban 24h) và `getDepartmentBedSummary` (Cảnh báo ban giám đốc).

## 3. Kết quả kiểm thử
- **Dữ liệu thực tế:** Loại trừ hoàn toàn các khoa dã chiến Covid-19 (`ĐTCOV1`, `ĐTCOV2`, `ĐTCOV3`, `BBVSK`) có `sd_isactive = 'N'`.
- **Biên dịch Frontend (`npx tsc --noEmit`):** Exit code 0, 0 lỗi.
- **Biên dịch Backend (`npx tsc --noEmit`):** Exit code 0, 0 lỗi.
