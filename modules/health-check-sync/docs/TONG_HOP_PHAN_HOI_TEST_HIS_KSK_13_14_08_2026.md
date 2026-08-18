# Tổng hợp phản hồi kiểm thử HIS ↔ KSK

Ngày tổng hợp: 15/08/2026  
Nguồn phản hồi: người dùng kiểm thử ngày 13/08/2026 và 14/08/2026.

## 1. Mục tiêu

Rà soát và xử lý các sai lệch khi lấy hồ sơ từ HIS sang module Khám sức khỏe, đặc biệt ở các nhóm:

- Tiền sử bệnh và mã ICD-10.
- Thông tin hành chính, đối tượng và thời gian khám.
- Kết quả cận lâm sàng: X-quang, siêu âm, xét nghiệm.
- Chức năng sống và dấu hiệu sinh tồn.
- Kết luận khám bệnh.
- Khóa/mở khóa trạng thái ký số và gửi cổng.
- Kiểm tra hồ sơ miễn giảm còn hiệu lực khi tạo hồ sơ mới.

## 2. Bảng tổng hợp phản hồi

| Mã | Ngày | Nội dung phản hồi | Phân hệ liên quan | Mức độ | Trạng thái ban đầu |
|---|---|---|---|---|---|
| KSK-HIS-001 | 13/08 | Tiền sử bản thân trên HIS là văn bản gõ tay, KSK yêu cầu mã ICD-10 nên không đồng bộ được | HIS integration, tiền sử, ICD-10 | Cao | Chưa xử lý |
| KSK-HIS-002 | 13/08 | Lấy hồ sơ từ HIS sang chưa có địa chỉ hành chính | HIS integration, hành chính | Cao | Chưa xử lý |
| KSK-HIS-003 | 13/08 | X-quang và siêu âm chưa lấy được mô tả chi tiết | HIS integration, PACS/CLS | Cao | Chưa xử lý |
| KSK-HIS-004 | 13/08 | Cân nặng, huyết áp và chức năng sống chưa lấy từ HIS sang | HIS integration, khám thể lực | Cao | Chưa xử lý |
| KSK-HIS-005 | 13/08 | Đối tượng miễn giảm trên HIS không đồng bộ đúng sang KSK | HIS integration, đối tượng/thanh toán | Cao | Chưa xử lý |
| KSK-HIS-006 | 13/08 | Giờ khám khi sang KSK không đúng | HIS integration, thời gian khám | Cao | Chưa xử lý |
| KSK-HIS-007 | 13/08 | Chọn mẫu người từ đủ 18 tuổi nhưng tab CLS vẫn hiển thị xét nghiệm bắt buộc của lái xe | Phân loại mẫu, CLS, rule nghiệp vụ | Cao | Chưa xử lý |
| KSK-HIS-008 | 13/08 | Phần kết luận KSK đang trống; cần xác định có lấy kết luận từ khám bệnh HIS hay không | HIS integration, kết luận | Trung bình | Cần thống nhất nghiệp vụ |
| KSK-HIS-009 | 14/08 | Cho phép mở khóa/hủy ký số đối với hồ sơ đã gửi cổng | Ký số, đồng bộ VNeID | Cao | Chưa xử lý |
| KSK-HIS-010 | 14/08 | Khi tạo hồ sơ mới cho đối tượng miễn giảm, HIS chưa kiểm tra hồ sơ miễn giảm cũ đã kết thúc hay chưa | HIS reception, đối tượng miễn giảm | Cao | Chưa xử lý |

## 3. Checklist kiểm tra và tiêu chí nghiệm thu

### KSK-HIS-001 — Chuẩn hóa tiền sử HIS dạng văn bản sang mã ICD-10

- [ ] Xác định API/field HIS đang trả về cho tiền sử bản thân dạng văn bản.
- [ ] Kiểm tra có sẵn mã ICD-10 từ HIS hoặc danh mục bệnh liên kết hay không.
- [ ] Nếu HIS chỉ có text: bổ sung bước mapping text → mã ICD-10 có xác nhận người dùng, không tự gán im lặng khi không chắc chắn.
- [ ] Cho phép lưu đồng thời nội dung gốc và mã ICD-10 đã chuẩn hóa.
- [ ] Khi đồng bộ sang KSK, mã được phân cách bằng `;` theo chuẩn XML.
- [ ] Test: một bệnh, nhiều bệnh, text không nhận diện được, text rỗng.

