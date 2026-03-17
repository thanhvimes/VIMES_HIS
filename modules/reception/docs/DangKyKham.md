# HIS VIMES - Workflow Module Tiếp Đón (Đăng Ký Khám)

## 1. Mục tiêu
Module Tiếp đón tiếp nhận bệnh nhân đến khám, xác định bệnh nhân đã tồn tại hay chưa dựa trên CCCD hoặc thẻ BHYT, từ đó liên kết lịch sử khám với một mã bệnh nhân duy nhất và tạo phiếu khám mới.

---

# 2. Workflow tổng thể

Bệnh nhân đến → Quét thẻ → Phân tích dữ liệu → Tìm bệnh nhân →  
(Đã có bệnh nhân / Bệnh nhân mới) → Tạo phiếu khám → In phiếu.

---

# 3. Workflow chi tiết

## Bước 1: Bệnh nhân đến đăng ký khám

### Actor
- Bệnh nhân
- Nhân viên tiếp đón

### Hành động
1. Bệnh nhân đến quầy tiếp đón.
2. Nhân viên tiếp đón quét:
   - CCCD (QR Code)
   - hoặc Thẻ BHYT (QR Code)

### Checklist
- [ ] Kết nối đầu đọc thẻ
- [ ] Nhận dữ liệu QRCode từ thiết bị
- [ ] Gửi dữ liệu vào hệ thống HIS

---

# Bước 2: Xử lý dữ liệu QR

### Mục đích
Phân tích dữ liệu QR để lấy thông tin hành chính bệnh nhân.

### Thông tin có thể lấy

| Trường | Nguồn |
|------|------|
| CCCD | QR CCCD |
| Họ tên | QR CCCD |
| Ngày sinh | QR CCCD |
| Giới tính | QR CCCD |
| Địa chỉ | QR CCCD |
| Số thẻ BHYT | QR BHYT |

### Checklist
- [ ] Parse chuỗi QR
- [ ] Xác định loại thẻ
- [ ] Mapping dữ liệu vào form tiếp đón

---

# Bước 3: Kiểm tra dữ liệu bệnh nhân trong HIS

## Trường hợp quét CCCD

### Database
Bảng: `hms_patient`

Field:

hp_sin

### Logic

SELECT hp_patientno
FROM hms_patient
WHERE hp_sin = :cccd

### Kết quả

| Kết quả | Hành động |
|---|---|
| Tìm thấy | Lấy mã bệnh nhân |
| Không thấy | Bệnh nhân mới |

---

## Trường hợp quét BHYT

### Database
Bảng: `hms_doc`

Field:

hd_cardno

### Logic

SELECT hd_docno, hd_patientno
FROM hms_doc
WHERE hd_cardno = :bhyt
ORDER BY hd_docdate DESC
LIMIT 1

### Kết quả

| Field | Ý nghĩa |
|---|---|
| hd_docno | mã hồ sơ khám |
| hd_patientno | mã bệnh nhân |

---

# Bước 4: Trường hợp bệnh nhân đã tồn tại

## Điều kiện

hp_patientno != NULL

## Hệ thống thực hiện

1. Load thông tin hành chính bệnh nhân.
2. Load lịch sử khám.
3. Load thẻ BHYT (nếu có).
4. Hiển thị phiếu khám gần nhất.

### Khi nhân viên chọn "Tạo phiếu khám"

Hệ thống sẽ tạo dữ liệu:

| Bảng | Nội dung |
|---|---|
| hms_doc | Hồ sơ khám |
| hms_exam | Phiếu khám |
| hms_card | Thông tin BHYT |

### API

ADD_DOC

### Checklist

- [ ] Load thông tin bệnh nhân
- [ ] Load lịch sử khám
- [ ] Load thông tin BHYT
- [ ] Cho phép tạo phiếu khám mới

---

# Bước 5: Trường hợp bệnh nhân mới

## Điều kiện

hp_patientno == NULL

## Hệ thống thực hiện

1. Lấy dữ liệu từ QR Code.
2. Điền vào form tiếp đón.
3. Cho phép chỉnh sửa thông tin.

### Khi xác nhận đăng ký

Hệ thống tạo dữ liệu:

| Bảng | Nội dung |
|---|---|
| hms_patient | Bệnh nhân |
| hms_doc | Hồ sơ khám |
| hms_exam | Phiếu khám |
| hms_card | Thông tin BHYT |

### API

ADD_PATIENT

### Checklist

- [ ] Tạo bệnh nhân mới
- [ ] Tạo hồ sơ khám
- [ ] Tạo phiếu khám
- [ ] Lưu thông tin BHYT

---

# Bước 6: In phiếu khám

Sau khi tạo phiếu khám thành công hệ thống:

1. Sinh số thứ tự.
2. Lưu dữ liệu queue.
3. In phiếu khám.

### Nội dung phiếu

| Nội dung |
|---|
| Mã bệnh nhân |
| Họ tên |
| Phòng khám |
| Số thứ tự |
| Thời gian khám |

### Checklist

- [ ] Sinh số thứ tự
- [ ] Lưu queue
- [ ] Gửi lệnh in
- [ ] In phiếu khám

---

# Workflow tổng thể

Bệnh nhân đến  
│  
▼  
Quét CCCD / BHYT  
│  
▼  
Phân tích QR  
│  
▼  
Tìm bệnh nhân trong HIS  
│  
├── Có bệnh nhân → ADD_DOC  
│  
└── Bệnh nhân mới → ADD_PATIENT  
│  
▼  
Tạo phiếu khám  
│  
▼  
In phiếu khám