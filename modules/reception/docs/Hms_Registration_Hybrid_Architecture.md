# Kiến trúc Lai (Hybrid Architecture) - HMS Registration Backend

Cách tiếp cận này sẽ chuyển Giao dịch Dữ liệu (Database Transaction) có nghiệp vụ phức tạp từ C++ xuống tận cùng **PostgreSQL (bằng PL/pgSQL Stored Procedures)**. 

Bên **Node.js (Tầng API)** sẽ đóng vai trò Gateway (Cổng giao tiếp), làm các nhiệm vụ nhẹ nhàng như: Validate dữ liệu, phân tích mã vạch, kiểm tra logic ngoại trú/nội trú (qua các query đơn giản), và cuối cùng là gọi Function SQL lõi để thực thi lưu trữ.

---

## PHẦN 1: Tầng Cơ Sở Dữ Liệu (PostgreSQL Functions)

Bạn hãy chạy Script SQL dưới đây trực tiếp vào Database để khởi tạo các Hàm xử lý nghiệp vụ. 
*Hàm này nhận đầu vào là 1 đối tượng JSONB từ Node.js gửi xuống và tự động bóc tách, rải dữ liệu ra 4 bảng.*

### 1.1 Hàm Tạo mới (Đăng ký tiếp đón) `hms_register_patient_v2`