Tiêu chí đạt: hồ sơ có tiền sử từ HIS phải hiển thị được nội dung gốc; khi có mã hợp lệ phải điền được ICD-10 và sinh đúng `TSBT_MA_BENH`.

### KSK-HIS-002 — Bổ sung địa chỉ hành chính

- [ ] Xác định field địa chỉ trong response HIS: địa chỉ đầy đủ hoặc tỉnh/huyện/xã riêng lẻ.
- [ ] Đối chiếu mapping vào `address`, `dia_chi`, `DIA_CHI` và payload KSK.
- [ ] Xử lý trường hợp HIS trả về địa chỉ ở nhiều cấp hành chính.
- [ ] Không ghi đè địa chỉ người dùng đã chỉnh sửa nếu chưa yêu cầu đồng bộ lại.
- [ ] Test đủ địa chỉ đầy đủ, địa chỉ từng phần và không có địa chỉ.

Tiêu chí đạt: tạo hồ sơ từ HIS hiển thị đúng địa chỉ hành chính và XML có đúng giá trị địa chỉ.

### KSK-HIS-003 — Mô tả chi tiết X-quang và siêu âm

- [ ] Xác định endpoint HIS/PACS trả kết quả X-quang, siêu âm.
- [ ] Kiểm tra các field mô tả: kết quả, mô tả, nhận xét, kết luận, hình ảnh và bác sĩ đọc kết quả.
- [ ] Mapping kết quả chi tiết vào từng phần tử `paraclinical_items`.
- [ ] Phân biệt tên chỉ định, kết quả thực hiện và kết luận chuyên môn.
- [ ] Không làm mất kết quả khi đồng bộ HIS nhiều lần.
- [ ] Test X-quang, siêu âm, có kết quả và chưa có kết quả.

Tiêu chí đạt: KSK hiển thị đúng mô tả chi tiết, kết luận và thời điểm kết quả của từng chỉ định.

### KSK-HIS-004 — Lấy chức năng sống từ HIS

- [ ] Xác định field HIS cho cân nặng, chiều cao, mạch, nhiệt độ, huyết áp.
- [ ] Chuẩn hóa đơn vị và định dạng huyết áp, ví dụ `120/80`.
- [ ] Mapping vào state khám thể lực của KSK.
- [ ] Không ghi đè giá trị KSK đã chỉnh sửa nếu HIS không có dữ liệu mới.
- [ ] Test giá trị đầy đủ, thiếu từng trường và giá trị không hợp lệ.

Tiêu chí đạt: dữ liệu chức năng sống từ HIS xuất hiện đúng tại tab Khám thể lực và được sinh đúng XML.

### KSK-HIS-005 — Đồng bộ đối tượng miễn giảm

- [ ] Lập bảng mapping mã đối tượng HIS ↔ mã đối tượng KSK.
- [ ] Kiểm tra cả mã, tên đối tượng và trạng thái hiệu lực.
- [ ] Xử lý trường hợp HIS trả mã chưa có trong danh mục KSK.
- [ ] Không tự chuyển sang đối tượng mặc định nếu mapping thất bại; phải cảnh báo rõ.
- [ ] Test từng nhóm miễn giảm và trường hợp không thuộc miễn giảm.

Tiêu chí đạt: đối tượng sau khi tạo hồ sơ KSK giữ đúng mã và quyền lợi từ HIS.

### KSK-HIS-006 — Sai giờ khám

- [ ] Xác định nguồn thời gian: thời gian đăng ký, thời gian tiếp nhận, thời gian bắt đầu khám hay thời gian tạo hồ sơ.
- [ ] Kiểm tra format và timezone giữa HIS, backend và trình duyệt.
- [ ] Chuẩn hóa về timezone `Asia/Bangkok`.
- [ ] Không dùng thời gian hiện tại thay cho thời gian khám từ HIS nếu HIS đã có dữ liệu.
- [ ] Test lệch múi giờ, thời gian ISO có timezone và thời gian không có timezone.

Tiêu chí đạt: giờ khám hiển thị và xuất XML đúng với thời gian nghiệp vụ của HIS.

### KSK-HIS-007 — Rule CLS theo đúng mẫu, không áp dụng nhầm lái xe

