
# HƯỚNG DẪN TÍCH HỢP BACKEND (CHIẾN LƯỢC CONTRACT-FIRST)

Tài liệu này hướng dẫn quy trình phát triển Backend dựa trên cấu trúc dữ liệu (Types) của Frontend đã có sẵn. Mục tiêu là đảm bảo Backend trả về dữ liệu khớp hoàn toàn với Frontend, giảm thiểu lỗi tích hợp và không cần sửa lại giao diện.

---

## 1. Nguyên tắc cốt lõi
Chúng ta sử dụng **Frontend Types (`src/types/*.ts`)** làm "Hợp đồng" (Contract).
*   **Quy tắc:** Backend **bắt buộc** phải trả về JSON có cấu trúc giống hệt Interface đã định nghĩa ở Frontend.
*   **Lợi ích:** Không cần sửa lại UI, chỉ cần cập nhật tầng Service để gọi API thật.

---

## 2. Công nghệ Khuyến nghị
Để tốc độ phát triển nhanh nhất và đồng bộ nhất với hệ thống hiện tại:
*   **Ngôn ngữ:** Node.js (TypeScript).
*   **Framework:** Express.js hoặc NestJS.
*   **Database:** PostgreSQL, MySQL hoặc MongoDB.
*   **ORM:** **Prisma** (Rất quan trọng: Prisma giúp generate type từ DB khớp với TypeScript).

---

## 3. Quy trình triển khai (4 Bước)

Thực hiện tuần tự từng module (Ví dụ: Reception -> Consultation -> Pharmacy).

### Bước 1: Định nghĩa Database Schema (Prompt cho AI)
Copy nội dung file type tương ứng (ví dụ `src/types/patient.ts`) và yêu cầu AI tạo Schema.

**Prompt mẫu:**
> "Dựa vào interface `Patient` trong file `src/types/patient.ts` này [DÁN CODE VÀO], hãy viết file `schema.prisma` để tạo bảng `Patient` trong Database. Đảm bảo tên trường và kiểu dữ liệu khớp 100% với Frontend."

### Bước 2: Viết API Controller (Prompt cho AI)
Yêu cầu AI viết API CRUD trả về đúng cấu trúc.

**Prompt mẫu:**
> "Sử dụng Node.js và Prisma. Hãy viết `patientController.ts` có các hàm: `getList`, `getDetail`, `create`, `update`.
> **Yêu cầu:** Dữ liệu JSON trả về phải khớp với interface `Patient` của Frontend. Nếu DB dùng `snake_case` (vd: `full_name`), hãy map sang `camelCase` (`fullName`) trước khi trả về."

### Bước 3: Cấu hình Môi trường Frontend
Đảm bảo file `.env` hoặc biến môi trường đã trỏ đúng về Backend.
Cập nhật file `src/services/apiClient.ts`:
```typescript
const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
```

### Bước 4: Đấu nối Service (Thay thế Mock Data)
Cập nhật các file trong `src/services/` để gọi API thật.

**Ví dụ với `src/services/receptionService.ts`:**
```typescript
// TRƯỚC (Mock):
getPatientList: async () => {
    return mockPatients; 
}

// SAU (Real API):
getPatientList: async () => {
    // Gọi qua apiClient đã cấu hình sẵn Token/Interceptors
    return await apiClient.get<Patient[]>('/patients');
}
```

---

## 4. Lộ trình (Roadmap)

1.  **Ưu tiên 1: Authentication**
    *   Backend: API `/auth/login` trả về `{ token, user }`.
    *   Frontend: Cập nhật `authService.ts`.
2.  **Ưu tiên 2: Reception (Tiếp đón)**
    *   Backend: CRUD bảng `Patient`, `Queue`.
    *   Frontend: Cập nhật `receptionService.ts`.
3.  **Ưu tiên 3: Consultation (Khám bệnh)**
    *   Backend: Bảng `ClinicalRecord`, `Prescription`.
    *   Frontend: Cập nhật `consultationService.ts`.

---

## 5. Xử lý Lỗi Build & Type
Khi tích hợp, nếu gặp lỗi TypeScript:
1.  Kiểm tra lại file `src/types/index.ts` xem có export trùng lặp không.
2.  Đảm bảo Backend không trả về `null` cho các trường bắt buộc (hoặc Frontend phải sửa type thành `field?: string`).
