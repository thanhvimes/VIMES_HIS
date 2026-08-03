# Thiết kế & Quy chuẩn Xử lý Số Thứ Tự Khám (he_receptno)

## 1. Tổng quan & Mục tiêu
Tài liệu này quy định chuẩn thiết kế cho việc sinh và quản lý **Số thứ tự khám bệnh (`he_receptno`)** trong toàn bộ hệ thống (Web/API & Desktop App C++) cho các phân hệ:
- **Tiếp đón tại quầy Web API & Desktop App (VIMES Reception Manager - C++)**
- **Đăng ký / Duyệt lịch hẹn trực tuyến (Online Booking)**

Mục tiêu cốt lõi: Đảm bảo số thứ tự khám phát ra cho bệnh nhân theo từng phòng khám trong ngày luôn là **Dãy số tăng dần liên tục (Monotonically Increasing)**, tuyệt đối không bị trùng lặp, không bị lùi số và không nhảy số thất thường.

---

## 2. Hàm sinh số tập trung: `hms_get_next_receptno`

### Cấu trúc hàm (PostgreSQL)
```sql
CREATE OR REPLACE FUNCTION public.hms_get_next_receptno(
    p_roomid INT,
    p_examdate DATE DEFAULT CURRENT_DATE
)
RETURNS INT
LANGUAGE plpgsql
AS $function$
DECLARE
    v_next_no INT;
    v_date DATE;
BEGIN
    IF p_roomid IS NULL OR p_roomid <= 0 THEN
        RETURN 1;
    END IF;

    v_date := COALESCE(p_examdate, CURRENT_DATE);

    -- Khoá giao dịch theo (phòng khám, ngày) tránh race condition
    PERFORM pg_advisory_xact_lock(hashtext('receptno_room_' || p_roomid::text || '_' || v_date::text));

    -- Tính số tiếp theo: MAX(he_receptno) + 1
    SELECT COALESCE(MAX(he_receptno), 0) + 1
    INTO v_next_no
    FROM hms_exam
    WHERE he_roomid = p_roomid
      AND DATE(he_examdate) = v_date;

    RETURN v_next_no;
END;
$function$;
```

### Quy tắc hoạt động (Business Rules)
1. **Khóa chống tranh chấp (Advisory Lock):** Sử dụng `pg_advisory_xact_lock` theo mã phòng khám và ngày khám. Điều này đảm bảo khi có 10 tiếp đón viên bấm đăng ký đồng thời, các số STT cấp ra cho các bệnh nhân vẫn duy trì 1, 2, 3, 4... một cách an toàn tuyệt đối.
2. **Không lấp lỗ hổng (No Gap Filling):** Trường hợp bệnh nhân hủy phiếu khám (`he_status = 'C'`), số STT đã cấp đó vẫn tồn tại trong lịch sử. Hệ thống **không tái sử dụng số cũ bị hủy**, nhằm tránh việc phòng khám đang gọi số 15 mà bệnh nhân mới nhận lại số 3.

---

## 3. Tích hợp trong các phân hệ

### 3.1. Tiếp đón tại quầy Node.js Web API (`hms_register_patient_v2`)
- Khi tiếp đón bệnh nhân mới hoặc đăng ký thêm phòng khám tại quầy:
  ```sql
  v_receptno := hms_get_next_receptno((v_exam->>'roomId')::INT, CURRENT_DATE);
  ```

### 3.2. Tiếp đón tại quầy Desktop Client C++ (`HMSRegistration.cpp`)
- File nguồn C++: `D:\DEV\Programs_HIS_K\VIMESReceptionMangr\HMSRegistration.cpp`
- Hàm `CHMSRegistration::GetMaxReceptNo()` đã được cập nhật thay thế câu truy vấn `generate_series(1, 5000)` lấp lỗ hổng cũ bằng việc gọi trực tiếp hàm PostgreSQL:
  ```cpp
  szSQL.Format(_T("SELECT hms_get_next_receptno(%d, TO_DATE('%s', 'YYYY-MM-DD'))"),
      str2int(m_szRoomID), m_szExamDate.Left(10));
  rs.ExecSQL(szSQL);
  return rs.GetIntValue();
  ```

