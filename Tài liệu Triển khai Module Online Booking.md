# TÀI LIỆU TRIỂN KHAI MODULE ONLINE BOOKING (vClinic)

Tài liệu này hướng dẫn cách thiết lập cơ sở dữ liệu và các thành phần cần thiết để triển khai Module Đặt lịch trực tuyến trên máy chủ mới.

## 1. Tổng quan các thành phần
Hệ thống sử dụng các thực thể chính sau:
- **`qms_patient`**: Lưu trữ thông tin đăng ký khám từ Web/App/Mobile.
- **`hms_schedule_exam`**: Quản lý chi tiết từng slot thời gian (08:00, 08:15...).
- **`qms_patient_create_booking`**: Function xử lý nghiệp vụ đặt lịch (kiểm tra trùng, lưu dữ liệu).

## 2. SQL Script Khởi tạo (DDL & Logic)

Hãy chạy script dưới đây trên cơ sở dữ liệu PostgreSQL của bạn.

```sql
/*******************************************************************************
 * 1. TẠO SEQUENCE CẦN THIẾT
 *******************************************************************************/
CREATE SEQUENCE IF NOT EXISTS qms_idx_asq;
CREATE SEQUENCE IF NOT EXISTS qms_patient_qms_idx_seq;
CREATE SEQUENCE IF NOT EXISTS hms_schedule_hs_id_seq;
CREATE SEQUENCE IF NOT EXISTS hms_schedule_exam_hse_idx_seq;

/*******************************************************************************
 * 2. TẠO CÁC BẢNG DỮ LIỆU
 *******************************************************************************/

-- Bảng lưu trữ lịch hẹn trực tuyến
CREATE TABLE IF NOT EXISTS public.qms_patient
(
    qms_idx integer NOT NULL DEFAULT nextval('qms_patient_qms_idx_seq'::regclass),
    qms_createddate timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    qms_createdby character varying(15),
    qms_updateddate timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    qms_updatedby character varying(15),
    
    -- Thông tin hành chính
    qms_idcard character varying(32),            -- Số CCCD
    qms_idcard_issuedate date,                   -- Ngày cấp CCCD
    qms_patientname character varying(65) NOT NULL,
    qms_sex character varying(1) NOT NULL,       -- M/F
    qms_birthdate date,
    qms_ethnic integer,
    qms_occupation integer,
    qms_address character varying(254),
    qms_prov_id integer,
    qms_dist_id integer,
    qms_vill_id integer,
    qms_contact character varying(32),           -- Số điện thoại
    qms_email character varying(32),
    
    -- Thông tin đặt lịch
    qms_deptid character varying(15),           -- Mã khoa (HIS)
    qms_roomid integer,                         -- Mã phòng (HIS)
    qms_specialty_code character varying(15),   -- Mã chuyên khoa (Portal)
    qms_appointment_date date,
    qms_appointment_time character varying(10),
    qms_receptno integer,                       -- Số thứ tự trong slot
    qms_reason character varying(512),
    qms_status character varying(1) DEFAULT 'O', -- O=Open, S=Scheduled, C=Cancelled
    qms_doctor character varying(15),
    
    -- Phân loại & Đối tượng
    qms_type character varying(1) DEFAULT 'O',   -- ONL=Online, KIO=Kiosk
    qms_is_insurance boolean DEFAULT FALSE,     -- Có BHYT hay không
    qms_is_priority boolean DEFAULT FALSE,      -- Đối tượng ưu tiên
    
    -- Liên kết HIS (Cập nhật sau khi duyệt)
    qms_patientno integer,
    qms_docno integer,
    
    CONSTRAINT qms_patient_pkey PRIMARY KEY (qms_idx)
);

-- Bảng quản lý Slot thời gian chi tiết
CREATE TABLE IF NOT EXISTS public.hms_schedule_exam
(
    hse_idx integer NOT NULL DEFAULT nextval('hms_schedule_exam_hse_idx_seq'::regclass),
    hse_deptid character varying(15) NOT NULL,
    hse_roomid integer NOT NULL,
    hse_date date NOT NULL,
    hse_time character varying(5) NOT NULL,     -- Ví dụ: 08:30
    hse_receptno integer NOT NULL,
    hse_status character varying(1) DEFAULT 'O', -- O=Trống, S=Đã đặt, F=Khóa
    hse_appointdate timestamp without time zone,
    hse_createddate timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hms_schedule_exam_pkey PRIMARY KEY (hse_deptid, hse_roomid, hse_receptno, hse_date)
);

/*******************************************************************************
 * 3. STORED PROCEDURES (LOGIC CỐT LÕI)
 *******************************************************************************/

-- Hàm tạo lịch hẹn từ Web/App (Phiên bản cập nhật đa chuyên khoa)
CREATE OR REPLACE FUNCTION public.qms_patient_create_booking(
    p_cccd text,
    p_ho_ten text,
    p_ngay_sinh DATE,
    p_gioi_tinh text,
    p_dan_toc text,
    p_ma_tinh       INTEGER,
    p_ma_quan_huyen INTEGER,
    p_ma_phuong_xa  INTEGER,
    p_dia_chi_chi_tiet text,
    p_so_dien_thoai text,
    p_ma_khoa text,
    p_ma_phong_kham INTEGER,
    p_ngay_hen      DATE,
    p_gio_hen text,
    p_ly_do_kham text,
    p_occupation INTEGER,
    p_doctor text,
    p_email text DEFAULT ''::text,
    p_type text DEFAULT 'ONL'::text,
    p_ngay_cap_cccd DATE DEFAULT NULL,
    p_is_priority BOOLEAN DEFAULT FALSE,
    p_is_insurance BOOLEAN DEFAULT FALSE,
    p_ma_chuyen_khoa text DEFAULT ''::text) RETURNS INTEGER LANGUAGE 'plpgsql'
AS $BODY$
  DECLARE
    v_idx      INTEGER;
    v_receptno INTEGER;
    v_count    INTEGER;
  BEGIN
    -- 1. Kiểm tra Slot có còn trống không
    SELECT COUNT(*) INTO v_count FROM hms_schedule_exam
    WHERE hse_date = p_ngay_hen AND hse_deptid = p_ma_khoa AND hse_roomid = p_ma_phong_kham
    AND hse_time = p_gio_hen AND hse_status = 'S';
    
    IF v_count > 0 THEN RETURN -1; END IF; -- Block đã bị người khác đặt

    -- 2. Kiểm tra trùng lặp: BN đã đăng ký Chuyên khoa này trong ngày chưa?
    -- CHỈ KIỂM TRA TRÙNG CHUYÊN KHOA (Cho phép đăng ký nhiều chuyên khoa khác nhau/ngày)
    -- Cho phép đăng ký lại nếu lịch cũ đã bị hủy (status = 'C')
    SELECT COUNT(*) INTO v_count FROM qms_patient
    WHERE qms_contact = p_so_dien_thoai 
      AND qms_specialty_code = p_ma_chuyen_khoa
      AND qms_appointment_date = p_ngay_hen
      AND qms_status != 'C';
      
    IF v_count > 0 THEN RETURN -3; END IF; 

    -- 3. Lấy số thứ tự (receptno) theo Slot
    SELECT hse_receptno INTO v_receptno FROM hms_schedule_exam
    WHERE hse_deptid = p_ma_khoa AND hse_roomid = p_ma_phong_kham
    AND hse_date = p_ngay_hen AND hse_time = p_gio_hen;
    
    IF NOT FOUND THEN v_receptno := 0; END IF;

    -- 4. Tạo bản ghi đặt lịch
    SELECT nextval('qms_idx_asq') INTO v_idx;
    
    INSERT INTO qms_patient (
        qms_idx, qms_idcard, qms_idcard_issuedate, qms_patientname, qms_birthdate, qms_sex, 
        qms_ethnic, qms_prov_id, qms_dist_id, qms_vill_id, qms_address, qms_contact,
        qms_email, qms_deptid, qms_roomid, qms_appointment_date, qms_appointment_time,
        qms_reason, qms_status, qms_receptno, qms_occupation, qms_doctor, qms_type,
        qms_is_priority, qms_is_insurance, qms_specialty_code
    ) VALUES (
        v_idx, p_cccd, p_ngay_cap_cccd, p_ho_ten, p_ngay_sinh, p_gioi_tinh, 
        (CASE WHEN p_dan_toc = '' THEN NULL ELSE p_dan_toc::INTEGER END), 
        p_ma_tinh, p_ma_quan_huyen, p_ma_phuong_xa, p_dia_chi_chi_tiet, p_so_dien_thoai,
        p_email, p_ma_khoa, p_ma_phong_kham, p_ngay_hen, p_gio_hen,
        p_ly_do_kham, 'O', v_receptno, p_occupation, p_doctor, p_type,
        p_is_priority, p_is_insurance, p_ma_chuyen_khoa
    );
      
    RETURN v_idx;
  END;
$BODY$;
```

