# Phân tích Mã nguồn HIS PACS và Kế hoạch Đồng bộ Kết quả CĐHA & TDCN

Tài liệu này phân tích chi tiết cấu trúc mã nguồn C++ của phân hệ HIS PACS (`PACSInputResult.cpp`) và đề xuất giải pháp kỹ thuật tích hợp tính năng **nhập kết quả cận lâm sàng (CĐHA / TDCN)** trực tiếp từ phân hệ Khám sức khỏe liên thông, đồng thời đồng bộ ngược (pushback) đầy đủ trạng thái và thông tin hành chính về HIS.

---

## 1. Phân tích Mã nguồn C++ HIS (`PACSInputResult.cpp`)

Qua việc đọc mã nguồn lớp `CPACSInputResult`, chúng ta xác định được cơ chế hoạt động của HIS như sau:

### A. Cơ chế Render Giao diện (UI Controls) động
HIS sinh giao diện nhập kết quả động dựa trên bảng thiết kế layout `hms_pacs_layout`:
* **Cơ chế tải**: Truy vấn `SELECT * FROM hms_pacs_layout WHERE hpl_id = :form_id ORDER BY hpl_index` để lấy cấu hình các control.
* **Các loại Control hỗ trợ**:
  * `GUI_GROUPBOX` (Khung nhóm)
  * `GUI_LABEL` (Nhãn)
  * `GUI_CHECKBOX` (Hộp kiểm) -> Lưu giá trị `'Y'` hoặc rỗng
  * `GUI_TEXTCTRL` (Hộp nhập văn bản)
  * `GUI_COMBOBOX` (Hộp chọn) -> Có thể chứa danh sách cứng (`hpl_values`) hoặc nạp danh sách Bác sĩ từ bảng `sys_user` (`hpl_data = 'User'`).
  * `GUI_DATECTRL` / `GUI_DATETIMECTRL` (Ô ngày giờ)

### B. Cơ chế lưu trữ Kết quả và Trạng thái trong DB HIS
Khi nhấn **Save** (`OnSaveCPACSInputResult`), HIS thực hiện các bước:
1. **Xóa & Chèn mới kết quả chi tiết** vào bảng `hms_pacs_result`:
   - Xóa kết quả cũ của chỉ định:
     ```sql
     DELETE FROM hms_pacs_result WHERE hpr_docno = :docno AND hpr_orderid = :orderid AND hpr_itemid = :itemid
     ```
   - Chèn mới các trường dữ liệu có giá trị từ giao diện:
     ```sql
     INSERT INTO hms_pacs_result (hpr_docno, hpr_orderid, hpr_itemid, hpr_name, hpr_desc)
     VALUES (:docno, :orderid, :itemid, :name, :desc)
     ```
     *Trong đó: `:name` là mã control (ví dụ: `conclusion` - Kết luận, `remark` - Mô tả hình ảnh).*

2. **Cập nhật Trạng thái Chỉ định** sang `'T'` (Đã thực hiện / Completed):
   - Cập nhật bảng chủ dịch vụ `hms_pacsorder`:
     ```sql
     UPDATE hms_pacsorder 
     SET hpc_pdeptid = :deptid,
         hpc_proomid = :roomid,
         hpc_performdate = CURRENT_TIMESTAMP,
         hpc_practitioner = :practitioner,
         hpc_approvalby = :approvalby,
         hpc_status = 'T'
     WHERE hpc_orderid = :orderid
     ```
   - Cập nhật bảng dòng dịch vụ `hms_pacsorderline`:
     ```sql
     UPDATE hms_pacsorderline 
     SET hpcl_result = :form_id, -- Rất quan trọng: Mẫu biểu kết quả
         hpcl_practitioner = :practitioner,
         hpcl_approvalby = :approvalby,
         hpcl_status = 'T',
         hpcl_date = CURRENT_TIMESTAMP,
         hpcl_perform_deptid = :deptid,
         hpcl_proomid = :roomid
     WHERE hpcl_orderid = :orderid AND hpcl_itemid = :itemid
     ```

---

## 2. Các điểm thiếu hụt (Gaps) trong Backend vClinic hiện tại

