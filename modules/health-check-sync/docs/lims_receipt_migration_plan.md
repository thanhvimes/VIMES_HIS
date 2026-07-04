# Kế hoạch chuyển đổi nghiệp vụ Giao nhận mẫu từ HIS (C++) sang Web (Node.js & React)

Tài liệu này phân tích chi tiết mã nguồn C++ của module `LIMSReceiptSampleManage` trong hệ thống HIS và đề xuất phương án chuyển đổi logic, các câu lệnh truy vấn dữ liệu sang hệ thống Web mới.

---

## 1. Phân tích nghiệp vụ & Luồng xử lý C++

### 1.1 Khởi tạo màn hình (`OnInitializeComponents`)
- Định cấu hình lưới dữ liệu bệnh nhân (`m_wndListPatient`) gồm các cột: `DocumentNo`, `Patient Name`, `Barcode`, `TG lấy mẫu`, `Người lấy mẫu`, `Ghi chú`.
- Khởi tạo 2 danh sách mẫu:
  - `m_wndListPending` (Mẫu chờ nhận): Chứa các ống nghiệm của bệnh nhân chưa nhận mẫu (`receive <> 'Y'`).
  - `m_wndListApproved` (Mẫu đã nhận): Chứa các ống nghiệm đã được nhận (`receive = 'Y'`).

### 1.2 Tải danh sách bệnh nhân (`OnListPatientLoadData`)
- Truy vấn bảng `lims_order_extra` kết hợp với view `hms_pacs_test_view` để lấy những bệnh nhân đã lấy mẫu trong khoảng thời gian tìm kiếm:
  ```sql
  select distinct 
      limsoe_barcode as barcode,
      case when hpc_orderdate > limsoe_sample_date then true else false end as err0,
      case when (COALESCE(limsoe_receive_date,now()) - limsoe_sample_date > INTERVAL '60 MINUTE') then true else false end as err1,
      limsoe_docno as docno,
      get_patientname(limsoe_docno) as patientname,
      limsoe_sample_date,
      limsoe_sample_by
  from lims_order_extra
  LEFT JOIN hms_pacs_test_view 
      on (hpc_orderid = limsoe_orderid and hpc_docno = limsoe_docno)
  where limsoe_sample = 'Y'
    and limsoe_sample_date between timestamp ':startDate 00:00:00' and timestamp ':endDate 23:59:59'
    [and limsoe_barcode = :barcode OR limsoe_docno = :docno]
  order by barcode
  ```
- **Lọc theo trạng thái**:
  - Trạng thái `M` (Chưa nhận đủ mẫu): kiểm tra sự tồn tại (`EXISTS`) của ống nghiệm có `receive <> 'Y'`.
  - Trạng thái `A` (Đã nhận đủ mẫu): kiểm tra không tồn tại (`NOT EXISTS`) ống nghiệm chưa nhận.

### 1.3 Tải chi tiết mẫu của bệnh nhân (`OnListPendingLoadData` & `OnListApprovedLoadData`)
- Truy vấn bảng `hms_testorder_ong` để hiển thị danh sách các ống nghiệm của bệnh nhân được chọn:
  ```sql
  SELECT 
      ong_type,
      barcode,
      item_list,
      order_list,
      id as idx,
      COUNT(*) AS qty
  FROM hms_testorder_ong
  WHERE barcode = :barcode
    AND docno = :docno
    AND coalesce(receive,'N') <> 'Y' -- (Hoặc receive = 'Y' đối với danh sách đã duyệt)
  GROUP BY ong_type, barcode, item_list, order_list, idx
  ```
- Đồng thời lấy chi tiết dịch vụ xét nghiệm của từng ống bằng cách nối sang `hms_testorderline` và `hms_fee_list`:
  ```sql
  SELECT * from (
      select hfl_name as name, hpcl_comment as comment, hpcl_orderlineid, hpcl_orderid   
      from hms_testorderline 
      LEFT JOIN hms_fee_list on (hfl_feeid = hpcl_itemid) 
      where hpcl_orderid in (:order_list) and hpcl_itemid in (:item_list) and hpcl_hasfee='Y'
      UNION ALL 
      select hfl_name as name, hpcl_comment as comment, hpcl_orderlineid, hpcl_orderid   
      from hms_pacsorderline 
      LEFT JOIN hms_fee_list on (hfl_feeid = hpcl_itemid) 
      where hpcl_orderid in (:order_list) and hpcl_itemid in (:item_list) and hpcl_hasfee='Y'
  ) as tbl order by hpcl_orderlineid
  ```