## 3. Các bước thực hiện triển khai

### Bước 1: Khởi tạo Database
1.  Đăng nhập vào PostgreSQL trên máy chủ mới.
2.  Chạy script SQL ở mục **2** để tạo bảng, sequence và function.

### Bước 2: Cấu hình Backend (Node.js/Express)
1.  Copy mã nguồn Backend vào thư mục triển khai.
2.  Cập nhật file `.env` với thông số kết nối Database:
    ```env
    DB_HOST=10.1.x.x
    DB_PORT=5432
    DB_NAME=vimes_jsc
    DB_USER=postgres
    DB_PASS=*******
    ```
3.  Cài đặt dependencies: `npm install`
4.  Chạy ứng dụng: `npm run start` hoặc dùng PM2: `pm2 start src/server.js --name vclinic-api`

### Bước 3: Đấu nối với dữ liệu HIS thực tế
Module này yêu cầu các bảng HIS sau phải có dữ liệu để hoạt động:
- `hms_patient`: Kiểm tra thông tin bệnh nhân cũ.
- `sys_dept`: Lấy danh sách khoa phòng khám.
- `hms_roomlist`: Lấy danh sách phòng khám thực tế.

### Bước 4: Tạo dữ liệu Slot khám (Quan trọng)
Bệnh nhân chỉ có thể đặt lịch nếu trong bảng `hms_schedule_exam` có các bản ghi trống cho ngày/giờ đó.
- Cần chạy script khởi tạo Slot cho các phòng khám (dựa trên ca làm việc của bác sĩ).

## 4. Kiểm tra (Health Check)
1.  **Hàm Đặt lịch**: Dùng Postman gọi API `/api/v1/booking/register` với payload mẫu.
2.  **Dữ liệu**: Kiểm tra bảng `qms_patient` có lưu đúng `qms_specialty_code` không.
3.  **Approve**: Thử duyệt lịch hẹn từ Dashboard để đảm bảo nó đẩy được vào bảng khám bệnh của HIS.
