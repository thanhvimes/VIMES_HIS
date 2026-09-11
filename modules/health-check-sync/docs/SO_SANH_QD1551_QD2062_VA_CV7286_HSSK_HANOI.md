# BÁO CÁO PHÂN TÍCH SO SÁNH: CÔNG VĂN 7286/SYT-QLBHYTCNTT (HSSKĐT HÀ NỘI) VỚI QUYẾT ĐỊNH 1551 VÀ QUYẾT ĐỊNH SỬA ĐỔI 2062/QĐ-BYT

> **Tài liệu kỹ thuật và định hướng kiến trúc module `health-check-sync` - Hệ thống VIMES_HIS**  
> **Căn cứ phân tích:**  
> 1. *Quyết định số 1551/QĐ-BYT* ngày 31/05/2026 của Bộ Y tế.  
> 2. *Quyết định số 2062/QĐ-BYT* ngày 07/07/2026 của Bộ Y tế (sửa đổi, bổ sung QĐ 1551/QĐ-BYT).  
> 3. *Công văn số 7286/SYT-QLBHYTCNTT* ngày 22/07/2026 của Sở Y tế Hà Nội (tệp PDF `20072026 lien thong du lieu CS KCB lên hsskđt.pdf`).

---

## 1. Tổng quan các văn bản và mối quan hệ

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                 Quyết định 1551/QĐ-BYT (31/05/2026)              │
  │     Quy định khung kết nối, liên thông dữ liệu KSK lên VNeID      │
  └─────────────────────────────────┬────────────────────────────────┘
                                    │ Sửa đổi toàn diện cấu trúc XML & Phụ lục
                                    ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │                 Quyết định 2062/QĐ-BYT (07/07/2026)              │
  │   Thay thế 17 mẫu rời rạc -> Gói XML Envelope 3 nhóm độ tuổi     │
  └─────────────────────────────────┬────────────────────────────────┘
                                    │ Hà Nội cụ thể hóa triển khai địa phương
                                    ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │          Công văn 7286/SYT-QLBHYTCNTT Hà Nội (22/07/2026)        │
  │ Mô hình Hub trung gian: CSKCB HN -> HSSKĐT Hà Nội -> CSDL Bộ Y tế│
  └──────────────────────────────────────────────────────────────────┘
```

- **Quyết định 1551/QĐ-BYT**: Là văn bản gốc cấp Bộ, đặt nền móng cho việc liên thông kết quả khám sức khỏe (KSK) lên CSDL sức khỏe cá nhân để hiển thị trên ứng dụng định danh VNeID. Tuy nhiên, ban đầu chia thành 17 mẫu biểu XML riêng lẻ rất phức tạp.
- **Quyết định 2062/QĐ-BYT**: Là văn bản sửa đổi, bổ sung của Bộ Y tế thay thế Phụ lục 01-03 của QĐ 1551. Điểm cốt lõi là gom toàn bộ nghiệp vụ KSK thành **mô hình Master-Detail gồm 3 nhóm độ tuổi** (Trẻ < 6 tuổi, Từ 6 đến dưới 18 tuổi, Từ 18 tuổi trở lên), đóng gói trong phong bì XML `<KHAMSUCKHOE>` với các thẻ từ `XML1` đến `XML12`, đồng thời siết chặt tiêu chuẩn "Đúng - Đủ - Sạch - Sống" và chữ ký số.
- **Công văn 7286/SYT-QLBHYTCNTT (file PDF của bạn)**: Là văn bản hướng dẫn kỹ thuật và chỉ đạo triển khai **cấp địa phương của Sở Y tế TP. Hà Nội**. Hà Nội thiết lập một Hub dữ liệu tập trung (`https://hssk.hanoi.gov.vn`). Các cơ sở y tế tại Hà Nội không đẩy trực tiếp lên cổng Bộ Y tế mà đẩy về Hub của Sở Y tế Hà Nội; từ Hub này, Sở Y tế sẽ tích hợp, đồng bộ tiếp lên Cổng dữ liệu của Bộ Y tế để cập nhật sang VNeID.

---

## 2. Bảng so sánh chi tiết các tiêu chí