### 1.4 Xác nhận / Hủy nhận mẫu (`OnProcessOng`)
- Gọi hàm thủ tục PostgreSQL:
  ```sql
  select lims_receive_testorder_ong(nID, CurrentUser, szStatus, szCancelReason, szSampleStatus)
  ```
  - **nID**: ID của dòng ống nghiệm trong bảng `hms_testorder_ong`.
  - **CurrentUser**: Username đang thực hiện nhận mẫu.
  - **szStatus**: `'Y'` (Nhận mẫu), `'C'` (Hủy nhận mẫu/Trả mẫu).
  - **szCancelReason**: Lý do hủy nếu hủy nhận.

---

## 2. Kế hoạch thiết kế API Backend mới (Node.js)

Chúng ta sẽ tạo các endpoint tương ứng trong backend để cung cấp dữ liệu cho React Frontend:

### 2.1 API Lấy danh sách bệnh nhân đã lấy mẫu
* **Endpoint**: `GET /api/health-check-sync/samples/patients`
* **Query Parameters**:
  - `startDate`: string (YYYY-MM-DD)
  - `endDate`: string (YYYY-MM-DD)
  - `status`: `'M' | 'A' | ''` (Chưa nhận đủ / Đã nhận đủ / Tất cả)
  - `search`: string (Tìm theo Barcode hoặc Số hồ sơ)
* **SQL Thực thi**: Áp dụng câu truy vấn ở mục **1.2**.

### 2.2 API Lấy danh sách ống mẫu & chi tiết xét nghiệm của bệnh nhân
* **Endpoint**: `GET /api/health-check-sync/samples/tubes`
* **Query Parameters**:
  - `docNo`: string
  - `barcode`: string
* **SQL Thực thi**: Lấy các dòng từ `hms_testorder_ong` cùng với thông tin chi tiết các xét nghiệm tương ứng như mục **1.3**.

### 2.3 API Cập nhật trạng thái nhận/hủy nhận mẫu
* **Endpoint**: `POST /api/health-check-sync/samples/process`
* **Payload**:
  ```json
  {
    "tubeIds": [123, 456],
    "status": "Y" | "C",
    "cancelReason": "Lý do hủy nếu có",
    "sampleStatus": "Tình trạng mẫu nếu có"
  }
  ```
* **SQL Thực thi**: Gọi hàm `SELECT lims_receive_testorder_ong($1, $2, $3, $4, $5)` trong vòng lặp transaction.

---

## 3. Bản đồ chuyển đổi giao diện sang e-MCH Web Style

| Giao diện HIS (C++) | Giao diện Web (e-MCH React) | Trạng thái hiện tại trên Web |
| :--- | :--- | :--- |
| Danh sách bệnh nhân trái (`m_wndListPatient`) | **Khung phía trên bên phải** (Danh sách bệnh nhân trong phiếu) | Đã dựng UI tĩnh và mock data liên kết |
| Bộ lọc thời gian, barcode, trạng thái | **Khung bộ lọc bo tròn** ở cột trái | Đã dựng xong UI hoàn chỉnh |
| Danh sách mẫu chờ duyệt (`m_wndListPending`) | **Danh sách chưa nhận** (Hiển thị ở cột trái/phải tùy cấu hình) | Sẽ hiển thị ở danh sách chính |
| Danh sách mẫu đã duyệt (`m_wndListApproved`) | **Danh sách đã xác nhận** | Cập nhật qua nút trạng thái/action |
| Chi tiết chỉ định Fee Name | **Khung Fee Name** ở giữa bên phải | Đã dựng xong UI hiển thị động |
| Mẫu đã hủy | **Khung Mẫu đã hủy** ở góc dưới bên phải | Đã dựng xong UI hiển thị |
| Nút "Nhận mẫu (F2)", "Hủy nhận mẫu" | **Nút hành động góc dưới** | Đã dựng xong các nút |
