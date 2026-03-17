# 📘 Hướng dẫn sử dụng Quản lý Cấu hình

> **Mục đích:** Hướng dẫn nhân viên sử dụng trang Cấu hình để quản lý SMS templates, quy tắc đặt lịch, và các thiết lập khác.

---

## 🎯 Tổng quan

Trang **Cấu hình hệ thống** cho phép bạn tùy chỉnh:
- 📱 **SMS Templates** - Nội dung tin nhắn gửi cho bệnh nhân
- 📅 **Booking Rules** - Quy tắc và giới hạn đặt lịch
- 🕐 **Business Hours** - Giờ làm việc trong tuần
- 🔔 **Notifications** - Cấu hình thông báo
- 🏢 **General** - Thông tin bệnh viện

---

## 📍 Truy cập

1. Đăng nhập vào hệ thống
2. Vào module **Đăng ký Online**
3. Click vào **⚙️ Cấu hình** trong menu

**Lưu ý:** Chỉ **Admin** và **Lễ tân** mới có quyền truy cập trang này.

---

## 📱 Tab 1: SMS Templates

### Chức năng
Chỉnh sửa nội dung tin nhắn SMS gửi cho bệnh nhân.

### Các loại template

| Template | Khi nào gửi |
|----------|-------------|
| ✅ **Xác nhận đặt lịch** | Khi bệnh nhân đăng ký lịch khám |
| 👍 **Duyệt lịch khám** | Khi nhân viên duyệt lịch |
| ❌ **Hủy lịch khám** | Khi lịch khám bị hủy |
| ⏰ **Nhắc lịch khám** | Trước 1 ngày để nhắc nhở |
| 🔄 **Đổi lịch khám** | Khi đổi sang ngày/giờ khác |

### Cách sử dụng

1. **Chọn template** muốn chỉnh sửa
2. **Chỉnh sửa nội dung** trong ô text
3. **Chèn biến** bằng cách click vào nút biến (ví dụ: `{patientName}`)
4. **Xem trước** tin nhắn ở bên phải
5. **Lưu thay đổi**

### Biến có sẵn

| Biến | Ý nghĩa |
|------|---------|
| `{patientName}` | Tên bệnh nhân |
| `{date}` | Ngày khám |
| `{time}` | Giờ khám |
| `{specialty}` | Chuyên khoa |
| `{queueNumber}` | Số thứ tự |
| `{hospitalName}` | Tên bệnh viện |
| `{hotline}` | Số hotline |

### Lưu ý quan trọng

- ⚠️ **Độ dài SMS:** Mỗi SMS tối đa 70 ký tự (tiếng Việt). Nếu dài hơn sẽ tính 2-3 SMS.
- ✅ **Kiểm tra kỹ:** Xem trước trước khi lưu
- 📝 **Dùng biến:** Luôn dùng biến thay vì ghi cứng thông tin

---

## 📅 Tab 2: Booking Rules

### Các quy tắc cấu hình

#### 👥 Số lượng tối đa mỗi khung giờ
- Giới hạn số bệnh nhân có thể đặt cùng 1 khung giờ
- **Mặc định:** 10 bệnh nhân
- **Khuyến nghị:** 5-15 tùy theo năng lực khám

#### 📅 Số ngày đặt trước
- **Tối thiểu:** Số ngày tối thiểu phải đặt trước (0 = cho phép đặt trong ngày)
- **Tối đa:** Số ngày tối đa có thể đặt trước (30 ngày)

#### ⏰ Thời gian cho phép hủy
- Số giờ trước lịch hẹn mà bệnh nhân còn được phép hủy
- **Mặc định:** 24 giờ

#### Các tùy chọn khác
- ✅ **Tự động duyệt lịch:** Bật nếu muốn tự động duyệt không cần nhân viên xác nhận
- 📱 **Bắt buộc số điện thoại:** Luôn bật để gửi SMS
- 📧 **Bắt buộc email:** Bật nếu muốn gửi email xác nhận
- 🕐 **Cho phép đặt trong ngày:** Bật nếu cho phép đặt lịch cùng ngày

---

## 🕐 Tab 3: Business Hours

### Chức năng
Cấu hình giờ làm việc cho từng ngày trong tuần.

### Cách sử dụng

1. **Tick chọn** ngày làm việc
2. **Nhập giờ** cho buổi sáng và chiều
3. **Định dạng:** `HH:MM-HH:MM` (ví dụ: `07:30-11:30`)
4. **Để trống** nếu không làm việc buổi đó

### Ví dụ

```
Thứ 2-6: 
  Sáng: 07:30-11:30
  Chiều: 13:30-17:00

Thứ 7:
  Sáng: 07:30-11:30
  Chiều: (trống)

Chủ nhật: Không làm việc
```

---

## 🔔 Tab 4: Notifications

### Kênh thông báo

- **📱 SMS:** Gửi thông báo qua tin nhắn
- **📧 Email:** Gửi thông báo qua email

### Nhắc lịch tự động

- **Bật/tắt** tính năng nhắc lịch
- **Thời gian:** Gửi trước bao nhiêu giờ (mặc định 24 giờ = 1 ngày)

### Gửi thông báo khi

Chọn sự kiện nào sẽ gửi thông báo:
- ➕ Tạo lịch mới
- ✅ Duyệt lịch
- ❌ Hủy lịch
- 🔄 Đổi lịch

---

## 🏢 Tab 5: General

### Thông tin cấu hình

- 🏥 **Tên bệnh viện:** Hiển thị trong SMS và giao diện
- 📞 **Hotline:** Số điện thoại hỗ trợ
- 📧 **Email:** Email hỗ trợ khách hàng
- 📍 **Địa chỉ:** Địa chỉ bệnh viện
- 🌐 **Website:** Đường dẫn website

**Lưu ý:** Thông tin này sẽ được dùng trong SMS template (biến `{hospitalName}`, `{hotline}`)

---

## 💾 Lưu thay đổi

### Quy trình

1. Chỉnh sửa cấu hình trong tab
2. Click nút **💾 Lưu thay đổi** ở cuối trang
3. Đợi thông báo **✅ Lưu cấu hình thành công!**
4. Thay đổi có hiệu lực **ngay lập tức**

### Lưu ý

- ⚠️ **Kiểm tra kỹ** trước khi lưu
- 🔄 **Thay đổi ngay lập tức:** Không cần restart server
- 📝 **Có thể hoàn tác:** Chỉnh sửa lại và lưu

---

## ❓ Câu hỏi thường gặp

### Q: Tôi sửa SMS template nhưng tin nhắn vẫn cũ?
**A:** Đảm bảo đã click "Lưu thay đổi". Nếu vẫn cũ, liên hệ IT để clear cache.

### Q: Làm sao để tắt SMS cho một loại thông báo?
**A:** Vào tab **Notifications**, bỏ tick ở sự kiện tương ứng.

### Q: Có thể đặt giờ làm việc khác nhau cho từng khoa không?
**A:** Hiện tại chưa hỗ trợ. Giờ làm việc áp dụng chung cho toàn bệnh viện.

### Q: Tôi muốn thêm biến mới vào SMS template?
**A:** Liên hệ IT để thêm biến mới vào hệ thống.

### Q: Làm sao khôi phục cấu hình mặc định?
**A:** Liên hệ IT để reset về mặc định.

---

## 🆘 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra lại các bước trong hướng dẫn
2. Thử refresh trang (Ctrl + F5)
3. Liên hệ IT: extension 123 hoặc email: it@vimes.vn

---

**Cập nhật:** 2026-01-21