```sql
CREATE OR REPLACE FUNCTION hms_register_patient_v2(p_payload JSONB) 
RETURNS JSONB AS $$
DECLARE
    -- Các biến chứa ID tự sinh
    v_patientno BIGINT;
    v_docno BIGINT;
    v_cardidx BIGINT := 0;
    v_receptno INT;
    v_receptidx INT;
    
    -- Các biến bóc tách từ JSON tham số
    v_mode TEXT := p_payload->>'mode';
    v_user TEXT := p_payload->>'currentUser';
    
    v_patient JSONB := p_payload->'patient';
    v_doc JSONB := p_payload->'doc';
    v_card JSONB := p_payload->'card';
    v_exam JSONB := p_payload->'exam';
    
    -- Result
    v_result JSONB;
BEGIN
    --------------------------------------------------
    -- 1. XỬ LÝ LIÊN QUAN ĐẾN BỆNH NHÂN (hms_patient)
    --------------------------------------------------
    IF v_mode = 'ADD_PATIENT' THEN
        -- Sinh ID bệnh nhân mới
        SELECT nextval('hms_patient_hp_patientno_seq') INTO v_patientno;
        
        -- Insert dữ liệu với COALESCE đảm bảo không bị lỗi NULL nếu client (Node.js) quên truyền param
        INSERT INTO hms_patient (
            hp_createdby, hp_createddate, hp_patientno, hp_patientid, 
            hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, 
            hp_ethnic, hp_sin, hp_provid, hp_distid, hp_villid, hp_dtladdr, 
            hp_occupation, hp_workplace, hp_workplaceid, hp_status, hp_rank, 
            hp_position, hp_cmnd, hp_yearofbirth, hp_nationality, hp_cmnddate
        ) VALUES (
            v_user, NOW(), v_patientno, v_patient->>'patientId',
            v_patient->>'surname', v_patient->>'midName', v_patient->>'firstName', (v_patient->>'birthDate')::DATE, v_patient->>'sex',
            COALESCE((v_patient->>'ethnic')::INT, 0), v_patient->>'sin', COALESCE((v_patient->>'provId')::INT, 0), COALESCE((v_patient->>'distId')::BIGINT, 0), COALESCE((v_patient->>'villId')::BIGINT, 0), v_patient->>'dtlAddr',
            COALESCE((v_patient->>'occupation')::INT, 0), v_patient->>'workplace', v_patient->>'workplaceId', COALESCE(v_patient->>'status', 'A'), COALESCE((v_patient->>'rank')::INT, 0),
            COALESCE((v_patient->>'position')::INT, 0), v_patient->>'cmnd', v_patient->>'yearOfBirth', COALESCE(v_patient->>'nationality', 'VN'), (v_patient->>'cmndDate')::DATE
        );
    ELSE
        -- Nếu chỉ đăng ký vào một Bệnh nhân cũ đã tồn tại trên DB
        v_patientno := (v_patient->>'patientNo')::BIGINT;
    END IF;

    --------------------------------------------------
    -- 2. XỬ LÝ LIÊN QUAN ĐẾN DOCUMENT (hms_doc)
    --------------------------------------------------
    IF v_mode = 'ADD_PATIENT' OR v_mode = 'ADD_DOC' THEN
        SELECT nextval('hms_doc_hd_docno_seq') INTO v_docno;
        
        INSERT INTO hms_doc (
            hd_createdby, hd_createddate, hd_docno, hd_patientno, hd_status, 
            hd_telephone, hd_relative, hd_relation, hd_contactaddr, hd_contacttel, 
            hd_object, hd_cardno, hd_cardidx, hd_insregdate, hd_disrate, 
            hd_insline, hd_admitstate, hd_admitdate, hd_admitdept, 
            hd_transplace, hd_transdiagn, hd_transplaceid, 
            hd_xobject, hd_xcardno, hd_xissueplace, hd_xissuedate, 
            hd_reexam, hd_emergency, hd_ma_doituong_kcb
        ) VALUES (
            v_user, NOW(), v_docno, v_patientno, 'O',
            v_doc->>'telephone', v_doc->>'relative', COALESCE((v_doc->>'relation')::INT, 0), v_doc->>'contactAddr', v_doc->>'contactTel',
            v_doc->>'objectId', COALESCE(v_card->>'cardNo', ''), 0, (v_doc->>'insRegDate')::DATE, COALESCE((v_doc->>'disRate')::INT, 0),
            COALESCE(v_doc->>'insLine', 'N'), COALESCE(v_doc->>'admitState', ''), NOW(), v_doc->>'admitDept',
            COALESCE(v_doc->>'transPlace', ''), COALESCE(v_doc->>'transDiagn', ''), COALESCE(v_doc->>'transPlaceId', ''),
            COALESCE(v_doc->>'xObject', ''), COALESCE(v_doc->>'xCardNo', ''), COALESCE(v_doc->>'xIssuePlace', ''), (v_doc->>'xIssueDate')::DATE,
            COALESCE(v_doc->>'reExam', 'N'), COALESCE(v_doc->>'emergency', 'N'), COALESCE(v_doc->>'maDoiTuongKcb', '')
        );
    ELSE
        -- Nếu chỉ Add 1 phiếu khám (exam) vào đợt khám (doc) cũ đang chạy dở
        v_docno := (v_doc->>'docNo')::BIGINT;
    END IF;

    --------------------------------------------------
    -- 3. XỬ LÝ LIÊN QUAN ĐẾN THẺ BHYT (hms_card)
    --------------------------------------------------
    IF (v_card->>'cardNo') IS NOT NULL AND (v_card->>'cardNo') <> '' THEN
        SELECT nextval('hms_card_hc_idx_seq') INTO v_cardidx;
        
        INSERT INTO hms_card (
            hc_createdby, hc_createddate, hc_patientno, hc_cardno, hc_idx, 
            hc_regdate, hc_expdate, hc_regcode, hc_company, hc_code, 
            hc_discount, hc_active, hc_groupid, hc_area
        ) VALUES (
            v_user, NOW(), v_patientno, v_card->>'cardNo', v_cardidx,
            (v_card->>'regDate')::DATE, (v_card->>'expDate')::DATE, v_card->>'regCode', v_card->>'company', v_card->>'code',
            COALESCE((v_card->>'discount')::INT, 0), 'Y', COALESCE((v_card->>'groupId')::INT, 0), COALESCE(v_card->>'area', '')
        );
        
        -- Cập nhật thông tin index của thẻ BHYT ngược vào hồ sơ
        UPDATE hms_doc SET hd_cardidx = v_cardidx, hd_cardno = v_card->>'cardNo' WHERE hd_docno = v_docno;
    END IF;

    --------------------------------------------------
    -- 4. XỬ LÝ PHIẾU KHÁM & MẬT MÃ BỐC SỐ KHÁM (hms_exam)
    --------------------------------------------------
    -- [!IMPORTANT]
    -- Khóa cấp số phòng khám bằng advisory_lock (Tuyệt đối chống Server Đa luồng sinh trùng số thứ tự)
    -- Hash ID phòng khám thành Số nguyên (INT) để khóa tạm thời độc quyền trên Session PGSQL này.
    PERFORM pg_advisory_xact_lock((v_exam->>'roomId')::INT);

    -- Lấy số thứ tự bốc phiếu cho phòng khám ngày hôm nay
    SELECT COALESCE(MAX(he_receptno), 0) + 1 INTO v_receptno
    FROM hms_exam 
    WHERE TRIM(he_deptid) = TRIM(v_exam->>'deptId') 
      AND he_roomid = (v_exam->>'roomId')::INT 
      AND DATE(he_examdate) = DATE(v_exam->>'examDate');

    -- Lấy chỉ mục phòng khám (index) trong 1 đợt hồ sơ điều trị
    SELECT COALESCE(MAX(he_receptidx), 0) + 1 INTO v_receptidx 
    FROM hms_exam WHERE he_docno = v_docno;

    -- Thêm phiếu khám
    INSERT INTO hms_exam (
        he_createdby, he_createddate, he_patientno, he_docno, he_deptid, 
        he_roomid, he_receptno, he_receptidx, he_examtype, he_status, 
        he_examdate, he_doctor, he_examine, he_prediagnostic, he_diagnostic, 
        he_hasfee, he_payment
    ) VALUES (
        v_user, NOW(), v_patientno, v_docno, v_exam->>'deptId', 
        (v_exam->>'roomId')::INT, v_receptno, v_receptidx, v_exam->>'examType', 'O', 
        (v_exam->>'examDate')::TIMESTAMP, COALESCE(v_exam->>'doctor', ''), COALESCE(v_exam->>'examine', ''), COALESCE(v_exam->>'preDiagnostic', ''), COALESCE(v_exam->>'diagnostic', ''), 
        CASE WHEN (v_doc->>'objectId') = 'S' OR (v_exam->>'hasFee') = 'Y' THEN 'Y' ELSE 'N' END, 'N'
    );

    --------------------------------------------------
    -- 5. HẬU XỬ LÝ (KẾ THỪA CÁC DB-FUNCTIONS CỦA HIỆN TẠI) 
    --------------------------------------------------
    -- 5.1 Cận lâm sàng đính kèm tự động
    IF (v_exam->>'refItemId') IS NOT NULL AND (v_exam->>'refItemId') <> '' THEN
        PERFORM pcms_order_additem(
            v_user, v_exam->>'deptId', v_patientno, v_docno, 
            (v_exam->>'roomId')::INT, (v_exam->>'examDate')::TEXT, 
            v_user, 'D0000', v_exam->>'refItemId'
        );
    END IF;

    -- 5.2 Khám thai sản tự động (Nếu phòng khám cấu hình là khám sản)
    -- Ghi chú: Có thể cần thay đổi tham số tuỳ theo Schema PostgreSQL cũ của bạn
    -- PERFORM hms_khamsan_insert(v_patientno, v_docno, v_receptidx);

    -- 5.3 Thu phí nếu là bảng Dịch Vụ và Bật cấu hình Cấp Hoá Đơn Tự Động
    IF (v_doc->>'objectId') = 'S' AND (v_exam->>'isAutoPayment')::BOOLEAN = TRUE THEN
        PERFORM hms_fee_create(v_user, v_docno);
        PERFORM hms_fee_createinvoice_exam(v_docno, 'AUTO', '000101', 0, CURRENT_DATE::TEXT, v_user, 'Thu phis');
    END IF;

    --------------------------------------------------
    -- TRẢ VỀ KẾT QUẢ CHO TẦNG NODE.JS
    --------------------------------------------------
    v_result := jsonb_build_object(
        'success', true,
        'patientNo', v_patientno,
        'docNo', v_docno,
        'receptNo', v_receptno,
        'receptIdx', v_receptidx
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Bất kỳ lệnh INSERT nào Lỗi Validation Database, PL/pgSQL mặc định gộp cả cụm này thành 1 Transaction, tự động làm sạch.
    -- Xả lỗi tường minh trả thẳng ra Node.js qua Exception
    RAISE EXCEPTION 'Lỗi Database HMS Registration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

---

## PHẦN 2: Tầng API Application (Viết bằng Node.js / Express)

Lúc này, API Node.js trở nên vô cùng nhàn rỗi, sạch sẽ, không còn nặng nề mảng quản lý Transaction lớn. Bạn chỉ đóng vai trò Gateway (Kiểm tra chặn, Chống trùng lặp nghiệp vụ, Call Function BHYT).

### Controller `registration.controller.js`

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * [POST] /api/reception/register
 * Chức năng: Đăng ký Tiếp Đón (Bắn toàn bộ JSON Payload vào DB Postgres)
 */
router.post('/register', async (req, res) => {
    try {
        const payload = req.body;
        
        // 1. Validation Cơ Bản
        if (!payload.exam || !payload.exam.roomId) {
            return res.status(400).json({ error: "Thiếu thông tin phòng khám bắt buộc!" });
        }
        if (!payload.currentUser) {
            return res.status(401).json({ error: "Không xác định được người thao tác phần mềm" });
        }

        // ==============================================================
        // 2. CHECK CÁC NGHIỆP VỤ VALIDATION (Chặn)
        // (Đây là logic lấy từ C++ - Giữ Middleware độc lập gọi Query nhẹ ở tầng Node.js)
        // ==============================================================
        
        if(payload.patient.patientNo) {
            // Check: Bệnh nhân có đang nằm viện (ngoại trú/nội trú)?
            const outPatientRes = await pool.query(`SELECT count(*) as c FROM hms_outpatient WHERE hop_docno=$1 AND hop_status IN ('O')`, [payload.doc.docNo]);
            if(outPatientRes.rows[0].c > 0) {
                 return res.status(400).json({ error: "Thất bại. Bệnh nhân đang điều trị ngoại trú, không thể thêm Phiếu Đăng ký mới!" });
            }

            // (Giải định) Cấu hình check BHYT trong ngày (VD trên c++)
            if (payload.card && payload.card.cardNo) {
                 const checkIns = await pool.query(`SELECT count(*) as c FROM hms_doc WHERE hd_patientno=$1 AND hd_cardno=$2 AND DATE(hd_insregdate) = CURRENT_DATE`, [payload.patient.patientNo, payload.card.cardNo]);
                 if(checkIns.rows[0].c > 0) {
                     return res.status(400).json({ error: "Trùng BHYT. Bệnh nhân này đã khám bằng thẻ trên trong khoảng thời gian ngày hôm nay!" });
                 }
            }
        }

        // ==============================================================
        // 3. THỰC THI GHI DỮ LIỆU LÕI VÀO DATABASE
        // ==============================================================
        // -> Serialize toàn bộ Req.Body (payload) thành chuỗi JSON
        const result = await pool.query(`SELECT hms_register_patient_v2($1::jsonb) AS data`, [JSON.stringify(payload)]);
        const dbResult = result.rows[0].data;

        // ==============================================================
        // 4. (Tuỳ Chọn) TÍCH HỢP HỆ THỐNG NGOÀI (Chỉ Node.js làm đc)
        // ==============================================================
        /* 
        setTimeout(() => {
            // (1) Phát thông báo Socket.io lên Bảng LED Gọi số màn hình chờ 
            global.io.emit('new_reception_queue', { roomId: payload.exam.roomId, receptNo: dbResult.receptNo, patientName: payload.patient.surname });

            // (2) Webhook/Zalo ZNS SMS Confirm SMS
            ZaloService.sendSMS(payload.doc.telephone, `Đăng ký thành công! Stt của bạn là ${dbResult.receptNo} tại Phòng ${payload.exam.roomName}.`);
        }, 100);
        */
        
        // 5. Trả Kết quả ra FE
        res.status(200).json({
            success: true,
            message: 'Đăng ký tiếp đón thành công',
            data: dbResult
        });

    } catch (e) {
        console.error("Luồng Đăng ký gặp lỗi:", e);
        // Postgres Exception (được Ném từ "RAISE EXCEPTION") sẽ phi thẳng vào biến "e.message"
        res.status(500).json({ error: 'System Error', detail: e.message });
    }
});


/**
 * [DELETE] /api/reception/register/:docno/:receptIdx
 * Chức năng: Huỷ Đăng Ký (Validation chặn viện phí trên Node.js, Reverse Cascade trên Database)
 */
router.delete('/register/:docno/:receptIdx', async (req, res) => {
    const { docno, receptIdx } = req.params;
    
    try {
        // [BLOCK - VALIDATION 1] Hóa đơn đã tồn tại?
        const checkFee = await pool.query(`SELECT count(*) as c FROM hms_fee_invoice WHERE hfi_docno=$1 AND hfi_type='A'`, [docno]);
        if (checkFee.rows[0].c > 0) {
            return res.status(400).json({ error: "Không thể hủy. Bệnh nhân đã hoàn tất thanh toán viện phí!" });
        }

        // [BLOCK - VALIDATION 2] Có Dịch vụ Cận Lâm Sàng?
        // .. (Thêm query pcms_order check tại đây)
        
        // ==> Nếu Nodejs duyệt hết các Ải, ta chạy File Function "hms_delete_reception_v2" (Lệnh viết y như Insert, có Reverse Delete Cascade)
        // await pool.query(`SELECT hms_delete_reception_v2($1, $2, $3)`, [docno, receptIdx, req.user.id]);

        res.status(200).json({ success: true, message: 'Hủy phiếu thành công!' });
    } catch (e) {
        res.status(500).json({ error: 'Lỗi Hủy Phiếu Khám', detail: e.message });
    }
});

module.exports = router;
```
