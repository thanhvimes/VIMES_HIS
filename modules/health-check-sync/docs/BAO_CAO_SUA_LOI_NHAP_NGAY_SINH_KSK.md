# Báo cáo Xử lý Lỗi Nhập Ngày Sinh Tab Thông tin Hành chính KSK

## 1. Vấn đề phát sinh
- **Mô tả hiện tượng:**
  - Tại Tab **Thông tin hành chính** của phân hệ Khám sức khỏe (`modules/health-check-sync`), khi người dùng đặt con trỏ vào ô **"2. NGÀY SINH *"** để sửa (nhấn Backspace xóa hoặc gõ lại ngày sinh mới), ô nhập liệu không cho nhập/sửa bình thường, bị mất con trỏ và giao diện tự động bị chuyển đổi sang **Mẫu số 01 (Trẻ em dưới 06 tuổi)**.
  
## 2. Nguyên nhân kỹ thuật (Root Cause)
1. **Auto-switch Form trên mỗi Keystroke:**
   - Trong `modules/health-check-sync/hooks/useDynamicFormState.ts`, setter `setDob` được bọc logic tự động gọi `onChangeFormType(targetForm)` ngay bên trong hàm cập nhật state của React (`setDobState(prev => ...)`).
   - Mỗi lần người dùng nhấn phím (xóa một số năm hoặc đang gõ dở chuỗi ngày, ví dụ `15/05/20`), sự kiện `onChange` kích hoạt `setDob`. Chuỗi ngày chưa hoàn chỉnh khiến `parseDateSafe` / `new Date()` trong JavaScript suy đoán thành năm 2020 (hoặc năm gần hiện tại) $\rightarrow$ tuổi tính ra $< 6$ tuổi $\rightarrow$ hệ thống nhận định là trẻ em và tự động gọi `onChangeFormType('1')`.
2. **Unmount Form Component:**
   - Khi `onChangeFormType('1')` được kích hoạt, `HealthCheckSyncView` cập nhật `form_type = '1'`. Component `DynamicForm` ngay lập tức unmount form hiện tại và mount sang `ChildForm` (Mẫu 1) khiến ô nhập liệu bị mất focus, làm gián đoạn toàn bộ thao tác nhập liệu của người dùng.

## 3. Giải pháp đã thực hiện
1. **Loại bỏ auto-switch form trong `useDynamicFormState.ts`:**
   - Trả `setDob` về hàm `useState` tiêu chuẩn:
     ```typescript
     const [dob, setDob] = useState(initialData?.dob ? formatDateForInput(initialData.dob) : (initialData?.ngay_sinh ? formatDateForInput(initialData.ngay_sinh) : ''));
     ```
   - Đảm bảo việc nhập liệu, xóa, sửa ngày tháng năm sinh trên `FormDateInput` diễn ra độc lập, mượt mà, không bị gián đoạn hay tự ý unmount form.
2. **Hiển thị năm sinh an toàn trên Header:**
   - Tại `ChildForm.tsx`, thay thế cách tính năm sinh `new Date(dob).getFullYear()` bằng `parseDateSafe(dob)?.getFullYear() || dob?.slice(0, 4) || '---'` để đảm bảo hiển thị đúng ngay cả với các định dạng ngày `DD/MM/YYYY`.
3. **Quy trình chuyển đổi Mẫu biểu áp dụng:**
   - Việc chuyển đổi giữa các Mẫu biểu (Mẫu 1, 2, 3) được quản lý tập trung và an toàn qua Dropdown **"Mẫu biểu áp dụng"** ở góc trên bên phải màn hình (kèm hộp thoại xác nhận `ConfirmationModal` trước khi đổi) hoặc khi tìm kiếm tải hồ sơ từ danh sách đã lưu.

## 4. Kết quả kiểm thử
- **Frontend TypeScript (`npx tsc --noEmit`):** Exit code 0, 0 lỗi biên dịch.
- **Backend TypeScript (`npx tsc --noEmit`):** Exit code 0, 0 lỗi biên dịch.
- Ô nhập ngày sinh hoạt động bình thường, cho phép xóa, gõ mới, sửa đổi tự do mà không bị giật con trỏ hay tự động nhảy về Mẫu 01.
