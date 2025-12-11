
# HƯỚNG DẪN ĐÓNG GÓP & QUY TRÌNH PHÁT TRIỂN (CONTRIBUTING GUIDELINES)

Chào mừng bạn đến với đội ngũ phát triển dự án **Clinic Management System**.
Để đảm bảo chất lượng code, hiệu suất làm việc và **tính bảo mật tuyệt đối** của hệ thống, tất cả thành viên bắt buộc phải tuân thủ các quy định dưới đây.

---

## 1. NGUYÊN TẮC BẢO MẬT & DỮ LIỆU (QUAN TRỌNG) 🔒

Đây là "Luật Bất Biến" của dự án. Vi phạm các điều này sẽ dẫn đến việc chấm dứt hợp đồng ngay lập tức và chịu trách nhiệm pháp lý.

1.  **Không sử dụng Dữ liệu thật (No Real Data):**
    *   Tuyệt đối **KHÔNG** sao chép, import dữ liệu bệnh nhân/khách hàng thật vào môi trường Local/Development.
    *   Chỉ sử dụng dữ liệu giả lập (Mock Data) có sẵn trong các file `data.ts` hoặc tạo dữ liệu rác để test.

2.  **Bảo vệ API Key & Credentials:**
    *   Không bao giờ commit file `.env` chứa key thật lên Git.
    *   Chỉ sử dụng các Key môi trường Development/Sandbox được cấp phát.
    *   Nếu phát hiện Key bị lộ, phải báo ngay cho Tech Lead để thu hồi (revoke).

3.  **Phạm vi công việc (Scope of Work):**
    *   Chỉ chỉnh sửa các file/module được phân công trong Ticket/Task.
    *   Không tò mò, truy cập hoặc sửa đổi các module lõi (Core System, Authentication, Billing) nếu không có yêu cầu.

---

## 2. MÔI TRƯỜNG PHÁT TRIỂN

### Khuyến nghị: Cloud Development
Chúng tôi khuyến khích (hoặc bắt buộc tùy role) sử dụng môi trường Code trên Cloud (GitHub Codespaces / Gitpod) để đảm bảo môi trường đồng nhất và an toàn.

### Local Development
Nếu được phép code trên máy cá nhân:
1.  **Node Version:** Sử dụng bản LTS mới nhất (v18+).
2.  **Package Manager:** Sử dụng `npm` (hoặc `yarn` nếu quy định). Không dùng `pnpm` nếu chưa thống nhất để tránh lock file conflict.
3.  **Setup:**
    ```bash
    git clone [REPO_URL]
    npm install
    cp .env.example .env  # Chỉ điền key môi trường DEV
    npm run dev
    ```

---

## 3. QUY TRÌNH GIT (GIT FLOW) 🌿

Chúng ta áp dụng quy trình chặt chẽ để kiểm soát code đi vào hệ thống.

### Nhánh (Branches)
*   `main`: Nhánh Production. **Cấm push trực tiếp (Protected Branch).**
*   `dev` (hoặc `develop`): Nhánh tích hợp chính.
*   **Nhánh tính năng (Feature Branches):** Tạo từ `dev`.
    *   Cú pháp: `type/tên-module/tên-task`
    *   Ví dụ:
        *   `feat/pharmacy/add-drug-modal` (Tính năng mới)
        *   `fix/reception/validate-phone` (Sửa lỗi)
        *   `style/dashboard/dark-mode` (Giao diện)

### Quy tắc Commit (Conventional Commits)
Viết commit message rõ ràng bằng tiếng Anh hoặc tiếng Việt (thống nhất trong team):
*   `feat`: Tính năng mới.
*   `fix`: Sửa lỗi.
*   `ui`: Thay đổi giao diện, CSS (không đổi logic).
*   `refactor`: Sắp xếp lại code.
*   **Ví dụ:** `feat(pharmacy): thêm chức năng cảnh báo thuốc hết hạn`

---

## 4. QUY CHUẨN CODE (CODING STANDARDS) 💻

### TypeScript
*   **Không dùng `any`:** Phải định nghĩa Type/Interface rõ ràng cho mọi biến và props.
*   **Interface:** Đặt trong thư mục `src/types/`. Tận dụng lại các type đã có (Patient, Drug, Bill...).

### React & Structure
*   **Functional Components:** 100% dùng Hooks. Không dùng Class Component.
*   **File Naming:** PascalCase cho Component (`UserProfile.tsx`), camelCase cho helper/hook (`useAuth.ts`).
*   **Styling:** Sử dụng **Tailwind CSS**. Hạn chế viết CSS thuần hoặc inline-style trừ khi cần thiết.

### Modular Architecture
*   Code của module nào đặt trong thư mục module đó (`src/modules/ten-module/`).
*   Các component dùng chung cho toàn dự án đặt tại `src/components/shared/`.

---

## 5. QUY TRÌNH NỘP CODE (PULL REQUEST - PR) 🚀

Code chỉ được merge vào dự án khi thỏa mãn các điều kiện sau:

1.  **Sync với nhánh chính:** Trước khi tạo PR, hãy `git pull origin dev` và resolve conflict tại local.
2.  **Tạo PR:**
    *   Title: Mô tả ngắn gọn (VD: [Pharmacy] Thêm tính năng nhập kho).
    *   Description: Liệt kê các thay đổi, đính kèm **Screenshot/Video** màn hình kết quả (Bắt buộc với task UI).
3.  **Review:**
    *   Assign cho Tech Lead hoặc PM review.
    *   Code phải được Approve mới được Merge.
4.  **No Logic Bombs:** PR không được chứa các đoạn code thừa, `console.log` không cần thiết, hoặc code bị comment out.

---

## 6. DANH SÁCH KIỂM TRA TRƯỚC KHI PUSH (PRE-PUSH CHECKLIST) ✅

Trước khi commit, hãy tự hỏi:
- [ ] Tôi có sửa file nào nằm ngoài phạm vi task không?
- [ ] Tôi có dùng `any` bừa bãi không?
- [ ] Giao diện có bị vỡ trên Mobile không? (Responsive check)
- [ ] Tôi đã xóa hết `console.log` debug chưa?
- [ ] Tôi có vô tình commit key bảo mật nào không?

---
**Cảm ơn sự đóng góp chuyên nghiệp của bạn!**
