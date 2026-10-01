# Hướng Dẫn Sử Dụng Công Cụ Cập Nhật Hàng Loạt Gói Khám Sức Khỏe (KSK)

> **Phân hệ**: Module Khám Sức Khỏe & Liên Thông Dữ Liệu (Health Check Sync)  
> **Tệp mã nguồn**: [`backend/scripts/update-contract-address.ts`](file:///d:/AI/VIMES_HIS/backend/scripts/update-contract-address.ts) & [`scripts/update-contract-address.ts`](file:///d:/AI/VIMES_HIS/scripts/update-contract-address.ts)  
> **Lệnh npm rút gọn**: `npm run update:contract-address -- [options]`  
> **Áp dụng**: Hệ thống VIMES HIS Core & vClinic  

---

## 1. Mục Đích & Bối Cảnh Nghiệp Vụ

Trong quy trình tiếp đón và quản lý khám sức khỏe định kỳ cho các công ty, đoàn thể theo hợp đồng (`hms_exm_contract`), các tình huống thực tế thường xuyên phát sinh:
1. **Lịch khám thay đổi đột xuất**: Công ty dời ngày khám, hoặc nhập dữ liệu trước cần chuẩn hóa lại ngày khám thực tế cho toàn bộ nhân viên, phiếu tiếp nhận, phiên khám và thẻ XML đẩy cổng.
2. **Điều phối / Chuyển đổi phòng khám**: Chuyển đoàn sang phòng khám hợp đồng khác hoặc thay đổi phòng KSK chuyên biệt (`hrl_id` trong `hms_roomlist`).
3. **Bổ sung / Chuẩn hóa địa chỉ công ty**: Nhân viên theo danh sách đoàn thường thiếu thông tin địa chỉ cư trú, xã phường dẫn tới bị cổng giám định BYT/SYT báo lỗi thẻ XML (`MATINH_CU_TRU`, `MAXA_CU_TRU`, `DIA_CHI`).

Công cụ này cho phép cập nhật **đồng bộ 5 bảng cơ sở dữ liệu** chỉ bằng một câu lệnh, hỗ trợ chạy **từng option riêng lẻ** hoặc **kết hợp đa năng**, có cơ chế **chạy thử an toàn (Dry-Run)**.

---

## 2. Bảng Tra Cứu Tùy Chọn Dòng Lệnh (CLI Options Cheat Sheet)

### 2.1. Tham số Bắt buộc
| Tham số | Cú pháp | Ví dụ | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| **Mã gói / Hợp đồng** | `--contract=<ID>`<br>hoặc tham số đầu tiên | `--contract=160`<br>`160` | ID khóa chính (`hec_contract_id`) của gói khám trong bảng `hms_exm_contract`. |

### 2.2. Nhóm Tùy chọn Ngày Khám
| Tùy chọn | Cú pháp | Ví dụ | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| **Ngày khám** | `--date="<chuỗi>"`<br>`--exam-date="..."`<br>`--ngay-kham="..."` | `--date="2026-09-20"`<br>`--date="20/09/2026"`<br>`--date="2026-09-20 08:30"` | Cập nhật ngày khám cho hợp đồng, nhân viên, phiếu tiếp nhận, phiên khám và thẻ XML. Tự động nhận diện `YYYY-MM-DD`, `DD/MM/YYYY` kèm giờ phút. |

### 2.3. Nhóm Tùy chọn Phòng Khám & Khoa
| Tùy chọn | Cú pháp | Ví dụ | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| **Phòng khám** | `--room=<ID>`<br>`--room="<Tên phòng>"` | `--room=551`<br>`--room="Khám Hợp Đồng"` | Cập nhật mã phòng (`hrl_id`). Hỗ trợ nhập thẳng ID số hoặc từ khóa tên phòng (tự động tra cứu danh mục). |
| **Khoa điều trị** | `--dept=<Mã khoa>` | `--dept=KBYC`<br>`--dept=KB` | *(Tùy chọn)* Chỉ định mã khoa (`hrl_deptid`). Nếu không nhập, script sẽ tự nhận diện theo phòng khám được active. |

### 2.4. Nhóm Tùy chọn Địa Chỉ Cư Trú
| Tùy chọn | Cú pháp | Ví dụ | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| **Địa chỉ chi tiết** | `--address="<chuỗi>"` | `--address="Thị trấn Nho Quan, Ninh Bình"` | Tự động phân tích danh mục hành chính (`sys_prov`, `sys_vill`, `sys_dist`) để lấy mã BHYT và cập nhật chuỗi text. |
| **Mã Tỉnh BHYT** | `--province=<mã>` | `--province=37` | Chỉ định trực tiếp mã hoặc ID tỉnh. |
| **Mã Xã BHYT** | `--ward=<mã>` | `--ward=14428` | Chỉ định trực tiếp mã hoặc ID xã/phường. |

### 2.5. Nhóm Điều Khiển & Bộ Lọc
| Tùy chọn | Ý nghĩa |
| :--- | :--- |
| `--dry-run` hoặc `--simulate` | **Chế độ mô phỏng**: Chạy toàn bộ luồng, hiển thị các bản ghi tác động và thực hiện `ROLLBACK`. **Hoàn toàn không ghi đè DB**. |
| `--all` | Cập nhật tất cả hồ sơ trong gói (kể cả hồ sơ đã có thông tin). |
| `--only-missing` | Chỉ cập nhật những hồ sơ đang bị trống/NULL giá trị tương ứng. |
| `--doc-nos="1,2,3"` | Chỉ cập nhật cho danh sách số hồ sơ / mã nhân viên chỉ định. |
| `--skip-contract` | Bỏ qua, không cập nhật bảng hợp đồng `hms_exm_contract`. |
| `--skip-employee` | Bỏ qua, không cập nhật bảng nhân viên `hms_exm_employee`. |
| `--skip-patient` | Bỏ qua, không cập nhật bảng bệnh nhân `hms_patient`. |
| `--skip-doc` | Bỏ qua, không cập nhật bảng phiếu tiếp nhận `hms_doc`. |
| `--skip-exam` | Bỏ qua, không cập nhật bảng buồng khám `hms_exam`. |
| `--skip-xml` | Bỏ qua, không cập nhật thẻ XML trong `health_check_masters`. |

---

## 3. Các Trường Hợp Sử Dụng Điển Hình (Thực Hành Thực Tế)

### Trường hợp 1: Chỉ cập nhật Ngày khám cho gói
Áp dụng khi đoàn khám thay đổi ngày khám so với dự kiến ban đầu:
```bash
# 1. Chạy thử mô phỏng xem trước
npx ts-node scripts/update-contract-address.ts --contract=160 --date="2026-09-20" --dry-run

# 2. Thực hiện lưu thật vào Cơ sở Dữ liệu
npx ts-node scripts/update-contract-address.ts --contract=160 --date="2026-09-20"

# Hỗ trợ định dạng Việt Nam kèm giờ khám cụ thể:
npx ts-node scripts/update-contract-address.ts --contract=160 --date="20/09/2026 08:30"
```

---

### Trường hợp 2: Chỉ cập nhật Phòng khám / Buồng khám
Áp dụng khi cần chuyển phòng khám cho gói (ví dụ chuyển sang phòng Khám Hợp Đồng hoặc phòng chuyên khoa KSK):
```bash
# Cách 1: Truyền trực tiếp ID phòng khám (VD: 551 - Khám Sức Khỏe Toàn Dân)
npx ts-node scripts/update-contract-address.ts --contract=160 --room=551

# Cách 2: Tìm kiếm tự động thông minh theo tên phòng (không cần nhớ ID)
npx ts-node scripts/update-contract-address.ts --contract=160 --room="Khám Hợp Đồng"

# Cách 3: Chỉ định kèm mã khoa nếu có nhiều phòng trùng tên ở các khoa
npx ts-node scripts/update-contract-address.ts --contract=160 --room="Khám Hợp Đồng" --dept=KBYC
```

---

### Trường hợp 3: Chỉ cập nhật Địa chỉ cho nhân viên trong gói
Áp dụng khi đoàn nhân viên chưa có địa chỉ hoặc địa chỉ bị lỗi mã xã/tỉnh:
```bash
# Tự động nhận diện Tỉnh / Xã từ tên địa danh:
npx ts-node scripts/update-contract-address.ts --contract=160 --address="Thị trấn Nho Quan, Ninh Bình"

# Truyền rõ mã BHYT Tỉnh và Xã đã biết:
npx ts-node scripts/update-contract-address.ts --contract=160 --province=37 --ward=14428 --address="Xã Nho Quan, Ninh Bình"
```

---

### Trường hợp 4: Kết hợp cả Ngày khám, Phòng khám và Địa chỉ
Áp dụng khi chuẩn hóa toàn bộ một gói khám trước khi xuất dữ liệu đẩy cổng liên thông:
```bash
# Bước 1: Luôn chạy thử với cờ --dry-run
npx ts-node scripts/update-contract-address.ts --contract=160 --date="2026-09-20" --room=551 --address="Thị trấn Nho Quan, Ninh Bình" --dry-run

# Bước 2: Sau khi kiểm tra bảng preview chuẩn xác, chạy lưu chính thức
npx ts-node scripts/update-contract-address.ts --contract=160 --date="2026-09-20" --room=551 --address="Thị trấn Nho Quan, Ninh Bình"
```

---

### Trường hợp 5: Cập nhật có chọn lọc cho một số hồ sơ cụ thể
Áp dụng khi chỉ một vài nhân viên trong hợp đồng đến khám vào ngày khác:
```bash
npx ts-node scripts/update-contract-address.ts --contract=160 --date="2026-09-22" --doc-nos="26292454,26292455"
```

---

## 4. Chi Tiết Tác Động Dữ Liệu Theo Bảng & Trường (Database Mapping)

Khi lệnh thực thi thành công, các trường dữ liệu trên hệ thống HIS Core được đồng bộ chuẩn xác:

| Bảng Cơ Sở Dữ Liệu | Trường được cập nhật | Điều kiện & Ghi chú |
| :--- | :--- | :--- |
| **`hms_exm_contract`** | `hec_examdate`<br>`hec_date`<br>`hec_def_roomid` | Lưu ngày khám và mã phòng mặc định cho gói. Các nhân viên tiếp đón sau này sẽ tự động kế thừa. |
| **`hms_exm_employee`** | `hee_examdate`<br>`hee_provid`, `hee_villid`<br>`hee_prov_code`, `hee_vill_code`<br>`hee_address`<br>`hee_updateddate` | Cập nhật ngày khám và địa chỉ theo danh mục hành chính cho từng nhân viên trong gói. |
| **`hms_doc`** | `hd_admitdate`<br>`hd_provid`, `hd_villid`<br>`hd_dtladdr`<br>`hd_updateddate` | Đồng bộ ngày giờ tiếp nhận hồ sơ (`hd_docno`) và địa chỉ bệnh nhân trên phiếu khám HIS. |
| **`hms_exam`** | `he_examdate`<br>`he_roomid`<br>`he_deptid`<br>`he_updateddate` | Đồng bộ ngày khám bác sĩ, buồng khám thực tế và mã khoa phòng tương ứng. |
| **`hms_patient`** | `hp_provid`, `hp_villid`<br>`hp_dtladdr`<br>`hp_updateddate` | Cập nhật thông tin hành chính bệnh nhân gốc (chỉ cập nhật khi hồ sơ bệnh nhân bị thiếu). |
| **`health_check_masters`** | `xml_data`<br>`updated_at` | Tự động đồng bộ các thẻ XML liên thông: `<NGAY_VAO>`, `<NGAY_KHAM>`, `<NGAYLAP>`, `<MATINH_CU_TRU>`, `<MAXA_CU_TRU>`, `<DIA_CHI>`. |

---

## 5. Các Nguyên Tắc An Toàn Dữ Liệu (Safety & Best Practices)

1. **Giao dịch trọn vẹn (ACID Transaction)**:
   * Tất cả các thao tác cập nhật đều nằm trong `BEGIN ... COMMIT`. Nếu bất kỳ lỗi nào xảy ra trong quá trình thực thi, hệ thống sẽ tự động `ROLLBACK` 100%, bảo vệ dữ liệu không bị sai lệch nửa vời.
2. **Khuyến nghị sử dụng Dry-Run**:
   * Trước khi áp dụng cho các gói khám lớn (hàng trăm đến hàng nghìn nhân viên), **luôn chạy kèm cờ `--dry-run` trước** để kiểm tra:
     - Số lượng nhân viên tìm thấy (`targetEmpIds`).
     - Tên phòng khám và mã khoa đã tìm đúng phòng mong muốn chưa.
     - Tỉnh/Xã đã được nhận diện chuẩn xác theo danh mục BHYT chưa.
3. **Quy tắc đối với nhân viên chưa tiếp đón**:
   * Đối với nhân viên chưa tiếp đón trên HIS (`hee_docno` trống hoặc 0), hệ thống sẽ cập nhật bảng nhân viên `hms_exm_employee` và hợp đồng `hms_exm_contract`. Khi nhân viên này được bấm tiếp đón sau đó, HIS Core sẽ tự động nạp ngày khám và phòng khám đã cập nhật.
