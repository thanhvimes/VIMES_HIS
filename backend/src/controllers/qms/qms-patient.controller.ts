import { Request, Response } from 'express';
import { pool } from '../../config/database';

const safeQuery = async (queryText: string, params: any[] = [], mockReturn: any[] = []): Promise<any[]> => {
  try {
    const result = await pool.query(queryText, params);
    return result.rows;
  } catch (err: any) {
    console.warn(`[DB Error] ${err.message}. Query: "${queryText}". Params: ${JSON.stringify(params)}`);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    return mockReturn;
  }
};

const MOCK_DB = {
  patients: [
    {
      patientId: '20240001',
      name: 'NGUYỄN VĂN MẪU',
      dob: '15/05/1945',
      gender: 'Nam',
      identityNumber: '001045001234',
      address: '123 Đường Láng, Đống Đa, Hà Nội',
      insuranceNumber: 'GD4797921800001'
    },
    {
      patientId: '20240002',
      name: 'TRẦN THỊ TEST',
      dob: '20/10/1988',
      gender: 'Nữ',
      identityNumber: '001088005678',
      address: '456 Lê Lợi, Quận 1, TP. HCM',
      insuranceNumber: 'DN4797921800002'
    }
  ],
  pendingOrders: {
    '20240001': [
      { id: 'XN01', name: 'Tổng phân tích tế bào máu ngoại vi', category: 'Xét nghiệm máu' },
      { id: 'XN02', name: 'Glucose (Máu)', category: 'Xét nghiệm máu' },
      { id: 'CD01', name: 'Chụp X-quang phổi thẳng', category: 'Chẩn đoán hình ảnh' },
      { id: 'CD02', name: 'Siêu âm ổ bụng tổng quát', category: 'Chẩn đoán hình ảnh' }
    ],
    '20240002': [
      { id: 'XN05', name: 'Xét nghiệm nước tiểu 10 thông số', category: 'Xét nghiệm' },
      { id: 'CD05', name: 'Chụp CT Scanner sọ não', category: 'Chẩn đoán hình ảnh' }
    ]
  } as Record<string, any[]>
};

