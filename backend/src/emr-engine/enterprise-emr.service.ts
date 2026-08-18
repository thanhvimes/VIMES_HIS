import { pool } from '../config/database';

export class EnterpriseEmrService {
  /**
   * 1. Lấy danh mục 42 Mẫu Bệnh Án Chuyên Khoa Chuẩn Bộ Y Tế (QĐ 4069)
   */
  static async getSpecialtyCatalog() {
    const result = await pool.query(
      `SELECT 
        code,
        name,
        specialty_code AS "specialtyCode",
        form_number AS "formNumber",
        is_inpatient AS "isInpatient",
        custom_schema AS "customSchema"
       FROM emr_specialty_template_catalog
       WHERE is_active = TRUE
       ORDER BY form_number ASC, code ASC`
    );
    return result.rows;
  }

  /**
   * 2. Lấy danh sách lịch sử đo Chức năng sống & Sinh hiệu (Vital Signs)
   */
  static async getVitalSigns(docNo: string) {
    const result = await pool.query(
      `SELECT 
        id,
        doc_no AS "docNo",
        patient_id AS "patientId",
        recorded_at AS "recordedAt",
        pulse,
        temperature,
        blood_pressure_systolic AS "bloodPressureSystolic",
        blood_pressure_diastolic AS "bloodPressureDiastolic",
        respiratory_rate AS "respiratoryRate",
        spo2,
        weight_kg AS "weightKg",
        height_cm AS "heightCm",
        bmi,
        recorded_by AS "recordedBy",
        nurse_name AS "nurseName",
        notes
       FROM emr_vital_signs
       WHERE doc_no = $1
       ORDER BY recorded_at ASC`,
      [docNo]
    );
    return result.rows;
  }

