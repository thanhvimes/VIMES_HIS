import { pool } from '../config/database';
import crypto from 'crypto';

export interface CreateDocumentDraftDto {
  docNo: string;
  patientId: string;
  patientName?: string;
  templateCode: string;
  templateVersionId?: number;
  formTypeCode?: string;
  documentName: string;
  documentGroup?: string;
  clinicalDate?: string;
  data: Record<string, any>;
  createdBy: string;
}

export interface BatchSignDto {
  documentIds: string[];
  signerId: string;
  signerName: string;
  signerRole: string;
  signatureMethod?: string;
  certificateSubject?: string;
  certificateSerial?: string;
  certificateIssuer?: string;
  clientIp?: string;
}

export interface PatientTabletSignDto {
  documentId: string;
  patientName: string;
  signerRole?: string;
  signatureImageBase64: string;
  clientIp?: string;
}

export interface AmendDocumentDto {
  originalDocumentId: string;
  newDataSnapshot: Record<string, any>;
  reason: string;
  actorId: string;
  actorName: string;
  clientIp?: string;
}

export class EmrDocumentService {
  /**
   * 1. Lấy danh sách các tờ tài liệu trong hồ sơ bệnh án
   */
  static async listPatientDocuments(params: {
    docNo?: string;
    patientId?: string;
    documentGroup?: string;
    status?: string;
    search?: string;
  }) {
    const { docNo, patientId, documentGroup, status, search } = params;
    let sql = `
      SELECT 
        d.id,
        d.doc_no AS "docNo",
        d.patient_id AS "patientId",
        d.patient_name AS "patientName",
        d.template_code AS "templateCode",
        d.template_version_id AS "templateVersionId",
        d.form_type_code AS "formTypeCode",
        d.document_name AS "documentName",
        d.document_group AS "documentGroup",
        d.clinical_date AS "clinicalDate",
        d.version_number AS "versionNumber",
        d.status,
        d.snapshot_data AS "snapshotData",
        d.raw_pdf_path AS "rawPdfPath",
        d.signed_pdf_path AS "signedPdfPath",
        d.pdf_sha256 AS "pdfSha256",
        d.page_count AS "pageCount",
        d.created_by AS "createdBy",
        d.created_at AS "createdAt",
        d.updated_at AS "updatedAt",
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'signerType', s.signer_type,
              'signerId', s.signer_id,
              'signerName', s.signer_name,
              'signerRole', s.signer_role,
              'signingOrder', s.signing_order,
              'signatureMethod', s.signature_method,
              'signatureImagePath', s.signature_image_path,
              'certificateSubject', s.certificate_subject,
              'certificateSerial', s.certificate_serial,
              'certificateIssuer', s.certificate_issuer,
              'tsaTimestamp', s.tsa_timestamp,
              'status', s.status,
              'signedAt', s.signed_at
            ) ORDER BY s.signing_order ASC
          ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
        ) AS signatures
      FROM emr_document_instance d
      LEFT JOIN emr_document_signature s ON d.id = s.document_instance_id AND s.status = 'SIGNED'
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let pIdx = 1;

    if (docNo) {
      sql += ` AND d.doc_no = $${pIdx}`;
      queryParams.push(docNo);
      pIdx++;
    }
    if (patientId) {
      sql += ` AND d.patient_id = $${pIdx}`;
      queryParams.push(patientId);
      pIdx++;
    }
    if (documentGroup && documentGroup !== 'ALL') {
      sql += ` AND d.document_group = $${pIdx}`;
      queryParams.push(documentGroup);
      pIdx++;
    }
    if (status && status !== 'ALL') {
      sql += ` AND d.status = $${pIdx}`;
      queryParams.push(status);
      pIdx++;
    }
    if (search && search.trim()) {
      sql += ` AND (
        d.document_name ILIKE $${pIdx} 
        OR d.patient_name ILIKE $${pIdx} 
        OR d.patient_id ILIKE $${pIdx} 
        OR d.doc_no ILIKE $${pIdx}
        OR d.template_code ILIKE $${pIdx}
      )`;
      queryParams.push(`%${search.trim()}%`);
      pIdx++;
    }

    sql += ` GROUP BY d.id ORDER BY d.clinical_date DESC, d.created_at DESC`;

    const result = await pool.query(sql, queryParams);
    return result.rows;
  }

  /**
   * 2. Lấy chi tiết 1 văn bản EMR theo ID
   */
  static async getDocumentById(id: string) {
    const docRes = await pool.query(
      `SELECT 
        d.id,
        d.doc_no AS "docNo",
        d.patient_id AS "patientId",
        d.patient_name AS "patientName",
        d.template_code AS "templateCode",
        d.template_version_id AS "templateVersionId",
        d.form_type_code AS "formTypeCode",
        d.document_name AS "documentName",
        d.document_group AS "documentGroup",
        d.clinical_date AS "clinicalDate",
        d.version_number AS "versionNumber",
        d.status,
        d.snapshot_data AS "snapshotData",
        d.raw_pdf_path AS "rawPdfPath",
        d.signed_pdf_path AS "signedPdfPath",
        d.pdf_sha256 AS "pdfSha256",
        d.page_count AS "pageCount",
        d.created_by AS "createdBy",
        d.created_at AS "createdAt",
        d.updated_at AS "updatedAt"
       FROM emr_document_instance d
       WHERE d.id = $1`,
      [id]
    );

    if (docRes.rows.length === 0) return null;
    const document = docRes.rows[0];

    // Get signatures
    const sigRes = await pool.query(
      `SELECT 
        id,
        signer_type AS "signerType",
        signer_id AS "signerId",
        signer_name AS "signerName",
        signer_role AS "signerRole",
        signing_order AS "signingOrder",
        signature_method AS "signatureMethod",
        signature_image_path AS "signatureImagePath",
        certificate_subject AS "certificateSubject",
        certificate_serial AS "certificateSerial",
        certificate_issuer AS "certificateIssuer",
        tsa_timestamp AS "tsaTimestamp",
        status,
        signed_at AS "signedAt",
        ip_address AS "ipAddress"
       FROM emr_document_signature
       WHERE document_instance_id = $1
       ORDER BY signing_order ASC`,
      [id]
    );
    document.signatures = sigRes.rows;

    // Get amendments history if any
    const amendRes = await pool.query(
      `SELECT 
        a.id,
        a.original_document_id AS "originalDocumentId",
        a.amended_document_id AS "amendedDocumentId",
        a.reason,
        a.approved_by AS "approvedBy",
        a.created_at AS "createdAt"
       FROM emr_document_amendment a
       WHERE a.original_document_id = $1 OR a.amended_document_id = $1
       ORDER BY a.created_at DESC`,
      [id]
    );
    document.amendments = amendRes.rows;

    return document;
  }

  /**
   * 3. Tạo mới hoặc cập nhật bản nháp văn bản lâm sàng
   */
  static async createOrUpdateDraft(dto: CreateDocumentDraftDto) {
    const {
      docNo,
      patientId,
      patientName,
      templateCode,
      templateVersionId,
      formTypeCode = 'CLINICAL_FORM',
      documentName,
      documentGroup = 'CLINICAL',
      clinicalDate = new Date().toISOString().slice(0, 10),
      createdBy
    } = dto;

    const docData = dto.data || (dto as any).documentData || {};

    const dummySha256 = crypto
      .createHash('sha256')
      .update(JSON.stringify(docData) + Date.now().toString())
      .digest('hex');

    const result = await pool.query(
      `INSERT INTO emr_document_instance (
        doc_no, patient_id, patient_name, template_code, template_version_id, form_type_code,
        document_name, document_group, clinical_date, version_number, status,
        snapshot_data, raw_pdf_path, pdf_sha256, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, 'READY_TO_SIGN', $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        docNo,
        patientId,
        patientName || 'BỆNH NHÂN',
        templateCode,
        templateVersionId || 1,
        formTypeCode,
        documentName,
        documentGroup,
        clinicalDate,
        JSON.stringify(docData),
        `/storage/emr/raw/${docNo}_${templateCode}_raw.pdf`,
        dummySha256,
        createdBy
      ]
    );

