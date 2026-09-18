# HƯỚNG DẪN HỆ THỐNG BÁO CÁO ĐIỀU HÀNH & GIÁM SÁT CHIẾN LƯỢC DÀNH CHO BAN GIÁM ĐỐC
**Phân hệ:** Quản lý Báo cáo & Thống kê Y tế (`hospital-statistics`)  
**Phiên bản:** 2.0 (Executive Suite)  
**Ngày cập nhật:** 17/09/2026  

---

## 1. TỔNG QUAN HỆ THỐNG
Hệ thống báo cáo điều hành và giám sát chiến lược được thiết kế đặc thù cho vai trò **Giám đốc Bệnh viện**, **Ban Giám đốc** và **Lãnh đạo Phòng Kế hoạch tổng hợp / Tài chính kế toán**. Hệ thống bao gồm 3 trụ cột chỉ huy cốt lõi:

1. **Bản tin Giao ban Sáng Tự Động (24h Executive Morning Flash Report):**  
   Tự động tổng hợp dữ liệu toàn viện trong 24 giờ qua (00:00:00 - 23:59:59), tối ưu hóa định dạng in chuẩn khổ A4 (Print-ready) có đầy đủ chữ ký 3 bên phục vụ cuộc họp giao ban toàn viện lúc 07h00 sáng mỗi ngày.
2. **Thanh Đèn Cảnh Báo Chỉ Huy Khẩn Cấp (Executive Traffic Light Live Alerts):**  
   Hệ thống giám sát thời gian thực với cơ chế đèn tín hiệu 🔴 Đỏ (Báo động khẩn cấp), 🟡 Vàng (Cảnh báo tiềm ẩn), 🟢 Xanh (An toàn và ổn định) ngay tại giao diện trung tâm Bảng điều khiển (`DashboardOverview`).
3. **Báo cáo Giám sát Rủi ro Chi phí BHYT & Quản trị Tạm ứng Viện phí (BHYT & Financial Risk Monitor):**  
   Phân tích cơ cấu chi phí quỹ BHYT chi trả nhằm phát hiện sớm nguy cơ vượt trần quỹ (tiền thuốc, cận lâm sàng, VTYT) và lập danh sách chi tiết các bệnh nhân nội trú đang điều trị bị âm tiền tạm ứng để phòng ngừa trốn viện, thất thoát công nợ.

---

## 2. CHI TIẾT CÁC TÍNH NĂNG VÀ MÀN HÌNH CHỈ HUY

### 2.1. Bản Tin Giao Ban Sáng 24h (`MorningBriefingView`)
- **Đường dẫn truy cập:** `/hospital-statistics/morning-briefing`
- **Menu:** Đặt ngay dưới mục "Bảng điều khiển" với icon nổi bật màu xanh dương.
- **Nội dung hiển thị:**
  - **Khám bệnh & Cấp cứu 24h:**
    - Tổng số lượt khám, chi tiết khám BHYT vs Viện phí/Dịch vụ.
    - Lượt tiếp nhận cấp cứu 24/24 (đánh dấu 🚨).
    - Số ca chỉ định vào viện điều trị nội trú.
    - Số ca chuyển tuyến ngoại trú lên tuyến trên.
  - **Thu dung & Biến động Nội trú 24h:**
    - Bệnh nhân mới vào viện trong ngày.
    - Bệnh nhân hoàn tất điều trị ra viện.
    - Chuyển tuyến điều trị nội trú.
    - Số ca tử vong trong ngày (tô nền cảnh báo đỏ phục vụ yêu cầu kiểm thảo tử vong theo quy chế Bộ Y tế).
    - Tổng số bệnh nhân hiện diện đang nằm viện tại thời điểm giao ban.
  - **Phẫu thuật & Thủ thuật 24h:**
    - Tổng số ca PTTT thực hiện trong 24h.
    - Phân tách rõ: **Mổ cấp cứu 🚨** vs **Mổ phiên theo kế hoạch**.
    - Số ca thủ thuật lâm sàng.
  - **Tình hình Giường bệnh theo Quyết định 49/QĐ-BVĐKT (562 Giường KH):**
    - Tỷ lệ công suất buồng bệnh chung toàn viện (%).
    - Bảng "Các khoa báo động quá tải (>100% CSG)": Tên khoa, giường KH, bệnh nhân đang nằm, tỷ lệ công suất và số giường vượt mức cho phép.
    - Bảng "Các khoa sẵn sàng tiếp nhận điều phối (<80% CSG)": Tên khoa, giường KH, số giường còn trống thực tế để lãnh đạo ra quyết định điều chuyển người bệnh ngay tại buổi giao ban.
