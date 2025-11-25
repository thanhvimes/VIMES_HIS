# TÀI LIỆU KỸ THUẬT: HỆ THỐNG QUẢN LÝ PHÒNG KHÁM (CLINICMS)

## 1. Tổng quan Kiến trúc (Architecture Overview)

Dự án được xây dựng theo mô hình **Modular Monolith trên Frontend** (SPA - Single Page Application).

*   **Nền tảng:** React 19 (sử dụng Hooks & Functional Components).
*   **Ngôn ngữ:** TypeScript (Strict typing).
*   **Build Tool:** Vite.
*   **Styling:** Tailwind CSS (Utility-first).
*   **Routing:** React Router v6/v7 (Nested Routes).
*   **State Management:** React Context API (cho Theme, Auth, Notification).

### Cấu trúc thư mục
Hệ thống chia tách theo **Chức năng nghiệp vụ (Modules)** thay vì loại file.

```text
src/
├── components/       # UI Components dùng chung (Button, Input, Icons, Modal...)
├── contexts/         # Global State (ThemeContext, PdfPreviewContext...)
├── modules/          # CÁC PHÂN HỆ CHỨC NĂNG (Core Business Logic)
│   ├── reception/    # Tiếp đón, Hàng đợi, Đăng ký
│   ├── consultation/ # Khám bệnh, Bệnh án điện tử (EMR)
│   ├── surgery/      # Quản lý Phẫu thuật - Thủ thuật
│   ├── lab-results/  # Xét nghiệm (LIS Simulator)
│   ├── imaging/      # CĐHA (PACS/RIS Simulator)
│   ├── pharmacy/     # Dược & Kho
│   ├── billing/      # Viện phí
│   ├── equipment/    # Quản lý thiết bị y tế
│   ├── record-storage/# Lưu trữ hồ sơ
│   └── admin/        # Cấu hình hệ thống
├── services/         # Giao tiếp API & Logic xử lý dữ liệu (Mock/Simulations)
├── types/            # Định nghĩa TypeScript Interfaces/Types
└── utils/            # Các hàm tiện ích
```

---

## 2. Chi tiết các Module Nghiệp vụ

### 2.1. Module Reception (Tiếp đón)
*Path: `/reception`*
*   **`QueueManagementView.tsx`**: Quản lý hàng đợi.
    *   **Logic:** Sử dụng `speechSynthesis` để đọc loa gọi tên.
    *   **Chế độ TV:** Hiển thị fullscreen cho màn hình chờ.
    *   **State:** Quản lý mảng `queues` (Đang chờ, Đang khám, Đã xong).
*   **`RegistrationView.tsx`**: Đăng ký bệnh nhân.
    *   **Logic:** Parse chuỗi QR code từ thẻ BHYT/CCCD (hàm `parseScannedData`).
    *   **UI:** Form nhập liệu thông tin hành chính.

### 2.2. Module Consultation (Khám bệnh) - **Core Module**
*Path: `/consultation`*
*   **`PatientRecordView.tsx`**: Container chính, giữ ID bệnh nhân và điều hướng Tabs.
*   **Các Tabs (trong `views/tabs/`):**
    *   **`ChartView.tsx`**: Dashboard sức khỏe (Sinh hiệu, Biểu đồ huyết áp dùng `recharts`).
    *   **`ExamineView.tsx`**: Khám lâm sàng.
        *   Tích hợp **Gemini AI** (`services/geminiService.ts`) để gợi ý chẩn đoán từ triệu chứng.
        *   Sử dụng `Combobox` để tra cứu ICD10.
    *   **`LabView.tsx`**: Chỉ định & Xem kết quả xét nghiệm. Render các Template kết quả (HTML/CSS).
    *   **`OperationView.tsx`**: Chỉ định Phẫu thuật/Thủ thuật.
    *   **`MedicationView.tsx`**: Kê đơn thuốc. Tự động tính giá, check tương tác thuốc (mock).
    *   **`DocumentsView.tsx`**: Soạn thảo văn bản hành chính (Giấy chuyển viện, Cam kết...). Sử dụng `DocumentTree` để quản lý file.

