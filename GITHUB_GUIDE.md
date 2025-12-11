
# HƯỚNG DẪN QUẢN LÝ DỰ ÁN TRÊN GITHUB (DÀNH CHO MANAGER)

Tài liệu này giúp anh nắm bắt cách điều hành dự án phần mềm trên GitHub mà không cần phải viết code.

---

## 1. CÁC KHÁI NIỆM CỐT LÕI (DỄ HÌNH DUNG)

Hãy hình dung dự án của chúng ta như một **Bệnh viện đang xây dựng**:

| Khái niệm GitHub | Hình dung thực tế | Ý nghĩa |
| :--- | :--- | :--- |
| **Repository (Repo)** | **Tòa nhà Bệnh viện** | Nơi chứa tất cả tài sản: Code, hình ảnh, tài liệu. |
| **Branch (Nhánh)** | **Bản sao thiết kế** | Khi muốn sửa Phòng Khám, ta không sửa thẳng lên tòa nhà đang hoạt động. Ta copy bản vẽ ra (tạo nhánh), sửa trên giấy trước. |
| **Main (Master)** | **Bệnh viện đang vận hành** | Phiên bản chính thức, hoàn hảo, đang chạy cho khách hàng dùng. Tuyệt đối không sửa trực tiếp. |
| **Commit** | **Dấu đóng mộc** | Mỗi khi nhân viên làm xong 1 việc nhỏ (ví dụ: vẽ xong cái cửa), họ lưu lại. Đó là 1 commit. |
| **Pull Request (PR)** | **Phiếu trình ký** | Nhân viên làm xong việc ở bản nháp, họ gửi "Phiếu trình ký" yêu cầu anh duyệt để nhập cái mới đó vào Bệnh viện chính. |
| **Issue** | **Phiếu yêu cầu / Sự cố** | Một đầu việc cần làm (VD: "Làm module Dược") hoặc báo lỗi (VD: "Lỗi không in được hóa đơn"). |

---

## 2. QUY TRÌNH QUẢN LÝ CÔNG VIỆC (QUAN TRỌNG NHẤT)

Đây là nơi anh sẽ làm việc hàng ngày để giao việc.

### Bước 1: Tạo đầu việc (Issues)
Đừng giao việc qua miệng hay Zalo, hãy đưa lên GitHub.

1.  Vào tab **Issues** -> Chọn **New Issue**.
2.  **Tiêu đề:** Ghi rõ ràng (VD: *Thiết kế giao diện màn hình Thu ngân*).
3.  **Mô tả:** Ghi chi tiết yêu cầu của anh.
    *   *Ví dụ:* "Cần có ô nhập tiền khách đưa, tự động tính tiền thừa. Nút 'Thanh toán' phải to, màu xanh."
4.  **Assignees (Người thực hiện):** Chọn nhân viên (Avatar bên phải).
5.  **Submit New Issue**.

### Bước 2: Theo dõi tiến độ (Projects / Kanban)
GitHub có bảng Kanban (giống Trello) để anh nhìn toàn cảnh.

1.  Vào tab **Projects** -> Tạo Project mới (Chọn dạng **Board**).
2.  Tạo 3 cột: **To Do** (Cần làm), **In Progress** (Đang làm), **Done** (Đã xong).
3.  Kéo các **Issues** ở Bước 1 vào cột **To Do**.
4.  Khi nhân viên làm, họ sẽ kéo sang **In Progress**. Anh nhìn vào là biết ai đang làm gì.

---

## 3. QUY TRÌNH DUYỆT NGHIỆM THU (PULL REQUEST - PR)

Đây là bước anh kiểm soát chất lượng và bảo vệ code. **Tuyệt đối không cho nhân viên tự ý đưa code vào hệ thống chính.**

### Kịch bản:
Nhân viên A đã làm xong tính năng "Quản lý kho Dược". Trên GitHub sẽ hiện một thông báo: *"Nhân viên A created a Pull Request"*.

### Việc anh cần làm:
1.  Bấm vào tab **Pull Requests**.
2.  Chọn phiếu yêu cầu của Nhân viên A (VD: *"Feat: Hoàn thiện module nhập kho"*).
3.  **Tab "Files changed":** Anh có thể xem họ đã sửa những gì (Màu xanh là thêm mới, màu đỏ là xóa đi).
    *   *Mẹo:* Dù không hiểu code sâu, anh hãy lướt xem họ có viết chú thích (comment) không, code có gọn gàng không.
4.  **Review (Đánh giá):**
    *   Nếu tốt: Bấm nút **Merge pull request** (Đồng ý sáp nhập). -> *Code của họ chính thức trở thành 1 phần của dự án.*
    *   Nếu chưa tốt: Viết bình luận (VD: *"Em ơi, chỗ này thiếu tính năng cảnh báo thuốc hết hạn rồi"*). -> *Nhân viên A phải về sửa lại và commit tiếp vào PR này.*

---

## 4. THIẾT LẬP BẢO VỆ (RÀO CHẮN)

Để tránh rủi ro nhân viên lỡ tay xóa code hoặc phá hỏng hệ thống.

1.  Vào **Settings** (Của Repo) -> **Branches**.
2.  Mục **Branch protection rules** -> Chọn **Add rule**.
3.  Branch name pattern: `main` (Đây là nhánh chính).
4.  Tích vào:
    *   [x] **Require a pull request before merging:** Bắt buộc phải tạo phiếu trình ký, không được tự ý sửa.
    *   [x] **Require approvals:** Cần ít nhất 1 người (là anh hoặc Tech Lead) duyệt mới được vào.
5.  Bấm **Create**.

---

## 5. VÍ DỤ MỘT NGÀY LÀM VIỆC CỦA ANH

**8:00 AM:** Anh mở GitHub, vào tab **Projects**.
*   Anh thấy task "Làm màn hình Đăng nhập" đang ở cột **Done**.
*   Anh thấy task "Làm màn hình Bác sĩ" đang ở cột **In Progress** (do nhân viên B làm).

**8:15 AM:** Anh vào tab **Pull Requests**.
*   Thấy có 1 yêu cầu từ nhân viên A: *"Xin duyệt màn hình Đăng nhập"*.
*   Anh bấm vào xem, thấy giao diện chụp màn hình họ gửi kèm đẹp, đúng ý.
*   Anh bấm **Merge**. -> *Xong, tính năng Đăng nhập đã chính thức hoàn thành.*

**9:00 AM:** Anh nhận ra cần thêm tính năng "Báo cáo doanh thu theo giờ".
*   Anh vào tab **Issues** -> **New Issue**.
*   Ghi yêu cầu: "Anh cần báo cáo dạng biểu đồ cột, xem được theo từng khung giờ trong ngày."
*   Assign cho nhân viên C (chuyên làm báo cáo).

**Kết quả:** Anh không viết 1 dòng code nào, nhưng anh nắm toàn bộ tiến độ, chất lượng và luồng công việc của dự án.

---
**Chúc anh quản lý dự án thành công!**