| Tiêu chí | Quyết định 1551/QĐ-BYT | Quyết định sửa đổi 2062/QĐ-BYT | Công văn 7286/SYT-QLBHYTCNTT (HSSKĐT Hà Nội) |
| :--- | :--- | :--- | :--- |
| **Cơ quan ban hành** | Bộ Y tế | Bộ Y tế | Sở Y tế TP. Hà Nội |
| **Ngày ban hành** | 31/05/2026 | 07/07/2026 | 22/07/2026 |
| **Phạm vi áp dụng** | Toàn quốc | Toàn quốc | Các cơ sở KCB trên địa bàn TP. Hà Nội |
| **Mô hình kết nối** | CSKCB $\rightarrow$ Cổng dữ liệu BYT $\rightarrow$ VNeID | CSKCB $\rightarrow$ Cổng dữ liệu BYT $\rightarrow$ VNeID | CSKCB tại Hà Nội $\rightarrow$ **Hệ thống HSSKĐT TP. Hà Nội (`hssk.hanoi.gov.vn`)** $\rightarrow$ CSDL sức khỏe cá nhân BYT $\rightarrow$ VNeID |
| **Cấu trúc dữ liệu XML** | 17 biểu mẫu XML độc lập | Gói phong bì `<KHAMSUCKHOE>` phân theo 3 nhóm tuổi (`XML1` đến `XML12`) | **Sử dụng 100% cấu trúc XML của QĐ 2062/QĐ-BYT** (Phụ lục II mục 2.4 và các trang 11-17 mô tả đúng chuẩn phong bì QĐ 2062) |
| **Cấu trúc gói tin API (Payload)** | JSON bọc Base64 XML: `{ header, data: { content: base64_xml }, signature }` | Kế thừa nguyên vẹn chuẩn JSON envelope từ QĐ 1551 | **Hoàn toàn giống hệt:** `{ header, data: { content: base64_xml }, signature }` |
| **Thông số Header gói tin** | `version`, `sender_id`, `receiver_id`, `txn_type`, `msg_id`, `msg_type`, `data_type`, `send_datetime` | Tương tự QĐ 1551 | `receiver_id` quy định cố định là **`"VTS"`** (Viettel Solutions). `version`: `"1.0"`. `txn_type`: `"sync_checkup"`. |
| **Cơ chế Chữ ký số** | XMLDSig + Chữ ký Checksum JSON (`${hashA}.${hashB}`) | Bắt buộc CKS cá nhân bác sĩ (`<CKS_NGUOI_KET_LUAN>`) và CKS đơn vị (`<CKS_BENH_VIEN>`) | Bắt buộc 2 lớp: CKS trong XML (`<CKS_NGUOI_KET_LUAN>`, `<CKS_BENH_VIEN>`) và chữ ký số gói tin `signature` ở JSON header/data |
| **API Endpoint Đăng nhập** | `/auth/login` (hoặc OAuth2 tùy cổng) | Theo chuẩn Cổng dữ liệu BYT | `POST https://api-hssk.hanoi.gov.vn/api/v1/resource/authentication/login` |
| **API Endpoint Đẩy dữ liệu** | `/platform/data-sync/push` hoặc tương đương | Theo tài liệu kỹ thuật Cổng BYT | `POST https://api-hssk.hanoi.gov.vn/api/v1/medical-record/ksk-lien-thong/kham-suc-khoe` |
| **Dữ liệu phản hồi (Push Response)** | Chuẩn trả lời Cổng BYT | Chuẩn trả lời Cổng BYT | `{ "maGiaoDich": "...", "message": "...", "status": 200 }` (Lưu lại `maGiaoDich` để tra cứu lịch sử) |
| **Yêu cầu hạ tầng / An toàn** | Cổng Internet bảo mật HTTPS | HTTPS, Token, CKS | Bắt buộc **đăng ký IP Whitelist** từ phía cơ sở khám chữa bệnh với Sở Y tế; cấp tài khoản theo CSKCB |
| **Đối soát & Tra cứu** | Cổng tiếp nhận BYT | Cổng tiếp nhận BYT | Portal quản trị chuyên biệt: `https://hssk.hanoi.gov.vn` (Menu: Quản trị $\rightarrow$ Theo dõi liên thông $\rightarrow$ Lịch sử liên thông KSK) |

---

## 3. Trả lời câu hỏi: Có thể áp dụng chung một app hay phải tách ra thành apps riêng?

### 👉 KẾT LUẬN: **HOÀN TOÀN CÓ THỂ VÀ BẮT BUỘC NÊN DÙNG CHUNG MỘT APP (TỨC CHUNG MỘT MODULE `health-check-sync` TRÊN VIMES_HIS)!**

Tuyệt đối **KHÔNG** nên tách thành app riêng vì các lý do cốt lõi sau:

### 3.1. Nghiệp vụ và Lõi sinh XML (Data Core) giống nhau 100%
- Cả QĐ 2062 của Bộ Y tế và Công văn 7286 của SYT Hà Nội đều quy định **dùng chung một chuẩn XML** (Gói phong bì `<KHAMSUCKHOE>`, chia 3 nhóm tuổi, bóc tách `XML1` thông tin hành chính, `XML2` thông tin lượt khám, `XML3` sinh tồn, `XML7` chuyên khoa, `XML11` cận lâm sàng, `XML12` kết luận).
- Nguồn dữ liệu từ HIS Core (`hms_patient`, `hms_doc`, `hms_exam`, `hms_clinical`, `hms_cls`) là một.
- Nếu tách thành 2 app, bạn sẽ phải nhân đôi toàn bộ logic xuất XML, kiểm tra chỉ tiêu y tế, ký số USB/HSM. Khi Bộ Y tế hoặc Sở Y tế điều chỉnh một trường dữ liệu, bạn sẽ phải cập nhật và kiểm thử 2 lần, cực kỳ dễ sinh lỗi không đồng bộ.