  /**
   * 3. Ghi nhận đo Sinh hiệu mới (Điều dưỡng nhập liệu)
   */
  static async recordVitalSigns(dto: {
    docNo: string;
    patientId: string;
    pulse?: number;
    temperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    respiratoryRate?: number;
    spo2?: number;
    weightKg?: number;
    heightCm?: number;
    recordedBy: string;
    nurseName?: string;
    notes?: string;
  }) {
    const {
      docNo,
      patientId,
      pulse,
      temperature,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      respiratoryRate,
      spo2,
      weightKg,
      heightCm,
      recordedBy,
      nurseName = 'ĐIỀU DƯỠNG TRỰC',
      notes
    } = dto;

    let bmi: number | null = null;
    if (weightKg && heightCm && heightCm > 0) {
      const heightM = heightCm / 100;
      bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
    }

    const result = await pool.query(
      `INSERT INTO emr_vital_signs (
        doc_no, patient_id, recorded_at, pulse, temperature,
        blood_pressure_systolic, blood_pressure_diastolic, respiratory_rate,
        spo2, weight_kg, height_cm, bmi, recorded_by, nurse_name, notes
      ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        docNo,
        patientId,
        pulse || null,
        temperature || null,
        bloodPressureSystolic || null,
        bloodPressureDiastolic || null,
        respiratoryRate || null,
        spo2 || null,
        weightKg || null,
        heightCm || null,
        bmi,
        recordedBy,
        nurseName,
        notes || null
      ]
    );

    return result.rows[0];
  }

  /**
   * 4. Lấy & Cập nhật Tổng kết bệnh án khi ra viện
   */
  static async getClinicalSummary(docNo: string) {
    const result = await pool.query(
      `SELECT 
        id,
        doc_no AS "docNo",
        patient_id AS "patientId",
        treatment_result AS "treatmentResult",
        main_icd10 AS "mainIcd10",
        secondary_icd10 AS "secondaryIcd10",
        clinical_evolution AS "clinicalEvolution",
        key_paraclinical_results AS "keyParaclinicalResults",
        treatment_methods AS "treatmentMethods",
        discharge_condition AS "dischargeCondition",
        follow_up_instructions AS "followUpInstructions",
        doctor_signature_status AS "doctorSignatureStatus",
        department_head_approval AS "departmentHeadApproval",
        approved_by AS "approvedBy",
        approved_at AS "approvedAt",
        created_by AS "createdBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM emr_clinical_summary
       WHERE doc_no = $1`,
      [docNo]
    );
    return result.rows[0] || null;
  }

  static async saveClinicalSummary(dto: {
    docNo: string;
    patientId: string;
    treatmentResult: string;
    mainIcd10: string;
    secondaryIcd10?: string;
    clinicalEvolution: string;
    keyParaclinicalResults?: string;
    treatmentMethods: string;
    dischargeCondition: string;
    followUpInstructions?: string;
    createdBy: string;
  }) {
    const {
      docNo,
      patientId,
      treatmentResult = 'KHOI',
      mainIcd10,
      secondaryIcd10,
      clinicalEvolution,
      keyParaclinicalResults,
      treatmentMethods,
      dischargeCondition,
      followUpInstructions,
      createdBy
    } = dto;

    const result = await pool.query(
      `INSERT INTO emr_clinical_summary (
        doc_no, patient_id, treatment_result, main_icd10, secondary_icd10,
        clinical_evolution, key_paraclinical_results, treatment_methods,
        discharge_condition, follow_up_instructions, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      ON CONFLICT (doc_no) 
      DO UPDATE SET
        treatment_result = EXCLUDED.treatment_result,
        main_icd10 = EXCLUDED.main_icd10,
        secondary_icd10 = EXCLUDED.secondary_icd10,
        clinical_evolution = EXCLUDED.clinical_evolution,
        key_paraclinical_results = EXCLUDED.key_paraclinical_results,
        treatment_methods = EXCLUDED.treatment_methods,
        discharge_condition = EXCLUDED.discharge_condition,
        follow_up_instructions = EXCLUDED.follow_up_instructions,
        updated_at = NOW()
      RETURNING *`,
      [
        docNo,
        patientId,
        treatmentResult,
        mainIcd10,
        secondaryIcd10 || '',
        clinicalEvolution,
        keyParaclinicalResults || '',
        treatmentMethods,
        dischargeCondition,
        followUpInstructions || '',
        createdBy
      ]
    );

    return result.rows[0];
  }

  /**
   * 5. Quản lý Mượn Đọc & Trích Sao Bệnh Án Nghiên Cứu (EMR Lending)
   */
  static async listLendingRequests(docNo?: string) {
    let sql = `
      SELECT 
        id,
        bundle_id AS "bundleId",
        doc_no AS "docNo",
        patient_id AS "patientId",
        requester_id AS "requesterId",
        requester_name AS "requesterName",
        requester_organization AS "requesterOrganization",
        purpose,
        is_deidentified AS "isDeidentified",
        approved_by AS "approvedBy",
        approved_at AS "approvedAt",
        status,
        access_granted_from AS "accessGrantedFrom",
        access_granted_to AS "accessGrantedTo",
        export_token AS "exportToken",
        created_at AS "createdAt"
      FROM emr_record_lending_request
      WHERE 1=1
    `;
    const params: any[] = [];
    if (docNo) {
      sql += ` AND doc_no = $1`;
      params.push(docNo);
    }
    sql += ` ORDER BY created_at DESC`;
    const result = await pool.query(sql, params);
    return result.rows;
  }

  static async createLendingRequest(dto: {
    docNo: string;
    patientId: string;
    requesterId: string;
    requesterName: string;
    requesterOrganization: string;
    purpose: string;
    isDeidentified?: boolean;
  }) {
    const {
      docNo,
      patientId,
      requesterId,
      requesterName,
      requesterOrganization,
      purpose,
      isDeidentified = true
    } = dto;

    const result = await pool.query(
      `INSERT INTO emr_record_lending_request (
        doc_no, patient_id, requester_id, requester_name,
        requester_organization, purpose, is_deidentified, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'APPROVED', NOW())
      RETURNING *`,
      [
        docNo,
        patientId,
        requesterId,
        requesterName,
        requesterOrganization,
        purpose,
        isDeidentified
      ]
    );

    return result.rows[0];
  }
}