    return result.rows[0];
  }

  /**
   * Danh mục Mã Loại Biểu Mẫu EMR chuẩn BYT
   */
  static async getFormTypeCatalog() {
    const result = await pool.query(
      `SELECT 
        code,
        name,
        category_group AS "categoryGroup",
        byt_form_code AS "bytFormCode",
        is_signature_required AS "isSignatureRequired",
        default_signer_role AS "defaultSignerRole",
        is_patient_signature_required AS "isPatientSignatureRequired",
        sort_order AS "sortOrder"
       FROM emr_form_type_catalog
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, code ASC`
    );
    return result.rows;
  }

  /**
   * 4. Ký số hàng loạt (Batch Signing) cho Bác sĩ trong ca trực
   */
  static async batchSignDocuments(dto: BatchSignDto) {
    const {
      documentIds,
      signerId,
      signerName,
      signerRole,
      signatureMethod = 'SMART_CA',
      certificateSubject = `CN=${signerName}, O=Bệnh Viện Đa Khoa ViMES, C=VN`,
      certificateSerial = `VNPT-CA-${Date.now().toString().slice(-8)}`,
      certificateIssuer = 'VNPT SmartCA National Root',
      clientIp = '127.0.0.1'
    } = dto;

    if (!documentIds || documentIds.length === 0) {
      throw new Error('Danh sách tài liệu cần ký không được rỗng.');
    }

    const signedResults: any[] = [];
    const now = new Date();

    for (const docId of documentIds) {
      // 1. Update document instance status to SIGNED
      const signedPdfPath = `/storage/emr/signed/${docId}_signed.pdf`;
      const signedSha256 = crypto
        .createHash('sha256')
        .update(docId + signerId + now.toISOString())
        .digest('hex');

      await pool.query(
        `UPDATE emr_document_instance
         SET status = 'SIGNED',
             signed_pdf_path = $1,
             pdf_sha256 = $2,
             updated_at = $3
         WHERE id = $4`,
        [signedPdfPath, signedSha256, now, docId]
      );

      // 2. Insert digital signature record
      const sigRes = await pool.query(
        `INSERT INTO emr_document_signature (
          document_instance_id, signer_type, signer_id, signer_name, signer_role,
          signing_order, signature_method, certificate_subject, certificate_serial,
          certificate_issuer, tsa_timestamp, status, signed_at, ip_address, created_at
        ) VALUES ($1, 'DOCTOR', $2, $3, $4, 1, $5, $6, $7, $8, $9, 'SIGNED', $10, $11, NOW())
        RETURNING *`,
        [
          docId,
          signerId,
          signerName,
          signerRole,
          signatureMethod,
          certificateSubject,
          certificateSerial,
          certificateIssuer,
          now,
          now,
          clientIp
        ]
      );

      // 3. Log access audit
      await pool.query(
        `INSERT INTO emr_document_access_log (
          document_instance_id, actor_id, actor_name, actor_role, action, reason, ip_address, created_at
        ) VALUES ($1, $2, $3, $4, 'SIGN_DOCUMENT', 'Ký số điện tử y tế', $5, NOW())`,
        [docId, signerId, signerName, signerRole, clientIp]
      );

      signedResults.push({
        documentId: docId,
        status: 'SIGNED',
        signedAt: now,
        signatureId: sigRes.rows[0]?.id
      });
    }

    return {
      success: true,
      totalSigned: signedResults.length,
      signedResults
    };
  }

  /**
   * 5. Bệnh nhân / Người nhà ký tay trên Tablet (Biometric Touch Signature)
   */
  static async patientTabletSign(dto: PatientTabletSignDto) {
    const { documentId, patientName, signerRole = 'NGƯỜI BỆNH (KÝ CẢM ỨNG)', signatureImageBase64, clientIp = '127.0.0.1' } = dto;

    if (!documentId || !signatureImageBase64) {
      throw new Error('Thiếu thông tin văn bản hoặc nét ký cảm ứng.');
    }

    const now = new Date();
    const sigImagePath = `/storage/emr/signatures/patient_${documentId}_touch.png`;

    const sigRes = await pool.query(
      `INSERT INTO emr_document_signature (
        document_instance_id, signer_type, signer_id, signer_name, signer_role,
        signing_order, signature_method, signature_image_path, status, signed_at, ip_address, created_at
      ) VALUES ($1, 'PATIENT', NULL, $2, $3, 1, 'TABLET_TOUCH', $4, 'SIGNED', $5, $6, NOW())
      RETURNING *`,
      [documentId, patientName, signerRole, sigImagePath, now, clientIp]
    );

    // Update document status if still draft
    await pool.query(
      `UPDATE emr_document_instance
       SET status = 'PARTIALLY_SIGNED', updated_at = NOW()
       WHERE id = $1 AND status = 'READY_TO_SIGN'`,
      [documentId]
    );

    return {
      success: true,
      signature: sigRes.rows[0]
    };
  }

  /**
   * 6. Đính chính / Lập bản sửa đổi khi có sai sót (Addendum Workflow)
   */
  static async amendDocument(dto: AmendDocumentDto) {
    const { originalDocumentId, newDataSnapshot, reason, actorId, actorName, clientIp = '127.0.0.1' } = dto;

    if (!reason || !reason.trim()) {
      throw new Error('Bắt buộc phải nhập lý do đính chính văn bản y tế.');
    }

    // 1. Get original document
    const origRes = await pool.query(`SELECT * FROM emr_document_instance WHERE id = $1`, [originalDocumentId]);
    if (origRes.rows.length === 0) throw new Error('Không tìm thấy tài liệu gốc.');
    const orig = origRes.rows[0];

    // 2. Mark original document as AMENDED
    await pool.query(
      `UPDATE emr_document_instance SET status = 'AMENDED', updated_at = NOW() WHERE id = $1`,
      [originalDocumentId]
    );

    // 3. Create amended v2 document
    const newVersionNumber = (orig.version_number || 1) + 1;
    const newSha256 = crypto
      .createHash('sha256')
      .update(JSON.stringify(newDataSnapshot) + Date.now())
      .digest('hex');

    const newDocRes = await pool.query(
      `INSERT INTO emr_document_instance (
        doc_no, patient_id, patient_name, template_code, template_version_id,
        document_name, document_group, clinical_date, version_number, status,
        snapshot_data, raw_pdf_path, pdf_sha256, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'READY_TO_SIGN', $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        orig.doc_no,
        orig.patient_id,
        orig.patient_name,
        orig.template_code,
        orig.template_version_id,
        `${orig.document_name} (Đính chính v${newVersionNumber})`,
        orig.document_group,
        orig.clinical_date,
        newVersionNumber,
        JSON.stringify(newDataSnapshot),
        `/storage/emr/raw/${orig.doc_no}_${orig.template_code}_v${newVersionNumber}_raw.pdf`,
        newSha256,
        actorId
      ]
    );
    const newDoc = newDocRes.rows[0];

    // 4. Log to emr_document_amendment
    await pool.query(
      `INSERT INTO emr_document_amendment (
        original_document_id, amended_document_id, reason, approved_by, created_at
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [originalDocumentId, newDoc.id, reason.trim(), actorName]
    );

    // 5. Audit log
    await pool.query(
      `INSERT INTO emr_document_access_log (
        document_instance_id, actor_id, actor_name, actor_role, action, reason, ip_address, created_at
      ) VALUES ($1, $2, $3, 'DOCTOR', 'AMEND_DOCUMENT', $4, $5, NOW())`,
      [originalDocumentId, actorId, actorName, `Lập bản đính chính v${newVersionNumber}: ${reason}`, clientIp]
    );

    return {
      success: true,
      originalDocumentId,
      amendedDocument: newDoc
    };
  }

  /**
   * 7. Đóng Bệnh Án & Ghép Hồ Sơ Master khi Xuất Viện (Bates Numbering & WORM Lock)
   */
  static async closeAndBundleMedicalRecord(params: {
    docNo: string;
    patientId?: string;
    patientName?: string;
    bundleType?: string;
    closedBy: string;
    clientIp?: string;
  }) {
    let { docNo, patientId, patientName = 'BỆNH NHÂN', bundleType = 'NOI_TRU', closedBy, clientIp = '127.0.0.1' } = params;

    // 1. Get all signed documents for this encounter
    const docsRes = await pool.query(
      `SELECT id, patient_id, patient_name, document_name, page_count, clinical_date
       FROM emr_document_instance
       WHERE doc_no = $1 AND status IN ('SIGNED', 'AMENDED')
       ORDER BY clinical_date ASC, created_at ASC`,
      [docNo]
    );

    if (docsRes.rows.length === 0) {
      throw new Error('Chưa có văn bản đã ký số nào trong đợt điều trị này để đóng bệnh án.');
    }

    if (!patientId && docsRes.rows[0].patient_id) {
      patientId = docsRes.rows[0].patient_id;
      patientName = docsRes.rows[0].patient_name || patientName;
    }

    const docs = docsRes.rows;
    let runningPage = 1;

    // 2. Create bundle
    const masterSha256 = crypto.createHash('sha256').update(docNo + Date.now()).digest('hex');
    const bundleRes = await pool.query(
      `INSERT INTO emr_document_bundle (
        doc_no, patient_id, patient_name, bundle_type, total_pages, status,
        master_pdf_path, master_sha256, closed_by, closed_at, created_at
      ) VALUES ($1, $2, $3, $4, 0, 'CLOSED_LOCKED', $5, $6, $7, NOW(), NOW())
      ON CONFLICT (doc_no) 
      DO UPDATE SET status = 'CLOSED_LOCKED', closed_by = EXCLUDED.closed_by, closed_at = NOW()
      RETURNING *`,
      [
        docNo,
        patientId,
        patientName,
        bundleType,
        `/storage/emr/bundles/${docNo}_MASTER_EMR.pdf`,
        masterSha256,
        closedBy
      ]
    );
    const bundle = bundleRes.rows[0];

    // 3. Clear old items and insert fresh numbered items
    await pool.query(`DELETE FROM emr_document_bundle_item WHERE bundle_id = $1`, [bundle.id]);

    for (let idx = 0; idx < docs.length; idx++) {
      const doc = docs[idx];
      const pageCnt = doc.page_count || 1;
      const startP = runningPage;
      const endP = runningPage + pageCnt - 1;

      await pool.query(
        `INSERT INTO emr_document_bundle_item (
          bundle_id, document_instance_id, order_index, start_page, end_page, title_in_toc
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [bundle.id, doc.id, idx + 1, startP, endP, doc.document_name]
      );

      // Lock document
      await pool.query(`UPDATE emr_document_instance SET status = 'LOCKED' WHERE id = $1`, [doc.id]);

      runningPage = endP + 1;
    }

    // Update total pages
    const totalPages = runningPage - 1;
    await pool.query(`UPDATE emr_document_bundle SET total_pages = $1 WHERE id = $2`, [totalPages, bundle.id]);

    // Audit log
    await pool.query(
      `INSERT INTO emr_document_access_log (
        bundle_id, actor_id, actor_name, actor_role, action, reason, ip_address, created_at
      ) VALUES ($1, $2, $2, 'KHTH', 'CLOSE_MEDICAL_RECORD', 'Đóng hồ sơ bệnh án điện tử khóa WORM', $3, NOW())`,
      [bundle.id, closedBy, clientIp]
    );

    return {
      success: true,
      bundleId: bundle.id,
      docNo,
      totalPages,
      status: 'CLOSED_LOCKED',
      closedAt: new Date()
    };
  }

  /**
   * 8. Tra cứu công khai tính toàn vẹn (Quét mã QR)
   */
  static async verifyPublicDocument(documentId: string) {
    const doc = await this.getDocumentById(documentId);
    if (!doc) return null;

    return {
      id: doc.id,
      docNo: doc.docNo,
      patientName: doc.patientName,
      patientId: doc.patientId,
      documentName: doc.documentName,
      documentGroup: doc.documentGroup,
      clinicalDate: doc.clinicalDate,
      versionNumber: doc.versionNumber,
      status: doc.status,
      pdfSha256: doc.pdfSha256,
      signatures: (doc.signatures || []).map((s: any) => ({
        signerName: s.signerName,
        signerRole: s.signerRole,
        signatureMethod: s.signatureMethod,
        certificateIssuer: s.certificateIssuer,
        signedAt: s.signedAt,
        status: s.status
      })),
      isAuthentic: doc.status === 'SIGNED' || doc.status === 'LOCKED',
      verifiedAt: new Date().toISOString()
    };
  }
}
