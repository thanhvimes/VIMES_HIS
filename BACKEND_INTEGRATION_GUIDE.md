
# HƯỚNG DẪN TÍCH HỢP BACKEND (CONTRACT-FIRST STRATEGY)

Tài liệu này hướng dẫn quy trình phát triển Backend dựa trên cấu trúc Frontend đã có sẵn (Contract-First Development). Mục tiêu là đảm bảo Backend trả về dữ liệu khớp hoàn toàn với TypeScript Interface của Frontend, giảm thiểu lỗi tích hợp.

---

## 1. Chiến lược cốt lõi
Chúng ta sử dụng **Frontend Types (`src/types/*.ts`)** làm "Hợp đồng" (Contract).
*   **Quy tắc vàng:** Backend **bắt buộc** phải trả về JSON có cấu trúc giống hệt Interface đã định nghĩa ở Frontend.
*   **Lợi ích:** Không cần sửa lại UI, chỉ cần thay đổi tầng Service gọi API.

---

## 2. Lựa chọn Công nghệ (Khuyên dùng)
Để tốc độ phát triển nhanh nhất và đồng bộ nhất:
*   **Ngôn ngữ:** Node.js (TypeScript).
*   **Framework:** Express.js hoặc NestJS.
*   **Database:** PostgreSQL hoặc MongoDB.
*   **ORM:** **Prisma** (Rất quan trọng: Prisma giúp generate type từ DB khớp với TypeScript).

---

## 3. Quy trình triển khai từng Module (4 Bước)

Thực hiện tuần tự từng module (Vd: Reception -> Consultation -> Pharmacy).

### Bước 1: Định nghĩa Database Schema
Gửi Prompt sau cho AI để tạo bảng Database dựa trên Frontend Type.

**Prompt mẫu:**
> "Dựa vào file `src/types/patient.ts` (tôi sẽ cung cấp nội dung file này), hãy viết file `schema.prisma` để tạo bảng `Patient` trong Database. Đảm bảo các trường dữ liệu (tên, kiểu dữ liệu, nullable) khớp chính xác với interface TypeScript."

### Bước 2: Viết API (Controller & Route)
Sau khi có Database, yêu cầu AI viết API CRUD.

**Prompt mẫu:**
> "Sử dụng Node.js, Express và Prisma. Hãy viết file `controllers/patientController.ts` thực hiện các chức năng:
> 1. `GET /patients`: Lấy danh sách (có phân trang, tìm kiếm theo tên/mã).
> 2. `GET /patients/:id`: Lấy chi tiết.
> 3. `POST /patients`: Tạo mới.
> 4. `PUT /patients/:id`: Cập nhật.
>
> **Yêu cầu quan trọng:** Dữ liệu JSON trả về phải map đúng với interface `Patient` trong `src/types/patient.ts`."

### Bước 3: Cấu hình `apiClient` (Frontend)
Đảm bảo file `src/services/apiClient.ts` đã được cấu hình đúng `BASE_URL` trỏ về Backend (ví dụ: `http://localhost:8000/api/v1`).

### Bước 4: Đấu nối vào Frontend (Service Layer)
Cập nhật file service của module đó để chuyển từ Mock Data sang Real API.

**Prompt mẫu:**
> "Hãy cập nhật file `src/services/receptionService.ts`.
> 1. Giữ nguyên các hàm `getPatientList`, `createPatient`,...
> 2. Thay thế code trả về dữ liệu giả (mockPatients) bằng lệnh gọi `apiClient.get` hoặc `apiClient.post`.
> 3. Thêm khối `try/catch`. Nếu gọi API thất bại, hãy fallback (dự phòng) trả về dữ liệu mock để app không bị crash."

---

## 4. Lộ trình triển khai (Roadmap)

Nên làm theo thứ tự sau để đảm bảo luồng dữ liệu logic:

1.  **Module Auth (Quan trọng nhất):**
    *   Cần API Login trả về JWT Token.
    *   Token này sẽ được `apiClient` tự động gắn vào Header của các request sau.
2.  **Module Reception (Tiếp đón):**
    *   Tạo dữ liệu bệnh nhân đầu vào.
3.  **Module Consultation (Khám bệnh):**
    *   Bác sĩ lấy dữ liệu bệnh nhân từ Reception để khám.
    *   Tạo dữ liệu khám bệnh (ClinicalRecord).
4.  **Module Pharmacy/Billing (Dược/Viện phí):**
    *   Lấy dữ liệu đơn thuốc/dịch vụ từ ClinicalRecord để tính tiền/xuất thuốc.

---

## 5. Lưu ý quan trọng khi Prompting cho AI

*   **Luôn cung cấp Context:** Khi yêu cầu viết Backend cho module nào, hãy copy nội dung file `types` của module đó (ví dụ `src/types/clinical.ts`) dán vào prompt.
*   **Xử lý Mock Data:** Đừng xóa hẳn file `data.ts` (mock data). Hãy giữ nó lại để làm dữ liệu mẫu hoặc dùng khi Backend bị lỗi (Fallback mode).
*   **Naming Convention:** Yêu cầu Backend dùng `camelCase` cho tên trường JSON (ví dụ: `fullName` thay vì `full_name`) để khớp với JavaScript/React.

---

## 6. Ví dụ Code Mapper (Nếu Backend khác chuẩn)

Nếu Backend lỡ đặt tên trường khác Frontend (ví dụ Backend: `full_name`, Frontend: `fullName`), hãy yêu cầu AI viết hàm map trong Service:

```typescript
// src/services/receptionService.ts

const mapApiToPatient = (data: any): Patient => ({
  id: data.id,
  name: data.full_name, // Mapping
  dob: data.date_of_birth, // Mapping
  // ... các trường khác
});

// Trong hàm get:
const response = await apiClient.get('/patients');
return response.map(mapApiToPatient);
```