- [ ] Xác định rule xét nghiệm bắt buộc hiện đang phụ thuộc vào `formType`, đối tượng hay mục đích khám.
- [ ] Tách rule khám sức khỏe thông thường, khám lái xe và các mẫu QĐ2062.
- [ ] Khi chọn người từ đủ 18 tuổi, chỉ áp dụng danh mục CLS của mẫu tương ứng.
- [ ] Không hiển thị xét nghiệm bắt buộc lái xe nếu hồ sơ không phải mẫu lái xe.
- [ ] Test Mẫu 1 người lớn, Mẫu 3 lái xe và chuyển đổi qua lại giữa các mẫu.

Tiêu chí đạt: mỗi loại hồ sơ chỉ hiển thị đúng danh mục CLS của nghiệp vụ đó.

### KSK-HIS-008 — Nguồn dữ liệu phần kết luận

- [ ] Xác định kết luận HIS là kết luận khám bệnh hay kết luận của từng chuyên khoa.
- [ ] Thống nhất nghiệp vụ: lấy tự động, chỉ tham khảo, hoặc cho phép người dùng chọn đưa sang KSK.
- [ ] Tách kết luận chuyên khoa và kết luận tổng hợp.
- [ ] Không ghi đè kết luận KSK đã được bác sĩ xác nhận.
- [ ] Test hồ sơ có kết luận HIS, không có kết luận và có nhiều kết luận chuyên khoa.

Đề xuất: lấy kết luận HIS làm dữ liệu tham khảo ban đầu, cho phép bác sĩ KSK chỉnh sửa/xác nhận trước khi ký số; không tự động coi kết luận HIS là kết luận KSK cuối cùng.

### KSK-HIS-009 — Mở khóa/hủy ký số hồ sơ đã gửi cổng

- [ ] Xác định các trạng thái được phép mở khóa: nháp, đã ký, chờ gửi, gửi lỗi, đã gửi thành công.
- [ ] Không cho hủy âm thầm chữ ký đã được cổng tiếp nhận nếu chưa có quy trình nghiệp vụ tương ứng.
- [ ] Bổ sung quyền riêng cho thao tác mở khóa/hủy ký.
- [ ] Bắt buộc nhập lý do và ghi audit log.
- [ ] Nếu đã gửi thành công: phân biệt hủy chữ ký nội bộ với thu hồi hồ sơ trên cổng.
- [ ] Test đầy đủ từng trạng thái và kiểm tra log/audit.

Tiêu chí đạt: thao tác được kiểm soát theo trạng thái, quyền người dùng và có truy vết.

### KSK-HIS-010 — Kiểm tra hồ sơ miễn giảm cũ khi tạo hồ sơ mới

- [ ] Xác định khóa nghiệp vụ: bệnh nhân, mã đối tượng, hợp đồng và khoảng thời gian hiệu lực.
- [ ] Truy vấn hồ sơ miễn giảm cũ chưa kết thúc trước khi tạo hồ sơ mới.
- [ ] Chặn tạo trùng hoặc cảnh báo tùy theo quy định nghiệp vụ.
- [ ] Cho phép tạo mới nếu hồ sơ cũ đã kết thúc.
- [ ] Xử lý đồng thời hai người dùng cùng tạo hồ sơ.
- [ ] Test hồ sơ cũ đang hiệu lực, đã kết thúc, chưa có hồ sơ và khác đối tượng.

Tiêu chí đạt: không tạo trùng hồ sơ miễn giảm đang hiệu lực; hồ sơ đã kết thúc không bị chặn nhầm.

## 4. Thứ tự triển khai đề xuất

1. KSK-HIS-004 — Chức năng sống.
2. KSK-HIS-002 — Địa chỉ hành chính.
3. KSK-HIS-005 và KSK-HIS-010 — Đối tượng miễn giảm.
4. KSK-HIS-006 — Giờ khám.
5. KSK-HIS-003 — X-quang/siêu âm.
6. KSK-HIS-001 — Chuẩn hóa tiền sử ICD-10.
7. KSK-HIS-007 — Rule CLS theo mẫu.
8. KSK-HIS-008 — Kết luận HIS → KSK.
9. KSK-HIS-009 — Mở khóa/hủy ký số.

## 5. Quy định cập nhật trạng thái

Mỗi mục chỉ được đánh dấu **Hoàn thành** khi có đủ:

- Mã nguồn đã chỉnh sửa.
- Test tự động hoặc test tích hợp tương ứng.
- Kiểm tra dữ liệu HIS thực tế hoặc payload mô phỏng có cấu trúc tương đương.
- Xác nhận UI và XML đầu ra.
- Ghi rõ trường hợp chưa thể test do thiếu API, dữ liệu hoặc thiết bị.