Hiện tại, trong API lưu trữ hồ sơ (`health-check/documents.ts`), phần đồng bộ ngược dữ liệu CĐHA/TDCN về HIS đang gặp 3 lỗi logic lớn:
1. **Không thể lưu kết quả mới**: Chỉ chạy lệnh `UPDATE hms_pacs_result SET hpr_desc = ...`. Đối với các chỉ định mới từ HIS (chưa từng nhập kết quả), bảng này chưa tồn tại dòng nào cho chỉ định đó nên lệnh `UPDATE` sẽ ảnh hưởng **0 dòng**.
2. **Không cập nhật trạng thái thực hiện**: Trạng thái chỉ định (`hpc_status` và `hpcl_status`) vẫn giữ nguyên là `'O'` (Chưa thực hiện), khiến bệnh nhân vẫn hiển thị trong danh sách chờ trên HIS.
3. **Thiếu thông tin biểu mẫu**: Chưa ghi nhận trường `hpcl_result` (Mã mẫu kết quả CĐHA). Nếu thiếu trường này, khi người dùng mở lại chỉ định trên HIS, HIS sẽ không biết dùng layout nào để hiển thị kết quả.

---

## 3. Kế hoạch Triển khai Chi tiết

### Bước 1: Điều chỉnh Frontend (`LabTab.tsx`)
* Cho phép nhập trực tiếp kết quả CĐHA / TDCN trên lưới chỉ định cận lâm sàng:
  * Cột **Kết quả** (Ánh xạ vào `value` - tức `conclusion` của PACS).
  * Cột **Mô tả chi tiết** (Ánh xạ vào `description` - tức `remark` của PACS).
* Đảm bảo khi bấm **Duyệt** tab Cận lâm sàng, dữ liệu của tab sẽ được lưu trữ chính xác vào state của hồ sơ để chuẩn bị đẩy về backend.

### Bước 2: Cải tiến logic Pushback tại Backend (`documents.ts`)
Khi duyệt/lưu hồ sơ KSK, backend sẽ thực thi luồng đồng bộ sau cho từng dịch vụ CĐHA / TDCN (`item.type IN ('HA', 'TD')`):

1. **Tìm kiếm mã mẫu biểu (`form_id`) của dịch vụ**:
   Truy vấn lấy `hfl_index1` từ danh mục dịch vụ HIS (tương ứng với logic truy vấn dòng 466 trong mã nguồn C++):
   ```sql
   SELECT hfl_index1 FROM hms_fee_list WHERE hfl_feeid = $1
   ```
2. **Xóa & Chèn mới kết quả chi tiết (Đảm bảo UPSERT hoạt động 100%)**:
   - Đối với Kết luận (`conclusion`):
     ```sql
     DELETE FROM hms_pacs_result WHERE hpr_orderid = $1 AND hpr_itemid = $2 AND LOWER(hpr_name) = 'conclusion';
     INSERT INTO hms_pacs_result (hpr_docno, hpr_orderid, hpr_itemid, hpr_name, hpr_desc) VALUES ($3, $1, $2, 'conclusion', $4);
     ```
   - Đối với Mô tả (`remark`):
     ```sql
     DELETE FROM hms_pacs_result WHERE hpr_orderid = $1 AND hpr_itemid = $2 AND LOWER(hpr_name) = 'remark';
     INSERT INTO hms_pacs_result (hpr_docno, hpr_orderid, hpr_itemid, hpr_name, hpr_desc) VALUES ($3, $1, $2, 'remark', $4);
     ```
3. **Cập nhật Trạng thái & Bác sĩ ký kết quả**:
   - Bác sĩ duyệt (`approvalby`) và bác sĩ thực hiện (`practitioner`) sẽ lấy theo mã bác sĩ duyệt tab Cận lâm sàng hiện tại.
   - Cập nhật trạng thái chỉ định dòng (`hms_pacsorderline`) và chỉ định tổng (`hms_pacsorder`) thành `'T'` (Đã thực hiện).

---

## 4. Kế hoạch Kiểm thử & Xác minh (Verification Plan)

### A. Kiểm tra Cấu trúc dữ liệu
- Chạy lệnh kiểm thử lưu trữ hồ sơ KSK chứa chỉ định CĐHA từ vClinic.
- Truy vấn DB trực tiếp kiểm tra:
  - Bản ghi trong `hms_pacs_result` có được chèn mới thành công hay không.
  - Cột `hpcl_status` trong `hms_pacsorderline` có chuyển thành `'T'` hay không.
  - Cột `hpcl_result` có chứa mã layout biểu mẫu (ví dụ: `XQMatPhuong`...) lấy từ `hms_fee_list` hay không.

### B. Kiểm tra Tương thích Giao diện HIS
- Mở chương trình HIS trên máy trạm.
- Mở hồ sơ bệnh nhân vừa đồng bộ từ vClinic.
- Chọn chỉ định CĐHA và mở màn hình kết quả, xác nhận kết quả và mô tả hiển thị chính xác trên layout động của HIS giống như nhập trực tiếp từ phần mềm HIS.