- **In ấn & Xuất file:**
  - Nút **"In Bản Tin A4"**: Tự động hiển thị tiêu ngữ Quốc gia, tên Bệnh viện, tên Phòng KHTH, mã biểu mẫu `BM-GB-01/KHTH`, bảng biểu chuẩn phông Times New Roman và 3 ô chữ ký: Người lập biểu, Trưởng phòng KHTH, Giám đốc bệnh viện.
  - Nút **"Xuất Excel"**: Kết xuất bảng số liệu ra file Excel phục vụ lưu trữ văn thư.

---

### 2.2. Thanh Đèn Cảnh Báo Chỉ Huy Khẩn Cấp (`DashboardOverview`)
- **Đường dẫn truy cập:** `/hospital-statistics/dashboard`
- **Vị trí hiển thị:** Ngay đầu trang Bảng điều khiển, trên các bộ lọc và biểu đồ.
- **Quy tắc kích hoạt tín hiệu:**
  - 🔴 **Tín hiệu ĐỎ (CRITICAL ALERT):**
    - Khi có từ 1 khoa điều trị nội trú vượt quá 100% công suất giường kế hoạch (chuẩn 562 giường QĐ 49).
    - Khi ghi nhận có ca tử vong trong ngày.
  - 🟡 **Tín hiệu VÀNG (WARNING ALERT):**
    - Khi có bệnh nhân nội trú đang điều trị có chi phí thực tế vượt số tiền tạm ứng từ 5.000.000đ trở lên.
    - Khi các khoa cận quá tải (công suất từ 90% - 100%).
  - 🟢 **Tín hiệu XANH (NORMAL / SAFE):**
    - Khi toàn bộ hoạt động buồng bệnh, chuyên môn và dòng tiền tạm ứng đều nằm trong giới hạn kiểm soát an toàn.
- **Tương tác nhanh:**
  - Mỗi thẻ cảnh báo có thông điệp cụ thể và nút liên kết trực tiếp (1-click) đến màn hình xử lý tương ứng (`/hospital-statistics/bed-occupancy`, `/hospital-statistics/financial-risk`, `/hospital-statistics/inpatient`).
  - 2 nút điều hướng chiến lược nhanh ở góc trên: "Bản Tin Giao Ban Sáng (24h)" và "Giám Sát Rủi Ro & BHYT".

---

### 2.3. Báo Cáo Giám Sát Rủi Ro Chi Phí BHYT & Quản Trị Tạm Ứng (`FinancialRiskView`)
- **Đường dẫn truy cập:** `/hospital-statistics/financial-risk`
- **Bộ lọc:** Tích hợp bộ lọc thời gian đa dạng (Hôm nay, Tháng này, Quý này, Năm nay, Tùy chọn ngày).
- **Các khối chỉ số tài chính hàng đầu:**
  - Tổng chi phí khám chữa bệnh phát sinh trong kỳ.
  - Số tiền Quỹ BHYT thanh toán và Tỷ lệ BHYT (%).
  - Số tiền người bệnh cùng chi trả (đồng chi trả BHYT và dịch vụ theo yêu cầu).
  - Tổng số bệnh nhân và tổng số tiền âm tạm ứng nội trú.
- **Phân tích cơ cấu chi phí Quỹ BHYT (Chống vượt trần / Khoán chi):**
  - Biểu đồ tròn Donut Chart trực quan các nhóm: Tiền thuốc, VTYT, Tiền giường, Xét nghiệm, CĐHA-TDCN, PTTT, Tiền khám.
  - Thanh tiến độ (Progress bars) cảnh báo ngưỡng chi:
    - Tiền thuốc: Cảnh báo đỏ nếu chiếm > 40% chi phí BHYT.
    - Cận lâm sàng: Cảnh báo vàng nếu chiếm > 25% chi phí BHYT.
