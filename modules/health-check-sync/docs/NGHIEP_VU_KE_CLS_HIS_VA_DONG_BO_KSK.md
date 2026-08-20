# Chuyển Đổi Nghiệp Vụ Kê Dịch Vụ Cận Lâm Sàng Từ HIS C++ Sang Web & Đồng Bộ KSK

## 1. Mục đích
Chuyển đổi hoàn toàn logic kê chỉ định dịch vụ Cận lâm sàng (CLS) từ class MFC C++ [`HMSParaclinicalDialog.cpp`](file:///D:/DEV/Programs_HIS/HMSCore/HMSParaclinicalDialog.cpp) sang hệ thống VIMES HIS Web API, đảm bảo:
1. Giao diện Modal 3 cột chuẩn HIS: **[Nhóm dịch vụ] -> [Danh sách dịch vụ kỹ thuật] -> [Dịch vụ đã chọn (Hàng chờ)]**.
2. Người dùng có thể chọn nhiều dịch vụ từ nhiều nhóm khác nhau vào hàng chờ, điều chỉnh số lượng (SL), xóa bớt.
3. Khi người dùng bấm **"Áp dụng"**, hệ thống mới chính thức thực thi kê toàn bộ danh sách dịch vụ vào cơ sở dữ liệu HIS Core (`hms_testorder`, `hms_testorderline`, `hms_pacsorder`, `hms_pacsorderline`).
4. Dữ liệu chỉ định lập tức được **tự động đồng bộ sang hồ sơ Khám sức khỏe VNeID** (`health_check_documents`).
5. Khi khoa Xét nghiệm (LIS) hoặc Chẩn đoán hình ảnh (PACS) trả kết quả trên HIS, kết quả tự động hiển thị trong hồ sơ KSK và đưa vào biểu mẫu in / XML liên thông QĐ 2062.

---

## 2. Kiến trúc & Luồng Xử lý

### 2.1. Phân loại nhóm dịch vụ & Tạo Phiếu chỉ định
Theo logic trong `HMSParaclinicalDialog.cpp`:
- **Nhóm B1 (Xét nghiệm - Test):** Tạo header `hms_testorder` và chi tiết `hms_testorderline`.
- **Nhóm B2, B3, B4, B5 (CĐHA, Siêu âm, Thăm dò chức năng, Nội soi - PACS):** Tạo header `hms_pacsorder` và chi tiết `hms_pacsorderline`.

### 2.2. Các hàm Stored Procedure / Truy vấn Database
- **`hms_paraclinic_add(...)`**: Tạo phiếu chỉ định mới với các tham số `createdby`, `deptid`, `roomid`, `patientno`, `docno`, `orderdate`, `doctor`, `groupid`, `status: 'O'`, `moduleid: 'RM'`.
- **`hms_paraclinic_addline(...)`**: Thêm chi tiết dịch vụ vào phiếu chỉ định và tạo bản ghi chi phí viện phí.
- **Cập nhật trạng thái `hpc_status = 'S'`**: Chuyển phiếu chỉ định sang trạng thái đã gửi để các khoa thực hiện tiếp nhận và xử lý mẫu.

### 2.3. Tự động Đồng bộ sang KSK
- Sau khi tạo xong các Order trên HIS, gọi hàm `hisIntegrationController.fetchStructuredParaclinicalData(numericDocNo)` để đọc toàn bộ kết quả/chỉ định CLS từ các bảng HIS.
- Cập nhật trường `json_data.lab_data` trong bảng `health_check_documents`.

---

## 3. Danh sách các Tệp Triển khai

1. **Backend Controller:**
   - [`backend/src/controllers/health-check/order.controller.ts`](file:///d:/AI/VIMES_HIS/backend/src/controllers/health-check/order.controller.ts): Chứa 2 hàm `createHisParaclinicOrder` và `cancelHisParaclinicItem`.
2. **Backend Routes:**
   - [`backend/src/routes/health-check.routes.ts`](file:///d:/AI/VIMES_HIS/backend/src/routes/health-check.routes.ts): Đăng ký 2 endpoint:
     - `POST /api/health-check/orders/create-his-order`
     - `POST /api/health-check/orders/cancel-his-order`
3. **Frontend Service:**
   - [`services/healthCheckService.ts`](file:///d:/AI/VIMES_HIS/services/healthCheckService.ts): Thêm 2 method `createHisParaclinicOrder` và `cancelHisParaclinicItem`.
4. **Frontend Tab Cận lâm sàng:**
   - [`modules/health-check-sync/forms/tabs/LabTab.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/tabs/LabTab.tsx):
     - Giao diện Modal 3 Panel chuẩn HIS:
       - Cột 1: Nhóm dịch vụ (`serviceGroups`).
       - Cột 2: Danh sách dịch vụ trong nhóm (`groupServices`) với nút "+ Chọn" hoặc kích đúp để đưa vào hàng chờ.
       - Cột 3: Dịch vụ đã chọn (`pendingServices`) hỗ trợ tăng giảm SL, xóa từng dòng, xóa tất cả.
     - Footer: Hiển thị tổng số lượng & tổng tiền, nút **"Áp dụng"** kích hoạt lưu vào HIS.