export class QmsPatientController {
  // 9. GET PATIENT DETAILS FROM HIS
  static async getPatientFromHIS(req: Request, res: Response) {
    const { identity } = req.params;
    try {
      const data = await safeQuery(`
        SELECT hp_patientno AS "patientId",
        trim(hp_surname ||' '|| hp_midname ||' '|| hp_firstname) AS name,
        hp_birthdate AS dob,
        CASE WHEN hp_sex = 'M' THEN 'Nam' WHEN hp_sex = 'F' THEN 'Nữ' ELSE 'Khác' END AS gender,
        hp_sin AS "identityNumber",
        hp_cmnddate AS "identityDate",
        hms_getaddress(hp_provid, hp_distid, hp_villid) AS address,
        hp_provid AS "provinceCode", 
        hp_villid AS "wardCode",
        hc_cardno AS "insuranceNumber"
        FROM hms_patient
        LEFT JOIN hms_card ON (hc_patientno = hp_patientno)
        WHERE hp_sin::text = $1 LIMIT 1`, [identity]);

      if (data.length > 0) {
        res.json(data[0]);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          const mockPatient = MOCK_DB.patients.find(p => p.identityNumber === identity || p.patientId === identity || p.insuranceNumber === identity);
          if (mockPatient) return res.json(mockPatient);
        }
        res.status(404).json({ message: "Patient not found in HIS" });
      }
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        const mockPatient = MOCK_DB.patients.find(p => p.identityNumber === identity || p.patientId === identity || p.insuranceNumber === identity);
        if (mockPatient) return res.json(mockPatient);
      }
      res.status(500).json({ success: false, message: "Lookup failed", error: err.message });
    }
  }

  // 10. GET PENDING ORDERS
  static async getPendingOrders(req: Request, res: Response) {
    const { searchId } = req.params;
    try {
      const patientQuery = await safeQuery(`
        SELECT hp_patientno, hd_docno, 
               trim(hp_surname ||' '|| hp_midname ||' '|| hp_firstname) as patient_name,
               hp_birthdate as dob,
               EXTRACT(YEAR FROM AGE(hp_birthdate)) as age
        FROM hms_patient
        JOIN hms_doc ON (hd_patientno = hp_patientno)
        LEFT JOIN hms_card ON (hc_patientno = hp_patientno)
        WHERE hp_sin::text = $1 
           OR hc_cardno::text = $1 
           OR hp_patientno::text = $1
           OR hd_docno::text = $1
        ORDER BY hd_admitdate DESC LIMIT 1`,
        [searchId]
      );

      if (patientQuery.length === 0) {
        if (process.env.NODE_ENV !== 'production') {
          const mockP = MOCK_DB.patients.find(p => p.identityNumber === searchId || p.patientId === searchId || p.insuranceNumber === searchId);
          if (mockP) {
            const age = new Date().getFullYear() - parseInt(mockP.dob.split('/')[2]);
            return res.json({
              success: true,
              patient: {
                patientId: mockP.patientId,
                docNo: 'DOC-' + mockP.patientId,
                name: mockP.name,
                dob: mockP.dob,
                age: age,
                isPriority: age >= 75
              },
              orders: MOCK_DB.pendingOrders[mockP.patientId] || []
            });
          }
        }
        return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ bệnh nhân." });
      }

      const { hp_patientno, hd_docno, patient_name, dob, age } = patientQuery[0];
      const orders = await safeQuery(`
        SELECT 
            hpcl_itemid as id,
            hfl_name as name,
            hfg_name as category,
            hpcl_status as status
        FROM hmsv_paraclinicline
        LEFT JOIN hms_fee_list ON (hfl_feeid = hpcl_itemid)
        LEFT JOIN hms_fee_group ON (hfg_id = hfl_groupid)
        WHERE hpcl_docno = $1 
        AND hpcl_status NOT IN ('D', 'C')
        ORDER BY category`, [hd_docno]);

      res.json({
        success: true,
        patient: {
          patientId: hp_patientno,
          docNo: hd_docno,
          name: patient_name,
          dob: dob,
          age: age,
          isPriority: age >= 75
        },
        orders: orders
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Lỗi kiểm tra chỉ định HIS" });
    }
  }

  // 14. GET PATIENT VISITS
  static async getPatientVisits(req: Request, res: Response) {
    const { searchId } = req.params;
    try {
      const data = await safeQuery(`
        SELECT DISTINCT hd_docno as id, 
        TO_CHAR(hd_admitdate, 'DD/MM/YYYY') as date, 
        hd_diagnostic as diagnosis, 
        sd_name as department,
        hp_sin as identityNumber,
        COALESCE(trim(hp_surname ||' '|| hp_midname ||' '|| hp_firstname), 'Bệnh nhân') as patientName,
        COALESCE(hms_getusername(hd_doctor), 'BS. Khám') as doctorName
        FROM hms_doc
        JOIN hms_patient ON (hd_patientno = hp_patientno)
        LEFT JOIN sys_dept ON (hd_admitdept = sd_id)
        WHERE hp_sin = $1 OR hp_patientno = $1
        ORDER BY date DESC LIMIT 10`, [searchId]);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: "Error fetching visits" });
    }
  }

  // 15. GET MEDICAL RECORD DETAILS
  static async getMedicalRecord(req: Request, res: Response) {
    const { recordId } = req.params;
    try {
      const data = await safeQuery(`
        SELECT 
            hd_docno as id, 
            TO_CHAR(hd_admitdate, 'DD/MM/YYYY') as date,
            TO_CHAR(hd_admitdate, 'HH24:MI') as time,
            '' as reason,
            hd_diagnostic as diagnosis,
            hd_icd as icd10,
            '' as treatment, 
            hd_advice as advice,
            COALESCE(trim(hp_surname ||' '|| hp_midname ||' '|| hp_firstname), 'Bệnh nhân') as patientName,
            hp_patientno as patientId,
            CASE WHEN hp_sex = 'M' THEN 'Nam' WHEN hp_sex = 'F' THEN 'Nữ' ELSE 'Khác' END as gender,
            TO_CHAR(hp_birthdate, 'DD/MM/YYYY') as dob,
            EXTRACT(YEAR FROM AGE(hp_birthdate)) as age,
            hms_getaddress(hp_provid, hp_distid, hp_villid) AS address,
            hc_cardno as insuranceCard,
            hp_sin as identityNumber,
            sd_name as department,
            COALESCE(hms_getusername(hd_doctor), 'Đang cập nhật') as doctorName
        FROM hms_doc
        JOIN hms_patient ON (hd_patientno = hp_patientno)
        LEFT JOIN hms_card ON (hc_patientno = hp_patientno)
        LEFT JOIN sys_dept ON (hd_admitdept = sd_id)
        WHERE hd_docno = $1`, [recordId]);
      if (data.length > 0) res.json(data[0]);
      else res.status(404).json({ message: "Record not found" });
    } catch (err: any) {
      res.status(500).json({ message: "Error fetching record detail" });
    }
  }

  static async getRecordVitals(req: Request, res: Response) {
    const { recordId } = req.params;
    try {
      const data = await safeQuery(`
        SELECT he_pulse as pulse,
              he_temperature as temperature,
              he_bloodpressure as bp_sys,
              he_bloodpressurex as bp_dia,
              CONCAT(he_bloodpressure, '/', he_bloodpressurex) as bloodPressure,
              he_breathinterval as respiratoryRate,
              he_weight as weight,
              he_height as height,
              he_bmi as bmi,
              0 as spo2
        FROM hms_exam
        WHERE he_docno = $1
        AND (he_bmi + he_pulse + he_temperature + he_weight) > 0
        LIMIT 1`, [recordId]);

      if (data.length > 0) {
        res.json(data[0]);
      } else {
        res.json({
          pulse: 0,
          temperature: 0,
          bloodPressure: '0/0',
          respiratoryRate: 0,
          weight: 0,
          height: 0,
          bmi: 0,
          spo2: 0
        });
      }
    } catch (err: any) {
      res.status(500).json({ message: "Error fetching vitals" });
    }
  }

  static async getRecordLabResults(req: Request, res: Response) {
    const { recordId } = req.params;
    try {
      const data = await safeQuery(`
        SELECT hfg_name AS category,
            hfl_name      AS name,
            hfl_unit      AS unit,
            hpcl_result   AS value,
            COALESCE(hpcl_normal, '') AS reference_range,
            CASE
                WHEN hpcl_note IN('H','L')
                THEN true
                ELSE false
            END AS is_abnormal
        FROM hms_testorderline
        LEFT JOIN hms_fee_list ON (hfl_feeid=hpcl_itemid)
        LEFT JOIN hms_fee_group ON (hfg_id=hfl_groupid)
        WHERE hpcl_docno = $1            
        ORDER BY category, hpcl_orderid, hfl_idx`, [recordId]);
      res.json(data);
    } catch (err: any) {
      res.json([]);
    }
  }

  static async getRecordPrescription(req: Request, res: Response) {
    const { recordId } = req.params;
    try {
      const data = await safeQuery(`
        SELECT hpo_orderid as orderid, hpo_orderdate as date,
            hms_getusername(hpo_doctor) as doctor,
            hpol_line,
            hpol_product_id,
            CASE
                WHEN mpei_ten_thuoc IS NULL
                THEN hpol_productname
                WHEN LENGTH(mpei_ham_luong) > 1
                THEN mpei_ten_thuoc || ' (' || mpei_ham_luong || ')'
                ELSE mpei_ten_thuoc
            END AS drug_name,
            hpol_productuom AS unit,
            COALESCE(hpol_usage, '') AS instruction,
            SUM(hpol_qtyorder) AS quantity,
            SUM(hpol_qtyorder * hpol_unitprice) AS amount,
            hpol_generic,
            COALESCE(hpol_content, '') as dosage
            FROM hms_pharmaorder
            LEFT JOIN hms_pharmaorderline_view ON (hpol_docno = hpo_docno AND hpol_orderid = hpo_orderid)
            LEFT JOIN m_product_item ON (mpi_product_item_id = hpol_product_item_id)
            LEFT JOIN m_product_extra_info ON (mpei_id = mpi_productextra_id)
            LEFT JOIN hms_pharmaorder_usage ON (hpou_orderid = hpol_orderid AND hpou_product_id = hpol_product_id)
            WHERE hpo_docno = $1
            AND hpo_ordertype = 'P'
            AND hpo_orderstatus IN('A', 'P')
            GROUP BY hpo_orderid, hpo_orderdate, hpo_doctor, hpol_orderid, hpou_qtyorder, hpol_line, hpol_product_id, hpol_productname, hpol_productuom, hpol_generic, hpol_usage, hpol_content, mpei_ham_luong, mpei_ten_thuoc
            ORDER BY hpol_orderid, hpol_line`, [recordId]);
      res.json(data);
    } catch (err: any) {
      res.json([]);
    }
  }
}