### 3.3. Duyệt Đăng ký Online (`hms_insert_exam_online` / `qms_register_ticket_online`)
- Khi chèn phiếu khám online vào `hms_exam`:
  - Nếu `p_receptno` truyền vào > 0 và chưa bị ai chiếm trong `hms_exam` ngày hôm đó -> Giữ số `p_receptno`.
  - Nếu `p_receptno` <= 0 hoặc đã bị trùng trong `hms_exam` -> Tự động gọi `hms_get_next_receptno(p_maphongkham, DATE(vExamDate))` để gán STT tiếp theo liên tục.

### 3.4. Đổi phòng khám tại Web API (`patient.controller.ts`)
- Controller gọi query: `SELECT hms_get_next_receptno($1, CURRENT_DATE) as new_no`

---

## 4. Migration Scripts & C++ File
- `backend/migrations/046_create_hms_get_next_receptno_function.sql`
- `backend/migrations/047_update_reception_and_online_receptno_logic.sql`
- `D:\DEV\Programs_HIS_K\VIMESReceptionMangr\HMSRegistration.cpp`

---

## 5. Danh mục 10 Kịch Bản Kiểm Thử & Kết Quả Thực Tế (Test Matrix)

| Mã TC | Tên Kịch Bản | Mô Tả Tình Huống | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC01** | STT Đầu Ngày | Phòng khám chưa có lượt khám nào trong ngày | Trả về STT = `1` | `1` | ✅ PASSED |
| **TC02** | Đăng Ký Liên Tiếp Tại Quầy | Đăng ký 3 bệnh nhân liên tiếp tại quầy tiếp đón | Cấp dãy số tăng dần: `1, 2, 3` | `1, 2, 3` | ✅ PASSED |
| **TC03** | Xử Lý Phiếu Hủy | Hủy phiếu khám số 2 (`he_status = 'C'`), đăng ký BN thứ 4 | BN 4 nhận số `4` (không lùi về lấp lại số 2) | `4` | ✅ PASSED |
| **TC04** | Duyệt Online Slot Hợp Lệ | Duyệt online với slot 10 chưa được bệnh nhân nào chiếm | Giữ nguyên STT = `10` | `10` | ✅ PASSED |
| **TC05** | Duyệt Online Trùng Slot | Duyệt online truyền slot 4 (đã bị BN khác chiếm trước đó) | Tự gán STT tiếp theo `MAX + 1 = 11` | `11` | ✅ PASSED |
| **TC06** | Duyệt Online Không Slot | Duyệt online với `p_receptno = 0` hoặc `NULL` | Tự động tăng lên STT `MAX + 1 = 12` | `12` | ✅ PASSED |
| **TC07** | Đổi Phòng Khám | Chuyển BN sang Phòng B (Phòng B đang có 2 BN) | Cấp STT tiếp theo tại Phòng B = `3` | `3` | ✅ PASSED |
| **TC08** | Độc Lập Giữa Các Phòng | Kiểm tra tính độc lập giữa Phòng A và Phòng B | Phòng A: `13`, Phòng B: `3` | Phòng A: `13`, Phòng B: `3` | ✅ PASSED |
| **TC09** | Reset Độc Lập Theo Ngày | Kiểm tra dãy số giữa Ngày hôm nay và Ngày mai | Hôm nay: `13`, Ngày mai: `1` | Hôm nay: `13`, Ngày mai: `1` | ✅ PASSED |
| **TC10** | Đăng Ký Đồng Thời (Concurrent) | Giả lập 5 request đăng ký đồng thời qua `Promise.all` | Cấp đủ 5 số duy nhất tăng liên tục (`13..17`) | `13, 14, 15, 16, 17` | ✅ PASSED |

- **Script kiểm thử tự động:** [backend/scripts/test_receptno_comprehensive.ts](file:///d:/AI/VIMES_HIS/backend/scripts/test_receptno_comprehensive.ts)
- **Tỷ lệ vượt qua:** 10/10 Kịch bản (100%).