### 3.2. Sự khác biệt chỉ nằm ở Tầng giao vận (Gateway / Transport Layer)
Điểm khác nhau duy nhất giữa cổng Bộ Y tế và cổng Sở Y tế Hà Nội là:
1. **URL Endpoint**:
   - Cổng BYT/Sandbox: `https://api-sandbox.emrhub.vn/api/auth/login` và `/platform/data-sync/push`.
   - Cổng SYT Hà Nội: `https://api-hssk.hanoi.gov.vn/api/v1/resource/authentication/login` và `/api/v1/medical-record/ksk-lien-thong/kham-suc-khoe`.
2. **Thông số gói tin**:
   - `receiver_id`: Cổng BYT dùng `"emrhub"` hoặc `"BYT"`; Cổng SYT Hà Nội dùng `"VTS"`.
   - Token trả về: Cổng BYT thường trả `res.data.data.token`; Cổng Hà Nội trả `res.data.access_token`.
3. **Mã giao dịch đối soát**:
   - Cổng Hà Nội trả về `maGiaoDich` để lưu lại tra cứu trên web `hssk.hanoi.gov.vn`.

### 3.3. Quy định liên thông một chiều tránh gửi trùng lặp
- Theo chỉ đạo tại trang 1-2 của Công văn 7286: Dữ liệu gửi lên Hệ thống HSSKĐT Hà Nội sẽ được Sở Y tế Hà Nội tự động liên thông tiếp lên CSDL sức khỏe cá nhân của Bộ Y tế để cập nhật Sổ SKĐT trên VNeID.
- Do đó, đối với các cơ sở y tế trên địa bàn Hà Nội, **chỉ cần gửi duy nhất lên Cổng Sở Y tế Hà Nội là hoàn thành nghĩa vụ cho cả cấp Thành phố và cấp Bộ**. Việc tách riêng 2 app có nguy cơ khiến người dùng bấm gửi cả 2 nơi, dẫn đến xung đột phiên bản và trùng lặp dữ liệu trên VNeID.

---

## 4. Giải pháp Kiến trúc Đề xuất cho VIMES_HIS

Áp dụng mô hình **Multi-Gateway Adapter Pattern** ngay trong module `health-check-sync` hiện tại:

```
                  ┌──────────────────────────────────────────────┐
                  │    UI Module Khám Sức Khỏe (health-check)    │
                  │   (Tiếp đón -> Khám lâm sàng -> Ký số HSM)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          XML Generator (Chuẩn QĐ 2062)        │
                  │    Phong bì <KHAMSUCKHOE> (XML1 -> XML12)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │   Gateway Strategy Router   │
                          └──────┬───────────────┬──────┘
                                 │               │
      [Cấu hình: SYT Hà Nội]     │               │   [Cấu hình: Cổng BYT/Sandbox]
                                 ▼               ▼
      ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
      │       HanoiHsskGatewayAdapter     │    │        BytVneidGatewayAdapter     │
      │  - Host: api-hssk.hanoi.gov.vn   │    │  - Host: api-sandbox.emrhub.vn   │
      │  - Auth: /api/v1/.../login       │    │  - Auth: /api/auth/login          │
      │  - Push: /api/v1/.../kham-suc-khoe│    │  - Push: /platform/data-sync/push │
      │  - Receiver ID: "VTS"             │    │  - Receiver ID: "emrhub"          │
      └───────────────────────────────────┘    └───────────────────────────────────┘
```

### Các bước cấu hình trong hệ thống:
1. **Thêm tùy chọn Gateway trong màn hình Cấu hình KSK (`health_check_settings`)**:
   - Trường `gateway_type`:
     - `HANOI_HSSK` (Hồ sơ sức khỏe điện tử TP. Hà Nội - Mặc định cho khách hàng Hà Nội).
     - `BYT_VNEID` (Cổng trực tiếp Bộ Y tế / EMRHub).
2. **Quản lý tài khoản và IP Whitelist**:
   - Cơ sở KCB đăng ký dải IP mạng tĩnh của bệnh viện/phòng khám với Sở Y tế Hà Nội (theo lưu ý tại mục I.1.1 của CV 7286).
   - Nhập `username` và `password` do Sở Y tế Hà Nội cấp vào phần cấu hình.
3. **Lưu vết và Tra cứu đối soát**:
   - Bảng `health_check_masters` đã có trường `response_log` và trạng thái gửi; chỉ cần lưu thêm `maGiaoDich` (hoặc mã transaction ID) do API SYT Hà Nội trả về để đối soát trực tiếp trên cổng `https://hssk.hanoi.gov.vn`.
