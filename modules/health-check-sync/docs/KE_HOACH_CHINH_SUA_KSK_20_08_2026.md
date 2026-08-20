# KẾ HOẠCH CHỈNH SỬA PHÂN HỆ KHÁM SỨC KHỎE (20/08/2026)

**Căn cứ tài liệu yêu cầu:** Phản hồi chỉnh sửa bản in Khám sức khỏe (`KSK_DinhKy_26395316.pdf`).

---

## 1. Tổng hợp 5 yêu cầu chỉnh sửa trọng tâm

| STT | Nội dung yêu cầu phản hồi | Nguyên nhân kỹ thuật | Giải pháp xử lý |
| :---: | :--- | :--- | :--- |
| **1** | **Dữ liệu huyết áp ở phần Thể lực đang không hiển thị trên bản in** | Trong `PrintFormMau3.tsx`, `clinical.huyet_ap` & `clinical.bp` rỗng do dữ liệu được lưu dưới dạng `examination.blood_pressure` và `extra.huyet_ap`. | Trích xuất huyết áp đa nguồn (`examination.blood_pressure`, `extra.huyet_ap`, `clinical.blood_pressure`, `clinical.huyet_ap`, `clinical.bp`). |
| **2** | **Bị vỡ giao diện khi có nhiều dòng, căn chỉnh để chuyển trang** | Trang 3 Mẫu 3 bị cố định 1 trang tĩnh. Khi có nhiều dịch vụ cận lâm sàng hoặc nội dung dài, bảng bị tràn quá chiều cao khổ A4 (297mm). Trang 2 có padding hàng cao dễ tràn khi mô tả dài. | Xây dựng cơ chế **phân trang động (Dynamic Pagination)** cho Cận lâm sàng & Kết luận (tự động chia Trang 3, 4, ... và hiển thị số trang `Trang X/N`). Tối ưu chiều cao hàng Trang 2. |
| **3** | **Phần chữ ký đang không đủ theo bác sỹ khám** | Khóa chuyên khoa con của Nội khoa (`circulatory`, `respiratory`, v.v.) chưa được map về `internal` trong `resolveSpecialtyDoctorName` và `hasSpecialtyExamined`. Các chuyên khoa khác khi bác sĩ khám chưa có ảnh chữ ký thì chưa in họ tên in hoa. | Hoàn thiện bảng ánh xạ chuyên khoa đầy đủ. Khi đã khám: hiển thị chữ ký số/ảnh nếu có, hoặc khoảng trống ký tay kèm họ tên bác sĩ in hoa rõ ràng bên dưới. |
| **4** | **Khám mỗi Nội khoa nhưng các chuyên khoa khác vẫn có dữ liệu "Bình thường" trong khi không khám** | Nhiều trường chuyên khoa trong `PrintFormMau3.tsx` có chuỗi fallback gán cứng là `'Bình thường'` dù bác sĩ chưa từng khám. | Xóa bỏ toàn bộ fallback gán cứng `'Bình thường'`. Chuyên khoa nào chưa khám thì để trống hoàn toàn (kết quả, phân loại, chữ ký). |
| **5** | **Bỏ chữ "Bệnh Viện Đa Khoa Tỉnh" chỗ phần ký đi** | Dưới ô ký "ĐẠI DIỆN CƠ SỞ KCB" đang in thêm biến `{hospitalName}` gây thừa thãi. | Xóa bỏ dòng `{hospitalName}` dưới ô ký của đại diện cơ sở KCB để chừa khoảng trống thoáng cho việc ký tay và đóng dấu. |

---

## 2. Kế hoạch chi tiết theo từng tệp

1. **[`modules/health-check-sync/forms/PrintFormMau3.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintFormMau3.tsx)**:
   - Sửa hàm hiển thị Huyết áp Thể lực.
   - Bỏ toàn bộ chuỗi `'Bình thường'` gán cứng ở các chuyên khoa khi chưa có kết quả khám.
   - Bổ sung mapping đầy đủ cho các chuyên khoa Nội khoa & chuyên khoa lẻ để lấy đúng tên và chữ ký bác sĩ phụ trách.
   - Xóa bỏ tên cơ sở y tế bên dưới ô ký của Đại diện CSKCB.
   - Thêm cơ chế chia trang động cho danh sách Cận lâm sàng & Kết luận.
2. **[`modules/health-check-sync/forms/PrintFormMau2.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintFormMau2.tsx)**:
   - Rà soát đồng bộ hóa để đảm bảo Mẫu 2 cũng hiển thị chính xác huyết áp và không khai khống dữ liệu chuyên khoa.
3. **[`modules/health-check-sync/forms/PrintForm.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintForm.tsx)**:
   - Đảm bảo việc xuất PDF qua `html2canvas` và `jsPDF` render chuẩn xác từng trang A4 động.

---

## 3. Kế hoạch kiểm thử & nghiệm thu

- [ ] Bản in Mẫu 3 hiển thị đầy đủ Huyết áp (mmHg) tại mục Khám Thể Lực.
- [ ] Khi chỉ nhập khám Nội khoa: các chuyên khoa khác để trống hoàn toàn, không xuất hiện chữ "Bình thường", không có phân loại và chữ ký thừa.
- [ ] Khi khám đầy đủ: hiển thị chính xác tên bác sĩ từng chuyên khoa và chữ ký (nếu có).
- [ ] Khi có nhiều dịch vụ cận lâm sàng (từ 5 - 15 dịch vụ): hệ thống tự động tách trang A4 mượt mà, không vỡ layout, số trang hiển thị chuẩn xác `Trang 1/N ... Trang N/N`.
- [ ] Ô ký bên trái "ĐẠI DIỆN CƠ SỞ KCB" không còn chữ tên bệnh viện thừa ở phía dưới.
