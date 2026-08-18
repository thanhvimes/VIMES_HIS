# Visual regression

Render mỗi trang thành PNG, lưu baseline theo `templateCode/version/page-N.png`, sau đó chạy:

```powershell
node backend/scripts/visual-regression-check.cjs .\baseline\TEMPLATE\v1 .\actual\TEMPLATE\v1
```

Script so sánh SHA-256 từng trang và phát hiện thêm/mất/khác ảnh. Các vùng động (ngày giờ, QR,
chữ ký) cần được che/mask trước khi tạo PNG hoặc đưa vào fixture cố định để tránh false positive.

Tạo baseline mới bằng cách thêm `--update`. Báo cáo JSON trả về hash baseline/actual của từng
trang khác biệt, dùng làm dữ liệu review và highlight trong CI.

Để bỏ qua trang chứa vùng động, đặt `VISUAL_REGRESSION_IGNORE='(qr|signature|timestamp)'`.
Nên đặt tên page fixture có hậu tố tương ứng và chỉ bỏ qua đúng các trang động.

So sánh nhanh hai PDF bằng `powershell -File backend/scripts/compare-pdf-pairs.ps1 -Baseline <a.pdf> -Actual <b.pdf>`;
kết quả trả về kích thước và SHA-256 để dùng trong CI.