### 2.3. Module Surgery (Phẫu thuật)
*Path: `/surgery`*
*   **`SchedulerBoardView.tsx`**: Bảng lịch mổ dạng Gantt Chart.
    *   **Logic:** Tính toán vị trí CSS (`left`, `width`) dựa trên giờ bắt đầu và thời lượng ca mổ.
*   **`SurgeryDetailModal.tsx`**: Chi tiết ca mổ.
    *   Chứa **Bảng kiểm an toàn phẫu thuật** (Safety Checklist).
    *   Quản lý tiêu hao vật tư (`ConsumableInput`).

### 2.4. Module Lab Results (LIS) & Imaging (RIS/PACS)
*Path: `/lab-results`, `/imaging-results`*
*   **`LabConnectionView.tsx`**: Giả lập Middleware kết nối máy xét nghiệm.
    *   **Logic:** `services/lisService.ts` parse các bản tin HL7 và ASTM thô thành JSON hiển thị lên màn hình.
*   **`MockDicomViewer.tsx`**: Trình xem ảnh y tế giả lập.
    *   Hỗ trợ công cụ: Zoom, Pan, Window/Level (chỉnh sáng tối), Đo thước kẻ (vẽ SVG overlay).

### 2.5. Module Pharmacy & Equipment
*   **Pharmacy:** Quản lý nhập/xuất/tồn kho thuốc. Cảnh báo thuốc hết hạn (tính toán ngày tháng).
*   **Equipment:** Quản lý tài sản, lịch bảo trì thiết bị y tế.

---

## 3. Các Component dùng chung (Shared UI)

Nằm trong `src/components/`:

1.  **`Combobox.tsx`**:
    *   Dropdown tìm kiếm nâng cao.
    *   Hỗ trợ hiển thị nhiều cột (Mã, Tên, Giá...).
    *   Highlight từ khóa tìm kiếm.
2.  **`PdfPreviewModal.tsx`**:
    *   Dùng `react-pdf` để hiển thị file.
    *   Tích hợp `SignaturePad` (canvas) để ký điện tử trực tiếp lên tài liệu.
3.  **`ChatWidget.tsx`**:
    *   Cửa sổ chat nội bộ. Hỗ trợ lọc user theo Khoa/Phòng.
4.  **`Icons.tsx`**: Tập hợp toàn bộ SVG Icon của hệ thống.

---

## 4. Services & Data Layer

Hệ thống hiện tại sử dụng Mock Data nhưng được cấu trúc để dễ dàng thay thế bằng API thật.

*   **`services/geminiService.ts`**:
    *   Giao tiếp với Google Gemini API.
    *   Hàm `getAISuggestions`: Gửi context bệnh nhân -> Nhận JSON gợi ý chẩn đoán.
*   **`services/lisService.ts`**:
    *   Parser chuyên dụng cho các bản tin y tế (HL7, ASTM).
    *   Giả lập luồng dữ liệu 2 chiều (Bidirectional) với máy xét nghiệm.
*   **`services/consultationService.ts`**:
    *   Giả lập CRUD dữ liệu bệnh án.

---

## 5. Luồng dữ liệu quan trọng (Data Flow)

**Ví dụ: Quy trình Kê đơn thuốc**
1.  **User:** Nhập tên thuốc vào `Combobox` tại `MedicationView`.
2.  **Component:** `Combobox` lọc `drugList` (từ `catalogs.ts`).
3.  **Action:** Chọn thuốc -> Gọi hàm `handleAddDrug`.
4.  **State:** Cập nhật `currentPrescription.items`. Tự động tính `totalPrice`.
5.  **Render:** Danh sách thuốc cập nhật lại trên giao diện.
6.  **Save:** Bấm Lưu -> Gọi API giả lập -> Chuyển trạng thái đơn thuốc sang `confirmed`.

---

## 6. Định hướng mở rộng (Next Steps)

1.  **Backend Integration:** Thay thế các hàm trong `services/` bằng `axios/fetch` gọi tới Backend thực (Node.js/.NET/Java).
2.  **Authentication:** Tích hợp JWT, Login thực tế và Phân quyền (RBAC).
3.  **Real-time:** Dùng WebSocket cho Chat và cập nhật trạng thái Hàng đợi/Phòng mổ.