- **Bảng Quản trị & Giám sát Bệnh nhân Nội trú Âm Tạm ứng:**
  - Quét danh sách bệnh nhân đang nằm điều trị nội trú (`htr_status = 'I'`) có chi phí thực tế phát sinh lớn hơn số tiền đã nộp tạm ứng (`hms_fee_deposit`).
  - Hiển thị: Mã hồ sơ bệnh án, Họ tên bệnh nhân, Khoa điều trị, Đối tượng thẻ, Ngày vào viện, Chi phí BN trả, Đã nộp tạm ứng, Số tiền âm (thiếu) và Phân loại cấp độ rủi ro:
    - 🔴 `BÁO ĐỘNG ĐỎ`: Âm từ 10.000.000đ trở lên (nguy cơ trốn viện cao, cần yêu cầu khoa thông báo nộp tiền ngay).
    - 🟠 `NGUY CƠ CAO`: Âm từ 5.000.000đ đến dưới 10.000.000đ.
    - 🟡 `CẢNH BÁO`: Âm dưới 5.000.000đ.
  - Tính năng tìm kiếm theo tên, mã bệnh án, khoa điều trị.
  - Nút xuất file Excel danh sách phục vụ Phòng Tài chính Kế toán gửi thông báo đến các khoa lâm sàng.

---

## 3. DANH MỤC API BACKEND MỚI ĐÃ MỞ

| Phương thức | Endpoint | Tham số Query | Mô tả chức năng |
|---|---|---|---|
| `GET` | `/api/v1/statistics/morning-briefing` | `date` (YYYY-MM-DD) | Trích xuất bản tin giao ban 24h phục vụ họp giao ban sáng |
| `GET` | `/api/v1/statistics/bhyt-financial-risk` | `fromDate`, `toDate` | Lấy phân tích cơ cấu chi phí BHYT và danh sách âm tạm ứng |
| `GET` | `/api/v1/statistics/executive-alerts` | *(Không)* | Quét thời gian thực các điều kiện kích hoạt đèn cảnh báo chỉ huy |

---

## 4. BẢNG TRA CỨU CẤU TRÚC DỮ LIỆU HIS CORE (ZERO-ASSUMPTION SCHEMA)

Để đảm bảo quy tắc "Zero Assumption", các câu truy vấn đã được kiểm chứng thực tế 100% trên cơ sở dữ liệu PostgreSQL:

1. **Bảng tạm ứng viện phí (`hms_fee_deposit`):**
   - Trường: `hfe_docno` (Mã bệnh án), `hfe_amount` (Số tiền nộp), `hfe_status` (`'P'` là đã thu tiền).
2. **Bảng hóa đơn viện phí (`hms_fee_invoice`):**
   - Trường: `hfe_invoiceno`, `hfe_date`, `hfe_status` (`'P'`), `hfe_cost`, `hfe_discount`, `hfe_deposit`.
3. **Bảng chi tiết chi phí viện phí (`hms_fee`):**
   - Trường: `hfe_docno`, `hfe_group` (Nhóm chi phí: A: Thuốc, A9: VTYT, B1: XN, B2/B3: CĐHA, B4/B5: PTTT, C: Giường, D: Khám), `hfe_cost` (Giá dịch vụ), `hfe_discount` (BHYT chi trả), `hfe_status`.
   - Công thức tính phần bệnh nhân trả: `SUM(hfe_cost - hfe_discount)`.
4. **Bảng hồ sơ điều trị nội trú (`hms_treatment_record`):**
   - Trường: `htr_docno`, `htr_deptid`, `htr_status` (`'I'` = đang nằm, `'T'` = ra viện, `'A'` = hủy), `htr_admitdate`, `htr_dischargedate`, `htr_suggestion`, `htr_outpatient`.
5. **Bảng kết quả điều trị lâm sàng (`hms_clinical_record`):**
   - Trường: `hcr_docno`, `hcr_refidx`, `hcr_result` (`'5'`, `'6'` = ca tử vong).
6. **Bảng danh mục khoa phòng & Giường kế hoạch (`sys_dept`, `hms_bedlist`):**
   - Trường: `sd.sd_id`, `sd.sd_name`, `sd.sd_planned_bed` (562 giường kế hoạch theo Quyết định 49), `sd.sd_type = 'DT'`.

---

## 5. KẾT QUẢ KIỂM THỬ VÀ BIÊN DỊCH

- **Backend TypeScript Compilation:**
  - Chạy lệnh: `npx tsc --noEmit` trong thư mục `backend/`
  - Kết quả: **Exit Code 0 (0 Lỗi biên dịch)**.
- **Frontend Vite Production Build:**
  - Chạy lệnh: `npm run build` ở thư mục gốc `d:/AI/VIMES_HIS/`
  - Kết quả: **3415 modules transformed, built in 38.40s với 0 Lỗi biên dịch**.
- **Tính tương thích ngược (Backward Compatibility):**
  - Giữ nguyên toàn bộ 8 màn hình báo cáo sẵn có trong phân hệ `hospital-statistics`.
  - Không làm gián đoạn hay ảnh hưởng đến bất kỳ API nào khác trong HIS Core.
